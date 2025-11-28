export async function sendBrevoEmail({
  to,
  subject,
  html,
  from = "noreply@kazinest.co.ke",
  fromName = "KaziNest",
}: {
  to: string
  subject: string
  html: string
  from?: string
  fromName?: string
}) {
  try {
    const apiKey = process.env.BREVO_API_KEY

    if (!apiKey) {
      console.warn("[v0] Brevo API key not configured. Skipping email send.")
      return { success: false, error: "Email service not configured" }
    }

    console.log("[v0] Sending email via Brevo REST API:", { to, subject, provider: "brevo" })

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: {
          name: fromName,
          email: from,
        },
        to: [
          {
            email: to,
          },
        ],
        subject,
        htmlContent: html,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("[v0] Brevo email sending failed:", { status: response.status, error, to, subject })
      return { success: false, error: `Failed to send email: ${response.status}` }
    }

    const result = await response.json()
    console.log("[v0] Email sent successfully via Brevo:", { messageId: result.messageId, to })
    return { success: true, data: { id: result.messageId } }
  } catch (error) {
    console.error("[v0] Brevo email sending failed:", { error, to, subject })
    return { success: false, error }
  }
}
