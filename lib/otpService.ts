/**
 * Client-side OTP API service calling secure server-side routes
 */

const tokenStore: Record<string, string> = {};

export async function sendCustomOtp(
  email: string,
  isSignUp?: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanEmail = email.toLowerCase().trim();
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, isSignUp }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Failed to send verification code. Please try again.',
      };
    }

    if (data.otpToken) {
      tokenStore[cleanEmail] = data.otpToken;
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error sending OTP request.',
    };
  }
}

export async function verifyCustomOtp(
  email: string,
  inputCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanEmail = email.toLowerCase().trim();
    const token = tokenStore[cleanEmail];

    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, code: inputCode, token }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Invalid 6-digit verification code.',
      };
    }

    delete tokenStore[cleanEmail];
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error verifying OTP code.',
    };
  }
}
