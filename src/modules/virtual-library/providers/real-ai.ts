/**
 * Groq AI service — calls the Groq API for real AI responses.
 *
 * The Groq API key is NEVER exposed to the browser.
 * All calls go through a server-side API endpoint at /api/ai/doubt.
 */

import type { AIProvider, LibraryAuthContext } from "../types/adapters";
import type { DoubtRequest, DoubtResponse } from "../types/index";

export interface GroqConfig {
  apiKey: string;
  model: string;
  systemPrompt: string;
}

const DEFAULT_SYSTEM_PROMPT = `You are EduNeuro AI, an expert academic assistant for GATE (Graduate Aptitude Test in Engineering) preparation.

Your core principles:
- Provide conceptual, step-by-step explanations suitable for GATE aspirants
- Focus on clarity, accuracy, and educational depth
- When solving GATE-level problems, show the reasoning process clearly
- Identify and correct common misconceptions
- Ask clarifying questions when the query is ambiguous
- Distinguish between well-established facts and your own reasoning
- Never fabricate information — if you're unsure, say so
- Keep responses focused and relevant to the user's question
- Use markdown formatting for readability (headings, bullet points, code blocks where appropriate)

If the user asks about specific EduNeuro resources or content that hasn't been provided as context, acknowledge this limitation rather than pretending access.`;

export class GroqAIProvider implements AIProvider {
  readonly available: boolean;
  private readonly config: GroqConfig;
  private conversationHistory: Map<string, Array<{ role: string; content: string }>> = new Map();

  constructor(config: Partial<GroqConfig> = {}) {
    const apiKey = config.apiKey ?? process.env.GROQ_API_KEY ?? "";
    this.config = {
      apiKey,
      model: config.model ?? process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      systemPrompt: config.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
    };
    this.available = apiKey.length > 0;
  }

  async askDoubt(request: DoubtRequest): Promise<DoubtResponse> {
    if (!this.available) {
      throw new Error("AI service is not configured.");
    }

    const response = await fetch("/api/ai/doubt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: request.question,
        conversationId: request.id,
        branchId: request.branchId,
        subjectId: request.subjectId,
        topic: request.topic,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error ?? `AI service error (${response.status})`);
    }

    const data = await response.json();
    return data as DoubtResponse;
  }
}

/** Singleton with default config. */
export const groqAIProvider = new GroqAIProvider();
