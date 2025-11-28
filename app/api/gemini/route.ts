import { NextResponse } from "next/server"
import {
  generateProfessionalSummary,
  generateWorkDescription,
  generateSkillsSuggestions,
  optimizeResumeForATS,
  testGeminiConnection,
} from "@/lib/gemini-client"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, data } = body

    let result: any

    switch (action) {
      case "generateProfessionalSummary":
        result = await generateProfessionalSummary(data)
        break
      case "generateWorkDescription":
        result = await generateWorkDescription(data)
        break
      case "generateSkillsSuggestions":
        result = await generateSkillsSuggestions(data)
        break
      case "optimizeResumeForATS":
        result = await optimizeResumeForATS(data)
        break
      case "testConnection":
        result = await testGeminiConnection()
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("Error in Gemini API:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
