export const runtime = "nodejs";
import { NextResponse } from "next/server"
import { trackUsage } from "@/lib/usage-tracker"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

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

    if (paymentType === "discounted_upgrade" && userId) {
      console.log("[v0] Processing discounted professional upgrade for user:", userId)

      const oneMonthFromNow = new Date()
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1)

      // First, delete any existing subscription for this user
      const { error: deleteError } = await supabaseAdmin.from("subscriptions").delete().eq("user_id", userId)

      if (deleteError) {
        console.log("[v0] Delete existing subscription error (may not exist):", deleteError)
      }

      // Insert new professional subscription
      const subscriptionData = {
        user_id: userId,
        plan_type: "professional",
        status: "active",
        is_active: true,
        current_period_start: new Date().toISOString(),
        current_period_end: oneMonthFromNow.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log("[v0] Inserting subscription:", subscriptionData)

      const { data: insertData, error: subError } = await supabaseAdmin
        .from("subscriptions")
        .insert(subscriptionData)
        .select()

      if (subError) {
        console.error("[v0] Error creating subscription:", subError)

        // Try upsert as fallback
        const { data: upsertData, error: upsertError } = await supabaseAdmin
          .from("subscriptions")
          .upsert(
            {
              user_id: userId,
              plan_type: "professional",
              status: "active",
              is_active: true,
              current_period_start: new Date().toISOString(),
              current_period_end: oneMonthFromNow.toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          )
          .select()

        if (upsertError) {
          console.error("[v0] Upsert also failed:", upsertError)
        } else {
          console.log("[v0] Upsert succeeded:", upsertData)
        }
      } else {
        console.log("[v0] Subscription insert succeeded:", insertData)
      }

      // Try to update discount tracking columns (may not exist)
      try {
        await supabaseAdmin
          .from("users")
          .update({
            upgrade_discount_used: true,
            upgrade_discount_eligible: false,
          })
          .eq("id", userId)
      } catch (e) {
        console.log("[v0] Could not update discount tracking columns:", e)
      }

      await supabaseAdmin.from("user_activity").insert({
        user_id: userId,
        activity_type: "upgrade_discounted",
        description: `Upgraded to Professional with discount (${originalCurrency} ${originalAmount})`,
        metadata: {
          amount: originalAmount,
          currency: originalCurrency,
          reference,
          discount_type: "first_resume_discount",
        },
      })

      console.log("[v0] Discounted upgrade complete for user:", userId)
    }

    if (paymentType === "professional_upgrade" && userId) {
      console.log("[v0] Processing professional upgrade for user:", userId)

      const oneMonthFromNow = new Date()
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1)

      await supabaseAdmin.from("subscriptions").delete().eq("user_id", userId)

      const { error: subError } = await supabaseAdmin.from("subscriptions").insert({
        user_id: userId,
        plan_type: "professional",
        status: "active",
        is_active: true,
        current_period_start: new Date().toISOString(),
        current_period_end: oneMonthFromNow.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (subError) {
        console.error("[v0] Error creating subscription:", subError)
        await supabaseAdmin.from("subscriptions").upsert(
          {
            user_id: userId,
            plan_type: "professional",
            status: "active",
            is_active: true,
            current_period_start: new Date().toISOString(),
            current_period_end: oneMonthFromNow.toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        )
      }

      await supabaseAdmin.from("user_activity").insert({
        user_id: userId,
        activity_type: "professional_upgrade",
        description: `Upgraded to Professional (${originalCurrency} ${originalAmount})`,
        metadata: {
          amount: originalAmount,
          currency: originalCurrency,
          reference,
        },
      })

      console.log("[v0] Professional upgrade complete for user:", userId)
    }

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get("reference")

  if (!reference) {
    return NextResponse.json({ status: "failed", message: "Reference not found" }, { status: 400 })
  }

  try {
    const result = await handleVerification(reference)

    if (result.success) {
      return NextResponse.json(result)
    }

    return NextResponse.json(result, { status: 400 })
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

    if (result.success) {
      return NextResponse.json(result)
    }

    return NextResponse.json(result, { status: 400 })
  } catch (err: any) {
    console.error("[v0] Verify payment POST error:", err)
    return NextResponse.json({ success: false, message: err.message || "Internal server error" }, { status: 500 })
  }
}
