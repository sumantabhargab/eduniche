/**
 * POST /api/auth/username
 * Sets the user's username. One-time set on first login.
 *
 * Supports two flows:
 * 1. New OAuth user (no profile row) — INSERT creates the profile.
 * 2. Existing user without username — UPDATE adds it.
 *
 * Profiles are created by this endpoint or via the DB trigger
 * (profiles_id_fkey → auto-insert on auth.users INSERT).
 * New OAuth users who reach this endpoint without a profile row
 * can be re-authenticated to trigger the trigger-based creation.
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limit";

const RESERVED_USERNAMES = new Set([
  'admin', 'owner', 'system', 'eduniche', 'eduneuro', 'support', 'help',
  'root', 'mod', 'moderator', 'official', 'staff', 'team', 'bot',
  'study', 'studyroom', 'leaderboard', 'chat', 'library', 'premium',
]);

function isPostgrestUniqueViolation(error: { code?: string; message?: string }): boolean {
  return error?.code === '23505' || /duplicate key|unique constraint|already exists/i.test(error?.message || '');
}

function isPostgrestPolicyError(error: { code?: string; message?: string }): boolean {
  return error?.code === '42501' || /row-level security|policy violation|RLS/i.test(error?.message || '');
}

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

    // Validate format
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

    const userId = session.user.id;

    // Check if a profile row exists for this user
    const { data: existing } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .maybeSingle();

    if (existing?.username) {
      return NextResponse.json({ error: "Username already set." }, { status: 400 });
    }

    // Check username uniqueness across all profiles
    const { data: dupCheck } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", sanitized)
      .maybeSingle();

    if (dupCheck) {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }

    // Collect profile data from OAuth or email signup
    const provider = session.user.app_metadata?.provider || 'email';
    const displayName = session.user.user_metadata?.full_name ||
      session.user.user_metadata?.name ||
      session.user.email?.split('@')[0] || 'User';
    const avatarUrl = session.user.user_metadata?.avatar_url ||
      session.user.user_metadata?.picture || null;

    const profileData: Record<string, unknown> = {
      id: userId,
      username: sanitized,
      display_name: displayName,
      avatar_url: avatarUrl,
      role: 'student',
      daily_goal_minutes: 120,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
      updated_at: new Date().toISOString(),
    };

    let profileError: { code?: string; message?: string } | null = null;

    if (existing) {
      // Profile exists without username — UPDATE
      const { error } = await supabase
        .from("profiles")
        .update(profileData)
        .eq("id", userId);

      profileError = error;
    } else {
      // No profile row — INSERT (for new OAuth users)
      const { error } = await supabase
        .from("profiles")
        .insert(profileData);

      profileError = error;
    }

    if (profileError) {
      console.error("Profile write error:", profileError);

      if (isPostgrestUniqueViolation(profileError)) {
        return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
      }

      if (isPostgrestPolicyError(profileError)) {
        return NextResponse.json({
          error: "Session expired. Please sign out and sign in again, then choose your username.",
          code: "POLICY_ERROR",
        }, { status: 403 });
      }

      return NextResponse.json({ error: "Failed to set username." }, { status: 500 });
    }

    // Verify the row exists after the write (probe for RLS/silent failures)
    const { data: verify } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .maybeSingle();

    if (!verify?.username) {
      console.error("Profile probe failed after write — user:", userId);
      return NextResponse.json({
        error: "Profile not created. Please sign out and sign in again.",
        code: "VERIFY_FAILED",
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, username: sanitized });
  } catch (e) {
    console.error("Username setup unexpected error:", e);
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
