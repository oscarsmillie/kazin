"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, ArrowLeft, Loader2, Eye } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import ResumePreviewRenderer from "@/components/resume-preview-renderer"
import Link from "next/link"
import { toast } from "sonner"
import { generatePdfFromHtmlClient } from "@/lib/client-pdf-generator"

interface Resume {
  id: string
  title: string
  template_id: string | null
  template_name: string
  resume_data: any
  created_at: string
  payment_status: string
}

interface Template {
  id: string
  name: string
  html_template: string
  css_styles: string
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const renderResumeWithTemplate = (template: Template, data: any, resumeTitle: string) => {
  if (!template?.html_template || !data)
    return "<div style='padding:40px;text-align:center;'>Unable to render resume for download</div>"

  let html = template.html_template

  const renderBlock = (htmlStr: string, tag: string, items: any[], mapFn: (item: any, block: string) => string) => {
    return htmlStr.replace(new RegExp(`{#${tag}}([\\s\\S]*?){/${tag}}`, "g"), (_, block) =>
      items?.length ? items.map((item) => mapFn(item, block)).join("") : "",
    )
  }

  const safeReplace = (htmlStr: string, key: string, value?: string) => {
    return htmlStr.replace(new RegExp(`{${key}}`, "g"), value || "")
  }

  const normalizedData = {
    personalInfo: data.personalInfo || {},
    professionalSummary: data.professionalSummary || data.summary || "",
    workExperience: data.workExperience || data.experience || [],
    education: data.education || [],
    skills: data.skills || [],
    achievements: data.achievements || [],
    certifications: data.certifications || [],
    references: data.references || [],
    languages: data.languages || [],
  }

  const info = normalizedData.personalInfo

  html = safeReplace(html, "FULL_NAME", info.fullName || `${info.firstName || ""} ${info.lastName || ""}`.trim())
  html = safeReplace(html, "NAME", info.firstName || "")
  html = safeReplace(html, "SURNAME", info.lastName || "")
  html = safeReplace(html, "TAGLINE", info.tagline || "Professional")
  html = safeReplace(html, "EMAIL", info.email || "")
  html = safeReplace(html, "PHONE", info.phone || "")
  html = safeReplace(html, "ADDRESS", info.address || "")
  html = safeReplace(html, "CITY", info.city || "")
  html = safeReplace(html, "LOCATION", info.location || "")
  html = safeReplace(html, "POSTCODE", info.postcode || "")
  html = safeReplace(html, "LINKEDIN", info.linkedin || "")
  html = safeReplace(html, "PORTFOLIO", info.portfolio || "")
  html = safeReplace(html, "PROFESSIONAL_SUMMARY", normalizedData.professionalSummary)

  html = renderBlock(html, "EXPERIENCE", normalizedData.workExperience, (exp, block) =>
    block
      .replace(/{JOB_TITLE}/g, exp.jobTitle || exp.role || "")
      .replace(/{COMPANY}/g, exp.company || exp.employer || "")
      .replace(/{START_DATE}/g, exp.startDate || "")
      .replace(/{END_DATE}/g, exp.endDate || (exp.current ? "Present" : ""))
      .replace(
        /{DESCRIPTION}/g,
        Array.isArray(exp.descriptions) ? exp.descriptions.join("<br>") : exp.description || "",
      ),
  )

  html = renderBlock(html, "EDUCATION", normalizedData.education, (edu, block) =>
    block
      .replace(/{DEGREE}/g, edu.degree || "")
      .replace(/{INSTITUTION}/g, edu.institution || "")
      .replace(/{START_DATE}/g, edu.startDate || "")
      .replace(/{END_DATE}/g, edu.endDate || "")
      .replace(/{DESCRIPTION}/g, edu.description || "")
      .replace(/{GPA}/g, edu.gpa || ""),
  )

  html = renderBlock(html, "SKILLS", normalizedData.skills, (s, block) =>
    block.replace(/{SKILL}/g, typeof s === "string" ? s : s.name || ""),
  )

  html = renderBlock(html, "ACHIEVEMENTS", normalizedData.achievements, (a, block) =>
    block.replace(/{ACHIEVEMENT}/g, typeof a === "string" ? a : a.title || ""),
  )

  html = renderBlock(html, "LANGUAGES", normalizedData.languages, (l, block) =>
    block.replace(/{LANGUAGE}/g, typeof l === "string" ? l : l.name || ""),
  )

  html = renderBlock(html, "CERTIFICATIONS", normalizedData.certifications, (c, block) =>
    block.replace(/{CERTIFICATION}/g, typeof c === "string" ? c : c.name || ""),
  )

  html = renderBlock(html, "REFERENCES", normalizedData.references, (r, block) =>
    block
      .replace(/{REFERENCE_NAME}/g, r.name || "")
      .replace(/{REFERENCE_COMPANY}/g, r.company || "")
      .replace(/{REFERENCE_EMAIL}/g, r.email || "")
      .replace(/{REFERENCE_PHONE}/g, r.phone || ""),
  )

  html = html.replace(/{[^}]+}/g, "")

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${resumeTitle || "Resume"}</title>
        <style>
          body {
            background: white;
            font-family: 'Inter', system-ui, sans-serif;
            line-height: 1.6;
            padding: 20px;
          }
          ${template.css_styles || ""}
        </style>
      </head>
      <body>${html}</body>
    </html>`
}

export default function GuestResumeDownloadPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [resume, setResume] = useState<Resume | null>(null)
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [isResumePaidFor, setIsResumePaidFor] = useState(false)
  const [fullPrintHtml, setFullPrintHtml] = useState<string | null>(null)
  const [previewZoom, setPreviewZoom] = useState(90)
  const resumeId = params.id as string

  const fetchResumeData = useCallback(async () => {
    if (!resumeId) {
      console.log("[v0] No resume ID provided")
      toast.error("No resume ID provided")
      return
    }

    setLoading(true)
    try {
      console.log("[v0] Fetching guest resume with ID:", resumeId)

      const response = await fetch(`/api/get-guest-resume?resumeId=${resumeId}`)
      const result = await response.json()

      if (!response.ok) {
        console.error("[v0] API error:", result.error)
        toast.error("Failed to fetch resume: " + result.error)
        return
      }

      const resumeData = result.resume

      if (!resumeData) {
        console.error("[v0] Resume not found with ID:", resumeId)
        toast.error("Resume not found or payment required")
        return
      }

      console.log("[v0] Resume found - ID:", resumeData.id, "Payment status:", resumeData.payment_status)
      setResume(resumeData)
      const paymentVerified = searchParams.get("payment_verified") === "true"
      const paymentStatus = paymentVerified ? "paid" : resumeData.payment_status
      setIsResumePaidFor(paymentStatus === "paid")

      if (resumeData.template_id) {
        const templateId = resumeData.template_id.replace(/^\/+|\/+$/g, "")
        const fileName = templateId.endsWith(".htm") || templateId.endsWith(".html") ? templateId : `${templateId}.htm`

        console.log("[v0] Fetching template:", fileName)
        const { data: file, error: fileError } = await supabase.storage.from("templates").download(fileName)

        if (file) {
          const htmlContent = await file.text()
          const cssMatch = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i)
          const cssStyles = cssMatch ? cssMatch[1] : ""
          const t = { id: templateId, name: templateId, html_template: htmlContent, css_styles: cssStyles }
          setTemplate(t)

          let contentData: any = {}
          try {
            if (resumeData.resume_data) {
              if (typeof resumeData.resume_data === "string") {
                contentData = JSON.parse(resumeData.resume_data)
              } else {
                contentData = resumeData.resume_data
              }
            } else {
              contentData = resumeData
            }
          } catch (err) {
            console.error("[v0] Failed to parse resume content:", err)
            contentData = resumeData
          }

          const renderedHtml = renderResumeWithTemplate(t, contentData, resumeData.title)
          console.log("[v0] Resume HTML rendered, length:", renderedHtml.length)
          setFullPrintHtml(renderedHtml)
        } else {
          console.error("[v0] Template file not found:", fileError)
          toast.error("Template not found")
        }
      }
    } catch (e) {
      console.error("[v0] Error loading guest resume:", e)
      toast.error("Failed to load resume data")
    } finally {
      setLoading(false)
    }
  }, [resumeId, searchParams])

  useEffect(() => {
    fetchResumeData()
  }, [fetchResumeData])

  const handleDownload = async () => {
    if (!resume || !fullPrintHtml) {
      toast.error("Resume not ready")
      return
    }

    if (!isResumePaidFor) {
      toast.error("Payment is required to download this resume")
      return
    }

    setDownloading(true)
    try {
      console.log("[v0] Downloading PDF for resume:", resume.id)

      // Try server-side generation first
      const res = await fetch("/api/generate-pdf-playwright", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: fullPrintHtml,
          resumeTitle: resume.title || "resume",
        }),
      })

      if (res.ok) {
        const contentType = res.headers.get("content-type")

        if (contentType?.includes("application/pdf")) {
          // Server generated PDF successfully
          const blob = await res.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `${resume.title || "resume"}.pdf`
          a.click()
          window.URL.revokeObjectURL(url)
          toast.success("Download complete!")
          console.log("[v0] Server-side PDF download successful")
        } else {
          // Server returned HTML for client-side generation
          console.log("[v0] Server returned HTML, using client-side PDF generation")
          const pdfBlob = await generatePdfFromHtmlClient(fullPrintHtml, resume.title || "resume")
          const url = window.URL.createObjectURL(pdfBlob)
          const a = document.createElement("a")
          a.href = url
          a.download = `${resume.title || "resume"}.pdf`
          a.click()
          window.URL.revokeObjectURL(url)
          toast.success("Download complete!")
          console.log("[v0] Client-side PDF download successful")
        }
      } else {
        // Server failed, use client-side generation
        console.log("[v0] Server PDF generation failed, using client-side fallback")
        const pdfBlob = await generatePdfFromHtmlClient(fullPrintHtml, resume.title || "resume")
        const url = window.URL.createObjectURL(pdfBlob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${resume.title || "resume"}.pdf`
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success("Download complete!")
        console.log("[v0] Client-side PDF fallback successful")
      }
    } catch (e: any) {
      console.error("[v0] Error downloading resume:", e)

      // Final fallback to client-side generation
      try {
        console.log("[v0] Attempting final client-side fallback")
        const pdfBlob = await generatePdfFromHtmlClient(fullPrintHtml, resume.title || "resume")
        const url = window.URL.createObjectURL(pdfBlob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${resume.title || "resume"}.pdf`
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success("Download complete!")
      } catch (fallbackError: any) {
        console.error("[v0] Client-side fallback also failed:", fallbackError)
        toast.error("Failed to generate PDF: " + (fallbackError.message || "Unknown error"))
      }
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/guest-resume-builder">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Builder
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isResumePaidFor ? "Your Resume is Ready" : "Resume Download"}
          </h1>
          <p className="text-gray-600 mt-1">
            {isResumePaidFor ? "Download your professional resume" : "Complete your payment to download your resume"}
          </p>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="pt-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading your resume...</p>
            </div>
          </CardContent>
        </Card>
      ) : !resume ? (
        <Card>
          <CardContent className="pt-8">
            <div className="text-center">
              <p className="text-gray-600 mb-4">Resume data not found or failed to load.</p>
              <Link href="/guest-resume-builder">
                <Button>Back to Resume Builder</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-l-4 border-l-blue-600">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" /> {resume?.title || "Resume"}
                    </CardTitle>
                    <CardDescription>
                      Template: {template?.name || "N/A"} • Created{" "}
                      {resume?.created_at ? new Date(resume.created_at).toLocaleDateString() : "Unknown"}
                    </CardDescription>
                  </div>
                  <Badge variant={isResumePaidFor ? "default" : "secondary"}>
                    {isResumePaidFor ? "Paid" : "Unpaid"}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {fullPrintHtml && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Resume Preview
                      </CardTitle>
                      <CardDescription>Preview your final resume before downloading</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewZoom(Math.max(50, previewZoom - 10))}
                      >
                        −
                      </Button>
                      <span className="text-xs font-medium w-10 text-center">{previewZoom}%</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewZoom(Math.min(200, previewZoom + 10))}
                      >
                        +
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setPreviewZoom(100)}>
                        Reset
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className="bg-gray-50 border border-gray-200 rounded-lg overflow-auto"
                    style={{ height: "500px" }}
                  >
                    <ResumePreviewRenderer previewHtml={fullPrintHtml} zoom={previewZoom} />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="border-2 border-blue-600 bg-blue-50">
              <CardHeader>
                <CardTitle>Download Resume</CardTitle>
                <CardDescription>
                  {isResumePaidFor ? "Your resume is ready for download" : "Complete payment to download your resume"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isResumePaidFor ? (
                  <Button
                    onClick={handleDownload}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                    disabled={downloading || !fullPrintHtml}
                  >
                    {downloading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" /> Download PDF
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-900 font-medium mb-2">Payment Required</p>
                      <p className="text-xs text-orange-800">
                        Please complete your payment before downloading your resume.
                      </p>
                    </div>
                    <Link href="/guest-resume-builder/create">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                        Back to Resume Builder
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
