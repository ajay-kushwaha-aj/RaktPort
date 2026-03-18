// src/components/SignupPage.tsx
import { useState, useEffect, useCallback, useId } from 'react';
import {
  initRecaptcha,
  sendRegistrationOTP,
  verifyRegistrationOTP,
  registerUserWithPhone,
  signInWithGoogle,
} from '../lib/auth';
import { toast } from 'sonner';
import {
  ArrowLeft, Eye, EyeOff, Upload, X, CheckCircle2,
  User, Mail, Phone, Lock, MapPin, Calendar, Droplet,
  FileText, Building2, Heart, Shield, AlertCircle, Loader2,
  ChevronRight, ChevronLeft, Home, Smartphone, KeyRound,
} from 'lucide-react';
import logo from '../assets/raktport-logo.png';
import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';

interface SignupPageProps {
  role: string;
  onBack: () => void;
  onLoginClick: () => void;
}

/* ─────────────────── Config ─────────────────── */

const ROLE_CONFIG = {
  donor:     { title: 'Donor Registration',      subtitle: 'Join our life-saving community',   Icon: Heart,    gradient: 'from-red-500    to-pink-500',    bgGrad: 'from-red-50    via-pink-50   to-orange-50',  accent: '#ef4444', lightBg: 'bg-red-50',     borderL: 'border-red-400'     },
  hospital:  { title: 'Hospital Registration',   subtitle: 'Partner with us to save lives',    Icon: Building2,gradient: 'from-blue-500   to-cyan-500',    bgGrad: 'from-blue-50   via-cyan-50   to-sky-50',     accent: '#3b82f6', lightBg: 'bg-blue-50',    borderL: 'border-blue-400'    },
  bloodbank: { title: 'Blood Bank Registration', subtitle: 'Manage inventory efficiently',     Icon: Droplet,  gradient: 'from-purple-500 to-violet-500',   bgGrad: 'from-purple-50 via-violet-50 to-fuchsia-50', accent: '#a855f7', lightBg: 'bg-purple-50',  borderL: 'border-purple-400'  },
  admin:     { title: 'Admin Registration',      subtitle: 'Manage the platform',              Icon: Shield,   gradient: 'from-emerald-500 to-teal-500',   bgGrad: 'from-emerald-50 via-teal-50  to-green-50',  accent: '#10b981', lightBg: 'bg-emerald-50', borderL: 'border-emerald-400' },
} as const;

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu',
  'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];

const BLOOD_GROUPS = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];
const STEPS = ['Basic','OTP','Details','Address','Finish'] as const;

/* ─────────────────── Sub-components ─────────────────── */

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

/** Labelled input wrapper */
function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[10px] sm:text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

/** Text / email / tel / date input */
function TInput({
  id, type = 'text', placeholder, value, onChange, max, maxLength, inputMode, prefix, disabled = false, iconLeft,
}: {
  id?: string; type?: string; placeholder?: string; value: string;
  onChange: (v: string) => void; max?: string; maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  prefix?: string; disabled?: boolean;
  iconLeft?: React.ReactNode;
}) {
  const padL = iconLeft ? (prefix ? 'pl-24 sm:pl-28' : 'pl-9 sm:pl-11') : (prefix ? 'pl-14' : 'pl-3 sm:pl-4');
  return (
    <div className="relative group">
      {iconLeft && <span className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-600 transition-colors pointer-events-none">{iconLeft}</span>}
      {prefix && <span className={`absolute ${iconLeft ? 'left-9 sm:left-11' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-600 font-medium text-sm pointer-events-none select-none`}>{prefix}</span>}
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        max={max}
        maxLength={maxLength}
        disabled={disabled}
        className={`w-full ${padL} pr-3 sm:pr-4 py-3 sm:py-3.5 bg-white/60 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 outline-none transition-all text-gray-800 placeholder-gray-400 text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
      />
    </div>
  );
}

function DocUpload({ inputId, docs, onUpload, onRemove }: {
  inputId: string; docs: File[];
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (i: number) => void;
}) {
  return (
    <Field label="Upload Documents">
      <label
        htmlFor={inputId}
        className="flex flex-col items-center gap-2 px-4 py-5 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-gray-400 transition-colors text-center touch-manipulation"
      >
        <Upload className="w-6 h-6 sm:w-7 sm:h-7 text-gray-400" />
        <span className="text-xs sm:text-sm text-gray-600">Tap to upload documents</span>
        <span className="text-[10px] sm:text-xs text-gray-400">PDF, JPG, PNG · max 5 MB each</span>
      </label>
      <input id={inputId} type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={onUpload} className="sr-only" />
      {docs.length > 0 && (
        <ul className="mt-2.5 space-y-1.5">
          {docs.map((f, i) => (
            <li key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
              <span className="text-xs sm:text-sm text-gray-700 truncate flex-1">{f.name}</span>
              <button type="button" onClick={() => onRemove(i)} className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors touch-manipulation">
                <X className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Field>
  );
}

/* ─────────────────── Main Component ─────────────────── */

export function SignupPage({ role, onBack, onLoginClick }: SignupPageProps) {
  const cfg      = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG] ?? ROLE_CONFIG.donor;
  const RoleIcon = cfg.Icon;
  const uid      = useId();

  /* Step state */
  const [step,            setStep]            = useState(1);
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [gLoading,        setGLoading]        = useState(false);

  /* OTP state */
  const [otpSent,         setOtpSent]         = useState(false);
  const [otp,             setOtp]             = useState(['','','','','','']);
  const [otpLoading,      setOtpLoading]      = useState(false);
  const [otpVerified,     setOtpVerified]     = useState(false);
  const [resendTimer,     setResendTimer]     = useState(0);
  const [recaptchaV,      setRecaptchaV]      = useState<RecaptchaVerifier | null>(null);
  const [confirmation,    setConfirmation]    = useState<ConfirmationResult | null>(null);
  const [phoneUid,        setPhoneUid]        = useState('');

  /* Form data */
  const [form, setForm] = useState({
    fullName: '', email: '', mobile: '', password: '', confirmPassword: '',
    address: '', district: '', state: '', pincode: '', aadhar: '',
    bloodGroup: '', gender: '', dob: '', lastDonationDate: '',
    dontRemember: false, licenseNo: '', registrationNo: '',
    inventory: {} as Record<string, number>, acceptTerms: false,
  });
  const [docs, setDocs] = useState<File[]>([]);

  const set = useCallback((field: string, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value })), []);

  /* Init reCAPTCHA */
  useEffect(() => {
    const v = initRecaptcha('sp-recaptcha');
    setRecaptchaV(v);
    return () => { try { v?.clear(); } catch (_) {} };
  }, []);

  /* Resend timer */
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(n => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  /* File handling */
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter(f => {
      if (f.size > 5 * 1024 * 1024) { toast.error(`${f.name} exceeds 5 MB`); return false; }
      return true;
    });
    setDocs(prev => [...prev, ...files]);
    if (files.length) toast.success(`${files.length} file(s) added`);
  };

  /* OTP helpers */
  const sendOTP = async () => {
    if (!form.mobile || form.mobile.length !== 10) { toast.error('Enter a valid 10-digit mobile number'); return; }
    if (!recaptchaV) { toast.error('reCAPTCHA not ready — please refresh'); return; }
    setOtpLoading(true);
    try {
      const res = await sendRegistrationOTP(form.mobile, recaptchaV);
      if (res.success) {
        setOtpSent(true); setResendTimer(60);
        setConfirmation(res.confirmationResult!);
        toast.success('OTP sent!', { description: `Code sent to +91 ****${form.mobile.slice(-4)}` });
      } else { toast.error('Failed to send OTP', { description: res.error }); }
    } catch (e: any) { toast.error('OTP error', { description: e.message }); }
    finally { setOtpLoading(false); }
  };

  const changeOtpDigit = (idx: number, val: string) => {
    if (val.length > 1 || !/^\d*$/.test(val)) return;
    const next = [...otp]; next[idx] = val; setOtp(next);
    if (val && idx < 5) (document.getElementById(`otp-${uid}-${idx + 1}`) as HTMLInputElement)?.focus();
  };

  const otpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0)
      (document.getElementById(`otp-${uid}-${idx - 1}`) as HTMLInputElement)?.focus();
  };

  const verifyOTP = async () => {
    const code = otp.join('');
    if (code.length !== 6) { toast.error('Enter the complete 6-digit OTP'); return; }
    setOtpLoading(true);
    try {
      const res = await verifyRegistrationOTP(code, confirmation);
      if (res.success && res.phoneAuthUser) {
        setOtpVerified(true); setPhoneUid(res.phoneAuthUser.uid);
        toast.success('Phone verified!');
        setTimeout(() => goNext(), 500);
      } else {
        toast.error('Verification failed', { description: res.error });
        setOtp(['','','','','','']);
        (document.getElementById(`otp-${uid}-0`) as HTMLInputElement)?.focus();
      }
    } catch (e: any) { toast.error('Verification error', { description: e.message }); }
    finally { setOtpLoading(false); }
  };

  /* Validation */
  const validate = useCallback((): boolean => {
    if (step === 1) {
      if (!form.fullName.trim() || !form.email.trim() || !form.mobile) { toast.error('Fill all required fields'); return false; }
      if (form.mobile.length !== 10) { toast.error('Mobile must be 10 digits'); return false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error('Invalid email address'); return false; }
    }
    if (step === 2 && !otpVerified) { toast.error('Verify your phone number first'); return false; }
    if (step === 3) {
      if (role === 'donor') {
        if (!form.aadhar || form.aadhar.length !== 12) { toast.error('Aadhar must be 12 digits'); return false; }
        if (!form.bloodGroup || !form.gender || !form.dob) { toast.error('Fill all donor details'); return false; }
      }
      if (role === 'hospital'  && !form.registrationNo) { toast.error('Enter hospital registration number'); return false; }
      if (role === 'bloodbank' && !form.licenseNo)      { toast.error('Enter blood bank license number');  return false; }
    }
    if (step === 4) {
      if (!form.address.trim() || !form.district.trim() || !form.state || !form.pincode) { toast.error('Fill complete address'); return false; }
      if (form.pincode.length !== 6) { toast.error('Pincode must be 6 digits'); return false; }
    }
    if (step === 5) {
      if (!form.password || !form.confirmPassword) { toast.error('Set a password'); return false; }
      if (form.password !== form.confirmPassword)  { toast.error('Passwords do not match'); return false; }
      if (form.password.length < 6)                { toast.error('Password must be ≥ 6 characters'); return false; }
      if (!form.acceptTerms)                       { toast.error('Accept terms & conditions'); return false; }
    }
    return true;
  }, [step, form, otpVerified, role]);

  const goNext = () => { if (validate()) setStep(s => Math.min(s + 1, 5)); };
  const goPrev = () => setStep(s => Math.max(s - 1, 1));

  /* Submit */
  const handleSubmit = async () => {
    if (!validate() || !otpVerified) return;
    setLoading(true);
    try {
      const res = await registerUserWithPhone(form.email, form.password, {
        role, fullName: form.fullName, mobile: `+91${form.mobile}`,
        address: form.address, district: form.district, state: form.state, pincode: form.pincode,
        isVerified: role === 'donor',
        ...(role === 'donor'     && { aadhar: form.aadhar, bloodGroup: form.bloodGroup, gender: form.gender, dob: form.dob, lastDonationDate: form.dontRemember ? null : form.lastDonationDate, credits: 0 }),
        ...(role === 'hospital'  && { registrationNo: form.registrationNo }),
        ...(role === 'bloodbank' && { licenseNo: form.licenseNo, inventory: form.inventory }),
      }, phoneUid);
      if (res.success) {
        toast.success('Registration successful!', { description: role === 'donor' ? 'You can now log in.' : 'Account pending admin verification.' });
        setTimeout(onLoginClick, 2000);
      } else { toast.error('Registration failed', { description: res.error }); }
    } catch (e: any) { toast.error('Error', { description: e.message ?? 'Unexpected error' }); }
    finally { setLoading(false); }
  };

  /* Google sign-up (quick path, skips multi-step) */
  const handleGoogle = useCallback(async () => {
    setGLoading(true);
    try {
      const res = await signInWithGoogle(role);
      if (res.success) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', role);
        localStorage.setItem('userId', res.userId!);
        toast.success(res.isNewUser ? 'Account created with Google!' : 'Signed in with Google!', { description: `Welcome, ${res.displayName ?? ''}` });
        setTimeout(() => { window.location.href = '/'; }, 600);
      } else if (res.error !== 'Sign-in cancelled.') {
        toast.error('Google sign-up failed', { description: res.error });
      }
    } catch (e: any) { toast.error('Google error', { description: e.message }); }
    finally { setGLoading(false); }
  }, [role]);

  /* ─────────────── Render ─────────────── */
  return (
    <div className={`min-h-screen relative overflow-hidden bg-gradient-to-br ${cfg.bgGrad}`}>
      {/* reCAPTCHA anchor (invisible) */}
      <div id="sp-recaptcha" aria-hidden="true" />

      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className={`absolute -top-40 -right-40 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-br ${cfg.gradient} rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob`} />
        <div className="absolute -bottom-40 -left-40 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-br ${cfg.gradient} rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000`} />
      </div>

      {/* Sticky top-bar */}
      <div className="sticky top-0 z-30 flex items-center px-3 pt-3 pb-2 sm:px-6 sm:pt-5 sm:pb-0 pointer-events-none">
        <button onClick={onBack} className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-white/85 backdrop-blur-md rounded-full shadow-md hover:shadow-lg hover:bg-white active:scale-95 transition-all touch-manipulation">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs sm:text-sm font-medium">Back to Home</span>
        </button>
      </div>

      {/* Content */}
      <div className="relative flex justify-center px-3 pb-10 pt-2 sm:px-4 sm:pt-4">
        <div className="w-full max-w-xl sm:max-w-2xl">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/30 overflow-hidden">

            {/* Header */}
            <div className="pt-5 pb-4 px-4 sm:pt-8 sm:pb-6 sm:px-8 bg-gradient-to-br from-white/50 to-white/20 flex flex-col items-center text-center">
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg mb-3">
                <img src={logo} alt="RaktPort" className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center gap-2 mb-0.5">
                <RoleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                <h1 className="text-lg sm:text-2xl font-bold text-gray-800">{cfg.title}</h1>
              </div>
              <p className="text-[11px] sm:text-sm text-gray-500">{cfg.subtitle}</p>
            </div>

            {/* Progress */}
            <div className="px-4 sm:px-8 pt-4 sm:pt-6 pb-1">
              <div className="flex items-center justify-between">
                {STEPS.map((label, i) => {
                  const s = i + 1;
                  const done   = s < step;
                  const active = s === step;
                  return (
                    <div key={s} className="flex items-center flex-1">
                      <div className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-[11px] sm:text-sm transition-all duration-200 flex-shrink-0 ${
                        done   ? `bg-gradient-to-r ${cfg.gradient} text-white` :
                        active ? `bg-gradient-to-r ${cfg.gradient} text-white ring-4 ring-white shadow-md scale-110` :
                                 'bg-gray-200 text-gray-500'
                      }`}>
                        {done ? <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : s}
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 rounded transition-all duration-300 ${done ? `bg-gradient-to-r ${cfg.gradient}` : 'bg-gray-200'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1.5">
                {STEPS.map(l => <span key={l} className="text-[9px] sm:text-[10px] text-gray-400 font-medium">{l}</span>)}
              </div>
            </div>

            {/* Step body */}
            <div className="px-4 sm:px-8 py-5 sm:py-6">
              <form noValidate className="space-y-5">

                {/* ══ STEP 1: Basic Info ══ */}
                {step === 1 && (
                  <div className="space-y-4 animate-fadein">
                    <h2 className="text-base sm:text-xl font-bold text-gray-800">Basic Information</h2>

                    {/* Google quick sign-up */}
                    <button
                      type="button"
                      onClick={handleGoogle}
                      disabled={gLoading || loading}
                      className="w-full flex items-center justify-center gap-2.5 min-h-[50px] px-4 py-3 sm:py-3.5 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md active:scale-[0.98] transition-all font-semibold text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    >
                      {gLoading ? <Spinner /> : <GoogleIcon size={18} />}
                      <span>{gLoading ? 'Continuing…' : 'Continue with Google'}</span>
                    </button>

                    <div className="flex items-center gap-2.5" aria-hidden="true">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-[10px] sm:text-xs text-gray-400 font-medium whitespace-nowrap">or fill in details</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    <Field label="Full Name" required>
                      <TInput
                        value={form.fullName}
                        onChange={v => set('fullName', v)}
                        placeholder="Enter your full name"
                        iconLeft={<User className="w-4 h-4 sm:w-5 sm:h-5" />}
                      />
                    </Field>

                    <Field label="Email Address" required>
                      <TInput
                        type="email"
                        value={form.email}
                        onChange={v => set('email', v)}
                        placeholder="you@example.com"
                        iconLeft={<Mail className="w-4 h-4 sm:w-5 sm:h-5" />}
                      />
                    </Field>

                    <Field label="Mobile Number" required hint="OTP will be sent to this number for verification">
                      <TInput
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={form.mobile}
                        onChange={v => set('mobile', v.replace(/\D/g, '').slice(0, 10))}
                        placeholder="9876543210"
                        prefix="+91"
                        iconLeft={<Phone className="w-4 h-4 sm:w-5 sm:h-5" />}
                      />
                    </Field>
                  </div>
                )}

                {/* ══ STEP 2: OTP ══ */}
                {step === 2 && (
                  <div className="space-y-5 animate-fadein">
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r ${cfg.gradient} flex items-center justify-center`}>
                        <Smartphone className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-xl font-bold text-gray-800 mb-1">Verify Phone Number</h2>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {otpSent
                            ? `Enter the 6-digit code sent to +91 ****${form.mobile.slice(-4)}`
                            : `Click below to receive OTP on +91 ${form.mobile}`}
                        </p>
                      </div>
                    </div>

                    {!otpSent ? (
                      <button type="button" onClick={sendOTP} disabled={otpLoading}
                        className={`w-full min-h-[50px] py-3.5 rounded-xl font-semibold text-white shadow-lg text-sm sm:text-base transition-all touch-manipulation bg-gradient-to-r ${cfg.gradient} hover:shadow-xl disabled:opacity-60`}>
                        {otpLoading
                          ? <span className="flex items-center justify-center gap-2"><Spinner white /> Sending…</span>
                          : <span className="flex items-center justify-center gap-2"><KeyRound className="w-5 h-5" /> Send OTP</span>}
                      </button>
                    ) : (
                      <div className="space-y-4">
                        {/* OTP boxes — large enough for easy mobile tapping */}
                        <div className="flex justify-center gap-2 sm:gap-3" role="group" aria-label="OTP input">
                          {otp.map((digit, idx) => (
                            <input
                              key={idx}
                              id={`otp-${uid}-${idx}`}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={e => changeOtpDigit(idx, e.target.value)}
                              onKeyDown={e => otpKeyDown(idx, e)}
                              disabled={otpVerified}
                              aria-label={`OTP digit ${idx + 1}`}
                              className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold border-2 rounded-xl outline-none transition-all touch-manipulation ${
                                otpVerified
                                  ? 'bg-green-50 border-green-500 text-green-700'
                                  : digit
                                    ? 'bg-white border-gray-500'
                                    : 'bg-white/60 border-gray-300 focus:border-gray-500 focus:ring-4 focus:ring-gray-200/50'
                              }`}
                              style={{ width: 44, height: 52 }}
                            />
                          ))}
                        </div>

                        {otpVerified ? (
                          <div className="flex items-center justify-center gap-2 text-green-600 font-semibold text-sm sm:text-base">
                            <CheckCircle2 className="w-5 h-5" /> Phone verified successfully!
                          </div>
                        ) : (
                          <>
                            <button type="button" onClick={verifyOTP} disabled={otpLoading || otp.join('').length !== 6}
                              className={`w-full min-h-[50px] py-3.5 rounded-xl font-semibold text-white shadow-lg text-sm sm:text-base transition-all touch-manipulation ${
                                otp.join('').length === 6
                                  ? `bg-gradient-to-r ${cfg.gradient} hover:shadow-xl active:scale-[0.99]`
                                  : 'bg-gray-300 cursor-not-allowed'
                              }`}>
                              {otpLoading ? <span className="flex items-center justify-center gap-2"><Spinner white />Verifying…</span> : 'Verify OTP'}
                            </button>
                            <p className="text-center text-xs sm:text-sm text-gray-500">
                              {resendTimer > 0
                                ? <>Resend in <strong>{resendTimer}s</strong></>
                                : <button type="button" onClick={async () => { setOtp(['','','','','','']); await sendOTP(); }} className="font-semibold text-gray-700 hover:text-gray-900 underline touch-manipulation">Resend OTP</button>}
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ══ STEP 3: Role Details ══ */}
                {step === 3 && (
                  <div className="space-y-4 animate-fadein">
                    <h2 className="text-base sm:text-xl font-bold text-gray-800">
                      {role === 'donor' ? 'Donor Details' : role === 'hospital' ? 'Hospital Details' : role === 'bloodbank' ? 'Blood Bank Details' : 'Admin Details'}
                    </h2>

                    {role === 'donor' && (
                      <>
                        <Field label="Aadhar Number" required>
                          <TInput
                            inputMode="numeric" maxLength={12}
                            value={form.aadhar}
                            onChange={v => set('aadhar', v.replace(/\D/g, '').slice(0, 12))}
                            placeholder="123456789012"
                            iconLeft={<FileText className="w-4 h-4 sm:w-5 sm:h-5" />}
                          />
                        </Field>

                        {/* Blood group + Gender — 2 cols always */}
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Blood Group" required>
                            <select value={form.bloodGroup} onChange={e => set('bloodGroup', e.target.value)}
                              className="w-full px-3 py-3 sm:py-3.5 bg-white/60 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 outline-none text-sm text-gray-800 transition-all">
                              <option value="">Select</option>
                              {BLOOD_GROUPS.map(bg => <option key={bg}>{bg}</option>)}
                            </select>
                          </Field>
                          <Field label="Gender" required>
                            <select value={form.gender} onChange={e => set('gender', e.target.value)}
                              className="w-full px-3 py-3 sm:py-3.5 bg-white/60 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 outline-none text-sm text-gray-800 transition-all">
                              <option value="">Select</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                          </Field>
                        </div>

                        <Field label="Date of Birth" required>
                          <TInput
                            type="date"
                            value={form.dob}
                            onChange={v => set('dob', v)}
                            max={new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().split('T')[0]}
                            iconLeft={<Calendar className="w-4 h-4 sm:w-5 sm:h-5" />}
                          />
                        </Field>

                        <Field label="Last Donation Date" hint="Leave blank if you haven't donated before">
                          <TInput
                            type="date"
                            value={form.lastDonationDate}
                            onChange={v => set('lastDonationDate', v)}
                            max={new Date().toISOString().split('T')[0]}
                            disabled={form.dontRemember}
                            iconLeft={<Calendar className="w-4 h-4 sm:w-5 sm:h-5" />}
                          />
                          <label className="flex items-center gap-2 mt-2 cursor-pointer touch-manipulation">
                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 accent-gray-700" checked={form.dontRemember}
                              onChange={e => { set('dontRemember', e.target.checked); if (e.target.checked) set('lastDonationDate', ''); }} />
                            <span className="text-xs sm:text-sm text-gray-600">I don't remember</span>
                          </label>
                        </Field>
                      </>
                    )}

                    {(role === 'hospital' || role === 'bloodbank') && (
                      <>
                        <Field label={role === 'hospital' ? 'Hospital Registration No.' : 'Blood Bank License No.'} required>
                          <TInput
                            value={role === 'hospital' ? form.registrationNo : form.licenseNo}
                            onChange={v => set(role === 'hospital' ? 'registrationNo' : 'licenseNo', v)}
                            placeholder={role === 'hospital' ? 'HOSP-2024-XXXXX' : 'BB-2024-XXXXX'}
                            iconLeft={<FileText className="w-4 h-4 sm:w-5 sm:h-5" />}
                          />
                        </Field>
                        <DocUpload inputId={`docs-${role}-${uid}`} docs={docs} onUpload={handleUpload} onRemove={i => setDocs(d => d.filter((_, x) => x !== i))} />
                      </>
                    )}

                    {role === 'admin' && (
                      <div className="flex gap-3 p-4 sm:p-5 bg-emerald-50 rounded-xl border-2 border-emerald-200">
                        <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-bold text-emerald-900 text-sm sm:text-base mb-1">Admin Registration</h3>
                          <p className="text-xs sm:text-sm text-emerald-700 leading-relaxed">
                            You'll have full platform access. Your account requires super admin approval before activation.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ══ STEP 4: Address ══ */}
                {step === 4 && (
                  <div className="space-y-4 animate-fadein">
                    <h2 className="text-base sm:text-xl font-bold text-gray-800">Address Details</h2>

                    <Field label="Complete Address" required>
                      <div className="relative group">
                        <Home className="absolute left-3 sm:left-3.5 top-3 sm:top-3.5 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-gray-600 transition-colors pointer-events-none" />
                        <textarea
                          rows={3}
                          value={form.address}
                          onChange={e => set('address', e.target.value)}
                          placeholder="Street, Building, Landmark…"
                          className="w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-3 sm:py-3.5 bg-white/60 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 outline-none transition-all resize-none text-sm text-gray-800 placeholder-gray-400"
                        />
                      </div>
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="District" required>
                        <input value={form.district} onChange={e => set('district', e.target.value)} placeholder="District"
                          className="w-full px-3 py-3 sm:py-3.5 bg-white/60 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 outline-none text-sm text-gray-800 placeholder-gray-400 transition-all" />
                      </Field>
                      <Field label="State" required>
                        <select value={form.state} onChange={e => set('state', e.target.value)}
                          className="w-full px-3 py-3 sm:py-3.5 bg-white/60 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 outline-none text-sm text-gray-800 transition-all">
                          <option value="">Select</option>
                          {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </Field>
                    </div>

                    <Field label="Pincode" required>
                      <TInput
                        inputMode="numeric" maxLength={6}
                        value={form.pincode}
                        onChange={v => set('pincode', v.replace(/\D/g, '').slice(0, 6))}
                        placeholder="110001"
                        iconLeft={<MapPin className="w-4 h-4 sm:w-5 sm:h-5" />}
                      />
                    </Field>
                  </div>
                )}

                {/* ══ STEP 5: Password + Terms ══ */}
                {step === 5 && (
                  <div className="space-y-4 animate-fadein">
                    <h2 className="text-base sm:text-xl font-bold text-gray-800">Set Password &amp; Finish</h2>

                    {/* Password */}
                    <Field label="Password" required>
                      <div className="relative group">
                        <Lock className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-gray-600 transition-colors pointer-events-none" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={form.password}
                          onChange={e => set('password', e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 sm:pl-11 pr-10 sm:pr-12 py-3 sm:py-3.5 bg-white/60 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 outline-none transition-all text-sm text-gray-800 placeholder-gray-400"
                        />
                        <button type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide' : 'Show'}
                          className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors touch-manipulation p-0.5">
                          {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                      </div>
                    </Field>

                    {/* Confirm password */}
                    <Field label="Confirm Password" required>
                      <div className="relative group">
                        <Lock className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-gray-600 transition-colors pointer-events-none" />
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          value={form.confirmPassword}
                          onChange={e => set('confirmPassword', e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 sm:pl-11 pr-10 sm:pr-12 py-3 sm:py-3.5 bg-white/60 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 outline-none transition-all text-sm text-gray-800 placeholder-gray-400"
                        />
                        <button type="button" tabIndex={-1} onClick={() => setShowConfirm(v => !v)} aria-label={showConfirm ? 'Hide' : 'Show'}
                          className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors touch-manipulation p-0.5">
                          {showConfirm ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                      </div>
                      {/* Live match indicator */}
                      {form.confirmPassword.length > 0 && (
                        <p className={`mt-1 text-[11px] font-medium flex items-center gap-1 ${form.password === form.confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                          {form.password === form.confirmPassword
                            ? <><CheckCircle2 className="w-3 h-3" /> Passwords match</>
                            : <><AlertCircle className="w-3 h-3" /> Passwords don't match</>}
                        </p>
                      )}
                    </Field>

                    {/* Password hint */}
                    <div className="flex gap-2.5 p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs sm:text-sm text-blue-800">
                        <p className="font-semibold mb-0.5">Requirements</p>
                        <ul className="list-disc list-inside space-y-0.5 text-xs text-blue-700">
                          <li>At least 6 characters long</li>
                          <li>Mix letters and numbers for stronger security</li>
                        </ul>
                      </div>
                    </div>

                    {/* Terms */}
                    <label className="flex items-start gap-3 cursor-pointer touch-manipulation">
                      <span className="relative flex-shrink-0 mt-0.5">
                        <input type="checkbox" checked={form.acceptTerms} onChange={e => set('acceptTerms', e.target.checked)} className="sr-only peer" />
                        <span className="flex w-5 h-5 border-2 border-gray-300 rounded-md peer-checked:bg-gradient-to-br peer-checked:from-gray-700 peer-checked:to-gray-900 peer-checked:border-gray-700 transition-all items-center justify-center">
                          {form.acceptTerms && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </span>
                      </span>
                      <span className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                        I agree to the <strong className="text-gray-900">Terms &amp; Conditions</strong> and <strong className="text-gray-900">Privacy Policy</strong> of RaktPort
                      </span>
                    </label>

                    {/* Role notice */}
                    {role === 'donor' && (
                      <div className={`flex gap-2.5 p-3 sm:p-4 ${cfg.lightBg} rounded-xl border-l-4 ${cfg.borderL}`}>
                        <Heart className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                        <p className="text-xs sm:text-sm text-gray-700">
                          <strong className="text-red-700">Note:</strong> By registering you pledge to donate voluntarily and maintain eligibility criteria.
                        </p>
                      </div>
                    )}
                    {role !== 'donor' && (
                      <div className="flex gap-2.5 p-3 sm:p-4 bg-amber-50 rounded-xl border-l-4 border-amber-400">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                        <p className="text-xs sm:text-sm text-gray-700">
                          <strong className="text-amber-700">Important:</strong> Your account requires admin verification before login access is granted.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Navigation ── */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 gap-3">
                  {step > 1 && (
                    <button type="button" onClick={goPrev} disabled={loading}
                      className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 sm:py-3 min-h-[46px] bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 active:scale-95 transition-all font-semibold text-sm text-gray-700 disabled:opacity-50 touch-manipulation">
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                  )}

                  {step < 5 ? (
                    <button type="button" onClick={goNext}
                      disabled={step === 2 && otpSent && !otpVerified}
                      className={`ml-auto flex items-center gap-1.5 px-5 sm:px-6 py-2.5 sm:py-3 min-h-[46px] bg-gradient-to-r ${cfg.gradient} text-white rounded-xl hover:shadow-lg active:scale-95 transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation`}>
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button type="button" onClick={handleSubmit}
                      disabled={loading || !form.acceptTerms}
                      className={`ml-auto flex items-center gap-2 px-5 sm:px-8 py-3 sm:py-3.5 min-h-[46px] bg-gradient-to-r ${cfg.gradient} text-white rounded-xl hover:shadow-xl active:scale-[0.99] transition-all font-bold text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation`}>
                      {loading ? <><Spinner white />Registering…</> : <><CheckCircle2 className="w-4 h-4" />Complete Registration</>}
                    </button>
                  )}
                </div>

                {/* Login link */}
                <p className="text-center text-xs sm:text-sm text-gray-600 pt-1">
                  Already have an account?{' '}
                  <button type="button" onClick={onLoginClick}
                    className={`font-semibold bg-gradient-to-r ${cfg.gradient} bg-clip-text text-transparent hover:underline touch-manipulation`}>
                    Login here
                  </button>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%,100% { transform:translate(0,0) scale(1); }
          25%  { transform:translate(20px,-20px) scale(1.1); }
          50%  { transform:translate(-20px,20px) scale(0.9); }
          75%  { transform:translate(20px,20px) scale(1.05); }
        }
        .animate-blob           { animation:blob 8s infinite ease-in-out; }
        .animation-delay-2000   { animation-delay:2s; }
        .animation-delay-4000   { animation-delay:4s; }
        @keyframes fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .animate-fadein { animation:fadein 0.28s ease both; }
        button:focus:not(:focus-visible) { outline:none; }
        /* Ensure selects look native on iOS */
        select { -webkit-appearance:none; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 12px center; padding-right:36px !important; }
      `}</style>
    </div>
  );
}
