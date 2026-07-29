import crypto from 'crypto';

export interface ServerOtpRecord {
  email: string;
  code: string;
  expiresAt: number;
}

// Global in-memory cache for server-side OTP management
const globalForOtp = global as unknown as {
  otpCache?: Map<string, ServerOtpRecord>;
};

const otpCache = globalForOtp.otpCache || new Map<string, ServerOtpRecord>();
if (process.env.NODE_ENV !== 'production') {
  globalForOtp.otpCache = otpCache;
}

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Generate a cryptographically secure 6-digit random string
 */
export function generateSecureOtpCode(): string {
  const buffer = crypto.randomBytes(4);
  const num = buffer.readUInt32BE(0) % 900000 + 100000;
  return num.toString();
}

/**
 * Save an OTP code for an email on the server
 */
export function setServerOtp(email: string, code: string): void {
  const cleanEmail = email.toLowerCase().trim();
  const expiresAt = Date.now() + OTP_TTL_MS;
  otpCache.set(cleanEmail, {
    email: cleanEmail,
    code,
    expiresAt,
  });
}

/**
 * Verify an OTP code for an email on the server
 */
export function verifyAndConsumeServerOtp(email: string, inputCode: string): { success: boolean; error?: string } {
  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = inputCode.trim();

  const record = otpCache.get(cleanEmail);

  if (!record) {
    return {
      success: false,
      error: 'No active OTP verification session found for this email. Please request a new code.',
    };
  }

  if (Date.now() > record.expiresAt) {
    otpCache.delete(cleanEmail);
    return {
      success: false,
      error: 'The verification code has expired. Please request a new OTP code.',
    };
  }

  if (record.code !== cleanCode) {
    return {
      success: false,
      error: 'Invalid 6-digit verification code. Please check your email and try again.',
    };
  }

  // Clear code after successful verification (one-time use)
  otpCache.delete(cleanEmail);
  return { success: true };
}
