import { type NextRequest, NextResponse } from "next/server"
import { renderResumeHTML } from "@/lib/template-renderer"

export async function POST(req: NextRequest) {
  try {
    const { resumeId, templateId, resumeData, resumeTitle } = await req.json()

    // Basic validation
    if (!resumeId || !templateId || !resumeData) {
      console.error("Missing fields in request:", { resumeId, templateId, resumeData })
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    // Render HTML from template + data
    const html = await renderResumeHTML(templateId, resumeData)

    if (!html || html.trim() === "") {
      console.error("❌ HTML render failed. No output generated.")
      return NextResponse.json({ error: "Failed to render HTML" }, { status: 500 })
    }

    const pdfResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/generate-pdf-playwright`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html, resumeTitle }),
    })

    const pdfResult = await pdfResponse.json()

    if (pdfResult.error) {
      console.error("❌ PDF generation error:", pdfResult.error)
      return NextResponse.json({ error: pdfResult.error }, { status: 500 })
    }

    // Return for frontend download + preview
    return NextResponse.json({
      pdfBase64: pdfResult.pdf,
      html,
      status: "success",
    })
  } catch (err: any) {
    console.error("🔥 Save resume error:", err)
    return NextResponse.json({ error: err.message || "Failed to save resume" }, { status: 500 })
  }
}
