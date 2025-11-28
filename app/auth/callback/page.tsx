"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { sendWelcomeEmail } from "@/lib/email-service"

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

        console.log("[v0] Auth callback - Code:", code ? "present" : "missing", "Error:", error)

        if (error) {
          console.error("[v0] OAuth error:", errorDescription)
          setStatus("error")
          setMessage(errorDescription || error || "Authentication failed. Please try again.")
          return
        }

        if (!code) {
          // Check if user is already authenticated
          const {
            data: { session },
          } = await supabase.auth.getSession()

          if (session) {
            console.log("[v0] User already authenticated")
            setStatus("success")
            setMessage("Already authenticated! Redirecting...")
            
            try {
              const user = session.user
              if (user.email && user.user_metadata?.full_name) {
                await sendWelcomeEmail(
                  user.email,
                  user.user_metadata.full_name,
                  `${window.location.origin}/dashboard`
                )
              }
            } catch (emailError) {
              console.warn("[v0] Welcome email failed:", emailError)
            }
            
            setTimeout(() => {
              router.push("/dashboard")
            }, 1000)
          } else {
            setStatus("error")
            setMessage("No authentication code provided. Please try signing in again.")
          }
          return
        }

        console.log("[v0] Exchanging code for session...")
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          console.error("[v0] Code exchange error:", exchangeError)
          setStatus("error")
          setMessage(exchangeError.message || "Failed to exchange authentication code")
          return
        }

        if (data.session) {
          console.log("[v0] Session established")
          setStatus("success")
          setMessage("Authentication successful! Redirecting...")

          try {
            const user = data.session.user
            if (user.email && (user.user_metadata?.full_name || user.email)) {
              await sendWelcomeEmail(
                user.email,
                user.user_metadata?.full_name || user.email.split("@")[0],
                `${window.location.origin}/dashboard`
              )
              console.log("[v0] Welcome email sent for social login")
            }
          } catch (emailError) {
            console.warn("[v0] Welcome email failed (non-critical):", emailError)
          }

          // Wait a moment then redirect
          setTimeout(() => {
            router.push("/dashboard")
          }, 2000)
        }
      } catch (error) {
        console.error("[v0] Auth callback error:", error)
        setStatus("error")
        setMessage(error instanceof Error ? error.message : "An unexpected error occurred")
      }
    }

    handleAuthCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === "loading" && <Loader2 className="h-5 w-5 animate-spin" />}
            {status === "success" && <CheckCircle className="h-5 w-5 text-green-500" />}
            {status === "error" && <XCircle className="h-5 w-5 text-red-500" />}

            {status === "loading" && "Processing..."}
            {status === "success" && "Success!"}
            {status === "error" && "Authentication Failed"}
          </CardTitle>
          <CardDescription>{message || "Please wait while we process your authentication..."}</CardDescription>
        </CardHeader>

        {status === "error" && (
          <CardContent className="text-center">
            <Button onClick={() => router.push("/auth")} className="w-full">
              Try Again
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
