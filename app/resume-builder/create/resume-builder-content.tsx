"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Plus, Trash2, Eye, Save, ArrowRight, Loader2, ZoomIn, FileText, Sparkles } from "lucide-react"
import { getTemplateById } from "@/lib/templates"
import { supabase } from "@/lib/supabase"
import { getUserSubscription, checkUsageLimit } from "@/lib/subscription"
import { toast } from "sonner"
import dynamic from "next/dynamic"

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
  jobDescription?: string
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
  colorScheme: {
    headlineColor: string
    accentColor: string
  }
}

export default function ResumeBuilderContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams.get("template")

  const [template, setTemplate] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [usageCheck, setUsageCheck] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("personal")
  const [previewOpen, setPreviewOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [resumeId, setResumeId] = useState<string | null>(null)
  // Removed showPaymentStep state
  const [userProfile, setUserProfile] = useState<any>(null)
  const [currency, setCurrency] = useState<"KES" | "USD">("KES")
  const [previewZoom, setPreviewZoom] = useState(90)
  const [showPreview, setShowPreview] = useState(true) // State to toggle preview visibility

  // Resume data state
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
      jobDescription: "", // Initialize jobDescription
    },
    professionalSummary: "",
    workExperience: [],
    education: [],
    skills: [],
    languages: [],
    achievements: [],
    certifications: [],
    references: [],
    colorScheme: {
      headlineColor: "#2563eb",
      accentColor: "#3b82f6",
    },
  })

  const [previewHtml, setPreviewHtml] = useState("")

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  useEffect(() => {
    // Update full name when first/last name changes
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
    // Update preview whenever resume data changes
    if (template) {
      const html = renderResumeWithPlaceholders(template, resumeData)
      setPreviewHtml(html)
    }
  }, [resumeData, template])

  const fetchData = async () => {
    try {
      console.log("[v0] Fetching template and subscription data...")

      if (!templateId) {
        console.log("[v0] No template ID provided, redirecting to templates page")
        toast.error("Please select a template first")
        router.push("/resume-builder/templates")
        return
      }

      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user?.id).single()

      if (profileData) {
        setUserProfile(profileData)
        console.log("[v0] Loaded user profile data")

        if (!resumeData.personalInfo.firstName && !resumeData.personalInfo.lastName) {
          const nameParts = profileData.full_name?.split(" ") || []
          setResumeData((prev) => ({
            ...prev,
            personalInfo: {
              ...prev.personalInfo,
              firstName: nameParts[0] || "",
              lastName: nameParts.slice(1).join(" ") || "",
              fullName: profileData.full_name || "",
              email: profileData.email || user?.email || "",
              phone: profileData.phone || "",
              city: profileData.location?.split(",")[0]?.trim() || "",
              tagline: profileData.job_title || "",
              // Initialize jobDescription from profile if available
              jobDescription: profileData.job_description || "",
            },
          }))
        }
      }

      let templateData = null

      if (templateId) {
        try {
          templateData = await getTemplateById(templateId)
        } catch (templateError) {
          console.error("[v0] Error fetching template:", templateError)
          toast.error("Template not found. Please select a valid template.")
          router.push("/resume-builder/templates")
          return
        }
      }

      if (!templateData) {
        throw new Error("Template not found")
      }

      const [subData, usageData] = await Promise.all([
        getUserSubscription(user?.id || ""),
        checkUsageLimit(user?.id || "", "resumes"),
      ])

      setTemplate(templateData)
      setSubscription(subData)
      setUsageCheck(usageData)

      const html = renderResumeWithPlaceholders(templateData, resumeData)
      setPreviewHtml(html)

      console.log("[v0] Data fetched successfully")
    } catch (error) {
      console.error("[v0] Error fetching data:", error)
      toast.error("Failed to load template. Please try again.")
      setLoading(false)
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
        items?.length ? items.map((item) => mapFn(item, block)).join("") : "",
      )

      // Fall back to legacy syntax {#TAG}...{/TAG}
      result = result.replace(new RegExp(`{#${tag}}([\\s\\S]*?){/${tag}}`, "g"), (_, block) =>
        items?.length ? items.map((item) => mapFn(item, block)).join("") : "",
      )

      return result
    }

    let html = template.html_template
    const info = data.personalInfo || {}

    // --- Modern replacements ---
    html = safeReplace(html, "FULL_NAME", info.fullName || `${info.firstName || ""} ${info.lastName || ""}`.trim())
    html = safeReplace(html, "NAME", info.firstName || "")
    html = safeReplace(html, "SURNAME", info.lastName || "")
    html = safeReplace(html, "TAGLINE", info.tagline || "Professional")
    html = safeReplace(html, "EMAIL", info.email || "")
    html = safeReplace(html, "PHONE", info.phone || "")
    html = safeReplace(html, "ADDRESS", info.address || "")
    html = safeReplace(html, "CITY", info.city || "")
    html = safeReplace(html, "LOCATION", info.location || info.city || "")
    html = safeReplace(html, "POSTCODE", info.postcode || "")
    html = safeReplace(html, "LINKEDIN", info.linkedin || "")
    html = safeReplace(html, "PORTFOLIO", info.portfolio || "")
    html = safeReplace(html, "PROFESSIONAL_SUMMARY", data.professionalSummary || "")

    // --- Modern block replacements ---
    html = renderBlock(html, "EXPERIENCE", data.workExperience || [], (exp, block) => {
      const descriptionHtml = (exp.descriptions || [])
        .filter((d: string) => d.trim())
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

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>${info.fullName || "Resume Preview"}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            @page { size: A4; margin: 18mm 15mm; }
            body {
              font-family: 'Inter', system-ui, sans-serif;
              color: #111827;
              line-height: 1.6;
              background-color: #fff;
              margin: 0;
              padding: 24px;
            }
            h1, h2, h3, h4 { margin: 0 0 4px 0; font-weight: 600; }
            h1 { font-size: 20pt; }
            h2 {
              font-size: 14pt;
              color: var(--headline-color, ${data.colorScheme.headlineColor});
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 4px;
              margin-top: 16px;
            }
            p, li { font-size: 10pt; margin: 2px 0; }
            ul { margin: 4px 0 8px 20px; padding: 0; }
            .section { margin-bottom: 14px; }
            /* A4 page break padding for better visual spacing */
            @media print {
              body { padding: 20mm 15mm; }
            }
            /* Custom styles for accent color */
            a { color: ${data.colorScheme.accentColor}; }
            .accent-text { color: ${data.colorScheme.accentColor}; }
            .headline-text { color: ${data.colorScheme.headlineColor}; }
          </style>
          <style>#resume-content { isolation: isolate; } ${template.css_styles || ""}</style>
        </head>
        <body><div id="resume-content">${html}</div></body>
      </html>
    `
  }
  // AI Generation Functions
  const generateSummaryWithAI = async () => {
    setAiLoading("summary")
    try {
      const payload = {
        ...resumeData,
        userProfile: {
          bio: userProfile?.bio,
          job_title: userProfile?.job_title,
          company: userProfile?.company,
          years_experience: userProfile?.years_experience,
          skills: userProfile?.skills,
        },
        jobDescription: resumeData.personalInfo.jobDescription,
      }

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.JSONstringify({ task: "summary", payload }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)

      setResumeData((prev) => ({ ...prev, professionalSummary: json.result as string }))
      toast.success("Professional summary generated!")
    } catch (error) {
      console.error("Error generating summary:", error)
      toast.error("Failed to generate summary. Please try again.")
    } finally {
      setAiLoading(null)
    }
  }

  const generateWorkDescriptionWithAI = async (index: number) => {
    setAiLoading(`work-${index}`)
    try {
      const exp = resumeData.workExperience[index]
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.JSONstringify({
          task: "work-description",
          payload: {
            jobTitle: exp.jobTitle,
            employer: exp.employer,
            // Pass jobDescription from PersonalInfo for keyword matching
            jobDescription: resumeData.personalInfo.jobDescription,
            userContext: {
              skills: userProfile?.skills || resumeData.skills.join(", "),
              yearsExperience: userProfile?.years_experience,
            },
          },
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)

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

      // Ensure exactly 5 descriptions (pad with empty strings if fewer, trim if more)
      while (descriptions.length < 5) {
        descriptions.push("")
      }
      descriptions = descriptions.slice(0, 5)

      console.log("[v0] Generated work descriptions:", descriptions)

      setResumeData((prev) => ({
        ...prev,
        workExperience: prev.workExperience.map((item, i) => (i === index ? { ...item, descriptions } : item)),
      }))
      toast.success("Work description generated!")
    } catch (error) {
      console.error("Error generating work description:", error)
      toast.error("Failed to generate work description. Please try again.")
    } finally {
      setAiLoading(null)
    }
  }

  const generateSkillsWithAI = async () => {
    setAiLoading("skills")
    try {
      const payload = {
        ...resumeData,
        userProfile: {
          skills: userProfile?.skills,
          job_title: userProfile?.job_title,
        },
        jobDescription: resumeData.personalInfo.jobDescription,
      }

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.JSONstringify({ task: "skills", payload }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)

      const newSkills = [...resumeData.skills, ...(json.result as string[])].slice(0, 10)
      setResumeData((prev) => ({ ...prev, skills: newSkills }))
      toast.success("Skills suggestions generated!")
    } catch (error) {
      console.error("Error generating skills:", error)
      toast.error("Failed to generate skills. Please try again.")
    } finally {
      setAiLoading(null)
    }
  }

  // Update functions
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

  // Work Experience functions
  const addWorkExperience = () => {
    const newExperience: WorkExperience = {
      jobTitle: "",
      employer: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      descriptions: ["", "", "", "", ""], // Always start with 5 empty descriptions
    }
    setResumeData((prev) => ({
      ...prev,
      workExperience: [...prev.workExperience, newExperience],
    }))
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

  // Education functions
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

  // Generic array functions
  const addArrayItem = (field: keyof ResumeData, item: any = "") => {
    setResumeData((prev) => {
      if (field === "skills" && (prev[field] as any[]).length >= 10) {
        toast.error("Maximum 10 skills allowed")
        return prev
      }
      return {
        ...prev,
        [field]: [...(prev[field] as any[]), item],
      }
    })
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

  // Simple UUID checker (same pattern we use elsewhere in the file)
  const isUUID = (value: string | null | undefined) =>
    !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

  // Save resume as draft (for progress)
  const saveResumeProgress = async () => {
    setSaving(true)
    try {
      console.log("💾 Saving resume progress...")

      const resumeTitle = resumeData.personalInfo.fullName
        ? `${resumeData.personalInfo.fullName}'s Resume`
        : "My Resume"

      const templateId = template?.id || null

      if (resumeId) {
        // Update existing resume
        const { error } = await supabase
          .from("resumes")
          .update({
            title: resumeTitle,
            content: resumeData,
            status: "draft",
            updated_at: new Date().toISOString(),
            template_id: templateId,
          })
          .eq("id", resumeId)
          .eq("user_id", user?.id)

        if (error) throw error
        toast.success("Resume progress saved!")
      } else {
        // Create new resume
        const { data, error } = await supabase
          .from("resumes")
          .insert({
            user_id: user?.id,
            template_id: templateId,
            title: resumeTitle,
            content: resumeData,
            status: "draft",
            is_paid: false,
            payment_status: "pending",
          })
          .select()
          .single()

        if (error) throw error
        setResumeId(data.id)
        toast.Success("Resume progress saved!")
      }

      console.log("✅ Resume progress saved successfully")
    } catch (error) {
      console.error("💥 Error saving resume progress:", error)
      toast.error("Failed to save resume progress. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  // Unified download/payment flow
  const proceedToPaymentOrDownload = async () => {
    if (!resumeId) {
      setSaving(true)
      try {
        const resumeTitle = resumeData.personalInfo.fullName
          ? `${resumeData.personalInfo.fullName}'s Resume`
          : "My Resume"

        const templateId = template?.id || null

        const { data, error } = await supabase
          .from("resumes")
          .insert({
            user_id: user?.id,
            template_id: templateId,
            title: resumeTitle,
            content: resumeData,
            status: "draft",
            is_paid: false,
            payment_status: "pending",
          })
          .select()
          .single()

        if (error) throw error
        setResumeId(data.id)

        await new Promise((resolve) => setTimeout(resolve, 1000)) // Small delay for user feedback

        router.push(`/resume-builder/download/${data.id}`)
      } catch (error) {
        console.error("Error saving resume:", error)
        toast.error("Failed to save resume. Please try again.")
      } finally {
        setSaving(false)
      }
    } else {
      // Resume already exists, proceed directly to download page
      router.push(`/resume-builder/download/${resumeId}`)
    }
  }

  // Handle successful payment (This function might be moved to the download page now)
  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      // Update resume status to paid
      if (resumeId) {
        const { error } = await supabase
          .from("resumes")
          .update({
            status: "paid",
            is_paid: true,
            payment_status: "completed",
            payment_reference: paymentData.reference,
            paid_at: new Date().toISOString(),
          })
          .eq("id", resumeId)
          .eq("user_id", user?.id)

        if (error) throw error

        // Log activity
        await supabase.from("user_activities").insert({
          user_id: user?.id,
          activity_type: "payment_made",
          description: `Paid for resume download: ${resumeData.personalInfo.fullName || "Resume"}`,
          metadata: {
            resume_id: resumeId,
            amount: currency === "KES" ? 199 : 1.5,
            payment_reference: paymentData.reference,
          },
        })

        toast.success("Payment successful! You can now download your resume.")

        // Navigate to preview/download page (This might redirect to a dedicated download page)
        router.push(`/resume-builder/download/${resumeId}`)
      }
    } catch (error) {
      console.error("Error updating payment status:", error)
      toast.error("Payment successful but failed to update status. Please contact support.")
    }
  }

  const isProfessional = subscription?.plan_type === "professional"

  const canDownloadFree = () => {
    if (subscription?.plan_type === "free") {
      return false // Free users must pay per download
    }
    // Professional users get 2 free downloads per month
    return usageCheck?.allowed
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
        <Alert>
          <AlertDescription>Template not found. Please select a template first.</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Removed the showPaymentStep conditional rendering block
  // All users will now see the editor and preview, and the download button will route them to the unified download page.

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 h-auto sm:h-16 py-3 sm:py-0">
            <div>
              <h1 className="text-lg sm:text-xl font-semibold">Resume Builder</h1>
              <p className="text-xs sm:text-sm text-gray-600">Using {template.name}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/resume-builder/templates")}
                className="text-xs sm:text-sm"
              >
                Change Template
              </Button>
              <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogTrigger asChild>
                  {/* CHANGE: Preview button now visible on all screen sizes for mobile support */}
                  <Button variant="outline" className="text-xs sm:text-sm bg-transparent">
                    <FileText className="h-4 w-4 mr-2" />
                    Preview Resume
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
              <Button onClick={saveResumeProgress} disabled={saving} className="text-xs sm:text-sm">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Save Progress</span>
                  </>
                )}
              </Button>
              {/* Button text and functionality updated */}
              <Button onClick={proceedToPaymentOrDownload} className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm">
                <ArrowRight className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Next: Download</span>
                <span className="sm:hidden">Next</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-8">
          {/* Left Side - Form */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl">Build Your Resume</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Fill in your information to create your professional resume
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <div className="overflow-x-auto -mx-3 px-3 sm:px-6 mb-6">
                    <TabsList className="inline-flex w-max gap-1 bg-gray-100 p-1 rounded-lg">
                      <TabsTrigger
                        value="personal"
                        className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0 px-2 sm:px-3 py-1 sm:py-2"
                      >
                        Personal
                      </TabsTrigger>
                      <TabsTrigger
                        value="summary"
                        className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0 px-2 sm:px-3 py-1 sm:py-2"
                      >
                        Summary
                      </TabsTrigger>
                      <TabsTrigger
                        value="experience"
                        className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0 px-2 sm:px-3 py-1 sm:py-2"
                      >
                        Experience
                      </TabsTrigger>
                      <TabsTrigger
                        value="education"
                        className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0 px-2 sm:px-3 py-1 sm:py-2"
                      >
                        Education
                      </TabsTrigger>
                      <TabsTrigger
                        value="skills"
                        className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0 px-2 sm:px-3 py-1 sm:py-2"
                      >
                        Skills
                      </TabsTrigger>
                      <TabsTrigger
                        value="extras"
                        className="text-xs sm:text-sm whitespace-nowrap flex-shrink-0 px-2 sm:px-3 py-1 sm:py-2"
                      >
                        Extras
                      </TabsTrigger>
                      {/* REMOVED: Separate colors tab from TabsList - colors are no longer customizable */}
                    </TabsList>
                  </div>

                  <div className="max-h-[50vh] sm:max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                    <TabsContent value="personal" className="space-y-3 sm:space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label htmlFor="firstName" className="text-xs sm:text-sm">
                            First Name
                          </Label>
                          <Input
                            id="firstName"
                            value={resumeData.personalInfo.firstName}
                            onChange={(e) => updatePersonalInfo("firstName", e.target.value)}
                            placeholder="John"
                            className="text-xs sm:text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName" className="text-xs sm:text-sm">
                            Last Name
                          </Label>
                          <Input
                            id="lastName"
                            value={resumeData.personalInfo.lastName}
                            onChange={(e) => updatePersonalInfo("lastName", e.target.value)}
                            placeholder="Doe"
                            className="text-xs sm:text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="tagline" className="text-xs sm:text-sm">
                          Professional Tagline
                        </Label>
                        <Input
                          id="tagline"
                          value={resumeData.personalInfo.tagline}
                          onChange={(e) => updatePersonalInfo("tagline", e.target.value)}
                          placeholder="Software Engineer | Full Stack Developer"
                          className="text-xs sm:text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label htmlFor="email" className="text-xs sm:text-sm">
                            Email
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={resumeData.personalInfo.email}
                            onChange={(e) => updatePersonalInfo("email", e.target.value)}
                            placeholder="john@example.com"
                            className="text-xs sm:text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone" className="text-xs sm:text-sm">
                            Phone
                          </Label>
                          <Input
                            id="phone"
                            value={resumeData.personalInfo.phone}
                            onChange={(e) => updatePersonalInfo("phone", e.target.value)}
                            placeholder="+254 700 000 000"
                            className="text-xs sm:text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label htmlFor="city" className="text-xs sm:text-sm">
                            City
                          </Label>
                          <Input
                            id="city"
                            value={resumeData.personalInfo.city}
                            onChange={(e) => updatePersonalInfo("city", e.target.value)}
                            placeholder="Nairobi"
                            className="text-xs sm:text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="postcode" className="text-xs sm:text-sm">
                            Postcode
                          </Label>
                          <Input
                            id="postcode"
                            value={resumeData.personalInfo.postcode}
                            onChange={(e) => updatePersonalInfo("postcode", e.target.value)}
                            placeholder="00100"
                            className="text-xs sm:text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label htmlFor="linkedin" className="text-xs sm:text-sm">
                            Website
                          </Label>
                          <Input
                            id="linkedin"
                            value={resumeData.personalInfo.linkedin}
                            onChange={(e) => updatePersonalInfo("linkedin", e.target.value)}
                            placeholder="yourwebsite.com"
                            className="text-xs sm:text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="portfolio" className="text-xs sm:text-sm">
                            Portfolio
                          </Label>
                          <Input
                            id="portfolio"
                            value={resumeData.personalInfo.portfolio}
                            onChange={(e) => updatePersonalInfo("portfolio", e.target.value)}
                            placeholder="johndoe.com"
                            className="text-xs sm:text-sm"
                          />
                        </div>
                      </div>
                      {/* Add job description input for AI generation */}
                      <div>
                        <Label htmlFor="jobDescription" className="text-xs sm:text-sm">
                          Job Description (for AI context)
                        </Label>
                        <Textarea
                          id="jobDescription"
                          value={resumeData.personalInfo.jobDescription}
                          onChange={(e) => updatePersonalInfo("jobDescription", e.target.value)}
                          placeholder="Briefly describe your main job responsibilities and achievements..."
                          rows={3}
                          className="text-xs sm:text-sm"
                        />
                      </div>
                      {/* CHANGE: Add color scheme controls after portfolio field */}
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h3 className="text-sm font-semibold mb-4 text-gray-900">Resume Styling</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="headlineColor" className="text-xs sm:text-sm">
                              Headline Color
                            </Label>
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                id="headlineColor"
                                type="color"
                                value={resumeData.colorScheme.headlineColor}
                                onChange={(e) =>
                                  setResumeData((prev) => ({
                                    ...prev,
                                    colorScheme: { ...prev.colorScheme, headlineColor: e.target.value },
                                  }))
                                }
                                className="h-10 w-14 border border-gray-200 rounded cursor-pointer"
                              />
                              <Input
                                value={resumeData.colorScheme.headlineColor}
                                onChange={(e) =>
                                  setResumeData((prev) => ({
                                    ...prev,
                                    colorScheme: { ...prev.colorScheme, headlineColor: e.target.value },
                                  }))
                                }
                                placeholder="#2563eb"
                                className="text-xs sm:text-sm flex-1"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="accentColor" className="text-xs sm:text-sm">
                              Accent Color
                            </Label>
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                id="accentColor"
                                type="color"
                                value={resumeData.colorScheme.accentColor}
                                onChange={(e) =>
                                  setResumeData((prev) => ({
                                    ...prev,
                                    colorScheme: { ...prev.colorScheme, accentColor: e.target.value },
                                  }))
                                }
                                className="h-10 w-14 border border-gray-200 rounded cursor-pointer"
                              />
                              <Input
                                value={resumeData.colorScheme.accentColor}
                                onChange={(e) =>
                                  setResumeData((prev) => ({
                                    ...prev,
                                    colorScheme: { ...prev.colorScheme, accentColor: e.target.value },
                                  }))
                                }
                                placeholder="#3b82f6"
                                className="text-xs sm:text-sm flex-1"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="summary" className="space-y-3 sm:space-y-4">
                      <div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
                          <Label htmlFor="summary" className="text-xs sm:text-sm">
                            Professional Summary
                          </Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={generateSummaryWithAI}
                            disabled={aiLoading === "summary"}
                            className="w-full sm:w-auto bg-transparent text-xs sm:text-sm"
                          >
                            {aiLoading === "summary" ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4 mr-2" />
                            )}
                            <span className="hidden sm:inline">Generate with AI</span>
                            <span className="sm:hidden">Generate</span>
                          </Button>
                        </div>
                        <Textarea
                          id="summary"
                          value={resumeData.professionalSummary}
                          onChange={(e) => updateProfessionalSummary(e.target.value)}
                          placeholder="Write a brief professional summary..."
                          rows={6}
                          className="text-xs sm:text-sm"
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
                                      disabled={aiLoading === `work-${index}` || !exp.jobTitle || !exp.employer}
                                      className="w-full md:w-auto"
                                    >
                                      {aiLoading === `work-${index}` ? (
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
                            disabled={aiLoading === "skills"}
                            className="w-full md:w-auto bg-transparent"
                          >
                            {aiLoading === "skills" ? (
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
                          <Button
                            variant="outline"
                            onClick={() => addArrayItem("skills")}
                            className="w-full"
                            disabled={resumeData.skills.length >= 10}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Skill {resumeData.skills.length >= 10 && "(Max 10)"}
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

                    {/* REMOVED: Color Scheme Tab content */}
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Live Preview - Visible on all screen sizes */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center">
                    <Eye className="h-5 w-5 mr-2" />
                    Live Preview
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPreviewZoom(Math.max(50, previewZoom - 10))}>
                      −
                    </Button>
                    <span className="text-xs sm:text-sm font-medium w-10 text-center">{previewZoom}%</span>
                    <Button variant="outline" size="sm" onClick={() => setPreviewZoom(Math.min(200, previewZoom + 10))}>
                      +
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPreviewZoom(100)}>
                      Reset
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
                      <ZoomIn className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Full</span>
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">See how your resume looks in real-time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-white border border-gray-200 rounded-lg overflow-auto" style={{ height: "600px" }}>
                  {previewHtml ? (
                    <ResumePreviewRenderer previewHtml={previewHtml} zoom={previewZoom} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-xs sm:text-sm">Fill in your information to see the preview</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Full Screen Preview Dialog */}
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
