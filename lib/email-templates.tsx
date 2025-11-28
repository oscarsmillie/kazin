// Email template components
export function welcomeEmailTemplate(userName: string, dashboardUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f9fafb;
    }
    .wrapper {
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      padding: 20px;
    }
    .container {
      max-width: 620px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
    }
    .header {
      background: linear-gradient(135deg, #059669 0%, #10b981 50%, #22c55e 100%);
      color: white;
      padding: 60px 40px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 300px;
      height: 300px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
    }
    .header-content {
      position: relative;
      z-index: 1;
    }
    .header-logo {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 20px;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    .header h1 {
      font-size: 32px;
      font-weight: 800;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .header p {
      font-size: 16px;
      opacity: 0.95;
      font-weight: 500;
    }
    .content {
      padding: 48px 40px;
    }
    .greeting {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 24px;
      color: #1f2937;
    }
    .text {
      color: #4b5563;
      margin-bottom: 20px;
      font-size: 16px;
      line-height: 1.7;
    }
    .features {
      margin: 36px 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .feature-item {
      background: linear-gradient(135deg, rgba(5, 150, 105, 0.05) 0%, rgba(34, 197, 94, 0.05) 100%);
      border: 1px solid rgba(5, 150, 105, 0.1);
      padding: 20px;
      border-radius: 12px;
      text-align: center;
    }
    .feature-icon {
      font-size: 32px;
      margin-bottom: 12px;
    }
    .feature-text {
      font-size: 14px;
      font-weight: 600;
      color: #1f2937;
      line-height: 1.5;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
      color: white;
      padding: 16px 40px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 700;
      font-size: 16px;
      margin: 32px 0;
      box-shadow: 0 8px 20px rgba(5, 150, 105, 0.3);
      transition: all 0.3s ease;
      display: inline-block;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 28px rgba(5, 150, 105, 0.4);
    }
    .footer {
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      padding: 32px 40px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 13px;
    }
    .footer p {
      margin-bottom: 12px;
    }
    .footer a {
      color: #059669;
      text-decoration: none;
      font-weight: 600;
    }
    @media (max-width: 600px) {
      .content { padding: 32px 24px; }
      .header { padding: 40px 24px; }
      .features { grid-template-columns: 1fr; }
      .header h1 { font-size: 24px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="header-content">
          <div class="header-logo">🚀</div>
          <h1>Welcome to KaziNest!</h1>
          <p>Your AI-Powered Career Companion</p>
        </div>
      </div>
      
      <div class="content">
        <div class="greeting">Hello ${userName}! 👋</div>
        
        <div class="text">
          Welcome to KaziNest – where African talent meets global opportunity! Your journey to landing your dream job starts now. We're thrilled to have you in our community of ambitious professionals.
        </div>

        <div class="features">
          <div class="feature-item">
            <div class="feature-icon">🤖</div>
            <div class="feature-text">AI Resume Builder</div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">✍️</div>
            <div class="feature-text">Smart Cover Letters</div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">🎓</div>
            <div class="feature-text">AI Career Coach</div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">🌍</div>
            <div class="feature-text">Global Job Board</div>
          </div>
        </div>

        <div style="text-align: center;">
          <a href="${dashboardUrl}" class="cta-button">Start Exploring Now</a>
        </div>

        <div class="text">
          Questions? Our support team at <strong>support@kazinest.co.ke</strong> is always ready to help you succeed.
        </div>
      </div>

      <div class="footer">
        <p><strong>KaziNest © 2025</strong> | Built for Africa, Open to the World</p>
        <p>
          <a href="https://kazinest.co.ke">Visit Website</a> • 
          <a href="https://kazinest.co.ke/privacy">Privacy</a> • 
          <a href="https://kazinest.co.ke/terms">Terms</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`
}

export function emailConfirmationTemplate(userName: string, confirmationUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background-color: #f9fafb;
    }
    .wrapper {
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      padding: 20px;
    }
    .container {
      max-width: 620px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
    }
    .header {
      background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #14b8a6 100%);
      color: white;
      padding: 60px 40px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 300px;
      height: 300px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
    }
    .header-content {
      position: relative;
      z-index: 1;
    }
    .header-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .header h1 {
      font-size: 32px;
      font-weight: 800;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 48px 40px;
    }
    .text {
      color: #4b5563;
      margin-bottom: 20px;
      font-size: 16px;
      line-height: 1.7;
    }
    .verification-box {
      background: linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(20, 184, 166, 0.05) 100%);
      border: 2px solid #06b6d4;
      border-radius: 12px;
      padding: 32px 24px;
      text-align: center;
      margin: 32px 0;
    }
    .verification-box h2 {
      margin: 0 0 12px 0;
      color: #0c4a6e;
      font-size: 22px;
      font-weight: 700;
    }
    .verification-box p {
      margin: 0 0 24px 0;
      color: #4b5563;
      font-size: 15px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
      color: white;
      padding: 16px 40px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 700;
      font-size: 16px;
      box-shadow: 0 8px 20px rgba(6, 181, 212, 0.3);
      transition: all 0.3s ease;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 28px rgba(6, 181, 212, 0.4);
    }
    .security-note {
      background: #fef08a;
      border-left: 4px solid #eab308;
      padding: 14px 16px;
      border-radius: 8px;
      font-size: 13px;
      color: #713f12;
      margin-top: 24px;
      line-height: 1.6;
    }
    .code-box {
      background: #f3f4f6;
      padding: 14px;
      border-radius: 8px;
      word-break: break-all;
      font-size: 12px;
      color: #4b5563;
      font-family: 'Courier New', monospace;
      margin-top: 16px;
    }
    .footer {
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      padding: 32px 40px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 13px;
    }
    .footer p { margin-bottom: 12px; }
    .footer a { color: #0ea5e9; text-decoration: none; font-weight: 600; }
    @media (max-width: 600px) {
      .content { padding: 32px 24px; }
      .header { padding: 40px 24px; }
      .header h1 { font-size: 24px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="header-content">
          <div class="header-icon">✉️</div>
          <h1>Verify Your Email</h1>
        </div>
      </div>
      
      <div class="content">
        <div class="text">Hi ${userName},</div>
        
        <div class="text">
          Thank you for joining KaziNest! To complete your registration and unlock all premium features, please verify your email address.
        </div>

        <div class="verification-box">
          <h2>Confirm Your Email</h2>
          <p>Click the button below to activate your account and start building your career.</p>
          <a href="${confirmationUrl}" class="cta-button">Verify Email Now</a>
        </div>

        <div class="text">
          This verification link expires in 24 hours. If you didn't create a KaziNest account, you can safely ignore this email.
        </div>

        <div class="security-note">
          🔒 <strong>Security:</strong> Never share this link or your password with anyone. KaziNest will never ask for sensitive information via email.
        </div>

        <div class="text" style="margin-top: 24px; font-size: 14px; color: #6b7280;">
          Or paste this link in your browser:
        </div>
        <div class="code-box">${confirmationUrl}</div>
      </div>

      <div class="footer">
        <p><strong>KaziNest © 2025</strong> | Built for Africa, Open to the World</p>
        <p>Need help? Contact <a href="mailto:support@kazinest.co.ke">support@kazinest.co.ke</a></p>
      </div>
    </div>
  </div>
</body>
</html>
`
}

export function passwordResetTemplate(userName: string, resetUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
    .header-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px;
    }
    .alert-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .alert-box p {
      margin: 0;
      color: #92400e;
      font-size: 14px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin: 24px 0;
      font-size: 16px;
      transition: transform 0.2s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
    }
    .text {
      color: #4b5563;
      margin-bottom: 16px;
      font-size: 16px;
      line-height: 1.6;
    }
    .footer {
      background: #f9fafb;
      padding: 24px 40px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-icon">🔐</div>
      <h1>Reset Your Password</h1>
    </div>
    
    <div class="content">
      <div class="text">Hi ${userName},</div>
      
      <div class="alert-box">
        <p>You requested a password reset for your KaziNest account. If you didn't request this, you can safely ignore this email.</p>
      </div>

      <div class="text">
        Click the button below to reset your password. This link will expire in 1 hour.
      </div>

      <div style="text-align: center;">
        <a href="${resetUrl}" class="cta-button">Reset Password</a>
      </div>

      <div class="text">
        If the button doesn't work, copy and paste this link in your browser:
      </div>
      <div style="background: #f3f4f6; padding: 12px; border-radius: 4px; word-break: break-all; font-size: 12px; color: #4b5563; font-family: monospace;">
        ${resetUrl}
      </div>

      <div class="text" style="margin-top: 24px;">
        If you continue to have trouble, our support team is here to help at support@kazinest.co.ke.
      </div>
    </div>

    <div class="footer">
      <p>KaziNest © 2025 | Built for Africa, Open to the World</p>
    </div>
  </div>
</body>
</html>
`
}

export function jobApplicationConfirmationTemplate(
  userName: string,
  jobTitle: string,
  company: string,
  dashboardUrl: string,
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #22c55e 0%, #dc2626 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
    .header-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px;
    }
    .job-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .job-title {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }
    .job-company {
      font-size: 14px;
      color: #4b5563;
      margin: 8px 0 0 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      transition: transform 0.2s;
      margin-top: 12px;
    }
    .cta-button:hover {
      transform: translateY(-2px);
    }
    .text {
      color: #4b5563;
      margin-bottom: 16px;
      font-size: 16px;
      line-height: 1.6;
    }
    .success-box {
      background: #ecfdf5;
      border-left: 4px solid #22c55e;
      padding: 16px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .success-box p {
      margin: 0;
      color: #065f46;
      font-size: 14px;
    }
    .footer {
      background: #f9fafb;
      padding: 24px 40px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-icon">🎉</div>
      <h1>Application Submitted!</h1>
    </div>
    
    <div class="content">
      <div class="text">Hi ${userName},</div>
      
      <div class="success-box">
        <p>✓ Your application has been successfully submitted and is being tracked.</p>
      </div>

      <div class="job-card">
        <p class="job-title">${jobTitle}</p>
        <p class="job-company">@ ${company}</p>
        <a href="${dashboardUrl}" class="cta-button">View in Dashboard</a>
      </div>

      <div class="text">
        We're tracking your application so you can monitor its progress in real-time. Check your dashboard to see updates and get reminders for follow-ups.
      </div>

      <div style="background: #f0f9ff; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
        <strong style="color: #0c4a6e;">Pro Tips:</strong>
        <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #4b5563;">
          <li>Follow up with the company after 1 week if you haven't heard back</li>
          <li>Use our AI career coach for interview preparation tips</li>
          <li>Apply to 3-5 similar roles to increase your chances</li>
        </ul>
      </div>

      <div class="text">
        Good luck! We're rooting for you! 🚀
      </div>
    </div>

    <div class="footer">
      <p>KaziNest © 2025 | Built for Africa, Open to the World</p>
      <p style="margin-top: 12px;">
        <a href="https://kazinest.co.ke">Visit our website</a> | 
        <a href="https://kazinest.co.ke/privacy">Privacy Policy</a> | 
        <a href="https://kazinest.co.ke/terms">Terms of Service</a>
      </p>
    </div>
  </div>
</body>
</html>
`
}

export function interviewInvitationTemplate(
  userName: string,
  jobTitle: string,
  company: string,
  interviewDate: string,
  dashboardUrl: string,
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #8b5cf6 0%, #dc2626 100%);
      padding: 40px 20px;
      text-align: center;
      color: white;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 300px;
      height: 300px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
    }
    .header-content {
      position: relative;
      z-index: 1;
    }
    .header-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px;
    }
    .congrats-box {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(220, 38, 38, 0.05) 100%);
      border: 2px solid #8b5cf6;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
    }
    .congrats-box p {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }
    .interview-details {
      background: #f9fafb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .detail-item {
      display: flex;
      margin-bottom: 12px;
      align-items: flex-start;
    }
    .detail-item:last-child {
      margin-bottom: 0;
    }
    .detail-label {
      font-weight: 600;
      color: #1f2937;
      width: 100px;
      flex-shrink: 0;
    }
    .detail-value {
      color: #4b5563;
      flex: 1;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      color: white;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin: 24px auto;
      font-size: 16px;
      display: block;
      text-align: center;
      transition: transform 0.2s;
      width: fit-content;
    }
    .cta-button:hover {
      transform: translateY(-2px);
    }
    .text {
      color: #4b5563;
      margin-bottom: 16px;
      font-size: 16px;
      line-height: 1.6;
    }
    .prep-section {
      background: #f0f9ff;
      border: 1px solid #bfdbfe;
      padding: 16px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .prep-section h3 {
      margin: 0 0 12px 0;
      color: #0c4a6e;
      font-size: 14px;
      font-weight: 600;
    }
    .prep-section ul {
      margin: 0;
      padding-left: 20px;
      color: #0c4a6e;
    }
    .prep-section li {
      margin-bottom: 8px;
      font-size: 14px;
    }
    .footer {
      background: #f9fafb;
      padding: 24px 40px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-icon">🎯</div>
      <h1>Interview Invitation!</h1>
    </div>
    
    <div class="content">
      <div class="text">Hi ${userName},</div>
      
      <div class="congrats-box">
        <p>🎉 Congratulations! You've been invited for an interview!</p>
      </div>

      <div class="interview-details">
        <div class="detail-item">
          <span class="detail-label">Position:</span>
          <span class="detail-value">${jobTitle}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Company:</span>
          <span class="detail-value">${company}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">When:</span>
          <span class="detail-value">${interviewDate}</span>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${dashboardUrl}" class="cta-button">View Details & Prepare</a>
      </div>

      <div class="prep-section">
        <h3>✨ Interview Preparation Tips</h3>
        <ul>
          <li>Use our AI Interview Prep tool to practice common questions</li>
          <li>Research the company thoroughly</li>
          <li>Prepare examples of your past achievements</li>
          <li>Test your internet connection and equipment if virtual</li>
          <li>Dress professionally and arrive early</li>
        </ul>
      </div>

      <div class="text">
        You're doing amazing! We're confident you'll make a great impression. If you need help preparing, check out our AI Career Coach and Mock Interview tools.
      </div>
    </div>

    <div class="footer">
      <p>KaziNest © 2025 | Built for Africa, Open to the World</p>
    </div>
  </div>
</body>
</html>
`
}

export function jobOfferTemplate(userName: string, jobTitle: string, company: string, dashboardUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #22c55e 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
    .header-icon {
      font-size: 56px;
      margin-bottom: 16px;
    }
    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 700;
    }
    .content {
      padding: 40px;
    }
    .celebration-box {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(34, 197, 94, 0.1) 100%);
      border: 2px solid #10b981;
      border-radius: 8px;
      padding: 24px;
      text-align: center;
      margin: 20px 0;
    }
    .celebration-box h2 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: #065f46;
    }
    .job-details {
      background: #f9fafb;
      border-radius: 8px;
      padding: 24px;
      margin: 20px 0;
    }
    .detail-item {
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-item:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }
    .detail-label {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .detail-value {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin: 24px auto;
      font-size: 16px;
      display: block;
      text-align: center;
      width: fit-content;
      transition: transform 0.2s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
    }
    .text {
      color: #4b5563;
      margin-bottom: 16px;
      font-size: 16px;
      line-height: 1.6;
    }
    .next-steps {
      background: #f0fdf4;
      border-left: 4px solid #10b981;
      padding: 16px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .next-steps h3 {
      margin: 0 0 12px 0;
      color: #065f46;
      font-size: 14px;
      font-weight: 600;
    }
    .next-steps ol {
      margin: 0;
      padding-left: 20px;
      color: #065f46;
    }
    .next-steps li {
      margin-bottom: 8px;
      font-size: 14px;
    }
    .footer {
      background: #f9fafb;
      padding: 24px 40px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-icon">🎊</div>
      <h1>You Got The Job!</h1>
    </div>
    
    <div class="content">
      <div class="text">Hi ${userName},</div>
      
      <div class="celebration-box">
        <h2>Congratulations on your offer! 🚀</h2>
      </div>

      <div class="text">
        We're absolutely thrilled to tell you that you've been offered the position! Your hard work and dedication have paid off. Welcome to the next chapter of your career!
      </div>

      <div class="job-details">
        <div class="detail-item">
          <div class="detail-label">Position</div>
          <div class="detail-value">${jobTitle}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Company</div>
          <div class="detail-value">${company}</div>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${dashboardUrl}" class="cta-button">View Full Offer Details</a>
      </div>

      <div class="next-steps">
        <h3>📋 Next Steps</h3>
        <ol>
          <li>Review the complete offer details carefully</li>
          <li>Discuss terms with the recruiter if needed</li>
          <li>Prepare onboarding documents</li>
          <li>Plan your transition from current role (if applicable)</li>
          <li>Celebrate your achievement!</li>
        </ol>
      </div>

      <div class="text">
        Thank you for using KaziNest. We're proud to have been part of your journey to success. If you need anything else, our team is always here to support you.
      </div>

      <div class="text" style="color: #1f2937; font-weight: 500;">
        Welcome to your dream role! 🌟
      </div>
    </div>

    <div class="footer">
      <p>KaziNest © 2025 | Built for Africa, Open to the World</p>
      <p style="margin-top: 12px;">Share your success with others and help them land their dream jobs too!</p>
    </div>
  </div>
</body>
</html>
`
}

export function verificationCodeTemplate(code: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 480px;
      margin: 40px auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
      padding: 32px;
      text-align: center;
      color: white;
    }
    .content {
      padding: 32px;
      text-align: center;
    }
    .code {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 4px;
      color: #059669;
      background: #ecfdf5;
      padding: 16px;
      border-radius: 8px;
      border: 2px dashed #059669;
      margin: 24px 0;
      display: inline-block;
    }
    .footer {
      background: #f3f4f6;
      padding: 16px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0; font-size: 24px;">Verify Your Email</h1>
    </div>
    <div class="content">
      <p style="color: #4b5563; margin-bottom: 24px; font-size: 16px;">
        Use the following code to verify your email address and complete your registration.
      </p>
      
      <div class="code">${code}</div>
      
      <p style="color: #6b7280; font-size: 14px;">
        This code will expire in 15 minutes. If you didn't request this, you can safely ignore this email.
      </p>
    </div>
    <div class="footer">
      KaziNest © 2025
    </div>
  </div>
</body>
</html>
`
}
