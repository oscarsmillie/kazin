export const runtime = "nodejs";
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, currency, amount, paymentType } = body

    if (!userId || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let skipDiscountCheck = false
    try {
      const { data: user, error: userError } = await supabaseAdmin
        .from("users")
        .select("upgrade_discount_eligible, upgrade_discount_used")
        .eq("id", userId)
        .single()

      if (userError) {
        // If error is about missing columns, skip the check
        if (userError.message?.includes("column") || userError.code === "42703") {
          console.log("[v0] Discount columns don't exist, skipping eligibility check")
          skipDiscountCheck = true
        } else {
          console.error("[v0] Error fetching user:", userError)
        }
      } else if (user && !skipDiscountCheck) {
        // Only check eligibility if we got user data and columns exist
        if (!user.upgrade_discount_eligible || user.upgrade_discount_used) {
          return NextResponse.json({ error: "Not eligible for discount" }, { status: 403 })
        }
      }
    } catch (e) {
      console.log("[v0] Error checking discount eligibility, proceeding anyway:", e)
      skipDiscountCheck = true
    }

    // Get user email
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId)
    const email = authUser?.user?.email || ""

    // Paystack supports: NGN, GHS, ZAR, USD
    // For KES users, we convert to USD equivalent
    let paystackAmount: number
    let paystackCurrency: string

    if (currency === "KES") {
      // KES is not supported by Paystack, so we use USD
      // KES 300 ≈ USD 2.50 (approximate exchange rate)
      // Amount in cents: $2.50 = 250 cents
      paystackAmount = 250 // $2.50 in cents
      paystackCurrency = "USD"
    } else {
      // USD: convert to cents (e.g., $2.50 = 250 cents)
      paystackAmount = Math.round(amount * 100)
      paystackCurrency = "USD"
    }

    console.log("[v0] Initiating upgrade payment:", {
      userId,
      originalCurrency: currency,
      originalAmount: amount,
      paystackCurrency,
      paystackAmount,
      paymentType,
    })

    // Initialize Paystack payment
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: paystackAmount,
        currency: paystackCurrency,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback?type=${paymentType}`,
        metadata: {
          user_id: userId,
          payment_type: paymentType,
          original_currency: currency,
          original_amount: amount,
          custom_fields: [
            {
              display_name: "User ID",
              variable_name: "user_id",
              value: userId,
            },
            {
              display_name: "Payment Type",
              variable_name: "payment_type",
              value: paymentType,
            },
            {
              display_name: "Original Currency",
              variable_name: "original_currency",
              value: currency,
            },
            {
              display_name: "Original Amount",
              variable_name: "original_amount",
              value: String(amount),
            },
          ],
        },
      }),
    })

    const paystackData = await paystackResponse.json()

    if (!paystackData.status) {
      console.error("[v0] Paystack error:", paystackData)
      return NextResponse.json({ error: paystackData.message || "Payment initialization failed" }, { status: 500 })
    }

    return NextResponse.json({
      authorizationUrl: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    })
  } catch (error) {
    console.error("[v0] Initiate payment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
