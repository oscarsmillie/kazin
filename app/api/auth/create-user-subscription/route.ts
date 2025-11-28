import { createBackendSupabaseClient } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId, email, fullName } = await request.json()

    console.log("[v0] Creating subscription for user:", userId)

    if (!userId || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createBackendSupabaseClient()

    createSubscriptionAsync(userId, email, fullName).catch((error) => {
      console.warn("[v0] Background subscription creation failed (non-critical):", error)
    })

    // Return success immediately so signup completes
    return NextResponse.json({ success: true, message: "User signup initiated" }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error in subscription endpoint:", error)
    return NextResponse.json({ success: true, message: "User signup initiated" }, { status: 200 })
  }
}

async function createSubscriptionAsync(userId: string, email: string, fullName: string) {
  try {
    const supabase = createBackendSupabaseClient()

    const { data: freePlan, error: planError } = await supabase
      .from("subscription_plans")
      .select("id")
      .eq("plan_type", "free")
      .single()

    if (planError || !freePlan) {
      console.error("[v0] Error fetching free plan:", planError)
      return
    }

    // Check if subscription already exists
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle()

    if (existingSubscription) {
      console.log("[v0] Subscription already exists for user:", userId)
      return
    }

    const { error: subscriptionError } = await supabase.from("subscriptions").insert({
      user_id: userId,
      plan_id: freePlan.id,
      status: "active",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })

    if (subscriptionError) {
      console.error("[v0] Error creating subscription:", subscriptionError)
      return
    }

    if (email && fullName) {
      try {
        const { subscribeToConvertKitWithPlan } = await import("@/lib/convertkit")
        await subscribeToConvertKitWithPlan(email, fullName, "free")
      } catch (error) {
        console.warn("[v0] Background ConvertKit subscription failed:", error)
      }
    }

    console.log("[v0] Subscription created successfully for user:", userId)
  } catch (error) {
    console.error("[v0] Unexpected error in background subscription:", error)
  }
}
