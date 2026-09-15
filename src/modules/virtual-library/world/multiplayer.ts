/**
 * MultiplayerManager — synchronizes player state across tabs and devices.
 *
 * Uses two transport layers:
 *   1. BroadcastChannel API — instant same-device tab sync (no internet needed)
 *   2. Supabase Realtime broadcast — cross-device sync over the internet
 *
 * BroadcastChannel is the primary sync for same-browser testing;
 * Supabase Realtime handles real remote users across India.
 */

"use client";

import { getChatSupabase } from "@/modules/chat/services/supabase";
import type { WorldPlayer, RoomId, EmojiReaction, SystemNotice } from "./types";

// ─── BroadcastChannel (same-device, no-internet) ────────────────────────────
const BC_CHANNEL = "padhaishuru:world:sync";

// ─── Supabase Realtime (cross-device, internet) ─────────────────────────────
const REALTIME_CHANNEL = "padhaishuru:world:positions";

const UPDATE_INTERVAL = 100; // ms — broadcast 10x/sec
const CLEANUP_INTERVAL = 2000; // ms — check for stale players
const INTERPOLATION_FACTOR = 0.18; // lerp factor per frame
const EMOJI_TTL = 4000; // ms
const NOTICE_TTL = 5000; // ms
const STALE_TIMEOUT = 10000; // ms before a remote player is removed

type PositionUpdateHandler = (player: WorldPlayer) => void;
type PlayerLeaveHandler = (playerId: string) => void;
type PlayerJoinHandler = (player: WorldPlayer) => void;
type ConnectedHandler = () => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RealtimeChannel = any;

export class MultiplayerManager {
  // ─── State ─────────────────────────────────────────────────────────────
  private bc: BroadcastChannel | null = null;
  private supabaseChannel: RealtimeChannel | null = null;
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private localPlayer: WorldPlayer | null = null;
  private players: Map<string, WorldPlayer> = new Map();
  private positionHandlers: Set<PositionUpdateHandler> = new Set();
  private leaveHandlers: Set<PlayerLeaveHandler> = new Set();
  private joinHandlers: Set<PlayerJoinHandler> = new Set();
  private connectedHandlers: Set<ConnectedHandler> = new Set();
  private emojiHandlers: Set<(emoji: EmojiReaction) => void> = new Set();
  private connected = false;
  private lastBroadcast = 0;
  private bcReady = false;
  private supabaseReady = false;

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

  // ─── Event Registration ───────────────────────────────────────────────
  onPositionUpdate(handler: PositionUpdateHandler): () => void {
    this.positionHandlers.add(handler);
    return () => this.positionHandlers.delete(handler);
  }

  onPlayerLeave(handler: PlayerLeaveHandler): () => void {
    this.leaveHandlers.add(handler);
    return () => this.leaveHandlers.delete(handler);
  }

  onPlayerJoin(handler: PlayerJoinHandler): () => void {
    this.joinHandlers.add(handler);
    return () => this.joinHandlers.delete(handler);
  }

  onConnected(handler: ConnectedHandler): () => void {
    this.connectedHandlers.add(handler);
    return () => this.connectedHandlers.delete(handler);
  }

  onEmoji(handler: (emoji: EmojiReaction) => void): () => void {
    this.emojiHandlers.add(handler);
    return () => this.emojiHandlers.delete(handler);
  }

  // ─── Connect / Disconnect ─────────────────────────────────────────────
  connect(localPlayer: WorldPlayer): void {
    if (this.connected) {
      this.disconnect();
    }

    const player: WorldPlayer = {
      ...localPlayer,
      displayX: localPlayer.x,
      displayY: localPlayer.y,
    };

    this.localPlayer = { ...player };
    this.connected = true;
    this.players.set(player.id, player);

    // Transport 1: BroadcastChannel (same-device, instant)
    this.initBroadcastChannel();

    // Transport 2: Supabase Realtime (cross-device, internet)
    this.initSupabase();

    // Start broadcast interval
    this.updateInterval = setInterval(() => {
      this.broadcastPosition();
    }, UPDATE_INTERVAL);

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupStalePlayers();
    }, CLEANUP_INTERVAL);
  }

  disconnect(): void {
    this.connected = false;
    this.bcReady = false;
    this.supabaseReady = false;

    // Announce leave on both transports
    this.broadcastLeave();

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    if (this.bc) {
      try { this.bc.close(); } catch { /* ignore */ }
      this.bc = null;
    }
    if (this.supabaseChannel) {
      try { this.supabaseChannel.unsubscribe(); } catch { /* ignore */ }
      this.supabaseChannel = null;
    }

    this.players.clear();
    this.localPlayer = null;
  }

  // ─── BroadcastChannel (Same-Device) ────────────────────────────────────
  private initBroadcastChannel(): void {
    try {
      this.bc = new BroadcastChannel(BC_CHANNEL);

      this.bc.onmessage = (event: MessageEvent) => {
        const msg = event.data;
        if (!msg || !msg.type) return;

        switch (msg.type) {
          case "position":
            this.handleRemoteUpdate(msg.player);
            break;
          case "join":
            if (msg.player?.id && msg.player.id !== this.localPlayer?.id) {
              this.players.set(msg.player.id, {
                ...msg.player,
                targetX: msg.player.x,
                targetY: msg.player.y,
                displayX: msg.player.x,
                displayY: msg.player.y,
                lastUpdate: Date.now(),
              });
              const added = this.players.get(msg.player.id);
              if (added) {
                this.joinHandlers.forEach((h) => h(added));
                this.positionHandlers.forEach((h) => h(added));
              }
            }
            break;
          case "leave":
            if (msg.playerId && msg.playerId !== this.localPlayer?.id) {
              this.players.delete(msg.playerId);
              this.leaveHandlers.forEach((h) => h(msg.playerId));
            }
            break;
          case "emoji":
            if (msg.emoji && msg.emoji.playerId !== this.localPlayer?.id) {
              this.emojiHandlers.forEach((h) => h(msg.emoji));
            }
            break;
        }
      };

      this.bcReady = true;
      console.log("[multiplayer] BroadcastChannel connected");

      // Announce ourselves to other tabs
      this.broadcastJoin();
    } catch (err) {
      console.warn("[multiplayer] BroadcastChannel not available:", err);
      this.bcReady = false;
    }

    this.checkAllConnected();
  }

  // ─── Supabase Realtime (Cross-Device) ──────────────────────────────────
  private initSupabase(): void {
    const supabase = getChatSupabase();
    if (!supabase) {
      console.warn("[multiplayer] No Supabase client — using BroadcastChannel only.");
      this.supabaseReady = false;
      this.checkAllConnected();
      return;
    }

    try {
      this.supabaseChannel = supabase.channel(REALTIME_CHANNEL, {
        config: { broadcast: { self: false } },
      });

      this.supabaseChannel.on(
        "broadcast",
        { event: "position" },
        (payload: { player: WorldPlayer }) => {
          this.handleRemoteUpdate(payload.player);
        }
      );

      this.supabaseChannel.on(
        "broadcast",
        { event: "join" },
        (payload: { player: WorldPlayer }) => {
          if (payload.player?.id === this.localPlayer?.id) return;
          this.players.set(payload.player.id, {
            ...payload.player,
            targetX: payload.player.x,
            targetY: payload.player.y,
            displayX: payload.player.x,
            displayY: payload.player.y,
            lastUpdate: Date.now(),
          });
          const added = this.players.get(payload.player.id);
          if (added) {
            this.joinHandlers.forEach((h) => h(added));
            this.positionHandlers.forEach((h) => h(added));
          }
        }
      );

      this.supabaseChannel.on(
        "broadcast",
        { event: "leave" },
        (payload: { playerId: string }) => {
          if (payload.playerId === this.localPlayer?.id) return;
          this.players.delete(payload.playerId);
          this.leaveHandlers.forEach((h) => h(payload.playerId));
        }
      );

      this.supabaseChannel.on(
        "broadcast",
        { event: "emoji" },
        (payload: { emoji: EmojiReaction }) => {
          if (payload.emoji?.playerId !== this.localPlayer?.id) {
            this.emojiHandlers.forEach((h) => h(payload.emoji));
          }
        }
      );

      this.supabaseChannel.subscribe((status: string) => {
        if (status === "SUBSCRIBED" || status === "SUBSCED") {
          this.supabaseReady = true;

          // Track presence and announce join
          if (this.localPlayer) {
            try {
              this.supabaseChannel.track({
                user_id: this.localPlayer.id,
                player_data: this.localPlayer,
              });
            } catch {
              // ignore track errors
            }
          }

          this.checkAllConnected();
        }
      });
    } catch (err) {
      console.warn("[multiplayer] Supabase init failed:", err);
      this.supabaseReady = false;
      this.checkAllConnected();
    }
  }

  /** Mark connected when both transports (or at least one) is ready. */
  private checkAllConnected(): void {
    // Connected if either transport is ready (BroadcastChannel alone is enough)
    if (this.bcReady || this.supabaseReady) {
      this.connected = true;
      this.connectedHandlers.forEach((h) => h());
    }
  }

  // ─── Broadcasting ──────────────────────────────────────────────────────
  private broadcastPosition(): void {
    if (!this.connected || !this.localPlayer) return;

    const now = Date.now();
    if (now - this.lastBroadcast < UPDATE_INTERVAL * 0.5) return;
    this.lastBroadcast = now;

    const msg = {
      type: "position",
      player: { ...this.localPlayer, isLocal: false },
    };

    // BroadcastChannel (same-device)
    if (this.bcReady && this.bc) {
      try { this.bc.postMessage(msg); } catch { /* ignore */ }
    }

    // Supabase Realtime (cross-device)
    if (this.supabaseReady && this.supabaseChannel) {
      try {
        this.supabaseChannel.send({
          type: "broadcast",
          event: "position",
          payload: msg,
        });
      } catch {
        // ignore
      }
    }
  }

  private broadcastJoin(): void {
    if (!this.localPlayer) return;

    const msg = {
      type: "join",
      player: { ...this.localPlayer, isLocal: false },
    };

    if (this.bcReady && this.bc) {
      try { this.bc.postMessage(msg); } catch { /* ignore */ }
    }

    if (this.supabaseReady && this.supabaseChannel) {
      try {
        this.supabaseChannel.send({
          type: "broadcast",
          event: "join",
          payload: msg,
        });
      } catch {
        // ignore
      }
    }
  }

  private broadcastLeave(): void {
    if (!this.localPlayer) return;

    const msg = { type: "leave", playerId: this.localPlayer.id };

    if (this.bcReady && this.bc) {
      try { this.bc.postMessage(msg); } catch { /* ignore */ }
    }

    if (this.supabaseReady && this.supabaseChannel) {
      try {
        this.supabaseChannel.send({
          type: "broadcast",
          event: "leave",
          payload: msg,
        });
      } catch {
        // ignore
      }
    }
  }

  /** Emit an emoji reaction. */
  broadcastEmoji(emoji: string): void {
    if (!this.localPlayer) return;

    const reaction: EmojiReaction = {
      id: `emoji-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      emoji,
      playerId: this.localPlayer.id,
      playerLabel: this.localPlayer.label,
      x: this.localPlayer.x,
      y: this.localPlayer.y,
      timestamp: Date.now(),
      ttl: EMOJI_TTL,
    };

    const msg = { type: "emoji", emoji: reaction };

    if (this.bcReady && this.bc) {
      try { this.bc.postMessage(msg); } catch { /* ignore */ }
    }

    if (this.supabaseReady && this.supabaseChannel) {
      try {
        this.supabaseChannel.send({
          type: "broadcast",
          event: "emoji",
          payload: msg,
        });
      } catch {
        // ignore
      }
    }
  }

  /** Update the local player's state. */
  updateLocalPlayer(updates: Partial<WorldPlayer>): void {
    if (!this.localPlayer) return;
    this.localPlayer = { ...this.localPlayer, ...updates };
    this.players.set(this.localPlayer.id, this.localPlayer);
  }

  // ─── Remote Player Handling ────────────────────────────────────────────
  private handleRemoteUpdate(player: WorldPlayer): void {
    if (!player?.id) return;
    if (player.id === this.localPlayer?.id) return;

    const existing = this.players.get(player.id);
    if (existing) {
      this.players.set(player.id, {
        ...player,
        targetX: player.x,
        targetY: player.y,
        displayX: existing.displayX,
        displayY: existing.displayY,
        lastUpdate: Date.now(),
      });
    } else {
      this.players.set(player.id, {
        ...player,
        displayX: player.x,
        displayY: player.y,
        lastUpdate: Date.now(),
      });
    }

    this.positionHandlers.forEach((h) => h(this.players.get(player.id)!));
  }

  /** Remove players that haven't updated recently. */
  private cleanupStalePlayers(): void {
    const now = Date.now();

    for (const [id, player] of this.players) {
      if (player.isLocal) continue;
      if (now - player.lastUpdate > STALE_TIMEOUT) {
        this.players.delete(id);
        this.leaveHandlers.forEach((h) => h(id));
      }
    }
  }

  /** Interpolate all remote players toward their targets. Call each frame. */
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
        this.players.set(id, {
          ...player,
          displayX: player.x,
          displayY: player.y,
        });
      }
    }
  }

  /** Emit an emoji reaction (for internal callback). */
  private emitEmoji(emoji: EmojiReaction): void {
    this.emojiHandlers.forEach((h) => h(emoji));
  }
}

/** Singleton instance used across the app. */
export const multiplayerManager = new MultiplayerManager();
