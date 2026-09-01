/**
 * MultiplayerManager — synchronizes player state via Supabase Realtime.
 *
 * Uses Supabase Realtime broadcast for position updates (lightweight,
 * no database writes per frame).
 * Uses the study_room_presence table for room membership.
 */

"use client";

import { getChatSupabase } from "@/modules/chat/services/supabase";
import type { WorldPlayer, RoomId } from "./types";

const BROADCAST_CHANNEL = "eduneuro:world:positions";
const UPDATE_INTERVAL = 100; // ms — broadcast 10x/sec
const CLEANUP_INTERVAL = 2000; // ms — check for stale players

type PositionUpdateHandler = (player: WorldPlayer) => void;
type PlayerLeaveHandler = (playerId: string) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RealtimeChannel = any;

export class MultiplayerManager {
  private channel: RealtimeChannel | null = null;
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private localPlayer: WorldPlayer | null = null;
  private players: Map<string, WorldPlayer> = new Map();
  private positionHandlers: Set<PositionUpdateHandler> = new Set();
  private leaveHandlers: Set<PlayerLeaveHandler> = new Set();
  private connected = false;
  private lastBroadcast = 0;

  /** Whether the manager is currently connected. */
  get isConnected(): boolean {
    return this.connected;
  }

  /** Get all remote players. */
  getRemotePlayers(): WorldPlayer[] {
    return Array.from(this.players.values()).filter((p) => !p.isLocal);
  }

  /** Subscribe to position updates. */
  onPositionUpdate(handler: PositionUpdateHandler): () => void {
    this.positionHandlers.add(handler);
    return () => this.positionHandlers.delete(handler);
  }

  /** Subscribe to player leave events. */
  onPlayerLeave(handler: PlayerLeaveHandler): () => void {
    this.leaveHandlers.add(handler);
    return () => this.leaveHandlers.delete(handler);
  }

  /** Connect to the multiplayer system. */
  connect(localPlayer: WorldPlayer): void {
    if (this.connected) {
      this.disconnect();
    }

    this.localPlayer = { ...localPlayer };
    this.connected = true;
    this.players.set(localPlayer.id, localPlayer);

    const supabase = getChatSupabase();
    if (!supabase) {
      console.warn("[multiplayer] No Supabase client — running in local-only mode.");
      return;
    }

    // Verify we have an authenticated session before creating realtime channels
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        console.warn("[multiplayer] No authenticated user — running in local-only mode.");
        return;
      }
      this.initChannel(supabase);
    }).catch(() => {
      console.warn("[multiplayer] Auth check failed — running in local-only mode.");
    });
  }

  private initChannel(supabase: any): void {
    if (!this.localPlayer || !this.connected) return;

    try {
      this.channel = supabase.channel(BROADCAST_CHANNEL, {
        config: { broadcast: { self: false } },
      });

      // Listen for broadcast messages from other players
      this.channel.on(
        "broadcast",
        { event: "position" },
        (payload: { player: WorldPlayer }) => {
          this.handleRemoteUpdate(payload.player);
        }
      );

      this.channel.on(
        "broadcast",
        { event: "leave" },
        (payload: { playerId: string }) => {
          const { playerId } = payload;
          this.players.delete(playerId);
          this.leaveHandlers.forEach((h) => h(playerId));
        }
      );

      // Also listen for presence sync for room membership
      this.channel.on("presence", { event: "sync" }, () => {
        if (!this.channel) return;
        try {
          const state = this.channel.presenceState();
          for (const [key, presences] of Object.entries(state)) {
            const presenceList = Array.isArray(presences) ? presences : [presences];
            for (const p of presenceList) {
              const presence = p as Record<string, unknown>;
              if (presence.player_data && !this.players.has(key)) {
                const playerData = presence.player_data as WorldPlayer;
                this.players.set(key, playerData);
                this.positionHandlers.forEach((h) => h(playerData));
              }
            }
          }
        } catch {
          // ignore presence state errors
        }
      });

      this.channel.subscribe((status: string) => {
        if (status === "SUBSCED" || status === "SUBSCRIBED") {
          // Track our presence
          if (this.localPlayer) {
            try {
              this.channel.track({
                user_id: this.localPlayer.id,
                player_data: this.localPlayer,
              });
            } catch {
              // ignore track errors
            }
          }
        }
      });

      // Start broadcast interval
      this.updateInterval = setInterval(() => {
        this.broadcastPosition();
      }, UPDATE_INTERVAL);

      // Start cleanup interval
      this.cleanupInterval = setInterval(() => {
        this.cleanupStalePlayers();
      }, CLEANUP_INTERVAL);
    } catch (err) {
      console.warn("[multiplayer] Failed to initialize channel:", err);
    }
  }

  /** Disconnect from multiplayer. */
  disconnect(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    if (this.channel) {
      try {
        this.channel.unsubscribe();
      } catch {
        // ignore
      }
      this.channel = null;
    }
    this.players.clear();
    this.connected = false;
    this.localPlayer = null;
  }

  /** Broadcast current local player position. */
  broadcastPosition(): void {
    if (!this.connected || !this.localPlayer || !this.channel) return;

    const now = Date.now();
    if (now - this.lastBroadcast < UPDATE_INTERVAL * 0.5) return;

    this.lastBroadcast = now;

    try {
      this.channel.send({
        type: "broadcast",
        event: "position",
        payload: { player: this.localPlayer },
      });
    } catch {
      // Channel might not be ready
    }
  }

  /** Update the local player's state (called from the game loop). */
  updateLocalPlayer(updates: Partial<WorldPlayer>): void {
    if (!this.localPlayer) return;
    this.localPlayer = { ...this.localPlayer, ...updates };
    this.players.set(this.localPlayer.id, this.localPlayer);
  }

  /** Handle a remote player position update. */
  private handleRemoteUpdate(player: WorldPlayer): void {
    if (player.id === this.localPlayer?.id) return;

    const existing = this.players.get(player.id);
    if (existing) {
      // Update with interpolation targets
      this.players.set(player.id, {
        ...player,
        targetX: player.x,
        targetY: player.y,
        lastUpdate: Date.now(),
      });
    } else {
      // New player
      this.players.set(player.id, {
        ...player,
        targetX: player.x,
        targetY: player.y,
        lastUpdate: Date.now(),
      });
    }

    this.positionHandlers.forEach((h) => h(this.players.get(player.id)!));
  }

  /** Remove players that haven't updated in a while. */
  private cleanupStalePlayers(): void {
    const now = Date.now();
    const timeout = 10000; // 10 seconds

    for (const [id, player] of this.players) {
      if (player.isLocal) continue;
      if (now - player.lastUpdate > timeout) {
        this.players.delete(id);
        this.leaveHandlers.forEach((h) => h(id));
      }
    }
  }
}

/** Singleton instance. */
export const multiplayerManager = new MultiplayerManager();
