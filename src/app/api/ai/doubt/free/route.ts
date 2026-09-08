/**
 * POST /api/ai/doubt/free
 *
 * Free-tier AI Doubt Engine endpoint.
 * - Allows 5 questions per day for free users
 * - Premium users get unlimited via /api/ai/doubt
 */

import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import { createServerClient } from "@/lib/supabase/server";
import { requirePremium } from "@/lib/entitlements";
import { rateLimitAI } from "@/lib/rate-limit/db";
import { getUser, clientIdentifier } from "@/lib/auth/user";
import { ok, unauthorized, badRequest, forbidden, serverError } from "@/lib/api/response";

const GROQ_MODEL = "openai/gpt-oss-120b";
const MAX_QUESTION_LENGTH = 2000;
const FREE_DAILY_LIMIT = 5;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const FREE_SYSTEM_PROMPT = `You are PadhaiShuru AI, an expert academic assistant for GATE (Graduate Aptitude Test in Engineering) preparation.

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
- Be encouraging and helpful — the user is on the free tier and learning

When PadhaiShuru library context is provided below, use it as your primary reference. Cite relevant sections by name.
If the context doesn't contain enough information, say so clearly rather than guessing.`;

function devLog(message: string, data?: Record<string, unknown>) {
  const ts = new Date().toISOString().slice(11, 23);
  console.log(`[AI-DOUBT-FREE ${ts}] ${message}`, data ?? "");
}

async function getDoubtUsageToday(supabase: any, userId: string): Promise<number> {
  try {
    const { data, error } = await supabase.rpc("get_doubt_usage_today", {
      p_user_id: userId,
    });
    if (error) {
      const today = new Date().toISOString().split("T")[0];
      const { data: usage } = await supabase
        .from("doubt_usage_tracking")
        .select("message_count")
        .eq("user_id", userId)
        .eq("usage_date", today)
        .maybeSingle();
      return usage?.message_count ?? 0;
    }
    return (data as number) ?? 0;
  } catch {
    return 0;
  }
}

async function incrementDoubtUsage(supabase: any, userId: string): Promise<number> {
  try {
    const { data, error } = await supabase.rpc("increment_doubt_usage", {
      p_user_id: userId,
    });
    if (error) {
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabase
        .from("doubt_usage_tracking")
        .select("message_count")
        .eq("user_id", userId)
        .eq("usage_date", today)
        .maybeSingle();

      const newCount = (existing?.message_count ?? 0) + 1;
      await supabase
        .from("doubt_usage_tracking")
        .upsert(
          { user_id: userId, usage_date: today, message_count: newCount, last_message_at: new Date().toISOString() },
          { onConflict: "user_id,usage_date" }
        );
      return newCount;
    }
    return (data as number) ?? 0;
  } catch {
    return 0;
  }
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

    const { data: resources } = await supabase
      .from("content_resources")
      .select("name, description, branch, subject, resource_type")
      .eq("visibility", "published")
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .limit(5);

    const chunkCount = resources?.length ?? 0;
    devLog("RAG: retrieved chunks", { count: chunkCount });

    if (!resources || chunkCount === 0) return "";

    const context = resources
      .map((r: any) => `[${r.resource_type || "Resource"}] ${r.name} (${r.subject || r.branch || "General"})`)
      .join("\n");

    return `\n\nRelevant PadhaiShuru Library resources:\n${context}\n`;
  } catch (e: any) {
    devLog("RAG: exception", { error: e?.message });
    return "";
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
      max_tokens: 1024,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content ?? "I couldn't generate a response. Please try again.";
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
      return unauthorized("Sign in to use the Doubt Engine");
    }

    const supabase = await createServerClient();
    if (!supabase) {
      return serverError("Database unavailable");
    }

    // Check if user is premium — they should use the premium endpoint
    try {
      const entitlement = await requirePremium(user.id);
      // Premium user on free endpoint — return clear response telling them to use premium endpoint
      return forbidden(
        "You have Premium access. Use /api/ai/doubt for the full experience.",
        { upgradeUrl: "/api/ai/doubt" }
      );
    } catch {
      // Not premium — proceed with free-tier logic
    }

    // Rate limit
    const rateResult = await rateLimitAI(clientIdentifier(user.id, request), false);
    if (!rateResult.allowed) {
      return NextResponse.json(
        fail("RATE_LIMITED", "Too many requests. Please wait a moment."),
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const body = await request.json().catch(() => ({}));
    const question = typeof body.question === "string" ? body.question.trim() : "";
    const paperId = typeof body.paperId === "string" ? body.paperId : "";

    if (!question) {
      return badRequest("Question is required.");
    }
    if (question.length > MAX_QUESTION_LENGTH) {
      return badRequest(`Question too long. Maximum ${MAX_QUESTION_LENGTH} characters.`);
    }

    // Daily limit check
    const usageToday = await getDoubtUsageToday(supabase, user.id);
    if (usageToday >= FREE_DAILY_LIMIT) {
      return forbidden(
        `Daily limit reached. Free users get ${FREE_DAILY_LIMIT} doubts per day. Upgrade to Premium for unlimited access.`,
        { limit: FREE_DAILY_LIMIT, used: usageToday, upgradeUrl: "/pricing" }
      );
    }

    // Check for Groq API key
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      devLog("GROQ_API_KEY not configured");
      return serverError("AI service temporarily unavailable.");
    }

    // Build context from paper if specified
    let contextBlock = "";
    if (paperId) {
      try {
        const { getPaperDataSource } = await import("@/lib/gate/paper-data");
        const src = getPaperDataSource(paperId);
        if (src && src.rawData.length > 0) {
          const subjects = [...new Set(src.questions.map((q: any) => q.subject))].slice(0, 5);
          contextBlock = `\n\nPaper context: ${src.paper.name} (${paperId.toUpperCase()})\nSubjects: ${subjects.join(", ")}\nTotal questions in bank: ${src.questions.length}`;
        }
      } catch {
        // Paper data not available
      }
    }

    // Retrieve relevant content
    const ragContext = await retrieveRelevantContent(supabase, user.id, question);

    // Build messages
    const messages: ChatMessage[] = [
      { role: "system", content: FREE_SYSTEM_PROMPT + contextBlock + ragContext },
    ];

    // Add conversation history (last 5 turns from doubt_conversations)
    try {
      const { data: history } = await supabase
        .from("doubt_conversations")
        .select("role, content")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (history && history.length > 0) {
        const recentHistory = history.reverse();
        for (const msg of recentHistory) {
          if (msg.role !== "system") {
            messages.push({ role: msg.role as "user" | "assistant", content: msg.content });
          }
        }
      }
    } catch {
      // No history yet
    }

    messages.push({ role: "user", content: question });

    // Call Groq
    const groq = new Groq({ apiKey: groqApiKey });
    let answer: string;
    try {
      answer = await chatCompletion(groq, messages);
    } catch {
      return serverError("AI service temporarily unavailable. Please try again.");
    }

    // Increment usage counter
    const newCount = await incrementDoubtUsage(supabase, user.id);

    // Save conversation
    try {
      await supabase.from("doubt_conversations").insert([
        { user_id: user.id, role: "user", content: question, paper_id: paperId || null },
        { user_id: user.id, role: "assistant", content: answer, paper_id: paperId || null },
      ]);
    } catch (err) {
      devLog("Conversation save failed", { error: true });
    }

    devLog("Response sent", { usageToday: newCount });

    return ok({
      answer,
      usageToday: newCount,
      limit: FREE_DAILY_LIMIT,
      remaining: FREE_DAILY_LIMIT - newCount,
    });
  } catch (e: any) {
    devLog("Server error", { error: e?.message });
    return serverError("An error occurred. Please try again.");
  }
}

export async function GET() {
  const user = await getUser();
  let used = 0;
  let remaining = FREE_DAILY_LIMIT;

  if (user) {
    try {
      const supabase = await createServerClient();
      if (!supabase) {
        return ok({
          message: "Free-tier AI Doubt Engine",
          limit: FREE_DAILY_LIMIT,
          used: 0,
          remaining: FREE_DAILY_LIMIT,
          description: "Free users get 5 AI-powered doubt clarifications per day. Upgrade to Premium for unlimited access.",
        });
      }
      used = await getDoubtUsageToday(supabase, user.id);
      remaining = FREE_DAILY_LIMIT - used;
    } catch {
      // no session
    }
  }

  return ok({
    message: "Free-tier AI Doubt Engine",
    limit: FREE_DAILY_LIMIT,
    used,
    remaining: Math.max(0, remaining),
    description: "Free users get 5 AI-powered doubt clarifications per day. Upgrade to Premium for unlimited access.",
  });
}
