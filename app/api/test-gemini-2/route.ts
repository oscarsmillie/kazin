import { type NextRequest, NextResponse } from "next/server"
import { testGeminiConnection, generateEmail } from "@/lib/gemini"

export async function GET() {
  try {
    const result = await testGeminiConnection()

    return NextResponse.json({
      success: true,
      message: "Gemini 2.0 Flash Lite connection successful",
      result,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, ...data } = body

    let result = ""

    switch (type) {
      case "email":
        result = await generateEmail(data)
        break
      case "connection":
        result = await testGeminiConnection()
        break
      default:
        throw new Error("Invalid test type")
    }

    return NextResponse.json({
      success: true,
      result,
      type,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
