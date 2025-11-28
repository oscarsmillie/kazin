import type { ResumeData } from "./template-types"
import { supabase } from "@/lib/supabase"

export interface ResumeTemplate {
  id: string
  name: string
  description: string
  category: string
  html_template: string
  css_styles: string
  thumbnail_url?: string
  is_premium: boolean
  is_active: boolean
}

export class TemplateRenderer {
  private template: ResumeTemplate
  private data: ResumeData

  constructor(template: ResumeTemplate, data: ResumeData) {
    this.template = template
    this.data = data
  }

  render(): string {
    let html = this.template.html_template
    const css = this.template.css_styles

    // --- Modern block-based rendering ---
    html = this.renderBlocks(html)

    // --- Simple placeholders fallback (legacy templates) ---
    html = this.replaceSimplePlaceholders(html)

    // --- Remove any leftover template tags ---
    html = html
      .replace(/{{[^{}]+}}/g, "")
      .replace(/{[^{}]+}/g, "")
      .trim()

    // Wrap in printable HTML structure
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${this.data.personalInfo?.fullName || "Resume"}</title>
          <style>
            ${css}
            body {
              font-family: "Helvetica Neue", Arial, sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color: #000;
              background: #fff;
              margin: 0;
              padding: 25mm;
              line-height: 1.4;
              font-size: 12pt;
            }
            .page-break { page-break-before: always; }
          </style>
        </head>
        <body>
          <div id="resume-document">
            ${html}
          </div>
        </body>
      </html>
    `
  }

  // --------------------------------------------------------------------------
  // Modern Block System
  // Example:
  // {{#block education}}<div>{{degree}}</div>{{/block}}
  // --------------------------------------------------------------------------
  private renderBlocks(html: string): string {
    const blockRegex = /{{#block (\w+)}}([\s\S]*?){{\/block}}/g

    return html.replace(blockRegex, (_, blockName: string, blockContent: string) => {
      const items = (this.data as any)[blockName]

      if (!Array.isArray(items) || items.length === 0) return ""

      // Render each item inside the block
      return items
        .map((item) => {
          let rendered = blockContent
          for (const [key, value] of Object.entries(item)) {
            rendered = rendered.replace(new RegExp(`{{${key}}}`, "g"), value ? String(value) : "")
          }
          return rendered
        })
        .join("\n")
    })
  }

  // --------------------------------------------------------------------------
  // Legacy placeholder system (for backward compatibility)
  // --------------------------------------------------------------------------
  private replaceSimplePlaceholders(html: string): string {
    const p = this.data.personalInfo || {}

    html = html
      .replace(/{{name}}|{NAME}/gi, [p.firstName, p.lastName].filter(Boolean).join(" "))
      .replace(/{{surname}}|{SURNAME}/gi, p.lastName || "")
      .replace(/{{tagline}}|{TAGLINE}/gi, p.tagline || "")
      .replace(/{{email}}|{EMAIL}/gi, p.email || "")
      .replace(/{{phone}}|{PHONE}/gi, p.phone || "")
      .replace(/{{city}}|{CITY}/gi, p.location || "")
      .replace(/{{linkedin}}|{LINKEDIN}/gi, p.linkedin || "")
      .replace(/{{portfolio}}|{PORTFOLIO}/gi, p.portfolio || "")
      .replace(/{{summary}}|{PROFESSIONAL_SUMMARY}/gi, this.data.professionalSummary || "")

    return html
  }
}

// --------------------------------------------------------------------------
// Helper for rendering templates
// --------------------------------------------------------------------------
export const renderTemplate = (template: ResumeTemplate, data: ResumeData): string => {
  const renderer = new TemplateRenderer(template, data)
  return renderer.render()
}

// --------------------------------------------------------------------------
// Used by the generate-pdf route
// --------------------------------------------------------------------------
export async function renderResumeHTML(templateId: string, resumeData: ResumeData): Promise<string> {
  const cleanName = templateId.replace(/^storage-/, "")
  const fileName = `${cleanName}.htm`

  console.log("🧠 renderResumeHTML: loading template", fileName)

  const { data, error } = await supabase.storage.from("templates").download(fileName)
  if (error || !data) {
    console.error("❌ Template not found:", error)
    throw new Error("Template not found")
  }

  const htmlText = await data.text()
  const cssMatch = htmlText.match(/<style[^>]*>([\s\S]*?)<\/style>/i)
  const cssStyles = cssMatch ? cssMatch[1] : ""

  const template: ResumeTemplate = {
    id: templateId,
    name: cleanName,
    description: "",
    category: "general",
    html_template: htmlText,
    css_styles: cssStyles,
    is_premium: false,
    is_active: true,
  }

  const rendered = renderTemplate(template, resumeData)
  console.log("✅ renderResumeHTML complete, length:", rendered.length)
  return rendered
}
