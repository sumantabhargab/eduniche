/**
 * ChatHeader — top bar of the chat panel.
 */

import type { ReactNode } from "react";

interface ChatHeaderProps {
  title: string;
  onClose: () => void;
  showBack?: boolean;
  onBack?: () => void;
  subtitle?: string;
}

export function ChatHeader({
  title,
  onClose,
  showBack = false,
  onBack,
  subtitle,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-4 h-14 border-b border-border shrink-0">
      {showBack && onBack && (
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center text-muted hover:text-foreground rounded-lg hover:bg-background-alt transition-colors"
          aria-label="Back to conversations"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h2 className="text-sm font-medium text-foreground truncate">{title}</h2>
        {subtitle && (
          <p className="text-xs text-muted truncate">{subtitle}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="w-8 h-8 flex items-center justify-center text-muted hover:text-foreground rounded-lg hover:bg-background-alt transition-colors"
        aria-label="Close chat"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
