import { NextResponse } from "next/server";
import { adminLogin } from "@/modules/content-cms/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const result = await adminLogin(email, password);

    if (!result.session) {
      return NextResponse.json(
        { error: result.error || "Invalid credentials." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        email: result.session.user.email,
        role: result.session.user.role,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
