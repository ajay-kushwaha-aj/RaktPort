// In-memory rate limiting store (persists for the lifetime of the serverless function instance)
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_REQUESTS_PER_IP = 3;
const MAX_REQUESTS_PER_EMAIL = 3;

const ipRequests = new Map();
const emailRequests = new Map();

// Helper to clean up old rate limit entries
const cleanupRateLimits = () => {
  const now = Date.now();
  for (const [key, val] of ipRequests.entries()) {
    if (now - val.startTime > RATE_LIMIT_WINDOW_MS) ipRequests.delete(key);
  }
  for (const [key, val] of emailRequests.entries()) {
    if (now - val.startTime > RATE_LIMIT_WINDOW_MS) emailRequests.delete(key);
  }
};

export default async function handler(req, res) {
  // Add CORS headers so local frontend can talk to it if needed during local testing
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { toEmail, otpCode, userName } = req.body;
  if (!toEmail || !otpCode) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // --- Rate Limiting Logic ---
  cleanupRateLimits();

  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  
  // 1. IP Rate Limiting
  let ipRecord = ipRequests.get(ip);
  if (!ipRecord || (Date.now() - ipRecord.startTime > RATE_LIMIT_WINDOW_MS)) {
    ipRecord = { count: 1, startTime: Date.now() };
  } else {
    ipRecord.count += 1;
  }
  ipRequests.set(ip, ipRecord);

  if (ip !== 'unknown' && ipRecord.count > MAX_REQUESTS_PER_IP) {
    console.warn(`[Rate Limit] Blocked IP ${ip}. Requests: ${ipRecord.count}`);
    return res.status(429).json({ error: 'Too many requests from this IP. Please try again later.' });
  }

  // 2. Email Rate Limiting
  let emailRecord = emailRequests.get(toEmail);
  if (!emailRecord || (Date.now() - emailRecord.startTime > RATE_LIMIT_WINDOW_MS)) {
    emailRecord = { count: 1, startTime: Date.now() };
  } else {
    emailRecord.count += 1;
  }
  emailRequests.set(toEmail, emailRecord);

  if (emailRecord.count > MAX_REQUESTS_PER_EMAIL) {
    console.warn(`[Rate Limit] Blocked Email ${toEmail}. Requests: ${emailRecord.count}`);
    return res.status(429).json({ error: 'Too many requests for this email. Please try again later.' });
  }
  // ---------------------------

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.error('Missing RESEND_API_KEY in environment variables');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const SENDER_EMAIL = 'RaktPort <onboarding@raktport.in>';
  
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden; padding: 40px 20px; text-align: center; background-color: #ffffff;">
      <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 20px; font-weight: 700;">Verify Your Email Address</h1>
      <p style="color: #4b5563; font-size: 16px; margin-bottom: 30px; line-height: 1.5;">
        Hi ${userName || 'User'},<br />
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
      console.error('[Resend Vercel Error]:', errorData);
      return res.status(response.status).json({ error: errorData.message || `Resend API failed with status ${response.status}` });
    }

    const data = await response.json();
    return res.status(200).json({ success: true, messageId: data.id });
  } catch (error) {
    console.error('[Resend Vercel Catch Error]:', error);
    return res.status(500).json({ error: error.message || 'Failed to send verification email' });
  }
}
