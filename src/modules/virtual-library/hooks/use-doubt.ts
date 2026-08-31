/**
 * Hook for AI doubt engine state.
 *
 * Uses the real /api/ai/doubt endpoint which calls Groq.
 * Requires authentication — shows sign-in prompt when not logged in.
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import type { DoubtRequest, DoubtResponse } from "../types/index";

export interface UseDoubtOptions {
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
  submit: () => Promise<DoubtResponse | null>;
  /** Clear the current Q&A */
  clear: () => void;
  /** Conversation ID for follow-up questions */
  conversationId: string | null;
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** Set auth state */
  setAuthState: (auth: boolean) => void;
  /** Whether the AI service is available */
  available: boolean;
}

function classifyBranch(question: string): { branchId: string; confidence: "high" | "medium" | "low" } {
  const lower = question.toLowerCase();
  if (/\b(turing|automata|pda|regular|context.free|decidab|halting|npda|regex)\b/.test(lower)) return { branchId: "cse", confidence: "high" };
  if (/\b(dynamic.programming|knapsack|lcs|matrix.chain|optimal|subsequence|dp\b)/.test(lower)) return { branchId: "cse", confidence: "high" };
  if (/\b(dbms|normalization|sql|transaction|acid|concurrency|joins|rdbms)\b/.test(lower)) return { branchId: "cse", confidence: "high" };
  if (/\b(network|circuit|control|signals|analog|digital|ece)\b/.test(lower)) return { branchId: "ece", confidence: "medium" };
  if (/\b(machine|power|electrical|transformer|motor)\b/.test(lower)) return { branchId: "ee", confidence: "medium" };
  if (/\b(thermo|fluid|som|tom|manufacturing|heat)\b/.test(lower)) return { branchId: "me", confidence: "medium" };
  if (/\b(probability|statistics|bayes|linear.algebra|ml|deep.learning|data)\b/.test(lower)) return { branchId: "da", confidence: "medium" };
  if (/\b(structural|geotech|environmental|transport|surveying)\b/.test(lower)) return { branchId: "ce", confidence: "medium" };
  return { branchId: "cse", confidence: "low" };
}

export function useDoubt(options: UseDoubtOptions = {}): UseDoubtReturn {
  const { defaultBranchId = "cse" } = options;
  const [question, setQuestion] = useState("");
  const [branchId, setBranchId] = useState(defaultBranchId);
  const [confidence, setConfidence] = useState<"high" | "medium" | "low">("low");
  const [response, setResponse] = useState<DoubtResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isAuthenticated, setAuthState] = useState(false);

  // Check auth state on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { getChatSupabase } = await import("@/modules/chat/services/supabase");
        const supabase = getChatSupabase();
        if (supabase) {
          const { data: { user } } = await supabase.auth.getUser();
          setAuthState(!!user);
        }
      } catch {
        // Not authenticated
      }
    };
    checkAuth();
  }, []);

  const handleQuestionChange = useCallback((q: string) => {
    setQuestion(q);
    if (q.length > 5) {
      const classification = classifyBranch(q);
      setBranchId(classification.branchId);
      setConfidence(classification.confidence);
    }
  }, []);

  const [apiAvailable, setApiAvailable] = useState(false);

  // Detect API availability on mount
  // We send a POST to the endpoint — any response other than a network error
  // means the endpoint exists. 401 means the API is available but requires auth.
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch("/api/ai/doubt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: "availability check" }),
        });
        if (cancelled) return;
        // Endpoint exists if it returns anything (200, 401, 429, 503) other than 404 or network error
        setApiAvailable(res.status !== 404);
      } catch {
        if (!cancelled) setApiAvailable(false);
      }
    };
    check();
    return () => { cancelled = true; };
  }, []);

  const submit = useCallback(async (): Promise<DoubtResponse | null> => {
    if (!question.trim() || isSubmitting) return null;

    if (!isAuthenticated) {
      setError("Please sign in to use the AI assistant.");
      return null;
    }

    if (!apiAvailable) {
      setError("The AI assistant is not configured. Please set GROQ_API_KEY in the server environment.");
      return null;
    }

    setIsSubmitting(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("/api/ai/doubt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          conversationId: conversationId ?? undefined,
          branchId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }

      // Store conversation ID for follow-up
      if (data.id && !conversationId) {
        setConversationId(data.id);
      }

      const aiResponse: DoubtResponse = {
        id: data.id,
        requestId: data.requestId,
        answer: data.answer,
        references: data.references ?? [],
        confidence: data.confidence ?? "medium",
        createdAt: data.createdAt ?? new Date().toISOString(),
      };

      setResponse(aiResponse);
      return aiResponse;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [question, branchId, conversationId, isSubmitting, isAuthenticated, apiAvailable]);

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
    conversationId,
    isAuthenticated,
    setAuthState,
    available: apiAvailable,
  };
}
