import { type NextRequest, NextResponse } from "next/server"
import { createBackendSupabaseClient } from "@/lib/supabase"
import { checkUsageLimit, incrementUsage } from "@/lib/subscription"
import { generateContent } from "@/lib/gemini"
import { logCoverLetterCreated } from "@/lib/activity-logger"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobTitle, companyName, jobDescription, userExperience, skills, tone, userId } = body

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
    if (!jobTitle || !companyName) {
      return NextResponse.json(
        { error: "Missing required fields: jobTitle and companyName are required" },
        { status: 400 },
      )
    }

    // Check usage limits
    const usageCheck = await checkUsageLimit(user.id, "cover_letters")
    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: "Usage limit exceeded",
          message: `You've reached your monthly limit of ${usageCheck.limit} cover letters. Upgrade to Professional for unlimited access.`,
          current: usageCheck.current,
          limit: usageCheck.limit,
          planType: usageCheck.planType,
        },
        { status: 429 },
      )
    }

    // Construct prompt for Gemini
    const prompt = `Generate a professional cover letter for this job application:

Job Title: ${jobTitle}
Company: ${companyName}
${jobDescription ? `Job Description: ${jobDescription}` : ""}
${userExperience ? `Applicant Experience: ${userExperience}` : ""}
${skills ? `Key Skills: ${skills}` : ""}
Tone: ${tone || "professional"}

Requirements:
- Strong opening mentioning the specific role
- Highlight relevant experience and skills that match the job
- Express genuine interest in the company
- Professional closing with call to action
- Keep it concise (3-4 paragraphs)
- Use past tense for previous roles, present tense for current role

Return only the cover letter text without labels or formatting.`

    let coverLetterContent: string
    try {
      coverLetterContent = await generateContent(prompt)

      // Validate content was generated
      if (!coverLetterContent || coverLetterContent.trim().length === 0) {
        console.error("Empty content returned from Gemini")
        return NextResponse.json(
          { error: "Failed to generate cover letter content. Please try again." },
          { status: 500 },
        )
      }
    } catch (genError) {
      console.error("Gemini generation error:", genError)
      return NextResponse.json({ error: "Failed to generate cover letter. Please try again." }, { status: 500 })
    }

    // Save to database with correct column names matching the schema
    const { data: savedCoverLetter, error: saveError } = await supabase
      .from("cover_letters")
      .insert({
        user_id: user.id,
        title: `Cover Letter - ${jobTitle} at ${companyName}`,
        job_title: jobTitle,
        company_name: companyName,
        content: coverLetterContent,
        tone: tone || "professional",
        metadata: {
          jobDescription: jobDescription || "",
          userExperience: userExperience || "",
          skills: skills || "",
          generatedAt: new Date().toISOString(),
        },
      })
      .select()
      .single()

    if (saveError) {
      console.error("Error saving cover letter to database:", saveError)
      // Don't block response if save fails, but log it
    }

    // INCREMENT USAGE - This is crucial for tracking
    const incrementSuccess = await incrementUsage(user.id, "cover_letters")

    await logCoverLetterCreated(user.id, `${jobTitle} at ${companyName}`)

    // Get updated usage for response
    const updatedUsageCheck = await checkUsageLimit(user.id, "cover_letters")

    return NextResponse.json({
      success: true,
      content: coverLetterContent,
      usage: {
        current: updatedUsageCheck.current,
        limit: updatedUsageCheck.limit,
        remaining:
          updatedUsageCheck.limit === -1 ? -1 : Math.max(0, updatedUsageCheck.limit - updatedUsageCheck.current),
        isPro: updatedUsageCheck.planType === "professional",
      },
    })
  } catch (error) {
    console.error("Cover letter generation error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate cover letter",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
