"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Crown, Eye, Plus, Trash2, Save, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface ResumeData {
  title: string
  personalInfo: {
    fullName: string
    email: string
    phone: string
    location: string
    linkedin: string
    portfolio: string
  }
  summary: string
  experience: Array<{
    title: string
    company: string
    duration: string
    description: string
  }>
  education: Array<{
    degree: string
    school: string
    year: string
  }>
  skills: string[]
  achievements: string[]
}

export default function NewResumePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)

  const [resumeData, setResumeData] = useState<ResumeData>({
    title: "",
    personalInfo: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      portfolio: "",
    },
    summary: "",
    experience: [
      {
        title: "",
        company: "",
        duration: "",
        description: "",
      },
    ],
    education: [
      {
        degree: "",
        school: "",
        year: "",
      },
    ],
    skills: [],
    achievements: [],
  })

  useEffect(() => {
    if (!user) {
      router.push("/auth")
      return
    }
    fetchInitialData()
  }, [user, router])

  const fetchInitialData = async () => {
    try {
      // Fetch user subscription
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user?.id)
        .eq("status", "active")
        .single()

      setSubscription(subData)

      // Fetch templates
      const { data: templatesData, error: templatesError } = await supabase
        .from("resume_templates")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true })

      if (templatesError) {
        console.error("Error fetching templates:", templatesError)
        // Create default template if none exist
        const defaultTemplate = {
          id: "default-template",
          name: "Professional Template",
          description: "A clean, professional resume template",
          category: "professional",
          is_premium: false,
          template_data: {},
        }
        setTemplates([defaultTemplate])
        setSelectedTemplate(defaultTemplate)
      } else {
        setTemplates(templatesData || [])
        if (templatesData && templatesData.length > 0) {
          setSelectedTemplate(templatesData[0])
        }
      }
    } catch (error) {
      console.error("Error fetching initial data:", error)
    }
  }

  const handleInputChange = (section: keyof ResumeData, field: string, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section as keyof ResumeData],
        [field]: value,
      },
    }))
  }

  const addExperience = () => {
    setResumeData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          title: "",
          company: "",
          duration: "",
          description: "",
        },
      ],
    }))
  }

  const removeExperience = (index: number) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }))
  }

  const updateExperience = (index: number, field: string, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.map((exp, i) => (i === index ? { ...exp, [field]: value } : exp)),
    }))
  }

  const addEducation = () => {
    setResumeData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          degree: "",
          school: "",
          year: "",
        },
      ],
    }))
  }

  const removeEducation = (index: number) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }))
  }

  const updateEducation = (index: number, field: string, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.map((edu, i) => (i === index ? { ...edu, [field]: value } : edu)),
    }))
  }

  const addSkill = (skill: string) => {
    if (skill.trim() && !resumeData.skills.includes(skill.trim())) {
      setResumeData((prev) => ({
        ...prev,
        skills: [...prev.skills, skill.trim()],
      }))
    }
  }

  const removeSkill = (index: number) => {
    setResumeData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }))
  }

  const saveProgress = async () => {
    if (!selectedTemplate) {
      toast.error("Please select a template first")
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("resumes")
        .insert({
          user_id: user?.id,
          template_id: selectedTemplate.id,
          title: resumeData.title || `${resumeData.personalInfo.fullName}'s Resume` || "My Resume",
          resume_data: resumeData,
          is_active: true,
          payment_status: "draft", // Save as draft initially
        })
        .select()
        .single()

      if (error) {
        console.error("Database error:", error)
        throw error
      }

      toast.success("Resume progress saved successfully!")

      // Redirect to payment/download page
      router.push(`/resume-builder/download/${data.id}`)
    } catch (error) {
      console.error("Error saving resume:", error)
      toast.error("Failed to save resume. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const previewResume = () => {
    if (!selectedTemplate) {
      toast.error("Please select a template first")
      return
    }

    // Create a simple HTML preview
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${resumeData.title || "Resume Preview"}</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .section h2 { border-bottom: 2px solid #333; padding-bottom: 5px; }
            .experience-item, .education-item { margin-bottom: 15px; }
            .skills { display: flex; flex-wrap: wrap; gap: 10px; }
            .skill { background: #f0f0f0; padding: 5px 10px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${resumeData.personalInfo.fullName || "Your Name"}</h1>
            <p>${resumeData.personalInfo.email} | ${resumeData.personalInfo.phone}</p>
            <p>${resumeData.personalInfo.location}</p>
          </div>
          
          ${
            resumeData.summary
              ? `
            <div class="section">
              <h2>Professional Summary</h2>
              <p>${resumeData.summary}</p>
            </div>
          `
              : ""
          }
          
          <div class="section">
            <h2>Experience</h2>
            ${resumeData.experience
              .map(
                (exp) => `
              <div class="experience-item">
                <h3>${exp.title} at ${exp.company}</h3>
                <p><em>${exp.duration}</em></p>
                <p>${exp.description}</p>
              </div>
            `,
              )
              .join("")}
          </div>
          
          <div class="section">
            <h2>Education</h2>
            ${resumeData.education
              .map(
                (edu) => `
              <div class="education-item">
                <h3>${edu.degree}</h3>
                <p>${edu.school} - ${edu.year}</p>
              </div>
            `,
              )
              .join("")}
          </div>
          
          ${
            resumeData.skills.length > 0
              ? `
            <div class="section">
              <h2>Skills</h2>
              <div class="skills">
                ${resumeData.skills.map((skill) => `<span class="skill">${skill}</span>`).join("")}
              </div>
            </div>
          `
              : ""
          }
        </body>
      </html>
    `

    const newWindow = window.open("", "_blank")
    if (newWindow) {
      newWindow.document.write(html)
      newWindow.document.close()
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Resume</h1>
        <p className="text-gray-600 mt-2">Choose a template and build your professional resume</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Template Selection */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Choose Template</CardTitle>
              <CardDescription>Select a professional template for your resume</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{template.name}</h4>
                      {template.is_premium && (
                        <Badge variant="outline" className="text-xs">
                          <Crown className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">{template.description}</p>
                    <Badge variant="outline" className="text-xs mt-2">
                      {template.category}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resume Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Resume Information</CardTitle>
              <CardDescription>Fill in your details to create your resume</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="experience">Experience</TabsTrigger>
                  <TabsTrigger value="education">Education</TabsTrigger>
                  <TabsTrigger value="skills">Skills</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div>
                    <Label htmlFor="title">Resume Title</Label>
                    <Input
                      id="title"
                      value={resumeData.title}
                      onChange={(e) => setResumeData((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Software Engineer Resume"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={resumeData.personalInfo.fullName}
                        onChange={(e) => handleInputChange("personalInfo", "fullName", e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={resumeData.personalInfo.email}
                        onChange={(e) => handleInputChange("personalInfo", "email", e.target.value)}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={resumeData.personalInfo.phone}
                        onChange={(e) => handleInputChange("personalInfo", "phone", e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={resumeData.personalInfo.location}
                        onChange={(e) => handleInputChange("personalInfo", "location", e.target.value)}
                        placeholder="New York, NY"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="summary">Professional Summary</Label>
                    <Textarea
                      id="summary"
                      value={resumeData.summary}
                      onChange={(e) => setResumeData((prev) => ({ ...prev, summary: e.target.value }))}
                      placeholder="Brief summary of your professional background and goals..."
                      rows={4}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="experience" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Work Experience</h3>
                    <Button onClick={addExperience} size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Experience
                    </Button>
                  </div>

                  {resumeData.experience.map((exp, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium">Experience {index + 1}</h4>
                        {resumeData.experience.length > 1 && (
                          <Button variant="outline" size="sm" onClick={() => removeExperience(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label>Job Title</Label>
                          <Input
                            value={exp.title}
                            onChange={(e) => updateExperience(index, "title", e.target.value)}
                            placeholder="Software Engineer"
                          />
                        </div>
                        <div>
                          <Label>Company</Label>
                          <Input
                            value={exp.company}
                            onChange={(e) => updateExperience(index, "company", e.target.value)}
                            placeholder="Tech Company Inc."
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <Label>Duration</Label>
                        <Input
                          value={exp.duration}
                          onChange={(e) => updateExperience(index, "duration", e.target.value)}
                          placeholder="Jan 2020 - Present"
                        />
                      </div>

                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={exp.description}
                          onChange={(e) => updateExperience(index, "description", e.target.value)}
                          placeholder="Describe your responsibilities and achievements..."
                          rows={3}
                        />
                      </div>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="education" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Education</h3>
                    <Button onClick={addEducation} size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Education
                    </Button>
                  </div>

                  {resumeData.education.map((edu, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium">Education {index + 1}</h4>
                        {resumeData.education.length > 1 && (
                          <Button variant="outline" size="sm" onClick={() => removeEducation(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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
                          <Label>School</Label>
                          <Input
                            value={edu.school}
                            onChange={(e) => updateEducation(index, "school", e.target.value)}
                            placeholder="University of Technology"
                          />
                        </div>
                      </div>

                      <div className="mt-4">
                        <Label>Year</Label>
                        <Input
                          value={edu.year}
                          onChange={(e) => updateEducation(index, "year", e.target.value)}
                          placeholder="2020"
                        />
                      </div>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="skills" className="space-y-4">
                  <div>
                    <Label>Skills</Label>
                    <div className="flex space-x-2 mt-2">
                      <Input
                        placeholder="Add a skill and press Enter"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            addSkill(e.currentTarget.value)
                            e.currentTarget.value = ""
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {resumeData.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="px-3 py-1">
                        {skill}
                        <button onClick={() => removeSkill(index)} className="ml-2 text-red-500">
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Actions Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Preview Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="mr-2 h-5 w-5" />
                Preview
              </CardTitle>
              <CardDescription>See how your resume will look</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={previewResume}
                variant="outline"
                className="w-full bg-transparent"
                disabled={!selectedTemplate}
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview Resume
              </Button>
            </CardContent>
          </Card>

          {/* Save Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Button onClick={saveProgress} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Progress
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 text-center">Save your progress and proceed to download options</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
