import { type NextRequest, NextResponse } from "next/server"
import { generatePdfFromHtml } from "@/lib/server-pdf-generator"

/**
 * /api/generate-resume-content
 * Generates a high-quality A4 PDF from provided HTML (resume preview).
 * Uses pdf-lib for lightweight, buildpack-compatible PDF generation.
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    // ------------------ 1. Parse Input ------------------
    const { html: finalHtml, resumeTitle } = await req.json()

    if (!finalHtml || typeof finalHtml !== "string" || finalHtml.length < 100) {
      return NextResponse.json({ error: "Missing or invalid HTML input for PDF generation." }, { status: 400 })
    }

    console.log(`📄 Generating PDF for: ${resumeTitle || "Untitled"} | HTML size: ${finalHtml.length}`)

    // ------------------ 2. Generate PDF using pdf-lib ------------------
    const { pdf: pdfBase64, name: fileName } = await generatePdfFromHtml(finalHtml, resumeTitle)

    console.log(`✅ PDF generated successfully: ${fileName}`)

    // ------------------ 3. Return as JSON ------------------
    return new NextResponse(
      JSON.stringify({
        pdf: pdfBase64,
        name: fileName,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      },
    )
  } catch (error: any) {
    console.error("🚨 PDF Generation Error:", error)
    return NextResponse.json({ error: error.message || "PDF generation failed." }, { status: 500 })
  }
}
