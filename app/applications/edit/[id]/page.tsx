"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface JobApplication {
  id: string
  company_name: string
  job_title: string
  status: string
  application_date: string
  follow_up_date: string
  notes: string
  job_url: string
  salary_offered: string
  location: string
}

export default function EditApplicationPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const applicationId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState<JobApplication>({
    id: "",
    company_name: "",
    job_title: "",
    status: "applied",
    application_date: "",
    follow_up_date: "",
    notes: "",
    job_url: "",
    salary_offered: "",
    location: "",
  })

  useEffect(() => {
    if (user && applicationId) {
      fetchApplication()
    }
  }, [user, applicationId])

  const fetchApplication = async () => {
    try {
      const { data, error } = await supabase
        .from("job_applications")
        .select("*")
        .eq("id", applicationId)
        .eq("user_id", user?.id)
        .single()

      if (error) throw error

      if (data) {
        setFormData({
          id: data.id,
          company_name: data.company_name || "",
          job_title: data.job_title || "",
          status: data.status || "applied",
          application_date: data.application_date?.split("T")[0] || "",
          follow_up_date: data.follow_up_date?.split("T")[0] || "",
          notes: data.notes || "",
          job_url: data.job_url || "",
          salary_offered: data.salary_offered || "",
          location: data.location || "",
        })
      }
    } catch (error: any) {
      console.error("Error fetching application:", error)
      setError("Failed to load application. Please try again.")
    } finally {
      setLoading(false)
    }
  }

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
      setError("You must be logged in to update applications")
      return
    }

    setSaving(true)
    setError("")

    try {
      const updateData = {
        company_name: formData.company_name.trim(),
        job_title: formData.job_title.trim(),
        status: formData.status,
        application_date: formData.application_date,
        notes: formData.notes.trim() || null,
        job_url: formData.job_url.trim() || null,
        salary_offered: formData.salary_offered.trim() || null,
        location: formData.location.trim() || null,
        follow_up_date: formData.follow_up_date || null,
        updated_at: new Date().toISOString(),
      }

      const { data, error: updateError } = await supabase
        .from("job_applications")
        .update(updateData)
        .eq("id", applicationId)
        .eq("user_id", user.id)
        .select()

      if (updateError) {
        console.error("Database error:", updateError)
        throw updateError
      }

      console.log("Application updated successfully:", data)
      router.push("/applications")
    } catch (error: any) {
      console.error("Error updating application:", error)
      setError(error?.message || "Failed to update application. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Alert>
          <AlertDescription>Please log in to edit job applications</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Applications
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Edit Job Application</CardTitle>
          <CardDescription>Update your job application details</CardDescription>
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
                <Label htmlFor="salary_offered">Salary Range</Label>
                <Input
                  id="salary_offered"
                  name="salary_offered"
                  value={formData.salary_offered}
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
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Application
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
