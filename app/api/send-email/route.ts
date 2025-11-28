// app/api/send-email/route.ts (or wherever it lives)

export const runtime = "nodejs";
export const dynamic = "force-dynamic";   // THIS IS REQUIRED

import { Response } from "next/dist/compiled/@edge-runtime/primitives"; // fallback if needed

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

    // LAZY LOAD sendEmail AND ALL TEMPLATES — ONLY WHEN CALLED
    const [
      { sendEmail },
      {
        welcomeEmailTemplate,
        emailConfirmationTemplate,
        passwordResetTemplate,
        jobApplicationConfirmationTemplate,
        interviewInvitationTemplate,
        jobOfferTemplate,
      },
    ] = await Promise.all([
      import("@/lib/email"),
      import("@/lib/email-templates"),
    ]);

    let html = "";

    switch (templateType) {
      case "welcome":
        html = welcomeEmailTemplate(data.userName, data.dashboardUrl);
        break;

      case "email-confirmation":
        html = emailConfirmationTemplate(data.userName, data.confirmationUrl);
        break;

      case "password-reset":
        html = passwordResetTemplate(data.userName, data.resetUrl);
        break;

      case "job-application":
        html = jobApplicationConfirmationTemplate(
          data.userName,
          data.jobTitle,
          data.company,
          data.dashboardUrl
        );
        break;

      case "interview-invitation":
        html = interviewInvitationTemplate(
          data.userName,
          data.jobTitle,
          data.company,
          data.interviewDate,
          data.dashboardUrl
        );
        break;

      case "job-offer":
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
  } catch (error: any) {
    console.error("[Send Email API] Error:", error);
    return Response.json(
      { error: "Internal server error", details: error.message || error },
      { status: 500 }
    );
  }
}