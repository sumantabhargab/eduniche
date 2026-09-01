/**
 * ProximityVoice — manages microphone state and proximity-based voice.
 *
 * When the user enables their mic, audio is captured.
 * We track nearby players (within proximity range) for room-based communication.
 * Actual WebRTC transport can be added via LiveKit when a backend is available.
 */

"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import type { WorldPlayer } from "./types";

const PROXIMITY_RANGE = 200; // pixels — how close players need to be to "hear" each other
const ROOM_VOICE_RANGE = 600; // pixels — room-wide voice in voice-enabled rooms

export interface VoiceState {
  isMicOn: boolean;
  isStreaming: boolean;
  error: string | null;
  nearbyPlayers: WorldPlayer[];
  roomVoiceEnabled: boolean;
}

export function useProximityVoice(
  localPlayer: WorldPlayer | null,
  remotePlayers: WorldPlayer[],
  currentRoomId: string | null
) {
  const [state, setState] = useState<VoiceState>({
    isMicOn: false,
    isStreaming: false,
    error: null,
    nearbyPlayers: [],
    roomVoiceEnabled: false,
  });

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Determine if the current room supports voice
  const roomVoiceEnabled = currentRoomId === "discussion-room" || currentRoomId === "group-study";

  // Calculate nearby players based on proximity
  useEffect(() => {
    if (!localPlayer || !state.isMicOn) {
      setState((prev) => ({ ...prev, nearbyPlayers: [] }));
      return;
    }

    const nearby: (WorldPlayer & { distance: number })[] = [];
    const range = roomVoiceEnabled ? ROOM_VOICE_RANGE : PROXIMITY_RANGE;

    for (const p of remotePlayers) {
      const dx = p.x - localPlayer.x;
      const dy = p.y - localPlayer.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= range) {
        nearby.push({ ...p, distance: dist });
      }
    }

    nearby.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    setState((prev) => ({ ...prev, nearbyPlayers: nearby as WorldPlayer[], roomVoiceEnabled }));
  }, [localPlayer, remotePlayers, state.isMicOn, currentRoomId, roomVoiceEnabled]);

  // Request microphone access
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

      // Set up audio analysis for future mute-detection UI
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      setState((prev) => ({
        ...prev,
        isMicOn: true,
        isStreaming: true,
        error: null,
      }));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Microphone access denied";
      setState((prev) => ({
        ...prev,
        isMicOn: false,
        isStreaming: false,
        error: message,
      }));
      return false;
    }
  }, []);

  // Stop microphone
  const stopMic = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isMicOn: false,
      isStreaming: false,
      nearbyPlayers: [],
    }));
  }, []);

  // Toggle mic
  const toggleMic = useCallback(async () => {
    if (state.isMicOn) {
      stopMic();
    } else {
      await requestMic();
    }
  }, [state.isMicOn, requestMic, stopMic]);

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
    ...state,
    toggleMic,
    requestMic,
    stopMic,
    proximityRange: roomVoiceEnabled ? ROOM_VOICE_RANGE : PROXIMITY_RANGE,
  };
}
