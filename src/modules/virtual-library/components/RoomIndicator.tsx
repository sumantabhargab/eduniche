/**
 * RoomIndicator — subtle label shown at the bottom of the screen
 * identifying the current room/zone the player is in.
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";

interface RoomIndicatorProps {
  /** Current room slug */
  roomId: string;
  /** Display name for the room */
  roomName: string;
  /** Whether the room has special properties (discussion, quiet, etc.) */
  roomType?: "default" | "quiet" | "discussion" | "group" | "private";
}

const ROOM_TYPE_COLORS: Record<string, string> = {
  default: "text-muted",
  quiet: "text-indigo-500 dark:text-indigo-400",
  discussion: "text-emerald-600 dark:text-emerald-400",
  group: "text-amber-600 dark:text-amber-400",
  private: "text-purple-500 dark:text-purple-400",
};

const ROOM_TYPE_ICONS: Record<string, string> = {
  default: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  quiet: "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z",
  discussion: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-4.272C3.512 14.661 3 13.848 3 13c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  group: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  private: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
};

export function RoomIndicator({ roomId, roomName, roomType = "default" }: RoomIndicatorProps) {
  const colorClass = ROOM_TYPE_COLORS[roomType] || ROOM_TYPE_COLORS.default;
  const iconPath = ROOM_TYPE_ICONS[roomType] || ROOM_TYPE_ICONS.default;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={roomId}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-popover/80 backdrop-blur-md border border-border shadow-sm">
          <svg
            className={`w-3.5 h-3.5 ${colorClass}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
          </svg>
          <span className="text-xs font-medium text-foreground/80">{roomName}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
