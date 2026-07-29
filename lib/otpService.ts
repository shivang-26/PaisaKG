/**
 * Client-side OTP API service calling secure server-side routes
 */

export async function sendCustomOtp(
  email: string,
  isSignUp?: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, isSignUp }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Failed to send verification code. Please try again.',
      };
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
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code: inputCode }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Invalid 6-digit verification code.',
      };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error verifying OTP code.',
    };
  }
}
