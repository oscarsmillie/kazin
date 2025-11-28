// Keeping the file for backward compatibility, but it should not be called
export const runtime = "nodejs";
import { sendEmail } from "@/lib/email";
import { emailConfirmationTemplate } from "@/lib/email-templates";

export async function POST(req: Request) {
  try {
    console.log("[v0] DEPRECATED: send-confirmation-email route called. Confirmation emails are now sent automatically by Supabase/Brevo.")
    
    const { email, fullName } = await req.json();

    if (!email || !fullName) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // This is now handled by Supabase SMTP, but kept for backward compatibility
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
  } catch (error) {
    console.error("[v0] Confirmation email route error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
