export const runtime = "nodejs";
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Use service role key to bypass RLS for guest resumes
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const resumeId = searchParams.get("resumeId")

    if (!resumeId) {
      return NextResponse.json({ error: "Resume ID is required" }, { status: 400 })
    }

    console.log("[get-guest-resume] Fetching guest resume:", resumeId)

    const { data: resumeData, error } = await supabase
      .from("guest_resumes")
      .select("*")
      .eq("id", resumeId)
      .maybeSingle()

    if (error) {
      console.error("[get-guest-resume] Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!resumeData) {
      console.log("[get-guest-resume] Resume not found:", resumeId)
      return NextResponse.json({ error: "Resume not found" }, { status: 404 })
    }

    console.log("[get-guest-resume] Resume found - ID:", resumeData.id, "Payment status:", resumeData.payment_status)

    return NextResponse.json({ resume: resumeData })
  } catch (error: any) {
    console.error("[get-guest-resume] Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
