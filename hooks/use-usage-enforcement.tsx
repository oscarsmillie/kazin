"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "@/contexts/auth-context"

interface UsageData {
  emails_generated: number
  cover_letters_generated: number
  resumes_created: number
  ats_checks_used: number
  subscription_type: string
}

interface UsageLimits {
  emails: number
  coverLetters: number
  resumes: number
  atsChecks: number
}

const FREE_LIMITS: UsageLimits = {
  emails: 10, // Changed from 20 to 10
  coverLetters: 10, // Changed from 20 to 10
  resumes: 0, // Free users pay per download
  atsChecks: 10, // Changed from 30 to 10 - Job applications tracking
}

const PRO_LIMITS: UsageLimits = {
  emails: -1, // Unlimited
  coverLetters: -1, // Unlimited
  resumes: 3, // Changed from 2 to 3 free downloads per month
  atsChecks: -1, // Unlimited job applications
}

export function useUsageEnforcement() {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (user) {
      fetchUsage()
    }
  }, [user])

  const fetchUsage = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("user_usage").select("*").eq("user_id", user?.id).single()

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching usage:", error)
        return
      }

      if (data) {
        setUsage(data)
      } else {
        // Create initial usage record
        const { data: newUsage, error: createError } = await supabase
          .from("user_usage")
          .insert({
            user_id: user?.id,
            emails_generated: 0,
            cover_letters_generated: 0,
            resumes_created: 0,
            ats_checks_used: 0,
            subscription_type: "free",
          })
          .select()
          .single()

        if (createError) {
          console.error("Error creating usage record:", createError)
        } else {
          setUsage(newUsage)
        }
      }
    } catch (error) {
      console.error("Error in fetchUsage:", error)
    } finally {
      setLoading(false)
    }
  }

  const getLimits = (subscriptionType: string): UsageLimits => {
    return subscriptionType === "professional" ? PRO_LIMITS : FREE_LIMITS
  }

  const checkUsage = async (
    type: "email" | "coverLetter" | "resume" | "atsCheck",
  ): Promise<{ allowed: boolean; message?: string }> => {
    if (!usage) {
      return { allowed: false, message: "Unable to check usage limits" }
    }

    const limits = getLimits(usage.subscription_type)

    switch (type) {
      case "email":
        if (limits.emails !== -1 && usage.emails_generated >= limits.emails) {
          return {
            allowed: false,
            message: `You've reached your email generation limit (${limits.emails}). Upgrade to Professional for more.`,
          }
        }
        break
      case "coverLetter":
        if (limits.coverLetters !== -1 && usage.cover_letters_generated >= limits.coverLetters) {
          return {
            allowed: false,
            message: `You've reached your cover letter limit (${limits.coverLetters}). Upgrade to Professional for more.`,
          }
        }
        break
      case "resume":
        if (limits.resumes !== -1 && usage.resumes_created >= limits.resumes) {
          return {
            allowed: false,
            message: `You've reached your resume limit (${limits.resumes}). Upgrade to Professional for more.`,
          }
        }
        break
      case "atsCheck":
        if (limits.atsChecks !== -1 && usage.ats_checks_used >= limits.atsChecks) {
          return {
            allowed: false,
            message: `You've reached your ATS check limit (${limits.atsChecks}). Upgrade to Professional for more.`,
          }
        }
        break
    }

    return { allowed: true }
  }

  const incrementUsage = async (type: "email" | "coverLetter" | "resume" | "atsCheck") => {
    if (!usage || !user) return

    const updateField = {
      email: "emails_generated",
      coverLetter: "cover_letters_generated",
      resume: "resumes_created",
      atsCheck: "ats_checks_used",
    }[type]

    try {
      const { error } = await supabase
        .from("user_usage")
        .update({ [updateField]: (usage[updateField as keyof UsageData] as number) + 1 })
        .eq("user_id", user.id)

      if (error) {
        console.error("Error updating usage:", error)
      } else {
        // Refresh usage data
        await fetchUsage()
      }
    } catch (error) {
      console.error("Error incrementing usage:", error)
    }
  }

  const getUsagePercentage = (type: "email" | "coverLetter" | "resume" | "atsCheck"): number => {
    if (!usage) return 0

    const limits = getLimits(usage.subscription_type)

    switch (type) {
      case "email":
        return limits.emails !== -1 ? (usage.emails_generated / limits.emails) * 100 : 0
      case "coverLetter":
        return limits.coverLetters !== -1 ? (usage.cover_letters_generated / limits.coverLetters) * 100 : 0
      case "resume":
        return limits.resumes !== -1 ? (usage.resumes_created / limits.resumes) * 100 : 0
      case "atsCheck":
        return limits.atsChecks !== -1 ? (usage.ats_checks_used / limits.atsChecks) * 100 : 0
      default:
        return 0
    }
  }

  const getRemainingUsage = (type: "email" | "coverLetter" | "resume" | "atsCheck"): number => {
    if (!usage) return 0

    const limits = getLimits(usage.subscription_type)

    switch (type) {
      case "email":
        return limits.emails !== -1 ? Math.max(0, limits.emails - usage.emails_generated) : 0
      case "coverLetter":
        return limits.coverLetters !== -1 ? Math.max(0, limits.coverLetters - usage.cover_letters_generated) : 0
      case "resume":
        return limits.resumes !== -1 ? Math.max(0, limits.resumes - usage.resumes_created) : 0
      case "atsCheck":
        return limits.atsChecks !== -1 ? Math.max(0, limits.atsChecks - usage.ats_checks_used) : 0
      default:
        return 0
    }
  }

  return {
    usage,
    loading,
    checkUsage,
    incrementUsage,
    getUsagePercentage,
    getRemainingUsage,
    refreshUsage: fetchUsage,
    isProfessional: usage?.subscription_type === "professional",
  }
}
