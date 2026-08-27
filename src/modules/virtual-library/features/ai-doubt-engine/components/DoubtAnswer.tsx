/**
 * DoubtAnswer — structured answer rendering after AI response.
 */

import type { DoubtResponse } from "../../../types/index";

interface DoubtAnswerProps {
  response: DoubtResponse;
  onClear: () => void;
  onNewQuestion: () => void;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function DoubtAnswer({ response, onClear, onNewQuestion }: DoubtAnswerProps) {
  return (
    <div className="space-y-4">
      {/* Answer */}
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <div className="bg-accent/20 rounded-xl p-4 space-y-3">
          {/* Simple markdown-like rendering */}
          {response.answer.split("\n").map((line, i) => {
            if (line.startsWith("## ")) {
              return <h3 key={i} className="text-base font-semibold mt-4 first:mt-0">{line.slice(3)}</h3>;
            }
            if (line.startsWith("### ")) {
              return <h4 key={i} className="text-sm font-semibold mt-3">{line.slice(4)}</h4>;
            }
            if (line.startsWith("- ")) {
              return <li key={i} className="text-sm text-foreground/90 ml-2">{line.slice(2)}</li>;
            }
            if (line.startsWith("> ")) {
              return <blockquote key={i} className="text-sm border-l-2 border-foreground/30 pl-3 italic text-muted">{line.slice(2)}</blockquote>;
            }
            if (line.startsWith("| ")) {
              return <div key={i} className="text-sm font-mono text-xs overflow-x-auto">{line}</div>;
            }
            if (line.trim() === "") {
              return <br key={i} />;
            }
            return <p key={i} className="text-sm leading-relaxed">{line}</p>;
          })}
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
                className="text-xs px-2 py-1 bg-accent/50 rounded-lg text-muted"
              >
                {ref}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Confidence indicator */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted">AI confidence:</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          response.confidence === "high"
            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
            : response.confidence === "medium"
              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
        }`}>
          {response.confidence}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onNewQuestion}
          className="flex-1 px-4 py-2 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Ask Another
        </button>
        <button
          onClick={onClear}
          className="px-4 py-2 border border-border rounded-xl text-sm text-muted hover:text-foreground transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}
