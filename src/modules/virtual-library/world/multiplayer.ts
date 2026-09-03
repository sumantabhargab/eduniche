/**
 * MultiplayerManager — synchronizes player state via Supabase Realtime.
 *
 * Uses Supabase Realtime broadcast for position updates (lightweight,
 * no database writes per frame).
 * Uses presence channels for join/leave awareness and room membership.
 * Supports emoji reactions broadcast.
 */

"use client";

import { getChatSupabase } from "@/modules/chat/services/supabase";
import type { WorldPlayer, RoomId, EmojiReaction, SystemNotice } from "./types";

const BROADCAST_CHANNEL = "eduneuro:world:positions";
const UPDATE_INTERVAL = 100; // ms — broadcast 10x/sec
const CLEANUP_INTERVAL = 2000; // ms — check for stale players
const INTERPOLATION_FACTOR = 0.18; // lerp factor per frame toward network position
const EMOJI_TTL = 4000; // ms before emoji reaction expires
const NOTICE_TTL = 5000; // ms before system notice expires

type PositionUpdateHandler = (player: WorldPlayer) => void;
type PlayerLeaveHandler = (playerId: string) => void;
type PlayerJoinHandler = (player: WorldPlayer) => void;

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
  private joinHandlers: Set<PlayerJoinHandler> = new Set();
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

  /** Get all players (including local). */
  getAllPlayers(): WorldPlayer[] {
    return Array.from(this.players.values());
  }

  /** Get a specific player by ID. */
  getPlayer(id: string): WorldPlayer | undefined {
    return this.players.get(id);
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

  /** Subscribe to player join events. */
  onPlayerJoin(handler: PlayerJoinHandler): () => void {
    this.joinHandlers.add(handler);
    return () => this.joinHandlers.delete(handler);
  }

  /** Broadcast an emoji reaction. */
  broadcastEmoji(emoji: string): void {
    if (!this.connected || !this.localPlayer || !this.channel) return;
    try {
      this.channel.send({
        type: "broadcast",
        event: "emoji",
        payload: {
          id: `emoji-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          emoji,
          playerId: this.localPlayer.id,
          playerLabel: this.localPlayer.label,
          x: this.localPlayer.x,
          y: this.localPlayer.y,
          timestamp: Date.now(),
          ttl: EMOJI_TTL,
        } as EmojiReaction,
      });
    } catch {
      // ignore
    }
  }

  /** Connect to the multiplayer system. */
  connect(localPlayer: WorldPlayer): void {
    if (this.connected) {
      this.disconnect();
    }

    // Initialize display positions for smooth interpolation
    const player: WorldPlayer = {
      ...localPlayer,
      displayX: localPlayer.x,
      displayY: localPlayer.y,
    };

    this.localPlayer = { ...player };
    this.connected = true;
    this.players.set(player.id, player);

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

      // Listen for broadcast position messages from other players
      this.channel.on(
        "broadcast",
        { event: "position" },
        (payload: { player: WorldPlayer }) => {
          this.handleRemoteUpdate(payload.player);
        }
      );

      // Listen for emoji reactions
      this.channel.on(
        "broadcast",
        { event: "emoji" },
        (payload: { emoji: EmojiReaction }) => {
          // Emoji reactions are handled by the parent component via a separate mechanism
          // We store them so the renderer can pick them up
          if (payload.emoji && payload.emoji.playerId !== this.localPlayer?.id) {
            this.emitEmoji(payload.emoji);
          }
        }
      );

      // Listen for player join announcements
      this.channel.on(
        "broadcast",
        { event: "join" },
        (payload: { player: WorldPlayer }) => {
          if (payload.player.id === this.localPlayer?.id) return;
          this.players.set(payload.player.id, {
            ...payload.player,
            targetX: payload.player.x,
            targetY: payload.player.y,
            displayX: payload.player.x,
            displayY: payload.player.y,
            lastUpdate: Date.now(),
          });
          this.joinHandlers.forEach((h) => h(this.players.get(payload.player.id)!));
          this.positionHandlers.forEach((h) => h(this.players.get(payload.player.id)!));
        }
      );

      // Listen for player leave announcements
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
              if (presence.player_data) {
                const playerData = presence.player_data as WorldPlayer;
                const isNew = !this.players.has(key);
                this.players.set(key, {
                  ...playerData,
                  targetX: playerData.x,
                  targetY: playerData.y,
                  displayX: playerData.x,
                  displayY: playerData.y,
                  lastUpdate: Date.now(),
                });
                if (isNew && key !== this.localPlayer?.id) {
                  this.joinHandlers.forEach((h) => h(this.players.get(key)!));
                }
                this.positionHandlers.forEach((h) => h(this.players.get(key)!));
              }
            }
          }
        } catch {
          // ignore presence state errors
        }
      });

      // Track presence changes — detect join/leave
      this.channel.on("presence", { event: "join" }, () => {
        // Presence join is handled by the sync event above
      });

      this.channel.on("presence", { event: "leave" }, () => {
        // Presence leave is handled by cleanup
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
              // Announce join
              try {
                this.channel.send({
                  type: "broadcast",
                  event: "join",
                  payload: { player: this.localPlayer },
                });
              } catch {
                // ignore
              }
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

  /** Interpolate all remote player positions toward their targets. Call each frame. */
  interpolatePlayers(): void {
    for (const [id, player] of this.players) {
      if (player.isLocal) continue;
      const dx = player.x - player.displayX;
      const dy = player.y - player.displayY;
      if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
        this.players.set(id, {
          ...player,
          displayX: player.displayX + dx * INTERPOLATION_FACTOR,
          displayY: player.displayY + dy * INTERPOLATION_FACTOR,
        });
      } else if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
        // Snap when close enough
        this.players.set(id, {
          ...player,
          displayX: player.x,
          displayY: player.y,
        });
      }
    }
  }

  /** Emit an emoji reaction (for internal callback). */
  private emojiHandlers: Set<(emoji: EmojiReaction) => void> = new Set();

  onEmoji(handler: (emoji: EmojiReaction) => void): () => void {
    this.emojiHandlers.add(handler);
    return () => this.emojiHandlers.delete(handler);
  }

  private emitEmoji(emoji: EmojiReaction): void {
    this.emojiHandlers.forEach((h) => h(emoji));
  }

  /** Disconnect from multiplayer. */
  disconnect(): void {
    // Announce leave
    if (this.connected && this.localPlayer && this.channel) {
      try {
        this.channel.send({
          type: "broadcast",
          event: "leave",
          payload: { playerId: this.localPlayer.id },
        });
      } catch {
        // ignore
      }
    }

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
      // Update with interpolation targets — keep current display position
      this.players.set(player.id, {
        ...player,
        targetX: player.x,
        targetY: player.y,
        // Keep existing display position for smooth interpolation
        displayX: existing.displayX,
        displayY: existing.displayY,
        lastUpdate: Date.now(),
      });
    } else {
      // New player — set display = actual so they don't slide in from origin
      this.players.set(player.id, {
        ...player,
        displayX: player.x,
        displayY: player.y,
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
