// Helper functions to trigger emails in different scenarios
import { sendEmail } from "@/lib/email";
import { welcomeEmailTemplate, emailConfirmationTemplate, passwordResetTemplate, jobApplicationConfirmationTemplate, interviewInvitationTemplate, jobOfferTemplate } from "@/lib/email-templates";

export async function sendWelcomeEmail(
  email: string,
  userName: string,
  dashboardUrl: string
) {
  const html = welcomeEmailTemplate(userName, dashboardUrl);
  return sendEmail({
    to: email,
    subject: "Welcome to KaziNest - Your AI-Powered Career Companion",
    html,
    from: "KaziNest <noreply@kazinest.co.ke>",
  });
}

export async function sendEmailConfirmation(
  email: string,
  userName: string,
  confirmationUrl: string
) {
  const html = emailConfirmationTemplate(userName, confirmationUrl);
  return sendEmail({
    to: email,
    subject: "Confirm Your Email Address - KaziNest",
    html,
    from: "KaziNest <noreply@kazinest.co.ke>",
  });
}

export async function sendPasswordResetEmail(
  email: string,
  userName: string,
  resetUrl: string
) {
  const html = passwordResetTemplate(userName, resetUrl);
  return sendEmail({
    to: email,
    subject: "Reset Your Password - KaziNest",
    html,
    from: "KaziNest <noreply@kazinest.co.ke>",
  });
}

export async function sendJobApplicationConfirmation(
  email: string,
  userName: string,
  jobTitle: string,
  company: string,
  dashboardUrl: string
) {
  const html = jobApplicationConfirmationTemplate(
    userName,
    jobTitle,
    company,
    dashboardUrl
  );
  return sendEmail({
    to: email,
    subject: `Application Submitted for ${jobTitle} at ${company}`,
    html,
    from: "KaziNest <noreply@kazinest.co.ke>",
  });
}

export async function sendInterviewInvitation(
  email: string,
  userName: string,
  jobTitle: string,
  company: string,
  interviewDate: string,
  dashboardUrl: string
) {
  const html = interviewInvitationTemplate(
    userName,
    jobTitle,
    company,
    interviewDate,
    dashboardUrl
  );
  return sendEmail({
    to: email,
    subject: `Interview Invitation for ${jobTitle} at ${company}`,
    html,
    from: "KaziNest <noreply@kazinest.co.ke>",
  });
}

export async function sendJobOfferEmail(
  email: string,
  userName: string,
  jobTitle: string,
  company: string,
  dashboardUrl: string
) {
  const html = jobOfferTemplate(userName, jobTitle, company, dashboardUrl);
  return sendEmail({
    to: email,
    subject: `Job Offer: ${jobTitle} at ${company}`,
    html,
    from: "KaziNest <noreply@kazinest.co.ke>",
  });
}
