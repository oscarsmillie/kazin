import { NextResponse } from "next/server"
import { generatePdfFromHtml } from "@/lib/server-pdf-generator"

export async function POST(req: Request) {
  try {
    const { html, title } = await req.json()

    if (!html) {
      return NextResponse.json({ error: "HTML content is required" }, { status: 400 })
    }

    const { pdf, name } = await generatePdfFromHtml(html, title)

    // Convert base64 back to buffer for direct download
    const pdfBuffer = Buffer.from(pdf, "base64")

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${name}"`,
      },
    })
  } catch (error: any) {
    console.error("PDF download error:", error)
    return NextResponse.json({ error: error.message || "Failed to generate PDF" }, { status: 500 })
  }
}
