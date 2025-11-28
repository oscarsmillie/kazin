import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "@/lib/gemini-client"

export async function POST(request: NextRequest) {
  try {
    const { question, answer, userId } = await request.json()

    const text =
      await generateText(`You are an expert interview coach. Evaluate the candidate's answer and provide constructive feedback.

Interview Question: ${question}

Candidate's Answer: ${answer}

Provide feedback on:
1. Strengths of the answer
2. Areas for improvement
3. Specific suggestions for a better response
4. Overall score (0-100)

Keep feedback concise and actionable:`)

    return NextResponse.json({ feedback: text })
  } catch (error) {
    console.error("Error in interview feedback:", error)
    return NextResponse.json({ error: "Failed to generate feedback" }, { status: 500 })
  }
}
