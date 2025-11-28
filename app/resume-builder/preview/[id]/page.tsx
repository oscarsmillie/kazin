"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, Edit, Download, FileText } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { toast } from "sonner"

// --- Interfaces ---
interface Resume {
  id: string
  title: string
  template_id: string | null
  template_name: string
  content: any
  created_at: string
  payment_status: string
}

interface Template {
  id: string
  name: string
  html_template: string
}

// --- Renderer Function ---
const renderResumeWithTemplate = (template: Template, data: any) => {
  if (!template?.html_template || !data) {
    return "<div style='padding:40px;text-align:center;'>Unable to render resume preview</div>"
  }

  const renderBlock = (htmlStr: string, tag: string, items: any[], mapFn: (item: any, block: string) => string) => {
    return htmlStr.replace(
      new RegExp(`{#${tag}}([\\s\\S]*?){/${tag}}`, "g"),
      (_, block) => (items?.length ? items.map(item => mapFn(item, block)).join("") : "")
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
  let html = template.html_template

  // --- Single-value replacements ---
  html = safeReplace(html, "FULL_NAME", info.fullName || `${info.firstName || ""} ${info.lastName || ""}`.trim())
  html = safeReplace(html, "TAGLINE", info.tagline || "")
  html = safeReplace(html, "EMAIL", info.email || "")
  html = safeReplace(html, "PHONE", info.phone || "")
  html = safeReplace(html, "CITY", info.city || "")
  html = safeReplace(html, "POSTCODE", info.postcode || "")
  html = safeReplace(html, "PROFESSIONAL_SUMMARY", normalizedData.professionalSummary)

  // --- Array block replacements ---
  html = renderBlock(html, "EXPERIENCE", normalizedData.workExperience, (exp, block) =>
    block
      .replace(/{JOB_TITLE}/g, exp.jobTitle || exp.role || "")
      .replace(/{COMPANY}/g, exp.company || exp.employer || "")
      .replace(/{START_DATE}/g, exp.startDate || "")
      .replace(/{END_DATE}/g, exp.endDate || (exp.current ? "Present" : ""))
      .replace(/{DESCRIPTION}/g, Array.isArray(exp.descriptions) ? exp.descriptions.join("<br>") : exp.description || "")
  )

  html = renderBlock(html, "EDUCATION", normalizedData.education, (edu, block) =>
    block
      .replace(/{DEGREE}/g, edu.degree || "")
      .replace(/{INSTITUTION}/g, edu.institution || "")
      .replace(/{START_DATE}/g, edu.startDate || "")
      .replace(/{END_DATE}/g, edu.endDate || "")
      .replace(/{DESCRIPTION}/g, edu.description || "")
  )

  html = renderBlock(html, "SKILLS", normalizedData.skills, (s, block) =>
    block.replace(/{SKILL}/g, typeof s === "string" ? s : s.name || "")
  )

  html = renderBlock(html, "ACHIEVEMENTS", normalizedData.achievements, (a, block) =>
    block.replace(/{ACHIEVEMENT}/g, typeof a === "string" ? a : a.title || "")
  )

  html = renderBlock(html, "LANGUAGES", normalizedData.languages, (l, block) =>
    block.replace(/{LANGUAGE}/g, typeof l === "string" ? l : l.name || "")
  )

  html = renderBlock(html, "REFERENCES", normalizedData.references, (r, block) =>
    block
      .replace(/{REFERENCE_NAME}/g, r.name || "")
      .replace(/{REFERENCE_COMPANY}/g, r.company || "")
      .replace(/{REFERENCE_EMAIL}/g, r.email || "")
      .replace(/{REFERENCE_PHONE}/g, r.phone || "")
  )

  // --- Remove leftover placeholders ---
  html = html.replace(/{[^}]+}/g, "")

  return html
}

// --- Page Component ---
export default function ResumePreviewPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [resume, setResume] = useState<Resume | null>(null)
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [htmlContent, setHtmlContent] = useState<string | null>(null)

  const resumeId = params.id as string

  const fetchFullData = useCallback(async () => {
    if (!user || !resumeId) return
    setLoading(true)

    try {
      // --- Fetch resume data ---
      const { data: resumeData, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("id", resumeId)
        .eq("user_id", user.id)
        .single()

      if (error || !resumeData) {
        toast.error("Resume not found or access denied")
        router.push("/resumes")
        return
      }

      setResume(resumeData)

      // --- Parse content safely (fixed version) ---
      let contentData: any = {}

      try {
        if (resumeData.content) {
          if (typeof resumeData.content === "string") {
            try {
              contentData = JSON.parse(resumeData.content)
            } catch (parseErr) {
              console.error("Invalid JSON in resume content:", parseErr)
              contentData = resumeData
            }
          } else {
            contentData = resumeData.content
          }
        } else {
          contentData = resumeData
        }
      } catch (err) {
        console.error("Failed to parse resume content:", err)
        contentData = resumeData
      }

      // --- Fetch template ---
      if (resumeData.template_id) {
        const templateId = resumeData.template_id.replace(/^\/+|\/+$/g, "")
        const fileName = templateId.endsWith(".htm") || templateId.endsWith(".html") ? templateId : `${templateId}.htm`

        const { data: file } = await supabase.storage.from("templates").download(fileName)
        if (!file) {
          toast.error("Template file not found")
          setHtmlContent("<div style='padding:40px;text-align:center;'>Template not found</div>")
          return
        }

        const htmlText = await file.text()
        const fetchedTemplate: Template = { id: templateId, name: templateId, html_template: htmlText }
        setTemplate(fetchedTemplate)

        const renderedHtml = renderResumeWithTemplate(fetchedTemplate, contentData)
        setHtmlContent(renderedHtml)
      } else {
        setHtmlContent("<div style='padding:40px;text-align:center;'>No template specified</div>")
        toast.error("Template ID missing")
      }
    } catch (err) {
      console.error("Error fetching resume:", err)
      toast.error("Failed to load preview")
      setHtmlContent("<div style='padding:40px;text-align:center;color:red;'>Failed to render resume</div>")
    } finally {
      setLoading(false)
    }
  }, [user, resumeId, router])

  useEffect(() => {
    fetchFullData()
  }, [fetchFullData])

  // --- Iframe for live preview ---
  const IframeContent = () => {
    const iframeRef = useCallback(
      (node: HTMLIFrameElement | null) => {
        if (node && htmlContent) {
          node.contentDocument?.open()
          node.contentDocument?.write(htmlContent)
          node.contentDocument?.close()
        }
      },
      [htmlContent]
    )

    return (
      <iframe
        ref={iframeRef}
        className="w-full h-[850px] border border-gray-300 rounded-lg bg-white"
        title="Resume Preview"
        sandbox="allow-scripts"
      />
    )
  }

  if (loading)
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6 flex items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="ml-3 text-lg text-gray-700">Loading resume preview...</p>
          </CardContent>
        </Card>
      </div>
    )

  if (!resume)
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Resume not found</h3>
        <p className="text-gray-600 mb-4">This resume doesn’t exist or is inaccessible.</p>
        <Link href="/resumes">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Resumes
          </Button>
        </Link>
      </div>
    )

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/resumes">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to List
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Resume Preview: {resume.title}</h1>
            <p className="text-gray-600">
              Template: <Badge variant="secondary">{template?.name || "N/A"}</Badge>
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href={`/editor/${resumeId}`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" /> Edit Resume
            </Button>
          </Link>
          <Link href={`/download/${resumeId}`}>
            <Button>
              <Download className="h-4 w-4 mr-2" /> Download PDF
            </Button>
          </Link>
        </div>
      </div>

      <div className="w-full">
        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>This is how your resume will look when downloaded.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 bg-gray-100 rounded-b-lg flex justify-center">
            {htmlContent ? (
              <IframeContent />
            ) : (
              <div className="flex items-center justify-center h-[850px] w-full text-gray-500">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Rendering...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
