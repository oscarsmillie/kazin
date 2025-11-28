import { supabase } from "./supabase"
import { incrementUsage, checkUsageLimit } from "./subscription"

export interface UsageTrackingResult {
  success: boolean
  message: string
  current?: number
  limit?: number
  planType?: string
}

// Enhanced usage tracking with better error handling and logging
export const trackUsage = async (
  userId: string,
  feature: "cover_letters" | "emails" | "resumes" | "ats_optimizations" | "interview_sessions" | "job_applications",
  action = "generated",
): Promise<UsageTrackingResult> => {
  if (!userId) {
    console.error("❌ No user ID provided for usage tracking")
    return { success: false, message: "User ID required" }
  }

  try {
    console.log(`🔄 Tracking usage for user ${userId}: ${feature} ${action}`)

    // Check current usage limits before incrementing
    const usageCheck = await checkUsageLimit(userId, feature)
    console.log(`📊 Current usage check:`, usageCheck)

    if (!usageCheck.allowed && usageCheck.limit !== -1) {
      console.log(`⚠️ Usage limit reached for ${feature}`)
      return {
        success: false,
        message: `You've reached your ${feature.replace("_", " ")} limit for this month`,
        current: usageCheck.current,
        limit: usageCheck.limit,
        planType: usageCheck.planType,
      }
    }

    // Increment the usage
    await incrementUsage(userId, feature)
    console.log(`✅ Usage incremented for ${feature}`)

    // Log the activity
    await logUsageActivity(userId, feature, action)

    // Get updated usage stats
    const updatedCheck = await checkUsageLimit(userId, feature)

    return {
      success: true,
      message: `${feature.replace("_", " ")} ${action} successfully`,
      current: updatedCheck.current,
      limit: updatedCheck.limit,
      planType: updatedCheck.planType,
    }
  } catch (error) {
    console.error(`💥 Error tracking usage for ${feature}:`, error)
    return { success: false, message: "Failed to track usage" }
  }
}

// Log usage activity to user_activity table
const logUsageActivity = async (userId: string, feature: string, action: string) => {
  try {
    const { error } = await supabase.from("user_activity").insert({
      user_id: userId,
      activity_type: `${feature}_${action}`,
      description: `${feature.replace("_", " ")} ${action}`,
      metadata: { feature, action },
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("❌ Error logging usage activity:", error)
    } else {
      console.log(`📝 Logged activity: ${feature}_${action}`)
    }
  } catch (error) {
    console.error("💥 Failed to log usage activity:", error)
  }
}

// Helper function to check if user can perform an action
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

// Get usage summary for dashboard
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
      return {
        feature,
        current: check.current,
        limit: check.limit,
        percentage: check.limit === -1 ? 0 : Math.round((check.current / check.limit) * 100),
        planType: check.planType,
      }
    })

    const usage = await Promise.all(usagePromises)

    return {
      usage,
      planType: usage[0]?.planType || "free",
    }
  } catch (error) {
    console.error("Error getting usage summary:", error)
    return null
  }
}
