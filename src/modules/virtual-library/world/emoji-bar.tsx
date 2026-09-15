/**
 * EmojiBar — polished emoji picker that pops up from the bottom.
 *
 * Sends emojis via `multiplayerManager.broadcastEmoji()` and auto-closes
 * after selection. Clicking outside also dismisses it.
 *
 * z-index: 30 — sits above canvas, below connection overlay (z-50).
 */

"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { multiplayerManager } from "./multiplayer";

// ─── Constants ────────────────────────────────────────────────────────────────

const EMOJIS = ["👋", "❤️", "🔥", "📚", "💡", "🎵", "✨"];

// Keyboard shortcut labels (1-7)
const SHORTCUT_LABELS = ["1", "2", "3", "4", "5", "6", "7"];

// ─── Props ────────────────────────────────────────────────────────────────────

interface EmojiBarProps {
  /** Whether the emoji bar is visible */
  visible: boolean;
  /** Called after an emoji is sent (parent hides the bar) */
  onEmojiSent: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EmojiBar({ visible, onEmojiSent }: EmojiBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  // Keep a stable callback ref so the keydown listener always has the latest version
  const onEmojiSentRef = useRef(onEmojiSent);
  onEmojiSentRef.current = onEmojiSent;

  // Keyboard shortcuts (1-7) when the bar is visible
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!visibleRef.current) return;
      const target = e.target as HTMLElement | null;
      // Don't capture when typing in inputs
      if (target?.closest?.("input, textarea, select")) return;

      const idx = parseInt(e.key, 10);
      if (idx >= 1 && idx <= EMOJIS.length) {
        e.preventDefault();
        const emoji = EMOJIS[idx - 1];
        multiplayerManager.broadcastEmoji(emoji);
        onEmojiSentRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click-outside-to-close
  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      const el = containerRef.current;
      if (el && !el.contains(e.target as Node)) {
        onEmojiSentRef.current();
      }
    };

    // Delay binding so the opening click doesn't immediately close it
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [visible]);

  const handleEmoji = useCallback(
    (emoji: string) => {
      multiplayerManager.broadcastEmoji(emoji);
      onEmojiSent();
    },
    [onEmojiSent]
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.6 }}
          className="absolute bottom-28 left-1/2 -translate-x-1/2 z-30 bg-foreground-dark/70 backdrop-blur-md border border-border-light/50 rounded-2xl p-2 shadow-2xl"
          role="toolbar"
          aria-label="Emoji reactions"
        >
          <div className="flex items-center gap-1">
            {EMOJIS.map((emoji, i) => (
              <button
                key={emoji}
                onClick={() => handleEmoji(emoji)}
                className="relative w-9 h-9 flex items-center justify-center text-lg rounded-lg
                           hover:bg-white/10 active:scale-90 transition-all duration-150
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                title={`${emoji} (key ${SHORTCUT_LABELS[i]})`}
                aria-label={`Send ${emoji} reaction`}
              >
                {emoji}
                <span className="absolute -top-1 -right-1 text-[8px] text-muted-light leading-none opacity-0 group-hover:opacity-100 transition-opacity">
                  {SHORTCUT_LABELS[i]}
                </span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-light text-center mt-1.5 select-none">
            press 1-7
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
