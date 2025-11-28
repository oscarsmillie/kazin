"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Zap, Lock, CheckCircle, Star, Lightbulb, TrendingUp, Award, Clock } from "lucide-react"
import Link from "next/link"

export default function GuestResumeBuilderPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">African Resume Builder</h1>
            </div>
            <div className="space-x-3 flex items-center">
              <Link href="/auth">
                <Button variant="outline" className="text-gray-700 border-gray-300 bg-transparent">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">Create Account</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section - CHANGE: Enhanced with stronger value proposition and urgency */}
      <div className="bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              Used by 4,600+ African Professionals
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 text-balance">
              Land Your Dream Job with a Professional Resume
            </h2>

            <p className="text-xl text-gray-600 text-balance">
              Create an ATS-optimized resume in minutes. Get hired faster with templates designed specifically for the
              African job market.
            </p>

            {/* CTA - CHANGE: Primary action moved up */}
            <div className="pt-4 space-y-4">
              <Link href="/guest-resume-builder/templates">
                <Button
                  size="lg"
                  className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white h-12 text-base px-8"
                >
                  Build Your Resume Free
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <p className="text-sm text-gray-600">Takes just 5 minutes. Use Smartphone. No credit card needed.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* CHANGE: Completely redesigned intro to focus on features and benefits instead of pricing */}
        <div className="mb-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="flex items-start gap-4 mb-8">
              <div className="bg-blue-100 rounded-lg p-3 flex-shrink-0">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-3">Create Your Professional Resume in Minutes</h2>
                <p className="text-lg text-gray-600">
                  Build an ATS-optimized resume that gets you noticed by top employers. Our AI-powered resume builder
                  makes it easy to create a professional resume that showcases your skills and experience.
                </p>
              </div>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 py-6 border-t border-b border-gray-200">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">ATS-Optimized Templates</p>
                  <p className="text-sm text-gray-600">Designed to pass Applicant Tracking Systems</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">AI-Powered Suggestions</p>
                  <p className="text-sm text-gray-600">Get smart content recommendations</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Multiple Professional Templates</p>
                  <p className="text-sm text-gray-600">Choose from premium designs</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Live Preview</p>
                  <p className="text-sm text-gray-600">See changes in real-time</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">One-Time Download</p>
                  <p className="text-sm text-gray-600">Pay only when you download</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">No Subscriptions</p>
                  <p className="text-sm text-gray-600">Build unlimited resumes</p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <Link href="/guest-resume-builder/templates">
              <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base">
                Start Building Your Resume
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <Lock className="h-4 w-4 inline mr-2" />
                <strong>No commitment:</strong> Build and preview your resume for free. Download it anytime for a small
                one-time fee.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  1
                </span>
                Choose Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Select from our collection of professionally designed resume templates that are optimized for ATS
                systems.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  2
                </span>
                Fill Your Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Enter your details and let our AI help you write compelling content that highlights your achievements
                and skills.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  3
                </span>
                Download & Apply
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Download your professional resume as a PDF and start applying to your dream jobs. It only takes a few
                seconds!
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Why Choose Us */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-8 mb-12 border border-blue-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Lightbulb className="h-6 w-6 text-blue-600" />
            Why Professionals Choose KaziNest
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700">
                <strong>ATS-Friendly Formatting:</strong> Our templates are tested to pass automated screening systems
                used by recruiters.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700">
                <strong>AI Content Assistance:</strong> Get suggestions for strong action verbs, quantifiable
                achievements, and industry keywords.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700">
                <strong>Built for African Professionals:</strong> Templates and suggestions tailored for the African job
                market.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-gray-700">
                <strong>Proven Results:</strong> Join thousands of professionals who landed their dream jobs using
                KaziNest.
              </p>
            </div>
          </div>
        </div>

        {/* Social Proof - CHANGE: Added compelling stats section */}
        <div className="bg-gray-50 border-y border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">10K+</p>
                <p className="text-gray-600">Resumes Created</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-bold text-green-600 mb-2">92%</p>
                <p className="text-gray-600">Pass ATS Screening</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">5 min</p>
                <p className="text-gray-600">Average Build Time</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-bold text-orange-600 mb-2">3x</p>
                <p className="text-gray-600">Interview Callbacks</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Key Features Section - CHANGE: Reorganized with better visual hierarchy */}
          <div className="py-16">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-gray-900 mb-3">Why Choose KaziNest?</h3>
              <p className="text-lg text-gray-600">Everything you need to stand out to recruiters</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="bg-blue-100 rounded-lg p-3 w-fit mb-4">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Content</h4>
                <p className="text-gray-600">
                  Get smart suggestions for skills, achievements, and action verbs that impress recruiters.
                </p>
              </div>

              <div className="p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="bg-green-100 rounded-lg p-3 w-fit mb-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">ATS-Optimized</h4>
                <p className="text-gray-600">
                  All templates pass Applicant Tracking Systems, ensuring your resume reaches human eyes.
                </p>
              </div>

              <div className="p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="bg-purple-100 rounded-lg p-3 w-fit mb-4">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Professional Templates</h4>
                <p className="text-gray-600">
                  Designed for African market. Modern, clean layouts that highlight your best qualifications.
                </p>
              </div>

              <div className="p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="bg-orange-100 rounded-lg p-3 w-fit mb-4">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Live Preview</h4>
                <p className="text-gray-600">
                  See your resume update in real-time. No guessing how it will look to recruiters.
                </p>
              </div>

              <div className="p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="bg-red-100 rounded-lg p-3 w-fit mb-4">
                  <Lock className="h-6 w-6 text-red-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Easy Download</h4>
                <p className="text-gray-600">
                  Download as PDF instantly. Share directly with recruiters or submit online applications.
                </p>
              </div>

              <div className="p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="bg-indigo-100 rounded-lg p-3 w-fit mb-4">
                  <Star className="h-6 w-6 text-indigo-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Build Unlimited</h4>
                <p className="text-gray-600">
                  Create multiple resumes for different positions. Tailor each one to the job.
                </p>
              </div>
            </div>
          </div>

          {/* How It Works - CHANGE: Simplified and more visual */}
          <div className="py-16 border-t border-gray-200">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-gray-900 mb-3">Get Started in 3 Steps</h3>
              <p className="text-lg text-gray-600">From template to job interview, in minutes</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="text-center">
                <div className="h-14 w-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Choose Template</h4>
                <p className="text-gray-600">
                  Pick from our collection of ATS-friendly templates. All designed for success.
                </p>
              </div>

              <div className="text-center">
                <div className="h-14 w-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Add Your Info</h4>
                <p className="text-gray-600">
                  Fill in your details. AI helps you write strong descriptions for each section.
                </p>
              </div>

              <div className="text-center">
                <div className="h-14 w-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Download & Apply</h4>
                <p className="text-gray-600">
                  Download your professional resume and start applying to dream jobs immediately.
                </p>
              </div>
            </div>
          </div>

          {/* Testimonials/Trust Section - CHANGE: Added social proof */}
          <div className="py-16 border-t border-gray-200">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-8 border border-blue-200">
              <div className="flex items-start gap-4 mb-6">
                <Lightbulb className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Built for African Professionals</h3>
                  <p className="text-gray-700 mb-4">
                    Our resume templates are crafted with knowledge of how African job markets work. We include
                    industry-specific keywords, format considerations, and best practices recognized by top employers
                    across the continent.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-start gap-2">
                      <Star className="h-5 w-5 text-yellow-400 fill-yellow-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Trusted by top companies in 25+ African countries</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Star className="h-5 w-5 text-yellow-400 fill-yellow-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">Used for tech, finance, healthcare & more</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Final CTA - CHANGE: Strong closing call to action */}
          <div className="py-16 border-t border-gray-200 text-center">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardHeader>
                <CardTitle className="text-2xl md:text-3xl">Ready to Stand Out?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-lg text-gray-700">
                  Join thousands of professionals who've landed better jobs with KaziNest. Start building your winning
                  resume today.
                </p>

                <div className="flex flex-col md:flex-row gap-4 justify-center">
                  <Link href="/guest-resume-builder/templates" className="md:flex-1">
                    <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base">
                      Build Your Resume Now
                    </Button>
                  </Link>
                  <Link href="/auth" className="md:flex-1">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full h-12 text-base border-blue-300 text-gray-900 bg-transparent"
                    >
                      Create Free Account
                    </Button>
                  </Link>
                </div>

                <p className="text-sm text-gray-600">No credit card required. Download when ready to use.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
