/**
 * POST /api/ai/doubt
 *
 * AI Doubt Engine endpoint.
 * - Validates premium access
 * - Retrieves relevant EduNeuro content
 * - Calls Groq API server-side via SDK
 * - Returns grounded response
 */

import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import { createServerClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";

const GROQ_MODEL = "openai/gpt-oss-120b";
const MAX_QUESTION_LENGTH = 2000;
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 20;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
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
- Use markdown formatting for readability

When EduNeuro library context is provided below, use it as your primary reference. Cite relevant sections by name.
If the context doesn't contain enough information, say so clearly rather than guessing.`;

function devLog(message: string, data?: Record<string, unknown>) {
  const ts = new Date().toISOString().slice(11, 23);
  console.log(`[AI-DOUBT ${ts}] ${message}`, data ?? "");
}

async function retrieveRelevantContent(
  supabase: any,
  userId: string,
  question: string
): Promise<string> {
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

    return `\n\nRelevant EduNeuro Library resources:\n${context}\n`;
  } catch (e: any) {
    devLog("RAG: exception", { error: e?.message });
    return "";
  }
}

async function validatePremium(supabase: any, userId: string): Promise<boolean> {
  try {
    // Check plan first (fast, no RPC needed)
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .maybeSingle();

    const plan = (profile as any)?.plan;
    if (plan === "monthly_premium" || plan === "weekly_premium") {
      return true;
    }

    // Fallback: check active subscription
    const { data, error } = await supabase.rpc("has_active_subscription", {
      p_user_id: userId,
    });

    if (error) {
      devLog("Premium: RPC error, falling back to direct query", { error: error.message });
      const { data: subs } = await supabase
        .from("user_subscriptions")
        .select("status, expires_at")
        .eq("user_id", userId)
        .eq("status", "active")
        .gte("expires_at", new Date().toISOString())
        .limit(1);

      return (subs?.length ?? 0) > 0;
    }

    return data === true;
  } catch (e: any) {
    devLog("Premium: validation exception", { error: e?.message });
    return false;
  }
}

async function getConversationHistory(
  supabase: any,
  conversationId: string
): Promise<ChatMessage[]> {
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

export async function POST(request: Request) {
  try {
    // --- 0. Server / env check ---
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      devLog("ERROR: GROQ_API_KEY not configured");
      return NextResponse.json(
        { error: "AI engine not configured.", detail: "Missing GROQ_API_KEY" },
        { status: 500 }
      );
    }
    devLog("GROQ_API_KEY configured: true");

    // --- 1. Auth ---
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      devLog("Auth: no session");
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    devLog("Auth: user authenticated", { userId: session.user.id });

    // --- 2. Rate limit ---
    const rl = checkRateLimit(
      { maxRequests: RATE_LIMIT_MAX, windowMs: RATE_LIMIT_WINDOW },
      getClientIdentifier(request) + session.user.id
    );
    if (!rl.allowed) {
      devLog("Rate limit: exceeded");
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // --- 3. Free tier or Premium check ---
    let isPremium = false;
    const doubtUsageLimit = parseInt(process.env.NEXT_PUBLIC_FREE_DOUBT_LIMIT || "5");
    let usage = 0;

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", session.user.id)
        .maybeSingle();

      const plan = (profile as any)?.plan;
      isPremium = plan === "monthly_premium" || plan === "weekly_premium";
    } catch {
      // Fallback below
    }

    if (!isPremium) {
      const { data: usageDataVal } = await supabase.rpc("get_doubt_usage_today", {
        p_user_id: session.user.id,
      });

      usage = (usageDataVal as number) ?? 0;
      if (usage >= doubtUsageLimit) {
        devLog("Free doubt limit reached", { usage, limit: doubtUsageLimit, userId: session.user.id });
        return NextResponse.json(
          {
            error: `Free tier limit reached (${doubtUsageLimit} messages/day). Upgrade to Premium for unlimited access.`,
            upgradeRequired: true,
            usage,
            limit: doubtUsageLimit,
          },
          { status: 429 }
        );
      }

      // Atomically increment usage
      await supabase.rpc("increment_doubt_usage", {
        p_user_id: session.user.id,
      });
    }
    devLog(isPremium ? "Premium: user has active subscription" : "Free: user within doubt limit");

    let remainingMessages = -1;
    if (!isPremium) {
      remainingMessages = Math.max(0, doubtUsageLimit - usage - 1);
    }

    // --- 4. Parse request ---
    const body = await request.json().catch(() => ({}));
    const question = typeof body.question === "string" ? body.question.trim() : "";
    const conversationId =
      typeof body.conversationId === "string" ? body.conversationId : null;

    if (!question || question.length === 0) {
      return NextResponse.json({ error: "Please ask a question." }, { status: 400 });
    }
    if (question.length > MAX_QUESTION_LENGTH) {
      return NextResponse.json(
        { error: `Question too long. Max ${MAX_QUESTION_LENGTH} characters.` },
        { status: 400 }
      );
    }
    devLog("Request: question received", { length: question.length, conversationId });

    // --- 5. RAG / Library retrieval ---
    const libraryContext = await retrieveRelevantContent(
      supabase,
      session.user.id,
      question
    );

    // --- 6. Build messages ---
    const systemPrompt = libraryContext
      ? DEFAULT_SYSTEM_PROMPT + libraryContext
      : DEFAULT_SYSTEM_PROMPT;

    const messages: ChatMessage[] = [{ role: "system", content: systemPrompt }];

    if (conversationId) {
      const history = await getConversationHistory(supabase, conversationId);
      messages.push(...history);
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

    let finalConversationId = conversationId;

    // --- 7. Call Groq ---
    devLog("Groq: starting request", { model: GROQ_MODEL, messageCount: messages.length });

    let answer = "";
    let confidence: "high" | "medium" | "low" = "medium";

    try {
      const groq = new Groq({ apiKey: groqApiKey });

      const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages,
        max_tokens: 2048,
        temperature: 0.7,
        top_p: 0.9,
      });

      answer = completion.choices?.[0]?.message?.content || "";

      if (!answer) {
        devLog("Groq: empty response");
        answer =
          "I received an empty response. Please try rephrasing your question.";
        confidence = "low";
      } else {
        devLog("Groq: response received", { length: answer.length });
        confidence = "high";
      }
    } catch (groqError: any) {
      devLog("Groq: API call failed", {
        message: groqError?.message,
        status: groqError?.status,
        code: groqError?.code,
        type: groqError?.type,
        name: groqError?.name,
      });

      if (groqError?.status === 429) {
        return NextResponse.json(
          { answer: "EduNeuro is temporarily busy. Please try again in a moment.", confidence: "low" },
          { status: 200 }
        );
      }
      if (groqError?.status === 401) {
        devLog("Groq: authentication error — check GROQ_API_KEY");
        return NextResponse.json(
          { error: "AI authentication failed.", detail: "Invalid API key" },
          { status: 500 }
        );
      }

      answer = "I'm having trouble processing your question right now. Please try again in a moment.";
      confidence = "low";
    }

    // Save assistant message
    if (conversationId && answer) {
      await supabase.from("ai_messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: answer,
      });
    }

    return NextResponse.json({
      answer,
      confidence,
      references: [],
      conversationId: finalConversationId,
      isPremium,
      remainingMessages: remainingMessages,
    });
  } catch (e: any) {
    devLog("FATAL: unhandled error", {
      message: e?.message,
      stack: e?.stack?.split("\n").slice(0, 3).join("\n"),
    });
    return NextResponse.json(
      { error: "An unexpected server error occurred." },
      { status: 500 }
    );
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
