"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase" // Client-side Supabase
import type { PaystackInitializeResponse } from "@/lib/paystack" // Import Paystack types

interface DownloadPayButtonProps {
  resumeId: string
  amount: number
  currency: string
  userId: string
  userEmail: string
}

export function DownloadPayButton({ resumeId, amount, currency, userId, userEmail }: DownloadPayButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient() // Use client-side supabase

  const handlePayment = async () => {
    setIsLoading(true)
    try {
      const callbackUrl = `${window.location.origin}/payment/callback?type=resume_download&resumeId=${resumeId}` // Pass type and resumeId

      const response = await fetch("/api/initialize-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          amount,
          currency,
          userId,
          description: `Resume Download: ${resumeId}`,
          callback_url: callbackUrl,
          type: "resume_download", // Explicitly set type
          resumeId: resumeId, // Pass resumeId
        }),
      })

      const data: PaystackInitializeResponse = await response.json()

      if (response.ok && data.data?.authorization_url) {
        router.push(data.data.authorization_url)
      } else {
        toast({
          title: "Payment Error",
          description: data.message || "Failed to initialize payment. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error initializing payment:", error)
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handlePayment} disabled={isLoading}>
      {isLoading ? "Processing..." : `Pay ${amount} ${currency} to Download`}
    </Button>
  )
}
