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
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await sendOtp(email.trim());
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to send OTP code');
      } else {
        setOtpSent(true);
        if (!hasSupabase) {
          setOtpCode('123456'); // Local fallback OTP when offline / local mode
        }
        setSuccessMsg(`OTP sent to ${email.trim()}`);
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
      const res = await verifyOtp(email.trim(), otpCode.trim(), fullName.trim());
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
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please provide both email and password');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (isSignUp) {
        const res = await signUpWithPassword(email.trim(), password.trim(), fullName.trim());
        if (!res.success) setErrorMsg(res.error || 'Sign up failed');
      } else {
        const res = await loginWithPassword(email.trim(), password.trim());
        if (!res.success) setErrorMsg(res.error || 'Invalid credentials');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e5e9d3] dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-[#f2f5e8] dark:bg-slate-900 rounded-[24px] p-6 sm:p-8 border border-[#d5dbcb] dark:border-slate-800 shadow-md space-y-6">
        {/* App Branding */}
        <div className="flex flex-col items-center justify-center space-y-3 text-center">
          <Logo size="xl" variant="full-image" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Real-Time Family Expense Tracker
          </p>
        </div>

        {/* Security / Production Indicator */}
        <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full bg-[#e5e9d3]/80 dark:bg-slate-800/60 border border-[#d5dbcb] dark:border-slate-700/60 text-[11px] text-slate-700 dark:text-slate-300 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0a452b]" />
          <span>Encrypted Cloud Auth & Real-Time Sync</span>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="grid grid-cols-2 p-1 bg-[#e5e9d3] dark:bg-slate-800 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setAuthMode('otp');
              setErrorMsg(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              authMode === 'otp'
                ? 'bg-[#0a452b] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Email OTP / Magic Link
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('password');
              setErrorMsg(null);
            }}
            className={`py-2 rounded-lg transition-all ${
              authMode === 'password'
                ? 'bg-[#0a452b] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Password Auth
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs text-center font-medium dark:bg-rose-950/50 dark:border-rose-900 dark:text-rose-300">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[#0a452b] text-xs text-center font-medium flex items-center justify-center gap-1.5 dark:bg-emerald-950/50 dark:border-emerald-900 dark:text-emerald-300">
            <Check className="w-4 h-4 text-[#0a452b]" /> {successMsg}
          </div>
        )}

        {/* AUTH MODE 1: EMAIL OTP */}
        {authMode === 'otp' && (
          <>
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a452b]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name (Optional)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a452b]"
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
                      <RefreshCw className="w-4 h-4 animate-spin" /> Sending Code...
                    </>
                  ) : (
                    <>
                      Send Login OTP <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-[#0a452b] flex items-center gap-2 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-[#0a452b] shrink-0" />
                  <span>
                    OTP sent to <strong className="font-bold">{email}</strong>
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Enter Verification Code
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="Enter verification code"
                      className="w-full pl-9 pr-3 py-2.5 text-base font-mono font-bold tracking-widest bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a452b]"
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
                    <>Verify Code & Sign In</>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="w-full text-center text-xs text-slate-600 hover:underline"
                >
                  ← Back to email address
                </button>
              </form>
            )}
          </>
        )}

        {/* AUTH MODE 2: PASSWORD AUTH */}
        {authMode === 'password' && (
          <form onSubmit={handlePasswordAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a452b]"
                />
              </div>
            </div>

            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a452b]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0a452b]"
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
                <>Create Account</>
              ) : (
                <>Sign In</>
              )}
            </button>

            <p className="text-center text-xs text-slate-600">
              {isSignUp ? 'Already have an account?' : "Don't have an account yet?"}{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
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
