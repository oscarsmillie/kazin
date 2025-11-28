"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

export default function PayButton({
  amount,
  currency = "KES",
  type = "resume_download",
  resumeId,
  description,
  onSuccess,
  onError,
  children,
  className,
  size = "default",
  disabled = false,
  plan,
}) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handlePayment = async () => {
    if (!user) {
      toast.error("Please sign in to continue")
      return
    }

    setIsLoading(true)

    try {
      // Fetch fresh session token (handles refresh)
      const { data, error } = await supabase.auth.getSession()

      if (error || !data?.session?.access_token) {
        toast.error("Authentication error. Please sign in again.")
        setIsLoading(false)
        return
      }

      const token = data.session.access_token

      // Determine payment category
      const effectivePaymentType = plan ? "professional_upgrade" : type

      // Validate resume payments
      if (
        effectivePaymentType === "resume_download" ||
        effectivePaymentType === "extra_resume_download"
      ) {
        if (!resumeId) {
          toast.error("Resume ID is missing for this payment")
          setIsLoading(false)
          return
        }
      }

      // Build payload safely
      const payload: any = {
        amount,
        currency: currency.toUpperCase(),
        type: effectivePaymentType,
        description: description || `${effectivePaymentType} payment`,
      }

      if (resumeId) payload.resumeId = resumeId
      if (plan) payload.plan = plan

      // Make the request
      const response = await fetch("/api/initialize-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error("Payment API Error:", result)
        throw new Error(result?.error || "Payment initialization failed")
      }

      if (result.success && result.data?.authorization_url) {
        // Store pending payment
        localStorage.setItem(
          "pendingPayment",
          JSON.stringify({
            type: effectivePaymentType,
            resumeId,
            user_id: user.id,
            amount,
            currency: currency.toUpperCase(),
            reference: result.data.reference,
            plan,
          })
        )

        window.location.href = result.data.authorization_url
      } else {
        throw new Error("Invalid payment response from server")
      }
    } catch (err: any) {
      toast.error(err.message || "Payment failed")
      if (onError) onError(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || isLoading}
      className={className}
      size={size}
    >
      {isLoading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Processing...
        </div>
      ) : (
        children
      )}
    </Button>
  )
}
