import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { paystack } from "@/lib/paystack"

const PLAN_CODES = {
  professional_monthly: "PLN_zmhfkl8v3yg8wo7",
  professional_yearly: "PLN_gijmahnmc72ai4r",
}

export const runtime = "nodejs" // ✅ ensures Node APIs work (not Edge)

export async function POST(request: NextRequest) {
  try {
    // ✅ Initialize Supabase here (runtime only)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase configuration missing" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { planType } = body

    if (!planType || !PLAN_CODES[planType]) {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 })
    }

    const planCode = PLAN_CODES[planType]
    const isYearly = planType.includes("yearly")
    const amount = isYearly ? 4999 : 499 // KES

    // Initialize payment with Paystack
    const paymentData = await paystack.initializeTransaction({
      email: user.email!,
      amount: amount,
      currency: "KES",
      userId: user.id,
      description: `Professional Plan Subscription - ${isYearly ? "Yearly" : "Monthly"}`,
      type: "professional_upgrade",
      callback_url: `${
        process.env.NEXT_PUBLIC_SITE_URL || "http://kazinest.vercel.app"
      }/payment/callback?type=professional_upgrade&planId=${planType}`,
      metadata: {
        user_id: user.id,
        plan_type: planType,
        type: "professional_upgrade",
        custom_fields: [
          { display_name: "User ID", variable_name: "user_id", value: user.id },
          { display_name: "Plan Type", variable_name: "plan_type", value: planType },
        ],
      },
    })

    // Log the subscription attempt
    await supabase.from("user_activity").insert({
      user_id: user.id,
      activity_type: "subscription_initiated",
      description: `Subscription initiated: Professional Plan (${isYearly ? "Yearly" : "Monthly"})`,
      metadata: {
        plan_type: planType,
        plan_code: planCode,
        amount,
        currency: "KES",
        reference: paymentData.data.reference,
      },
    })

    return NextResponse.json({
      success: true,
      data: paymentData.data,
      message: "Subscription initialized successfully",
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Subscription initialization failed",
        success: false,
      },
      { status: 500 },
    )
  }
}
