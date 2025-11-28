"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { checkUsageLimit, incrementUsage } from "@/lib/access-control"

interface JobApplication {
  company_name: string
  job_title: string
  status: string
  application_date: string
  follow_up_date: string
  notes: string
  job_url: string
  salary_range: string
  location: string
}

export default function NewApplicationPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState<JobApplication>({
    company_name: "",
    job_title: "",
    status: "applied",
    application_date: new Date().toISOString().split("T")[0],
    follow_up_date: "",
    notes: "",
    job_url: "",
    salary_range: "",
    location: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError("You must be logged in to save applications")
      return
    }

    setLoading(true)
    setError("")

    try {
      const usageCheck = await checkUsageLimit(user.id, "job_applications")
      if (!usageCheck.allowed) {
        setError(
          `Job application limit reached (${usageCheck.current}/${usageCheck.limit}). Upgrade to Professional for unlimited tracking.`,
        )
        setLoading(false)
        return
      }

      console.log("🔄 Saving application for user:", user.id)
      console.log("📝 Application data:", formData)

      // Prepare the data for insertion
      const applicationData = {
        user_id: user.id,
        company_name: formData.company_name.trim(),
        job_title: formData.job_title.trim(),
        status: formData.status,
        application_date: formData.application_date,
        notes: formData.notes.trim() || null,
        job_url: formData.job_url.trim() || null,
        salary_offered: formData.salary_range.trim() || null,
        location: formData.location.trim() || null,
        follow_up_date: formData.follow_up_date || null,
      }

      console.log("📤 Sending to database:", applicationData)

      const { data, error: insertError } = await supabase.from("job_applications").insert(applicationData).select()

      if (insertError) {
        console.error("❌ Database error:", {
          error: insertError,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code,
        })
        throw insertError
      }

      console.log("📊 Incrementing job application usage for user:", user.id)
      const incrementSuccess = await incrementUsage(user.id, "job_applications")

      if (!incrementSuccess) {
        console.error("❌ Failed to increment usage for job applications")
      } else {
        console.log("✅ Successfully incremented job application usage")
      }

      console.log("✅ Application saved successfully:", data)
      router.push("/applications")
    } catch (error: any) {
      console.error("💥 Error saving application:", {
        error,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
      })

      if (error?.code === "23503") {
        setError("Profile setup required. Please complete your profile first.")
      } else if (error?.code === "42501") {
        setError("Permission denied. Please try logging out and back in.")
      } else {
        setError(error?.message || "Failed to save application. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  if (!user)
    return (
      <div className="container mx-auto p-4">
        <Alert>
          <AlertDescription>Please log in to track job applications</AlertDescription>
        </Alert>
      </div>
    )

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Add New Job Application</CardTitle>
          <CardDescription>Track your job applications and follow-ups</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 bg-red-50 text-red-800 border-red-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_title">Job Title *</Label>
                <Input
                  id="job_title"
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Application Status *</Label>
                <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wishlist">Wishlist</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="offer">Offer</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="application_date">Application Date *</Label>
                <Input
                  id="application_date"
                  name="application_date"
                  type="date"
                  value={formData.application_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Remote, New York, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary_range">Salary Range</Label>
                <Input
                  id="salary_range"
                  name="salary_range"
                  value={formData.salary_range}
                  onChange={handleInputChange}
                  placeholder="$80,000 - $100,000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="job_url">Job URL</Label>
                <Input
                  id="job_url"
                  name="job_url"
                  type="url"
                  value={formData.job_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/job"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="follow_up_date">Follow-up Date</Label>
                <Input
                  id="follow_up_date"
                  name="follow_up_date"
                  type="date"
                  value={formData.follow_up_date}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Add any notes about this application..."
                rows={4}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" type="button" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Application"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
