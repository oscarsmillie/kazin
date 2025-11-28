import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// POST /api/admin/reset-usage - Reset all usage tracking to zero
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from cookies
    const cookieStore = await cookies()

    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {
              // Cookies can't be set on response
            }
          },
        },
      },
    )

    // Verify user is admin
    const {
      data: { user },
    } = await supabaseAdmin.auth.getUser()

    if (!user) {
      console.log("[v0] ❌ Unauthorized: No user found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin role
    const { data: adminRole } = await supabaseAdmin
      .from("user_roles")
      .select("*")
      .eq("user_id", user.id)
      .eq("role_name", "admin")
      .eq("is_active", true)
      .maybeSingle()

    if (!adminRole) {
      console.log(`[v0] ❌ Forbidden: User ${user.id} is not an admin`)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    console.log("[v0] 🔄 Starting usage tracking reset...")

    const { error: updateError } = await supabaseAdmin.rpc("reset_all_usage_tracking")

    if (updateError) {
      console.error("[v0] ❌ Error resetting usage tracking:", updateError)

      // Fallback to direct update if RPC doesn't exist
      const { error: directError } = await supabaseAdmin
        .from("usage_tracking")
        .update({
          cover_letters_generated: 0,
          emails_generated: 0,
          resumes_generated: 0,
          resumes_downloaded: 0,
          ats_optimizations_used: 0,
          interview_sessions: 0,
          job_applications: 0,
          updated_at: new Date().toISOString(),
        })
        .gt("id", "00000000-0000-0000-0000-000000000000") // Match all records

      if (directError) {
        throw directError
      }
    }

    await supabaseAdmin.from("system_logs").insert({
      log_level: "info",
      module: "usage_tracking",
      message: "All usage tracking metrics reset to zero by admin",
      metadata: {
        reset_time: new Date().toISOString(),
        admin_id: user.id,
        action: "system_reset",
      },
      user_id: user.id,
      created_at: new Date().toISOString(),
    })

    const { data: verifyData, error: verifyError } = await supabaseAdmin.from("usage_tracking").select("*").limit(5)

    if (verifyError) {
      console.error("[v0] ❌ Error verifying reset:", verifyError)
    }

    const totalUsage =
      verifyData?.reduce(
        (sum, record: any) =>
          sum +
          (record.cover_letters_generated || 0) +
          (record.emails_generated || 0) +
          (record.resumes_generated || 0) +
          (record.resumes_downloaded || 0) +
          (record.ats_optimizations_used || 0) +
          (record.interview_sessions || 0) +
          (record.job_applications || 0),
        0,
      ) || 0

    console.log(`[v0] ✅ Usage tracking reset complete. Remaining usage: ${totalUsage}`)

    return NextResponse.json({
      success: true,
      message: "All usage tracking has been reset to zero",
      verified: totalUsage === 0,
      recordsAffected: verifyData?.length || 0,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] 💥 Error in reset-usage endpoint:", error)
    return NextResponse.json({ error: "Failed to reset usage tracking", details: String(error) }, { status: 500 })
  }
}

// GET /api/admin/reset-usage - Check current usage stats
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()

    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {
              // Cookies can't be set on response
            }
          },
        },
      },
    )

    const { data: usageData, error } = await supabaseAdmin.from("usage_tracking").select("*")

    if (error) {
      console.error("[v0] ❌ Error fetching usage stats:", error)
      return NextResponse.json({ error: "Failed to fetch usage stats" }, { status: 500 })
    }

    const stats = {
      totalRecords: usageData?.length || 0,
      totalUsage:
        usageData?.reduce(
          (sum: number, record: any) =>
            sum +
            (record.cover_letters_generated || 0) +
            (record.emails_generated || 0) +
            (record.resumes_generated || 0) +
            (record.resumes_downloaded || 0) +
            (record.ats_optimizations_used || 0) +
            (record.interview_sessions || 0) +
            (record.job_applications || 0),
          0,
        ) || 0,
      breakdown: {
        coverLetters: usageData?.reduce((sum: number, r: any) => sum + (r.cover_letters_generated || 0), 0) || 0,
        emails: usageData?.reduce((sum: number, r: any) => sum + (r.emails_generated || 0), 0) || 0,
        resumesGenerated: usageData?.reduce((sum: number, r: any) => sum + (r.resumes_generated || 0), 0) || 0,
        resumesDownloaded: usageData?.reduce((sum: number, r: any) => sum + (r.resumes_downloaded || 0), 0) || 0,
        atsOptimizations: usageData?.reduce((sum: number, r: any) => sum + (r.ats_optimizations_used || 0), 0) || 0,
        interviewSessions: usageData?.reduce((sum: number, r: any) => sum + (r.interview_sessions || 0), 0) || 0,
        jobApplications: usageData?.reduce((sum: number, r: any) => sum + (r.job_applications || 0), 0) || 0,
      },
    }

    console.log(`[v0] 📊 Current usage stats:`, stats)

    return NextResponse.json({
      success: true,
      stats,
      message: "Usage tracking statistics retrieved successfully",
    })
  } catch (error) {
    console.error("[v0] 💥 Error in GET reset-usage:", error)
    return NextResponse.json({ error: "Failed to get usage stats", details: String(error) }, { status: 500 })
  }
}
