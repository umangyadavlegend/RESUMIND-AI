import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Mail,
  Lock,
  User,
  Building,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RefreshCw,
  Info,
  ArrowLeft
} from 'lucide-react';
import { api } from '../services/api';
import { User as UserType } from '../types';

interface AuthPageProps {
  onAuthSuccess: (user: UserType) => void;
  onCancel: () => void;
  logoutNotification?: string | null;
  accessDeniedNotification?: string | null;
}

type AuthMode = 'login' | 'login_otp' | 'register' | 'register_otp' | 'forgot_password' | 'reset_password';

export const AuthPage: React.FC<AuthPageProps> = ({
  onAuthSuccess,
  onCancel,
  logoutNotification,
  accessDeniedNotification,
}) => {
  const [mode, setMode] = useState<AuthMode>('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Password reset states
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // UI status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  // 60-second OTP cooldown timer
  const [cooldown, setCooldown] = useState(0);
  const [latestEmail, setLatestEmail] = useState<any>(null);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Check mailbox for dispatched verification emails
  useEffect(() => {
    if (mode === 'register_otp' || mode === 'login_otp' || mode === 'reset_password') {
      const checkMailbox = async () => {
        try {
          const res = await api.getDevMailbox(email.trim());
          if (res.emails && res.emails.length > 0) {
            setLatestEmail(res.emails[0]);
          }
        } catch {
          // ignore
        }
      };
      checkMailbox();
      const interval = setInterval(checkMailbox, 1500);
      return () => clearInterval(interval);
    } else {
      setLatestEmail(null);
    }
  }, [mode, email]);

  const startCooldown = () => setCooldown(60);

  // 1. Login Step 1: Password Check -> Request Login OTP
  const handleLoginStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.login({ email: email.trim(), password });
      setSuccessInfo(res.message || 'Verification code dispatched to your registered email.');
      setOtpCode('');
      startCooldown();
      setMode('login_otp');
    } catch (err: any) {
      setError(err.message || 'Incorrect email or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Login Step 2: Validate Login OTP -> Establish Session
  const handleLoginStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.verifyLoginOtp({ email: email.trim(), otp: otpCode.trim() });
      onAuthSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Registration Step 1: Submit Details -> Request Registration OTP
  const handleRegisterStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify and re-enter.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.register({
        full_name: fullName.trim(),
        email: email.trim(),
        phone_number: phoneNumber.trim(),
        company_name: companyName.trim(),
        password,
        confirm_password: confirmPassword,
      });
      setSuccessInfo(res.message || 'Account created. Please enter the 6-digit code sent to your email.');
      setOtpCode('');
      startCooldown();
      setMode('register_otp');
    } catch (err: any) {
      setError(err.message || 'Registration failed. A user with this email may already exist.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Registration Step 2: Validate Registration OTP -> Activate Account
  const handleRegisterStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.verifyRegistrationOtp({ email: email.trim(), otp: otpCode.trim() });
      setSuccessInfo(res.message || 'Email verified successfully! Please sign in with your password.');
      setOtpCode('');
      setPassword('');
      setConfirmPassword('');
      setMode('login');
    } catch (err: any) {
      setError(err.message || 'Invalid verification code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Resend OTP Handler with cooldown
  const handleResend = async (purpose: 'registration' | 'login' | 'reset') => {
    if (cooldown > 0) return;
    setError(null);
    setLoading(true);

    try {
      const res = await api.resendOtp({ email: email.trim(), purpose });
      setSuccessInfo(res.message || 'A new verification code has been dispatched to your email.');
      startCooldown();
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please wait before retrying.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Forgot Password Step 1
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.forgotPassword({ email: email.trim() });
      setSuccessInfo(res.message || 'If an account exists, a reset code was sent.');
      setOtpCode('');
      startCooldown();
      setMode('reset_password');
    } catch (err: any) {
      setError(err.message || 'Unable to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  // 7. Reset Password Step 2
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.resetPassword({
        email: email.trim(),
        otp: otpCode.trim(),
        new_password: newPassword,
        confirm_password: confirmNewPassword,
      });
      setSuccessInfo(res.message || 'Password updated! You may now sign in.');
      setPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setOtpCode('');
      setMode('login');
    } catch (err: any) {
      setError(err.message || 'Password reset failed. Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden selection:bg-accent-red selection:text-white">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[450px] bg-accent-red/10 blur-[130px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-surface-card border border-border-hover rounded-3xl shadow-2xl p-6 sm:p-8 relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-accent-red mx-auto flex items-center justify-center text-white shadow-glow-red mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">RESUMIND AI</h2>
          <p className="text-xs text-primary-secondary mt-1">
            {mode === 'login' && 'Sign in to your recruiter workspace'}
            {mode === 'login_otp' && 'Two-factor security verification'}
            {mode === 'register' && 'Create your enterprise recruiter account'}
            {mode === 'register_otp' && 'Verify your work email address'}
            {mode === 'forgot_password' && 'Reset your account password'}
            {mode === 'reset_password' && 'Enter verification code & new password'}
          </p>
        </div>

        {/* Logout Notification Banner */}
        {logoutNotification && (
          <div className="mb-4 p-3.5 rounded-xl bg-status-success/10 border border-status-success/30 text-xs text-status-success flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{logoutNotification}</span>
          </div>
        )}

        {/* Access Denied Banner */}
        {accessDeniedNotification && (
          <div className="mb-4 p-3.5 rounded-xl bg-status-warning/10 border border-status-warning/30 text-xs text-status-warning flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{accessDeniedNotification}</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-status-danger/10 border border-status-danger/30 text-xs text-status-danger flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Success info banner */}
        {successInfo && (
          <div className="mb-4 p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-400 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successInfo}</span>
          </div>
        )}

        {/* Tab switch (only on top-level login/register) */}
        {(mode === 'login' || mode === 'register') && (
          <div className="flex bg-surface p-1 rounded-xl border border-border-subtle mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); setSuccessInfo(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'login' ? 'bg-surface-card text-white shadow-card' : 'text-primary-secondary hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); setSuccessInfo(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'register' ? 'bg-surface-card text-white shadow-card' : 'text-primary-secondary hover:text-white'
              }`}
            >
              Register
            </button>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* VIEW 1: LOGIN STEP 1 (EMAIL + PASSWORD)                            */}
        {/* ----------------------------------------------------------------- */}
        {mode === 'login' && (
          <form onSubmit={handleLoginStep1} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-primary-secondary mb-1">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-primary-muted absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="recruiter@company.com"
                  className="w-full bg-surface border border-border-subtle rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent-red transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-primary-secondary">Password</label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot_password'); setError(null); setSuccessInfo(null); }}
                  className="text-[11px] text-accent-red hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-primary-muted absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-surface border border-border-subtle rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent-red transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-accent-red hover:bg-accent-redHover text-white font-bold text-sm transition-all shadow-glow-subtle flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Sign In with Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* VIEW 2: LOGIN STEP 2 (LOGIN EMAIL OTP)                             */}
        {/* ----------------------------------------------------------------- */}
        {mode === 'login_otp' && (
          <form onSubmit={handleLoginStep2} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-surface border border-accent-red/30">
              <span className="text-[11px] text-primary-muted block">Two-Factor Security Code sent to:</span>
              <span className="text-sm font-mono font-bold text-white">{email}</span>
              <span className="text-[11px] text-primary-secondary block mt-1">Code valid for 5 minutes.</span>
            </div>

            {latestEmail && (
              <div className="p-3.5 rounded-2xl bg-surface border border-accent-red/40 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-accent-red" />
                    <span>Dispatched Security Code</span>
                  </span>
                  <span className="font-mono text-[10px] text-status-success font-semibold bg-status-success/15 px-2 py-0.5 rounded border border-status-success/30">
                    {latestEmail.mode === 'smtp_live' ? 'SMTP Inbox' : 'Dispatched Mailbox'}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-surface-card p-3 rounded-xl border border-border-subtle">
                  <div>
                    <span className="text-[10px] text-primary-muted block">Your 6-Digit Login Code</span>
                    <span className="font-mono text-xl font-extrabold tracking-widest text-white">{latestEmail.otp_code}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtpCode(latestEmail.otp_code)}
                    className="px-3 py-1.5 rounded-xl bg-accent-red hover:bg-accent-redHover text-white text-xs font-bold transition-all shadow-glow-subtle flex items-center gap-1"
                  >
                    <span>Insert Code</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-primary-secondary mb-1">
                Enter 6-Digit Verification Code
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-primary-muted absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full bg-surface border border-border-subtle rounded-xl pl-10 pr-3 py-2.5 text-white font-mono tracking-widest focus:outline-none focus:border-accent-red transition-colors text-center font-bold text-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full py-3 rounded-xl bg-accent-red hover:bg-accent-redHover text-white font-bold text-sm transition-all shadow-glow-subtle flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify OTP & Access Dashboard</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => handleResend('login')}
                disabled={cooldown > 0 || loading}
                className="text-primary-secondary hover:text-white disabled:opacity-40 underline"
              >
                {cooldown > 0 ? `Resend Code (${cooldown}s)` : 'Resend Code'}
              </button>
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null); }}
                className="text-primary-secondary hover:text-white"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* VIEW 3: REGISTRATION STEP 1 (REAL USER DETAILS)                    */}
        {/* ----------------------------------------------------------------- */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterStep1} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-primary-secondary mb-1">Full Real Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-primary-muted absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-surface border border-border-subtle rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-accent-red transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-primary-secondary mb-1">Work Email *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-primary-muted absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="recruiter@enterprise.com"
                  className="w-full bg-surface border border-border-subtle rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-accent-red transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-primary-secondary mb-1">Phone (Optional)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-primary-muted absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-surface border border-border-subtle rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-accent-red transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-primary-secondary mb-1">Company</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-primary-muted absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full bg-surface border border-border-subtle rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-accent-red transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-primary-secondary mb-1">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-primary-muted absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 chars"
                    className="w-full bg-surface border border-border-subtle rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-accent-red transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-primary-secondary mb-1">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-primary-muted absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter"
                    className="w-full bg-surface border border-border-subtle rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-accent-red transition-colors"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-accent-red hover:bg-accent-redHover text-white font-bold text-sm transition-all shadow-glow-subtle flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Create Account & Send Verification Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* VIEW 4: REGISTRATION STEP 2 (REGISTRATION EMAIL OTP)               */}
        {/* ----------------------------------------------------------------- */}
        {mode === 'register_otp' && (
          <form onSubmit={handleRegisterStep2} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-surface border border-accent-red/30">
              <span className="text-[11px] text-primary-muted block">Account Verification Code sent to:</span>
              <span className="text-sm font-mono font-bold text-white">{email}</span>
              <span className="text-[11px] text-primary-secondary block mt-1">Code valid for 5 minutes. Check spam folder if not visible.</span>
            </div>

            {latestEmail && (
              <div className="p-3.5 rounded-2xl bg-surface border border-accent-red/40 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-accent-red" />
                    <span>Dispatched Verification Email</span>
                  </span>
                  <span className="font-mono text-[10px] text-status-success font-semibold bg-status-success/15 px-2 py-0.5 rounded border border-status-success/30">
                    {latestEmail.mode === 'smtp_live' ? 'SMTP Inbox' : 'Dispatched Mailbox'}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-surface-card p-3 rounded-xl border border-border-subtle">
                  <div>
                    <span className="text-[10px] text-primary-muted block">Your 6-Digit Activation Code</span>
                    <span className="font-mono text-xl font-extrabold tracking-widest text-white">{latestEmail.otp_code}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtpCode(latestEmail.otp_code)}
                    className="px-3 py-1.5 rounded-xl bg-accent-red hover:bg-accent-redHover text-white text-xs font-bold transition-all shadow-glow-subtle flex items-center gap-1"
                  >
                    <span>Insert Code</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-primary-secondary mb-1">
                Enter 6-Digit Code
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-primary-muted absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full bg-surface border border-border-subtle rounded-xl pl-10 pr-3 py-2.5 text-white font-mono tracking-widest focus:outline-none focus:border-accent-red transition-colors text-center font-bold text-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full py-3 rounded-xl bg-accent-red hover:bg-accent-redHover text-white font-bold text-sm transition-all shadow-glow-subtle flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify Email & Activate Account</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => handleResend('registration')}
                disabled={cooldown > 0 || loading}
                className="text-primary-secondary hover:text-white disabled:opacity-40 underline"
              >
                {cooldown > 0 ? `Resend Code (${cooldown}s)` : 'Resend Code'}
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(null); }}
                className="text-primary-secondary hover:text-white"
              >
                Change Details
              </button>
            </div>
          </form>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* VIEW 5: FORGOT PASSWORD REQUEST                                   */}
        {/* ----------------------------------------------------------------- */}
        {mode === 'forgot_password' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-primary-secondary mb-1">Account Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-primary-muted absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@company.com"
                  className="w-full bg-surface border border-border-subtle rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent-red transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-accent-red hover:bg-accent-redHover text-white font-bold text-sm transition-all shadow-glow-subtle flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Send Password Reset Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null); }}
                className="text-xs text-primary-secondary hover:text-white"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* VIEW 6: RESET PASSWORD (OTP + NEW PASSWORDS)                      */}
        {/* ----------------------------------------------------------------- */}
        {mode === 'reset_password' && (
          <form onSubmit={handleResetPassword} className="space-y-3.5">
            <div className="p-3 rounded-xl bg-surface border border-accent-red/30">
              <span className="text-[11px] text-primary-muted block">Password reset code dispatched to:</span>
              <span className="text-sm font-mono font-bold text-white">{email}</span>
            </div>

            {latestEmail && (
              <div className="p-3 rounded-xl bg-surface border border-accent-red/40 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-accent-red" />
                    <span>Password Reset Code</span>
                  </span>
                  <span className="font-mono text-[10px] text-status-success font-semibold bg-status-success/15 px-2 py-0.5 rounded border border-status-success/30">
                    {latestEmail.mode === 'smtp_live' ? 'SMTP Inbox' : 'Dispatched Mailbox'}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-surface-card p-2.5 rounded-xl border border-border-subtle">
                  <div>
                    <span className="text-[10px] text-primary-muted block">6-Digit Reset Code</span>
                    <span className="font-mono text-lg font-extrabold tracking-widest text-white">{latestEmail.otp_code}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtpCode(latestEmail.otp_code)}
                    className="px-3 py-1 rounded-lg bg-accent-red hover:bg-accent-redHover text-white text-xs font-bold transition-all shadow-glow-subtle flex items-center gap-1"
                  >
                    <span>Insert Code</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-primary-secondary mb-1">6-Digit Reset Code</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-primary-muted absolute left-3.5 top-3" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full bg-surface border border-border-subtle rounded-xl pl-10 pr-3 py-2 text-white font-mono tracking-widest text-center font-bold text-base focus:outline-none focus:border-accent-red transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-primary-secondary mb-1">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-primary-muted absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-surface border border-border-subtle rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-accent-red transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-primary-secondary mb-1">Confirm New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-primary-muted absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full bg-surface border border-border-subtle rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-accent-red transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full py-3 rounded-xl bg-accent-red hover:bg-accent-redHover text-white font-bold text-sm transition-all shadow-glow-subtle flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Update Password & Sign In</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={() => handleResend('reset')}
                disabled={cooldown > 0 || loading}
                className="text-primary-secondary hover:text-white disabled:opacity-40 underline"
              >
                {cooldown > 0 ? `Resend Code (${cooldown}s)` : 'Resend Code'}
              </button>
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null); }}
                className="text-primary-secondary hover:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Back to landing */}
        <div className="mt-6 pt-4 border-t border-border-subtle text-center">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-primary-muted hover:text-white transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Landing Page</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
