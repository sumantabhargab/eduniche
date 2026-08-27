import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

// Rate limiting map (in-memory, resets on server restart)
const rateLimits = new Map<
  string,
  { count: number; resetTime: number }
>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5;

// Clean up old rate-limit entries occasionally
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(ip);

  // New IP or expired window
  if (!entry || now > entry.resetTime) {
    rateLimits.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });

    return true;
  }

  // Too many requests
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  entry.count++;
  return true;
}

function getCookieValue(
  cookieHeader: string,
  name: string
): string | null {
  const cookies = cookieHeader.split(";");

  const cookie = cookies.find(
    (c) => c.trim().startsWith(`${name}=`)
  );

  if (!cookie) return null;

  const value = cookie.split("=").slice(1).join("=");

  return value || null;
}

function generateReferralCode(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let code = "";

  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return code;
}

async function generateUniqueReferralCode(
  supabase: Awaited<ReturnType<typeof createServerClient>>
): Promise<string> {
  const MAX_ATTEMPTS = 10;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = generateReferralCode();

    if (!supabase) {
      return code;
    }

    const { data, error } = await supabase
      .from("waitlist_users")
      .select("id")
      .eq("referral_code", code)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return code;
    }
  }

  // Extremely unlikely fallback
  return `${generateReferralCode(6)}${Math.floor(
    Math.random() * 10
  )}`;
}

export async function POST(request: Request) {
  try {
    const headersList = await headers();

    const cookieHeader = headersList.get("cookie") || "";

    const forwardedFor = headersList.get("x-forwarded-for");

    const ip =
      forwardedFor?.split(",")[0]?.trim() ||
      headersList.get("x-real-ip") ||
      "unknown";

    // Rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          error:
            "Too many requests. Please try again in a minute.",
        },
        { status: 429 }
      );
    }

    // Parse request body
    let body: {
      name?: unknown;
      email?: unknown;
      interest?: unknown;
      desired_creator?: unknown;
      learning_challenge?: unknown;
      ref?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      interest,
      desired_creator,
      learning_challenge,
      ref,
    } = body;

    // Validate name
    if (
      typeof name !== "string" ||
      name.trim().length < 2
    ) {
      return NextResponse.json(
        { error: "Please enter a valid name." },
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: "Name must be under 100 characters." },
        { status: 400 }
      );
    }

    // Validate email
    if (typeof email !== "string") {
      return NextResponse.json(
        { error: "Please enter your email." },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.toLowerCase().trim();

    // Only accept Gmail addresses
    const gmailRegex = /^[^\s@]+@gmail\.com$/;

    if (!gmailRegex.test(sanitizedEmail)) {
      return NextResponse.json(
        {
          error:
            "Only valid @gmail.com email addresses are accepted.",
        },
        { status: 400 }
      );
    }

    // Sanitize name
    const sanitizedName = name.trim();

    // Validate and sanitize optional interest
    let sanitizedInterest: string | null = null;

    if (interest !== undefined && interest !== null) {
      if (typeof interest !== "string") {
        return NextResponse.json(
          { error: "Invalid interest value." },
          { status: 400 }
        );
      }

      const trimmedInterest = interest.trim();

      if (trimmedInterest.length > 500) {
        return NextResponse.json(
          {
            error:
              "Interest must be under 500 characters.",
          },
          { status: 400 }
        );
      }

      sanitizedInterest = trimmedInterest || null;
    }

    // Validate and sanitize desired creator
    let sanitizedDesiredCreator: string | null = null;

    if (
      desired_creator !== undefined &&
      desired_creator !== null
    ) {
      if (typeof desired_creator !== "string") {
        return NextResponse.json(
          { error: "Invalid desired creator value." },
          { status: 400 }
        );
      }

      const trimmedCreator = desired_creator.trim();

      if (trimmedCreator.length > 500) {
        return NextResponse.json(
          {
            error:
              "Desired creator must be under 500 characters.",
          },
          { status: 400 }
        );
      }

      sanitizedDesiredCreator = trimmedCreator || null;
    }

    // Validate and sanitize learning challenge
    let sanitizedLearningChallenge: string | null = null;

    if (
      learning_challenge !== undefined &&
      learning_challenge !== null
    ) {
      if (typeof learning_challenge !== "string") {
        return NextResponse.json(
          { error: "Invalid learning challenge value." },
          { status: 400 }
        );
      }

      const trimmedChallenge = learning_challenge.trim();

      if (trimmedChallenge.length > 1000) {
        return NextResponse.json(
          {
            error:
              "Learning challenge must be under 1000 characters.",
          },
          { status: 400 }
        );
      }

      sanitizedLearningChallenge = trimmedChallenge || null;
    }

    // Use service-role client so RLS doesn't block legitimate signups
    const supabase = createServiceClient();
    if (!supabase) {
      console.error("Waitlist: service client unavailable — check SUPABASE_SERVICE_ROLE_KEY in deployment env vars");
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    // Check whether email already exists
    const { data: existingUser, error: existingUserError } =
      await supabase
        .from("waitlist_users")
        .select(
          "id, referral_code, referral_count, position"
        )
        .eq("email", sanitizedEmail)
        .maybeSingle();

    if (existingUserError) {
      console.error(
        "Error checking existing user:",
        existingUserError
      );

      return NextResponse.json(
        {
          error:
            "Something went wrong. Please try again.",
        },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        {
          error: "You're already on the waitlist.",
          alreadyJoined: true,
          referralCode: existingUser.referral_code,
          referralCount: existingUser.referral_count,
          position: existingUser.position,
        },
        { status: 409 }
      );
    }

    // Generate a unique referral code
    const referralCode =
      await generateUniqueReferralCode(supabase);

    // Validate referral code from request
    let referredBy: string | null = null;

    if (
      typeof ref === "string" &&
      ref.trim().length > 0
    ) {
      const refCode = ref.trim().toUpperCase();

      const { data: referrer, error: referrerError } =
        await supabase
          .from("waitlist_users")
          .select("referral_code")
          .eq("referral_code", refCode)
          .maybeSingle();

      if (referrerError) {
        console.error(
          "Error validating referral code:",
          referrerError
        );
      } else if (referrer) {
        referredBy = referrer.referral_code;
      }
    }

    // If no referral came from the request,
    // check the referral cookie
    if (!referredBy) {
      const refCookie = getCookieValue(
        cookieHeader,
        "eduniche_ref"
      );

      if (refCookie) {
        const cookieRefCode =
          refCookie.trim().toUpperCase();

        const {
          data: cookieReferrer,
          error: cookieReferrerError,
        } = await supabase
          .from("waitlist_users")
          .select("referral_code")
          .eq("referral_code", cookieRefCode)
          .maybeSingle();

        if (cookieReferrerError) {
          console.error(
            "Error validating referral cookie:",
            cookieReferrerError
          );
        } else if (cookieReferrer) {
          referredBy =
            cookieReferrer.referral_code;
        }
      }
    }

    // Insert new user
    const { data: newUser, error: insertError } =
      await supabase
        .from("waitlist_users")
        .insert({
          name: sanitizedName,
          email: sanitizedEmail,
          interest: sanitizedInterest,
          desired_creator: sanitizedDesiredCreator,
          learning_challenge: sanitizedLearningChallenge,
          referral_code: referralCode,
          referred_by: referredBy,
        })
        .select(
          "id, referral_code, referral_count, position"
        )
        .single();

    if (insertError || !newUser) {
      console.error("Insert error:", insertError);

      return NextResponse.json(
        {
          error:
            "Something went wrong. Please try again.",
        },
        { status: 500 }
      );
    }

    // Increment the referrer's count
    if (referredBy) {
      const { error: rpcError } =
        await supabase.rpc(
          "increment_referral_count",
          {
            p_code: referredBy,
          }
        );

      if (rpcError) {
        console.error(
          "Referral count RPC error:",
          rpcError
        );

        // We intentionally do not use a manual
        // read-modify-write fallback here because
        // concurrent referrals could cause lost updates.
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
      {
        error:
          "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
