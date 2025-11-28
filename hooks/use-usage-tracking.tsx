"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

interface UsageData {
  resume_generation: number
  cover_letter_generation: number
  email_generation: number
  job_applications: number
  interview_prep: number
  career_coaching: number
}

interface SubscriptionLimits {
  resume_generation: number
  cover_letter_generation: number
  email_generation: number
  job_applications: number
  interview_prep: number
  career_coaching: number
}

interface Subscription {
  plan_type: "free" | "professional"
  plan_name: string
  limits: SubscriptionLimits
  is_active: boolean
  isPro: boolean
}

interface UseUsageTrackingReturn {
  usage: UsageData | null
  subscription: Subscription | null
  loading: boolean
  error: string | null
  canUseFeature: (feature: keyof UsageData) => boolean
  trackUsage: (feature: keyof UsageData) => Promise<void>
  refreshUsage: () => Promise<void>
}

const DEFAULT_FREE_LIMITS: SubscriptionLimits = {
  resume_generation: 0, // Pay per download (KSh 99)
  cover_letter_generation: 10, // Changed from 20 to 10
  email_generation: 10, // Changed from 20 to 10
  job_applications: 10, // Changed from 30 to 10
  interview_prep: 1,
  career_coaching: 1,
}

const DEFAULT_PROFESSIONAL_LIMITS: SubscriptionLimits = {
  resume_generation: 3, // Changed from 2 to 3 free downloads per month
  cover_letter_generation: -1, // Unlimited
  email_generation: -1, // Unlimited
  job_applications: -1, // Unlimited
  interview_prep: -1, // Unlimited
  career_coaching: -1, // Unlimited
}

export function useUsageTracking(): UseUsageTrackingReturn {
  const { user } = useAuth()
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsageData = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      const currentMonth = new Date().toISOString().slice(0, 7)

      const { data: usageData, error: usageError } = await supabase
        .from("usage_tracking")
        .select("*")
        .eq("user_id", user.id)
        .eq("month_year", currentMonth)
        .single()

      if (usageError && usageError.code !== "PGRST116") {
        throw usageError
      }

      const { data: subData, error: subError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single()

      if (subError && subError.code !== "PGRST116") {
        // Don't throw here, just use free plan defaults
      }

      const currentUsage: UsageData = {
        resume_generation: usageData?.resumes_downloaded || 0,
        cover_letter_generation: usageData?.cover_letters_generated || 0,
        email_generation: usageData?.emails_generated || 0,
        job_applications: usageData?.job_applications || 0,
        interview_prep: usageData?.interview_sessions || 0,
        career_coaching: 0,
      }

      const isPro = subData?.plan_type === "professional" && subData?.status === "active"

      const currentSubscription: Subscription = {
        plan_type: isPro ? "professional" : "free",
        plan_name: isPro ? "Professional" : "Free",
        limits: isPro ? DEFAULT_PROFESSIONAL_LIMITS : DEFAULT_FREE_LIMITS,
        is_active: isPro,
        isPro: isPro,
      }

      setUsage(currentUsage)
      setSubscription(currentSubscription)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch usage data")
    } finally {
      setLoading(false)
    }
  }

  const canUseFeature = (feature: keyof UsageData): boolean => {
    if (!usage || !subscription) {
      return false
    }

    if (subscription.isPro) {
      const limit = subscription.limits[feature] || 0
      if (limit === -1) {
        return true
      }
    }

    const currentUsage = usage[feature] || 0
    const limit = subscription.limits[feature] || 0

    if (limit === -1) {
      return true
    }

    return currentUsage < limit
  }

  const trackUsage = async (feature: keyof UsageData): Promise<void> => {
    if (!user?.id) {
      throw new Error("User not authenticated")
    }

    try {
      const currentMonth = new Date().toISOString().slice(0, 7)

      const fieldMap: Record<keyof UsageData, string> = {
        resume_generation: "resumes_downloaded",
        cover_letter_generation: "cover_letters_generated",
        email_generation: "emails_generated",
        job_applications: "job_applications",
        interview_prep: "interview_sessions",
        career_coaching: "career_coaching",
      }

      const dbField = fieldMap[feature]

      const { error } = await supabase.from("usage_tracking").upsert(
        {
          user_id: user.id,
          month_year: currentMonth,
          [dbField]: (usage?.[feature] || 0) + 1,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,month_year",
        },
      )

      if (error) {
        throw error
      }

      setUsage((prev) => ({
        ...prev!,
        [feature]: (prev?.[feature] || 0) + 1,
      }))
    } catch (err) {
      throw err
    }
  }

  const refreshUsage = async (): Promise<void> => {
    setLoading(true)
    await fetchUsageData()
  }

  useEffect(() => {
    if (user) {
      fetchUsageData()
    } else {
      setUsage(null)
      setSubscription(null)
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user?.id) {
      return
    }

    const channel = supabase
      .channel(`usage_tracking:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "usage_tracking",
          filter: `user_id=eq.${user.id}`, // Only listen to current user's changes
        },
        (payload) => {
          console.log("[v0] Usage updated for current user, refreshing...")
          fetchUsageData()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  return {
    usage,
    subscription,
    loading,
    error,
    canUseFeature,
    trackUsage,
    refreshUsage,
  }
}
