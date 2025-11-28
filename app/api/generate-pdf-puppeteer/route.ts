import { type NextRequest, NextResponse } from "next/server"
import { getTemplateById } from "@/lib/templates"
import { renderTemplate } from "@/lib/template-renderer"
import type { ResumeData } from "@/lib/template-types"

const PDF_SERVICE_ENDPOINT = "https://api.pdf.co/v1/pdf/convert/from/html"
const PDF_SERVICE_API_KEY = process.env.PDFCO_API_KEY || "YOUR_API_KEY"

// Helper to convert dynamic/live preview HTML into fully static HTML
function makeHTMLStatic(html: string): string {
  // Remove React-specific attributes like data-reactroot, data-reactid, etc.
  let staticHtml = html.replace(/data-react\w+=".*?"/g, "")

  // Remove placeholders {{…}}
  staticHtml = staticHtml.replace(/\{\{.*?\}\}/g, "")

  // Optional: collapse whitespace
  staticHtml = staticHtml.replace(/\s+/g, " ")

  return staticHtml
}

export async function POST(request: NextRequest) {
  try {
    const { templateId, resumeData, resumeTitle } = await request.json()

    if (!templateId || !resumeData)
      return NextResponse.json({ error: "Missing templateId or resumeData" }, { status: 400 })

    const template = await getTemplateById(`storage-${templateId}`)
    if (!template?.html_template) return NextResponse.json({ error: "Template not found" }, { status: 404 })

    const parsedData: ResumeData = typeof resumeData === "string" ? JSON.parse(resumeData) : resumeData

    let renderedHtml = renderTemplate(template, parsedData)
    renderedHtml = makeHTMLStatic(renderedHtml)

    const finalHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${resumeTitle || "Resume"}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          html, body { margin:0; padding:0; font-family: 'Helvetica Neue', Arial, sans-serif; background:#fff; color:#000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          #resume-document { width:190mm; min-height:267mm; margin:auto; padding:10mm; box-sizing:border-box; overflow:hidden; }
          * { box-sizing: border-box; }
          section, div, article { page-break-inside: avoid; break-inside: avoid; }
          .page-break { page-break-before: always; }
          h1,h2,h3,h4 { margin:0; padding:0; }
          p, li, span { line-height:1.5; font-size:12pt; }
          table { width:100%; border-collapse: collapse; }
          .resume-section { margin-bottom:12px; padding-bottom:6px; border-bottom:1px solid #ddd; }
        </style>
      </head>
      <body>
        <div id="resume-document">${renderedHtml}</div>
      </body>
      </html>
    `

    const pdfCoResponse = await fetch(PDF_SERVICE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": PDF_SERVICE_API_KEY,
      },
      body: JSON.stringify({
        html: finalHtml,
        name: `${resumeTitle || "resume"}_${Date.now()}.pdf`,
        paperSize: "A4",
        orientation: "Portrait",
        margins: "0.5in",
        printBackground: true,
        mediaType: "print",
        outputDataFormat: "base64",
        scale: 1.0,
      }),
    })

    const pdfResult = await pdfCoResponse.json()
    if (!pdfCoResponse.ok || pdfResult.error) {
      console.error("❌ PDF.co Error:", pdfResult)
      return NextResponse.json({ error: "PDF generation failed", details: pdfResult }, { status: 500 })
    }

    const pdfBase64 = pdfResult.base64 || ""
    return NextResponse.json({ html: finalHtml, pdf: pdfBase64 })
  } catch (error: any) {
    console.error("PDF generation error:", error)
    return NextResponse.json({ error: error.message || "Failed to generate PDF" }, { status: 500 })
  }
}
