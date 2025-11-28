import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "")

export async function POST(request: NextRequest) {
  try {
    const { sessionId, questionId, question, userResponse, profession } = await request.json()

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

    // Generate AI feedback
    const prompt = `You are an expert interview coach evaluating a ${profession} candidate's response.

Question: "${question}"

Candidate's Answer: "${userResponse}"

Provide constructive feedback in 3-4 sentences covering:
1. Strengths of the response
2. Areas for improvement
3. Specific suggestions for better answers

Also provide a score from 1-10.

Format as JSON:
{
  "feedback": "your feedback here",
  "score": 7,
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"]
}`

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    const feedbackData = jsonMatch ? JSON.parse(jsonMatch[0]) : { feedback: responseText, score: 5 }

    // Save response to database
    const { data: response, error } = await supabase.from("mock_interview_responses").insert({
      session_id: sessionId,
      question_id: questionId,
      user_response: userResponse,
      ai_feedback: feedbackData.feedback,
      score: feedbackData.score,
    })

    if (error) throw error

    return NextResponse.json(feedbackData)
  } catch (error) {
    console.error("Error saving response:", error)
    return NextResponse.json({ error: "Failed to save response" }, { status: 500 })
  }
}
