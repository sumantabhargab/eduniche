/**
 * POST /api/ai/doubt
 *
 * AI Doubt Engine endpoint.
 * - Validates premium access
 * - Retrieves relevant EduNeuro content
 * - Calls Groq API server-side
 * - Returns grounded response
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MAX_QUESTION_LENGTH = 2000;
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_MAX = 20;

interface ChatMessage {
  role: "user" | "assistant" | "system";
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

When EduNeuro library context is provided below, use it as your primary reference. Cite relevant sections.
If the context doesn't contain enough information, say so clearly rather than guessing.`;

async function retrieveRelevantContent(
  supabase: any,
  userId: string,
  question: string
): Promise<string> {
  try {
    // Simple keyword-based retrieval from published content
    const keywords = question
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3)
      .slice(0, 10);

    if (keywords.length === 0) return "";

    const searchTerm = keywords.join(' ');

    const { data: resources } = await supabase
      .from("content_resources")
      .select("name, description, branch, subject, resource_type")
      .eq("visibility", "published")
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .limit(5);

    if (!resources || resources.length === 0) return "";

    // In a full implementation, you would also extract and chunk document text here
    // For MVP, we return relevant metadata as context
    const context = (resources ?? []).map((r: any) =>
      `[${r.resource_type || 'Resource'}] ${r.name} (${r.subject || r.branch || 'General'})`
    ).join('\n');

    return `\n\nRelevant EduNeuro Library resources:\n${context}\n`;
  } catch (e) {
    return "";
  }
}

async function validatePremium(supabase: any, userId: string): Promise<boolean> {
  try {
    // Check via RPC function
    const { data, error } = await supabase.rpc('has_active_subscription', {
      p_user_id: userId
    });

    if (error) {
      // Fallback: check subscriptions table directly
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
  } catch (e) {
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

    return (messages ?? []).map((m: any) => ({ role: m.role as ChatMessage["role"], content: m.content }));
  } catch (e) {
    return [];
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }
    const sb = supabase; // non-null from here

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // Rate limit
    const rl = checkRateLimit({ maxRequests: RATE_LIMIT_MAX, windowMs: RATE_LIMIT_WINDOW },
      getClientIdentifier(request) + session.user.id);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    // Check premium access
    const isPremium = await validatePremium(sb, session.user.id);
    if (!isPremium) {
      return NextResponse.json({
        error: "Premium required.",
        upgradeRequired: true,
        plans: {
          weekly: { price: 20, currency: "INR", period: "week" },
          monthly: { price: 49, currency: "INR", period: "month" },
        }
      }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const question = typeof body.question === 'string' ? body.question.trim() : "";
    const conversationId = typeof body.conversationId === 'string' ? body.conversationId : null;

    if (!question || question.length === 0) {
      return NextResponse.json({ error: "Please ask a question." }, { status: 400 });
    }
    if (question.length > MAX_QUESTION_LENGTH) {
      return NextResponse.json({ error: `Question too long. Max ${MAX_QUESTION_LENGTH} characters.` }, { status: 400 });
    }

    // Check for image upload
    let hasImage = false;
    const formData = await request.formData().catch(() => null);
    const imageFile = formData?.get("image") as File | null;
    if (imageFile && imageFile.size > 0) {
      hasImage = true;
    }

    // Get Groq API key (server-side only)
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        answer: "The AI engine is not configured. Please add GROQ_API_KEY to the server environment.",
        confidence: "low",
        references: [],
      }, { status: 200 });
    }

    // Retrieve relevant library context
    const libraryContext = await retrieveRelevantContent(sb, session.user.id, question);

    // Get conversation history
    let messages: ChatMessage[] = [
      { role: "system", content: DEFAULT_SYSTEM_PROMPT + libraryContext },
    ];

    let finalConversationId = conversationId;

    if (conversationId) {
      const history = await getConversationHistory(sb, conversationId);
      messages.push(...history);
    }

    messages.push({ role: "user", content: question });

    // Save user message
    if (conversationId) {
      await sb.from("ai_messages").insert({
        conversation_id: conversationId,
        role: "user",
        content: question,
      });
    }

    // Call Groq
    let answer = "";
    let confidence: string = "medium";

    try {
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
          messages,
          max_tokens: 2048,
          temperature: 0.7,
          top_p: 0.9,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Groq API error:", response.status, errorBody);
        answer = "I'm having trouble processing your question right now. Please try again in a moment.";
        confidence = "low";
      } else {
        const data = await response.json();
        answer = data.choices?.[0]?.message?.content || "I couldn't generate a response. Please try again.";
        confidence = "high";
      }
    } catch (e) {
      console.error("Groq API call failed:", e);
      answer = "I'm having trouble connecting right now. Please check your connection and try again.";
      confidence = "low";
    }

    // Save assistant message
    if (conversationId) {
      await sb.from("ai_messages").insert({
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
    });
  } catch (e) {
    console.error("AI doubt error:", e);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
