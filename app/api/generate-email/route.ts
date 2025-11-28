import { type NextRequest, NextResponse } from "next/server"
import { createBackendSupabaseClient } from "@/lib/supabase"
import { checkUsageLimit, incrementUsage } from "@/lib/subscription"
import { generateContent } from "@/lib/gemini"
import { logEmailGenerated } from "@/lib/activity-logger"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subject, keyPoints, relationship, tone, company, position } = body

    // Get the authorization header from the request
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")

    // Create Supabase client and verify the token
    const supabase = createBackendSupabaseClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token)

    if (userError || !user) {
      console.error("Authentication error:", userError)
      return NextResponse.json({ error: "Authentication required." }, { status: 401 })
    }

    // Validate required fields
    if (!subject) {
      return NextResponse.json({ error: "Missing required field: subject is required" }, { status: 400 })
    }

    // Check usage limits
    const usageCheck = await checkUsageLimit(user.id, "emails")
    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: "Usage limit exceeded",
          message: `You've reached your monthly limit of ${usageCheck.limit} emails. Upgrade to Professional for unlimited access.`,
          current: usageCheck.current,
          limit: usageCheck.limit,
          planType: usageCheck.planType,
        },
        { status: 429 },
      )
    }

    const prompt = `Generate a ${tone || "professional"} email with these details:

Subject: ${subject}
${keyPoints ? `Key Points: ${keyPoints}` : ""}
${relationship ? `Relationship: ${relationship}` : ""}
${company ? `Company: ${company}` : ""}
${position ? `Position: ${position}` : ""}

Requirements:
- Clear and engaging subject line
- Professional greeting appropriate for the relationship
- Well-structured body covering all key points
- Professional closing
- Keep it concise and focused

Format:
Subject: [subject line]

[email body]

Return only the email text.`

    let emailContent: string
    try {
      emailContent = await generateContent(prompt)

      // Validate content was generated
      if (!emailContent || emailContent.trim().length === 0) {
        console.error("Empty content returned from Gemini")
        return NextResponse.json({ error: "Failed to generate email content. Please try again." }, { status: 500 })
      }
    } catch (genError) {
      console.error("Gemini generation error:", genError)
      return NextResponse.json({ error: "Failed to generate email. Please try again." }, { status: 500 })
    }

    // Save to database with correct column names matching the schema
    const { data: savedEmail, error: saveError } = await supabase
      .from("emails")
      .insert({
        user_id: user.id,
        title: subject,
        subject: subject,
        content: emailContent,
        email_type: "general",
        tone: tone || "professional",
        key_points: keyPoints || "",
        relationship: relationship || "",
        company: company || "",
        position: position || "",
      })
      .select()
      .single()

    if (saveError) {
      console.error("Error saving email to database:", saveError)
      // Don't block response if save fails, but log it
    }

    // INCREMENT USAGE - This is crucial for tracking
    const incrementSuccess = await incrementUsage(user.id, "emails")

    await logEmailGenerated(user.id, tone || "professional")

    // Get updated usage for response
    const updatedUsageCheck = await checkUsageLimit(user.id, "emails")

    return NextResponse.json({
      success: true,
      content: emailContent,
      usage: {
        current: updatedUsageCheck.current,
        limit: updatedUsageCheck.limit,
        remaining:
          updatedUsageCheck.limit === -1 ? -1 : Math.max(0, updatedUsageCheck.limit - updatedUsageCheck.current),
        isPro: updatedUsageCheck.planType === "professional",
      },
    })
  } catch (error) {
    console.error("Email generation error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate email",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
