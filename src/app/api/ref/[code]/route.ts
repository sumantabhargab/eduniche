import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const supabase = await createServerClient();
    if (!supabase) {
      return NextResponse.json({ valid: false }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("waitlist_users")
      .select("id, referral_code, referral_count, position")
      .eq("referral_code", code.toUpperCase())
      .single();

    if (error || !data) {
      return NextResponse.json({ valid: false }, { status: 404 });
    }

    return NextResponse.json({
      valid: true,
      referralCode: data.referral_code,
      referralCount: data.referral_count,
      position: data.position,
    });
  } catch (error) {
    console.error("Referral lookup error:", error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
