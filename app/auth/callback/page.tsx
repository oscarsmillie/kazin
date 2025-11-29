"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const code = searchParams.get("code")
        const error = searchParams.get("error")
        const errorDescription = searchParams.get("error_description")

        console.log("[AuthCallback] OAuth params:", { hasCode: !!code, error })

        if (error) {
          console.error("[AuthCallback] OAuth error:", errorDescription)
          setStatus("error")
          setMessage(errorDescription || error || "Authentication failed.")
          return
        }

        if (!code) {
          // Check if already logged in
          const { data: { session } } = await supabase.auth.getSession()

          if (session?.user) {
            setStatus("success")
            setMessage("Already signed in! Redirecting...")

            // Lazy-load email sender to avoid SSR issues
            try {
              const { sendWelcomeEmail } = await import("@/lib/email-service")
              const user = session.user
              const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "there"
              await sendWelcomeEmail(user.email!, name, `${window.location.origin}/dashboard`)
            } catch (emailErr) {
              console.warn("[AuthCallback] Welcome email failed (non-critical):", emailErr)
            }

            setTimeout(() => router.push("/dashboard"), 1000)
            return
          }

          setStatus("error")
          setMessage("No authentication code found. Please sign in again.")
          return
        }

        // Exchange code for session
        console.log("[AuthCallback] Exchanging code for session...")
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError || !data.session) {
          console.error("[AuthCallback] Code exchange failed:", exchangeError)
          setStatus("error")
          setMessage(exchangeError?.message || "Authentication failed")
          return
        }

        setStatus("success")
        setMessage("Signed in successfully! Redirecting...")

        // Send welcome email after successful login
        try {
          const { sendWelcomeEmail } = await import("@/lib/email-service")
          const user = data.session.user
          const name = user.user_metadata?.full_name || user.email?.email?.split("@")[0] || "there"
          await sendWelcomeEmail(user.email!, name, `${window.location.origin}/dashboard`)
          console.log("[AuthCallback] Welcome email sent")
        } catch (emailErr) {
          console.warn("[AuthCallback] Failed to send welcome email:", emailErr)
        }

        // Redirect after short delay
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)

      } catch (err: any) {
        console.error("[AuthCallback] Unexpected error:", err)
        setStatus("error")
        setMessage("Something went wrong. Please try again.")
      }
    }

    handleAuthCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-3 text-xl">
            {status === "loading" && <Loader2 className="h-6 w-6 animate-spin" />}
            {status === "success" && <CheckCircle className="h-6 w-6 text-green-600" />}
            {status === "error" && <XCircle className="h-6 w-6 text-red-600" />}
            <span>
              {status === "loading" && "Signing you in..."}
              {status === "success" && "Welcome!"}
              {status === "error" && "Sign in failed"}
            </span>
          </CardTitle>
          <CardDescription className="mt-2">
            {message || "Please wait while we complete your authentication..."}
          </CardDescription>
        </CardHeader>

        {status === "error" && (
          <CardContent className="text-center pb-6">
            <Button onClick={() => router.push("/auth")} variant="default" className="w-full max-w-xs">
              Back to Sign In
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  )
}