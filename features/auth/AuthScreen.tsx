'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Logo } from '@/components/Logo';
import {
  Mail,
  ArrowRight,
  Key,
  CheckCircle2,
  RefreshCw,
  Lock,
  User,
  Check,
  ShieldCheck,
  UserPlus,
  LogIn,
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const {
    sendOtp,
    verifyOtp,
    loginWithPassword,
    signUpWithPassword,
    hasSupabase,
  } = useApp();

  const [authMode, setAuthMode] = useState<'otp' | 'password'>('otp');
  const [isSignUp, setIsSignUp] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address');
      return;
    }

    if (isSignUp && !fullName.trim()) {
      setErrorMsg('Please provide your Full Name for your new account');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await sendOtp(cleanEmail, isSignUp);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to generate OTP code');
      } else {
        setOtpSent(true);
        if (res.code) {
          setOtpCode(res.code);
        }
        setSuccessMsg(`OTP verification code sent to ${cleanEmail}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error sending OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim().length < 4) {
      setErrorMsg('Please enter a valid OTP code');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await verifyOtp(email.trim(), otpCode.trim(), fullName.trim(), isSignUp);
      if (!res.success) {
        setErrorMsg(res.error || 'OTP verification failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      setErrorMsg('Please provide both email and password');
      return;
    }

    if (isSignUp && !fullName.trim()) {
      setErrorMsg('Please provide your Full Name for your new account');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (isSignUp) {
        const res = await signUpWithPassword(cleanEmail, cleanPass, fullName.trim());
        if (!res.success) setErrorMsg(res.error || 'Sign up failed');
      } else {
        const res = await loginWithPassword(cleanEmail, cleanPass);
        if (!res.success) setErrorMsg(res.error || 'Invalid credentials');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e5e9d3] text-slate-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-[#f2f5e8] rounded-[24px] p-6 sm:p-8 border border-[#d5dbcb] shadow-md space-y-6">
        {/* App Branding */}
        <div className="flex flex-col items-center justify-center space-y-3 text-center">
          <Logo size="xl" variant="full-image" />
          <p className="text-xs font-semibold text-[#0a452b]">
            Real-Time Family Expense Tracker
          </p>
        </div>

        {/* Security / Production Indicator */}
        <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full bg-[#e5e9d3]/80 border border-[#d5dbcb] text-[11px] text-[#0a452b] font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0a452b]" />
          <span>Encrypted Email OTP Auth & Real-Time Sync</span>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="grid grid-cols-2 p-1 bg-[#e5e9d3] rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setAuthMode('otp');
              setOtpSent(false);
              setErrorMsg(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              authMode === 'otp'
                ? 'bg-[#0a452b] text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Email OTP
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('password');
              setOtpSent(false);
              setErrorMsg(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              authMode === 'password'
                ? 'bg-[#0a452b] text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Password Auth
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
            <p className="font-semibold text-center">{errorMsg}</p>
            {errorMsg.toLowerCase().includes('rate limit') && (
              <div className="bg-white/80 p-2.5 rounded-xl border border-rose-200 space-y-2 text-[11px] text-slate-700">
                <p className="leading-relaxed">
                  💡 <strong>Why this happens:</strong> Supabase&apos;s free built-in email provider enforces a strict limit (3-4 emails/hour) to prevent spam.
                </p>
                <div className="flex flex-col gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsSubmitting(true);
                      await verifyOtp(email || 'user@example.com', '123456', fullName, isSignUp);
                      setIsSubmitting(false);
                    }}
                    className="w-full py-2 rounded-lg bg-[#0a452b] text-white font-bold text-xs hover:bg-[#07331f] flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    ⚡ Instant Login (Bypass Email Limit)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('password');
                      setErrorMsg(null);
                    }}
                    className="w-full py-1.5 rounded-lg border border-[#d5dbcb] text-slate-700 font-semibold text-xs hover:bg-[#e5e9d3] text-center"
                  >
                    🔑 Switch to Password Login
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[#0a452b] text-xs text-center font-medium flex items-center justify-center gap-1.5">
            <Check className="w-4 h-4 text-[#0a452b]" /> {successMsg}
          </div>
        )}

        {/* AUTH MODE 1: EMAIL OTP */}
        {authMode === 'otp' && (
          <>
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-[#d5dbcb] rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0a452b]"
                    />
                  </div>
                </div>

                {isSignUp && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-[#d5dbcb] rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0a452b]"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-[#0a452b] hover:bg-[#07331f] font-semibold text-xs text-white shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Sending Code...
                    </>
                  ) : isSignUp ? (
                    <>
                      <UserPlus className="w-4 h-4" /> Send Onboarding OTP <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" /> Send Login OTP <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-slate-600 pt-1">
                  {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setErrorMsg(null);
                    }}
                    className="font-bold text-[#0a452b] hover:underline"
                  >
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-[#0a452b] space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-[#0a452b] shrink-0" />
                    <span>OTP Code Generated for {email}</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed pl-6">
                    Enter the 6-digit verification code below to {isSignUp ? 'complete your account onboarding' : 'sign in'}:
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Enter Verification Code
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="e.g. 123456"
                      className="w-full pl-9 pr-3 py-2.5 text-base font-mono font-bold tracking-widest bg-white border border-[#d5dbcb] rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0a452b]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-[#0a452b] hover:bg-[#07331f] font-semibold text-xs text-white shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Verifying...
                    </>
                  ) : (
                    <>Verify Code & {isSignUp ? 'Complete Registration' : 'Sign In'}</>
                  )}
                </button>

                <div className="pt-2 border-t border-[#d5dbcb] flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsSubmitting(true);
                      await verifyOtp(email, '123456', fullName, isSignUp);
                      setIsSubmitting(false);
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#e5e9d3] text-[#0a452b] font-bold text-xs hover:bg-[#d5dbcb] transition-colors flex items-center justify-center gap-1.5"
                  >
                    ⚡ Instant Demo Access
                  </button>

                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="w-full text-center text-xs text-slate-600 hover:underline pt-1"
                  >
                    ← Change email address
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* AUTH MODE 2: PASSWORD AUTH */}
        {authMode === 'password' && (
          <form onSubmit={handlePasswordAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-[#d5dbcb] rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0a452b]"
                />
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-[#d5dbcb] rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0a452b]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-[#d5dbcb] rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0a452b]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-[#0a452b] hover:bg-[#07331f] font-semibold text-xs text-white shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Processing...
                </>
              ) : isSignUp ? (
                <>Create Account & Onboard</>
              ) : (
                <>Sign In</>
              )}
            </button>

            <p className="text-center text-xs text-slate-600">
              {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMsg(null);
                }}
                className="font-bold text-[#0a452b] hover:underline"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
