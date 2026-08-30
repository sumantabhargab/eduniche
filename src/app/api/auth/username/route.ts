/**
 * POST /api/auth/username
 * Sets the user's username. One-time set on first login.
 *
 * The server client reads the session from cookies, which are set by
 * @supabase/ssr's createBrowserClient on the client side. If the session
 * is missing here, the root cause is in the client — fix createBrowserClient.
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
      console.error("[username] Server client not configured");
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    // STEP 1: Log session state
    console.log("[username][diag] session_check:", JSON.stringify({
      hasSession: !!session,
      sessionError: sessionError?.message || sessionError?.code || null,
      userId: session?.user?.id || null,
      email: session?.user?.email || null,
      provider: session?.user?.app_metadata?.provider || null,
    }));

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const userId = session.user.id;

    const rl = checkRateLimit({ maxRequests: 5, windowMs: 60000 }, getClientIdentifier(request) + userId);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const rawUsername = typeof body.username === 'string' ? body.username.trim() : "";

    if (!rawUsername || rawUsername.length < 3 || rawUsername.length > 20) {
      return NextResponse.json({ error: "Username must be 3-20 characters." }, { status: 400 });
    }

    const sanitized = rawUsername.toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (sanitized !== rawUsername.toLowerCase()) {
      return NextResponse.json({ error: "Username can only contain letters, numbers, and underscores." }, { status: 400 });
    }

    if (RESERVED_USERNAMES.has(sanitized)) {
      return NextResponse.json({ error: "This username is reserved." }, { status: 400 });
    }

    if (!/^[a-z0-9_]{3,20}$/.test(sanitized)) {
      return NextResponse.json({ error: "Invalid username format." }, { status: 400 });
    }

    // STEP 2: Check if profile row exists
    const { data: existing } = await supabase
      .from("profiles")
      .select("username, role, display_name")
      .eq("id", userId)
      .maybeSingle();

    console.log("[username][diag] existing_profile:", JSON.stringify({
      exists: !!existing,
      profile: existing ? { username: existing.username, role: existing.role } : null,
    }));

    if (existing?.username) {
      return NextResponse.json({ error: "Username already set." }, { status: 400 });
    }

    // STEP 3: Check username uniqueness
    const { data: dupCheck } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", sanitized)
      .maybeSingle();

    console.log("[username][diag] uniqueness_check:", JSON.stringify({ conflict: !!dupCheck }));

    if (dupCheck) {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }

    // STEP 4: Collect profile data
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

    console.log("[username][diag] profile_data:", JSON.stringify({
      ...profileData,
      avatar_url: avatarUrl ? "[present]" : null,
    }));

    // STEP 5: Write — INSERT (no profile) or UPDATE (profile exists without username)
    let writeError: { code?: string; message?: string; details?: string; hint?: string } | null = null;
    let writeOp: string;

    if (existing) {
      writeOp = "UPDATE";
      const { error } = await supabase
        .from("profiles")
        .update(profileData)
        .eq("id", userId);
      writeError = error;
    } else {
      writeOp = "INSERT";
      const { error } = await supabase
        .from("profiles")
        .insert(profileData);
      writeError = error;
    }

    console.log("[username][diag] write_result:", JSON.stringify({
      op: writeOp,
      success: !writeError,
      error: writeError ? {
        code: writeError.code,
        message: writeError.message,
        details: writeError.details,
        hint: writeError.hint,
      } : null,
    }));

    if (writeError) {
      if (isPostgrestUniqueViolation(writeError)) {
        return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
      }
      if (isPostgrestPolicyError(writeError)) {
        return NextResponse.json({
          error: "Session expired. Please sign out and sign in again, then choose your username.",
          code: "POLICY_ERROR",
        }, { status: 403 });
      }
      return NextResponse.json({ error: "Failed to set username." }, { status: 500 });
    }

    // STEP 6: Verify
    const { data: verify } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", userId)
      .maybeSingle();

    console.log("[username][diag] verify:", JSON.stringify({ verified: !!verify?.username }));

    if (!verify?.username) {
      return NextResponse.json({
        error: "Profile not created. Please sign out and sign in again.",
        code: "VERIFY_FAILED",
      }, { status: 500 });
    }

    console.log("[username][diag] SUCCESS username=" + sanitized);
    return NextResponse.json({ success: true, username: sanitized });
  } catch (e) {
    console.error("[username][diag] unexpected:", e);
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
