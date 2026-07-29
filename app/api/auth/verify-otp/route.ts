import { NextRequest, NextResponse } from 'next/server';
import { verifySignedOtpToken } from '@/lib/serverOtpStore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code, token: bodyToken } = body || {};

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Email address and 6-digit verification code are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanCode = code.toString().trim();

    // Retrieve token from body or HTTP-only cookie
    const cookieToken = req.cookies.get(`otp_token_${encodeURIComponent(cleanEmail)}`)?.value;
    const tokenToVerify = bodyToken || cookieToken;

    // Verify token statelessly
    const result = verifySignedOtpToken(cleanEmail, cleanCode, tokenToVerify);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Invalid verification code.' },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'OTP verification successful.',
    });

    // Clear cookie on success
    response.cookies.delete(`otp_token_${encodeURIComponent(cleanEmail)}`);

    return response;
  } catch (err: any) {
    console.error('[API Verify OTP Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error verifying OTP.' },
      { status: 500 }
    );
  }
}
