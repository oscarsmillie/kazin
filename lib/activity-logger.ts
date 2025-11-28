import { supabase, createBackendSupabaseClient } from "./supabase"

export interface ActivityLog {
  user_id: string
  activity_type: string
  description: string
  metadata?: any
}

// ✅ use admin client to bypass RLS for internal logging
const supabaseAdmin = createBackendSupabaseClient()

export const logActivity = async (activity: ActivityLog): Promise<boolean> => {
  try {
    if (!activity.user_id) {
      console.warn("⚠️ Activity log skipped: No user_id provided")
      return false
    }

    const { error } = await supabaseAdmin.from("user_activity").insert({
      user_id: activity.user_id,
      activity_type: activity.activity_type,
      description: activity.description,
      metadata: activity.metadata || {},
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("❌ Error logging activity:", error)
      return false
    }

    console.log("✅ Activity logged:", activity.activity_type)
    return true
  } catch (error) {
    console.error("💥 Failed to log activity:", error)
    return false
  }
}

// Predefined activity types
export const ACTIVITY_TYPES = {
  RESUME_CREATED: "resume_created",
  RESUME_DOWNLOADED: "resume_downloaded",
  COVER_LETTER_CREATED: "cover_letter_created",
  COVER_LETTER_DOWNLOADED: "cover_letter_downloaded",
  EMAIL_GENERATED: "email_generated",
  JOB_APPLIED: "job_applied",
  ATS_OPTIMIZATION: "ats_optimization",
  INTERVIEW_SESSION: "interview_session",
  INTERVIEW_FEEDBACK: "interview_feedback",
  PAYMENT_MADE: "payment_made",
  CAREER_GOAL_CREATED: "career_goal_created",
  CAREER_GOAL_COMPLETED: "career_goal_completed",
  CAREER_GOAL_UPDATED: "career_goal_updated",
  PROFILE_UPDATED: "profile_updated",
  SUBSCRIPTION_UPGRADED: "subscription_upgraded",
  CAREER_COACH_SESSION: "career_coach_session",
  CAREER_INSIGHTS_VIEWED: "career_insights_viewed",
} as const

// --- Helper functions using logActivity ---
export const logCareerCoachSession = (userId: string, sessionDuration: number) =>
  logActivity({
    user_id: userId,
    activity_type: ACTIVITY_TYPES.CAREER_COACH_SESSION,
    description: `Career coaching session completed (${sessionDuration} messages)`,
    metadata: { session_duration: sessionDuration },
  })

export const logCareerInsightsViewed = (userId: string, occupation: string) =>
  logActivity({
    user_id: userId,
    activity_type: ACTIVITY_TYPES.CAREER_INSIGHTS_VIEWED,
    description: `Viewed career insights for ${occupation}`,
    metadata: { occupation },
  })

export const logInterviewSession = (userId: string, profession: string, score: number) =>
  logActivity({
    user_id: userId,
    activity_type: ACTIVITY_TYPES.INTERVIEW_SESSION,
    description: `Completed mock interview for ${profession} (Score: ${score}%)`,
    metadata: { profession, score },
  })

export const logCoverLetterCreated = (userId: string, jobTitle: string) =>
  logActivity({
    user_id: userId,
    activity_type: ACTIVITY_TYPES.COVER_LETTER_CREATED,
    description: `Cover letter created for ${jobTitle}`,
    metadata: { job_title: jobTitle },
  })

export const logEmailGenerated = (userId: string, emailType: string) =>
  logActivity({
    user_id: userId,
    activity_type: ACTIVITY_TYPES.EMAIL_GENERATED,
    description: `Email generated (${emailType})`,
    metadata: { email_type: emailType },
  })
