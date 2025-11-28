"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Download, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentType = searchParams.get("type")
  const resumeId = searchParams.get("resumeId")
  const [isLoading, setIsLoading] = useState(false)

  const handleDownloadResume = () => {
    if (resumeId) {
      setIsLoading(true)
      router.push(`/resume-builder/download/${resumeId}?payment=success`)
    }
  }

  const handleGuestDownloadResume = () => {
    if (resumeId) {
      setIsLoading(true)
      router.push(`/guest-resume-builder/download/${resumeId}?payment=success`)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold">Payment Successful!</CardTitle>
          <CardDescription>Your payment has been processed successfully</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              {paymentType === "guest_resume_download"
                ? "Your resume is ready for download!"
                : paymentType === "resume_download"
                  ? "Your resume is now ready for download. You can access it anytime from your account."
                  : "Your subscription has been activated. Enjoy unlimited access to all premium features!"}
            </p>
          </div>

          <div className="space-y-3">
            {paymentType === "guest_resume_download" && resumeId ? (
              <>
                <Button onClick={handleGuestDownloadResume} className="w-full" size="lg" disabled={isLoading}>
                  <Download className="h-4 w-4 mr-2" />
                  {isLoading ? "Preparing..." : "Download Your Resume"}
                </Button>
                <Link href="/guest-resume-builder" className="block">
                  <Button variant="outline" className="w-full bg-transparent">
                    Back to Resume Builder
                  </Button>
                </Link>
              </>
            ) : paymentType === "resume_download" && resumeId ? (
              <>
                <Button onClick={handleDownloadResume} className="w-full" size="lg" disabled={isLoading}>
                  <Download className="h-4 w-4 mr-2" />
                  {isLoading ? "Preparing..." : "Download Your Resume"}
                </Button>
                <Link href="/resumes" className="block">
                  <Button variant="outline" className="w-full bg-transparent">
                    View All Resumes
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard" className="block">
                  <Button className="w-full">
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/career-coach" className="block">
                  <Button variant="outline" className="w-full bg-transparent">
                    Explore Premium Features
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>Need help? Contact our support team</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
