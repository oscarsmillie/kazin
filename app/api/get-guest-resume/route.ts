// app/api/resume/guest/route.ts  (or wherever it lives)

export const runtime = "nodejs";
export const dynamic = "force-dynamic";   // Critical: skips during next build

import { type NextRequest, NextResponse } from "next/server";

// DO NOT create Supabase client at the top level → kills build when env vars missing
// const supabase = createClient(...)  ← NEVER DO THIS

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resumeId = searchParams.get("resumeId");

    if (!resumeId) {
      return NextResponse.json(
        { error: "Resume ID is required" },
        { status: 400 }
      );
    }

    console.log("[get-guest-resume] Fetching guest resume:", resumeId);

    // LAZY LOAD Supabase client — only when route is called
    const { createClient } = await import("@supabase/supabase-js");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: resumeData, error } = await supabase
      .from("guest_resumes")
      .select("*")
      .eq("id", resumeId)
      .maybeSingle();

    if (error) {
      console.error("[get-guest-resume] Database error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!resumeData) {
      console.log("[get-guest-resume] Resume not found:", resumeId);
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    console.log(
      "[get-guest-resume] Resume found - ID:",
      resumeData.id,
      "Payment status:",
      resumeData.payment_status
    );

    return NextResponse.json({ resume: resumeData });
  } catch (error: any) {
    console.error("[get-guest-resume] Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}