// app/api/auth/send-confirmation-email/route.ts   (or wherever it lives)

export const runtime = "nodejs";
export const dynamic = "force-dynamic";   // Critical — skips during next build

// DO NOT import sendEmail or templates at the top level
// → they likely create Resend client on import → kills build

export async function POST(req: Request) {
  try {
    console.log(
      "[v0] DEPRECATED: send-confirmation-email route called. Confirmation emails are now sent automatically by Supabase/Brevo."
    );

    const { email, fullName } = await req.json();

    if (!email || !fullName) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Lazy-load everything — only when actually called
    const [{ sendEmail }, { emailConfirmationTemplate }] = await Promise.all([
      import("@/lib/email"),
      import("@/lib/email-templates"),
    ]);

    const html = emailConfirmationTemplate(fullName, "");

    const result = await sendEmail({
      to: email,
      subject: "Confirm Your KaziNest Email Address",
      html,
      type: "notification",
    });

    if (!result.success) {
      console.error("[v0] Confirmation email failed (backup):", result.error);
      return Response.json(
        { error: "Failed to send confirmation email" },
        { status: 500 }
      );
    }

    console.log("[v0] Confirmation email sent (backup):", { email });
    return Response.json({ success: true, data: result.data });
  } catch (error: any) {
    console.error("[v0] Confirmation email route error:", error);
    return Response.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}