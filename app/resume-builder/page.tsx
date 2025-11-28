"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText, Plus, Eye, Edit, Download, HelpCircle, Lightbulb, CheckCircle, ArrowRight } from "lucide-react"

const quickTips = [
  "Choose a template that matches your industry",
  "Use action verbs to describe your achievements",
  "Quantify your accomplishments with numbers",
  "Keep your resume to 1-2 pages maximum",
  "Proofread multiple times for errors",
  "Tailor your resume for each job application",
]

export default function ResumeBuilderPage() {
  const router = useRouter()
  const [showGuide, setShowGuide] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Resume Builder</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create professional resumes that get you noticed by employers
          </p>
        </div>

        {/* Quick Guide Dialog */}
        <Dialog open={showGuide} onOpenChange={setShowGuide}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Quick Resume Building Guide
              </DialogTitle>
              <DialogDescription>Follow these steps to create an effective resume</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Quick Tips</h3>
                <div className="space-y-2">
                  {quickTips.map((tip, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Pro Tip</h4>
                <p className="text-blue-800 text-sm">
                  Use our AI-powered suggestions to optimize your resume content and increase your chances of getting
                  interviews.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowGuide(false)
                    router.push("/resume-builder/guide")
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  View Full Guide
                </Button>
                <Button
                  onClick={() => {
                    setShowGuide(false)
                    router.push("/resume-builder/create")
                  }}
                  className="flex-1"
                >
                  Start Building
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                <Plus className="h-5 w-5" />
                Create New Resume
              </CardTitle>
              <CardDescription>Start building a new resume from scratch with our templates</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/resume-builder/create")} className="w-full">
                Get Started
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group-hover:text-green-600 transition-colors">
                <Eye className="h-5 w-5" />
                Browse Templates
              </CardTitle>
              <CardDescription>Explore our collection of professional resume templates</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/resume-builder/templates")} variant="outline" className="w-full">
                View Templates
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 group-hover:text-purple-600 transition-colors">
                <FileText className="h-5 w-5" />
                My Resumes
              </CardTitle>
              <CardDescription>View and edit your saved resumes</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/resumes")} variant="outline" className="w-full">
                View Resumes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Help Section */}
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <HelpCircle className="h-5 w-5" />
              Need Help Getting Started?
            </CardTitle>
            <CardDescription className="text-amber-800">
              Learn how to create an effective resume with our comprehensive guide
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => setShowGuide(true)}
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                Quick Guide
              </Button>
              <Button
                onClick={() => router.push("/resume-builder/guide")}
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                <FileText className="h-4 w-4 mr-2" />
                Full Tutorial
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features Overview */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Professional Templates</h3>
            <p className="text-sm text-gray-600">Choose from ATS-friendly templates</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Edit className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Easy Editing</h3>
            <p className="text-sm text-gray-600">Intuitive drag-and-drop interface</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Eye className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Live Preview</h3>
            <p className="text-sm text-gray-600">See changes in real-time</p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Download className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Multiple Formats</h3>
            <p className="text-sm text-gray-600">Download as PDF or Word</p>
          </div>
        </div>
      </div>
    </div>
  )
}
