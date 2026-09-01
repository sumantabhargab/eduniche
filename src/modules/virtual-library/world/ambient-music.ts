/**
 * AmbientMusic — calm library ambience using Web Audio API.
 *
 * Generates a soft, warm ambient drone with gentle harmonics.
 * Pure synthesis — no external audio files needed.
 */

"use client";

import { useRef, useCallback } from "react";

type MusicState = "idle" | "playing" | "paused";

export function useAmbientMusic() {
  const stateRef = useRef<MusicState>("idle");
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const nodesRef = useRef<AudioNode[]>([]);
  const volumeRef = useRef(0.3);

  const setVolume = useCallback((v: number) => {
    volumeRef.current = Math.max(0, Math.min(1, v));
    if (gainRef.current && ctxRef.current && ctxRef.current.state !== "closed") {
      gainRef.current.gain.setTargetAtTime(volumeRef.current * 0.12, ctxRef.current.currentTime, 0.3);
    }
    localStorage.setItem("eduneuro:library:musicVolume", String(volumeRef.current));
  }, []);

  const createDrone = useCallback((ctx: AudioContext, gain: GainNode) => {
    // Warm ambient chord: C3, E3, G3, B3 — a gentle Cmaj7 drone
    const freqs = [130.81, 164.81, 196.0, 246.94];

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = i === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.05 + i * 0.02, ctx.currentTime);
      lfoGain.gain.setValueAtTime(freq * 0.002, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      const voiceGain = 1 / (i + 1) * 0.3;
      oscGain.gain.setValueAtTime(voiceGain, ctx.currentTime);
      osc.connect(oscGain);
      oscGain.connect(gain);
      osc.start();
      nodesRef.current.push(osc, lfo);
    });

    // Subtle noise texture
    const bufferSize = ctx.sampleRate * 4;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.003;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "lowpass";
    noiseFilter.frequency.setValueAtTime(400, ctx.currentTime);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, ctx.currentTime);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(gain);
    noise.start();
    nodesRef.current.push(noise);
  }, []);

  const stopNodes = useCallback(() => {
    nodesRef.current.forEach((node) => {
      try {
        (node as unknown as { stop: () => void }).stop();
      } catch { /* not a source node, ignore */ }
      try { node.disconnect(); } catch { /* already disconnected */ }
    });
    nodesRef.current = [];
  }, []);

  const play = useCallback(() => {
    if (stateRef.current === "playing") return;

    if (!ctxRef.current || ctxRef.current.state === "closed") {
      const ctx = new AudioContext();
      ctxRef.current = ctx;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volumeRef.current * 0.12, ctx.currentTime);
      gain.connect(ctx.destination);
      gainRef.current = gain;
      createDrone(ctx, gain);
    } else if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }

    stateRef.current = "playing";
  }, [createDrone]);

  const pause = useCallback(() => {
    if (stateRef.current !== "playing") return;
    if (ctxRef.current && ctxRef.current.state === "running") {
      ctxRef.current.suspend();
    }
    stateRef.current = "paused";
  }, []);

  const resume = useCallback(() => {
    if (stateRef.current !== "paused") return;
    if (ctxRef.current && ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    stateRef.current = "playing";
  }, []);

  const stop = useCallback(() => {
    stopNodes();
    if (ctxRef.current && ctxRef.current.state !== "closed") {
      ctxRef.current.close();
    }
    ctxRef.current = null;
    gainRef.current = null;
    stateRef.current = "idle";
  }, [stopNodes]);

  const toggle = useCallback(() => {
    if (stateRef.current === "idle" || stateRef.current === "paused") {
      play();
    } else if (stateRef.current === "playing") {
      pause();
    }
  }, [play, pause]);

  return {
    state: stateRef.current,
    play,
    pause,
    resume,
    stop,
    toggle,
    volume: volumeRef.current,
    setVolume,
  };
}
