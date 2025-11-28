"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileText, Copy, Download, Save, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { generateWordDocument, downloadWordDocument } from "@/lib/document-generator"

interface CoverLetterFormData {
  jobTitle: string
  companyName: string
  jobDescription: string
  userExperience: string
  skills: string
  tone: string
}

interface CoverLetterFormProps {
  onGenerated?: (coverLetter: string) => void
}

export default function CoverLetterForm({ onGenerated }: CoverLetterFormProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState<CoverLetterFormData>({
    jobTitle: "",
    companyName: "",
    jobDescription: "",
    userExperience: "",
    skills: "",
    tone: "professional",
  })

  const [generatedCoverLetter, setGeneratedCoverLetter] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [usage, setUsage] = useState<{ current: number; limit: number; isPro: boolean } | null>(null)

  const handleInputChange = (field: keyof CoverLetterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const generateCoverLetterContent = async () => {
    if (!user) {
      toast.error("Please sign in to generate cover letters")
      return
    }

    if (!formData.jobTitle || !formData.companyName) {
      toast.error("Please fill in the job title and company name")
      return
    }

    setIsGenerating(true)
    setGeneratedCoverLetter("")

    try {
      // Get fresh session token
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        console.error("Session error:", sessionError)
        toast.error("Authentication required. Please sign in again.")
        return
      }

      const response = await fetch("/api/generate-cover-letter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          jobTitle: formData.jobTitle,
          companyName: formData.companyName,
          jobDescription: formData.jobDescription,
          userExperience: formData.userExperience,
          skills: formData.skills,
          tone: formData.tone,
          userId: user.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 429) {
          toast.error(
            `Cover letter limit reached (${errorData.current}/${errorData.limit}). Upgrade to Professional for unlimited access.`,
          )
        } else {
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }
        return
      }

      const data = await response.json()

      if (data.content && data.content.trim().length > 0) {
        setGeneratedCoverLetter(data.content)
        setUsage(data.usage)

        if (onGenerated) {
          onGenerated(data.content)
        }

        toast.success("Cover letter generated successfully!")
      } else {
        console.error("Empty content received from API")
        toast.error("Generated cover letter was empty. Please try again.")
      }
    } catch (error) {
      console.error("Error generating cover letter:", error)
      toast.error("Failed to generate cover letter. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const saveCoverLetter = async () => {
    if (!generatedCoverLetter) {
      toast.error("No cover letter to save")
      return
    }

    if (!user) {
      toast.error("Please sign in to save cover letters")
      return
    }

    setIsSaving(true)
    try {
      const { data, error } = await supabase
        .from("cover_letters")
        .insert({
          user_id: user.id,
          title: `Cover Letter - ${formData.jobTitle} at ${formData.companyName}`,
          job_title: formData.jobTitle,
          company_name: formData.companyName,
          content: generatedCoverLetter,
          tone: formData.tone,
          metadata: {
            jobDescription: formData.jobDescription,
            userExperience: formData.userExperience,
            skills: formData.skills,
            generatedAt: new Date().toISOString(),
          },
        })
        .select()

      if (error) {
        console.error("Error saving cover letter:", error)
        throw error
      }

      toast.success("Cover letter saved successfully!")
    } catch (error) {
      console.error("Error saving cover letter:", error)
      toast.error("Failed to save cover letter")
    } finally {
      setIsSaving(false)
    }
  }

  const copyToClipboard = async () => {
    if (!generatedCoverLetter) return

    try {
      await navigator.clipboard.writeText(generatedCoverLetter)
      toast.success("Cover letter copied to clipboard!")
    } catch (error) {
      toast.error("Failed to copy cover letter")
    }
  }

  const downloadAsWord = async () => {
    if (!generatedCoverLetter) return

    try {
      const filename = `cover-letter-${formData.companyName || "document"}`
      const title = `Cover Letter - ${formData.jobTitle} at ${formData.companyName}`

      const blob = await generateWordDocument(generatedCoverLetter, title)
      downloadWordDocument(blob, filename)

      toast.success("Cover letter downloaded as Word document!")
    } catch (error) {
      console.error("Error downloading Word document:", error)
      toast.error("Failed to download Word document")
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Cover Letter Generator</h1>
        <p className="text-gray-600">Create personalized cover letters with AI assistance</p>

        {/* Usage Display */}
        {usage && (
          <div className="flex flex-wrap items-center gap-3 mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Badge variant="outline" className="flex items-center gap-2">
              <FileText className="h-3 w-3 text-blue-600" />
              <span className="font-semibold text-blue-900">
                {usage.current}/{usage.isPro ? "∞" : usage.limit}
              </span>
              <span className="text-blue-700">cover letters</span>
            </Badge>
            <Badge variant="outline" className={usage.isPro ? "bg-green-50" : "bg-gray-50"}>
              {usage.isPro ? "Professional" : "Free"} Plan
            </Badge>
            {!usage.isPro && usage.current >= usage.limit && (
              <span className="text-xs text-red-600 font-medium">Limit Reached - Upgrade to continue</span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Job Details
            </CardTitle>
            <CardDescription>Fill in the job details to generate a personalized cover letter</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="jobTitle">Job Title *</Label>
                <Input
                  id="jobTitle"
                  value={formData.jobTitle}
                  onChange={(e) => handleInputChange("jobTitle", e.target.value)}
                  placeholder="e.g., Software Engineer"
                />
              </div>
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange("companyName", e.target.value)}
                  placeholder="e.g., Google"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="jobDescription">Job Description</Label>
              <Textarea
                id="jobDescription"
                value={formData.jobDescription}
                onChange={(e) => handleInputChange("jobDescription", e.target.value)}
                placeholder="Paste the job description here (optional but recommended for better results)"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="userExperience">Your Experience</Label>
              <Textarea
                id="userExperience"
                value={formData.userExperience}
                onChange={(e) => handleInputChange("userExperience", e.target.value)}
                placeholder="Briefly describe your relevant experience and background"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="skills">Key Skills</Label>
              <Input
                id="skills"
                value={formData.skills}
                onChange={(e) => handleInputChange("skills", e.target.value)}
                placeholder="e.g., JavaScript, React, Node.js, Python"
              />
            </div>

            <div>
              <Label htmlFor="tone">Tone</Label>
              <Select value={formData.tone} onValueChange={(value) => handleInputChange("tone", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                  <SelectItem value="confident">Confident</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={generateCoverLetterContent}
              disabled={isGenerating || !formData.jobTitle || !formData.companyName}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Cover Letter...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Cover Letter
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Cover Letter */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Cover Letter</CardTitle>
            <CardDescription>Your AI-generated cover letter will appear here</CardDescription>
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500">Generating your cover letter...</p>
              </div>
            ) : generatedCoverLetter ? (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg max-h-[500px] overflow-y-auto border border-gray-200">
                  <div className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">
                    {generatedCoverLetter}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={saveCoverLetter} disabled={isSaving} variant="default" size="sm">
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Cover Letter
                      </>
                    )}
                  </Button>

                  <Button onClick={copyToClipboard} variant="outline" size="sm">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>

                  <Button onClick={downloadAsWord} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download Word
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">
                  Fill in the job details and click "Generate Cover Letter" to create your personalized cover letter
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
