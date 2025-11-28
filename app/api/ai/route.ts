import { type NextRequest, NextResponse } from "next/server"
import { generateProfessionalSummary, generateWorkDescription, generateSkillsSuggestions } from "@/lib/gemini-client"

export async function POST(req: NextRequest) {
  try {
    const { task, payload } = await req.json()

    let result: unknown

    switch (task) {
      case "summary":
        result = await generateProfessionalSummary(payload)
        break
      case "work-description":
        result = await generateWorkDescription(payload.jobTitle, payload.employer)
        break
      case "skills":
        result = await generateSkillsSuggestions(payload)
        break
      default:
        return NextResponse.json({ error: "Unsupported task" }, { status: 400 })
    }

    return NextResponse.json({ success: true, result })
  } catch (err: any) {
    console.error("[AI API] Error:", err)
    return NextResponse.json({ success: false, error: err?.message || "Unknown error" }, { status: 500 })
  }
}
