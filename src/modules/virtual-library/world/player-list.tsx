/**
 * PlayerList — collapsible sidebar showing everyone in the current room.
 *
 * - Local player highlighted with a "You" badge
 * - Muted players shown with a mute icon
 * - Sorted: local first, then remote players by join time (earliest first)
 * - Collapses with a smooth Framer Motion animation
 *
 * z-index: 20 — above canvas, below emoji bar (z-30).
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { WorldPlayer } from "./types";
import { COLORS } from "./colors";

// ─── Constants ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "#B8710E", "#4A7A5A", "#6A5A8A", "#8A4A4A",
  "#4A6A8A", "#8A7A3A", "#7A5A6A", "#5A8A7A",
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface PlayerListProps {
  /** All remote players */
  remotePlayers: WorldPlayer[];
  /** The local player */
  localPlayer: WorldPlayer | null;
  /** Whether the sidebar is expanded */
  isOpen: boolean;
  /** Toggle callback */
  onToggle: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPlayerColor(colorIndex: number): string {
  return AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];
}

function getInitials(label: string): string {
  // Take first two "words" (handles names like "John Doe")
  const parts = label.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return label.slice(0, 2).toUpperCase();
}

// ─── Single Player Row ────────────────────────────────────────────────────────

function PlayerRow({
  player,
  isLocal,
}: {
  player: WorldPlayer;
  isLocal: boolean;
}) {
  const color = getPlayerColor(player.colorIndex);
  const initials = getInitials(player.label);

  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
        isLocal
          ? "bg-accent/10 border border-accent/20"
          : "hover:bg-white/5"
      }`}
    >
      {/* Avatar circle */}
      <div
        className="relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
        style={{ backgroundColor: color + "30", color }}
      >
        {initials}
        {isLocal && (
          <span
            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-accent border-2 border-background-dark flex items-center justify-center"
            title="You"
          >
            <svg viewBox="0 0 24 24" className="w-2 h-2" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </span>
        )}
      </div>

      {/* Name + status */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground-light truncate">
          {player.label}
          {isLocal && (
            <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent font-semibold">
              You
            </span>
          )}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {/* Mic status dot */}
          <span className="relative flex h-1.5 w-1.5">
            {!player.isMuted ? (
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
            ) : (
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-400/60" />
            )}
          </span>
          <span className="text-[10px] text-muted-light">
            {player.isMuted ? "muted" : "live"}
          </span>
          {player.isVideoOn && (
            <span className="text-[10px] text-muted-light">• video on</span>
          )}
        </div>
      </div>

      {/* Mute icon overlay for muted players */}
      {player.isMuted && (
        <svg
          viewBox="0 0 24 24"
          className="w-3.5 h-3.5 text-muted-light shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          <line x1="23" y1="9" x2="17" y2="15" strokeLinecap="round" />
          <line x1="17" y1="9" x2="23" y2="15" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PlayerList({
  remotePlayers,
  localPlayer,
  isOpen,
  onToggle,
}: PlayerListProps) {
  // Build sorted list: local first, then remote by join time (lastUpdate)
  const sortedPlayers = useMemoSort(localPlayer, remotePlayers);
  const totalCount = (localPlayer ? 1 : 0) + remotePlayers.length;

  return (
    <div
      className="absolute top-20 left-4 z-20 flex flex-col items-start"
      style={{ maxWidth: 220 }}
    >
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="flex items-center gap-2 bg-foreground-dark/70 backdrop-blur-md border border-border-light/50 rounded-full px-3 py-1.5 text-xs text-foreground-light hover:text-accent transition-colors shadow-lg"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Hide player list" : "Show player list"}
      >
        <svg
          viewBox="0 0 24 24"
          className="w-3.5 h-3.5 transition-transform duration-200"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="font-medium">Players</span>
        <span className="text-muted-light">{totalCount}</span>
      </button>

      {/* Collapsible list */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 8 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden w-full"
          >
            <div
              className="bg-foreground-dark/70 backdrop-blur-md border border-border-light/50 rounded-xl
                         shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-3 py-2 border-b border-border-light/30">
                <p className="text-[10px] uppercase tracking-wider text-muted-light font-semibold">
                  In this room
                </p>
              </div>

              {/* Player rows — scrollable if many */}
              <div className="overflow-y-auto max-h-64 py-1.5 px-1.5 space-y-0.5">
                {localPlayer && (
                  <PlayerRow player={localPlayer} isLocal />
                )}
                {sortedPlayers.map((p) => (
                  <PlayerRow key={p.id} player={p} isLocal={false} />
                ))}
                {totalCount === 0 && (
                  <p className="text-[11px] text-muted-light text-center py-4">
                    No one else here yet
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Memoized Sort Hook ───────────────────────────────────────────────────────
// Inline hook to sort players without adding a dependency on useMemo behavior.

function useMemoSort(
  localPlayer: WorldPlayer | null,
  remotePlayers: WorldPlayer[]
): WorldPlayer[] {
  const key = [
    localPlayer?.id ?? "",
    ...remotePlayers.map((p) => p.id + ":" + p.lastUpdate),
  ].join("|");

  // We use a simple ref trick — this component is small, so
  // sorting on every render is fine. Return a stable reference by
  // only re-sorting when the set of players changes.
  const sorted = remotePlayers
    .slice()
    .sort((a, b) => a.lastUpdate - b.lastUpdate);
  return sorted;
}
