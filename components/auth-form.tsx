"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Eye, EyeOff, Loader2, AlertCircle, ArrowLeft } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"
import { toast } from "sonner"

export function AuthForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number>(0)
  const [supabaseReady, setSupabaseReady] = useState(true)
  const isSubmittingRef = useRef(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
  })
  const [verifying, setVerifying] = useState(false)
  const [verificationCode, setVerificationCode] = useState("")

  useEffect(() => {
    const configured = isSupabaseConfigured()
    setSupabaseReady(configured)
    if (!configured) {
      console.warn("[v0] Supabase is not configured - authentication will be unavailable")
    }
  }, [])

  useEffect(() => {
    if (rateLimitCountdown <= 0) return
    const timer = setInterval(() => {
      setRateLimitCountdown((prev) => Math.max(prev - 5, 0))
    }, 5000) // Changed from 1000ms to 5000ms
    return () => clearInterval(timer)
  }, [rateLimitCountdown])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmittingRef.current || loading) {
      console.log("[v0] Sign in already in progress, ignoring duplicate request")
      return
    }

    isSubmittingRef.current = true
    setLoading(true)

    try {
      if (!supabaseReady) {
        throw new Error("Authentication service is not configured. Please try again later or contact support.")
      }

      console.log("[v0] Sign in attempt:", { email: formData.email })

      if (!supabase.auth) {
        throw new Error("Authentication service is unavailable. Please try again later.")
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        if (error.message?.includes("Invalid login credentials")) {
          throw new Error("Email or password is incorrect. Please check and try again.")
        }
        if (error.message?.includes("Email not confirmed")) {
          throw new Error("Please verify your email address before signing in.")
        }
        if (error.message?.includes("too many")) {
          throw new Error("Too many login attempts. Please wait 15 minutes before trying again.")
        }
        throw error
      }

      if (data.user) {
        console.log("[v0] Sign in successful:", { userId: data.user.id, email: data.user.email })
        toast.success("Successfully signed in!")
        router.push("/dashboard")
      }
    } catch (error: any) {
      console.error("[v0] Sign in error:", { message: error.message, code: error.code })
      const errorMessage = error.message || "Failed to sign in. Please try again."
      toast.error(errorMessage)
    } finally {
      setLoading(false)
      isSubmittingRef.current = false
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmittingRef.current || loading) return

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long")
      return
    }

    isSubmittingRef.current = true
    setLoading(true)

    try {
      if (!supabaseReady) {
        throw new Error("Authentication service is not configured.")
      }

      console.log("[v0] Starting custom signup flow for:", formData.email)

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Signup failed")
      }

      toast.success("Verification code sent! Please check your email.")
      setVerifying(true)
    } catch (error: any) {
      console.error("[v0] Sign up error:", error)
      toast.error(error.message || "Failed to create account.")
    } finally {
      setLoading(false)
      isSubmittingRef.current = false
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()

    if (loading) return
    setLoading(true)

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          code: verificationCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Verification failed")
      }

      toast.success("Account verified successfully! Logging you in...")

      // Auto-login
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (loginError) {
        toast.error("Verification successful, but auto-login failed. Please sign in.")
        setVerifying(false)
        window.location.reload()
      } else {
        router.push("/dashboard")
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (loading) return
    setLoading(true)
    try {
      const response = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      })

      if (!response.ok) throw new Error("Failed to resend code")

      toast.success("New code sent to your email")
    } catch (error) {
      toast.error("Failed to resend code. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (loading) return
    setLoading(true)
    try {
      if (!supabaseReady) {
        throw new Error("Authentication service is not configured.")
      }

      console.log("[v0] Starting Google Sign In")
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      // Note: No need to stop loading or show success here as the user will be redirected
    } catch (error: any) {
      console.error("[v0] Google Sign In error:", error)
      toast.error(error.message || "Failed to sign in with Google")
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-yellow-50 to-red-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <CardTitle className="text-xl">Check your email</CardTitle>
            <CardDescription>
              We've sent a 6-digit verification code to{" "}
              <span className="font-medium text-foreground">{formData.email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || verificationCode.length !== 6}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Verify Email
              </Button>
              <div className="flex justify-between mt-4 text-sm">
                <button
                  type="button"
                  onClick={() => setVerifying(false)}
                  className="text-muted-foreground hover:text-foreground flex items-center"
                >
                  <ArrowLeft className="w-3 h-3 mr-1" /> Back
                </button>
                <button type="button" onClick={handleResendCode} className="text-green-600 hover:underline font-medium">
                  Resend Code
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-yellow-50 to-red-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-green-600 to-red-600 rounded-lg flex items-center justify-center mb-4">
            <span className="text-white font-bold text-xl">K</span>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to KaziNest</CardTitle>
          <CardDescription>Your AI-powered career companion</CardDescription>
        </CardHeader>

        <CardContent>
          {!supabaseReady && (
            <Alert className="mb-4 border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Authentication service is temporarily unavailable. Please contact support or try again later.
              </AlertDescription>
            </Alert>
          )}

          {rateLimitCountdown > 0 && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Too many signup attempts. Please wait {Math.ceil(rateLimitCountdown / 60)} minutes{" "}
                {rateLimitCountdown % 60} seconds before trying again.
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup" disabled={rateLimitCountdown > 0}>
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={!supabaseReady || loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Your password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      disabled={!supabaseReady || loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={!supabaseReady}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={!supabaseReady || loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Sign In
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    name="fullName"
                    type="text"
                    placeholder="Your full name"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    disabled={!supabaseReady || loading || rateLimitCountdown > 0}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={!supabaseReady || loading || rateLimitCountdown > 0}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      disabled={!supabaseReady || loading || rateLimitCountdown > 0}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={!supabaseReady || rateLimitCountdown > 0}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                  <Input
                    id="signup-confirm-password"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                    disabled={!supabaseReady || loading || rateLimitCountdown > 0}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={!supabaseReady || loading || rateLimitCountdown > 0}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {rateLimitCountdown > 0
                    ? `Retry Available in ${Math.ceil(rateLimitCountdown / 60)}m`
                    : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleGoogleSignIn}
              className="w-full mt-4 bg-transparent"
              disabled={!supabaseReady || loading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23s.43 3.45 1.18 4.93l3.66 2.84.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66 2.84.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading ? "Redirecting..." : "Continue with Google"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
