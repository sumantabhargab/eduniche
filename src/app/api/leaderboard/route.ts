import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("waitlist_users")
      .select("name, referral_count, position")
      .order("referral_count", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) {
      console.error("Leaderboard fetch error:", error);
      return NextResponse.json(
        { error: "Failed to load leaderboard." },
        { status: 500 }
      );
    }

    // Filter to only those with referrals
    const withReferrals = data
      .filter((u) => u.referral_count > 0)
      .slice(0, 20);

    const leaderboard = withReferrals.map((u, i) => ({
      rank: i + 1,
      name: u.name,
      count: u.referral_count,
    }));

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      { error: "Failed to load leaderboard." },
      { status: 500 }
    );
  }
}
