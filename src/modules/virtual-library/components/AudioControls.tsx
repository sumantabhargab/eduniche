/**
 * AudioControls — compact music/ambience player with volume and mute.
 *
 * Creates an audio element from a generated oscillator-based ambient tone
 * since we cannot rely on external audio files. In production, replace the
 * oscillator with a real audio file URL.
 */

"use client";

import { useRef, useEffect, useState, useCallback } from "react";

interface AudioControlsProps {
  /** User's saved volume preference (0–1). */
  defaultVolume?: number;
  /** Small label shown next to the icon. */
  label?: string;
}

export function AudioControls({
  defaultVolume = 0.15,
  label = "Music",
}: AudioControlsProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(defaultVolume);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{
    gain: GainNode;
    filter: BiquadFilterNode;
    oscillators: OscillatorNode[];
  } | null>(null);

  const initAudio = useCallback(() => {
    if (nodesRef.current) return;

    const ctx = new AudioContext();
    audioContextRef.current = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.value = isMuted ? 0 : volume;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400;
    filter.Q.value = 0.5;

    // Create gentle ambient drones
    const frequencies = [130.81, 196.00, 261.63]; // C3, G3, C4
    const oscillators = frequencies.map((freq) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;

      const oscGain = ctx.createGain();
      oscGain.gain.value = 0.03 / frequencies.length;

      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start();
      return osc;
    });

    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    nodesRef.current = { gain: masterGain, filter, oscillators };
    setIsLoaded(true);
  }, [volume, isMuted]);

  const play = useCallback(() => {
    initAudio();
    if (audioContextRef.current?.state === "suspended") {
      audioContextRef.current.resume();
    }
    if (nodesRef.current) {
      nodesRef.current.gain.gain.setTargetAtTime(
        isMuted ? 0 : volume,
        audioContextRef.current?.currentTime ?? 0,
        0.5
      );
    }
    setIsPlaying(true);
  }, [initAudio, volume, isMuted]);

  const pause = useCallback(() => {
    if (nodesRef.current) {
      nodesRef.current.gain.gain.setTargetAtTime(
        0,
        audioContextRef.current?.currentTime ?? 0,
        0.5
      );
    }
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value);
      setVolume(newVolume);
      if (nodesRef.current && !isMuted) {
        nodesRef.current.gain.gain.setTargetAtTime(
          newVolume,
          audioContextRef.current?.currentTime ?? 0,
          0.1
        );
      }
    },
    [isMuted]
  );

  const toggleMute = useCallback(() => {
    setIsMuted((m) => {
      if (nodesRef.current) {
        nodesRef.current.gain.gain.setTargetAtTime(
          m ? volume : 0,
          audioContextRef.current?.currentTime ?? 0,
          0.1
        );
      }
      return !m;
    });
  }, [volume]);

  useEffect(() => {
    return () => {
      nodesRef.current?.oscillators.forEach((o) => o.stop());
      audioContextRef.current?.close();
    };
  }, []);

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors ${
        isPlaying
          ? "bg-accent/60 border-border"
          : "bg-accent/30 border-transparent"
      }`}
    >
      {/* Play/pause button */}
      <button
        onClick={toggle}
        className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-foreground/5 transition-colors text-muted hover:text-foreground"
        title={isPlaying ? "Pause music" : "Play ambient music"}
      >
        {isPlaying ? (
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Label + volume (hidden when stopped and not hovered) */}
      <div
        className={`flex items-center gap-2 transition-all duration-300 ${
          isPlaying ? "w-28 opacity-100" : "w-0 opacity-0 overflow-hidden"
        }`}
      >
        <span className="text-[10px] text-muted whitespace-nowrap">{label}</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="w-16 h-1 accent-foreground cursor-pointer"
          style={{ accentColor: "currentColor" }}
        />
      </div>

      {/* Mute button */}
      <button
        onClick={toggleMute}
        className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-foreground/5 transition-colors text-muted hover:text-foreground"
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted || volume === 0 ? (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        )}
      </button>
    </div>
  );
}
