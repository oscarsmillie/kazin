import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Email types for routing
type EmailType = "auth" | "notification" | "marketing";

export async function sendEmail({
  to,
  subject,
  html,
  from = "noreply@kazinest.co.ke",
  type = "notification",
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  type?: EmailType;
}) {
  try {
    // This function is now used for notifications and marketing emails via Resend
    console.log("[v0] Sending email:", { to, subject, type, provider: "resend" });
    
    if (!process.env.RESEND_API_KEY) {
      console.error("[v0] RESEND_API_KEY is not configured");
      return { success: false, error: "Email service not configured" };
    }

    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (result.error) {
      console.error("[v0] Email sending failed:", { error: result.error, to, subject });
      return { success: false, error: result.error };
    }

    console.log("[v0] Email sent successfully:", { id: result.data?.id, to });
    return { success: true, data: result.data };
  } catch (error) {
    console.error("[v0] Unexpected email error:", error);
    return { success: false, error };
  }
}
