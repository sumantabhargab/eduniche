/**
 * POST /api/ai/doubt/free
 *
 * Free-tier AI Doubt Engine endpoint.
 * - Allows 5 questions per day for free users
 * - Uses the same Groq AI engine but with usage tracking
 * - Premium users get unlimited via /api/ai/doubt
 */

import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import { createServerClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";

const GROQ_MODEL = "llama-3.3-70b-versatile";
const MAX_QUESTION_LENGTH = 2000;
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 10; // 10 requests per minute for free
const FREE_DAILY_LIMIT = 5;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const FREE_SYSTEM_PROMPT = `You are EduNeuro AI, an expert academic assistant for GATE (Graduate Aptitude Test in Engineering) preparation.

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

When EduNeuro library context is provided below, use it as your primary reference. Cite relevant sections by name.
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
      // Fallback: direct query
      const today = new Date().toISOString().split("T")[0];
      const { data: usage } = await supabase
        .from("doubt_usage")
        .select("message_count")
        .eq("user_id", userId)
        .eq("usage_date", today)
        .maybeSingle();
      return usage?.message_count ?? 0;
    }
    return data ?? 0;
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
      // Fallback: upsert
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabase
        .from("doubt_usage")
        .select("message_count")
        .eq("user_id", userId)
        .eq("usage_date", today)
        .maybeSingle();

      const newCount = (existing?.message_count ?? 0) + 1;
      await supabase
        .from("doubt_usage")
        .upsert(
          { user_id: userId, usage_date: today, message_count: newCount, last_message_at: new Date().toISOString() },
          { onConflict: "user_id,usage_date" }
        );
      return newCount;
    }
    return data ?? 0;
  } catch {
    return 0;
  }
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

    return `\n\nRelevant EduNeuro Library resources:\n${context}\n`;
  } catch (e: any) {
    devLog("RAG: exception", { error: e?.message });
    return "";
  }
}

async function isPremium(supabase: any, userId: string): Promise<boolean> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .maybeSingle();

    const plan = (profile as any)?.plan;
    if (plan === "monthly_premium" || plan === "weekly_premium") {
      return true;
    }

    const { data } = await supabase.rpc("has_active_subscription", {
      p_user_id: userId,
    });

    if (data === true) return true;

    // Fallback
    const { data: subs } = await supabase
      .from("user_subscriptions")
      .select("status, expires_at")
      .eq("user_id", userId)
      .eq("status", "active")
      .gte("expires_at", new Date().toISOString())
      .limit(1);

    return (subs?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

async function chatCompletion(
  groq: Groq,
  messages: ChatMessage[]
): Promise<string> {
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
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized. Please log in to use the Doubt Engine." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const question = typeof body.question === "string" ? body.question.trim() : "";
    const paperId = typeof body.paperId === "string" ? body.paperId : "";

    if (!question) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    if (question.length > MAX_QUESTION_LENGTH) {
      return NextResponse.json(
        { error: `Question too long. Maximum ${MAX_QUESTION_LENGTH} characters.` },
        { status: 400 }
      );
    }

    // Check if user is premium — if so, redirect to premium endpoint
    const premium = await isPremium(supabase, session.user.id);
    if (premium) {
      return NextResponse.json(
        { error: "Premium users should use /api/ai/doubt for unlimited access.", redirect: "/api/ai/doubt" },
        { status: 303 }
      );
    }

    // Rate limit check
    const rateId = getClientIdentifier(request);
    const rateResult = checkRateLimit(
      { maxRequests: RATE_LIMIT_MAX, windowMs: RATE_LIMIT_WINDOW },
      `doubt-free:${rateId}`
    );

    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment before trying again." },
        { status: 429 }
      );
    }

    // Daily limit check
    const usageToday = await getDoubtUsageToday(supabase, session.user.id);
    if (usageToday >= FREE_DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: `Daily limit reached. Free users get ${FREE_DAILY_LIMIT} doubts per day. Upgrade to Premium for unlimited access!`,
          limit: FREE_DAILY_LIMIT,
          used: usageToday,
          upgradeUrl: "/pricing",
        },
        { status: 403 }
      );
    }

    // Check for Groq API key
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      devLog("GROQ_API_KEY not configured");
      return NextResponse.json(
        { error: "AI service temporarily unavailable." },
        { status: 503 }
      );
    }

    // Build context from paper if specified
    let contextBlock = "";
    if (paperId) {
      const { getPaperDataSource } = await import("@/lib/gate/paper-data");
      const src = getPaperDataSource(paperId);
      if (src && src.rawData.length > 0) {
        const subjects = [...new Set(src.questions.map((q) => q.subject))].slice(0, 5);
        contextBlock = `\n\nPaper context: ${src.paper.name} (${paperId.toUpperCase()})\nSubjects: ${subjects.join(", ")}\nTotal questions in bank: ${src.questions.length}`;
      }
    }

    // Retrieve relevant content
    const ragContext = await retrieveRelevantContent(supabase, session.user.id, question);

    // Build messages
    const messages: ChatMessage[] = [
      { role: "system", content: FREE_SYSTEM_PROMPT + contextBlock + ragContext },
    ];

    // Add conversation history (last 5 turns)
    try {
      const { data: history } = await supabase
        .from("doubt_conversations")
        .select("role, content")
        .eq("user_id", session.user.id)
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
      // No history yet, that's fine
    }

    messages.push({ role: "user", content: question });

    // Call Groq
    const groq = new Groq({ apiKey: groqApiKey });
    const answer = await chatCompletion(groq, messages);

    // Increment usage counter
    const newCount = await incrementDoubtUsage(supabase, session.user.id);

    // Save conversation
    try {
      await supabase.from("doubt_conversations").insert([
        { user_id: session.user.id, role: "user", content: question, paper_id: paperId || null },
        { user_id: session.user.id, role: "assistant", content: answer, paper_id: paperId || null },
      ]);
    } catch {
      devLog("Conversation save failed", { error: true });
    }

    devLog("Response sent", { usageToday: newCount });

    return NextResponse.json({
      answer,
      usageToday: newCount,
      limit: FREE_DAILY_LIMIT,
      remaining: FREE_DAILY_LIMIT - newCount,
    });
  } catch (e: any) {
    devLog("Server error", { error: e?.message });
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  const supabase = await createServerClient();
  let used = 0;
  let remaining = FREE_DAILY_LIMIT;

  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        used = await getDoubtUsageToday(supabase, session.user.id);
        remaining = FREE_DAILY_LIMIT - used;
      }
    } catch {
      // no session
    }
  }

  return NextResponse.json({
    message: "Free-tier AI Doubt Engine",
    limit: FREE_DAILY_LIMIT,
    used,
    remaining: Math.max(0, remaining),
    description: "Free users get 5 AI-powered doubt clarifications per day. Upgrade to Premium for unlimited access.",
  });
}