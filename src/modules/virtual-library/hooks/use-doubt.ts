/**
 * Hook for AI doubt engine state.
 */

"use client";

import { useState, useCallback } from "react";
import { AIService } from "../services/ai-service";
import { mockAIProvider } from "../providers/mock-ai";
import { classifyBranch } from "../features/ai-doubt-engine/services/branch-classifier";
import type { DoubtRequest, DoubtResponse } from "../types/index";
import { createAnonymousId } from "../services/session-service";

export interface UseDoubtOptions {
  participantId?: string;
  defaultBranchId?: string;
}

export interface UseDoubtReturn {
  /** Current question text */
  question: string;
  /** Set the question text */
  setQuestion: (q: string) => void;
  /** Detected branch ID */
  branchId: string;
  /** Detected confidence */
  confidence: "high" | "medium" | "low";
  /** Current response (null if no response yet) */
  response: DoubtResponse | null;
  /** Whether the AI is processing */
  isSubmitting: boolean;
  /** Error message if any */
  error: string | null;
  /** Submit the doubt */
  submit: (roomId?: string) => Promise<DoubtResponse | null>;
  /** Clear the current Q&A */
  clear: () => void;
  /** Whether the AI engine is available */
  available: boolean;
}

export function useDoubt(options: UseDoubtOptions = {}): UseDoubtReturn {
  const { defaultBranchId = "cse" } = options;
  const participantId = options.participantId ?? createAnonymousId();
  const service = new AIService(mockAIProvider);

  const [question, setQuestion] = useState("");
  const [branchId, setBranchId] = useState(defaultBranchId);
  const [confidence, setConfidence] = useState<"high" | "medium" | "low">("low");
  const [response, setResponse] = useState<DoubtResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuestionChange = useCallback((q: string) => {
    setQuestion(q);
    if (q.length > 5) {
      const classification = classifyBranch(q);
      setBranchId(classification.branchId);
      setConfidence(classification.confidence);
    }
  }, []);

  const submit = useCallback(
    async (roomId?: string): Promise<DoubtResponse | null> => {
      if (!question.trim() || isSubmitting) return null;

      setIsSubmitting(true);
      setError(null);
      setResponse(null);

      try {
        const request: DoubtRequest = {
          id: `doubt-${Date.now()}`,
          participantId,
          roomId,
          question: question.trim(),
          branchId,
          createdAt: new Date().toISOString(),
        };

        const result = await service.askDoubt(request);
        setResponse(result);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [question, branchId, participantId, service, isSubmitting],
  );

  const clear = useCallback(() => {
    setQuestion("");
    setResponse(null);
    setError(null);
    setConfidence("low");
  }, []);

  return {
    question,
    setQuestion: handleQuestionChange,
    branchId,
    confidence,
    response,
    isSubmitting,
    error,
    submit,
    clear,
    available: service.available,
  };
}
