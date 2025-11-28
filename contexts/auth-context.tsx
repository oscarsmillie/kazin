"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { useRouter, usePathname } from 'next/navigation'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  refreshAuth: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const refreshAuth = useCallback(async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error("Auth refresh error:", error)
        setUser(null)
        return
      }

      setUser(session?.user ?? null)
    } catch (error) {
      console.error("Auth refresh error:", error)
      setUser(null)
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Sign out error:", error)
      }
      setUser(null)
      window.location.href = "https://kazinest.co.ke"
    } catch (error) {
      console.error("Sign out error:", error)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    let mounted = true

    const getSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          console.error("Initial session error:", error)
          setUser(null)
        } else {
          setUser(session?.user ?? null)
        }
      } catch (error) {
        if (!mounted) return
        console.error("Initial session error:", error)
        setUser(null)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log("🔐 Auth state change:", event, session?.user?.email)

      setUser(session?.user ?? null)
      setLoading(false)

      if (event === "SIGNED_IN" && session?.user) {
        if (pathname === "/auth" || pathname === "/") {
          router.push("/dashboard")
        }
      }

      if (event === "SIGNED_OUT") {
        setUser(null)
        const protectedPaths = ["/dashboard", "/profile", "/settings", "/billing", "/resumes", "/applications"]
        if (protectedPaths.some((path) => pathname.startsWith(path))) {
          router.push("/")
        }
      }

      if (event === "TOKEN_REFRESHED" && session?.user) {
        setUser(session.user)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [router, pathname, refreshAuth])

  useEffect(() => {
    if (loading) return
    
    const publicPaths = [
      "/",
      "/auth",
      "/pricing",
      "/about",
      "/guest-resume-builder",
      "/payment/guest-callback",
      "/payment/callback",
      "/payment/success",
    ]
    
    const isPublic = publicPaths.some(path => pathname.startsWith(path))

    console.log("[v0] Auth check - pathname:", pathname, "user:", user ? user.email : "none", "isPublic:", isPublic)

    // Only redirect if path is explicitly protected AND user is not authenticated
    if (!user && !isPublic) {
      console.log(`[v0] Redirecting to auth from protected path: ${pathname}`)
      router.replace("/auth")
    } else if (!user && isPublic) {
      console.log(`[v0] Allowing public access to path: ${pathname}`)
    }

  }, [user, loading, pathname, router])

  return <AuthContext.Provider value={{ user, loading, signOut, refreshAuth }}>{children}</AuthContext.Provider>
}
