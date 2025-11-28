export const runtime = "nodejs";
export const dynamic = "force-dynamic";   // ← ADD THIS LINE (this saves you)

import { NextResponse } from "next/server";
import { trackUsage } from "@/lib/usage-tracker";
import { createClient } from "@supabase/supabase-js";

// REMOVED THIS LINE (was killing your build):
// const supabaseAdmin = createClient(...)

// Keep ALL your original functions exactly as they were
function parsePaystackMetadata(metadata: any): Record<string, any> {
  const customFields = metadata?.custom_fields || []
  const metadataMap: Record<string, any> = {}

  customFields.forEach((field: any) => {
    if (field.variable_name && field.value) metadataMap[field.variable_name] = field.value
  })

  return {
    ...metadataMap,
    user_id: metadata?.user_id,
    plan: metadata?.plan,
    payment_type: metadata?.payment_type,
    resume_id: metadata?.resume_id,
    resumeId: metadata?.resumeId,
    email: metadata?.email,
    is_guest: metadata?.is_guest === true || metadata?.is_guest === "true",
    original_currency: metadata?.original_currency,
    original_amount: metadata?.original_amount,
  }
}

async function verifyPaystackTransaction(reference: string, retries = 5, delay = 3000) {
  let lastError: any = null
  let lastResponse: any = null

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[v0] Paystack verification attempt ${attempt}/${retries} for reference: ${reference}`)

      const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      })

      const data = await res.json()
      lastResponse = data

      console.log(`[v0] Paystack response attempt ${attempt}:`, JSON.stringify(data, null, 2))

      if (data.status === true && data.data) {
        const txStatus = data.data.status
        console.log(`[v0] Transaction status: ${txStatus}`)

        if (txStatus === "success") {
          return data
        } else if (txStatus === "failed" || txStatus === "abandoned") {
          return data
        }
      }

      if (data.status === false) {
        console.log(`[v0] Paystack API returned false status: ${data.message}`)
        lastError = new Error(data.message || "Transaction not found")
      }

      if (attempt < retries) {
        console.log(`[v0] Waiting ${delay}ms before retry...`)
        await new Promise((r) => setTimeout(r, delay))
      }
    } catch (err: any) {
      console.error(`[v0] Verification attempt ${attempt} error:`, err.message)
      lastError = err
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delay))
      }
    }
  }

  if (lastResponse && lastResponse.data) {
    return lastResponse
  }

  throw lastError || new Error("Transaction verification failed after all retries")
}

async function handleVerification(reference: string) {
  // ← ONLY CREATE SUPABASE HERE, AT RUNTIME
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const verificationResponse = await verifyPaystackTransaction(reference)

  if (verificationResponse.status && verificationResponse.data.status === "success") {
    const metadataMap = parsePaystackMetadata(verificationResponse.data.metadata)
    const userId = metadataMap.user_id
    const paymentType = metadataMap.payment_type
    const isGuest = metadataMap.is_guest
    const originalCurrency = metadataMap.original_currency || "KES"
    const originalAmount = metadataMap.original_amount || verificationResponse.data.amount / 100
    const resumeId =
      metadataMap.resume_id ||
      metadataMap.resumeId ||
      verificationResponse.data.metadata?.custom_fields?.find((f: any) => f.variable_name === "resume_id")?.value

    console.log("[v0] Payment verified - processing:", {
      paymentType,
      userId,
      isGuest,
      resumeId,
      originalCurrency,
      originalAmount,
    })

    const table = isGuest ? "guest_resumes" : "resumes"

    if (paymentType === "resume_download" && resumeId) {
      console.log(`[v0] Processing resume payment for ${isGuest ? "guest" : "user"}:`, resumeId)

      let updateQuery = supabaseAdmin.from(table).update({ payment_status: "paid" }).eq("id", resumeId)

      if (!isGuest) {
        updateQuery = updateQuery.eq("user_id", userId)
      }

      const { error: updateError } = await updateQuery

      if (updateError) {
        console.error("[v0] Failed to update resume payment status:", updateError)
        return {
          success: false,
          status: "failed",
          message: "Failed to update resume payment status",
        }
      }

      if (!isGuest && userId) {
        try {
          const { data: subscription } = await supabaseAdmin
            .from("subscriptions")
            .select("plan_type")
            .eq("user_id", userId)
            .eq("status", "active")
            .maybeSingle()

          if (!subscription || subscription.plan_type === "free") {
            await supabaseAdmin.from("users").update({ upgrade_discount_eligible: true }).eq("id", userId)
            console.log("[v0] User marked eligible for upgrade discount:", userId)
          }
        } catch (e) {
          console.log("[v0] Could not mark discount eligibility (columns may not exist):", e)
        }
      }

      await supabaseAdmin.from("user_activity").insert({
        user_id: !isGuest ? userId : undefined,
        activity_type: isGuest ? "guest_resume_download_paid" : "resume_download_paid",
        description: `Downloaded resume for ${originalCurrency} ${originalAmount}`,
        metadata: {
          resume_id: resumeId,
          amount: originalAmount,
          currency: originalCurrency,
          reference,
          is_guest: isGuest,
        },
      })

      if (!isGuest && userId) await trackUsage(userId, "resumes", "downloaded")
    }

    // ... rest of your code 100% unchanged ...
    // (discounted_upgrade, professional_upgrade, etc.)

    return {
      success: true,
      status: "success",
      message: "Payment verified successfully",
      data: verificationResponse.data,
      metadata: { resumeId, isGuest, paymentType, userId },
    }
  }

  return {
    success: false,
    status: "failed",
    message: verificationResponse.message || "Payment not successful",
  }
}

// Your GET and POST handlers — unchanged
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get("reference")

  if (!reference) {
    return NextResponse.json({ status: "failed", message: "Reference not found" }, { status: 400 })
  }

  try {
    const result = await handleVerification(reference)
    return result.success
      ? NextResponse.json(result)
      : NextResponse.json(result, { status: 400 })
  } catch (err: any) {
    console.error("[v0] Verify payment error:", err)
    return NextResponse.json({ status: "failed", message: err.message || "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const reference = body.reference

    if (!reference) {
      return NextResponse.json({ success: false, message: "Reference not found" }, { status: 400 })
    }

    const result = await handleVerification(reference)
    return result.success
      ? NextResponse.json(result)
      : NextResponse.json(result, { status: 400 })
  } catch (err: any) {
    console.error("[v0] Verify payment POST error:", err)
    return NextResponse.json({ success: false, message: err.message || "Internal server error" }, { status: 500 })
  }
}