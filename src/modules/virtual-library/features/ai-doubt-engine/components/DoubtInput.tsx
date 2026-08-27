/**
 * DoubtInput — question input with branch/subject hints.
 */

import { motion } from "framer-motion";
import type { StudyPlan } from "../../../types/index";

interface DoubtInputProps {
  question: string;
  onQuestionChange: (q: string) => void;
  branchId: string;
  confidence: "high" | "medium" | "low";
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string | null;
}

const BRANCH_HINTS: Record<string, { name: string; icon: string }> = {
  cse: { name: "Computer Science", icon: "💻" },
  ece: { name: "Electronics & Comm.", icon: "📡" },
  ee: { name: "Electrical Engg.", icon: "⚡" },
  me: { name: "Mechanical Engg.", icon: "⚙️" },
  ce: { name: "Civil Engg.", icon: "🏗️" },
  in: { name: "Instrumentation", icon: "📊" },
  pi: { name: "Production & Ind.", icon: "🏭" },
};

export function DoubtInput({
  question,
  onQuestionChange,
  branchId,
  confidence,
  onSubmit,
  isSubmitting,
  error,
}: DoubtInputProps) {
  return (
    <div className="space-y-4">
      {/* Question input */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          Your question
        </label>
        <textarea
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          placeholder="Type your GATE doubt here... e.g., 'Explain Turing Machine construction'"
          rows={4}
          disabled={isSubmitting}
          className="w-full px-3 py-2 bg-accent/30 border border-border rounded-xl text-sm
            placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-foreground/30
            disabled:opacity-50 resize-none"
        />
      </div>

      {/* Branch detection */}
      {question.length > 5 && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm"
        >
          <span className="text-muted">Detected topic:</span>
          {BRANCH_HINTS[branchId] ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent rounded-lg">
              <span>{BRANCH_HINTS[branchId].icon}</span>
              <span>{BRANCH_HINTS[branchId].name}</span>
            </span>
          ) : (
            <span className="text-muted">{branchId}</span>
          )}
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${
            confidence === "high"
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
              : confidence === "medium"
                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600"
          }`}>
            {confidence} confidence
          </span>
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={!question.trim() || isSubmitting}
        className="w-full py-2.5 bg-foreground text-background rounded-xl font-medium
          hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
            Thinking...
          </span>
        ) : (
          "Get Answer"
        )}
      </button>

      <p className="text-xs text-muted text-center">
        AI-generated answers are for learning assistance only. Verify with standard references.
      </p>
    </div>
  );
}
