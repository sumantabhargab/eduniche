/**
 * ProfileHeader — top bar showing online count, clock, study timer, user avatar.
 */

"use client";

import { useRef, useEffect, useCallback } from "react";

interface ProfileHeaderProps {
  onlineCount: number;
  clock: string;
  isStudying: boolean;
  studySeconds: number;
  userName?: string;
  userAvatarUrl?: string | null;
  onToggleStudy: () => void;
  onEndStudy: () => void;
  theme: "light" | "dark";
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function ProfileHeader({
  onlineCount,
  clock,
  isStudying,
  studySeconds,
  userName,
  userAvatarUrl,
  onToggleStudy,
  onEndStudy,
  theme,
}: ProfileHeaderProps) {
  const [studyMenuOpen, setStudyMenuOpen] = React.useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setStudyMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Left: Logo */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-sm">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <span className="font-semibold text-sm sm:text-base text-foreground tracking-tight hidden sm:block">
            EduNeuro
          </span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent text-muted hidden sm:block">
            Library
          </span>
        </div>

        {/* Center: Online count */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/60 backdrop-blur-sm pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-foreground tabular-nums">
            {onlineCount} studying
          </span>
        </div>

        {/* Right: Clock + Study + Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          {/* Study controls */}
          <div className="relative" ref={menuRef}>
            {isStudying ? (
              <button
                onClick={() => setStudyMenuOpen(!studyMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono font-medium text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {formatTime(studySeconds)}
                </span>
              </button>
            ) : (
              <button
                onClick={onToggleStudy}
                className="text-xs font-medium px-3 py-1.5 rounded-full bg-accent border border-border hover:bg-foreground/5 transition-colors text-muted hover:text-foreground"
              >
                Study
              </button>
            )}

            {/* Study menu */}
            {studyMenuOpen && isStudying && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-popover border border-border rounded-xl shadow-lg overflow-hidden z-50">
                <button
                  onClick={() => {
                    onEndStudy();
                    setStudyMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                >
                  End Session
                </button>
              </div>
            )}
          </div>

          {/* Clock */}
          <span className="text-xs font-mono text-muted tabular-nums hidden sm:block">
            {clock}
          </span>

          {/* User avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
            {userAvatarUrl ? (
              <img
                src={userAvatarUrl}
                alt={userName || "User"}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              (userName || "U")[0].toUpperCase()
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

import React from "react";
