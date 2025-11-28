"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

// Template names stored as TEXT in Supabase
const TEMPLATE_NAMES = ["Black-White-Simple", "Modern"]

interface GuestPayButtonProps {
  amount: number
  currency: "KES" | "USD"
  type: string
  resumeData: any
  description: string
  className?: string
  size?: "sm" | "default" | "lg"
  children?: React.ReactNode
  onSuccess: (response: { resumeId: string; [key: string]: any }) => void // Updated type for clarity
}

export default function GuestPayButton({
  amount,
  currency,
  type,
  resumeData,
  description,
  onSuccess,
  className,
  size = "default",
  children,
}: GuestPayButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handlePayment = async () => {
    setIsLoading(true)
    let resumeId: string | undefined = undefined; // Declared for broader scope/use

    try {
      // Extract personal info safely
      const personalInfo = resumeData?.personalInfo || {}
      const firstName = personalInfo.firstName || "Guest"
      const lastName = personalInfo.lastName || "User"
      const email = personalInfo.email || "guest@example.com"
      const phone = personalInfo.phone || ""
      const templateName = resumeData?.templateName || "Black-White-Simple"

      if (!TEMPLATE_NAMES.includes(templateName)) {
        throw new Error("Invalid template selected")
      }

      // Step 1: Save guest resume (Async Operation 1)
      const saveRes = await fetch("/api/save-guest-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName,
          lastName,
          phone,
          resumeData,
          templateId: templateName, // store template name as text
        }),
      })

      const saveJson = await saveRes.json()
      console.log("[v0] save-guest-resume response:", saveJson)

      // ✅ Robust Check: Ensure the ID is a valid, non-empty string.
      if (!saveRes.ok || typeof saveJson.resumeId !== 'string' || saveJson.resumeId.length === 0) {
        console.error("[v0] Missing or invalid resumeId in save-guest-resume response")
        throw new Error(
          saveJson.error || "Failed to save resume; resumeId missing or invalid"
        )
      }

      // Store the guaranteed ID
      resumeId = saveJson.resumeId
      console.log("[v0] Captured resumeId:", resumeId)

      // Step 2: Initialize payment (Async Operation 2)
      const paymentRes = await fetch("/api/initialize-payment-guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency,
          type,
          resumeId, // Guaranteed to be a non-empty string
          email,
          description,
          metadata: {
            resume_title: `${firstName} ${lastName}`,
            email,
            type,
            resume_id: resumeId,
          },
        }),
      })

      const paymentJson = await paymentRes.json()
      console.log("[v0] initialize-payment-guest response:", paymentJson)

      if (!paymentRes.ok) {
        console.error(
          "[v0] Payment initialization failed",
          paymentJson.error
        )
        throw new Error(
          paymentJson.error || "Payment initialization failed"
        )
      }

      // Save pending payment locally
      if (paymentJson.data?.reference) {
        localStorage.setItem(
          "pendingGuestPayment",
          JSON.stringify({
            type,
            amount,
            currency,
            reference: paymentJson.data.reference,
            email,
            resumeId, // Stored locally
            timestamp: new Date().toISOString(),
          })
        )
      }
      
      // ✅ Call onSuccess before redirect, ensuring resumeId is passed
      if (resumeId) {
          onSuccess({ ...paymentJson, resumeId });
      }

      // Redirect to payment provider
      if (paymentJson.data?.authorization_url) {
        window.location.href = paymentJson.data.authorization_url
      } else {
        toast.error("Payment initialization failed: No authorization URL")
      }
    } catch (err: any) {
      console.error("[v0] Guest payment error:", err)
      toast.error(err.message || "Failed to process payment")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handlePayment}
      disabled={isLoading}
      className={className}
      size={size}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        children
      )}
    </Button>
  )
}
