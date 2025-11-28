"use client"

import type React from "react"

import { Badge } from "@/components/ui/badge"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Trash2, Eye, Loader2, CreditCard, ZoomIn, FileText, Sparkles, AlertCircle } from "lucide-react"
import { getTemplateById } from "@/lib/templates"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import dynamic from "next/dynamic"

import { generatePdfFromHtmlClient } from "@/lib/client-pdf-generator"

const ResumePreviewRenderer = dynamic(() => import("@/components/resume-preview-renderer"), {
  ssr: false,
  loading: () => <div className="text-gray-500">Loading preview...</div>,
})

interface PersonalInfo {
  firstName: string
  lastName: string
  fullName: string
  tagline: string
  email: string
  phone: string
  city: string
  postcode: string
  linkedin: string
  portfolio: string
  address?: string // Added address
  location?: string // Added location
  jobDescription?: string // Added optional job description field for keyword matching
}

interface WorkExperience {
  jobTitle: string
  employer: string
  location: string
  startDate: string
  endDate: string
  current: boolean
  descriptions: string[]
}

interface Education {
  degree: string
  institution: string
  location: string
  startDate: string
  endDate: string
  gpa: string
  description: string
}

interface Reference {
  name: string
  company: string
  phone: string
  email: string
}

interface ResumeData {
  personalInfo: PersonalInfo
  professionalSummary: string
  workExperience: WorkExperience[]
  education: Education[]
  skills: string[]
  languages: string[]
  achievements: string[]
  certifications: string[]
  references: Reference[]
}

export default function GuestResumeBuilderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams.get("template")

  const [template, setTemplate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("personal")
  const [previewOpen, setPreviewOpen] = useState(false)
  // const [aiLoading, setAiLoading] = useState<string | null>(null) // Removed, replaced by specific loading states
  const [showPaymentStep, setShowPaymentStep] = useState(false)
  const [currency, setCurrency] = useState<"KES" | "USD">("KES")
  const [previewZoom, setPreviewZoom] = useState(70)
  const [isLoading, setIsLoading] = useState(false) // Added state for loading indicator

  // Specific loading states for AI actions
  const [generatingSummary, setGeneratingSummary] = useState(false)
  const [generatingSkills, setGeneratingSkills] = useState(false)
  const [generatingWorkDescription, setGeneratingWorkDescription] = useState<number | null>(null)

  const [resumeId, setResumeId] = useState<string | null>(null)

  const [resumeData, setResumeData] = useState<ResumeData>({
    personalInfo: {
      firstName: "",
      lastName: "",
      fullName: "",
      tagline: "",
      email: "",
      phone: "",
      city: "",
      postcode: "",
      linkedin: "",
      portfolio: "",
      address: "", // Initialize address
      location: "", // Initialize location
      jobDescription: "", // Initialize job description
    },
    professionalSummary: "",
    workExperience: [],
    education: [],
    skills: [],
    languages: [],
    achievements: [],
    certifications: [],
    references: [],
  })

  const [previewHtml, setPreviewHtml] = useState("")

  useEffect(() => {
    fetchTemplate()
  }, [templateId])

  useEffect(() => {
    const fullName = `${resumeData.personalInfo.firstName} ${resumeData.personalInfo.lastName}`.trim()
    if (fullName !== resumeData.personalInfo.fullName) {
      setResumeData((prev) => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          fullName,
        },
      }))
    }
  }, [resumeData.personalInfo.firstName, resumeData.personalInfo.lastName])

  useEffect(() => {
    if (template) {
      const html = renderResumeWithPlaceholders(template, resumeData)
      setPreviewHtml(html)
    }
  }, [resumeData, template])

  const fetchTemplate = async () => {
    try {
      if (!templateId) {
        toast.error("Please select a template first")
        router.push("/guest-resume-builder/templates")
        return
      }

      const templateData = await getTemplateById(templateId)
      if (!templateData) {
        throw new Error("Template not found")
      }

      setTemplate(templateData)
      const html = renderResumeWithPlaceholders(templateData, resumeData)
      setPreviewHtml(html)
    } catch (error) {
      console.error("Error fetching template:", error)
      toast.error("Failed to load template. Please try again.")
      router.push("/guest-resume-builder/templates")
    } finally {
      setLoading(false)
    }
  }

  const renderResumeWithPlaceholders = (template: any, data: ResumeData) => {
    if (!template?.html_template) return ""

    const safeReplace = (source: string, search: string, value: string) => {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      return source.replace(new RegExp(`{+\\s*${escaped}\\s*}+`, "g"), value ?? "")
    }

    function renderBlock(html: string, tag: string, items: any[], mapFn: (item: any, block: string) => string) {
      // Try modern syntax first {{#block tagname}}
      let result = html.replace(new RegExp(`{{#block\\s+${tag}}}([\\s\\S]*?){{/block}}`, "g"), (_, block) =>
        items?.length > 0 ? items.map((item) => mapFn(item, block)).join("") : "",
      )

      // Fall back to legacy syntax {#TAG}...{/TAG}
      result = result.replace(new RegExp(`{#${tag}}([\\s\\S]*?){/${tag}}`, "g"), (_, block) =>
        items?.length > 0 ? items.map((item) => mapFn(item, block)).join("") : "",
      )

      return result
    }

    let html = template.html_template
    const info = data.personalInfo || {}

    // --- Replace personal info placeholders ---
    html = safeReplace(html, "FULL_NAME", info.fullName || `${info.firstName || ""} ${info.lastName || ""}`.trim())
    html = safeReplace(html, "NAME", info.firstName || "")
    html = safeReplace(html, "SURNAME", info.lastName || "")
    html = safeReplace(html, "TAGLINE", info.tagline || "")
    html = safeReplace(html, "EMAIL", info.email || "")
    html = safeReplace(html, "PHONE", info.phone || "")
    html = safeReplace(html, "ADDRESS", info.address || "")
    html = safeReplace(html, "CITY", info.city || "")
    html = safeReplace(html, "LOCATION", info.location || info.city || "")
    html = safeReplace(html, "POSTCODE", info.postcode || "")
    html = safeReplace(html, "LINKEDIN", info.linkedin || "")
    html = safeReplace(html, "PORTFOLIO", info.portfolio || "")
    html = safeReplace(html, "PROFESSIONAL_SUMMARY", data.professionalSummary || "")

    html = renderBlock(html, "EXPERIENCE", data.workExperience || [], (exp, block) => {
      const descriptionHtml = (exp.descriptions || [])
        .filter((d: string) => d && d.trim())
        .map((d: string) => `<li>${d}</li>`)
        .join("")

      return block
        .replace(/{JOB_TITLE}/g, exp.jobTitle || "")
        .replace(/{COMPANY}/g, exp.employer || "")
        .replace(/{LOCATION}/g, exp.location || "")
        .replace(/{START_DATE}/g, exp.startDate || "")
        .replace(/{END_DATE}/g, exp.current ? "Present" : exp.endDate || "")
        .replace(/{DESCRIPTION}/g, descriptionHtml ? `<ul>${descriptionHtml}</ul>` : "")
    })

    html = renderBlock(html, "EDUCATION", data.education || [], (edu, block) =>
      block
        .replace(/{DEGREE}/g, edu.degree || "")
        .replace(/{INSTITUTION}/g, edu.institution || "")
        .replace(/{LOCATION}/g, edu.location || "")
        .replace(/{START_DATE}/g, edu.startDate || "")
        .replace(/{END_DATE}/g, edu.endDate || "")
        .replace(/{GPA}/g, edu.gpa || "")
        .replace(/{DESCRIPTION}/g, edu.description || ""),
    )

    html = renderBlock(html, "SKILLS", data.skills || [], (s, block) =>
      block.replace(/{SKILL}/g, typeof s === "string" ? s : s.name || ""),
    )

    html = renderBlock(html, "ACHIEVEMENTS", data.achievements || [], (a, block) =>
      block.replace(/{ACHIEVEMENT}/g, typeof a === "string" ? a : a.title || ""),
    )

    html = renderBlock(html, "LANGUAGES", data.languages || [], (l, block) =>
      block.replace(/{LANGUAGE}/g, typeof l === "string" ? l : l.name || ""),
    )

    html = renderBlock(html, "CERTIFICATIONS", data.certifications || [], (c, block) =>
      block.replace(/{CERTIFICATION}/g, typeof c === "string" ? c : c.name || ""),
    )

    html = renderBlock(html, "REFERENCES", data.references || [], (r, block) =>
      block
        .replace(/{REFERENCE_NAME}/g, r.name || "")
        .replace(/{REFERENCE_COMPANY}/g, r.company || "")
        .replace(/{REFERENCE_EMAIL}/g, r.email || "")
        .replace(/{REFERENCE_PHONE}/g, r.phone || ""),
    )

    // Remove any unreplaced placeholders
    html = html.replace(/{[^}]+}/g, "")

    const finalHTML = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-08">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${info.fullName || "Resume Preview"}</title>
          <style>
            @page { size: A4; margin: 18mm 15mm; }
            body {
              font-family: 'Inter', system-ui, sans-serif;
              color: #111827;
              line-height: 1.6;
              background-color: #fff;
              margin: 0;
              padding: 24px;
              isolation: isolate;
            }
            h1, h2, h3, h4 { margin: 0 0 4px 0; font-weight: 600; }
            h1 { font-size: 20pt; }
            h2 { font-size: 14pt; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-top: 16px; }
            p, li { font-size: 10pt; margin: 2px 0; }
            ul { margin: 4px 0 8px 20px; padding: 0; }
            .section { margin-bottom: 14px; }
            @media print {
              body { padding: 20mm 15mm; }
            }
          </style>
          <style>
            #resume-content { isolation: isolate; }
            ${template.css_styles || ""}
          </style>
        </head>
        <body>
          <div id="resume-content">
            ${html}
          </div>
        </body>
      </html>
    `

    return finalHTML
  }

  const generateSummaryWithAI = async () => {
    setGeneratingSummary(true)
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "summary",
          payload: {
            personalInfo: resumeData.personalInfo,
            jobDescription: resumeData.personalInfo.jobDescription || "",
          },
        }),
      })

      const json = await res.json()

      if (!json.success) {
        toast.error(json.error || "Failed to generate summary")
        return
      }

      setResumeData((prev) => ({
        ...prev,
        professionalSummary: json.result || "",
      }))

      toast.success("Professional summary generated!")
    } catch (error) {
      console.error("Error generating summary:", error)
      toast.error("Failed to generate summary. Please try again.")
    } finally {
      setGeneratingSummary(false)
    }
  }

  const generateWorkDescriptionWithAI = async (index: number) => {
    setGeneratingWorkDescription(index)
    try {
      const exp = resumeData.workExperience[index]
      // Pass job description in AI request for keyword matching
      const res = await fetch("/api/ai", {
        // Fixed API endpoint from /api/generate-ai-content to /api/ai
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "work-description", // Updated task name to "work-description"
          payload: {
            // Changed key from jobDescription to payload
            jobDescription: resumeData.personalInfo.jobDescription, // Pass JD to AI
            jobTitle: exp.jobTitle,
            employer: exp.employer,
            userContext: {
              skills: resumeData.skills.join(", "),
            },
          },
        }),
      })
      const json = await res.json()
      if (!json.success) {
        // Updated error handling to match the correct API response format
        toast.error(json.error || "Failed to generate work description")
        return
      }

      let descriptions: string[]
      if (Array.isArray(json.result)) {
        descriptions = json.result.filter((d: string) => d.trim())
      } else if (typeof json.result === "string") {
        descriptions = json.result.split("\n").filter((d: string) => d.trim())
      } else {
        descriptions = String(json.result)
          .split("\n")
          .filter((d: string) => d.trim())
      }

      while (descriptions.length < 5) {
        descriptions.push("")
      }
      descriptions = descriptions.slice(0, 5)

      setResumeData((prev) => ({
        ...prev,
        workExperience: prev.workExperience.map((item, i) => (i === index ? { ...item, descriptions } : item)),
      }))
      toast.success("Work description generated!")
    } catch (error) {
      console.error("Error generating work description:", error)
      toast.error("Failed to generate work description. Please try again.")
    } finally {
      setGeneratingWorkDescription(null)
    }
  }

  const generateSkillsWithAI = async () => {
    setGeneratingSkills(true)
    try {
      const res = await fetch("/api/ai", {
        // Fixed API endpoint from /api/generate-ai-content to /api/ai
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "skills", // Updated task name to "skills"
          payload: {
            // Changed key from jobDescription to payload
            jobDescription: resumeData.personalInfo.jobDescription || "", // Pass empty string if not provided
            personalInfo: resumeData.personalInfo,
          },
        }),
      })

      const json = await res.json()

      if (!json.success) {
        // Updated error handling to match the correct API response format
        toast.error(json.error || "Failed to generate skills")
        return
      }

      const skillsList = Array.isArray(json.result)
        ? json.result
        : String(json.result)
            .split("\n")
            .map((s: string) => s.replace(/^[-•*]\s*/, "").trim())
            .filter((s: string) => s.length > 0)

      setResumeData((prev) => ({
        ...prev,
        skills: [...(prev.skills || []), ...skillsList],
      }))

      toast.success("Skills generated!")
    } catch (error) {
      console.error("Error generating skills:", error)
      toast.error("Failed to generate skills. Please try again.")
    } finally {
      setGeneratingSkills(false)
    }
  }

  const updatePersonalInfo = (field: keyof PersonalInfo, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value,
      },
    }))
  }

  const updateProfessionalSummary = (value: string) => {
    setResumeData((prev) => ({ ...prev, professionalSummary: value }))
  }

  const addWorkExperience = () => {
    const newExp = {
      employer: "",
      jobTitle: "",
      location: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      descriptions: [""],
      current: false,
    }

    setResumeData((prev) => ({
      ...prev,
      workExperience: [...(prev.workExperience || []), newExp],
    }))

    // If job description exists, automatically generate descriptions for the new experience
    if (resumeData.personalInfo.jobDescription?.trim()) {
      setTimeout(() => {
        generateWorkDescriptionWithAI(resumeData.workExperience.length)
      }, 300)
    }
  }

  const updateWorkExperience = (index: number, field: keyof WorkExperience, value: any) => {
    setResumeData((prev) => ({
      ...prev,
      workExperience: prev.workExperience.map((exp, i) => (i === index ? { ...exp, [field]: value } : exp)),
    }))
  }

  const updateWorkDescription = (expIndex: number, descIndex: number, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      workExperience: prev.workExperience.map((exp, i) =>
        i === expIndex
          ? {
              ...exp,
              descriptions: exp.descriptions.map((desc, j) => (j === descIndex ? value : desc)),
            }
          : exp,
      ),
    }))
  }

  const addWorkDescription = (expIndex: number) => {
    setResumeData((prev) => ({
      ...prev,
      workExperience: prev.workExperience.map((exp, i) =>
        i === expIndex
          ? {
              ...exp,
              descriptions: [...exp.descriptions, ""],
            }
          : exp,
      ),
    }))
  }

  const removeWorkDescription = (expIndex: number, descIndex: number) => {
    setResumeData((prev) => ({
      ...prev,
      workExperience: prev.workExperience.map((exp, i) =>
        i === expIndex
          ? {
              ...exp,
              descriptions: exp.descriptions.filter((_, j) => j !== descIndex),
            }
          : exp,
      ),
    }))
  }

  const removeWorkExperience = (index: number) => {
    setResumeData((prev) => ({
      ...prev,
      workExperience: prev.workExperience.filter((_, i) => i !== index),
    }))
  }

  const addEducation = () => {
    const newEducation: Education = {
      degree: "",
      institution: "",
      location: "",
      startDate: "",
      endDate: "",
      gpa: "",
      description: "",
    }
    setResumeData((prev) => ({
      ...prev,
      education: [...prev.education, newEducation],
    }))
  }

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.map((edu, i) => (i === index ? { ...edu, [field]: value } : edu)),
    }))
  }

  const removeEducation = (index: number) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }))
  }

  const addArrayItem = (field: keyof ResumeData, item: any = "") => {
    setResumeData((prev) => ({
      ...prev,
      [field]: [...(prev[field] as any[]), item],
    }))
  }

  const updateArrayItem = (field: keyof ResumeData, index: number, value: any) => {
    setResumeData((prev) => ({
      ...prev,
      [field]: (prev[field] as any[]).map((item, i) => (i === index ? value : item)),
    }))
  }

  const removeArrayItem = (field: keyof ResumeData, index: number) => {
    setResumeData((prev) => ({
      ...prev,
      [field]: (prev[field] as any[]).filter((_, i) => i !== index),
    }))
  }

  const handleCreateResumeBeforePayment = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/save-guest-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resumeData.personalInfo.email,
          firstName: resumeData.personalInfo.firstName,
          lastName: resumeData.personalInfo.lastName,
          phone: resumeData.personalInfo.phone,

          // Send full resume data
          resumeData: resumeData,

          // MUST send templateName (NOT templateId)
          templateName: template?.name, // Use template.name
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.error || "Failed to save resume")
        return null
      }

      const data = await response.json()
      setResumeId(data.resumeId)
      return data.resumeId
    } catch (err) {
      console.error("[GUEST-RESUME] Error saving resume:", err)
      toast.error("Failed to save resume. Please try again.")
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!resumeData.personalInfo.firstName) {
      toast.error("Please enter your first name")
      return
    }
    if (!resumeData.personalInfo.lastName) {
      toast.error("Please enter your last name")
      return
    }
    if (!resumeData.personalInfo.email) {
      toast.error("Please enter your email")
      return
    }

    // Create resume first if not already created
    let finalResumeId = resumeId
    if (!finalResumeId) {
      finalResumeId = await handleCreateResumeBeforePayment()
      if (!finalResumeId) {
        return
      }
    }

    // Now proceed to payment with resumeId
    setShowPaymentStep(true)
  }

  const proceedToPayment = () => {
    const fullName = `${resumeData.personalInfo.firstName} ${resumeData.personalInfo.lastName}`.trim()
    if (!fullName) {
      toast.error("Please enter your name")
      return
    }
    if (!resumeData.personalInfo.email) {
      toast.error("Please enter your email")
      return
    }
    setShowPaymentStep(true)
  }

  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      const filename = `${resumeData.personalInfo.firstName} ${resumeData.personalInfo.lastName}`.trim()

      const response = await fetch("/api/generate-pdf-playwright", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: previewHtml,
          resumeTitle: filename,
          resumeId: resumeId, // Pass the resume ID to the PDF generation API
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "PDF generation failed")
      }

      const data = await response.json()

      let pdfBase64: string
      let pdfFileName: string

      if (data.pdf) {
        // Server-side PDF was generated successfully
        pdfBase64 = data.pdf
        pdfFileName = data.name || `${filename.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`
      } else if (data.html) {
        // Server-side failed, use client-side generation
        console.log("[v0] Using client-side PDF generation for guest")
        toast.info("Generating PDF on your device...")
        const result = await generatePdfFromHtmlClient(data.html, data.title || filename)
        pdfBase64 = result.pdf
        pdfFileName = result.name
      } else {
        throw new Error("No PDF data received")
      }

      const pdfBlob = new Uint8Array(
        atob(pdfBase64)
          .split("")
          .map((e) => e.charCodeAt(0)),
      )
      const url = URL.createObjectURL(new Blob([pdfBlob], { type: "application/pdf" }))
      const a = document.createElement("a")
      a.href = url
      a.download = pdfFileName
      a.click()
      URL.revokeObjectURL(url)

      toast.success("Resume downloaded successfully!")
      setShowPaymentStep(false)
    } catch (error: any) {
      console.error("PDF generation error:", error)
      toast.error("Failed to download resume")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Template not found. Please select a template first.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (showPaymentStep) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div>
                <h1 className="text-lg font-semibold">Complete Your Resume</h1>
                <p className="text-sm text-gray-600">Pay to download your professional resume</p>
              </div>
              <Button variant="outline" onClick={() => setShowPaymentStep(false)}>
                Back to Editor
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Resume Download
                </CardTitle>
                <CardDescription>Complete payment to download your professional resume</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-center space-x-4 p-3 bg-gray-50 rounded-lg">
                  <span className={`text-sm ${currency === "KES" ? "text-gray-900 font-medium" : "text-gray-500"}`}>
                    Ksh (KES)
                  </span>
                  <Switch
                    checked={currency === "USD"}
                    onCheckedChange={(checked) => setCurrency(checked ? "USD" : "KES")}
                  />
                  <span className={`text-sm ${currency === "USD" ? "text-gray-900 font-medium" : "text-gray-500"}`}>
                    USD ($)
                  </span>
                </div>

                <div className="text-center">
                  <p className="text-3xl font-bold">{currency === "KES" ? "Ksh 299" : "$2.50"}</p>
                  <p className="text-sm text-gray-600">One-time payment</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Resume Download</span>
                    <span>{currency === "KES" ? "Ksh 299" : "$2.50"}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{currency === "KES" ? "Ksh 299" : "$2.50"}</span>
                    </div>
                  </div>
                </div>

                <GuestPayButton
                  amount={currency === "KES" ? 299 : 2.5}
                  currency={currency}
                  type="guest_resume_download"
                  description={`Guest Resume Download - ${currency === "KES" ? "Ksh 299" : "$2.50"}`}
                  resumeData={resumeData}
                  resumeId={resumeId} // Pass resumeId to GuestPayButton
                  onSuccess={handlePaymentSuccess}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay {currency === "KES" ? "Ksh 299" : "$2.50"} & Download Resume
                </GuestPayButton>

                <div className="text-xs text-gray-500 text-center">Secure payment powered by Paystack</div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 mb-2">Ready to save your resumes?</p>
                  <Button variant="outline" size="sm" onClick={() => router.push("/auth/signup")} className="w-full">
                    Create Account to Save & Get 3 Free Downloads
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resume Preview</CardTitle>
                <CardDescription>This is how your resume will look when downloaded</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden" style={{ height: "600px" }}>
                  {previewHtml ? (
                    <div
                      style={{
                        transform: `scale(${previewZoom / 100})`,
                        transformOrigin: "top left",
                        display: "inline-block",
                        width: "210mm",
                      }}
                    >
                      <div
                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                        style={{ width: "210mm", height: "297mm" }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Loading preview...</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-lg font-semibold">Resume Builder (Guest)</h1>
              <p className="text-sm text-gray-600">Using {template.name}</p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="bg-orange-50 border-orange-200 text-orange-800">
                <AlertCircle className="h-3 w-3 mr-1" />
                Guest Mode
              </Badge>
              <Button variant="outline" onClick={() => router.push("/guest-resume-builder/templates")}>
                Change Template
              </Button>
              <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
                  <DialogHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <DialogTitle>Resume Preview - Full Screen</DialogTitle>
                        <DialogDescription>This is how your resume will look when downloaded</DialogDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewZoom(Math.max(50, previewZoom - 10))}
                        >
                          −
                        </Button>
                        <span className="text-sm font-medium w-12 text-center">{previewZoom}%</span>
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
                  </DialogHeader>
                  <div className="bg-white border rounded-lg overflow-auto" style={{ height: "800px" }}>
                    {previewHtml ? (
                      <div
                        style={{
                          transform: `scale(${previewZoom / 100})`,
                          transformOrigin: "top left",
                          display: "inline-block",
                          width: "210mm",
                        }}
                      >
                        <div
                          dangerouslySetInnerHTML={{ __html: previewHtml }}
                          style={{ width: "210mm", height: "297mm" }}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Loading preview...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              <Button onClick={handlePayment} className="bg-blue-600 hover:bg-blue-700">
                Next: Download
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Alert className="bg-orange-50 border-orange-200 rounded-none">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          You're in guest mode. Your work won't be saved.{" "}
          <Button variant="link" className="h-auto p-0 ml-1" onClick={() => router.push("/auth/signup")}>
            Sign up to save your resumes and get benefits.
          </Button>
        </AlertDescription>
      </Alert>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <p className="text-sm font-medium text-blue-900">Guest Resume Builder</p>
                <p className="text-xs text-blue-700 mt-1">
                  Download for <span className="font-semibold">Ksh 299</span> per resume
                </p>
              </div>
            </div>
            <Badge variant="secondary">Pay Per Download</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Build Your Resume</CardTitle>
                <CardDescription>Fill in your information to create your professional resume</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <div className="overflow-x-auto mb-6">
                    <TabsList className="grid grid-cols-6 md:grid-cols-6 whitespace-nowrap inline-flex w-full">
                      <TabsTrigger value="personal" className="text-xs md:text-sm whitespace-nowrap flex-shrink-0">
                        Personal
                      </TabsTrigger>
                      <TabsTrigger value="summary" className="text-xs md:text-sm whitespace-nowrap flex-shrink-0">
                        Summary
                      </TabsTrigger>
                      <TabsTrigger value="experience" className="text-xs md:text-sm whitespace-nowrap flex-shrink-0">
                        Experience
                      </TabsTrigger>
                      <TabsTrigger value="education" className="text-xs md:text-sm whitespace-nowrap flex-shrink-0">
                        Education
                      </TabsTrigger>
                      <TabsTrigger value="skills" className="text-xs md:text-sm whitespace-nowrap flex-shrink-0">
                        Skills
                      </TabsTrigger>
                      <TabsTrigger value="extras" className="text-xs md:text-sm whitespace-nowrap flex-shrink-0">
                        Extras
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                    <TabsContent value="personal" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            value={resumeData.personalInfo.firstName}
                            onChange={(e) => updatePersonalInfo("firstName", e.target.value)}
                            placeholder="John"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            value={resumeData.personalInfo.lastName}
                            onChange={(e) => updatePersonalInfo("lastName", e.target.value)}
                            placeholder="Doe"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="tagline">Professional Tagline</Label>
                        <Input
                          id="tagline"
                          value={resumeData.personalInfo.tagline}
                          onChange={(e) => updatePersonalInfo("tagline", e.target.value)}
                          placeholder="Software Engineer | Full Stack Developer"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={resumeData.personalInfo.email}
                            onChange={(e) => updatePersonalInfo("email", e.target.value)}
                            placeholder="john@example.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={resumeData.personalInfo.phone}
                            onChange={(e) => updatePersonalInfo("phone", e.target.value)}
                            placeholder="+254 700 000 000"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={resumeData.personalInfo.city}
                            onChange={(e) => updatePersonalInfo("city", e.target.value)}
                            placeholder="Nairobi"
                          />
                        </div>
                        <div>
                          <Label htmlFor="postcode">Postcode</Label>
                          <Input
                            id="postcode"
                            value={resumeData.personalInfo.postcode}
                            onChange={(e) => updatePersonalInfo("postcode", e.target.value)}
                            placeholder="00100"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="linkedin">LinkedIn</Label>
                          <Input
                            id="linkedin"
                            value={resumeData.personalInfo.linkedin}
                            onChange={(e) => updatePersonalInfo("linkedin", e.target.value)}
                            placeholder="linkedin.com/in/yourprofile"
                          />
                        </div>
                        <div>
                          <Label htmlFor="portfolio">Portfolio</Label>
                          <Input
                            id="portfolio"
                            value={resumeData.personalInfo.portfolio}
                            onChange={(e) => updatePersonalInfo("portfolio", e.target.value)}
                            placeholder="yourportfolio.com"
                          />
                        </div>
                      </div>
                      {/* Added Address and Location fields */}
                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={resumeData.personalInfo.address || ""}
                          onChange={(e) => updatePersonalInfo("address", e.target.value)}
                          placeholder="e.g. 123 Main St, Nairobi"
                        />
                      </div>
                      <div>
                        <Label htmlFor="location">Region/State</Label>
                        <Input
                          id="location"
                          value={resumeData.personalInfo.location || ""}
                          onChange={(e) => updatePersonalInfo("location", e.target.value)}
                          placeholder="e.g. Nairobi County"
                        />
                      </div>
                      <div>
                        <Label htmlFor="jobDescription">
                          Job Description (Optional)
                          <span className="text-xs text-gray-500 ml-1">
                            - Used to generate work descriptions with relevant keywords
                          </span>
                        </Label>
                        <Textarea
                          id="jobDescription"
                          value={resumeData.personalInfo.jobDescription || ""}
                          onChange={(e) => updatePersonalInfo("jobDescription", e.target.value)}
                          placeholder="Paste the target job description here. This will help AI generate work experience descriptions with matching keywords and requirements."
                          rows={4}
                          className="text-sm"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="summary" className="space-y-4">
                      <div>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-2">
                          <Label htmlFor="summary">Professional Summary</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={generateSummaryWithAI}
                            disabled={generatingSummary}
                            className="w-full md:w-auto bg-transparent"
                          >
                            {generatingSummary ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4 mr-2" />
                            )}
                            Generate with AI
                          </Button>
                        </div>
                        <Textarea
                          id="summary"
                          value={resumeData.professionalSummary}
                          onChange={(e) => updateProfessionalSummary(e.target.value)}
                          placeholder="Write a brief professional summary..."
                          rows={6}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="experience" className="space-y-4">
                      <div className="space-y-4">
                        {resumeData.workExperience.map((exp, index) => (
                          <Card key={index}>
                            <CardContent className="pt-6">
                              <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-medium">Experience {index + 1}</h4>
                                  <Button variant="outline" size="sm" onClick={() => removeWorkExperience(index)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label>Job Title</Label>
                                    <Input
                                      value={exp.jobTitle}
                                      onChange={(e) => updateWorkExperience(index, "jobTitle", e.target.value)}
                                      placeholder="Software Engineer"
                                    />
                                  </div>
                                  <div>
                                    <Label>Company</Label>
                                    <Input
                                      value={exp.employer}
                                      onChange={(e) => updateWorkExperience(index, "employer", e.target.value)}
                                      placeholder="Tech Corp"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <Label>Location</Label>
                                    <Input
                                      value={exp.location}
                                      onChange={(e) => updateWorkExperience(index, "location", e.target.value)}
                                      placeholder="Nairobi, Kenya"
                                    />
                                  </div>
                                  <div>
                                    <Label>Start Date</Label>
                                    <Input
                                      type="month"
                                      value={exp.startDate}
                                      onChange={(e) => updateWorkExperience(index, "startDate", e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <Label>End Date</Label>
                                    <Input
                                      type="month"
                                      value={exp.endDate}
                                      onChange={(e) => updateWorkExperience(index, "endDate", e.target.value)}
                                      disabled={exp.current}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`current-${index}`}
                                    checked={exp.current}
                                    onChange={(e) => updateWorkExperience(index, "current", e.target.checked)}
                                  />
                                  <Label htmlFor={`current-${index}`}>I currently work here</Label>
                                </div>
                                <div>
                                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-2">
                                    <Label>Job Descriptions</Label>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => generateWorkDescriptionWithAI(index)}
                                      disabled={generatingWorkDescription === index || !exp.jobTitle || !exp.employer}
                                      className="w-full md:w-auto"
                                    >
                                      {generatingWorkDescription === index ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      ) : (
                                        <Sparkles className="h-4 w-4 mr-2" />
                                      )}
                                      Generate with AI
                                    </Button>
                                  </div>
                                  <div className="space-y-2">
                                    {exp.descriptions.map((desc, descIndex) => (
                                      <div key={descIndex} className="flex gap-2">
                                        <Textarea
                                          value={desc}
                                          onChange={(e) => updateWorkDescription(index, descIndex, e.target.value)}
                                          placeholder={`Description ${descIndex + 1}...`}
                                          rows={2}
                                          className="flex-1"
                                        />
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => removeWorkDescription(index, descIndex)}
                                          disabled={exp.descriptions.length === 1}
                                          className="flex-shrink-0"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => addWorkDescription(index)}
                                      disabled={exp.descriptions.length >= 10}
                                      className="w-full"
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add Description
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        <Button variant="outline" onClick={addWorkExperience} className="w-full bg-transparent">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Experience
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="education" className="space-y-4">
                      <div className="space-y-4">
                        {resumeData.education.map((edu, index) => (
                          <Card key={index}>
                            <CardContent className="pt-6">
                              <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                  <h4 className="font-medium">Education {index + 1}</h4>
                                  <Button variant="outline" size="sm" onClick={() => removeEducation(index)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label>Degree</Label>
                                    <Input
                                      value={edu.degree}
                                      onChange={(e) => updateEducation(index, "degree", e.target.value)}
                                      placeholder="Bachelor of Science in Computer Science"
                                    />
                                  </div>
                                  <div>
                                    <Label>Institution</Label>
                                    <Input
                                      value={edu.institution}
                                      onChange={(e) => updateEducation(index, "institution", e.target.value)}
                                      placeholder="University of Nairobi"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <Label>Location</Label>
                                    <Input
                                      value={edu.location}
                                      onChange={(e) => updateEducation(index, "location", e.target.value)}
                                      placeholder="Nairobi, Kenya"
                                    />
                                  </div>
                                  <div>
                                    <Label>Start Date</Label>
                                    <Input
                                      type="month"
                                      value={edu.startDate}
                                      onChange={(e) => updateEducation(index, "startDate", e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <Label>End Date</Label>
                                    <Input
                                      type="month"
                                      value={edu.endDate}
                                      onChange={(e) => updateEducation(index, "endDate", e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label>GPA (Optional)</Label>
                                    <Input
                                      value={edu.gpa}
                                      onChange={(e) => updateEducation(index, "gpa", e.target.value)}
                                      placeholder="3.8"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label>Description (Optional)</Label>
                                  <Textarea
                                    value={edu.description}
                                    onChange={(e) => updateEducation(index, "description", e.target.value)}
                                    placeholder="Relevant coursework, achievements, etc."
                                    rows={2}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        <Button variant="outline" onClick={addEducation} className="w-full bg-transparent">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Education
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="skills" className="space-y-4">
                      <div>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-2">
                          <Label>Technical Skills</Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={generateSkillsWithAI}
                            disabled={generatingSkills}
                            className="w-full md:w-auto bg-transparent"
                          >
                            {generatingSkills ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4 mr-2" />
                            )}
                            Suggest Skills
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {resumeData.skills.map((skill, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                value={skill}
                                onChange={(e) => updateArrayItem("skills", index, e.target.value)}
                                placeholder="Enter a skill"
                                className="flex-1"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeArrayItem("skills", index)}
                                className="flex-shrink-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button variant="outline" onClick={() => addArrayItem("skills")} className="w-full">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Skill
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label>Languages</Label>
                        <div className="space-y-2">
                          {resumeData.languages.map((language, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                value={language}
                                onChange={(e) => updateArrayItem("languages", index, e.target.value)}
                                placeholder="English (Native)"
                                className="flex-1"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeArrayItem("languages", index)}
                                className="flex-shrink-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button variant="outline" onClick={() => addArrayItem("languages")} className="w-full">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Language
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="extras" className="space-y-4">
                      <div>
                        <Label>Achievements</Label>
                        <div className="space-y-2">
                          {resumeData.achievements.map((achievement, index) => (
                            <div key={index} className="flex gap-2">
                              <Textarea
                                value={achievement}
                                onChange={(e) => updateArrayItem("achievements", index, e.target.value)}
                                placeholder="Describe an achievement..."
                                rows={2}
                                className="flex-1"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeArrayItem("achievements", index)}
                                className="flex-shrink-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button variant="outline" onClick={() => addArrayItem("achievements")} className="w-full">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Achievement
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label>Certifications</Label>
                        <div className="space-y-2">
                          {resumeData.certifications.map((certification, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                value={certification}
                                onChange={(e) => updateArrayItem("certifications", index, e.target.value)}
                                placeholder="AWS Certified Solutions Architect"
                                className="flex-1"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeArrayItem("certifications", index)}
                                className="flex-shrink-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button variant="outline" onClick={() => addArrayItem("certifications")} className="w-full">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Certification
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label>References</Label>
                        <div className="space-y-4">
                          {resumeData.references.map((reference, index) => (
                            <Card key={index}>
                              <CardContent className="pt-4">
                                <div className="space-y-3">
                                  <div className="flex justify-between items-start">
                                    <h5 className="font-medium">Reference {index + 1}</h5>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removeArrayItem("references", index)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <Label>Name</Label>
                                      <Input
                                        value={reference.name}
                                        onChange={(e) =>
                                          updateArrayItem("references", index, { ...reference, name: e.target.value })
                                        }
                                        placeholder="John Smith"
                                      />
                                    </div>
                                    <div>
                                      <Label>Company</Label>
                                      <Input
                                        value={reference.company}
                                        onChange={(e) =>
                                          updateArrayItem("references", index, {
                                            ...reference,
                                            company: e.target.value,
                                          })
                                        }
                                        placeholder="Tech Company Inc."
                                      />
                                    </div>
                                    <div>
                                      <Label>Phone</Label>
                                      <Input
                                        value={reference.phone}
                                        onChange={(e) =>
                                          updateArrayItem("references", index, { ...reference, phone: e.target.value })
                                        }
                                        placeholder="+254 700 000 000"
                                      />
                                    </div>
                                    <div>
                                      <Label>Email</Label>
                                      <Input
                                        value={reference.email}
                                        onChange={(e) =>
                                          updateArrayItem("references", index, { ...reference, email: e.target.value })
                                        }
                                        placeholder="john.smith@company.com"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          <Button
                            variant="outline"
                            onClick={() => addArrayItem("references", { name: "", company: "", phone: "", email: "" })}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Reference
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Live Preview */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Eye className="h-5 w-5 mr-2" />
                    Live Preview
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPreviewZoom(Math.max(50, previewZoom - 10))}>
                      −
                    </Button>
                    <span className="text-sm font-medium w-12 text-center">{previewZoom}%</span>
                    <Button variant="outline" size="sm" onClick={() => setPreviewZoom(Math.min(200, previewZoom + 10))}>
                      +
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
                      <ZoomIn className="h-4 w-4 mr-2" />
                      Full View
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>See how your resume looks in real-time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-white border border-gray-200 rounded-lg overflow-auto" style={{ height: "600px" }}>
                  {previewHtml ? (
                    <ResumePreviewRenderer previewHtml={previewHtml} zoom={previewZoom} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Fill in your information to see the preview</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Resume Preview - Full Screen</DialogTitle>
                <DialogDescription>This is how your resume will look when downloaded</DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPreviewZoom(Math.max(50, previewZoom - 10))}>
                  −
                </Button>
                <span className="text-sm font-medium w-12 text-center">{previewZoom}%</span>
                <Button variant="outline" size="sm" onClick={() => setPreviewZoom(Math.min(200, previewZoom + 10))}>
                  +
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPreviewZoom(100)}>
                  Reset
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="bg-white border rounded-lg overflow-auto" style={{ height: "800px" }}>
            {previewHtml ? (
              <ResumePreviewRenderer previewHtml={previewHtml} zoom={previewZoom} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Loading preview...</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface PayButtonProps {
  amount: number
  currency?: string
  type?: string
  description?: string
  resumeData?: any
  resumeId?: string | null // Add resumeId prop
  onSuccess?: (response: any) => void
  children: React.ReactNode
  className?: string
}

const GuestPayButton = ({
  amount,
  currency = "KES",
  type,
  description,
  resumeData,
  resumeId, // Accept resumeId prop
  onSuccess,
  children,
  className,
}: PayButtonProps) => {
  const [isLoading, setIsLoading] = useState(false)

  const handlePayment = async () => {
    setIsLoading(true)
    try {
      // Use provided email or fallback to placeholder
      const email = resumeData?.personalInfo?.email || "guest@kasinest.app"

      const response = await fetch("/api/initialize-payment-guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency: currency.toUpperCase(),
          type,
          description: description || `${type} payment`,
          email,
          resumeId, // Now resumeId is available from prop
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Payment initialization failed")
      }

      const data = await response.json()

      if (data.success && data.data?.authorization_url) {
        localStorage.setItem(
          "pendingGuestPayment",
          JSON.stringify({
            type,
            amount,
            currency,
            reference: data.data.reference,
            email,
            resumeId,
          }),
        )
        window.location.href = data.data.authorization_url
      } else {
        throw new Error("Invalid response from payment service")
      }
    } catch (error) {
      console.error("[v0] Payment error:", error)
      toast.error(`Payment failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handlePayment} disabled={isLoading} className={className}>
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        children
      )}
    </Button>
  )
}
