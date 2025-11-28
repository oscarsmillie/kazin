// app/api/auth/welcome-email/route.ts  (or wherever it is)

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    console.log("[v0] Welcome email request received");

    const { email, fullName, dashboardUrl } = await req.json();

    if (!email || !fullName) {
      console.error("[v0] Missing required fields for welcome email");
      return Response.json(
        { error: "Missing required fields: email, fullName" },
        { status: 400 }
      );
    }

    // Lazy load — only when actually called
    const [{ sendEmail }, { welcomeEmailTemplate }] = await Promise.all([
      import("@/lib/email"),
      import("@/lib/email-templates"),
    ]);

    const html = welcomeEmailTemplate(fullName, dashboardUrl);
    console.log("[v0] Sending welcome email via Resend...");

    const result = await sendEmail({
      to: email,
      subject: "Welcome to KaziNest - Your AI Career Companion!",
      html,
      type: "notification",
    });

    if (!result.success) {
      console.error("[v0] Welcome email failed:", result.error);
      return Response.json(
        { error: "Failed to send welcome email" },
        { status: 500 }
      );
    }

    console.log("[v0] Welcome email sent:", { email, messageId: result.data?.id });
    return Response.json({ success: true, data: result.data });
  } catch (error: any) {
    console.error("[v0] Welcome email route error:", error);
    return Response.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}