"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function PaymentCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference")
  const paymentType = searchParams.get("type")
  const resumeId = searchParams.get("resumeId")
  const planId = searchParams.get("planId")

  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading")
  const [message, setMessage] = useState("Verifying your payment...")

  useEffect(() => {
    const verifyPayment = async () => {
      if (!reference) {
        setStatus("failed")
        setMessage("Payment reference not found.")
        return
      }

      try {
        console.log("[v0] Verifying payment:", { reference, paymentType, resumeId, planId })

        const response = await fetch(`/api/verify-payment?reference=${reference}`)
        const data = await response.json()

        console.log("[v0] Payment verification response:", data)

        if (response.ok && data.status === "success") {
          setStatus("success")
          setMessage("Payment verified successfully!")

          // Give time for user to see success message
          setTimeout(() => {
            if ((paymentType === "resume_download" || paymentType === "extra_resume_download") && resumeId) {
              window.location.href = `/resume-builder/download/${resumeId}?payment=success&type=${paymentType}`
            } else if (paymentType === "discounted_upgrade") {
              // Discounted upgrade to professional - redirect to dashboard with upgrade success
              window.location.href = `/dashboard?payment=success&upgraded=professional&discount=true`
            } else if (paymentType === "professional_upgrade") {
              window.location.href = `/dashboard?payment=success&upgraded=professional&plan=${planId || ""}`
            } else {
              window.location.href = "/dashboard?payment=success"
            }
          }, 1500)
        } else {
          setStatus("failed")
          setMessage(data.message || "Payment verification failed. Please try again.")
        }
      } catch (error) {
        console.error("[v0] Error during payment verification:", error)
        setStatus("failed")
        setMessage("An unexpected error occurred during payment verification.")
      }
    }

    verifyPayment()
  }, [reference, router, paymentType, resumeId, planId])

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            {status === "loading" && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
            {status === "success" && <CheckCircle className="h-12 w-12 text-green-500" />}
            {status === "failed" && <XCircle className="h-12 w-12 text-red-500" />}
          </div>
          <CardTitle className="text-2xl font-bold">
            {status === "loading" && "Processing Payment"}
            {status === "success" && "Payment Successful!"}
            {status === "failed" && "Payment Failed"}
          </CardTitle>
          <CardDescription className="mt-2">
            {message}
            {status === "success" && paymentType === "discounted_upgrade" && (
              <span className="block mt-2 text-green-600 font-medium">
                Welcome to Professional! Redirecting to your dashboard...
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "failed" && (
            <div className="space-y-3">
              <Button onClick={() => router.push("/pricing")} className="w-full">
                View Pricing
              </Button>
              <Button variant="outline" onClick={() => router.push("/dashboard")} className="w-full">
                Go to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
