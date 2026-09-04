/**
 * ProximityVoice — manages microphone state and proximity-based voice.
 *
 * When the user enables their mic, audio is captured.
 * We track nearby players (within proximity range) for room-based communication.
 * Actual WebRTC transport can be added via LiveKit when a backend is available.
 */

"use client";

import { useRef, useCallback, useEffect, useState, useMemo } from "react";
import type { WorldPlayer } from "./types";

const PROXIMITY_RANGE = 200;
const ROOM_VOICE_RANGE = 600;

const VOICE_ENABLED_ROOMS = new Set(["discussion-room", "group-study"]);

export interface VoiceState {
  isMicOn: boolean;
  isStreaming: boolean;
  error: string | null;
  nearbyPlayers: WorldPlayer[];
  roomVoiceEnabled: boolean;
  proximityRange: number;
}

export function useProximityVoice(
  localPlayer: WorldPlayer | null,
  remotePlayers: WorldPlayer[],
  currentRoomId: string | null
) {
  const [micOn, setMicOn] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nearbyPlayersRef = useRef<WorldPlayer[]>([]);

  const roomVoiceEnabled = currentRoomId ? VOICE_ENABLED_ROOMS.has(currentRoomId) : false;

  const nearbyPlayers = useMemo(() => {
    if (!localPlayer || !micOn) return [];
    const range = roomVoiceEnabled ? ROOM_VOICE_RANGE : PROXIMITY_RANGE;
    const nearby: WorldPlayer[] = [];
    for (const p of remotePlayers) {
      const dx = p.x - localPlayer.x;
      const dy = p.y - localPlayer.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= range) nearby.push(p);
    }
    nearby.sort((a, b) => {
      const da = Math.hypot(a.x - localPlayer.x, a.y - localPlayer.y);
      const db = Math.hypot(b.x - localPlayer.x, b.y - localPlayer.y);
      return da - db;
    });
    return nearby;
  }, [localPlayer, remotePlayers, micOn, roomVoiceEnabled]);

  // Keep refs current for any imperative consumers
  useEffect(() => {
    nearbyPlayersRef.current = nearbyPlayers;
  }, [nearbyPlayers]);

  const requestMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      setMicOn(true);
      setStreaming(true);
      setError(null);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Microphone access denied";
      setMicOn(false);
      setStreaming(false);
      setError(message);
      return false;
    }
  }, []);

  const stopMic = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setMicOn(false);
    setStreaming(false);
  }, []);

  const toggleMic = useCallback(async () => {
    if (micOn) {
      stopMic();
    } else {
      await requestMic();
    }
  }, [micOn, requestMic, stopMic]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return {
    isMicOn: micOn,
    isStreaming: streaming,
    error,
    nearbyPlayers,
    roomVoiceEnabled,
    proximityRange: roomVoiceEnabled ? ROOM_VOICE_RANGE : PROXIMITY_RANGE,
    toggleMic,
    requestMic,
    stopMic,
  };
}
