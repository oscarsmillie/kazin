export const runtime = "nodejs";
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Optional: default template if none provided
const DEFAULT_TEMPLATE = "Black-White-Simple"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, firstName, lastName, phone, resumeData, templateId } = body

    // Check required fields and log missing ones
    const missingFields: string[] = []
    if (!email) missingFields.push("email")
    if (!firstName) missingFields.push("firstName")
    if (!lastName) missingFields.push("lastName")
    if (!resumeData) missingFields.push("resumeData")

    if (missingFields.length > 0) {
      console.warn("[SAVE-GUEST-RESUME] Missing required fields:", missingFields)
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}`, missingFields },
        { status: 400 }
      )
    }

    const chosenTemplate = templateId || DEFAULT_TEMPLATE

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from("guest_resumes")
      .insert({
        email,
        template_id: chosenTemplate, // template stored as TEXT
        title: `${firstName} ${lastName}`,
        resume_data: resumeData,
        payment_status: "unpaid",
        phone: phone || null,
      })
      .select("id") // select the id column (UUID)
      .single()

    if (error || !data?.id) {
      console.error("[SAVE-GUEST-RESUME] Supabase insert failed:", {
        error,
        data,
      })
      return NextResponse.json(
        {
          error: `Supabase error: ${error?.message || "Unknown"}`,
          details: error?.details,
          hint: error?.hint,
        },
        { status: 500 }
      )
    }

    console.log("[SAVE-GUEST-RESUME] Inserted guest resume with id:", data.id)

    // Map 'id' to 'resumeId' for frontend
    return NextResponse.json({ success: true, resumeId: data.id })
  } catch (err) {
    console.error("[SAVE-GUEST-RESUME] Unexpected error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
