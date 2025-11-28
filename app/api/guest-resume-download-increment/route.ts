import { supabaseAdmin } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { resumeId, reference } = await request.json()

    console.log("[v0] Processing guest resume download increment for:", resumeId)

    if (!resumeId) {
      return NextResponse.json({ success: false, error: "Resume ID required" }, { status: 400 })
    }

    const { error: updateError } = await supabaseAdmin
      .from("resumes")
      .update({
        payment_status: "paid",
        is_paid: true,
        paid_at: new Date().toISOString(),
        payment_reference: reference,
      })
      .eq("id", resumeId)

    if (updateError) {
      console.error("[v0] Error updating resume payment status:", updateError)
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }

    await supabaseAdmin.from("user_activities").insert({
      activity_type: "guest_resume_download",
      description: `Guest user downloaded resume: ${resumeId}`,
      metadata: {
        resume_id: resumeId,
        payment_reference: reference,
        type: "guest",
      },
    })

    console.log("[v0] Successfully incremented guest resume download")

    return NextResponse.json({ success: true, message: "Download recorded" })
  } catch (error) {
    console.error("[v0] Error in guest resume download increment:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
