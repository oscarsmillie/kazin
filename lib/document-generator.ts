import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx"

export async function generateWordDocument(content: string, title: string): Promise<Blob> {
  // Split content into paragraphs
  const paragraphs = content.split("\n\n").filter((p) => p.trim())

  // Create document sections
  const docParagraphs = [
    // Title
    new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 32,
        }),
      ],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 400,
      },
    }),

    // Content paragraphs
    ...paragraphs.map((paragraph) => {
      // Check if it's a heading (starts with capital letter and is short)
      const isHeading = paragraph.length < 100 && /^[A-Z]/.test(paragraph) && !paragraph.includes(".")

      return new Paragraph({
        children: [
          new TextRun({
            text: paragraph,
            bold: isHeading,
            size: isHeading ? 24 : 22,
          }),
        ],
        heading: isHeading ? HeadingLevel.HEADING_2 : undefined,
        spacing: {
          after: 200,
          before: isHeading ? 300 : 0,
        },
      })
    }),
  ]

  // Create the document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docParagraphs,
      },
    ],
  })

  // Generate and return blob
  const buffer = await Packer.toBuffer(doc)
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  })
}

export function downloadWordDocument(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${filename}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function generatePdfDocument(content: string, title: string): Promise<Blob> {
  // Dynamic import of jspdf for client-side usage
  const { default: jsPDF } = await import("jspdf")

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const maxWidth = pageWidth - 2 * margin
  let yPosition = margin

  // Add title
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  const titleLines = doc.splitTextToSize(title, maxWidth)
  doc.text(titleLines, pageWidth / 2, yPosition, { align: "center" })
  yPosition += titleLines.length * 8 + 10

  // Add content
  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")

  const paragraphs = content.split("\n\n").filter((p) => p.trim())

  for (const paragraph of paragraphs) {
    const lines = doc.splitTextToSize(paragraph, maxWidth)

    // Check if we need a new page
    if (yPosition + lines.length * 5 > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage()
      yPosition = margin
    }

    doc.text(lines, margin, yPosition)
    yPosition += lines.length * 5 + 5
  }

  return doc.output("blob")
}

export function downloadPdfDocument(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${filename}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
