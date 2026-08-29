/**
 * POST /api/auth/username
 * Sets the user's username. One-time set on first login.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";

const RESERVED_USERNAMES = new Set([
  'admin', 'owner', 'system', 'eduniche', 'eduneuro', 'support', 'help',
  'root', 'mod', 'moderator', 'official', 'staff', 'team', 'bot',
  'study', 'studyroom', 'leaderboard', 'chat', 'library', 'premium',
]);

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

    const rl = checkRateLimit({ maxRequests: 5, windowMs: 60000 }, getClientIdentifier(request) + session.user.id);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const username = typeof body.username === 'string' ? body.username.trim() : "";

    // Validate
    if (!username || username.length < 3 || username.length > 20) {
      return NextResponse.json({ error: "Username must be 3-20 characters." }, { status: 400 });
    }

    const sanitized = username.toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (sanitized !== username.toLowerCase()) {
      return NextResponse.json({ error: "Username can only contain letters, numbers, and underscores." }, { status: 400 });
    }

    if (RESERVED_USERNAMES.has(sanitized)) {
      return NextResponse.json({ error: "This username is reserved." }, { status: 400 });
    }

    if (!/^[a-z0-9_]{3,20}$/.test(sanitized)) {
      return NextResponse.json({ error: "Invalid username format." }, { status: 400 });
    }

    // Check if user already has a username
    const { data: existing } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", session.user.id)
      .maybeSingle();

    if (existing?.username) {
      return NextResponse.json({ error: "Username already set." }, { status: 400 });
    }

    // Check uniqueness
    const { data: dupCheck } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", sanitized)
      .maybeSingle();

    if (dupCheck) {
      return NextResponse.json({ error: "This username is already taken." }, { status: 400 });
    }

    // Get auth provider info
    const provider = session.user.app_metadata?.provider || 'email';
    const displayName = session.user.user_metadata?.full_name ||
      session.user.user_metadata?.name ||
      session.user.email?.split('@')[0] || 'User';
    const avatarUrl = session.user.user_metadata?.avatar_url ||
      session.user.user_metadata?.picture || null;

    // Upsert profile with username
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: session.user.id,
        username: sanitized,
        display_name: displayName,
        avatar_url: avatarUrl,
        role: 'student',
        daily_goal_minutes: 120,
        timezone: 'Asia/Kolkata',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (error) {
      console.error("Profile upsert error:", error);
      return NextResponse.json({ error: "Failed to set username." }, { status: 500 });
    }

    return NextResponse.json({ success: true, username: sanitized });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
