import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { stripOklchColors } from "@/lib/color-converter"

export async function POST(request: NextRequest) {
  try {
    const { resumeId, userId } = await request.json()

    // Create Supabase client (using Anon Key)
    const cookieStore = await cookies()
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    })

    // Fetch resume
    const { data: resume, error: resumeError } = await supabase
      .from("resumes")
      .select("*")
      .eq("id", resumeId)
      .eq("user_id", userId)
      .single()

    if (resumeError || !resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 })
    }

    let templateData = null
    const templateId = resume.template_id

    if (templateId) {
      try {
        // Extract template name from storage-{name} format
        const templateName = templateId.replace("storage-", "")
        const fileName = `${templateName}.htm`

        // Download template file from storage
        const { data: fileData, error: downloadError } = await supabase.storage.from("templates").download(fileName)

        if (!downloadError && fileData) {
          const htmlContent = await fileData.text()

          // Extract CSS from HTML
          const cssMatch = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i)
          const cssStyles = cssMatch ? cssMatch[1] : ""

          templateData = {
            html_template: htmlContent,
            css_styles: cssStyles,
          }

          console.log(`[v0] Successfully loaded template: ${fileName}`)
        } else {
          console.error("[v0] Template download error:", downloadError)
        }
      } catch (err) {
        console.error("[v0] Error fetching template from Storage:", err)
      }
    }

    if (!templateData || !templateData.html_template) {
      return NextResponse.json({ error: "Template not found or could not be processed" }, { status: 404 })
    }

    // Render resume HTML (rest of your logic remains the same)
    let html = templateData.html_template
    const resumeData = resume.content

    // Replace placeholders (keeping your existing logic unchanged)
    if (resumeData.personalInfo) {
      html = html.replace(/{NAME}/g, resumeData.personalInfo.firstName || "")
      html = html.replace(/{SURNAME}/g, resumeData.personalInfo.lastName || "")
      html = html.replace(/{FULL_NAME}/g, resumeData.personalInfo.fullName || "")
      html = html.replace(/{TAGLINE}/g, resumeData.personalInfo.tagline || "")
      html = html.replace(/{EMAIL}/g, resumeData.personalInfo.email || "")
      html = html.replace(/{PHONE}/g, resumeData.personalInfo.phone || "")
      html = html.replace(/{CITY}/g, resumeData.personalInfo.city || "")
      html = html.replace(/{POSTCODE}/g, resumeData.personalInfo.postcode || "")
    }

    html = html.replace(/{PROFESSIONAL_SUMMARY}/g, resumeData.professionalSummary || "")

    if (resumeData.workExperience && Array.isArray(resumeData.workExperience)) {
      resumeData.workExperience.forEach((exp: any, index: number) => {
        const i = index + 1
        if (i <= 5) {
          html = html.replace(new RegExp(`{JOB_TITLE_${i}}`, "g"), exp.jobTitle || "")
          html = html.replace(new RegExp(`{EMPLOYER_${i}}`, "g"), exp.employer || "")
          html = html.replace(new RegExp(`{WSD_${i}}`, "g"), exp.startDate || "")
          html = html.replace(new RegExp(`{WED_${i}}`, "g"), exp.current ? "Present" : exp.endDate || "")

          if (exp.descriptions && Array.isArray(exp.descriptions)) {
            exp.descriptions.forEach((desc: string, descIndex: number) => {
              if (descIndex === 0) {
                html = html.replace(new RegExp(`{WORK_DESCRIPTION_${i}}`, "g"), desc || "")
              } else if (descIndex < 10) {
                html = html.replace(new RegExp(`{WORK_DESCRIPTION_${i}\\.${descIndex + 1}}`, "g"), desc || "")
              }
            })
          }
        }
      })
    }

    if (resumeData.education && Array.isArray(resumeData.education)) {
      resumeData.education.forEach((edu: any, index: number) => {
        const i = index + 1
        if (i <= 10) {
          html = html.replace(new RegExp(`{DEGREE_${i}}`, "g"), edu.degree || "")
          html = html.replace(new RegExp(`{INSTITUTION_${i}}`, "g"), edu.institution || "")
          html = html.replace(new RegExp(`{ESD_${i}}`, "g"), edu.startDate || "")
          html = html.replace(new RegExp(`{EED_${i}}`, "g"), edu.endDate || "")
        }
      })
    }

    if (resumeData.skills && Array.isArray(resumeData.skills)) {
      resumeData.skills.forEach((skill: string, index: number) => {
        const i = index + 1
        if (i <= 10) {
          html = html.replace(new RegExp(`{SKILL_${i}}`, "g"), skill || "")
        }
      })
    }

    // Hide empty placeholders
    html = html.replace(/{[^}]+}/g, '<span style="display: none;"></span>')

    let css = templateData.css_styles || ""

    css = stripOklchColors(css)

    const finalHTML = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${resume.title || "Resume"}</title>
          <style>
            * { 
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            html, body { 
              margin: 0; 
              padding: 0; 
              width: 100%;
              height: 100%;
              font-family: Arial, sans-serif;
              background-color: #ffffff;
              color: #000000;
            }
            #pdf-content-wrapper {
              width: 210mm; 
              padding: 10mm; 
              margin: 0;
              background-color: #ffffff;
              color: #000000;
            }
            /* Force all text to be visible and black for PDF rendering */
            body, body * {
              color: #000000 !important;
              background-color: transparent !important;
            }
            ${css}
          </style>
        </head>
        <body>
            <div id="pdf-content-wrapper">
              ${html}
            </div>
        </body>
      </html>
    `

    // Return HTML for client-side rendering with html2canvas/jsPDF.html()
    return NextResponse.json({
      html: finalHTML,
      title: resume.title,
    })
  } catch (error) {
    console.error("[v0] Error generating PDF:", error)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}
