"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/lib/supabase"
import type { PaystackInitializeResponse } from "@/lib/paystack"
import { toast } from "@/components/ui/use-toast"

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const planId = searchParams.get("plan")
  const [transactionData, setTransactionData] = useState<any>(null)
  const [status, setStatus] = useState<"success" | "failed" | "pending">("pending")
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const supabase = createClient()

  const plans = {
    professional: {
      id: "professional",
      name: "Professional Plan",
      price: 9.99, // Ensure this matches your actual price
      currency: "USD",
      description: "Unlock all features for a month.",
    },
    // Add other plans if necessary
  } as const

  const selectedPlan = planId ? plans[planId as keyof typeof plans] : null

  useEffect(() => {
    const verifyPayment = async () => {
      const paymentReference = searchParams.get("reference") || searchParams.get("trxref")

      if (!paymentReference) {
        setStatus("failed")
        setIsLoading(false)
        return
      }

      try {
        console.log("🔍 Verifying payment:", paymentReference)

        const response = await fetch("/api/verify-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reference: paymentReference,
          }),
        })

        const data = await response.json()

        console.log("📡 Payment verification response:", data)

        if (data.success && data.data?.status === "success") {
          setStatus("success")
          setTransactionData(data.data)

          // Update user subscription if it's a subscription payment
          if (data.data.metadata?.plan && user) {
            await updateUserSubscription(data.data)
          }

          toast({
            title: "Payment Successful!",
            description: "Your payment has been processed successfully.",
            variant: "default",
          })
        } else {
          setStatus("failed")
          toast({
            title: "Payment Failed",
            description: "There was an issue processing your payment.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("💥 Payment verification error:", error)
        setStatus("failed")
        toast({
          title: "Payment Failed",
          description: "Failed to verify payment.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      verifyPayment()
    } else {
      router.push("/auth") // Redirect to login if no user
      setIsLoading(false)
    }
  }, [router, searchParams, user, supabase])

  const updateUserSubscription = async (paymentData: any) => {
    try {
      const { plan, userId } = paymentData.metadata

      if (plan && userId) {
        const subscriptionData = {
          user_id: userId,
          plan_type: plan.includes("professional") ? "premium" : "free",
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          payment_reference: paymentData.reference,
          amount_paid: paymentData.amount / 100, // Convert from kobo/cents
          currency: paymentData.currency,
        }

        const { error } = await supabase.from("subscriptions").upsert(subscriptionData, {
          onConflict: "user_id",
        })

        if (error) {
          console.error("Error updating subscription:", error)
        } else {
          console.log("✅ Subscription updated successfully")
        }
      }
    } catch (error) {
      console.error("Error updating user subscription:", error)
    }
  }

  const handleCheckout = async () => {
    if (!user || !selectedPlan) {
      toast({
        title: "Error",
        description: "User or plan not found.",
        variant: "destructive",
      })
      return
    }

    setIsProcessingPayment(true)
    try {
      const callbackUrl = `${window.location.origin}/payment/callback?type=professional_upgrade&planId=${selectedPlan.id}` // Pass type and planId

      const response = await fetch("/api/initialize-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount: selectedPlan.price,
          currency: selectedPlan.currency,
          userId: user.id,
          plan: selectedPlan.id,
          description: `Upgrade to ${selectedPlan.name}`,
          callback_url: callbackUrl,
          type: "professional_upgrade", // Explicitly set type
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
      setIsProcessingPayment(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!selectedPlan) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold">Plan Not Found</h1>
        <p className="mt-2 text-muted-foreground">Please select a valid plan to proceed.</p>
        <Button onClick={() => router.push("/pricing")} className="mt-4">
          Go to Pricing
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === "success" ? (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-green-700">Payment Successful!</CardTitle>
              <CardDescription>Your payment has been processed successfully.</CardDescription>
            </>
          ) : (
            <>
              {status === "pending" && (
                <>
                  <CardTitle className="text-3xl font-bold">Checkout</CardTitle>
                  <CardDescription>Confirm your purchase of the {selectedPlan.name}.</CardDescription>
                </>
              )}
              {status === "failed" && (
                <>
                  <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <CardTitle className="text-red-700">Payment Failed</CardTitle>
                  <CardDescription>There was an issue processing your payment.</CardDescription>
                </>
              )}
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {status === "pending" && (
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold">{selectedPlan.name}</h2>
              <p className="mt-2 text-4xl font-bold">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: selectedPlan.currency,
                }).format(selectedPlan.price)}
              </p>
              <p className="mt-2 text-muted-foreground">{selectedPlan.description}</p>
            </div>
          )}
          {status === "success" && transactionData && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Transaction Details</h3>
              <div className="space-y-1 text-sm text-green-700">
                <p>
                  <span className="font-medium">Amount:</span>{" "}
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: transactionData.currency.toUpperCase(),
                  }).format(transactionData.amount / 100)}{" "}
                  // Convert from kobo/cents
                </p>
                <p>
                  <span className="font-medium">Reference:</span> {transactionData.reference}
                </p>
                <p>
                  <span className="font-medium">Date:</span> {new Date(transactionData.paid_at).toLocaleDateString()}
                </p>
                {transactionData.metadata?.plan && (
                  <p>
                    <span className="font-medium">Plan:</span> {transactionData.metadata.plan}
                  </p>
                )}
              </div>
            </div>
          )}

          {status === "failed" && (
            <Alert>
              <AlertDescription>
                Your payment could not be processed. Please try again or contact support if the issue persists.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            {status === "success" ? (
              <>
                <Button onClick={() => router.push("/dashboard")} className="w-full">
                  Go to Dashboard
                </Button>
                <Button variant="outline" onClick={() => router.push("/")} className="w-full">
                  Back to Home
                </Button>
              </>
            ) : (
              <>
                {status === "pending" && (
                  <Button onClick={handleCheckout} className="w-full py-3 text-lg" disabled={isProcessingPayment}>
                    {isProcessingPayment ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
                      </>
                    ) : (
                      `Proceed to Pay ${new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: selectedPlan.currency,
                      }).format(selectedPlan.price)}`
                    )}
                  </Button>
                )}
                <Button variant="outline" onClick={() => router.push("/")} className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
