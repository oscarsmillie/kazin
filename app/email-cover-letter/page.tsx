"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, FileText, ArrowRight, Sparkles, Clock, Target } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function EmailCoverLetterPage() {
  const router = useRouter()
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sign In Required</h3>
            <p className="text-gray-600 text-center mb-6">Please sign in to access email and cover letter tools</p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <a href="/auth">Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Email & Cover Letter Generator</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create professional emails and cover letters with AI assistance. Choose your tool below to get started.
          </p>
        </div>

        {/* Main Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Cover Letter Generator */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-white/20 backdrop-blur-sm">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Cover Letter Generator</CardTitle>
                  <CardDescription className="text-green-100">
                    Create tailored cover letters for job applications
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Target className="h-5 w-5 text-green-600 mr-2" />
                    Perfect for:
                  </h4>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Job applications
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Internship applications
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Freelance proposals
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Professional introductions
                    </li>
                  </ul>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center text-green-800">
                    <Clock className="h-5 w-5 mr-2" />
                    <span className="font-medium">Generate in seconds</span>
                  </div>
                  <p className="text-green-700 text-sm mt-1">
                    AI-powered content tailored to your experience and the job requirements
                  </p>
                </div>

                <Button
                  onClick={() => router.push("/cover-letter")}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-semibold py-3 rounded-lg transition-all duration-200 group-hover:scale-105"
                >
                  Create Cover Letter
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Email Generator */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-lg">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-white/20 backdrop-blur-sm">
                  <Mail className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Email Generator</CardTitle>
                  <CardDescription className="text-purple-100">
                    Generate professional emails for any situation
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Target className="h-5 w-5 text-purple-600 mr-2" />
                    Perfect for:
                  </h4>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                      Follow-up emails
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                      Thank you notes
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                      Networking emails
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                      Interview requests
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                      Professional inquiries
                    </li>
                  </ul>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center text-purple-800">
                    <Sparkles className="h-5 w-5 mr-2" />
                    <span className="font-medium">Multiple email types</span>
                  </div>
                  <p className="text-purple-700 text-sm mt-1">
                    From networking to follow-ups, create the perfect email for every occasion
                  </p>
                </div>

                <Button
                  onClick={() => router.push("/email-generator")}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-semibold py-3 rounded-lg transition-all duration-200 group-hover:scale-105"
                >
                  Generate Email
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900">Why Choose Our AI-Powered Tools?</CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Professional quality content generation with intelligent customization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-full p-4 w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900">Professional Quality</h3>
                <p className="text-gray-600">AI-generated content that matches industry standards and best practices</p>
              </div>

              <div className="text-center group">
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-full p-4 w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900">Time Saving</h3>
                <p className="text-gray-600">
                  Generate professional content in seconds, not hours of writing and editing
                </p>
              </div>

              <div className="text-center group">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-full p-4 w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900">Customizable</h3>
                <p className="text-gray-600">Tailor content to your specific needs, style, and target audience</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
