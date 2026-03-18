// src/components/LoginPage.tsx

import { useState, useCallback } from 'react';
import { loginUser, signInWithGoogle } from '../lib/auth';
import { toast } from 'sonner';
import {
  Eye, EyeOff, Mail, Lock, UserCircle,
  Building2, Droplet, ShieldCheck, ArrowLeft,
} from 'lucide-react';
import logo from '../assets/raktport-logo.png';

interface LoginPageProps {
  initialRole: string;
  onBack: () => void;
  onSignupClick: (role: string) => void;
}

const ROLES = [
  { id: 'donor',     label: 'Donor',      Icon: Droplet,     color: 'from-red-500    to-pink-500'    },
  { id: 'hospital',  label: 'Hospital',   Icon: Building2,   color: 'from-blue-500   to-cyan-500'    },
  { id: 'bloodbank', label: 'Blood Bank', Icon: UserCircle,  color: 'from-purple-500 to-violet-500'  },
  { id: 'admin',     label: 'Admin',      Icon: ShieldCheck, color: 'from-emerald-500 to-teal-500'   },
] as const;

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
  return (
    <span
      className={`inline-block w-4 h-4 border-2 rounded-full animate-spin flex-shrink-0 ${
        white ? 'border-white/30 border-t-white' : 'border-gray-200 border-t-gray-600'
      }`}
      aria-hidden="true"
    />
  );
}

export function LoginPage({ initialRole, onBack, onSignupClick }: LoginPageProps) {
  const [role,         setRole]         = useState(initialRole || 'donor');
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe,   setRememberMe]   = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [gLoading,     setGLoading]     = useState(false);

  const current = ROLES.find(r => r.id === role) ?? ROLES[0];
  const roleIdx = ROLES.findIndex(r => r.id === role);
  const anyBusy = loading || gLoading;

  // ── Store all identity hints so downstream hooks can resolve the Firestore doc ──
  const persistLoginState = (uid: string, emailAddr: string, selectedRole: string) => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userRole',   selectedRole);
    localStorage.setItem('userId',     uid);        // Firebase UID
    localStorage.setItem('userEmail',  emailAddr);  // ← FIXED: persist email
    localStorage.setItem('userUid',    uid);        // redundant but explicit
  };

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { toast.error('Enter both email and password'); return; }
    setLoading(true);
    try {
      const res = await loginUser(email, password, role);
      if (res.success) {
        // ── FIXED: store email alongside uid ──────────────────────────────
        persistLoginState(res.userId!, res.email ?? email, role);

        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
          localStorage.setItem('rememberedRole',  role);
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberedRole');
        }
        toast.success('Login successful!', { description: 'Welcome back!' });
        setTimeout(() => { window.location.href = '/'; }, 500);
      } else {
        toast.error('Login failed', { description: res.error });
      }
    } catch (err: any) {
      toast.error('Login error', { description: err.message ?? 'Unexpected error' });
    } finally { setLoading(false); }
  }, [email, password, role, rememberMe]);

  const handleGoogle = useCallback(async () => {
    setGLoading(true);
    try {
      const res = await signInWithGoogle(role);
      if (res.success) {
        // ── FIXED: store email alongside uid ──────────────────────────────
        persistLoginState(res.userId!, res.email ?? '', role);
        if (res.displayName) localStorage.setItem('userName', res.displayName);

        toast.success('Signed in with Google!', { description: `Welcome, ${res.displayName ?? ''}` });
        setTimeout(() => { window.location.href = '/'; }, 500);
      } else if (res.error !== 'Sign-in cancelled.') {
        toast.error('Google sign-in failed', { description: res.error });
      }
    } catch (err: any) {
      toast.error('Google error', { description: err.message });
    } finally { setGLoading(false); }
  }, [role]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">

      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className={`absolute -top-40 -right-40 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-br ${current.color} rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob`} />
        <div className="absolute -bottom-40 -left-40 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      </div>

      {/* Back button */}
      <div className="sticky top-0 z-30 flex items-center px-3 pt-3 pb-2 sm:px-6 sm:pt-5 sm:pb-0 pointer-events-none">
        <button
          onClick={onBack}
          className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-white/85 backdrop-blur-md rounded-full shadow-md hover:shadow-lg hover:bg-white active:scale-95 transition-all group"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600 group-hover:text-gray-900 transition-colors" />
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
                <div
                  className={`absolute top-1.5 bottom-1.5 bg-gradient-to-r ${current.color} rounded-lg shadow-md transition-all duration-300 ease-out`}
                  style={{ left: `calc(${roleIdx * 25}% + 6px)`, width: 'calc(25% - 12px)' }}
                  aria-hidden="true"
                />
                <div className="relative grid grid-cols-4">
                  {ROLES.map(r => {
                    const active = r.id === role;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id)}
                        aria-pressed={active}
                        className={`flex flex-col items-center gap-0.5 py-2.5 sm:py-3 rounded-lg transition-all duration-200 min-h-[52px] touch-manipulation ${
                          active ? 'text-white' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <r.Icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${active ? 'scale-110' : ''}`} />
                        <span className="text-[9px] sm:text-[11px] font-semibold leading-tight">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} noValidate className="px-4 sm:px-8 py-4 sm:py-5 space-y-4">

              {/* Google */}
              <button
                type="button"
                onClick={handleGoogle}
                disabled={anyBusy}
                className="w-full flex items-center justify-center gap-2.5 min-h-[50px] px-4 py-3 sm:py-3.5 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md active:scale-[0.98] transition-all font-semibold text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              >
                {gLoading ? <Spinner /> : <GoogleIcon size={18} />}
                <span>{gLoading ? 'Signing in…' : 'Continue with Google'}</span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-2" aria-hidden="true">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[10px] sm:text-xs text-gray-400 font-medium whitespace-nowrap">or sign in with email</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="lp-email" className="block text-xs sm:text-sm font-semibold text-gray-700">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-gray-600 pointer-events-none" />
                  <input
                    id="lp-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-3.5 bg-white/60 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 outline-none transition-all text-gray-800 placeholder-gray-400 text-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="lp-password" className="block text-xs sm:text-sm font-semibold text-gray-700">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-gray-600 pointer-events-none" />
                  <input
                    id="lp-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-3.5 bg-white/60 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 outline-none transition-all text-gray-800 placeholder-gray-400 text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5 touch-manipulation"
                  >
                    {showPassword
                      ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                      : <Eye    className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember / Forgot */}
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none group touch-manipulation">
                  <span className="relative flex-shrink-0">
                    <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="sr-only peer" />
                    <span className="flex w-5 h-5 border-2 border-gray-300 rounded-md peer-checked:bg-gradient-to-br peer-checked:from-gray-700 peer-checked:to-gray-900 peer-checked:border-gray-700 transition-all items-center justify-center">
                      {rememberMe && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                  </span>
                  <span className="text-xs sm:text-sm text-gray-600 group-hover:text-gray-800 transition-colors">Remember me</span>
                </label>
                <button type="button" className="text-xs sm:text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={anyBusy}
                className={`w-full min-h-[50px] py-3 sm:py-4 rounded-xl font-bold text-white text-sm sm:text-base shadow-lg transition-all duration-200 touch-manipulation ${
                  anyBusy
                    ? 'bg-gray-300 cursor-not-allowed'
                    : `bg-gradient-to-r ${current.color} hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]`
                }`}
              >
                {loading
                  ? <span className="flex items-center justify-center gap-2"><Spinner white />Signing in…</span>
                  : 'Sign In'}
              </button>
            </form>

            {/* Footer */}
            <div className="px-4 sm:px-8 pb-6 text-center text-xs sm:text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <button
                type="button"
                onClick={() => onSignupClick(role)}
                className={`font-semibold bg-gradient-to-r ${current.color} bg-clip-text text-transparent hover:underline`}
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Security badge */}
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs sm:text-sm text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
            Secured by Firebase Authentication
          </p>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%,100% { transform:translate(0,0) scale(1); }
          25%      { transform:translate(20px,-20px) scale(1.1); }
          50%      { transform:translate(-20px,20px) scale(0.9); }
          75%      { transform:translate(20px,20px) scale(1.05); }
        }
        .animate-blob { animation: blob 8s infinite ease-in-out; }
        .animation-delay-2000 { animation-delay: 2s; }
        button:focus:not(:focus-visible) { outline: none; }
      `}</style>
    </div>
  );
}