import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// This works around the Puppeteer/Chromium issue in v0 environment

export async function POST(req: NextRequest) {
  try {
    const { html: finalHtml, resumeTitle } = await req.json()

    if (!finalHtml || typeof finalHtml !== "string" || finalHtml.length < 100) {
      return NextResponse.json({ error: "Missing or invalid HTML input for PDF generation." }, { status: 400 })
    }

    console.log(`[v0] PDF request received for: ${resumeTitle || "Untitled"} | HTML size: ${finalHtml.length} chars`)

    // Try server-side generation first (works in production)
    try {
      const { generatePdfFromHtml } = await import("@/lib/server-pdf-generator")
      const { pdf: pdfBase64, name: safeFileName } = await generatePdfFromHtml(finalHtml, resumeTitle)

      console.log(`[v0] Server-side PDF generated successfully: ${safeFileName}`)

      return NextResponse.json(
        {
          pdf: pdfBase64,
          name: safeFileName,
          method: "server",
        },
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        },
      )
    } catch (serverError: any) {
      console.log(`[v0] Server-side PDF failed, returning HTML for client-side generation:`, serverError.message)

      // Return HTML for client-side PDF generation as fallback
      return NextResponse.json(
        {
          html: finalHtml,
          title: resumeTitle,
          method: "client-fallback",
          serverError: serverError.message,
        },
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        },
      )
    }
  } catch (error: any) {
    console.error("[v0] PDF Generation Error:", error)
    return NextResponse.json({ error: error.message || "PDF generation failed." }, { status: 500 })
  }
}
