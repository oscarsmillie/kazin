// File: app/api/webhooks/paystack/route.ts
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    // Get raw body
    const body = await request.text()
    const signature = request.headers.get("x-paystack-signature")

    // Verify Paystack signature
    const hash = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!).update(body).digest("hex")
    if (hash !== signature) {
      console.error("[Paystack Webhook] Invalid signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const event = JSON.parse(body)
    console.log("[Paystack Webhook] Event received:", event.event)

    // Initialize Supabase client (service role)
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !supabaseKey) {
      console.error("[Paystack Webhook] Supabase not configured")
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
    }
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Handle successful payment
    if (event.event === "charge.success") {
      const { data } = event
      const reference = data.reference
      const amount = data.amount / 100
      const metadata = data.metadata || {}

      console.log("[Paystack Webhook] Processing charge.success - Reference:", reference, "Metadata:", metadata)

      const userId =
        metadata.user_id ||
        metadata.userId ||
        metadata?.custom_fields?.find((f: any) => f.variable_name === "user_id")?.value

      const resumeId =
        metadata.resume_id ||
        metadata.resumeId ||
        metadata?.custom_fields?.find((f: any) => f.variable_name === "resume_id")?.value

      const isGuest = metadata.guest === true || metadata.guest === "true"

      console.log("[Paystack Webhook] Parsed - userId:", userId, "resumeId:", resumeId, "isGuest:", isGuest)

      // Update payments table
      const { error: paymentError } = await supabase
        .from("payments")
        .update({
          status: "completed",
          paystack_reference: reference,
          completed_at: new Date().toISOString(),
        })
        .eq("reference", reference)

      if (paymentError) {
        console.error("[Paystack Webhook] Failed to update payments table:", paymentError)
      }

      if (resumeId) {
        if (isGuest) {
          // Guest resume: query guest_resumes table by id only, no user_id
          const { error: guestUpdateError } = await supabase
            .from("guest_resumes")
            .update({
              payment_status: "paid",
              payment_reference: reference,
              updated_at: new Date().toISOString(),
            })
            .eq("id", resumeId)

          if (guestUpdateError) {
            console.error("[Paystack Webhook] Failed to update guest_resumes:", guestUpdateError)
          } else {
            console.log("[Paystack Webhook] Guest resume updated successfully:", resumeId)
          }
        } else {
          // Main user resume: query resumes table by id and user_id (if provided)
          let query = supabase
            .from("resumes")
            .update({
              payment_status: "paid",
              paid_at: new Date().toISOString(),
            })
            .eq("id", resumeId)

          if (userId && typeof userId === "string" && userId !== "null") {
            query = query.eq("user_id", userId)
          }

          const { error: resumeUpdateError } = await query

          if (resumeUpdateError) {
            console.error("[Paystack Webhook] Failed to update resumes:", resumeUpdateError)
          } else {
            console.log("[Paystack Webhook] User resume updated successfully:", resumeId)
          }
        }
      }

      // Handle subscriptions for main users
      const planType =
        metadata.plan_type ||
        metadata.planType ||
        metadata?.custom_fields?.find((f: any) => f.variable_name === "plan")?.value

      if (planType && userId && (planType === "professional_monthly" || planType === "professional_yearly")) {
        const isYearly = planType === "professional_yearly"
        const subscriptionData = {
          user_id: userId,
          plan_type: "professional",
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: isYearly
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          paystack_customer_code: data.customer?.customer_code || null,
          paystack_subscription_code: data.subscription?.subscription_code || null,
          amount,
          currency: data.currency || "KES",
          billing_cycle: isYearly ? "yearly" : "monthly",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        const { error: subError } = await supabase
          .from("subscriptions")
          .upsert(subscriptionData, { onConflict: "user_id" })

        if (subError) {
          console.error("[Paystack Webhook] Failed to upsert subscription:", subError)
        }

        const { error: activityError } = await supabase.from("user_activity").insert({
          user_id: userId,
          activity_type: "subscription_activated",
          description: `Professional subscription activated (${isYearly ? "Yearly" : "Monthly"})`,
          metadata: { plan_type: planType, amount, currency: data.currency || "KES", reference },
        })

        if (activityError) {
          console.error("[Paystack Webhook] Failed to insert user_activity:", activityError)
        }
      }
    }

    // Handle subscription disable
    if (event.event === "subscription.disable") {
      const { data } = event
      const subscriptionCode = data.subscription_code

      const { error: disableError } = await supabase
        .from("subscriptions")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("paystack_subscription_code", subscriptionCode)

      if (disableError) {
        console.error("[Paystack Webhook] Failed to disable subscription:", disableError)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[Paystack Webhook] Error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
