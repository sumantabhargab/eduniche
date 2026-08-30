/**
 * GET /api/chat/messages
 * Returns recent global chat messages.
 *
 * POST /api/chat/messages
 * Sends a new chat message (premium + auth required).
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";

async function isUserPremium(supabase: any, userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();

  const plan = (profile as any)?.plan;
  if (plan === "monthly_premium" || plan === "weekly_premium") return true;

  const { data: sub } = await supabase
    .from("user_subscriptions")
    .select("status, expires_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .gte("expires_at", new Date().toISOString())
    .maybeSingle();

  return !!sub;
}

// GET - Recent messages
export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);

    // Premium gating — chat requires active subscription or plan
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const premium = await isUserPremium(supabase, session.user.id);
      if (!premium) {
        return NextResponse.json({ error: "Premium required.", upgradeRequired: true }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Premium required.", upgradeRequired: true }, { status: 403 });
    }

    const { data: messages, error } = await supabase
      .from("chat_messages")
      .select("id, user_id, content, content_type, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Chat messages error:", error);
      return NextResponse.json({ error: "Failed to load messages." }, { status: 500 });
    }

    // Get user info for each message
    const userIds = [...new Set((messages ?? []).map(m => m.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", userIds);

    const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

    // Check if current user is muted
    let isMuted = false;
    let isBanned = false;

    if (session?.user) {
      const { data: mute } = await supabase
        .from("muted_users")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      isMuted = !!mute;

      const { data: ban } = await supabase
        .from("banned_users")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      isBanned = !!ban;
    }

    const enrichedMessages = (messages ?? [])
      .reverse()
      .map(m => {
        const profile = profileMap.get(m.user_id);
        return {
          id: m.id,
          user_id: m.user_id,
          content: m.content,
          content_type: m.content_type,
          created_at: m.created_at,
          username: profile?.username || profile?.display_name || "Anonymous",
          avatar_url: profile?.avatar_url || null,
        };
      });

    return NextResponse.json({
      messages: enrichedMessages,
      isMuted,
      isBanned,
    });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}

// POST - Send message
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // Check ban
    const { data: banCheck } = await supabase
      .from("banned_users")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (banCheck) {
      return NextResponse.json({ error: "You have been banned from chat." }, { status: 403 });
    }

    // Check mute
    const { data: muteCheck } = await supabase
      .from("muted_users")
      .select("id")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (muteCheck) {
      return NextResponse.json({ error: "You are muted." }, { status: 403 });
    }

    // Rate limit
    const rl = checkRateLimit({ maxRequests: 10, windowMs: 60000 }, getClientIdentifier(request) + session.user.id);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many messages. Please slow down." }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const content = typeof body.content === 'string' ? body.content.trim() : "";

    if (!content || content.length === 0) {
      return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
    }
    if (content.length > 1000) {
      return NextResponse.json({ error: "Message too long. Max 1000 characters." }, { status: 400 });
    }

    // Sanitize content - escape HTML
    const sanitized = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    // Check for spam patterns
    if (sanitized === sanitized.toUpperCase() && sanitized.length > 20) {
      return NextResponse.json({ error: "Please don't use all caps." }, { status: 400 });
    }

    const { data: message, error } = await supabase
      .from("chat_messages")
      .insert({
        user_id: session.user.id,
        content: sanitized,
        content_type: "text",
      })
      .select("id, user_id, content, content_type, created_at")
      .single();

    if (error) {
      console.error("Chat send error:", error);
      return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
    }

    // Get user profile for response
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, display_name, avatar_url")
      .eq("id", session.user.id)
      .maybeSingle();

    return NextResponse.json({
      ...message,
      username: profile?.username || profile?.display_name || "Anonymous",
      avatar_url: profile?.avatar_url || null,
    }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
