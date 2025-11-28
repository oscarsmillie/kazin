"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Mail, Copy, Save, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

interface EmailFormData {
  subject: string
  keyPoints: string
  relationship: string
  tone: string
  company: string
  position: string
}

interface SavedEmail {
  id: string
  title: string
  subject: string
  content: string
  email_type: string
  tone: string
  created_at: string
}

export default function EmailGeneratorPage() {
  const { user } = useAuth()
  const [formData, setFormData] = useState<EmailFormData>({
    subject: "",
    keyPoints: "",
    relationship: "",
    tone: "professional",
    company: "",
    position: "",
  })

  const [generatedEmail, setGeneratedEmail] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedEmails, setSavedEmails] = useState<SavedEmail[]>([])
  const [isLoadingEmails, setIsLoadingEmails] = useState(false)
  const [usage, setUsage] = useState<{ current: number; limit: number; isPro: boolean } | null>(null)

  const handleInputChange = (field: keyof EmailFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const loadSavedEmails = async () => {
    if (!user) return

    setIsLoadingEmails(true)
    try {
      const { data, error } = await supabase
        .from("emails")
        .select("id, title, subject, content, email_type, tone, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) {
        console.error("Error loading emails:", error)
        toast.error("Failed to load saved emails")
        return
      }

      setSavedEmails(data || [])
    } catch (error) {
      console.error("Error loading emails:", error)
      toast.error("Failed to load saved emails")
    } finally {
      setIsLoadingEmails(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadSavedEmails()
    }
  }, [user])

  const generateEmail = async () => {
    if (!user) {
      toast.error("Please sign in to generate emails")
      return
    }

    if (!formData.subject) {
      toast.error("Please fill in the subject")
      return
    }

    setIsGenerating(true)
    setGeneratedEmail("")

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

      const response = await fetch("/api/generate-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          subject: formData.subject,
          keyPoints: formData.keyPoints,
          relationship: formData.relationship,
          tone: formData.tone,
          company: formData.company,
          position: formData.position,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 429) {
          toast.error(
            `Email limit reached (${errorData.current}/${errorData.limit}). Upgrade to Professional for unlimited access.`,
          )
        } else {
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }
        return
      }

      const data = await response.json()

      if (data.content && data.content.trim().length > 0) {
        setGeneratedEmail(data.content)
        setUsage(data.usage)
        toast.success("Email generated successfully!")
        await loadSavedEmails() // Refresh the saved emails list
      } else {
        console.error("Empty content received from API")
        toast.error("Generated email was empty. Please try again.")
      }
    } catch (error) {
      console.error("Error generating email:", error)
      toast.error("Failed to generate email. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const saveEmail = async () => {
    if (!generatedEmail) {
      toast.error("No email to save")
      return
    }

    if (!user) {
      toast.error("Please sign in to save emails")
      return
    }

    setIsSaving(true)
    try {
      const { data, error } = await supabase
        .from("emails")
        .insert({
          user_id: user.id,
          title: formData.subject,
          subject: formData.subject,
          content: generatedEmail,
          email_type: "general",
          tone: formData.tone,
          key_points: formData.keyPoints,
          relationship: formData.relationship,
          company: formData.company,
          position: formData.position,
        })
        .select()

      if (error) {
        console.error("Error saving email:", error)
        throw error
      }

      toast.success("Email saved successfully!")
      await loadSavedEmails() // Refresh the list
    } catch (error) {
      console.error("Error saving email:", error)
      toast.error("Failed to save email")
    } finally {
      setIsSaving(false)
    }
  }

  const deleteEmail = async (emailId: string) => {
    if (!user) return

    try {
      const { error } = await supabase.from("emails").delete().eq("id", emailId).eq("user_id", user.id)

      if (error) {
        console.error("Error deleting email:", error)
        throw error
      }

      toast.success("Email deleted successfully!")
      await loadSavedEmails() // Refresh the list
    } catch (error) {
      console.error("Error deleting email:", error)
      toast.error("Failed to delete email")
    }
  }

  const copyToClipboard = async () => {
    if (!generatedEmail) return

    try {
      await navigator.clipboard.writeText(generatedEmail)
      toast.success("Email copied to clipboard!")
    } catch (error) {
      toast.error("Failed to copy email")
    }
  }

  const loadEmail = (email: SavedEmail) => {
    setGeneratedEmail(email.content)
    setFormData({
      subject: email.subject || "",
      keyPoints: "",
      relationship: "",
      tone: email.tone || "professional",
      company: "",
      position: "",
    })
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Email Generator</h1>
        <p className="text-gray-600">Create professional emails with AI assistance</p>

        {/* Usage Display */}
        {usage && (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200 mt-4">
            <Badge variant="outline" className="flex items-center gap-2">
              <Mail className="h-3 w-3 text-blue-600" />
              <span className="font-semibold text-blue-900">
                {usage.current}/{usage.isPro ? "∞" : usage.limit}
              </span>
              <span className="text-blue-700">emails</span>
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
              Email Details
            </CardTitle>
            <CardDescription>Fill in the details to generate a professional email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange("subject", e.target.value)}
                placeholder="e.g., Follow-up on our meeting"
              />
            </div>

            <div>
              <Label htmlFor="keyPoints">Key Points</Label>
              <Textarea
                id="keyPoints"
                value={formData.keyPoints}
                onChange={(e) => handleInputChange("keyPoints", e.target.value)}
                placeholder="Main points you want to cover in the email"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="relationship">Relationship</Label>
              <Input
                id="relationship"
                value={formData.relationship}
                onChange={(e) => handleInputChange("relationship", e.target.value)}
                placeholder="e.g., colleague, client, manager"
              />
            </div>

            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange("company", e.target.value)}
                placeholder="Company name (optional)"
              />
            </div>

            <div>
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => handleInputChange("position", e.target.value)}
                placeholder="Job position (optional)"
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
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={generateEmail}
              disabled={isGenerating || !formData.subject}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Email...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Email
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Email */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Email</CardTitle>
            <CardDescription>Your AI-generated email will appear here</CardDescription>
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500">Generating your email...</p>
              </div>
            ) : generatedEmail ? (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg max-h-[500px] overflow-y-auto border border-gray-200">
                  <div className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">
                    {generatedEmail}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={saveEmail} disabled={isSaving} variant="default" size="sm">
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Email
                      </>
                    )}
                  </Button>

                  <Button onClick={copyToClipboard} variant="outline" size="sm">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">
                  Fill in the email details and click "Generate Email" to create your professional email
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
