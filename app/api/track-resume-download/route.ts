import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const currentMonth = new Date().toISOString().slice(0, 7)

    const { data: existing, error: selectError } = await supabaseAdmin
      .from("usage_tracking")
      .select("id, resumes_downloaded")
      .eq("user_id", userId)
      .eq("month_year", currentMonth)
      .maybeSingle()

    if (selectError && selectError.code !== "PGRST116") {
      console.error("[v0] selectError:", selectError)
      return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 })
    }

    if (existing) {
      const newValue = (existing.resumes_downloaded || 0) + 1
      const { error: updateError } = await supabaseAdmin
        .from("usage_tracking")
        .update({ resumes_downloaded: newValue, updated_at: new Date().toISOString() })
        .eq("id", existing.id)

      if (updateError) {
        console.error("[v0] updateError:", updateError)
        return NextResponse.json({ error: "Failed to update usage" }, { status: 500 })
      }

      return NextResponse.json({ success: true, count: newValue })
    }

    // Create new usage entry
    const { error: insertError } = await supabaseAdmin.from("usage_tracking").insert({
      user_id: userId,
      month_year: currentMonth,
      resumes_downloaded: 1,
      cover_letters_generated: 0,
      emails_generated: 0,
      job_applications: 0,
      interview_sessions: 0,
      career_coaching: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (insertError && insertError.code !== "23505") {
      console.error("[v0] insertError:", insertError)
      return NextResponse.json({ error: "Failed to create usage entry" }, { status: 500 })
    }

    return NextResponse.json({ success: true, count: 1 })
  } catch (err) {
    console.error("[v0] Unexpected error:", err)
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 })
  }
}
