import { NextRequest, NextResponse } from 'next/server';
import { generateSecureOtpCode, setServerOtp } from '@/lib/serverOtpStore';
import { sendOtpEmail } from '@/lib/emailService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, isSignUp } = body || {};

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Generate secure random 6-digit code on the server
    const code = generateSecureOtpCode();

    // Store in server-side memory/cache with 10 minute expiration
    setServerOtp(cleanEmail, code);

    // Dispatch email
    const emailRes = await sendOtpEmail(cleanEmail, code);

    if (!emailRes.success) {
      return NextResponse.json(
        { success: false, error: emailRes.error || 'Failed to dispatch email verification code.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `OTP verification code dispatched to ${cleanEmail}.`,
    });
  } catch (err: any) {
    console.error('[API Send OTP Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error processing OTP request.' },
      { status: 500 }
    );
  }
}
