import { supabase } from "./supabase"

export interface DashboardStats {
  resumes: number
  coverLetters: number
  applications: number
  interviews: number
  emails: number
}

export interface UserActivity {
  id: string
  activity_type: string
  description: string
  created_at: string
  metadata?: any
}

export interface CommunityPost {
  id: string
  title: string
  content: string
  post_type: string
  is_pinned: boolean
  created_at: string
}

export const fetchUserStats = async (userId: string): Promise<DashboardStats> => {
  const defaultStats: DashboardStats = {
    resumes: 0,
    coverLetters: 0,
    applications: 0,
    interviews: 0,
    emails: 0,
  }

  if (!userId) return defaultStats

  try {
    // Use Promise.allSettled to handle individual failures gracefully
    const [resumesResult, coverLettersResult, applicationsResult, interviewsResult, emailsResult] =
      await Promise.allSettled([
        supabase.from("resumes").select("id", { count: "exact" }).eq("user_id", userId),
        supabase.from("cover_letters").select("id", { count: "exact" }).eq("user_id", userId),
        supabase.from("job_applications").select("id", { count: "exact" }).eq("user_id", userId),
        supabase.from("interview_sessions").select("id", { count: "exact" }).eq("user_id", userId),
        supabase.from("emails").select("id", { count: "exact" }).eq("user_id", userId),
      ])

    // Process results with fallbacks
    if (resumesResult.status === "fulfilled" && !resumesResult.value.error) {
      defaultStats.resumes = resumesResult.value.count || 0
    }

    if (coverLettersResult.status === "fulfilled" && !coverLettersResult.value.error) {
      defaultStats.coverLetters = coverLettersResult.value.count || 0
    }

    if (applicationsResult.status === "fulfilled" && !applicationsResult.value.error) {
      defaultStats.applications = applicationsResult.value.count || 0
    }

    if (interviewsResult.status === "fulfilled" && !interviewsResult.value.error) {
      defaultStats.interviews = interviewsResult.value.count || 0
    }

    if (emailsResult.status === "fulfilled" && !emailsResult.value.error) {
      defaultStats.emails = emailsResult.value.count || 0
    }

    return defaultStats
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return defaultStats
  }
}

export const fetchRecentActivity = async (userId: string, limit = 10): Promise<UserActivity[]> => {
  if (!userId) return []

  try {
    const { data, error } = await supabase
      .from("user_activity")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.warn("Error fetching activity:", error.message)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching recent activity:", error)
    return []
  }
}

export const fetchCommunityPosts = async (limit = 5): Promise<CommunityPost[]> => {
  try {
    const { data, error } = await supabase
      .from("community_posts")
      .select("*")
      .eq("is_active", true)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.warn("Error fetching community posts:", error.message)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error fetching community posts:", error)
    return []
  }
}

export const logUserActivity = async (
  userId: string,
  activityType: string,
  description: string,
  metadata: any = {},
): Promise<boolean> => {
  if (!userId) return false

  try {
    const { error } = await supabase.from("user_activity").insert({
      user_id: userId,
      activity_type: activityType,
      description,
      metadata,
    })

    if (error) {
      console.error("Error logging activity:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error logging user activity:", error)
    return false
  }
}
