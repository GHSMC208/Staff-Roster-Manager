import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  Mail, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  X, 
  RotateCcw, 
  Sparkles, 
  ShieldCheck, 
  Copy, 
  Check, 
  Send,
  Building2,
  Clock
} from 'lucide-react';
import { 
  DEFAULT_INITIAL_PASSWORD, 
  verifyPassword, 
  updateUserPassword, 
  generateAndSendOtp, 
  verifyOtp,
  SimulatedEmailDispatch 
} from '../lib/authSecurityService';

export interface PendingAuthUser {
  id?: string;
  name: string;
  email: string;
  role?: string;
  nurseDesignation?: string;
  jobTitle?: string;
  photoUrl?: string;
  wardName?: string;
  staffMemberId?: string;
  userAccount?: any;
  staffMember?: any;
}

interface PasswordAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: PendingAuthUser | null;
  onSuccessLogin: (user: PendingAuthUser) => void;
  initialMode?: 'enter_password' | 'otp_reset';
}

export const PasswordAuthModal: React.FC<PasswordAuthModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  onSuccessLogin,
  initialMode = 'enter_password'
}) => {
  // Modal View: 'enter_password' | 'otp_reset' | 'reset_success'
  const [viewMode, setViewMode] = useState<'enter_password' | 'otp_reset' | 'reset_success'>(initialMode);
  
  // Login fields
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // OTP Reset fields
  const [otpInput, setOtpInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccessMessage, setOtpSuccessMessage] = useState<string | null>(null);
  const [activeDispatch, setActiveDispatch] = useState<SimulatedEmailDispatch | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Reset state when modal opens or targetUser changes
  useEffect(() => {
    if (isOpen) {
      const mode = initialMode || 'enter_password';
      setViewMode(mode);
      setPasswordInput('');
      setShowPassword(false);
      setLoginError(null);
      setOtpInput('');
      setNewPassword('');
      setConfirmPassword('');
      setShowNewPassword(false);
      setOtpError(null);
      setOtpSuccessMessage(null);
      setResendCooldown(0);
      setCopiedOtp(false);

      if (mode === 'otp_reset' && targetUser) {
        // Automatically dispatch OTP to the user's email for instant change password convenience
        const { otp, emailDispatch } = generateAndSendOtp(targetUser.email, targetUser.name);
        setActiveDispatch(emailDispatch);
        setResendCooldown(30);
        setOtpSuccessMessage(`Security verification OTP has been dispatched to ${targetUser.email}!`);
      } else {
        setActiveDispatch(null);
      }
    }
  }, [isOpen, targetUser, initialMode]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  if (!isOpen || !targetUser) return null;

  // 1. Handle Password Sign-In
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanPassword = passwordInput.trim();
    if (!cleanPassword) {
      setLoginError('Please enter your password to sign in.');
      return;
    }

    // Verify against saved password or default '123456'
    const isPrimaryValid = verifyPassword(targetUser.email, cleanPassword);
    const isIdValid = targetUser.id ? verifyPassword(targetUser.id, cleanPassword) : false;
    const isStaffIdValid = targetUser.staffMemberId ? verifyPassword(targetUser.staffMemberId, cleanPassword) : false;

    if (isPrimaryValid || isIdValid || isStaffIdValid) {
      onSuccessLogin(targetUser);
      onClose();
    } else {
      setLoginError(
        'Incorrect password. The initial default password is 123456. If you changed your password or forgot it, click "Verify via Email OTP" below.'
      );
    }
  };

  // Quick fill default password '123456'
  const handleFillDefaultPassword = () => {
    setPasswordInput(DEFAULT_INITIAL_PASSWORD);
    setLoginError(null);
  };

  // 2. Handle Send OTP
  const handleSendOtp = () => {
    setOtpError(null);
    setOtpSuccessMessage(null);

    const { otp, emailDispatch } = generateAndSendOtp(targetUser.email, targetUser.name);
    setActiveDispatch(emailDispatch);
    setResendCooldown(30);
    setOtpSuccessMessage(`Security verification OTP has been dispatched to ${targetUser.email}!`);
  };

  // Auto-fill OTP from dispatch banner
  const handleAutoFillOtp = (code: string) => {
    setOtpInput(code);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  // 3. Handle Verify OTP and Reset Password
  const handleOtpResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);

    // 1. Verify OTP code
    const otpResult = verifyOtp(targetUser.email, otpInput);
    if (!otpResult.success) {
      setOtpError(otpResult.message || 'Invalid OTP code.');
      return;
    }

    // 2. Validate New Password
    if (!newPassword || newPassword.trim().length < 4) {
      setOtpError('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setOtpError('New password and confirmation do not match.');
      return;
    }

    // 3. Update password in storage
    const success = updateUserPassword(targetUser.email, newPassword, targetUser.staffMemberId || targetUser.id);
    if (success) {
      setViewMode('reset_success');
      setPasswordInput(newPassword);
    } else {
      setOtpError('Failed to update password. Please try again.');
    }
  };

  const getRoleBadge = () => {
    const desig = targetUser.nurseDesignation || targetUser.role;
    if (desig === 'GCNS' || targetUser.role === 'admin') {
      return { label: '1. GCNS • General Chief Nursing Services', bg: 'bg-indigo-600 text-white' };
    }
    if (desig === 'CNS' || targetUser.role === 'cns') {
      return { label: '2. CNS • Chief Nursing Services', bg: 'bg-purple-600 text-white' };
    }
    if (desig === 'DCNS' || targetUser.role === 'dcns') {
      return { label: '2. DCNS • Deputy Chief Nursing Services', bg: 'bg-indigo-700 text-white' };
    }
    if (desig === 'HN' || targetUser.role === 'head_nurse') {
      return { label: '3. HN • Head Nurse', bg: 'bg-amber-600 text-white' };
    }
    if (desig === 'NS' || targetUser.role === 'nurse_supervisor') {
      return { label: '4. NS • Nurse Supervisor (Team Leader)', bg: 'bg-cyan-600 text-white' };
    }
    if (desig === 'MSA' || desig === 'HA') {
      return { label: '5. MSA • Medical Service Aid', bg: 'bg-teal-700 text-white' };
    }
    return { label: '5. SN • Staff Nurse', bg: 'bg-emerald-700 text-white' };
  };

  const badge = getRoleBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl ${
              viewMode === 'enter_password'
                ? 'bg-indigo-600/30 border-indigo-500/40 text-indigo-400'
                : viewMode === 'otp_reset'
                ? 'bg-purple-600/30 border-purple-500/40 text-purple-400'
                : 'bg-emerald-600/30 border-emerald-500/40 text-emerald-400'
            } border flex items-center justify-center shadow-inner`}>
              {viewMode === 'enter_password' ? <Lock size={20} /> : viewMode === 'otp_reset' ? <KeyRound size={20} /> : <CheckCircle2 size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white tracking-tight">
                  {viewMode === 'enter_password' 
                    ? 'Hospital Sign-In Authentication' 
                    : viewMode === 'otp_reset' 
                    ? 'Change Account Password (OTP Method)' 
                    : 'Password Successfully Changed'}
                </h3>
                <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md">
                  Active Security
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {viewMode === 'enter_password'
                  ? 'Institutional Identity & Role Privilege Verification'
                  : `Update credentials for ${targetUser.name} via Email OTP verification`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Selected User Identity Banner */}
        <div className="p-4 bg-slate-800/40 border-b border-slate-800 flex items-center gap-3.5">
          <div className="relative shrink-0">
            {targetUser.photoUrl ? (
              <img 
                src={targetUser.photoUrl} 
                alt={targetUser.name} 
                className="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-500 shadow-md"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white font-black text-lg flex items-center justify-center shadow-md border border-indigo-400/40">
                {targetUser.name.charAt(0)}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-black text-white text-base leading-tight truncate">{targetUser.name}</h4>
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${badge.bg}`}>
                {badge.label}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
              <span className="font-mono text-indigo-300 truncate">{targetUser.email}</span>
              {targetUser.wardName && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <Building2 size={12} className="text-slate-400" />
                    {targetUser.wardName}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Body Content by View Mode */}
        <div className="p-6 space-y-5">
          {/* VIEW 1: ENTER PASSWORD */}
          {viewMode === 'enter_password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <KeyRound size={14} className="text-indigo-400" />
                    Account Password
                  </label>
                  <button
                    type="button"
                    onClick={handleFillDefaultPassword}
                    className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-tight transition hover:underline cursor-pointer flex items-center gap-1"
                    title="Click to quickly fill the initial default password"
                  >
                    <span>Use Default: <strong>123456</strong></span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setLoginError(null);
                    }}
                    placeholder="Enter password..."
                    autoFocus
                    className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700 rounded-2xl text-white font-medium placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-12 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Default password hint box */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-[11px] text-indigo-200">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-indigo-400 shrink-0" />
                    <span>Initial Default Password: <strong>123456</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={handleFillDefaultPassword}
                    className="px-2 py-0.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                  >
                    Fill (123456)
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 text-rose-400 mt-0.5" />
                  <span className="leading-snug">{loginError}</span>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="submit"
                  className="flex-1 py-3 px-5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer active:scale-98"
                >
                  <ShieldCheck size={16} />
                  <span>Sign In as {targetUser.name.split(' ')[0]}</span>
                  <ArrowRight size={14} />
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* Forgot / Change Password Link */}
              <div className="pt-2 border-t border-slate-800/80 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('otp_reset');
                    handleSendOtp();
                  }}
                  className="text-xs font-black text-indigo-400 hover:text-indigo-300 transition hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Mail size={13} />
                  <span>Forgot or Change Password? Verify via Email OTP</span>
                </button>
              </div>
            </form>
          )}

          {/* VIEW 2: OTP PASSWORD RESET */}
          {viewMode === 'otp_reset' && (
            <form onSubmit={handleOtpResetSubmit} className="space-y-4">
              {/* Simulated Mail Server Banner */}
              {activeDispatch && (
                <div className="p-3.5 bg-gradient-to-r from-indigo-950/90 to-purple-950/90 border border-indigo-700/60 rounded-2xl text-xs space-y-2.5 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-indigo-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                      <Mail size={12} className="text-indigo-400" />
                      Simulated Hospital Email Dispatch
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {activeDispatch.dispatchedAt}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-indigo-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-tight block">Your Verification OTP Code:</span>
                      <span className="font-mono text-xl font-black tracking-widest text-emerald-400">
                        {activeDispatch.otpCode}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAutoFillOtp(activeDispatch.otpCode)}
                      className={`px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition flex items-center gap-1 cursor-pointer ${
                        copiedOtp 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                      }`}
                    >
                      {copiedOtp ? (
                        <>
                          <Check size={12} />
                          <span>Inserted!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Insert Code</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {otpSuccessMessage && !activeDispatch && (
                <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                  <span>{otpSuccessMessage}</span>
                </div>
              )}

              {/* 1. Enter 6-digit OTP */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <KeyRound size={13} className="text-purple-400" />
                    Enter 6-Digit OTP Code
                  </label>
                  <button
                    type="button"
                    disabled={resendCooldown > 0}
                    onClick={handleSendOtp}
                    className={`text-[10px] font-black uppercase tracking-tight flex items-center gap-1 ${
                      resendCooldown > 0 
                        ? 'text-slate-500 cursor-not-allowed' 
                        : 'text-indigo-400 hover:text-indigo-300 cursor-pointer hover:underline'
                    }`}
                  >
                    <RotateCcw size={10} />
                    <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => {
                    setOtpInput(e.target.value.replace(/[^0-9]/g, ''));
                    setOtpError(null);
                  }}
                  placeholder="e.g. 123456"
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-center font-mono text-lg font-black tracking-widest text-emerald-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* 2. New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Lock size={13} className="text-indigo-400" />
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setOtpError(null);
                    }}
                    placeholder="Enter new password (min. 4 chars)..."
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-1 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* 3. Confirm New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Confirm New Password
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setOtpError(null);
                  }}
                  placeholder="Re-enter new password..."
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {otpError && (
                <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 text-rose-400 mt-0.5" />
                  <span className="leading-snug">{otpError}</span>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="submit"
                  className="flex-1 py-3 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
                >
                  <CheckCircle2 size={16} />
                  <span>Verify OTP &amp; Update Password</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (initialMode === 'otp_reset') {
                      onClose();
                    } else {
                      setViewMode('enter_password');
                    }
                  }}
                  className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  {initialMode === 'otp_reset' ? 'Cancel' : 'Back to Sign In'}
                </button>
              </div>
            </form>
          )}

          {/* VIEW 3: SUCCESS CONFIRMATION */}
          {viewMode === 'reset_success' && (
            <div className="py-4 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-in zoom-in">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-1">
                <h4 className="text-xl font-black text-white">Password Successfully Updated!</h4>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  Your new password is now active for <strong>{targetUser.email}</strong>. {initialMode === 'otp_reset' ? 'Your active session remains authenticated and secure.' : 'You can sign in immediately to access your hospital portal.'}
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    onSuccessLogin(targetUser);
                    onClose();
                  }}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
                >
                  <ShieldCheck size={16} />
                  <span>{initialMode === 'otp_reset' ? 'Done (Keep Working)' : 'Proceed to Sign In Directly'}</span>
                  <ArrowRight size={14} />
                </button>

                {initialMode !== 'otp_reset' && (
                  <button
                    type="button"
                    onClick={() => setViewMode('enter_password')}
                    className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    Return to Login Box
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
