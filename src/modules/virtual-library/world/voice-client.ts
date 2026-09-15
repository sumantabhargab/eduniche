/**
 * VoiceClient — WebRTC peer-to-peer voice for the Virtual Library.
 *
 * One RTCPeerConnection per nearby player; Supabase Realtime broadcast
 * carries SDP/ICE signaling. Remote audio flows through a GainNode so the
 * game loop can apply distance-based attenuation.
 *
 * Gracefully degrades on every failure path — nothing throws to the caller.
 */

"use client";

import { getChatSupabase } from "@/modules/chat/services/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ─── Signaling events ─────────────────────────────────────────────────────────

const EVT = { OFFER: "voice-offer", ANSWER: "voice-answer", ICE: "ice-candidate", MUTE: "voice-mute" } as const;

// ─── STUN ─────────────────────────────────────────────────────────────────────

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

// ─── Gain ─────────────────────────────────────────────────────────────────────

function calculateGain(distance: number, maxRange: number): number {
  const t = Math.min(distance / maxRange, 1);
  return Math.max(0.05, 1 - t * t);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VoiceClientOptions {
  localUserId: string;
  localUserLabel: string;
  broadcastChannel: RealtimeChannel;
  maxRange?: number;
}

export interface VoiceClient {
  start(): Promise<void>;
  stop(): void;
  toggleMute(): boolean;
  setMuted(muted: boolean): void;
  getMuted(): boolean;
  updateNearbyPlayers(nearbyIds: string[]): void;
  updatePeerPosition(peerId: string, x: number, y: number, lx: number, ly: number): void;
  getLocalStream(): MediaStream | null;
  isPermissionGranted(): boolean;
  destroy(): void;
}

export type VoiceClientEvent =
  | { type: "peer-connected"; peerId: string }
  | { type: "peer-disconnected"; peerId: string }
  | { type: "permission-denied" }
  | { type: "permission-granted" };

// ─── Peer state ───────────────────────────────────────────────────────────────

interface PeerState {
  pc: RTCPeerConnection;
  gain: GainNode | null;
}

// ─── Implementation ───────────────────────────────────────────────────────────

export class VoiceClientImpl implements VoiceClient {
  readonly localUserId: string;
  readonly localUserLabel: string;
  readonly maxRange: number;

  private channel: RealtimeChannel;
  private localStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;

  private muted = false;
  private permissionGranted = false;
  private active = false;
  private destroyed = false;

  private peers = new Map<string, PeerState>();
  private nearby = new Set<string>();
  private graceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private listeners = new Set<(e: VoiceClientEvent) => void>();

  // Signaling handler refs (bound so .on() / .off() can reference them)
  private readonly onOffer = this.handleOffer.bind(this);
  private readonly onAnswer = this.handleAnswer.bind(this);
  private readonly onIce = this.handleIce.bind(this);

  constructor(opts: VoiceClientOptions) {
    this.localUserId = opts.localUserId;
    this.localUserLabel = opts.localUserLabel;
    this.channel = opts.broadcastChannel;
    this.maxRange = opts.maxRange ?? 200;
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  async start(): Promise<void> {
    if (this.active || this.destroyed) return;
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      this.permissionGranted = true;
      this.emit({ type: "permission-granted" });
    } catch (err) {
      this.permissionGranted = false;
      this.emit({ type: "permission-denied" });
      console.warn("[voice] Mic denied:", (err as Error).message);
      return;
    }
    try { this.audioCtx = new AudioContext(); } catch { /* no output */ }
    this.active = true;
    this.registerSignaling();
  }

  stop(): void {
    if (!this.active) return;
    this.muted = false;
    this.permissionGranted = false;
    for (const id of this.peers.keys()) this.dropPeer(id);
    this.peers.clear();
    this.nearby.clear();
    if (this.localStream) { this.localStream.getTracks().forEach((t) => t.stop()); this.localStream = null; }
    if (this.audioCtx?.state !== "closed") { void this.audioCtx?.close(); this.audioCtx = null; }
    this.active = false;
  }

  destroy(): void {
    this.destroyed = true;
    for (const t of this.graceTimers.values()) clearTimeout(t);
    this.graceTimers.clear();
    try { this.channel.unsubscribe(); } catch { /* ignore */ }
    this.listeners.clear();
    this.stop();
  }

  // ── Mute ────────────────────────────────────────────────────────────────────

  toggleMute(): boolean {
    this.muted = !this.muted;
    this.applyMute();
    this.send(EVT.MUTE, { userId: this.localUserId, muted: this.muted });
    return this.muted;
  }

  setMuted(m: boolean): void { this.muted = m; this.applyMute(); }
  getMuted(): boolean { return this.muted; }

  private applyMute(): void {
    if (!this.localStream) return;
    this.localStream.getAudioTracks().forEach((t) => { t.enabled = !this.muted; });
  }

  // ── Nearby players ──────────────────────────────────────────────────────────

  updateNearbyPlayers(ids: string[]): void {
    if (this.destroyed) return;
    const next = new Set(ids);

    // Players who left — start 3-second grace timer
    for (const id of this.nearby) {
      if (!next.has(id) && !this.graceTimers.has(id)) {
        const timer = setTimeout(() => {
          this.graceTimers.delete(id);
          if (!this.nearby.has(id)) this.dropPeer(id);
        }, 3000);
        this.graceTimers.set(id, timer);
      }
    }

    // Cancel grace for returning players; open peers for new ones
    for (const id of next) {
      if (this.graceTimers.has(id)) {
        clearTimeout(this.graceTimers.get(id)!);
        this.graceTimers.delete(id);
      }
      if (id !== this.localUserId && !this.peers.has(id) && !this.graceTimers.has(id)) {
        this.openPeer(id);
      }
    }

    this.nearby = next;
  }

  updatePeerPosition(peerId: string, px: number, py: number, lx: number, ly: number): void {
    const peer = this.peers.get(peerId);
    if (peer?.gain) peer.gain.gain.value = calculateGain(Math.hypot(px - lx, py - ly), this.maxRange);
  }

  // ── Accessors ───────────────────────────────────────────────────────────────

  getLocalStream(): MediaStream | null { return this.localStream; }
  isPermissionGranted(): boolean { return this.permissionGranted; }

  // ── Events ──────────────────────────────────────────────────────────────────

  onEvent(fn: (e: VoiceClientEvent) => void): () => void {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }

  private emit(e: VoiceClientEvent): void {
    for (const fn of this.listeners) { try { fn(e); } catch { /* ignore */ } }
  }

  // ── Signaling ───────────────────────────────────────────────────────────────

  private registerSignaling(): void {
    try {
      this.channel.on("broadcast", { event: EVT.OFFER }, this.onOffer);
      this.channel.on("broadcast", { event: EVT.ANSWER }, this.onAnswer);
      this.channel.on("broadcast", { event: EVT.ICE }, this.onIce);
    } catch { /* channel may not support .on() */ }
  }

  private send(event: string, payload: Record<string, unknown>): void {
    if (!this.channel || !this.active) return;
    try { this.channel.send({ type: "broadcast", event, payload }); } catch { /* ignore */ }
  }

  private async handleOffer(payload: unknown): Promise<void> {
    if (this.destroyed) return;
    try {
      const { fromUserId, sdp } = payload as { fromUserId: string; sdp: RTCSessionDescriptionInit };
      if (fromUserId === this.localUserId) return;
      const peer = this.ensurePeer(fromUserId);
      await peer.pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await peer.pc.createAnswer();
      await peer.pc.setLocalDescription(answer);
      this.send(EVT.ANSWER, { fromUserId: this.localUserId, sdp: answer });
    } catch (err) {
      console.warn("[voice] Offer error:", err);
    }
  }

  private async handleAnswer(payload: unknown): Promise<void> {
    if (this.destroyed) return;
    try {
      const { fromUserId, sdp } = payload as { fromUserId: string; sdp: RTCSessionDescriptionInit };
      if (fromUserId === this.localUserId) return;
      const peer = this.peers.get(fromUserId);
      if (peer) await peer.pc.setRemoteDescription(new RTCSessionDescription(sdp));
    } catch (err) {
      console.warn("[voice] Answer error:", err);
    }
  }

  private async handleIce(payload: unknown): Promise<void> {
    if (this.destroyed) return;
    try {
      const { fromUserId, candidate } = payload as { fromUserId: string; candidate: RTCIceCandidateInit };
      if (fromUserId === this.localUserId) return;
      const peer = this.peers.get(fromUserId);
      if (peer && candidate) await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch { /* transient — safe to ignore */ }
  }

  // ── Peer connections ────────────────────────────────────────────────────────

  private openPeer(peerId: string): void {
    if (this.destroyed) return;
    try {
      const pc = new RTCPeerConnection(RTC_CONFIG);

      if (this.localStream) {
        this.localStream.getAudioTracks().forEach((t) => pc.addTrack(t, this.localStream!));
      }

      pc.ontrack = (ev) => {
        if (this.destroyed) return;
        const stream = ev.streams[0] ?? new MediaStream([ev.track]);
        const peer = this.peers.get(peerId);
        if (!peer) return;
        peer.gain = this.wireOutput(stream);
      };

      pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          this.send(EVT.ICE, { fromUserId: this.localUserId, candidate: ev.candidate.toJSON() });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") this.emit({ type: "peer-connected", peerId });
        else if (pc.connectionState === "failed" || pc.connectionState === "closed") this.dropPeer(peerId);
      };

      this.peers.set(peerId, { pc, gain: null });

      // Create and broadcast an offer
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          const sdp = pc.localDescription;
          if (sdp) this.send(EVT.OFFER, { fromUserId: this.localUserId, sdp });
        })
        .catch((err) => { console.warn(`[voice] offer failed for ${peerId}:`, err); this.dropPeer(peerId); });
    } catch (err) {
      console.warn(`[voice] openPeer ${peerId}:`, err);
    }
  }

  /** Get or create a peer without sending an offer (used for inbound offers). */
  private ensurePeer(peerId: string): PeerState {
    let peer = this.peers.get(peerId);
    if (!peer) {
      const pc = new RTCPeerConnection(RTC_CONFIG);

      if (this.localStream) {
        this.localStream.getAudioTracks().forEach((t) => pc.addTrack(t, this.localStream!));
      }

      pc.ontrack = (ev) => {
        if (this.destroyed) return;
        const stream = ev.streams[0] ?? new MediaStream([ev.track]);
        const p = this.peers.get(peerId);
        if (p) p.gain = this.wireOutput(stream);
      };

      pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          this.send(EVT.ICE, { fromUserId: this.localUserId, candidate: ev.candidate.toJSON() });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "connected") this.emit({ type: "peer-connected", peerId });
        else if (pc.connectionState === "failed" || pc.connectionState === "closed") this.dropPeer(peerId);
      };

      peer = { pc, gain: null };
      this.peers.set(peerId, peer);
    }
    return peer;
  }

  /** Route a remote MediaStream through a GainNode → destination. */
  private wireOutput(stream: MediaStream): GainNode | null {
    if (!this.audioCtx) return null;
    try {
      const source = this.audioCtx.createMediaStreamSource(stream);
      const gain = this.audioCtx.createGain();
      source.connect(gain);
      gain.connect(this.audioCtx.destination);
      gain.gain.value = 1;
      return gain;
    } catch (err) {
      console.warn("[voice] wireOutput:", err);
      return null;
    }
  }

  /** Fully tear down a peer. */
  private dropPeer(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (!peer) return;
    try { peer.pc.close(); } catch { /* ignore */ }
    this.peers.delete(peerId);
    this.emit({ type: "peer-disconnected", peerId });
  }
}
