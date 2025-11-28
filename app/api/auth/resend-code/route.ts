// app/api/auth/resend-code/route.ts

// THESE TWO LINES ARE MANDATORY — they skip the route during build
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DO NOT import anything that touches process.env or creates clients at the top!
// → supabaseAdmin, sendEmail, verificationCodeTemplate are likely doing this

export async function POST(req: Request) {
  try {
    // LAZY LOAD everything — only when the route is actually called
    const [
      { supabaseAdmin },
      { sendEmail },
      { verificationCodeTemplate },
    ] = await Promise.all([
      import("@/lib/supabase"),
      import("@/lib/email"),
      import("@/lib/email-templates"),
    ]);

    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, full_name")
      .eq("email", email)
      .single();

    if (userError || !user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Generate new code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Remove old codes
    await supabaseAdmin
      .from("verification_codes")
      .delete()
      .eq("email", email)
      .eq("type", "signup");

    // Insert new code
    const { error: dbError } = await supabaseAdmin
      .from("verification_codes")
      .insert({
        email,
        code,
        type: "signup",
        expires_at: expiresAt.toISOString(),
        metadata: { userId: user.id, fullName: user.full_name },
      });

    if (dbError) throw dbError;

    // Send email
    const html = verificationCodeTemplate(code);
    await sendEmail({
      to: email,
      subject: "Verify your KaziNest account (Resent)",
      html,
      type: "auth",
    });

    return Response.json({ success: true });
  } catch (error: any) {
    console.error("[Resend Code] Error:", error);
    return Response.json(
      { error: "Failed to resend code", details: error.message },
      { status: 500 }
    );
  }
}