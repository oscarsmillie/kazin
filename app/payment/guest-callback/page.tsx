"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function GuestPaymentCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference")

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
        const res = await fetch(`/api/verify-payment?reference=${reference}`)
        const data = await res.json()

        console.log("[v0] Verify payment response:", { status: res.status, data })

        if (!res.ok || data.status !== "success") {
          console.error("[v0] Payment verification failed:", data)
          setStatus("failed")
          setMessage(data.message || "Payment verification failed. Please contact support.")
          return
        }

        const extractedResumeId =
          data.metadata?.resumeId ||
          data.metadata?.resume_id ||
          data.data?.metadata?.resume_id ||
          data.data?.metadata?.custom_fields?.find((f: any) => f.variable_name === "resume_id")?.value

        if (!extractedResumeId) {
          console.error("[v0] Resume ID not found in verification response:", data)
          setStatus("failed")
          setMessage(`Resume ID not found. Please contact support with reference: ${reference}`)
          return
        }

        console.log("[v0] Payment verified successfully, redirecting to download:", extractedResumeId)
        setStatus("success")
        setMessage("Payment verified! Redirecting...")

        setTimeout(() => {
          router.replace(`/guest-resume-builder/download/${extractedResumeId}?payment_verified=true`)
        }, 2000)
      } catch (err) {
        console.error("[v0] Callback verification error:", err)
        setStatus("failed")
        setMessage("An unexpected error occurred. Please contact support.")
      }
    }

    verifyPayment()
  }, [reference, router])

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {status === "loading" && "Processing Payment"}
            {status === "success" && "Payment Successful!"}
            {status === "failed" && "Payment Failed"}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          {status === "loading" && <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />}
          {status === "failed" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Reference: {reference}</p>
              <Button onClick={() => router.push("/guest-resume-builder")} className="mt-4">
                Back to Resume Builder
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
