import { sendEmail } from "@/lib/email";
import { emailConfirmationTemplate } from "@/lib/email-templates";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, templateType, data } = body;

    if (!to || !subject || !templateType) {
      return Response.json(
        { error: "Missing required fields: to, subject, templateType" },
        { status: 400 }
      );
    }

    let html = "";

    // Select template based on type
    switch (templateType) {
      case "welcome":
        const { welcomeEmailTemplate } = await import(
          "@/lib/email-templates"
        );
        html = welcomeEmailTemplate(data.userName, data.dashboardUrl);
        break;

      case "email-confirmation":
        html = emailConfirmationTemplate(
          data.userName,
          data.confirmationUrl
        );
        break;

      case "password-reset":
        const { passwordResetTemplate } = await import(
          "@/lib/email-templates"
        );
        html = passwordResetTemplate(data.userName, data.resetUrl);
        break;

      case "job-application":
        const { jobApplicationConfirmationTemplate } = await import(
          "@/lib/email-templates"
        );
        html = jobApplicationConfirmationTemplate(
          data.userName,
          data.jobTitle,
          data.company,
          data.dashboardUrl
        );
        break;

      case "interview-invitation":
        const { interviewInvitationTemplate } = await import(
          "@/lib/email-templates"
        );
        html = interviewInvitationTemplate(
          data.userName,
          data.jobTitle,
          data.company,
          data.interviewDate,
          data.dashboardUrl
        );
        break;

      case "job-offer":
        const { jobOfferTemplate } = await import("@/lib/email-templates");
        html = jobOfferTemplate(
          data.userName,
          data.jobTitle,
          data.company,
          data.dashboardUrl
        );
        break;

      default:
        return Response.json(
          { error: `Unknown template type: ${templateType}` },
          { status: 400 }
        );
    }

    const result = await sendEmail({
      to,
      subject,
      html,
    });

    if (!result.success) {
      return Response.json(
        { error: "Failed to send email", details: result.error },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      message: "Email sent successfully",
      emailId: result.data?.id,
    });
  } catch (error) {
    console.error("[Send Email API] Error:", error);
    return Response.json(
      { error: "Internal server error", details: error },
      { status: 500 }
    );
  }
}
