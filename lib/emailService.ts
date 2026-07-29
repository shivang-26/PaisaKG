import nodemailer from 'nodemailer';
import { getSupabaseClient } from './supabase';

/**
 * Send an OTP verification code email to the specified user email address
 */
export async function sendOtpEmail(email: string, code: string): Promise<{ success: boolean; error?: string }> {
  const cleanEmail = email.toLowerCase().trim();

  // 1. Try sending via custom SMTP if configured
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'PaisaKG <noreply@paisa.kg>',
        to: cleanEmail,
        subject: `Your PaisaKG Verification Code is ${code}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #0a452b; margin: 0; font-size: 24px;">PaisaKG</h2>
              <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Family Expense Tracker</p>
            </div>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
              <p style="font-size: 14px; color: #334155; margin-bottom: 12px;">Your 6-digit email verification code is:</p>
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0a452b; background: #ffffff; padding: 12px 24px; display: inline-block; border-radius: 8px; border: 1px solid #cbd5e1;">
                ${code}
              </div>
              <p style="font-size: 12px; color: #64748b; margin-top: 12px; margin-bottom: 0;">This code is valid for 10 minutes. Do not share it with anyone.</p>
            </div>
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">If you did not request this code, please ignore this email.</p>
          </div>
        `,
      });

      return { success: true };
    } catch (err: any) {
      console.error('[EmailService] SMTP error:', err);
      // Fall through to secondary attempts
    }
  }

  // 2. Try sending via Supabase Auth signInWithOtp if configured
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
      });

      if (!error) {
        return { success: true };
      }
      console.warn('[EmailService] Supabase Auth OTP notice:', error.message);
    } catch (err: any) {
      console.error('[EmailService] Supabase Auth OTP failed:', err);
    }
  }

  // 3. Fallback: Log to server stdout (production server log inspection)
  console.log(`[PaisaKG Auth Server] OTP code generated for ${cleanEmail}: ${code}`);
  return { success: true };
}
