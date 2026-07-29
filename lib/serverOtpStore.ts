import crypto from 'crypto';

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getSecretKey(): string {
  return (
    process.env.OTP_SECRET ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    'paisa_kg_stateless_otp_signing_secret_2026'
  );
}

/**
 * Generate a cryptographically secure 6-digit random number string
 */
export function generateSecureOtpCode(): string {
  const buffer = crypto.randomBytes(4);
  const num = (buffer.readUInt32BE(0) % 900000) + 100000;
  return num.toString();
}

/**
 * Create a stateless HMAC-signed token for an OTP
 */
export function createSignedOtpToken(
  email: string,
  code: string
): { token: string; expiresAt: number } {
  const cleanEmail = email.toLowerCase().trim();
  const expiresAt = Date.now() + OTP_TTL_MS;
  const secret = getSecretKey();

  const payload = `${cleanEmail}:${code}:${expiresAt}`;
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const token = `${expiresAt}.${hmac}`;

  return { token, expiresAt };
}

/**
 * Verify a stateless HMAC-signed OTP token
 */
export function verifySignedOtpToken(
  email: string,
  inputCode: string,
  token?: string | null
): { success: boolean; error?: string } {
  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = inputCode.trim();

  if (!token) {
    return {
      success: false,
      error: 'No active OTP verification token found. Please request a new code.',
    };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return {
      success: false,
      error: 'Invalid OTP verification token. Please request a new code.',
    };
  }

  const [expiresAtStr, providedHmac] = parts;
  const expiresAt = parseInt(expiresAtStr, 10);

  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return {
      success: false,
      error: 'The 6-digit verification code has expired. Please request a new code.',
    };
  }

  const secret = getSecretKey();
  const payload = `${cleanEmail}:${cleanCode}:${expiresAt}`;
  const expectedHmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  try {
    const isMatch = crypto.timingSafeEqual(
      Buffer.from(providedHmac, 'hex'),
      Buffer.from(expectedHmac, 'hex')
    );

    if (!isMatch) {
      return {
        success: false,
        error: 'Incorrect 6-digit verification code. Please check your email and try again.',
      };
    }

    return { success: true };
  } catch {
    return {
      success: false,
      error: 'Invalid verification token signature.',
    };
  }
}
