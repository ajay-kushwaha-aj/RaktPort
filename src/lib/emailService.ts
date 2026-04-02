// src/lib/emailService.ts
// ═══════════════════════════════════════════════════════════════
// Email Service using Vercel Serverless Function
//
// API Key is now securely stored in Vercel Environment Variables
// ═══════════════════════════════════════════════════════════════

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an OTP verification email securely via our backend API.
 */
export async function sendVerificationEmail(
  toEmail: string,
  otpCode: string,
  userName: string = 'User'
): Promise<EmailResult> {
  try {
    const response = await fetch('/api/verify-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        toEmail,
        otpCode,
        userName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Resend Frontend Error]:', errorData);
      return { 
        success: false, 
        error: errorData.error || `Request failed with status ${response.status}` 
      };
    }

    const data = await response.json();
    return { success: true, messageId: data.messageId };
  } catch (error: any) {
    console.error('[Resend Client Catch Error]:', error);
    return { success: false, error: error.message || 'Failed to send verification email' };
  }
}
