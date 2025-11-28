// app/api/some-payment-route/route.ts  (or wherever this lives)

export const runtime = "nodejs";
export const dynamic = "force-dynamic";   // THIS IS THE LIFESAVER

import { NextResponse } from "next/server";

// DO NOT CREATE SUPABASE CLIENT AT TOP LEVEL — NEVER AGAIN
// const supabaseAdmin = createClient(...)  ← DEADLY

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, currency, amount, paymentType } = body;

    if (!userId || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // LAZY LOAD SUPABASE ADMIN — ONLY WHEN CALLED
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let skipDiscountCheck = false;

    try {
      const { data: user, error: userError } = await supabaseAdmin
        .from("users")
        .select("upgrade_discount_eligible, upgrade_discount_used")
        .eq("id", userId)
        .single();

      if (userError) {
        if (userError.message?.includes("column") || userError.code === "42703") {
          console.log("[v0] Discount columns don't exist, skipping eligibility check");
          skipDiscountCheck = true;
        } else {
          console.error("[v0] Error fetching user:", userError);
        }
      } else if (user && !skipDiscountCheck) {
        if (!user.upgrade_discount_eligible || user.upgrade_discount_used) {
          return NextResponse.json({ error: "Not eligible for discount" }, { status: 403 });
        }
      }
    } catch (e) {
      console.log("[v0] Error checking discount eligibility, proceeding anyway:", e);
      skipDiscountCheck = true;
    }

    // Get user email
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = authUser?.user?.email || "";

    // Convert amount for Paystack
    let paystackAmount: number;
    let paystackCurrency: string;

    if (currency === "KES") {
      paystackAmount = 250; // $2.50 in cents
      paystackCurrency = "USD";
    } else {
      paystackAmount = Math.round(amount * 100);
      paystackCurrency = "USD";
    }

    console.log("[v0] Initiating upgrade payment:", {
      userId,
      originalCurrency: currency,
      originalAmount: amount,
      paystackCurrency,
      paystackAmount,
      paymentType,
    });

    // Direct Paystack call — no top-level client needed
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
            { display_name: "User ID", variable_name: "user_id", value: userId },
            { display_name: "Payment Type", variable_name: "payment_type", value: paymentType },
            { display_name: "Original Currency", variable_name: "original_currency", value: currency },
            { display_name: "Original Amount", variable_name: "original_amount", value: String(amount) },
          ],
        },
      }),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      console.error("[v0] Paystack error:", paystackData);
      return NextResponse.json(
        { error: paystackData.message || "Payment initialization failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      authorizationUrl: paystackData.data.authorization_url,
      reference: paystackData.data.reference,
    });
  } catch (error: any) {
    console.error("[v0] Initiate payment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}