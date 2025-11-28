/**
 * Client-side PDF generation using jsPDF
 * This works in v0's browser environment where server-side Puppeteer is unavailable
 */
import { jsPDF } from "jspdf"

export async function generatePdfFromHtmlClient(
  htmlContent: string,
  title = "Resume",
): Promise<{ pdf: string; name: string }> {
  // Create a hidden iframe to render the HTML
  const iframe = document.createElement("iframe")
  iframe.style.cssText = "position:absolute;left:-9999px;width:794px;height:1123px;"
  document.body.appendChild(iframe)

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
  if (!iframeDoc) {
    document.body.removeChild(iframe)
    throw new Error("Could not create iframe document")
  }

  iframeDoc.open()
  iframeDoc.write(htmlContent)
  iframeDoc.close()

  // Wait for content to render
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Use html2canvas to capture the content
  const { default: html2canvas } = await import("html2canvas-pro")

  const canvas = await html2canvas(iframeDoc.body, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    width: 794,
    windowWidth: 794,
  })

  document.body.removeChild(iframe)

  // Create PDF from canvas
  const imgData = canvas.toDataURL("image/jpeg", 0.95)
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: "a4",
    hotfixes: ["px_scaling"],
  })

  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = pdf.internal.pageSize.getHeight()

  // Calculate scaling to fit A4
  const imgWidth = canvas.width
  const imgHeight = canvas.height
  const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
  const scaledWidth = imgWidth * ratio
  const scaledHeight = imgHeight * ratio

  // Center the image
  const x = (pdfWidth - scaledWidth) / 2
  const y = 0

  pdf.addImage(imgData, "JPEG", x, y, scaledWidth, scaledHeight)

  // Convert to base64
  const pdfBase64 = pdf.output("datauristring").split(",")[1]

  const safeName = (title || "Resume")
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "_")
    .substring(0, 50)

  return {
    pdf: pdfBase64,
    name: `${safeName}_${Date.now()}.pdf`,
  }
}
