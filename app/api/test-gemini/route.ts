import { type NextRequest, NextResponse } from "next/server"
import { generateEmail, generateProfessionalSummary } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    // Test environment variable
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "GEMINI_API_KEY not found in environment variables",
          success: false,
        },
        { status: 500 },
      )
    }

    // Test email generation
    const testEmailData = {
      type: "follow_up",
      recipientName: "John Doe",
      companyName: "Test Company",
      context: "Following up on our interview last week",
      senderName: "Test User",
    }

    const emailResult = await generateEmail(testEmailData)

    // Test professional summary generation
    const testUserInfo = {
      name: "Test User",
      skills: ["JavaScript", "React", "Node.js"],
      experience: "3 years",
      jobTitle: "Software Developer",
    }

    const summaryResult = await generateProfessionalSummary(testUserInfo)

    return NextResponse.json({
      success: true,
      message: "Gemini AI is working correctly!",
      tests: {
        apiKey: "✅ Found",
        emailGeneration: "✅ Working",
        summaryGeneration: "✅ Working",
      },
      samples: {
        email: emailResult.substring(0, 200) + "...",
        summary: summaryResult.substring(0, 200) + "...",
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.stack,
        tests: {
          apiKey: process.env.GEMINI_API_KEY ? "✅ Found" : "❌ Missing",
          emailGeneration: "❌ Failed",
          summaryGeneration: "❌ Failed",
        },
      },
      { status: 500 },
    )
  }
}
