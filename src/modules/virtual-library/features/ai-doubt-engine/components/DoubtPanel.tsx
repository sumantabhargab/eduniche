/**
 * DoubtPanel — floating or sidebar panel for asking doubts.
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDoubt } from "../../../hooks/use-doubt";
import { DoubtInput } from "./DoubtInput";
import { DoubtAnswer } from "./DoubtAnswer";

interface DoubtPanelProps {
  roomId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DoubtPanel({ roomId, isOpen, onClose }: DoubtPanelProps) {
  const {
    question,
    setQuestion,
    branchId,
    confidence,
    response,
    isSubmitting,
    error,
    submit,
    clear,
    available,
  } = useDoubt();

  const handleSubmit = async () => {
    await submit(roomId);
  };

  const handleClose = () => {
    clear();
    onClose();
  };

  if (!available) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col"
          style={{ maxHeight: "600px" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-lg">💡</span>
              <h3 className="font-semibold text-sm">Ask a Doubt</h3>
            </div>
            <button
              onClick={handleClose}
              className="text-muted hover:text-foreground transition-colors p-1"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!response && (
              <DoubtInput
                question={question}
                onQuestionChange={setQuestion}
                branchId={branchId}
                confidence={confidence}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                error={error}
              />
            )}

            {response && (
              <DoubtAnswer
                response={response}
                onClear={handleClose}
                onNewQuestion={() => {
                  clear();
                }}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
