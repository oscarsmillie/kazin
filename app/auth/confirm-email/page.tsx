"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"

export default function ConfirmEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type")

  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading")
  const [message, setMessage] = useState("Confirming your email address...")

  useEffect(() => {
    const confirmEmail = async () => {
      if (!token_hash || !type) {
        setStatus("failed")
        setMessage("Invalid confirmation link. Please request a new verification email.")
        console.error("[v0] Missing token_hash or type:", { token_hash, type })
        return
      }

      const supabase = createClient()
      try {
        console.log("[v0] Confirming email with token_hash:", { type })

        const { error } = await supabase.auth.verifyOtp({
          token_hash: token_hash,
          type: type as "signup" | "recovery" | "invite" | "email_change",
        })

        if (error) {
          console.error("[v0] Email confirmation error:", { message: error.message, code: error.code })
          setStatus("failed")
          
          if (error.message?.includes("expired")) {
            setMessage("Verification link has expired. Please request a new one.")
          } else if (error.message?.includes("invalid")) {
            setMessage("Invalid verification link. Please request a new one.")
          } else {
            setMessage(`Email confirmation failed: ${error.message}`)
          }
        } else {
          console.log("[v0] Email confirmed successfully")
          setStatus("success")
          setMessage("Email verified successfully!")

          try {
            const { data: { user } } = await supabase.auth.getUser()
            
            if (user) {
              console.log("[v0] Sending welcome email after confirmation:", { userId: user.id })
              const welcomeResponse = await fetch("/api/auth/send-welcome-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: user.email,
                  fullName: user.user_metadata?.full_name || "User",
                  dashboardUrl: `${window.location.origin}/dashboard`,
                }),
              })
              
              if (welcomeResponse.ok) {
                console.log("[v0] Welcome email sent successfully")
              } else {
                console.error("[v0] Welcome email failed:", await welcomeResponse.json())
              }
            }
          } catch (emailError) {
            console.error("[v0] Welcome email error:", emailError)
            // Don't fail the confirmation if welcome email fails
          }

          // Redirect to dashboard or sign in page after success
          setTimeout(() => {
            router.push("/auth?verified=true")
          }, 2000)
        }
      } catch (error) {
        console.error("[v0] Unexpected error during email confirmation:", error)
        setStatus("failed")
        setMessage("An unexpected error occurred. Please try again.")
      }
    }

    confirmEmail()
  }, [token_hash, type, router])

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {status === "loading" && "Confirming Email"}
            {status === "success" && "Email Confirmed!"}
            {status === "failed" && "Confirmation Failed"}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          {status === "loading" && <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />}
          {status === "failed" && (
            <div className="space-y-2">
              <Button onClick={() => router.push("/auth")} className="w-full">
                Go to Login
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push("/auth?tab=signup")} 
                className="w-full"
              >
                Create New Account
              </Button>
            </div>
          )}
          {status === "success" && (
            <Button onClick={() => router.push("/dashboard")} className="w-full">
              Go to Dashboard
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
