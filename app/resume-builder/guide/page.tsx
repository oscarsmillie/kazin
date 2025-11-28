"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Palette, Download, Edit, Eye, Save, ArrowRight, CheckCircle, Lightbulb, Star } from "lucide-react"
import { useRouter } from "next/navigation"

const steps = [
  {
    icon: FileText,
    title: "Choose a Template",
    description:
      "Browse our collection of professional resume templates and select one that matches your industry and style preferences.",
    tips: [
      "Choose templates that match your industry (creative vs. corporate)",
      "Consider ATS-friendly templates for better parsing",
      "Professional templates work well for most industries",
    ],
  },
  {
    icon: Edit,
    title: "Fill in Your Information",
    description:
      "Add your personal details, work experience, education, skills, and other relevant information using our intuitive form.",
    tips: [
      "Use action verbs to describe your achievements",
      "Quantify your accomplishments with numbers and percentages",
      "Keep descriptions concise but impactful",
    ],
  },
  {
    icon: Eye,
    title: "Preview Your Resume",
    description:
      "See how your resume looks in real-time as you make changes. Our preview updates instantly as you edit.",
    tips: [
      "Check for consistent formatting and spacing",
      "Ensure all sections are properly aligned",
      "Review for any spelling or grammar errors",
    ],
  },
  {
    icon: Palette,
    title: "Customize Design",
    description: "Adjust colors, fonts, and layout to make your resume stand out while maintaining professionalism.",
    tips: [
      "Use colors sparingly and professionally",
      "Ensure good contrast for readability",
      "Keep the design clean and uncluttered",
    ],
  },
  {
    icon: Save,
    title: "Save Your Work",
    description:
      "Save your resume to your account so you can edit it later or create multiple versions for different jobs.",
    tips: [
      "Create different versions for different job types",
      "Use descriptive names for easy identification",
      "Save frequently to avoid losing your work",
    ],
  },
  {
    icon: Download,
    title: "Download & Apply",
    description: "Download your resume as a PDF or Word document and start applying to your dream jobs.",
    tips: [
      "PDF format is usually preferred by employers",
      "Check the file size before submitting",
      "Test the download on different devices",
    ],
  },
]

const bestPractices = [
  "Keep your resume to 1-2 pages maximum",
  "Use a professional email address",
  "Include relevant keywords from job descriptions",
  "Proofread multiple times for errors",
  "Use consistent formatting throughout",
  "Include quantifiable achievements",
  "Tailor your resume for each job application",
  "Use a clean, readable font (10-12pt size)",
]

export default function ResumeBuilderGuide() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Resume Builder Guide</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Learn how to create a professional resume that gets you noticed by employers
          </p>
        </div>

        {/* Quick Start */}
        <Card className="mb-8 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Star className="h-5 w-5" />
              Quick Start
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-800 mb-4">
              Ready to get started? Jump right into building your resume with our step-by-step process.
            </p>
            <Button onClick={() => router.push("/resume-builder")} className="bg-blue-600 hover:bg-blue-700">
              Start Building Now
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* Step-by-Step Guide */}
        <div className="space-y-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center">Step-by-Step Process</h2>

          {steps.map((step, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <step.icon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="text-xs">
                        Step {index + 1}
                      </Badge>
                      <CardTitle className="text-lg">{step.title}</CardTitle>
                    </div>
                    <CardDescription className="text-base">{step.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="ml-16">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    Pro Tips
                  </h4>
                  <ul className="space-y-1">
                    {step.tips.map((tip, tipIndex) => (
                      <li key={tipIndex} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Best Practices */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Resume Best Practices
            </CardTitle>
            <CardDescription>Follow these guidelines to create a resume that stands out</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {bestPractices.map((practice, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{practice}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="text-center bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
          <CardContent className="pt-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Build Your Professional Resume?</h3>
            <p className="text-gray-600 mb-6">Use our AI-powered resume builder to create a resume that gets results</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => router.push("/resume-builder")}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                size="lg"
              >
                <FileText className="h-4 w-4 mr-2" />
                Start Building Resume
              </Button>
              <Button variant="outline" onClick={() => router.push("/resume-builder/templates")} size="lg">
                <Eye className="h-4 w-4 mr-2" />
                Browse Templates
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
