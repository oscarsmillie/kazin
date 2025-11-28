"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function CallbackContent() {
  const params = useSearchParams()
  const router = useRouter()
  const [verifying, setVerifying] = useState(true)
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading")
  const [message, setMessage] = useState("Processing your payment confirmation...")

  useEffect(() => {
    const pending = localStorage.getItem("pendingPayment")
    if (!pending) {
      toast.error("No pending payment found.")
      router.replace("/resumes")
      return
    }

    const { reference, type, resumeId } = JSON.parse(pending)

    if (!reference) {
      toast.error("Payment reference missing.")
      router.replace("/resumes")
      return
    }

    const verifyPayment = async () => {
      try {
        const res = await fetch(`/api/verify-payment?reference=${reference}`)
        const data = await res.json()

        if (data.status === "success") {
          // Mark as paid locally if resume download
          if (type?.includes("resume") && resumeId) {
            await supabase
              .from("resumes")
              .update({
                payment_status: "paid",
                extra_download_paid: type === "extra_resume_download",
              })
              .eq("id", resumeId)
          }

          setStatus("success")
          setMessage("Payment confirmed! Redirecting...")
          toast.success("Payment confirmed!")

          // Clear pendingPayment to prevent looping
          localStorage.removeItem("pendingPayment")

          setTimeout(() => {
            if (type === "resume_download" || type === "extra_resume_download") {
              // Redirect to resume-builder/download with payment success param
              router.replace(
                resumeId ? `/resume-builder/download/${resumeId}?payment=success&type=${type}` : "/resumes",
              )
            } else if (type === "professional_upgrade" || type === "discounted_upgrade") {
              router.replace("/dashboard?payment=success")
            } else {
              router.replace("/")
            }
          }, 1500)
        } else {
          setStatus("failed")
          setMessage(data.message || "Payment verification failed.")
          toast.error(data.message || "Payment verification failed.")
          setTimeout(() => {
            router.replace("/resumes")
          }, 2000)
        }
      } catch (err) {
        console.error("Payment verification error:", err)
        setStatus("failed")
        setMessage("Error verifying payment.")
        toast.error("Error verifying payment.")
        setTimeout(() => {
          router.replace("/resumes")
        }, 2000)
      } finally {
        setVerifying(false)
      }
    }

    verifyPayment()
  }, [params, router])

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
          {status === "success" && (
            <div className="text-green-600">
              <p className="text-sm">Redirecting to your resume...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<p className="text-center mt-10">Loading payment verification...</p>}>
      <CallbackContent />
    </Suspense>
  )
}
