import { supabase } from "./supabase"
import { incrementUsage, checkUsageLimit } from "./subscription"

export interface UsageTrackingResult {
  success: boolean
  message: string
  current?: number
  limit?: number
  planType?: string
}

export const trackUsage = async (
  userId: string,
  feature: "cover_letters" | "emails" | "resumes" | "ats_optimizations" | "interview_sessions" | "job_applications",
  action = "generated",
): Promise<UsageTrackingResult> => {
  if (!userId) {
    console.error("[v0] ❌ No user ID provided for usage tracking")
    return { success: false, message: "User ID required" }
  }

  try {
    console.log(`[v0] 🔄 Tracking usage for user ${userId}: ${feature} ${action}`)

    const usageCheck = await checkUsageLimit(userId, feature)
    console.log(`[v0] 📊 Current usage check:`, usageCheck)

    if (!usageCheck.allowed && usageCheck.limit !== -1) {
      console.log(`[v0] ⚠️ Usage limit reached for ${feature}`)
      return {
        success: false,
        message: `You've reached your ${feature.replace("_", " ")} limit for this month`,
        current: usageCheck.current,
        limit: usageCheck.limit,
        planType: usageCheck.planType,
      }
    }

    const incrementSuccess = await incrementUsage(userId, feature)
    if (!incrementSuccess) {
      console.error(`[v0] ❌ Failed to increment usage for ${feature}`)
      return { success: false, message: "Failed to track usage increment" }
    }
    console.log(`[v0] ✅ Usage incremented for ${feature}`)

    await logUsageActivity(userId, feature, action)

    const updatedCheck = await checkUsageLimit(userId, feature)
    console.log(`[v0] 📈 Updated usage for ${feature}: ${updatedCheck.current}/${updatedCheck.limit}`)

    if (updatedCheck.current < usageCheck.current) {
      console.error(`[v0] ❌ Usage tracking verification failed - usage decreased!`)
      return { success: false, message: "Usage tracking verification failed" }
    }

    return {
      success: true,
      message: `${feature.replace("_", " ")} ${action} successfully`,
      current: updatedCheck.current,
      limit: updatedCheck.limit,
      planType: updatedCheck.planType,
    }
  } catch (error) {
    console.error(`[v0] 💥 Error tracking usage for ${feature}:`, error)
    return { success: false, message: "Failed to track usage" }
  }
}

const logUsageActivity = async (userId: string, feature: string, action: string) => {
  try {
    const { data, error } = await supabase.from("user_activity").insert({
      user_id: userId,
      activity_type: `${feature}_${action}`,
      description: `${feature.replace("_", " ")} ${action}`,
      metadata: { feature, action, timestamp: new Date().toISOString() },
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error(`[v0] ❌ Error logging usage activity:`, error)
    } else {
      console.log(`[v0] 📝 Logged activity: ${feature}_${action}`)
    }
  } catch (error) {
    console.error(`[v0] 💥 Failed to log usage activity:`, error)
  }
}

export const verifyUsageTracking = async (userId: string): Promise<boolean> => {
  if (!userId) return false

  try {
    const currentMonth = new Date().toISOString().slice(0, 7)

    const { data, error } = await supabase
      .from("usage_tracking")
      .select("*")
      .eq("user_id", userId)
      .eq("month_year", currentMonth)
      .maybeSingle()

    if (error) {
      console.error(`[v0] ❌ Error verifying usage tracking:`, error)
      return false
    }

    if (!data) {
      console.log(`[v0] ⚠️ No usage tracking record found for user ${userId} in month ${currentMonth}`)
      return false
    }

    console.log(`[v0] ✅ Usage tracking verified:`, data)
    return true
  } catch (error) {
    console.error(`[v0] 💥 Error in verifyUsageTracking:`, error)
    return false
  }
}

export const canPerformAction = async (
  userId: string,
  feature: "cover_letters" | "emails" | "resumes" | "ats_optimizations" | "interview_sessions" | "job_applications",
): Promise<{ allowed: boolean; message: string; current: number; limit: number }> => {
  const usageCheck = await checkUsageLimit(userId, feature)

  if (!usageCheck.allowed && usageCheck.limit !== -1) {
    return {
      allowed: false,
      message: `You've reached your ${feature.replace("_", " ")} limit (${usageCheck.current}/${usageCheck.limit}) for this month. Upgrade to Professional for more.`,
      current: usageCheck.current,
      limit: usageCheck.limit,
    }
  }

  return {
    allowed: true,
    message: `You can generate ${usageCheck.limit === -1 ? "unlimited" : usageCheck.limit - usageCheck.current} more ${feature.replace("_", " ")}`,
    current: usageCheck.current,
    limit: usageCheck.limit,
  }
}

export const getUsageSummary = async (userId: string) => {
  if (!userId) return null

  try {
    const features = [
      "cover_letters",
      "emails",
      "resumes",
      "ats_optimizations",
      "interview_sessions",
      "job_applications",
    ] as const

    const usagePromises = features.map(async (feature) => {
      const check = await checkUsageLimit(userId, feature)
      console.log(`[v0] 📊 ${feature} usage: ${check.current}/${check.limit}`)

      return {
        feature,
        current: check.current,
        limit: check.limit,
        percentage: check.limit === -1 ? 0 : Math.round((check.current / check.limit) * 100),
        planType: check.planType,
      }
    })

    const usage = await Promise.all(usagePromises)

    const summary = {
      usage,
      planType: usage[0]?.planType || "free",
      lastVerified: new Date().toISOString(),
    }

    console.log(`[v0] ✅ Usage summary retrieved for user ${userId}`)
    return summary
  } catch (error) {
    console.error(`[v0] Error getting usage summary:`, error)
    return null
  }
}
