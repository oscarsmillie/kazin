import { supabase } from "@/lib/supabase"

// Check if user has professional access
export async function hasProfessionalAccess(userId: string): Promise<boolean> {
  try {
    // Check if user has an active professional subscription
    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .in("plan_type", ["professional", "yearly"])

    if (error) {
      console.error("Error checking professional access:", error)
      return false
    }

    // Return true if user has at least one active professional subscription
    return subscriptions && subscriptions.length > 0
  } catch (error) {
    console.error("Error checking professional access:", error)
    return false
  }
}

// Check usage limits for a specific feature
export async function checkUsageLimit(
  userId: string,
  featureType: string,
): Promise<{
  current: number
  limit: number
  allowed: boolean
  planType: string
}> {
  try {
    // Check if user has professional access (unlimited usage)
    const hasProAccess = await hasProfessionalAccess(userId)
    if (hasProAccess) {
      return {
        current: 0,
        limit: -1, // -1 indicates unlimited
        allowed: true,
        planType: "professional",
      }
    }

    // For free users, check usage limits
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format

    const { data: usage, error } = await supabase
      .from("user_usage")
      .select("*")
      .eq("user_id", userId)
      .eq("type", featureType)
      .eq("month", currentMonth)
      .maybeSingle()

    if (error) {
      console.error("Error checking usage limit:", error)
    }

    const currentUsage = usage?.count || 0
    const limit = getFeatureLimit(featureType)

    return {
      current: currentUsage,
      limit,
      allowed: currentUsage < limit,
      planType: "free",
    }
  } catch (error) {
    console.error("Error checking usage limit:", error)
    return {
      current: 0,
      limit: 0,
      allowed: false,
      planType: "free",
    }
  }
}

// Increment usage for a feature
export async function incrementUsage(userId: string, featureType: string): Promise<boolean> {
  try {
    // Don't track usage for professional users
    const hasProAccess = await hasProfessionalAccess(userId)
    if (hasProAccess) {
      return true
    }

    const currentMonth = new Date().toISOString().slice(0, 7)

    // Check current usage
    const { data: existingUsage } = await supabase
      .from("user_usage")
      .select("*")
      .eq("user_id", userId)
      .eq("type", featureType)
      .eq("month", currentMonth)
      .maybeSingle()

    if (existingUsage) {
      // Update existing record
      const { error } = await supabase
        .from("user_usage")
        .update({ count: existingUsage.count + 1 })
        .eq("id", existingUsage.id)

      if (error) {
        console.error("Error updating usage:", error)
        return false
      }
    } else {
      // Insert new record
      const { error } = await supabase.from("user_usage").insert({
        user_id: userId,
        type: featureType,
        month: currentMonth,
        count: 1,
      })

      if (error) {
        console.error("Error inserting usage:", error)
        return false
      }
    }

    return true
  } catch (error) {
    console.error("Error incrementing usage:", error)
    return false
  }
}

// Get feature limits for free users
function getFeatureLimit(featureType: string): number {
  const limits: Record<string, number> = {
    resumes: 3,
    cover_letters: 10,
    emails: 10,
    job_applications: 10,
    resume_downloads: 0,
    extra_resume_downloads: -1, // Professional users can purchase unlimited extra resumes
  }

  return limits[featureType] || 0
}

// Get user subscription
export async function getUserSubscription(userId: string) {
  try {
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle()

    if (error) {
      console.error("Error getting user subscription:", error)
      return null
    }

    return subscription
  } catch (error) {
    console.error("Error getting user subscription:", error)
    return null
  }
}

// Check template access
export async function getTemplateAccess(userId: string): Promise<"basic" | "premium"> {
  try {
    // Check if user has professional access
    const hasProAccess = await hasProfessionalAccess(userId)

    return hasProAccess ? "premium" : "basic"
  } catch (error) {
    console.error("Error checking template access:", error)
    return "basic"
  }
}

// Check if user can access a specific template
export async function canAccessTemplate(userId: string, templateId: string): Promise<boolean> {
  try {
    // Check if user has professional access for premium templates
    const hasProAccess = await hasProfessionalAccess(userId)

    const { data: template, error } = await supabase
      .from("resume_templates")
      .select("is_premium")
      .eq("id", templateId)
      .maybeSingle()

    if (error) {
      console.error("Error checking template:", error)
      return false
    }

    // If template is premium, user needs professional access
    if (template?.is_premium) {
      return hasProAccess
    }

    // Free templates are available to everyone
    return true
  } catch (error) {
    console.error("Error checking template access:", error)
    return false
  }
}

// Check if user can download resumes
export async function canDownloadResume(userId: string): Promise<boolean> {
  try {
    // Only professional users can download resumes for free
    return await hasProfessionalAccess(userId)
  } catch (error) {
    console.error("Error checking download access:", error)
    return false
  }
}

// Check if professional user can purchase extra resume
export async function canPurchaseExtraResume(userId: string): Promise<boolean> {
  try {
    const hasProAccess = await hasProfessionalAccess(userId)
    return hasProAccess // Professional users can always purchase extra resumes
  } catch (error) {
    console.error("Error checking extra resume purchase access:", error)
    return false
  }
}
