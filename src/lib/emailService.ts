// src/lib/emailService.ts
// ═══════════════════════════════════════════════════════════════
// Email Service using Resend REST API
//
// API Key: provided via config
// Domain: https://www.raktport.in/
// ═══════════════════════════════════════════════════════════════

const RESEND_API_KEY = 're_cZ9PVwwn_HA4FRwZYt4YfJ4DLdsw4WMms';
const SENDER_EMAIL = 'RaktPort <onboarding@raktport.in>';

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an OTP verification email using the Resend API.
 * Uses the native JS Fetch API to interact directly with Resend.
 */
export async function sendVerificationEmail(
  toEmail: string,
  otpCode: string,
  userName: string = 'User'
): Promise<EmailResult> {
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden; padding: 40px 20px; text-align: center; background-color: #ffffff;">
      <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 20px; font-weight: 700;">Verify Your Email Address</h1>
      <p style="color: #4b5563; font-size: 16px; margin-bottom: 30px; line-height: 1.5;">
        Hi ${userName},<br />
        Thank you for registering on RaktPort. Please use the verification code below to complete your sign-up process:
      </p>
      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
        <span style="font-size: 32px; font-weight: 800; color: #ef4444; letter-spacing: 4px;">${otpCode}</span>
      </div>
      <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
        If you did not request this code, you can safely ignore this email.
      </p>
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eaeaea;">
        <p style="color: #9ca3af; font-size: 12px;">
          RaktPort Platform &copy; ${new Date().getFullYear()}<br />
          <a href="https://www.raktport.in/" style="color: #3b82f6; text-decoration: none;">www.raktport.in</a>
        </p>
      </div>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: SENDER_EMAIL,
        to: toEmail,
        subject: 'Your RaktPort Verification Code',
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Resend Error]:', errorData);
      return { 
        success: false, 
        error: errorData.message || `Request failed with status ${response.status}` 
      };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error: any) {
    console.error('[Resend Catch Error]:', error);
    return { success: false, error: error.message || 'Failed to send verification email' };
  }
}
