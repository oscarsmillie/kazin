// app/api/auth/signup/route.ts  (or similar)

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email, fullName, password } = await req.json();

    if (!email || !fullName || !password) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Lazy load everything
    const [
      { supabaseAdmin },
      { sendEmail },
      { verificationCodeTemplate },
    ] = await Promise.all([
      import("@/lib/supabase"),
      import("@/lib/email"),
      import("@/lib/email-templates"),
    ]);

    // 1. Create user in Supabase Auth
    const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { full_name: fullName },
    });

    if (createError) {
      if (createError.message.includes("already registered")) {
        return Response.json({ error: "User already registered. Please sign in." }, { status: 400 });
      }
      console.error("[v0] Auth create error:", createError);
      return Response.json({ error: createError.message }, { status: 500 });
    }

    if (!createdUser.user) {
      return Response.json({ error: "Failed to create user" }, { status: 500 });
    }

    const userId = createdUser.user.id;

    // 2. Insert into public.users
    await supabaseAdmin.from("users").insert({
      id: userId,
      email,
      full_name: fullName,
      email_verified: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // 3. Generate & store OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const { error: dbError } = await supabaseAdmin.from("verification_codes").insert({
      email,
      code,
      type: "signup",
      expires_at: expiresAt.toISOString(),
      metadata: { userId, fullName },
    });

    if (dbError) {
      console.error("[v0] Failed to store verification code:", dbError);
      await supabaseAdmin.auth.admin.deleteUser(userId); // rollback
      return Response.json({ error: "Failed to generate verification code" }, { status: 500 });
    }

    // 4. Send verification email
    const html = verificationCodeTemplate(code);
    const emailResult = await sendEmail({
      to: email,
      subject: "Verify your KaziNest account",
      html,
      type: "auth",
    });

    if (!emailResult.success) {
      console.error("[v0] Verification email failed:", emailResult.error);
      return Response.json({ error: "Failed to send verification email" }, { status: 500 });
    }

    return Response.json({ success: true, email });
  } catch (error: any) {
    console.error("[v0] Signup error:", error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}