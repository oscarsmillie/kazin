import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "@/lib/gemini-client"

export async function POST(request: NextRequest) {
  try {
    const { message, userId, conversationHistory } = await request.json()

    const systemPrompt = `You are an expert career coach with 15+ years of experience. Your role is to provide precise, actionable advice that helps professionals advance their careers.

CRITICAL FORMATTING RULES:
- Keep responses SHORT and SCANNABLE (max 3-4 short paragraphs)
- Use clear line breaks between ideas
- Start with a direct answer, then provide 1-2 actionable steps
- Use bullet points for multiple items
- Avoid long blocks of text
- Be specific and practical, not generic

Response structure:
1. Direct answer to their question (1-2 sentences)
2. Key insight or framework (1 paragraph max)
3. Immediate action steps (bullet points)
4. Optional: One resource or next step

Example tone: Professional, engaging, and results-focused.`

    const conversationContext =
      conversationHistory && conversationHistory.length > 0
        ? `Previous conversation context:\n${conversationHistory
            .slice(-6)
            .map((msg: any) => `${msg.role === "user" ? "User" : "Coach"}: ${msg.content}`)
            .join("\n\n")}\n\n`
        : ""

    const text = await generateText(`${systemPrompt}

${conversationContext}User's question: ${message}

Provide expert career coaching advice following the formatting rules above:`)

    return NextResponse.json({ response: text })
  } catch (error) {
    console.error("Error in career coach chat:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
