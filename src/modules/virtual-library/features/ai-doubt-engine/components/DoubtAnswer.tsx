/**
 * DoubtAnswer — structured answer rendering after AI response.
 */

"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import type { DoubtResponse } from "../../../types/index";
import MarkdownRenderer from "./MarkdownRenderer";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

interface DoubtAnswerProps {
  response: DoubtResponse;
  onClear: () => void;
  onNewQuestion: () => void;
}

export function DoubtAnswer({ response, onClear, onNewQuestion }: DoubtAnswerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(response.answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Copy failed silently
    }
  }, [response.answer]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4 answer-card"
    >
      {/* Answer */}
      <div className="bg-background-alt/60 dark:bg-white/[0.03] rounded-2xl p-5 border border-border/60">
        <div className="markdown-body">
          <MarkdownRenderer content={response.answer} />
        </div>
      </div>

      {/* References */}
      {response.references.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted uppercase tracking-wider">
            References
          </p>
          <div className="flex flex-wrap gap-1.5">
            {response.references.map((ref, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 bg-accent/10 rounded-lg text-muted"
              >
                {ref}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Confidence + timestamp */}
      <div className="flex items-center justify-between text-xs text-muted">
        <div className="flex items-center gap-2">
          <span>AI confidence:</span>
          <span className={`px-2 py-0.5 rounded-full font-medium ${
            response.confidence === "high"
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
              : response.confidence === "medium"
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
          }`}>
            {response.confidence}
          </span>
        </div>
        <span>{formatTime(response.createdAt)}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onNewQuestion}
          className="flex-1 px-4 py-2.5 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Ask Another
        </button>
        <button
          onClick={onClear}
          className="px-4 py-2.5 border border-border rounded-xl text-sm text-muted hover:text-foreground transition-colors"
        >
          Done
        </button>
        <button
          onClick={handleCopy}
          className="px-4 py-2.5 border border-border rounded-xl text-sm text-muted hover:text-foreground transition-colors flex items-center gap-1.5"
          title="Copy answer"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </motion.div>
  );
}
