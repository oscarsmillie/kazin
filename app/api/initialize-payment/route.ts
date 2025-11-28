// app/api/initialize-payment/route.ts

export const runtime = "nodejs";
export const dynamic = "force-dynamic";   // THIS IS THE LIFESAVER

import { type NextRequest, NextResponse } from "next/server";
import { createBackendSupabaseClient } from "@/lib/supabase";

// DO NOT IMPORT paystack at top level — IT CRASHES THE BUILD
// import { paystack } from "@/lib/paystack"  ← NEVER AGAIN

export async function POST(request: NextRequest) {
  try {
    const supabase = createBackendSupabaseClient();

    // --- Authenticate user ---
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: Missing token in header" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user?.id) {
      console.error("[v0] Auth error:", authError);
      return NextResponse.json(
        { error: "Unauthorized: Invalid or unauthenticated user" },
        { status: 401 }
      );
    }

    const authenticatedUserId = user.id;

    // --- Parse body ---
    const body = await request.json();
    let { amount, currency = "KES", type, resumeId, description, plan } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const effectivePaymentType = plan ? "professional_upgrade" : type;
    const allowedTypes = ["resume_download", "extra_resume_download", "professional_upgrade"];
    if (!allowedTypes.includes(effectivePaymentType)) {
      return NextResponse.json({ error: "Invalid payment type" }, { status: 400 });
    }

    const finalCurrency = currency.toUpperCase();
    if (!["KES", "USD"].includes(finalCurrency)) {
      return NextResponse.json({ error: "Invalid currency" }, { status: 400 });
    }

    const isPaystackPlanCode = plan?.startsWith("PLN_");

    // LAZY LOAD PAYSTACK — ONLY WHEN THE ROUTE IS CALLED
    const { paystack } = await import("@/lib/paystack");

    const metadata = {
      user_id: authenticatedUserId,
      plan: plan || "monthly",
      payment_type: effectivePaymentType,
      resume_id: resumeId || null,
      description: description || `${effectivePaymentType} payment`,
      custom_fields: [
        { display_name: "Plan", variable_name: "plan", value: plan || "monthly" },
        { display_name: "User ID", variable_name: "user_id", value: authenticatedUserId },
        { display_name: "Payment Type", variable_name: "payment_type", value: effectivePaymentType },
        ...(resumeId ? [{ display_name: "Resume ID", variable_name: "resume_id", value: resumeId }] : []),
      ],
    };

    const initializationArgs = {
      email: user.email!,
      amount,
      currency: finalCurrency,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://kazinest.vercel.app"}/payment/callback?type=${effectivePaymentType}${resumeId ? `&resumeId=${resumeId}` : ""}${plan ? `&planId=${plan}` : ""}`,
      metadata,
      ...(isPaystackPlanCode && { plan }),
    };

    const paymentData = await paystack.initializeTransaction(initializationArgs);

    // Store payment record
    await supabase.from("payments").insert({
      user_id: authenticatedUserId,
      reference: paymentData.data.reference,
      status: "pending",
      amount,
      currency: finalCurrency,
      plan: plan || null,
      description: description || effectivePaymentType,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: paymentData.data,
      message: "Payment initialized successfully",
    });
  } catch (error: any) {
    console.error("[v0] Payment initialization error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Payment initialization failed",
        success: false,
      },
      { status: 500 }
    );
  }
}