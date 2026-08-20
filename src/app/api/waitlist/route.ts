import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

// Rate limiting map (in-memory, resets on restart)
const rateLimits = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimits.set(ip, { count: 1, resetTime: now + 60 * 1000 });
    return true;
  }

  if (entry.count >= 5) {
    return false;
  }

  entry.count++;
  return true;
}

function getCookieValue(cookieHeader: string, name: string): string | null {
  const cookies = cookieHeader.split(";");
  const cookie = cookies.find((c) => c.trim().startsWith(`${name}=`));
  if (!cookie) return null;
  return cookie.split("=").slice(1).join("=") || null;
}

export async function POST(request: Request) {
  try {
    const cookieHeader = (await headers()).get("cookie") || "";
    const ip =
      (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    // Rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a minute." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, interest, desired_creator, ref } = body;

    // Server-side validation
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Please enter your name." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Please enter your email." },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedName = name.trim();
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedInterest = interest?.trim() || null;
    const sanitizedDesiredCreator = desired_creator?.trim() || null;

    // Validate optional fields length
    if (sanitizedInterest && sanitizedInterest.length > 500) {
      return NextResponse.json(
        { error: "Interest must be under 500 characters." },
        { status: 400 }
      );
    }

    if (sanitizedDesiredCreator && sanitizedDesiredCreator.length > 500) {
      return NextResponse.json(
        { error: "Desired creator must be under 500 characters." },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Check if email already exists
    const { data: existing } = await supabase
      .from("waitlist_users")
      .select("id, referral_code, referral_count, position")
      .eq("email", sanitizedEmail)
      .single();

    if (existing) {
      return NextResponse.json(
        {
          error: "You're already on the waitlist.",
          alreadyJoined: true,
          referralCode: existing.referral_code,
          referralCount: existing.referral_count,
          position: existing.position,
        },
        { status: 409 }
      );
    }

    // Generate referral code
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let referralCode = "";
    for (let i = 0; i < 6; i++) {
      referralCode += chars[Math.floor(Math.random() * chars.length)];
    }

    // Check uniqueness of referral code
    const { data: codeExists } = await supabase
      .from("waitlist_users")
      .select("id")
      .eq("referral_code", referralCode)
      .single();

    if (codeExists) {
      referralCode += Math.floor(Math.random() * 10);
    }

    // Validate referral code if provided
    let referredBy = "";
    if (ref && typeof ref === "string" && ref.trim().length > 0) {
      const refCode = ref.trim().toUpperCase();

      // Validate referral code exists
      const { data: referrer } = await supabase
        .from("waitlist_users")
        .select("id, referral_code")
        .eq("referral_code", refCode)
        .single();

      if (referrer) {
        referredBy = refCode;
      }
    }

    // Check cookie for referral code
    const refCookie = getCookieValue(cookieHeader, "eduniche_ref");
    if (!referredBy && refCookie) {
      const { data: referrer } = await supabase
        .from("waitlist_users")
        .select("id, referral_code")
        .eq("referral_code", refCookie.toUpperCase())
        .single();

      if (referrer) {
        referredBy = referrer.referral_code;
      }
    }

    // Insert user
    const { data: newUser, error: insertError } = await supabase
      .from("waitlist_users")
      .insert({
        name: sanitizedName,
        email: sanitizedEmail,
        interest: sanitizedInterest,
        desired_creator: sanitizedDesiredCreator,
        referral_code: referralCode,
        referred_by: referredBy,
      })
      .select("id, referral_code, referral_count, position")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }

    // If referred, increment referrer's count via RPC
    if (referredBy && newUser) {
      const { error: rpcError } = await supabase.rpc(
        "increment_referral_count",
        { p_code: referredBy }
      );
      if (rpcError) {
        // Fallback: manual increment
        const { data: refUser } = await supabase
          .from("waitlist_users")
          .select("referral_count")
          .eq("referral_code", referredBy)
          .single();

        const count = refUser?.referral_count || 0;
        await supabase
          .from("waitlist_users")
          .update({ referral_count: count + 1 })
          .eq("referral_code", referredBy);
      }
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          name: sanitizedName,
          referralCode: newUser.referral_code,
          referralCount: newUser.referral_count,
          position: newUser.position,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Waitlist API error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
