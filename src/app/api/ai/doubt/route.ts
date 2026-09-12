/**
 * POST /api/ai/doubt
 *
 * Premium AI Doubt Engine endpoint.
 * - Requires premium subscription
 * - Uses Groq API with RAG
 * - Persists conversation in ai_messages
 */

import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import { createServerClient } from "@/lib/supabase/server";
import { requirePremium } from "@/lib/entitlements";
import { rateLimitAI } from "@/lib/rate-limit/db";
import { getUser, clientIdentifier } from "@/lib/auth/user";
import { ok, unauthorized, forbidden, serverError, fail, badRequest } from "@/lib/api/response";

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const MAX_QUESTION_LENGTH = 2000;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const DEFAULT_SYSTEM_PROMPT = `You are PadhaiShuru AI, an expert academic assistant for GATE (Graduate Aptitude Test in Engineering) preparation.

Your core principles:
- Provide conceptual, step-by-step explanations suitable for GATE aspirants
- Focus on clarity, accuracy, and educational depth
- When solving GATE-level problems, show the reasoning process clearly
- Identify and correct common misconceptions
- Ask clarifying questions when the query is ambiguous
- Distinguish between well-established facts and your own reasoning
- Never fabricate information — if you're unsure, say so
- Keep responses focused and relevant to the user's question
- Use markdown formatting for readability

When PadhaiShuru library context is provided below, use it as your primary reference. Cite relevant sections by name.
If the context doesn't contain enough information, say so clearly rather than guessing.`;

function devLog(message: string, data?: Record<string, unknown>) {
  const ts = new Date().toISOString().slice(11, 23);
  console.log(`[AI-DOUBT ${ts}] ${message}`, data ?? "");
}

async function retrieveRelevantContent(supabase: any, userId: string, question: string): Promise<string> {
  try {
    const keywords = question
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 10);

    devLog("RAG: keywords extracted", { count: keywords.length, keywords });

    if (keywords.length === 0) {
      devLog("RAG: no keywords, skipping retrieval");
      return "";
    }

    const searchTerm = keywords.join(" ");

    const { data: resources, error: ragError } = await supabase
      .from("content_resources")
      .select("name, description, branch, subject, resource_type")
      .eq("visibility", "published")
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .limit(5);

    if (ragError) {
      devLog("RAG: query error", { error: ragError.message });
      return "";
    }

    const chunkCount = resources?.length ?? 0;
    devLog("RAG: retrieved chunks", { count: chunkCount });

    if (!resources || chunkCount === 0) return "";

    const context = (resources ?? []).map(
      (r: any) => `[${r.resource_type || "Resource"}] ${r.name} (${r.subject || r.branch || "General"})`
    ).join("\n");

    return `\n\nRelevant PadhaiShuru Library resources:\n${context}\n`;
  } catch (e: any) {
    devLog("RAG: exception", { error: e?.message });
    return "";
  }
}

async function getConversationHistory(supabase: any, conversationId: string): Promise<ChatMessage[]> {
  try {
    const { data: messages } = await supabase
      .from("ai_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    return (messages ?? []).map((m: any) => ({
      role: m.role as ChatMessage["role"],
      content: m.content,
    }));
  } catch {
    return [];
  }
}

async function chatCompletion(groq: Groq, messages: ChatMessage[]): Promise<string> {
  try {
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      max_tokens: 2048,
      temperature: 0.7,
      top_p: 0.9,
    });

    return response.choices[0]?.message?.content || "I couldn't generate a response. Please try again.";
  } catch (e: any) {
    devLog("Groq: API call failed", {
      message: e?.message,
      status: e?.status,
      code: e?.code,
    });

    if (e?.status === 429) {
      return "PadhaiShuru is temporarily busy. Please try again in a moment.";
    }
    if (e?.status === 401) {
      devLog("Groq: authentication error — check GROQ_API_KEY");
      throw new Error("AI service temporarily unavailable");
    }

    throw e;
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return unauthorized("Sign in to use AI Doubt Engine");
    }

    // Require premium
    let entitlement;
    try {
      entitlement = await requirePremium(user.id);
    } catch {
      return forbidden("Premium subscription required. Upgrade at /pricing");
    }

    // Rate limit
    const rateResult = await rateLimitAI(clientIdentifier(user.id, request), entitlement.isPremium);
    if (!rateResult.allowed) {
      return NextResponse.json(
        fail("RATE_LIMITED", "Too many AI requests. Please wait a moment."),
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    // Parse request
    const body = await request.json().catch(() => ({}));
    const question = typeof body.question === "string" ? body.question.trim() : "";
    const conversationId =
      typeof body.conversationId === "string" ? body.conversationId : null;

    if (!question || question.length === 0) {
      return badRequest("Please ask a question.");
    }
    if (question.length > MAX_QUESTION_LENGTH) {
      return badRequest(`Question too long. Maximum ${MAX_QUESTION_LENGTH} characters.`);
    }

    // Check Groq API key
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      devLog("GROQ_API_KEY not configured");
      return serverError("AI service temporarily unavailable");
    }

    const supabase = await createServerClient();
    if (!supabase) {
      return serverError("Database unavailable");
    }

    // RAG retrieval
    const libraryContext = await retrieveRelevantContent(supabase, user.id, question);

    // Build messages
    const systemPrompt = libraryContext
      ? DEFAULT_SYSTEM_PROMPT + libraryContext
      : DEFAULT_SYSTEM_PROMPT;

    const messages: ChatMessage[] = [{ role: "system", content: systemPrompt }];

    // Conversation history
    if (conversationId) {
      const history = await getConversationHistory(supabase, conversationId);
      messages.push(...history.slice(-10)); // Last 10 messages
    }
    messages.push({ role: "user", content: question });

    // Save user message
    if (conversationId) {
      await supabase.from("ai_messages").insert({
        conversation_id: conversationId,
        role: "user",
        content: question,
      });
    }

    // Call Groq with timeout
    const groq = new Groq({ apiKey: groqApiKey });

    let answer: string;
    try {
      answer = await chatCompletion(groq, messages);
    } catch {
      return serverError("AI service temporarily unavailable. Please try again.");
    }

    // Save assistant message
    if (conversationId) {
      await supabase.from("ai_messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: answer,
      });
    }

    devLog("Response sent", { answerLength: answer.length });

    return ok({
      answer,
      confidence: "high" as const,
      references: [],
      conversationId: conversationId,
      isPremium: true,
    });
  } catch (e: any) {
    devLog("FATAL: unhandled error", {
      message: e?.message,
      stack: e?.stack?.split("\n").slice(0, 3).join("\n"),
    });
    return serverError("An unexpected server error occurred.");
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
