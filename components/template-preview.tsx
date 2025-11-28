"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Eye, Crown, Palette, Layout } from "lucide-react"
import type { JSONResumeTemplate, ResumeData } from "@/lib/template-types"
import { renderTemplate } from "@/lib/template-renderer"

interface TemplatePreviewProps {
  template: JSONResumeTemplate
  sampleData?: ResumeData
  onSelect?: (template: JSONResumeTemplate) => void
  isSelected?: boolean
  canUse?: boolean
}

const sampleResumeData: ResumeData = {
  personalInfo: {
    fullName: "John Doe",
    email: "john.doe@email.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/johndoe",
    portfolio: "johndoe.com",
  },
  professionalSummary:
    "Experienced software engineer with 5+ years of expertise in full-stack development, specializing in React, Node.js, and cloud technologies. Proven track record of delivering scalable solutions and leading cross-functional teams.",
  workExperience: [
    {
      id: "1",
      title: "Senior Software Engineer",
      company: "Tech Corp",
      location: "San Francisco, CA",
      startDate: "2022-01",
      endDate: "",
      current: true,
      description:
        "Lead development of microservices architecture serving 1M+ users. Implemented CI/CD pipelines reducing deployment time by 60%.",
      achievements: [
        "Reduced system latency by 40% through optimization",
        "Mentored 3 junior developers",
        "Led migration to cloud infrastructure",
      ],
    },
    {
      id: "2",
      title: "Software Engineer",
      company: "StartupXYZ",
      location: "San Francisco, CA",
      startDate: "2020-06",
      endDate: "2021-12",
      current: false,
      description:
        "Developed full-stack web applications using React and Node.js. Collaborated with design team to implement responsive user interfaces.",
    },
  ],
  education: [
    {
      id: "1",
      degree: "Bachelor of Science in Computer Science",
      school: "University of California, Berkeley",
      location: "Berkeley, CA",
      graduationDate: "2020-05",
      gpa: "3.8",
      description: "Relevant coursework: Data Structures, Algorithms, Software Engineering",
    },
  ],
  technicalSkills: ["JavaScript", "TypeScript", "React", "Node.js", "Python", "AWS", "Docker", "PostgreSQL"],
  softSkills: ["Leadership", "Communication", "Problem Solving", "Team Collaboration"],
  achievements: [
    "Winner of 2023 Company Hackathon",
    "Published article on Medium with 10K+ views",
    "Speaker at React Conference 2023",
  ],
  certifications: [
    {
      id: "1",
      name: "AWS Certified Solutions Architect",
      issuer: "Amazon Web Services",
      date: "2023-03",
      credentialId: "AWS-123456",
    },
  ],
}

export default function TemplatePreview({
  template,
  sampleData = sampleResumeData,
  onSelect,
  isSelected = false,
  canUse = true,
}: TemplatePreviewProps) {
  const [previewOpen, setPreviewOpen] = useState(false)

  const handleSelect = () => {
    if (canUse && onSelect) {
      onSelect(template)
    }
  }

  const previewHTML = renderTemplate(template as any, sampleData)

  return (
    <Card
      className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected ? "ring-2 ring-blue-500 border-blue-500" : ""
      } ${canUse ? "hover:scale-105" : "opacity-75"}`}
      onClick={handleSelect}
    >
      {/* Premium Badge */}
      {template.is_premium && (
        <div className="absolute top-4 right-4 z-10">
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            <Crown className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        </div>
      )}

      {/* Lock Overlay for Restricted Templates */}
      {!canUse && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-lg">
          <div className="text-center text-white">
            <Crown className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm font-medium">Premium Required</p>
          </div>
        </div>
      )}

      <CardContent className="p-6">
        {/* Template Thumbnail - Made Larger */}
        <div className="aspect-[3/4] bg-gray-100 rounded-lg mb-6 overflow-hidden h-80">
          {template.thumbnail_url ? (
            <img
              src={template.thumbnail_url || "/placeholder.svg"}
              alt={template.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Layout className="h-16 w-16 mx-auto mb-3" />
                <p className="text-sm">Preview</p>
              </div>
            </div>
          )}
        </div>

        {/* Template Info */}
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-xl mb-2">{template.name}</h3>
            <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
          </div>

          {/* Template Features */}
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-sm px-3 py-1">
              {template.category}
            </Badge>
            <div className="flex items-center space-x-3">
              {/* Color Scheme Indicator */}
              <div className="flex items-center space-x-2">
                <Palette className="h-4 w-4 text-gray-400" />
                <div
                  className="w-4 h-4 rounded-full border-2 border-gray-200"
                  style={{ backgroundColor: template.template_config.style.colorScheme.primary }}
                />
              </div>

              {/* Layout Type */}
              <div className="flex items-center space-x-2">
                <Layout className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500 capitalize">
                  {template.template_config.layout.type.replace("-", " ")}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3">
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span>{template.name} Preview</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{template.category}</Badge>
                      {template.is_premium && (
                        <Badge className="bg-purple-100 text-purple-800">
                          <Crown className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>
                  </DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                  <div
                    className="bg-white border rounded-lg p-6 max-h-[70vh] overflow-auto"
                    dangerouslySetInnerHTML={{ __html: previewHTML }}
                  />
                </div>
              </DialogContent>
            </Dialog>

            <div className="text-sm text-gray-500 font-medium">
              {template.download_count.toLocaleString()} downloads
            </div>
          </div>
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
            <div className="absolute top-3 left-3 bg-blue-500 text-white px-3 py-1 rounded-md text-sm font-medium">
              Selected
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
