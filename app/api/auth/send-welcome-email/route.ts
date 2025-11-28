export const runtime = "nodejs";
import { sendEmail } from "@/lib/email";
import { welcomeEmailTemplate } from "@/lib/email-templates";

export async function POST(req: Request) {
  try {
    const { email, fullName, dashboardUrl } = await req.json();

    console.log("[v0] Welcome email request:", { email, fullName });

    if (!email || !fullName) {
      console.error("[v0] Missing required fields for welcome email");
      return Response.json(
        { error: "Missing required fields: email, fullName" },
        { status: 400 }
      );
    }

    const html = welcomeEmailTemplate(fullName, dashboardUrl);
    console.log("[v0] Sending welcome email via Resend...");
    
    const result = await sendEmail({
      to: email,
      subject: "Welcome to KaziNest - Your AI Career Companion!",
      html,
      type: "notification",
    });

    if (!result.success) {
      console.error("[v0] Welcome email failed to send:", { error: result.error, email });
      return Response.json(
        { error: "Failed to send welcome email" },
        { status: 500 }
      );
    }

    console.log("[v0] Welcome email sent successfully:", { email, messageId: result.data?.id });
    return Response.json({ success: true, data: result.data });
  } catch (error) {
    console.error("[v0] Welcome email route error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
