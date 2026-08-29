"use server";

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  return NextResponse.json(
    {
      answer: "The AI engine is initializing. Please configure GROQ_API_KEY in the server environment to enable AI-powered doubt answering.",
      confidence: "low",
      references: [],
    },
    { status: 200 }
  );
}
