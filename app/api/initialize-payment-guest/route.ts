import { type NextRequest, NextResponse } from "next/server"

/**
 * Handle guest payment initialization (no auth required)
 */
export async function POST(request: NextRequest) {
  try {
    const { amount, currency, type, description, email, metadata, resumeId } = await request.json()

    // Log all incoming data for debugging
    console.log("[v0] initialize-payment-guest received:", {
      amount,
      currency,
      type,
      description,
      email,
      resumeId,
      metadata,
    })

    // Validate required fields explicitly
    const missingFields: string[] = []
    if (!amount) missingFields.push("amount")
    if (!currency) missingFields.push("currency")
    if (!resumeId) missingFields.push("resumeId")

    if (missingFields.length > 0) {
      console.error("[v0] Missing required fields for payment:", missingFields)
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      )
    }

    const paystackKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackKey) {
      console.error("[v0] PAYSTACK_SECRET_KEY not configured")
      return NextResponse.json({ error: "Payment service not configured" }, { status: 500 })
    }

    const guestEmail = email || "guest@kasinest.app"
    const amountInKobo = Math.round(amount * 100)

    // Include resumeId in callback query string for tracking
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://kazinest.vercel.app"}/payment/guest-callback?resumeId=${resumeId}`

    console.log("[v0] Guest payment callback URL:", callbackUrl)

    // Initialize Paystack payment
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${paystackKey}`,
      },
      body: JSON.stringify({
        email: guestEmail,
        amount: amountInKobo,
        currency: currency === "USD" ? "USD" : "KES",
        callback_url: callbackUrl,
        metadata: {
          type,
          description,
          is_guest: true,
          email: guestEmail,
          resume_id: resumeId,
          custom_fields: [
            {
              display_name: "Payment Type",
              variable_name: "payment_type",
              value: type,
            },
            {
              display_name: "Resume ID",
              variable_name: "resume_id",
              value: resumeId,
            },
          ],
          ...metadata,
        },
      }),
    })

    const data = await response.json()
    console.log("[v0] Paystack initialize response:", data)

    if (!response.ok) {
      console.error("[v0] Paystack error:", data)
      return NextResponse.json({ error: data.message || "Failed to initialize payment" }, { status: response.status })
    }

    console.log("[v0] Payment initialized successfully with reference:", data.data.reference)

    return NextResponse.json({
      success: true,
      data: {
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code,
        reference: data.data.reference,
      },
    })
  } catch (error) {
    console.error("[v0] Payment initialization error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment initialization failed" },
      { status: 500 },
    )
  }
}
