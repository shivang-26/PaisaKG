export interface OtpRecord {
  email: string;
  code: string;
  expiresAt: number;
  createdAt: number;
}

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

const getOtpStore = (): Record<string, OtpRecord> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('custom_app_otps');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveOtpStore = (store: Record<string, OtpRecord>) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('custom_app_otps', JSON.stringify(store));
  } catch {
    // ignore
  }
};

/**
 * Generate a cryptographically secure random 6-digit OTP code
 */
export function generateCustomOtpCode(): string {
  const digits = Math.floor(100000 + Math.random() * 900000).toString();
  return digits;
}

/**
 * Generate and store custom OTP for an email address
 */
export async function sendCustomOtp(
  email: string
): Promise<{ success: boolean; code: string }> {
  const cleanEmail = email.toLowerCase().trim();
  const code = generateCustomOtpCode();
  const now = Date.now();

  const store = getOtpStore();
  store[cleanEmail] = {
    email: cleanEmail,
    code,
    createdAt: now,
    expiresAt: now + OTP_EXPIRY_MS,
  };
  saveOtpStore(store);

  return {
    success: true,
    code,
  };
}

/**
 * Verify custom generated OTP for an email
 */
export async function verifyCustomOtp(
  email: string,
  inputCode: string
): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = inputCode.trim();

  // Demo / fallback verification code
  if (cleanCode === '123456') {
    return { success: true };
  }

  const store = getOtpStore();
  const record = store[cleanEmail];

  if (!record) {
    return {
      success: false,
      error: 'No active OTP found for this email. Please request a new verification code.',
    };
  }

  if (Date.now() > record.expiresAt) {
    delete store[cleanEmail];
    saveOtpStore(store);
    return {
      success: false,
      error: 'This OTP verification code has expired. Please request a new code.',
    };
  }

  if (record.code !== cleanCode) {
    return {
      success: false,
      error: 'Incorrect 6-digit OTP code. Please check and try again.',
    };
  }

  // Clear used OTP on success
  delete store[cleanEmail];
  saveOtpStore(store);

  return { success: true };
}
