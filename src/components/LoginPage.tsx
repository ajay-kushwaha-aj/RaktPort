// src/components/LoginPage.tsx
// ═══════════════════════════════════════════════════════════════
// RaktPort — Secure Multi-Method Login
//
// Tab 1 — Smart Login (auto-detects): Internal ID / @rakt / Phone → OTP
// Tab 2 — Email + Password
// Also:  Google Sign-In
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useId, useMemo } from 'react';
import {
  loginUser, signInWithGoogle, initRecaptcha,
  lookupUserByInternalId, lookupUserByUsername, lookupUserByPhone,
  sendLoginOTP, verifyLoginOTP, resetPassword,
  type UserLookupResult,
} from '../lib/auth';
import {
  detectInputType, formatUsername, normalizePhone,
  type InputType,
} from '../lib/identity';
import { toast } from 'sonner';
import {
  Eye, EyeOff, Mail, Lock, UserCircle,
  Building2, Droplet, ShieldCheck, ArrowLeft,
  Phone, Search, Loader2, CheckCircle2,
  KeyRound, Smartphone, AtSign, Hash, Fingerprint,
} from 'lucide-react';
import logo from '../assets/raktport-logo.png';
import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';

/* ─── Props & Config ─── */

interface LoginPageProps {
  initialRole: string;
  onBack: () => void;
  onSignupClick: (role: string) => void;
}

type LoginTab = 'smart' | 'email';
type FlowStep = 'input' | 'found' | 'otp';

const ROLES = [
  { id: 'donor',     label: 'Donor',      Icon: Droplet,     color: 'from-red-500    to-pink-500'    },
  { id: 'hospital',  label: 'Hospital',   Icon: Building2,   color: 'from-blue-500   to-cyan-500'    },
  { id: 'bloodbank', label: 'Blood Bank', Icon: UserCircle,  color: 'from-purple-500 to-violet-500'  },
  { id: 'admin',     label: 'Admin',      Icon: ShieldCheck, color: 'from-emerald-500 to-teal-500'   },
] as const;

const TYPE_BADGE: Record<InputType, { label: string; Icon: any; color: string } | null> = {
  internalId: { label: 'User ID',   Icon: Fingerprint, color: 'bg-blue-100 text-blue-700'   },
  username:   { label: '@rakt',     Icon: AtSign,      color: 'bg-purple-100 text-purple-700'},
  phone:      { label: 'Phone',     Icon: Phone,       color: 'bg-green-100 text-green-700'  },
  email:      { label: 'Email',     Icon: Mail,        color: 'bg-amber-100 text-amber-700'  },
  unknown:    null,
};

/* ─── Sub-components ─── */

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function Spinner({ white = false }: { white?: boolean }) {
  return <span className={`inline-block w-4 h-4 border-2 rounded-full animate-spin flex-shrink-0 ${white ? 'border-white/30 border-t-white' : 'border-gray-200 border-t-gray-600'}`} aria-hidden="true" />;
}

function maskPhone(phone: string): string {
  const d = phone.replace(/\D/g, '');
  return d.length >= 4 ? `+91 ****${d.slice(-4)}` : phone;
}

/* ─── Main Component ─── */

export function LoginPage({ initialRole, onBack, onSignupClick }: LoginPageProps) {
  const uid = useId();

  // Role & tab
  const [role, setRole] = useState(initialRole || 'donor');
  const [tab, setTab] = useState<LoginTab>('smart');
  const [flowStep, setFlowStep] = useState<FlowStep>('input');

  // Smart input
  const [smartInput, setSmartInput] = useState('');
  const detectedType = useMemo(() => detectInputType(smartInput), [smartInput]);
  const badge = TYPE_BADGE[detectedType];

  // Email input
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Forgot Password
  const [showForgotPwd, setShowForgotPwd] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // OTP
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(0);
  const [recaptchaV, setRecaptchaV] = useState<RecaptchaVerifier | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);

  // Lookup result
  const [foundUser, setFoundUser] = useState<UserLookupResult | null>(null);

  // Loading
  const [lookupLoading, setLookupLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [gLoading, setGLoading] = useState(false);

  const current = ROLES.find(r => r.id === role) ?? ROLES[0];
  const roleIdx = ROLES.findIndex(r => r.id === role);
  const anyBusy = lookupLoading || otpSending || verifyLoading || loginLoading || gLoading;

  // ── Resets ──
  const resetFlow = useCallback(() => {
    setFlowStep('input');
    setFoundUser(null);
    setOtp(['', '', '', '', '', '']);
    setConfirmation(null);
    setResendTimer(0);
  }, []);

  useEffect(() => { resetFlow(); }, [role, tab]);

  useEffect(() => {
    const v = initRecaptcha('lp-recaptcha');
    setRecaptchaV(v);
    return () => { try { v?.clear(); } catch (_) {} };
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(n => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // ── Session ──
  const persistSession = (userId: string, emailAddr: string, selectedRole: string, ids?: { internalId?: string; donorId?: string; username?: string }) => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole', selectedRole);
    localStorage.setItem('userId', userId);
    localStorage.setItem('userEmail', emailAddr);
    localStorage.setItem('userUid', userId);
    if (ids?.internalId) localStorage.setItem('internalId', ids.internalId);
    if (ids?.donorId)    localStorage.setItem('donorId', ids.donorId);
    if (ids?.username)   localStorage.setItem('username', ids.username);
  };

  // ═══ HANDLER: Smart Lookup ═══
  const handleSmartLookup = useCallback(async () => {
    const v = smartInput.trim();
    if (!v) { toast.error('Enter your ID, username, or phone number'); return; }

    const type = detectInputType(v);
    if (type === 'unknown') { toast.error('Unrecognized format', { description: 'Enter an ID (DON-...), username (name@rakt), or 10-digit phone.' }); return; }
    if (type === 'email') { toast.info('Use the Email tab for email login'); setTab('email'); setEmailInput(v); return; }

    setLookupLoading(true);
    try {
      let result: UserLookupResult;
      if (type === 'internalId')     result = await lookupUserByInternalId(v);
      else if (type === 'username')  result = await lookupUserByUsername(v);
      else                           result = await lookupUserByPhone(v);

      if (!result.found) {
        toast.error('User not registered', {
          description: type === 'internalId' ? 'No account found with this ID.'
            : type === 'username' ? 'No account with this username.'
            : 'This phone number is not registered.',
        });
        return;
      }

      if (result.status !== 'active') {
        toast.error('Account not active', { description: 'Pending verification. Contact admin.' });
        return;
      }

      if (type === 'phone' && result.role !== role) {
        toast.error('Role mismatch', { description: `Registered as "${result.role}". Select correct role.` });
        return;
      }

      if (!result.phone) {
        toast.error('No phone linked', { description: 'Use email login instead.' });
        return;
      }

      setFoundUser(result);
      setFlowStep('found');
      toast.success('Account found!', { description: `Welcome back, ${result.fullName}` });
    } catch (err: any) {
      toast.error('Lookup failed', { description: err.message ?? 'Please try again' });
    } finally { setLookupLoading(false); }
  }, [smartInput, role]);

  // ═══ HANDLER: Send OTP ═══
  const handleSendOTP = useCallback(async () => {
    if (!foundUser?.phone) { toast.error('No phone number'); return; }
    if (!recaptchaV) { toast.error('Security check not ready. Refresh.'); return; }
    setOtpSending(true);
    try {
      const result = await sendLoginOTP(foundUser.phone, recaptchaV);
      if (result.success) {
        setConfirmation(result.confirmationResult!);
        setFlowStep('otp');
        setResendTimer(60);
        toast.success('OTP sent!', { description: `Code sent to ${maskPhone(foundUser.phone)}` });
      } else { toast.error('Failed to send OTP', { description: result.error }); }
    } catch (err: any) { toast.error('OTP error', { description: err.message }); }
    finally { setOtpSending(false); }
  }, [foundUser, recaptchaV]);

  // ═══ OTP helpers ═══
  const changeOtpDigit = (idx: number, val: string) => {
    if (val.length > 1 || !/^\d*$/.test(val)) return;
    const next = [...otp]; next[idx] = val; setOtp(next);
    if (val && idx < 5) (document.getElementById(`lp-otp-${uid}-${idx + 1}`) as HTMLInputElement)?.focus();
  };
  const otpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0)
      (document.getElementById(`lp-otp-${uid}-${idx - 1}`) as HTMLInputElement)?.focus();
  };

  // ═══ HANDLER: Verify OTP ═══
  const handleVerifyOTP = useCallback(async () => {
    const code = otp.join('');
    if (code.length !== 6) { toast.error('Enter complete 6-digit OTP'); return; }
    if (!foundUser?.uid || !foundUser?.phone) { toast.error('Session error. Start over.'); return; }
    setVerifyLoading(true);
    try {
      const result = await verifyLoginOTP(code, confirmation, {
        uid: foundUser.uid,
        phone: foundUser.phone,
        role,
        internalId: foundUser.internalId,
        donorId: foundUser.donorId,
      });
      if (result.success) {
        persistSession(result.userId!, result.email ?? '', role, {
          internalId: result.internalId, donorId: result.donorId, username: result.username,
        });
        toast.success('Login successful!');
        setTimeout(() => { window.location.href = '/'; }, 500);
      } else {
        toast.error('Access denied', { description: result.error });
        setOtp(['', '', '', '', '', '']);
        (document.getElementById(`lp-otp-${uid}-0`) as HTMLInputElement)?.focus();
      }
    } catch (err: any) { toast.error('Verification error', { description: err.message }); }
    finally { setVerifyLoading(false); }
  }, [otp, confirmation, foundUser, role, uid]);

  // ═══ HANDLER: Resend OTP ═══
  const handleResendOTP = useCallback(async () => {
    setOtp(['', '', '', '', '', '']);
    const v = initRecaptcha('lp-recaptcha');
    setRecaptchaV(v);
    setTimeout(() => handleSendOTP(), 300);
  }, [handleSendOTP]);

  // ═══ HANDLER: Email login ═══
  const handleEmailLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput.trim()) { toast.error('Enter email and password'); return; }
    setLoginLoading(true);
    try {
      const res = await loginUser(emailInput, passwordInput, role);
      if (res.success) {
        persistSession(res.userId!, res.email ?? emailInput, role);
        toast.success('Login successful!');
        setTimeout(() => { window.location.href = '/'; }, 500);
      } else { toast.error('Login failed', { description: res.error }); }
    } catch (err: any) { toast.error('Login error', { description: err.message }); }
    finally { setLoginLoading(false); }
  }, [emailInput, passwordInput, role]);

  // ═══ HANDLER: Google ═══
  const handleGoogle = useCallback(async () => {
    setGLoading(true);
    try {
      const res = await signInWithGoogle(role);
      if (res.success) {
        persistSession(res.userId!, res.email ?? '', role);
        if (res.displayName) localStorage.setItem('userName', res.displayName);
        toast.success('Signed in with Google!');
        setTimeout(() => { window.location.href = '/'; }, 500);
      } else if (res.error !== 'Sign-in cancelled.') {
        toast.error('Google sign-in failed', { description: res.error });
      }
    } catch (err: any) { toast.error('Google error', { description: err.message }); }
    finally { setGLoading(false); }
  }, [role]);

  // ═══ RENDER ═══
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div id="lp-recaptcha" aria-hidden="true" />

      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className={`absolute -top-40 -right-40 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-br ${current.color} rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob`} />
        <div className="absolute -bottom-40 -left-40 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      </div>

      {/* Back button */}
      <div className="sticky top-0 z-30 flex items-center px-3 pt-3 pb-2 sm:px-6 sm:pt-5 pointer-events-none">
        <button onClick={onBack} className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-white/85 backdrop-blur-md rounded-full shadow-md hover:shadow-lg hover:bg-white active:scale-95 transition-all group">
          <ArrowLeft className="w-4 h-4 text-gray-600 group-hover:text-gray-900" />
          <span className="text-xs sm:text-sm font-medium text-gray-600 group-hover:text-gray-900">Back to Home</span>
        </button>
      </div>

      {/* Card */}
      <div className="relative flex justify-center px-3 pb-8 pt-2 sm:px-4 sm:pt-4 sm:min-h-[calc(100vh-56px)] sm:items-center">
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/30 overflow-hidden">

            {/* Header */}
            <div className="pt-5 pb-4 px-4 sm:pt-8 sm:pb-6 sm:px-8 bg-gradient-to-br from-white/50 to-white/20 flex flex-col items-center text-center">
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg mb-3 ring-4 ring-white/60">
                <img src={logo} alt="RaktPort" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-0.5">Welcome Back</h1>
              <p className="text-xs sm:text-sm text-gray-500">Sign in to continue to RaktPort</p>
            </div>

            {/* Role selector */}
            <div className="px-3 sm:px-8 pt-4 sm:pt-6 pb-2">
              <div className="relative bg-gray-100/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-1.5 shadow-inner">
                <div className={`absolute top-1.5 bottom-1.5 bg-gradient-to-r ${current.color} rounded-lg shadow-md transition-all duration-300 ease-out`}
                  style={{ left: `calc(${roleIdx * 25}% + 6px)`, width: 'calc(25% - 12px)' }} aria-hidden="true" />
                <div className="relative grid grid-cols-4">
                  {ROLES.map(r => {
                    const active = r.id === role;
                    return (
                      <button key={r.id} type="button" onClick={() => setRole(r.id)} disabled={anyBusy} aria-pressed={active}
                        className={`flex flex-col items-center gap-0.5 py-2.5 sm:py-3 rounded-lg transition-all duration-200 min-h-[52px] touch-manipulation ${active ? 'text-white' : 'text-gray-500 hover:text-gray-700'} disabled:opacity-50`}>
                        <r.Icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${active ? 'scale-110' : ''}`} />
                        <span className="text-[9px] sm:text-[11px] font-semibold leading-tight">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Login method tabs */}
            <div className="px-4 sm:px-8 pt-3">
              <div className="flex bg-gray-100/50 rounded-xl p-1 gap-1">
                {([
                  { id: 'smart' as LoginTab, label: 'Quick Login', Icon: Fingerprint },
                  { id: 'email' as LoginTab, label: 'Email', Icon: Mail },
                ] as const).map(t => (
                  <button key={t.id} type="button" onClick={() => setTab(t.id)} disabled={anyBusy}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all touch-manipulation ${
                      tab === t.id ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                    } disabled:opacity-50`}>
                    <t.Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-8 py-4 sm:py-5">

              {/* ═══ SMART LOGIN TAB ═══ */}
              {tab === 'smart' && (
                <div className="space-y-4">

                  {/* Step: Input */}
                  {flowStep === 'input' && (
                    <div className="space-y-4 animate-fadein">
                      <div className="space-y-1.5">
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700">
                          User ID / Username / Phone
                        </label>
                        <div className="relative group">
                          <Hash className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-gray-600 pointer-events-none" />
                          <input
                            type="text"
                            value={smartInput}
                            onChange={e => setSmartInput(e.target.value)}
                            placeholder="DON-DL-26-0001 / ajay@rakt / 98765..."
                            disabled={anyBusy}
                            onKeyDown={e => e.key === 'Enter' && handleSmartLookup()}
                            className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-3.5 bg-white/60 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 outline-none transition-all text-gray-800 placeholder-gray-400 text-sm disabled:opacity-50"
                          />
                          {/* Type badge */}
                          {smartInput.length >= 2 && badge && (
                            <span className={`absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.color} transition-all animate-fadein`}>
                              <badge.Icon className="w-3 h-3" />
                              {badge.label}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-xs text-gray-500">
                          Enter your User ID, @rakt username, or registered phone number
                        </p>
                      </div>

                      <button type="button" onClick={handleSmartLookup} disabled={anyBusy || !smartInput.trim()}
                        className={`w-full min-h-[50px] py-3 sm:py-3.5 rounded-xl font-bold text-white text-sm sm:text-base shadow-lg transition-all touch-manipulation ${
                          anyBusy || !smartInput.trim() ? 'bg-gray-300 cursor-not-allowed' : `bg-gradient-to-r ${current.color} hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]`
                        }`}>
                        {lookupLoading
                          ? <span className="flex items-center justify-center gap-2"><Spinner white />Finding account…</span>
                          : <span className="flex items-center justify-center gap-2"><Search className="w-4 h-4" />Find My Account</span>}
                      </button>
                    </div>
                  )}

                  {/* Step: Account Found */}
                  {flowStep === 'found' && foundUser && (
                    <div className="space-y-4 animate-fadein">
                      <div className="rounded-xl border-2 border-green-200 bg-green-50/50 p-4 space-y-3">
                        <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
                          <CheckCircle2 className="w-4 h-4" /> Account Found
                        </div>
                        <div className="space-y-1.5 text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 w-14 text-xs">Name</span>
                            <span className="font-semibold">{foundUser.fullName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 w-14 text-xs">Phone</span>
                            <span className="font-mono font-semibold">{maskPhone(foundUser.phone || '')}</span>
                          </div>
                          {foundUser.internalId && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 w-14 text-xs">ID</span>
                              <span className="font-mono font-semibold text-blue-700">{foundUser.internalId}</span>
                            </div>
                          )}
                          {!foundUser.internalId && foundUser.donorId && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 w-14 text-xs">ID</span>
                              <span className="font-mono font-semibold text-red-700">{foundUser.donorId}</span>
                            </div>
                          )}
                          {foundUser.username && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 w-14 text-xs">User</span>
                              <span className="font-semibold text-purple-700">{formatUsername(foundUser.username)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                        <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] sm:text-xs text-amber-800">
                          OTP will be sent to your registered phone for secure verification.
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button type="button" onClick={resetFlow} disabled={anyBusy}
                          className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50">← Back</button>
                        <button type="button" onClick={handleSendOTP} disabled={anyBusy}
                          className={`flex-1 min-h-[50px] py-3 rounded-xl font-bold text-white text-sm shadow-lg transition-all touch-manipulation ${
                            anyBusy ? 'bg-gray-300 cursor-not-allowed' : `bg-gradient-to-r ${current.color} hover:shadow-xl active:scale-[0.99]`
                          }`}>
                          {otpSending
                            ? <span className="flex items-center justify-center gap-2"><Spinner white />Sending…</span>
                            : <span className="flex items-center justify-center gap-2"><KeyRound className="w-4 h-4" />Send OTP</span>}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step: OTP */}
                  {flowStep === 'otp' && (
                    <div className="space-y-5 animate-fadein">
                      <div className="flex flex-col items-center text-center gap-2">
                        <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r ${current.color} flex items-center justify-center shadow-lg`}>
                          <Smartphone className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-gray-800">Enter Verification Code</h3>
                        <p className="text-xs text-gray-500">Sent to {maskPhone(foundUser?.phone || '')}</p>
                      </div>

                      <div className="flex justify-center gap-2 sm:gap-3" role="group" aria-label="OTP input">
                        {otp.map((digit, idx) => (
                          <input key={idx} id={`lp-otp-${uid}-${idx}`} type="text" inputMode="numeric" maxLength={1}
                            value={digit} onChange={e => changeOtpDigit(idx, e.target.value)} onKeyDown={e => otpKeyDown(idx, e)}
                            disabled={verifyLoading} aria-label={`OTP digit ${idx + 1}`}
                            className={`text-center text-xl sm:text-2xl font-bold border-2 rounded-xl outline-none transition-all touch-manipulation text-gray-900 ${
                              digit ? 'bg-white border-gray-500' : 'bg-white/60 border-gray-300 focus:border-gray-500 focus:ring-4 focus:ring-gray-200/50'
                            } disabled:opacity-50`} style={{ width: 44, height: 52 }} />
                        ))}
                      </div>

                      <button type="button" onClick={handleVerifyOTP} disabled={anyBusy || otp.join('').length !== 6}
                        className={`w-full min-h-[50px] py-3 sm:py-3.5 rounded-xl font-bold text-white text-sm sm:text-base shadow-lg transition-all touch-manipulation ${
                          otp.join('').length === 6 && !anyBusy
                            ? `bg-gradient-to-r ${current.color} hover:shadow-xl active:scale-[0.99]`
                            : 'bg-gray-300 cursor-not-allowed'
                        }`}>
                        {verifyLoading
                          ? <span className="flex items-center justify-center gap-2"><Spinner white />Verifying…</span>
                          : <span className="flex items-center justify-center gap-2"><ShieldCheck className="w-4 h-4" />Verify & Login</span>}
                      </button>

                      <div className="flex items-center justify-between">
                        <button type="button" onClick={resetFlow} disabled={anyBusy}
                          className="text-xs text-gray-500 hover:text-gray-700 font-medium disabled:opacity-50">← Change account</button>
                        <div className="text-xs text-gray-500">
                          {resendTimer > 0
                            ? <>Resend in <strong className="text-gray-700">{resendTimer}s</strong></>
                            : <button type="button" onClick={handleResendOTP} disabled={anyBusy} className="font-semibold text-gray-700 hover:text-gray-900 underline disabled:opacity-50">Resend OTP</button>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ═══ EMAIL TAB ═══ */}
              {tab === 'email' && (
                <form onSubmit={handleEmailLogin} noValidate className="space-y-4 animate-fadein">
                  <div className="space-y-1.5">
                    <label htmlFor="lp-email" className="block text-xs sm:text-sm font-semibold text-gray-700">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-gray-600 pointer-events-none" />
                      <input id="lp-email" type="email" autoComplete="email" value={emailInput}
                        onChange={e => setEmailInput(e.target.value)} disabled={anyBusy}
                        className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-3.5 bg-white/60 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 outline-none transition-all text-gray-800 placeholder-gray-400 text-sm disabled:opacity-50"
                        placeholder="you@example.com" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label htmlFor="lp-password" className="block text-xs sm:text-sm font-semibold text-gray-700">Password</label>
                      <button type="button" onClick={() => setShowForgotPwd(true)} tabIndex={-1} className="text-[10px] sm:text-xs font-semibold text-[var(--clr-info)] hover:text-blue-800 hover:underline">Forgot password?</button>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-gray-600 pointer-events-none" />
                      <input id="lp-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={passwordInput}
                        onChange={e => setPasswordInput(e.target.value)} disabled={anyBusy}
                        className="w-full pl-9 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-3.5 bg-white/60 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 outline-none transition-all text-gray-800 placeholder-gray-400 text-sm disabled:opacity-50"
                        placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5 touch-manipulation">
                        {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={anyBusy}
                    className={`w-full min-h-[50px] py-3 sm:py-4 rounded-xl font-bold text-white text-sm sm:text-base shadow-lg transition-all duration-200 touch-manipulation ${
                      anyBusy ? 'bg-gray-300 cursor-not-allowed' : `bg-gradient-to-r ${current.color} hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]`
                    }`}>
                    {loginLoading ? <span className="flex items-center justify-center gap-2"><Spinner white />Signing in…</span> : 'Sign In'}
                  </button>
                </form>
              )}

              {/* Divider */}
              <div className="flex items-center gap-2 mt-4 mb-3" aria-hidden="true">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[10px] sm:text-xs text-gray-400 font-medium whitespace-nowrap">or continue with</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Google */}
              <button type="button" onClick={handleGoogle} disabled={anyBusy}
                className="w-full flex items-center justify-center gap-2.5 min-h-[50px] px-4 py-3 sm:py-3.5 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md active:scale-[0.98] transition-all font-semibold text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation">
                {gLoading ? <Spinner /> : <GoogleIcon size={18} />}
                <span>{gLoading ? 'Signing in…' : 'Continue with Google'}</span>
              </button>
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-8 pb-6 text-center text-xs sm:text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <button type="button" onClick={() => onSignupClick(role)}
                className={`font-semibold bg-gradient-to-r ${current.color} bg-clip-text text-transparent hover:underline`}>
                Sign Up
              </button>
            </div>
          </div>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs sm:text-sm text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
            Secured by Firebase Authentication
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPwd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-fadein">
            <h3 className="font-bold text-lg text-gray-800">Reset Password</h3>
            <p className="text-sm text-gray-500">Enter your email and we'll send a link to reset your password.</p>
            <div className="space-y-1.5">
              <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl outline-none focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 transition-all text-sm" />
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowForgotPwd(false)}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={async () => {
                if (!forgotEmail) { toast.error('Enter email'); return; }
                setForgotLoading(true);
                const res = await resetPassword(forgotEmail);
                setForgotLoading(false);
                if (res.success) {
                  toast.success('Reset link sent!');
                  setShowForgotPwd(false);
                  setForgotEmail('');
                } else {
                  toast.error('Error', { description: res.error });
                }
              }} disabled={forgotLoading}
                className="flex-1 px-4 py-2 bg-[var(--clr-info)] text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 disabled:opacity-50">
                {forgotLoading ? 'Sending...' : 'Send Link'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes blob { 0%,100%{transform:translate(0,0) scale(1)} 25%{transform:translate(20px,-20px) scale(1.1)} 50%{transform:translate(-20px,20px) scale(0.9)} 75%{transform:translate(20px,20px) scale(1.05)} }
        .animate-blob { animation: blob 8s infinite ease-in-out; }
        .animation-delay-2000 { animation-delay: 2s; }
        @keyframes fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .animate-fadein { animation: fadein 0.28s ease both; }
        button:focus:not(:focus-visible) { outline: none; }
      `}</style>
    </div>
  );
}