import { NextRequest, NextResponse } from 'next/server';
import { verifyAndConsumeServerOtp } from '@/lib/serverOtpStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code } = body || {};

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Email address and 6-digit verification code are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.toString().trim();

    // Verify against server-side store
    const result = verifyAndConsumeServerOtp(cleanEmail, cleanCode);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Invalid verification code.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP verification successful.',
    });
  } catch (err: any) {
    console.error('[API Verify OTP Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error verifying OTP.' },
      { status: 500 }
    );
  }
}
