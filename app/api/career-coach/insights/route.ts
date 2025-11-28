import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "")

export async function POST(request: NextRequest) {
  try {
    const { occupation } = await request.json()

    if (!occupation || occupation.trim() === "") {
      return NextResponse.json({ error: "Occupation is required" }, { status: 400 })
    }

    const prompt = `Generate current industry insights for a ${occupation} professional. Provide real, actionable information based on 2024 trends.

Return a JSON object with this structure:
{
  "skillGaps": ["skill1", "skill2", "skill3", "skill4"],
  "industryTrends": ["trend1", "trend2", "trend3", "trend4", "trend5"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3", "recommendation4", "recommendation5"],
  "salaryRange": { "min": number, "max": number }
}

Make the content specific to ${occupation}, current, and practical. Return ONLY the JSON object.`

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    let insights = {}
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0])
      } else {
        insights = JSON.parse(responseText)
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
      return NextResponse.json({ error: "Failed to parse insights" }, { status: 500 })
    }

    return NextResponse.json(insights)
  } catch (error) {
    console.error("Error generating insights:", error)
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 })
  }
}
