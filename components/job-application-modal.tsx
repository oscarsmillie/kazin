"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ExternalLink, MapPin, DollarSign, Clock, Building } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { JobPosting } from "@/lib/types"
import { checkUsageLimit, incrementUsage } from "@/lib/access-control"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"

function renderHtmlContent(content: string) {
  const hasHtml = /<[^>]+>/g.test(content)

  if (hasHtml) {
    return (
      <div
        className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{
          __html: content
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/on\w+="[^"]*"/gi, ""),
        }}
      />
    )
  }

  return <p className="text-sm text-gray-700 leading-relaxed">{content}</p>
}

interface JobApplicationModalProps {
  job: JobPosting | any
  usageData?: { current: number; limit: number; isPro: boolean }
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export function JobApplicationModal({
  job,
  usageData,
  isOpen: controlledIsOpen,
  onOpenChange,
}: JobApplicationModalProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen
  const setIsOpen = onOpenChange || setInternalIsOpen

  const [applying, setApplying] = useState(false)

  const normalizedJob = {
    id: job.id,
    job_title: job.job_title || job.title,
    company_name: job.company_name || job.company,
    location: job.location,
    posted_date: job.posted_date,
    salary_range: job.salary_range || job.salary,
    job_type: job.job_type || job.type,
    experience_level: job.experience_level,
    requirements: job.requirements || [],
    skills_required: job.skills_required || job.skills || [],
    company_logo_url: job.company_logo_url || job.company_logo,
    is_featured: job.is_featured || false,
    external_url: job.external_url || job.application_url,
    application_count: job.application_count || 0,
    description: job.description,
    application_deadline: job.application_deadline || job.deadline,
    category: job.category || "Technology",
  }

  const handleApply = async () => {
    if (!user) {
      alert("Please sign in to apply for jobs")
      return
    }

    setApplying(true)
    try {
      const usageCheck = await checkUsageLimit(user.id, "job_applications")
      if (!usageCheck.allowed) {
        alert(
          `Job application limit reached (${usageCheck.current}/${usageCheck.limit}). Upgrade to Professional for unlimited tracking.`
        )
        setApplying(false)
        return
      }

      // --- FIX: REMOVE JOB_POSTINGS LOGIC ---
      console.log("[v0] Creating job application record ONLY...")

      const { error } = await supabase.from("job_applications").insert({
        user_id: user.id,
        job_posting_id: normalizedJob.id, // keep external job id
        company_name: normalizedJob.company_name,
        job_title: normalizedJob.job_title,
        job_url: normalizedJob.external_url,
        status: "applied",
        application_date: new Date().toISOString(),
      })

      if (error) throw error

      await incrementUsage(user.id, "job_applications")

      await supabase.from("user_activity").insert({
        user_id: user.id,
        activity_type: "job_applied",
        description: `Applied to ${normalizedJob.job_title} at ${normalizedJob.company_name}`,
        metadata: { job_id: normalizedJob.id },
        created_at: new Date().toISOString(),
      })

      setIsOpen(false)

      if (normalizedJob.external_url) {
        window.open(normalizedJob.external_url, "_blank", "noopener,noreferrer")
      }

      router.push("/applications")
    } catch (error) {
      console.error("Error applying to job:", error)
      alert("Error tracking application. Please try again.")
    } finally {
      setApplying(false)
    }
  }

  const handleDirectApply = () => {
    if (normalizedJob.external_url) {
      window.open(normalizedJob.external_url, "_blank", "noopener,noreferrer")
    }
  }

  const getJobTypeColor = (type: string) => {
    const lowerType = type?.toLowerCase() || ""
    if (lowerType.includes("full")) return "bg-green-100 text-green-800"
    if (lowerType.includes("part")) return "bg-blue-100 text-blue-800"
    if (lowerType.includes("contract")) return "bg-orange-100 text-orange-800"
    if (lowerType.includes("remote")) return "bg-purple-100 text-purple-800"
    if (lowerType.includes("hybrid")) return "bg-indigo-100 text-indigo-800"
    return "bg-gray-100 text-gray-800"
  }

  const getExperienceColor = (level: string) => {
    const lowerLevel = level?.toLowerCase() || ""
    if (lowerLevel.includes("entry")) return "bg-green-100 text-green-800"
    if (lowerLevel.includes("mid")) return "bg-blue-100 text-blue-800"
    if (lowerLevel.includes("senior")) return "bg-purple-100 text-purple-800"
    if (lowerLevel.includes("executive")) return "bg-red-100 text-red-800"
    return "bg-gray-100 text-gray-800"
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Apply to {normalizedJob.job_title}</span>
          </DialogTitle>
          <DialogDescription>Review the job details and apply through the company's website</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {usageData && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">
                  Applications Tracked:{" "}
                  <span className="font-semibold">
                    {usageData.current}/{usageData.limit === -1 ? "Unlimited" : usageData.limit}
                  </span>
                </span>
                {usageData.limit !== -1 && usageData.current >= usageData.limit && !usageData.isPro && (
                  <Badge variant="destructive" className="text-xs">
                    Limit reached
                  </Badge>
                )}
              </div>
              {usageData.limit !== -1 && (
                <Progress value={(usageData.current / usageData.limit) * 100} className="h-1.5" />
              )}
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{normalizedJob.job_title}</h3>
                <p className="text-gray-700">{normalizedJob.company_name}</p>
              </div>
              {normalizedJob.company_logo_url && (
                <img
                  src={normalizedJob.company_logo_url || "/placeholder.svg"}
                  alt={normalizedJob.company_name}
                  className="w-12 h-12 rounded"
                />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
              {normalizedJob.location && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {normalizedJob.location}
                </div>
              )}
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Posted {new Date(normalizedJob.posted_date).toLocaleDateString()}
              </div>
              {normalizedJob.salary_range && (
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  {normalizedJob.salary_range}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className={getJobTypeColor(normalizedJob.job_type)}>{normalizedJob.job_type}</Badge>
              <Badge className={getExperienceColor(normalizedJob.experience_level)}>{normalizedJob.experience_level}</Badge>
              {normalizedJob.is_featured && <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>}
            </div>
          </div>

          {normalizedJob.description && (
            <div>
              <h4 className="font-semibold mb-2">Job Description</h4>
              {renderHtmlContent(normalizedJob.description)}
            </div>
          )}

          {normalizedJob.requirements && normalizedJob.requirements.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Key Requirements</h4>
              <ul className="space-y-1">
                {normalizedJob.requirements.slice(0, 5).map((req: string, index: number) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {normalizedJob.skills_required && normalizedJob.skills_required.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Skills Required</h4>
              <div className="flex flex-wrap gap-2">
                {normalizedJob.skills_required.slice(0, 8).map((skill: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {normalizedJob.skills_required.length > 8 && (
                  <Badge variant="outline" className="text-xs">
                    +{normalizedJob.skills_required.length - 8} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          <Separator />

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Application Process</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <p>1. We'll track your application in your dashboard</p>
              <p>2. You'll be redirected to the company's application page</p>
              <p>3. Complete the application on their website</p>
              <p>4. Return here to update your application status</p>
            </div>
          </div>

          {normalizedJob.application_deadline && (
            <div className="bg-orange-50 p-3 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Application Deadline:</strong>{" "}
                {new Date(normalizedJob.application_deadline).toLocaleDateString()}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button onClick={handleApply} disabled={applying} className="flex-1">
              {applying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Recording...
                </>
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Apply & Track
                </>
              )}
            </Button>

            {normalizedJob.external_url && (
              <Button variant="outline" onClick={handleDirectApply} className="flex-1 bg-transparent">
                <ExternalLink className="mr-2 h-4 w-4" />
                Apply Directly
              </Button>
            )}

            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            "Apply & Track" records the application in your dashboard then redirects you. "Apply Directly" takes you
            straight to the company website.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
