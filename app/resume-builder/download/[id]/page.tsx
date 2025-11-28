"use client"

import { Switch } from "@/components/ui/switch"
import { Eye } from "lucide-react"
import UpgradeDiscountBanner from "@/components/upgrade-discount-banner"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Crown, ArrowLeft, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import PayButton from "@/components/pay-button"
import Link from "next/link"
import { toast } from "sonner"
import { getUserUsage, PLAN_LIMITS } from "@/lib/subscription"
import ResumePreviewRenderer from "@/components/resume-preview-renderer"
import { generatePdfFromHtmlClient } from "@/lib/client-pdf-generator"

// --- Interfaces ---
interface Resume {
  id: string
  title: string
  template_id: string | null
  template_name: string
  content: any
  created_at: string
  payment_status: string
  extra_download_paid: boolean
}

interface Template {
  id: string
  name: string
  html_template: string
  css_styles: string
}

// --- Resume Renderer ---
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

export default function ResumeDownloadPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [resume, setResume] = useState<Resume | null>(null)
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [isResumePaidFor, setIsResumePaidFor] = useState(false)
  const [userPlan, setUserPlan] = useState<string>("free")
  const [currency, setCurrency] = useState<"KES" | "USD">("KES")
  const [fullPrintHtml, setFullPrintHtml] = useState<string | null>(null)
  const [usageCount, setUsageCount] = useState<number>(0)
  const [canDownload, setCanDownload] = useState<boolean>(true)
  const [previewZoom, setPreviewZoom] = useState(90)
  const [showUpgradeOffer, setShowUpgradeOffer] = useState(false)
  const [upgradeDiscountEligible, setUpgradeDiscountEligible] = useState(false)
  const resumeId = params.id as string

  const DOWNLOAD_LIMIT = PLAN_LIMITS?.professional?.resumes || 3

  const fetchFullData = useCallback(async () => {
    if (!user || !resumeId) return
    setLoading(true)
    try {
      const { data: resumeData } = await supabase
        .from("resumes")
        .select("*")
        .eq("id", resumeId)
        .eq("user_id", user.id)
        .single()

      if (!resumeData) {
        toast.error("Resume not found")
        router.push("/resumes")
        return
      }

      setResume(resumeData)

      const paymentSuccess = searchParams.get("payment") === "success"
      const isPaid = resumeData.payment_status === "paid" || resumeData.extra_download_paid || paymentSuccess
      setIsResumePaidFor(isPaid)

      if (resumeData.template_id) {
        const templateId = resumeData.template_id.replace(/^\/+|\/+$/g, "")
        const fileName = templateId.endsWith(".htm") || templateId.endsWith(".html") ? templateId : `${templateId}.htm`
        const { data: file } = await supabase.storage.from("templates").download(fileName)
        if (file) {
          const htmlContent = await file.text()
          const cssMatch = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i)
          const cssStyles = cssMatch ? cssMatch[1] : ""
          const t = { id: templateId, name: templateId, html_template: htmlContent, css_styles: cssStyles }
          setTemplate(t)

          let contentData: any = {}
          try {
            if (resumeData.content) {
              if (typeof resumeData.content === "string") {
                contentData = JSON.parse(resumeData.content)
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

          setFullPrintHtml(renderResumeWithTemplate(t, contentData, resumeData.title))
        }
      }

      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("plan_type, status, current_period_start, current_period_end")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle()

      const currentPlan = subscription?.plan_type || "free"
      setUserPlan(currentPlan)

      if (user.id) {
        try {
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("upgrade_discount_eligible, upgrade_discount_used")
            .eq("id", user.id)
            .single()

          if (userError) {
            console.log("[v0] Could not fetch discount eligibility (columns may not exist):", userError.message)
            setUpgradeDiscountEligible(false)
          } else {
            const eligible = userData?.upgrade_discount_eligible && !userData?.upgrade_discount_used
            setUpgradeDiscountEligible(eligible || false)

            if ((paymentSuccess || isPaid) && eligible && currentPlan === "free") {
              setShowUpgradeOffer(true)
            }
          }
        } catch (discountErr) {
          console.log("[v0] Discount eligibility check failed:", discountErr)
          setUpgradeDiscountEligible(false)
        }
      }

      if (currentPlan === "professional" && subscription?.status === "active") {
        try {
          const usage = await getUserUsage(user.id)
          const downloadsUsed = usage?.resumes_downloaded ?? 0
          setUsageCount(downloadsUsed)

          const periodEnd = subscription.current_period_end ? new Date(subscription.current_period_end) : new Date()
          const now = new Date()
          const periodValid = now <= periodEnd

          const downloadsAllowed = periodValid && downloadsUsed < DOWNLOAD_LIMIT
          setCanDownload(downloadsAllowed)

          console.log(
            "[FIXED LOGIC] Professional user - Downloads: " +
              downloadsUsed +
              `/${DOWNLOAD_LIMIT}, Period valid: ` +
              periodValid +
              ", Can download: " +
              downloadsAllowed,
          )
        } catch (err) {
          console.error("Usage check failed:", err)
          setCanDownload(false)
        }
      } else if (isPaid) {
        setUsageCount(0)
        setCanDownload(true)
      } else {
        setUsageCount(0)
        setCanDownload(false)
      }
    } catch (e) {
      console.error(e)
      toast.error("Failed to load page data")
    } finally {
      setLoading(false)
    }
  }, [user, resumeId, router, searchParams])

  useEffect(() => {
    fetchFullData()
  }, [fetchFullData])

  const handleDownload = async () => {
    if (!resume || !fullPrintHtml) {
      toast.error("Resume not ready")
      return
    }

    if (userPlan === "professional" && usageCount >= DOWNLOAD_LIMIT) {
      toast.error(`Download limit reached (${DOWNLOAD_LIMIT}/month). Please use the Guest Builder.`)
      return
    }

    const needsPayment = userPlan === "free" && !isResumePaidFor
    if (needsPayment) {
      toast.error("Payment is required for this download.")
      return
    }

    setDownloading(true)
    try {
      const res = await fetch("/api/generate-pdf-playwright", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: fullPrintHtml, resumeTitle: resume.title }),
      })

      if (!res.ok) throw new Error("PDF generation failed")

      const data = await res.json()

      let pdfBase64: string
      let fileName: string

      if (data.pdf) {
        pdfBase64 = data.pdf
        fileName = data.name || `${resume.title}.pdf`
      } else if (data.html) {
        console.log("[v0] Using client-side PDF generation")
        toast.info("Generating PDF on your device...")
        const result = await generatePdfFromHtmlClient(data.html, data.title || resume.title)
        pdfBase64 = result.pdf
        fileName = result.name
      } else {
        throw new Error("No PDF data received")
      }

      const blob = new Blob([Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0))], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Download complete!")

      if (userPlan === "professional" && canDownload) {
        const trackRes = await fetch("/api/track-resume-download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        })

        if (trackRes.ok) {
          const { count } = await trackRes.json()
          setUsageCount(count)

          if (count >= DOWNLOAD_LIMIT) {
            setCanDownload(false)
            toast.info("You have used your last free download for this month.")
          } else {
            const remaining = DOWNLOAD_LIMIT - count
            toast.info(`${remaining} free downloads remaining this month.`)
          }
        } else {
          console.error("[v0] Failed to track download")
          toast.error("Failed to update usage count")
        }
      } else if (userPlan === "free" && needsPayment) {
        setIsResumePaidFor(true)
        setResume((prev) => (prev ? { ...prev, payment_status: "paid" } : null))
      }
    } catch (e) {
      console.error(e)
      toast.error("Failed to generate PDF")
    } finally {
      setDownloading(false)
    }
  }

  const canDownloadFree = userPlan === "professional" && canDownload
  const needsPayment = userPlan === "free" && !isResumePaidFor

  const displayAmount = currency === "KES" ? "Ksh 299" : "$2.50"

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/preview/${resumeId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Preview
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {canDownloadFree
              ? "Download Your Resume"
              : isResumePaidFor
                ? "Your Resume is Ready"
                : userPlan === "professional"
                  ? "Download Limit Reached"
                  : "Purchase Download"}
          </h1>
          <p className="text-gray-600 mt-1">
            {canDownloadFree
              ? "Your professional resume is ready to download"
              : isResumePaidFor
                ? "Enjoy unlimited downloads of your purchased resume."
                : userPlan === "professional"
                  ? `You've used all ${DOWNLOAD_LIMIT} monthly free downloads`
                  : "Purchase to download your professional resume"}
          </p>
        </div>
      </div>

      {!loading && !resume ? (
        <Card>
          <CardContent className="pt-8">
            <div className="text-center">
              <p className="text-gray-600 mb-4">Resume data not found or failed to load.</p>
              <Link href="/resumes">
                <Button>Back to Resumes</Button>
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
                  <Badge variant={isResumePaidFor ? "default" : "secondary"}>{isResumePaidFor ? "Paid" : "Free"}</Badge>
                </div>
              </CardHeader>
            </Card>

            {showUpgradeOffer && upgradeDiscountEligible && userPlan === "free" && (
              <UpgradeDiscountBanner userId={user.id} initialCurrency={currency} />
            )}

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
            {needsPayment && (
              <Card>
                <CardHeader>
                  <CardTitle>Currency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${currency === "KES" ? "text-gray-900" : "text-gray-500"}`}>
                        KSH
                      </span>
                      <Switch
                        checked={currency === "USD"}
                        onCheckedChange={(checked) => setCurrency(checked ? "USD" : "KES")}
                      />
                      <span className={`text-sm font-medium ${currency === "USD" ? "text-gray-900" : "text-gray-500"}`}>
                        USD
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-2 border-blue-600 bg-blue-50">
              <CardHeader>
                <CardTitle>Download Resume</CardTitle>
                <CardDescription>
                  {canDownloadFree
                    ? `${Math.max(0, DOWNLOAD_LIMIT - usageCount)} free downloads remaining`
                    : isResumePaidFor
                      ? "This resume is ready for unlimited downloads."
                      : userPlan === "professional"
                        ? "Use the Guest Resume Builder for more downloads"
                        : "Purchase one download"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {canDownloadFree || isResumePaidFor ? (
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
                        {userPlan === "professional" && ` (${usageCount}/${DOWNLOAD_LIMIT})`}
                      </>
                    )}
                  </Button>
                ) : userPlan === "professional" ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-900 font-medium mb-2">
                        Monthly limit reached ({DOWNLOAD_LIMIT}/{DOWNLOAD_LIMIT})
                      </p>
                      <p className="text-xs text-orange-800">
                        Create more resumes in the guest builder without limits.
                      </p>
                    </div>
                    <Link href="/guest-resume-builder" className="block">
                      <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                        Guest Resume Builder
                      </Button>
                    </Link>
                  </div>
                ) : needsPayment ? (
                  <PayButton
                    amount={currency === "KES" ? 299 : 2.5}
                    currency={currency}
                    type="resume_download"
                    resumeId={resume?.id || ""}
                    description={`Resume Download: ${resume?.title || "Resume"}`}
                    onSuccess={handleDownload}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    <Download className="h-4 w-4 mr-2" /> Pay {currency === "KES" ? "Ksh 299" : "$2.50"} & Download
                  </PayButton>
                ) : null}

                {userPlan === "professional" && (canDownloadFree || usageCount > 0) && (
                  <div className="text-sm text-gray-500 text-center pt-2 border-t">
                    Monthly usage: {usageCount}/{DOWNLOAD_LIMIT}
                  </div>
                )}

                {userPlan === "free" && !isResumePaidFor && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-3">Want unlimited downloads?</p>
                    <Link href="/pricing">
                      <Button variant="outline" className="w-full bg-transparent">
                        <Crown className="h-4 w-4 mr-2" /> Upgrade to Professional
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
