import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "")

export async function POST(request: NextRequest) {
  try {
    const {
      profession,
      jobTitle,
      difficultyLevel,
      questionCount = 5,
      jobDescription,
      qualifications,
    } = await request.json()

    if (!profession || profession.trim() === "") {
      return NextResponse.json({ error: "Profession is required" }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        cookies: {
          get: (name: string) => cookieStore.get(name)?.value,
          set: (name: string, value: string) => cookieStore.set(name, value),
          remove: (name: string) => cookieStore.delete(name),
        },
      },
    )

    const prompt = `Generate ${questionCount} realistic interview questions for a ${profession} position${jobTitle ? ` (${jobTitle})` : ""} at ${difficultyLevel} difficulty level.

${jobDescription ? `Target Job Description: ${jobDescription}\n` : ""}
${qualifications ? `User's Qualifications: ${qualifications}\n` : ""}

Format the response as a JSON array with this structure:
[
  {
    "question": "question text",
    "category": "category name",
    "difficulty": "${difficultyLevel}",
    "tips": "brief tips for answering"
  }
]

Make questions specific to the profession${jobDescription ? ", target job description" : ""}${qualifications ? ", and user's qualifications" : ""}, realistic, and progressively challenging. Return ONLY the JSON array, no other text.`

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    let questions = []
    try {
      // Try to extract JSON array from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0])
      } else {
        // If no array found, try parsing the entire response
        questions = JSON.parse(responseText)
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
      console.error("Response text:", responseText)
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 })
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: "No questions generated" }, { status: 500 })
    }

    return NextResponse.json({ questions })
  } catch (error) {
    console.error("Error generating questions:", error)
    return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 })
  }
}
