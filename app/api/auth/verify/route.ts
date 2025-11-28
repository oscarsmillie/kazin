// app/api/auth/verify-code/route.ts  (or wherever this file lives)

export const runtime = "nodejs";
export const dynamic = "force-dynamic";   // This skips the entire route during build

// DO NOT import anything at the top level that touches process.env or creates clients
// → supabaseAdmin, sendBrevoEmail, welcomeEmailTemplate likely do this

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return Response.json({ error: "Missing email or code" }, { status: 400 });
    }

    // LAZY LOAD EVERYTHING — only when the route is actually called
    const [
      { supabaseAdmin },
      { sendBrevoEmail },
      { welcomeEmailTemplate },
    ] = await Promise.all([
      import("@/lib/supabase"),
      import("@/lib/brevo-email"),
      import("@/lib/email-templates"),
    ]);

    // 1. Verify Code
    const { data: record, error: dbError } = await supabaseAdmin
      .from("verification_codes")
      .select("*")
      .eq("email", email)
      .eq("code", code)
      .eq("type", "signup")
      .gt("expires_at", new Date().toISOString())
      .single();

    if (dbError || !record) {
      return Response.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    const userId = record.metadata?.userId;
    const fullName = record.metadata?.fullName || "User";

    if (!userId) {
      return Response.json({ error: "User record missing from verification" }, { status: 500 });
    }

    // 2. Mark user as verified in Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });

    if (updateError) {
      console.error("[v0] Failed to verify user:", updateError);
      return Response.json({ error: "Failed to verify user account" }, { status: 500 });
    }

    // 3. Update public.users
    await supabaseAdmin.from("users").update({ email_verified: true }).eq("id", userId);

    // 4. Background: Create free subscription (fire-and-forget)
    createSubscriptionAsync(supabaseAdmin, userId, email, fullName).catch((err) =>
      console.warn("[v0] Background subscription creation failed (non-critical):", err)
    );

    // 5. Delete verification code
    await supabaseAdmin.from("verification_codes").delete().eq("id", record.id);

    // 6. Send Welcome Email via Brevo (non-blocking)
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://kazinest.co.ke"}/dashboard`;
    const welcomeHtml = welcomeEmailTemplate(fullName, dashboardUrl);

    sendBrevoEmail({
      to: email,
      subject: "Welcome to KaziNest!",
      html: welcomeHtml,
    }).catch((err) => console.error("[v0] Failed to send welcome email:", err));

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("[v0] Verification error:", error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Move background function outside — but pass supabaseAdmin lazily
async function createSubscriptionAsync(
  supabaseAdmin: any,
  userId: string,
  email: string,
  fullName: string
) {
  try {
    const { data: freePlan, error: planError } = await supabaseAdmin
      .from("subscription_plans")
      .select("id")
      .eq("plan_type", "free")
      .single();

    if (planError || !freePlan) {
      console.error("[v0] Error fetching free plan:", planError);
      return;
    }

    const { data: existingSubscription } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingSubscription) {
      console.log("[v0] Subscription already exists for user:", userId);
      return;
    }

    const { error: subscriptionError } = await supabaseAdmin.from("subscriptions").insert({
      user_id: userId,
      plan_id: freePlan.id,
      status: "active",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (subscriptionError) {
      console.error("[v0] Error creating subscription:", subscriptionError);
      return;
    }

    console.log("[v0] Free subscription created for:", userId);
  } catch (error) {
    console.error("[v0] Unexpected error in background subscription:", error);
  }
}