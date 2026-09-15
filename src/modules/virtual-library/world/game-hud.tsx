/**
 * GameHUD — unified heads-up display for the Virtual Library world.
 *
 * Renders as absolutely-positioned DOM elements over the canvas.
 * Organized in four zones:
 *
 *   Top-left    : Room name + population
 *   Top-right   : Connection quality dot
 *   Bottom-left  : Compact controls (music, mic, fullscreen, emoji toggle)
 *   Bottom-right : Online count + room badge
 *
 * z-index layers:
 *   HUD panels    → z-20
 *   Emoji bar     → z-30 (delegated to EmojiBar)
 *   Connection    → z-50 (handled separately in parent)
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EmojiBar } from "./emoji-bar";
import type {
  WorldPlayer,
  ConnectionState,
  RoomId,
  EmojiReaction,
} from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

const EMOJIS = ["👋", "❤️", "🔥", "📚", "💡", "🎵", "✨"];

// ─── Props ────────────────────────────────────────────────────────────────────

interface GameHUDProps {
  /** Current room ID */
  roomId: string | null;
  /** All players (local + remote) for population count */
  players: { local: WorldPlayer | null; remote: WorldPlayer[] };
  /** Connection quality */
  connectionState: ConnectionState;
  /** Music playing state */
  musicPlaying: boolean;
  /** Music volume (0–1) */
  musicVolume: number;
  /** Microphone is on */
  micOn: boolean;
  /** Nearby player count */
  nearbyCount: number;
  /** Is the current room voice-enabled? */
  roomVoiceEnabled: boolean;
  /** Is fullscreen active? */
  isFullscreen: boolean;
  /** Voice error message (if any) */
  voiceError: string | null;
  /** Study session status */
  sessionStatus: "idle" | "running" | "paused" | "completed";
  /** Focus seconds in current session */
  focusSeconds: number;
  /** Callbacks */
  onToggleFullscreen: () => void;
  onToggleMusic: () => void;
  onVolumeChange: (v: number) => void;
  onToggleMic: () => void;
  onStartSession: (roomId: string) => void;
  onPauseSession: () => void;
  onResumeSession: () => void;
  onEndSession: () => void;
  /** Emoji reactions (for the global emoji bar) */
  emojiReactions: EmojiReaction[];
}

// ─── Connection Quality Dot ───────────────────────────────────────────────────

function ConnectionDot({ state }: { state: ConnectionState }) {
  const config = {
    connected: { color: "bg-green-400", label: "Connected" },
    connecting: { color: "bg-yellow-400 animate-pulse", label: "Connecting" },
    reconnecting: { color: "bg-yellow-400 animate-pulse", label: "Reconnecting" },
    disconnected: { color: "bg-red-400", label: "Disconnected" },
  }[state];

  return (
    <span
      className="relative flex h-2.5 w-2.5"
      title={config.label}
      aria-label={config.label}
    >
      {state === "connecting" || state === "reconnecting" ? (
        <>
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current" />
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.color}`} />
        </>
      ) : (
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.color}`} />
      )}
    </span>
  );
}

// ─── Inline Music Control (compact) ──────────────────────────────────────────

function CompactMusicControl({
  isPlaying,
  volume,
  onToggle,
  onVolumeChange,
}: {
  isPlaying: boolean;
  volume: number;
  onToggle: () => void;
  onVolumeChange: (v: number) => void;
}) {
  const [showSlider, setShowSlider] = useState(false);

  return (
    <div
      className="relative group"
      onMouseEnter={() => setShowSlider(true)}
      onMouseLeave={() => setShowSlider(false)}
    >
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 text-foreground-light hover:text-accent transition-colors"
        aria-label={isPlaying ? "Mute music" : "Play music"}
        title="Ambient music"
      >
        {isPlaying ? (
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M19 9l-6 6-6-6M19 15l-6-6-6 6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Hover volume slider */}
      <AnimatePresence>
        {showSlider && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 64 }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-full ml-2 mb-1"
          >
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="h-1 accent-accent cursor-pointer w-16"
              aria-label="Music volume"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Format Time Helper ───────────────────────────────────────────────────────

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

// ─── Room Name Display ───────────────────────────────────────────────────────

function RoomDisplayName({ roomId }: { roomId: string | null }) {
  if (!roomId) return null;

  // Human-readable names
  const names: Record<string, string> = {
    entrance: "Entrance Hall",
    "main-reading": "Main Reading Room",
    "quiet-zone": "Quiet Zone",
    "group-study": "Group Study",
    "discussion-room": "Discussion Room",
    "booth-1": "Study Booth 1",
    "booth-2": "Study Booth 2",
    "booth-3": "Study Booth 3",
    "booth-4": "Study Booth 4",
  };

  return (
    <span className="text-xs font-medium text-foreground-light/80">
      {names[roomId] ?? roomId}
    </span>
  );
}

// ─── Main GameHUD Component ──────────────────────────────────────────────────

export function GameHUD({
  roomId,
  players,
  connectionState,
  musicPlaying,
  musicVolume,
  micOn,
  nearbyCount,
  roomVoiceEnabled,
  isFullscreen,
  voiceError,
  sessionStatus,
  focusSeconds,
  onToggleFullscreen,
  onToggleMusic,
  onVolumeChange,
  onToggleMic,
  onStartSession,
  onPauseSession,
  onResumeSession,
  onEndSession,
  emojiReactions,
}: GameHUDProps) {
  const [showEmojiBar, setShowEmojiBar] = useState(false);
  const [showPlayerList, setShowPlayerList] = useState(false);

  // Compute population
  const population = (players.local ? 1 : 0) + players.remote.length;
  const onlineCount = players.remote.length + 1; // +1 for self

  // Stable refs for keyboard shortcuts
  const showEmojiBarRef = useRef(false);
  useEffect(() => {
    showEmojiBarRef.current = showEmojiBar;
  }, [showEmojiBar]);

  // Keyboard shortcut: E toggles emoji bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("input, textarea, select")) return;
      if (e.key.toLowerCase() === "e" && !showEmojiBarRef.current) {
        setShowEmojiBar(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Mic button tooltip text
  const micTooltip = roomVoiceEnabled
    ? micOn
      ? `${nearbyCount} can hear you`
      : "Room supports voice"
    : micOn
      ? `${nearbyCount} nearby`
      : "Click to talk";

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════════
          TOP-LEFT: Room name + population
         ══════════════════════════════════════════════════════════════════════ */}
      <div className="absolute top-4 left-4 z-20">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3 bg-foreground-dark/70 backdrop-blur-md border border-border-light/50 rounded-xl px-4 py-2 shadow-lg"
        >
          <RoomDisplayName roomId={roomId} />
          <span className="w-px h-4 bg-border-light/50" />
          <span className="flex items-center gap-1.5 text-[11px] text-muted-light">
            <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {population} here
          </span>
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TOP-RIGHT: Connection quality + study timer
         ══════════════════════════════════════════════════════════════════════ */}
      <div className="absolute top-4 right-4 z-20">
        <div className="flex items-center gap-2 bg-foreground-dark/70 backdrop-blur-md border border-border-light/50 rounded-xl px-3 py-2 shadow-lg">
          <ConnectionDot state={connectionState} />

          {/* Study timer when session is active */}
          {sessionStatus === "running" && (
            <>
              <span className="w-px h-4 bg-border-light/50" />
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-[11px] font-mono text-foreground-light">
                  {formatTime(focusSeconds)}
                </span>
              </div>
            </>
          )}

          {/* Online count */}
          <span className="w-px h-4 bg-border-light/50" />
          <span className="text-[11px] text-muted-light">
            {onlineCount} online
          </span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          BOTTOM-CENTER: Study session controls
         ══════════════════════════════════════════════════════════════════════ */}
      {sessionStatus === "idle" && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onStartSession(roomId || "general")}
            className="flex items-center gap-2 bg-accent text-foreground px-6 py-3 rounded-2xl text-sm font-semibold
                       hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-accent/20"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
            Start Studying
          </motion.button>
        </div>
      )}

      {sessionStatus === "running" && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          <button
            onClick={onPauseSession}
            className="flex items-center gap-1.5 bg-foreground-dark/80 backdrop-blur-md border border-border-light/50
                       text-foreground-light px-4 py-2 rounded-xl text-xs font-medium
                       hover:bg-foreground-dark active:scale-95 transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
            Pause
          </button>
          <button
            onClick={onEndSession}
            className="flex items-center gap-1.5 bg-foreground-dark/80 backdrop-blur-md border border-border-light/50
                       text-foreground-light px-4 py-2 rounded-xl text-xs font-medium
                       hover:bg-red-500/20 hover:text-red-400 active:scale-95 transition-all"
          >
            End
          </button>
        </div>
      )}

      {sessionStatus === "paused" && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
          <motion.button
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={onResumeSession}
            className="flex items-center gap-2 bg-accent text-foreground px-6 py-3 rounded-2xl text-sm font-semibold
                       hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-accent/20"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
            Resume
          </motion.button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          BOTTOM-LEFT: Compact controls bar
         ══════════════════════════════════════════════════════════════════════ */}
      <div className="absolute bottom-4 left-4 z-20">
        <div className="flex items-center gap-1 bg-foreground-dark/70 backdrop-blur-md border border-border-light/50 rounded-full px-2 py-1.5 shadow-lg">
          {/* Music toggle */}
          <CompactMusicControl
            isPlaying={musicPlaying}
            volume={musicVolume}
            onToggle={onToggleMusic}
            onVolumeChange={onVolumeChange}
          />

          <span className="w-px h-5 bg-border-light/30" />

          {/* Mic toggle */}
          <div className="relative">
            <button
              onClick={onToggleMic}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                micOn
                  ? "bg-green-500/20 border border-green-500/40 text-green-300"
                  : "text-foreground-light hover:text-accent"
              }`}
              aria-label={micOn ? "Mute microphone" : "Enable microphone"}
              title={micTooltip}
            >
              {micOn ? (
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14a5 5 0 01-2 3.97M17 8a5 5 0 00-3-4.472" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {micOn && <span>{nearbyCount}</span>}
            </button>
            {/* Mic error tooltip */}
            <AnimatePresence>
              {voiceError && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-1.5 whitespace-nowrap z-50"
                >
                  <p className="text-[10px] text-red-300">{voiceError}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <span className="w-px h-5 bg-border-light/30" />

          {/* Fullscreen toggle */}
          <button
            onClick={onToggleFullscreen}
            className="flex items-center justify-center w-8 h-8 rounded-full text-foreground-light hover:text-accent transition-colors"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M9 9V5a2 2 0 00-2-2H4m0 6h6M15 9V5a2 2 0 012-2h3m0 6h-6m0 0v6a2 2 0 002 2h3m0-6v6m-9 0v-6a2 2 0 00-2-2H4m0 6h6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M3 8V5a2 2 0 012-2h3M3 16v3a2 2 0 002 2h3m8-16h3a2 2 0 012 2v3m0 8v3a2 2 0 01-2 2h-3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>

          <span className="w-px h-5 bg-border-light/30" />

          {/* Emoji toggle button */}
          <button
            onClick={() => setShowEmojiBar((v) => !v)}
            className="flex items-center justify-center w-8 h-8 rounded-full text-foreground-light hover:text-accent transition-colors"
            aria-label="Toggle emoji reactions"
            title="React (E)"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          BOTTOM-RIGHT: Room badge + player list toggle
         ══════════════════════════════════════════════════════════════════════ */}
      <div className="absolute bottom-4 right-4 z-20">
        <div className="flex items-center gap-2">
          {/* Room badge */}
          {roomId && (
            <div className="flex items-center gap-1.5 bg-foreground-dark/70 backdrop-blur-md border border-border-light/50 rounded-full px-3 py-1.5 shadow-lg">
              <span className="text-[11px] text-foreground-light/80 capitalize">
                {roomId.replace(/-/g, " ")}
              </span>
              <span className="text-[10px] text-muted-light">
                {onlineCount} online
              </span>
            </div>
          )}

          {/* Player list toggle */}
          <button
            onClick={() => setShowPlayerList((v) => !v)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all shadow-lg ${
              showPlayerList
                ? "bg-accent/20 border border-accent/40 text-accent"
                : "bg-foreground-dark/70 backdrop-blur-md border border-border-light/50 text-foreground-light hover:text-accent"
            }`}
            aria-expanded={showPlayerList}
            aria-label={showPlayerList ? "Hide players" : "Show players"}
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{onlineCount}</span>
            <svg
              viewBox="0 0 24 24"
              className="w-3 h-3 transition-transform duration-200"
              style={{ transform: showPlayerList ? "rotate(180deg)" : "rotate(0deg)" }}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          Player List Sidebar
         ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showPlayerList && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute bottom-16 right-4 z-20 w-56"
          >
            <div className="bg-foreground-dark/70 backdrop-blur-md border border-border-light/50 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="px-3 py-2 border-b border-border-light/30 flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-wider text-muted-light font-semibold">
                  In this room
                </p>
                <span className="text-[10px] text-muted-light">{population}</span>
              </div>

              {/* Player rows */}
              <div className="overflow-y-auto max-h-72 py-1.5 px-1.5 space-y-0.5">
                {players.local && (
                  <PlayerRow player={players.local} isLocal />
                )}
                {players.remote
                  .slice()
                  .sort((a, b) => a.lastUpdate - b.lastUpdate)
                  .map((p) => (
                    <PlayerRow key={p.id} player={p} isLocal={false} />
                  ))}
                {population === 0 && (
                  <p className="text-[11px] text-muted-light text-center py-4">
                    No one else here yet
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          Emoji Bar
         ══════════════════════════════════════════════════════════════════════ */}
      <EmojiBar visible={showEmojiBar} onEmojiSent={() => setShowEmojiBar(false)} />
    </>
  );
}

// ─── Player Row (local to GameHUD) ───────────────────────────────────────────

function PlayerRow({ player, isLocal }: { player: WorldPlayer; isLocal: boolean }) {
  const avatarColors = [
    "#B8710E", "#4A7A5A", "#6A5A8A", "#8A4A4A",
    "#4A6A8A", "#8A7A3A", "#7A5A6A", "#5A8A7A",
  ];
  const color = avatarColors[player.colorIndex % avatarColors.length];

  const initials = (() => {
    const parts = player.label.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return player.label.slice(0, 2).toUpperCase();
  })();

  return (
    <div
      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors ${
        isLocal
          ? "bg-accent/10 border border-accent/20"
          : "hover:bg-white/5"
      }`}
    >
      {/* Avatar */}
      <div
        className="relative w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
        style={{ backgroundColor: color + "25", color }}
      >
        {initials}
        {isLocal && (
          <span
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-accent border-2 border-background-dark
                       flex items-center justify-center"
            title="You"
          >
            <svg viewBox="0 0 24 24" className="w-1.5 h-1.5" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </span>
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-foreground-light truncate">
          {player.label}
          {isLocal && (
            <span className="ml-1 text-[9px] px-1 py-0.5 rounded-full bg-accent/20 text-accent font-semibold">
              You
            </span>
          )}
        </p>
        <p className="text-[9px] text-muted-light flex items-center gap-1">
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${player.isMuted ? "bg-red-400/60" : "bg-green-400"}`} />
          {player.isMuted ? "muted" : "live"}
        </p>
      </div>

      {/* Mute icon */}
      {player.isMuted && (
        <svg viewBox="0 0 24 24" className="w-3 h-3 text-muted-light shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          <line x1="23" y1="9" x2="17" y2="15" strokeLinecap="round" />
          <line x1="17" y1="9" x2="23" y2="15" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
}
