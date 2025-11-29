import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    message: "This is from the REAL server — no cache",
    timestamp: new Date().toISOString(),
    env_check: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "PRESENT" : "MISSING",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "PRESENT (length: " + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length + ")" : "MISSING",
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "PRESENT" : "MISSING",
      DEBUG_KEY: process.env.DEBUG_KEY || "MISSING",
    },
  });
}