import { supabase, supabaseAdmin } from "./supabase"

export const PLAN_LIMITS = {
  free: {
    cover_letters: 10,
    emails: 10,
    resumes: -1, // Unlimited resumes, free users pay per download
    job_applications: 10,
    interview_sessions: 1,
    career_coaching: 1,
  },
  professional: {
    cover_letters: -1,
    emails: -1,
    resumes: 3, // 3 free downloads per month, after that pay per download
    job_applications: -1,
    interview_sessions: -1,
    career_coaching: -1,
  },
}

export interface UsageData {
  resumes_downloaded?: number
  cover_letters_generated?: number
  emails_generated?: number
  job_applications?: number
  interview_sessions?: number
  month_year?: string
  created_at?: string
  updated_at?: string
}

type FeatureKey = "cover_letters" | "emails" | "resumes" | "job_applications" | "interview_sessions" | "career_coaching"

export const getCurrentUsage = async (userId: string): Promise<UsageData | null> => {
  if (!userId) return null

  try {
    const currentMonth = new Date().toISOString().slice(0, 7)

    const { data: usage, error } = await supabase
      .from("usage_tracking")
      .select("*")
      .eq("user_id", userId)
      .eq("month_year", currentMonth)
      .maybeSingle()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching usage:", error)
      return null
    }

    return (
      usage || {
        resumes_downloaded: 0,
        cover_letters_generated: 0,
        emails_generated: 0,
        job_applications: 0,
        interview_sessions: 0,
      }
    )
  } catch (error) {
    console.error("Error in getCurrentUsage:", error)
    return null
  }
}

export const getUserSubscription = async (userId: string) => {
  if (!userId) return { plan_type: "free", is_active: true }

  try {
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error("Error fetching subscription:", error)
      return { plan_type: "free", is_active: true }
    }

    if (!subscription) {
      return { plan_type: "free", is_active: true }
    }

    const now = new Date()
    const expiresAt = subscription.expires_at ? new Date(subscription.expires_at) : null
    const isActive = subscription.is_active && (!expiresAt || expiresAt > now)

    return {
      ...subscription,
      is_active: isActive,
      plan_type: isActive ? subscription.plan_type : "free",
    }
  } catch (error) {
    console.error("Error in getUserSubscription:", error)
    return { plan_type: "free", is_active: true }
  }
}

export const hasProfessionalAccess = async (userId: string): Promise<boolean> => {
  try {
    const subscription = await getUserSubscription(userId)
    return subscription?.plan_type === "professional" && subscription?.is_active === true
  } catch (error) {
    console.error("Error checking professional access:", error)
    return false
  }
}

export const checkUsageLimit = async (
  userId: string,
  feature: FeatureKey,
): Promise<{
  allowed: boolean
  current: number
  limit: number
  planType: string
}> => {
  if (!userId) {
    return { allowed: false, current: 0, limit: 0, planType: "free" }
  }

  const usage = await getCurrentUsage(userId)
  const subscription = await getUserSubscription(userId)
  const planType = subscription?.plan_type || "free"
  const limits = PLAN_LIMITS[planType as keyof typeof PLAN_LIMITS]
  const limit = limits[feature] as number

  if (!usage) {
    return { allowed: false, current: 0, limit, planType }
  }

  const current =
    {
      cover_letters: usage.cover_letters_generated ?? 0,
      emails: usage.emails_generated ?? 0,
      resumes: usage.resumes_downloaded ?? 0,
      job_applications: usage.job_applications ?? 0,
      interview_sessions: usage.interview_sessions ?? 0,
      career_coaching: 0,
    }[feature] || 0

  if (limit === -1) {
    return { allowed: true, current, limit, planType }
  }

  return {
    allowed: current < limit,
    current,
    limit,
    planType,
  }
}

export const incrementUsage = async (userId: string, feature: FeatureKey): Promise<boolean> => {
  if (!userId) return false

  try {
    const currentMonth = new Date().toISOString().slice(0, 7)
    const fieldMap: Record<FeatureKey, string> = {
      cover_letters: "cover_letters_generated",
      emails: "emails_generated",
      resumes: "resumes_downloaded",
      job_applications: "job_applications",
      interview_sessions: "interview_sessions",
      career_coaching: "career_coaching",
    }

    const updateField = fieldMap[feature]

    const { data: existing, error: selectError } = await supabaseAdmin
      .from("usage_tracking")
      .select("id, " + updateField)
      .eq("user_id", userId)
      .eq("month_year", currentMonth)
      .maybeSingle()

    if (selectError && selectError.code !== "PGRST116") {
      console.error("[v0] incrementUsage – select error:", selectError)
      return false
    }

    if (existing) {
      const newValue = ((existing as any)[updateField] || 0) + 1
      const { error: updateError } = await supabaseAdmin
        .from("usage_tracking")
        .update({ [updateField]: newValue, updated_at: new Date().toISOString() })
        .eq("id", existing.id)

      if (updateError) {
        console.error("[v0] incrementUsage – update error:", updateError)
        return false
      }
      return true
    }

    const initialData: any = {
      user_id: userId,
      month_year: currentMonth,
      resumes_downloaded: 0,
      cover_letters_generated: 0,
      emails_generated: 0,
      job_applications: 0,
      interview_sessions: 0,
      career_coaching: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    initialData[updateField] = 1
    const { error: insertError } = await supabaseAdmin.from("usage_tracking").insert(initialData)

    if (insertError && insertError.code !== "23505") {
      console.error("[v0] incrementUsage – insert error:", insertError)
      return false
    }

    return true
  } catch (err) {
    console.error("[v0] incrementUsage – unexpected error:", err)
    return false
  }
}

// Helper for your download page
export const incrementUserDownloads = async (userId: string) => {
  return incrementUsage(userId, "resumes")
}

export const canDownloadProfessional = async (userId: string): Promise<boolean> => {
  const usage = await getCurrentUsage(userId)
  const sub = await getUserSubscription(userId)
  const limits = PLAN_LIMITS

  if (sub?.plan_type !== "professional" || !sub?.is_active) return false

  if (sub.current_period_start) {
    const periodStart = new Date(sub.current_period_start)
    const periodEnd = new Date(sub.current_period_end || new Date().toISOString())
    const now = new Date()

    if (now > periodEnd) {
      console.log("[v0] Professional subscription period expired")
      return false
    }
  }

  const downloads = usage?.resumes_downloaded ?? 0
  if (downloads >= limits.professional.resumes) {
    console.log("[v0] Professional user exceeded 3 monthly downloads - no more allowed")
    return false
  }

  return true
}

export const getProfessionalRemainingDownloads = async (userId: string): Promise<number> => {
  const usage = await getCurrentUsage(userId)
  const sub = await getUserSubscription(userId)
  const limits = PLAN_LIMITS

  if (sub?.plan_type !== "professional" || !sub?.is_active) return 0

  const downloads = usage?.resumes_downloaded ?? 0
  const remaining = Math.max(0, limits.professional.resumes - downloads)
  return remaining
}

export const trackResumeDownload = async (userId: string): Promise<boolean> => {
  if (!userId) return false

  try {
    const sub = await getUserSubscription(userId)
    const isExtraDownload = sub?.plan_type !== "professional"

    // Increment usage
    const result = await incrementUsage(userId, "resumes")

    // Log activity for dashboard
    await supabaseAdmin.from("user_activity").insert({
      user_id: userId,
      activity_type: sub?.plan_type === "professional" ? "resume_download_free" : "resume_download_paid",
      description:
        sub?.plan_type === "professional"
          ? "Downloaded a resume (included in subscription)"
          : "Downloaded a resume (paid)",
      metadata: {
        feature: "resume",
        action: "download",
        type: sub?.plan_type === "professional" ? "free_included" : "paid",
      },
      created_at: new Date().toISOString(),
    })

    return result
  } catch (error) {
    console.error("Error tracking resume download:", error)
    return false
  }
}

export const enforceUsageLimit = async (
  userId: string,
  feature: FeatureKey,
): Promise<{ canProceed: boolean; message: string }> => {
  try {
    const check = await checkUsageLimit(userId, feature)

    if (!check.allowed && check.limit !== -1) {
      // Log failed attempt
      await supabaseAdmin.from("user_activity").insert({
        user_id: userId,
        activity_type: "limit_reached",
        description: `Usage limit reached for ${feature}`,
        metadata: { feature, current: check.current, limit: check.limit },
        created_at: new Date().toISOString(),
      })

      return {
        canProceed: false,
        message: `You've reached your ${feature.replace("_", " ")} limit (${check.current}/${check.limit}). Upgrade to Professional for more.`,
      }
    }

    return {
      canProceed: true,
      message: "Allowed to proceed",
    }
  } catch (error) {
    console.error("Error enforcing limit:", error)
    return {
      canProceed: false,
      message: "Error checking usage limits",
    }
  }
}

// Alias for backward compatibility — same as getCurrentUsage
export const getUserUsage = getCurrentUsage
