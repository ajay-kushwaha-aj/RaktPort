// src/components/SignupPage.tsx
// Enhanced: Blood Bank inventory step, Google signup profile completion, password strength, better UX
// Updated: @rakt username system + internal ID generation

import { useState, useEffect, useCallback, useId, useRef } from 'react';
import {
  initRecaptcha,
  sendRegistrationOTP,
  verifyRegistrationOTP,
  registerUserWithPhone,
  signInWithGoogle,
} from '../lib/auth';
import { sendVerificationEmail } from '../lib/emailService';
import {
  isValidUsername,
  checkUsernameAvailable,
  formatUsername,
} from '../lib/identity';
import { toast } from 'sonner';
import {
  ArrowLeft, Eye, EyeOff, Upload, X, CheckCircle2,
  User, Mail, Phone, Lock, MapPin, Calendar, Droplet,
  FileText, Building2, Heart, Shield, AlertCircle, Loader2,
  ChevronRight, ChevronLeft, Home, Smartphone, KeyRound,
  Package, Clock, Zap, Check, Info, AtSign,
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

const BLOOD_GROUP_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'A+':  { bg: 'bg-red-50',     text: 'text-red-700',    border: 'border-red-200'   },
  'A-':  { bg: 'bg-rose-50',    text: 'text-rose-700',   border: 'border-rose-200'  },
  'B+':  { bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200'  },
  'B-':  { bg: 'bg-cyan-50',    text: 'text-cyan-700',   border: 'border-cyan-200'  },
  'O+':  { bg: 'bg-green-50',   text: 'text-green-700',  border: 'border-green-200' },
  'O-':  { bg: 'bg-emerald-50', text: 'text-emerald-700',border: 'border-emerald-200'},
  'AB+': { bg: 'bg-purple-50',  text: 'text-purple-700', border: 'border-purple-200'},
  'AB-': { bg: 'bg-violet-50',  text: 'text-violet-700', border: 'border-violet-200'},
};

// Steps: Basic → OTP → OrgDetails → [Inventory for bloodbank] → Address → Finish
const getSteps = (role: string) =>
  role === 'bloodbank'
    ? ['Basic','OTP','Details','Inventory','Address','Finish']
    : ['Basic','OTP','Details','Address','Finish'];

/* ─────────────────── Helpers ─────────────────── */

function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-amber-500' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-blue-500' };
  return { score, label: 'Strong', color: 'bg-green-500' };
}

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
              <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
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

// ─── Blood Group Inventory Input ──────────────────────────────────────────────
function InventoryInput({
  bloodGroup,
  value,
  onChange,
}: {
  bloodGroup: string;
  value: number;
  onChange: (val: number) => void;
}) {
  const colors = BLOOD_GROUP_COLORS[bloodGroup] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
  return (
    <div className={`${colors.bg} ${colors.border} border-2 rounded-xl p-3 flex flex-col items-center gap-2`}>
      <span className={`text-lg font-black ${colors.text}`}>{bloodGroup}</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 5))}
          className="w-7 h-7 rounded-lg bg-white/80 border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:scale-95 transition-all font-bold text-sm touch-manipulation"
        >−</button>
        <input
          type="number"
          min="0"
          max="9999"
          value={value}
          onChange={e => onChange(Math.max(0, Math.min(9999, parseInt(e.target.value) || 0)))}
          className={`w-14 text-center py-1 rounded-lg border-2 ${colors.border} bg-white/80 text-sm font-bold ${colors.text} outline-none focus:ring-2 focus:ring-purple-300`}
        />
        <button
          type="button"
          onClick={() => onChange(Math.min(9999, value + 5))}
          className="w-7 h-7 rounded-lg bg-white/80 border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 active:scale-95 transition-all font-bold text-sm touch-manipulation"
        >+</button>
      </div>
      <span className="text-[10px] text-gray-400 font-medium">units</span>
    </div>
  );
}

/* ─────────────────── Google Profile Completion Modal ─────────────────── */
function GoogleProfileCompletion({
  role,
  displayName,
  email,
  googleUid,
  onComplete,
  onCancel,
  cfg,
}: {
  role: string;
  displayName: string;
  email: string;
  googleUid: string;
  onComplete: () => void;
  onCancel: () => void;
  cfg: typeof ROLE_CONFIG[keyof typeof ROLE_CONFIG];
}) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [licenseNo, setLicenseNo] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [mobile, setMobile] = useState('');
  const [inventory, setInventory] = useState<Record<string, number>>(
    Object.fromEntries(BLOOD_GROUPS.map(bg => [bg, 0]))
  );

  const totalSteps = role === 'bloodbank' ? 3 : 2;

  const handleSubmit = async () => {
    if (!address || !district || !state || !pincode) { toast.error('Fill complete address'); return; }
    if (pincode.length !== 6) { toast.error('Pincode must be 6 digits'); return; }
    setLoading(true);
    try {
      // Update the Firestore doc with org-specific details
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      await updateDoc(doc(db, 'users', googleUid), {
        address, district, state, pincode,
        mobile: mobile ? `+91${mobile}` : '',
        ...(role === 'hospital' && { registrationNo }),
        ...(role === 'bloodbank' && { licenseNo }),
        ...(role === 'bloodbank' && {
          inventorySetup: Object.fromEntries(
            BLOOD_GROUPS.map(bg => [bg, { total: inventory[bg], available: inventory[bg] }])
          )
        }),
        profileComplete: true,
        updatedAt: new Date(),
      });

      // For bloodbank, also create inventory doc
      if (role === 'bloodbank') {
        const { setDoc } = await import('firebase/firestore');
        await setDoc(doc(db, 'inventory', googleUid), 
          Object.fromEntries(BLOOD_GROUPS.map(bg => [bg, { total: inventory[bg], available: inventory[bg] }]))
        );
      }

      toast.success('Profile completed! You can now log in.');
      onComplete();
    } catch (e: any) {
      toast.error('Failed to save details', { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`p-5 bg-gradient-to-r ${cfg.gradient} text-white rounded-t-2xl`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <GoogleIcon size={20} />
            </div>
            <div>
              <h2 className="font-bold text-lg">Complete Your Profile</h2>
              <p className="text-xs opacity-80">Signed in as {email}</p>
            </div>
          </div>
          {/* Steps */}
          <div className="flex gap-2 mt-4">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i < step ? 'bg-white' : 'bg-white/30'}`} />
            ))}
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Step 1: Org details */}
          {step === 1 && (
            <div className="space-y-4 animate-fadein">
              <h3 className="font-bold text-gray-800">Organization Details</h3>
              {role === 'hospital' && (
                <Field label="Hospital Registration No." required>
                  <TInput value={registrationNo} onChange={setRegistrationNo} placeholder="HOSP-2024-XXXXX"
                    iconLeft={<FileText className="w-4 h-4" />} />
                </Field>
              )}
              {role === 'bloodbank' && (
                <Field label="Blood Bank License No." required>
                  <TInput value={licenseNo} onChange={setLicenseNo} placeholder="BB-2024-XXXXX"
                    iconLeft={<FileText className="w-4 h-4" />} />
                </Field>
              )}
              <Field label="Mobile Number">
                <TInput type="tel" inputMode="numeric" maxLength={10}
                  value={mobile} onChange={v => setMobile(v.replace(/\D/g,'').slice(0,10))}
                  placeholder="9876543210" prefix="+91"
                  iconLeft={<Phone className="w-4 h-4" />} />
              </Field>
            </div>
          )}

          {/* Step 2 (bloodbank): Inventory */}
          {step === 2 && role === 'bloodbank' && (
            <div className="space-y-4 animate-fadein">
              <div className="flex items-center gap-2">
                <Droplet className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-gray-800">Initial Blood Inventory</h3>
              </div>
              <p className="text-xs text-gray-500">Enter current stock levels (you can update later from dashboard)</p>
              <div className="grid grid-cols-4 gap-2">
                {BLOOD_GROUPS.map(bg => (
                  <InventoryInput key={bg} bloodGroup={bg} value={inventory[bg] || 0}
                    onChange={v => setInventory(prev => ({ ...prev, [bg]: v }))} />
                ))}
              </div>
              <div className="bg-purple-50 rounded-xl p-3 text-xs text-purple-700 flex items-start gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Total units: <strong>{Object.values(inventory).reduce((s, v) => s + v, 0)}</strong>. You can skip this and add inventory from your dashboard later.</span>
              </div>
            </div>
          )}

          {/* Address step */}
          {((step === 2 && role !== 'bloodbank') || (step === 3 && role === 'bloodbank')) && (
            <div className="space-y-4 animate-fadein">
              <h3 className="font-bold text-gray-800">Address Details</h3>
              <Field label="Complete Address" required>
                <div className="relative">
                  <Home className="absolute left-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                  <textarea rows={2} value={address} onChange={e => setAddress(e.target.value)}
                    placeholder="Street, Building, Landmark…"
                    className="w-full pl-9 pr-3 py-3 bg-white/60 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 outline-none text-sm text-gray-800 placeholder-gray-400 resize-none transition-all" />
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="District" required>
                  <input value={district} onChange={e => setDistrict(e.target.value)} placeholder="District"
                    className="w-full px-3 py-3 bg-white/60 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 outline-none text-sm text-gray-800 placeholder-gray-400 transition-all" />
                </Field>
                <Field label="State" required>
                  <select value={state} onChange={e => setState(e.target.value)}
                    className="w-full px-3 py-3 bg-white/60 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 outline-none text-sm text-gray-800 transition-all">
                    <option value="">Select</option>
                    {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Pincode" required>
                <TInput inputMode="numeric" maxLength={6} value={pincode}
                  onChange={v => setPincode(v.replace(/\D/g,'').slice(0,6))} placeholder="110001"
                  iconLeft={<MapPin className="w-4 h-4" />} />
              </Field>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-2">
            {step > 1 ? (
              <button type="button" onClick={() => setStep(s => s - 1)}
                className="px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all">
                ← Back
              </button>
            ) : (
              <button type="button" onClick={onCancel}
                className="px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 active:scale-95 transition-all">
                Cancel
              </button>
            )}
            {step < totalSteps ? (
              <button type="button" onClick={() => {
                if (step === 1) {
                  if (role === 'hospital' && !registrationNo) { toast.error('Registration number required'); return; }
                  if (role === 'bloodbank' && !licenseNo) { toast.error('License number required'); return; }
                }
                setStep(s => s + 1);
              }}
                className={`flex-1 py-2.5 bg-gradient-to-r ${cfg.gradient} text-white rounded-xl text-sm font-semibold hover:shadow-lg active:scale-95 transition-all`}>
                Continue →
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading}
                className={`flex-1 py-2.5 bg-gradient-to-r ${cfg.gradient} text-white rounded-xl text-sm font-bold hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2`}>
                {loading ? <><Spinner white />Saving…</> : <><CheckCircle2 className="w-4 h-4" />Complete Profile</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Main Component ─────────────────── */

export function SignupPage({ role, onBack, onLoginClick }: SignupPageProps) {
  const cfg = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG] ?? ROLE_CONFIG.donor;
  const RoleIcon = cfg.Icon;
  const uid = useId();
  const STEPS = getSteps(role);
  const TOTAL_STEPS = STEPS.length;

  /* Step state */
  const [step,            setStep]            = useState(1);
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [gLoading,        setGLoading]        = useState(false);

  /* Google profile completion */
  const [showGoogleCompletion, setShowGoogleCompletion] = useState(false);
  const [googleUser, setGoogleUser] = useState<{ uid: string; displayName: string; email: string } | null>(null);

  /* OTP state */
  const [otpSent,         setOtpSent]         = useState(false);
  const [otp,             setOtp]             = useState(['','','','','','']);
  const [otpLoading,      setOtpLoading]      = useState(false);
  const [otpVerified,     setOtpVerified]     = useState(false);
  const [resendTimer,     setResendTimer]     = useState(0);
  const [recaptchaV,      setRecaptchaV]      = useState<RecaptchaVerifier | null>(null);
  const [confirmation,    setConfirmation]    = useState<ConfirmationResult | null>(null);
  const [phoneUid,        setPhoneUid]        = useState('');
  const [generatedEmailOtp, setGeneratedEmailOtp] = useState('');

  /* Form data */
  const [form, setForm] = useState({
    fullName: '', email: '', mobile: '', password: '', confirmPassword: '',
    username: '',
    address: '', district: '', state: '', pincode: '', aadhar: '',
    bloodGroup: '', gender: '', dob: '', lastDonationDate: '',
    dontRemember: false, licenseNo: '', registrationNo: '',
    totalBeds: '', operatingHours: '',
    inventory: Object.fromEntries(BLOOD_GROUPS.map(bg => [bg, 0])) as Record<string, number>,
    acceptTerms: false,
  });

  const [docs, setDocs] = useState<File[]>([]);

  const set = useCallback((field: string, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value })), []);

  /* Username availability checking */
  const [usernameStatus, setUsernameStatus] = useState<'idle'|'checking'|'available'|'taken'|'invalid'>('idle');
  const usernameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUsernameChange = useCallback((val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9.]/g, '').slice(0, 20);
    set('username', clean);
    if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);
    if (!clean || clean.length < 3) { setUsernameStatus('idle'); return; }
    const check = isValidUsername(clean);
    if (!check.valid) { setUsernameStatus('invalid'); return; }
    setUsernameStatus('checking');
    usernameTimerRef.current = setTimeout(async () => {
      try {
        const avail = await checkUsernameAvailable(clean);
        setUsernameStatus(avail ? 'available' : 'taken');
      } catch { setUsernameStatus('idle'); }
    }, 600);
  }, [set]);

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
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error('Enter a valid email address first'); return; }
    // if (!recaptchaV) { toast.error('reCAPTCHA not ready — please refresh'); return; } // Dormant reCAPTCHA logic
    setOtpLoading(true);
    try {
      const gCode = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedEmailOtp(gCode);
      const res = await sendVerificationEmail(form.email, gCode, form.fullName || 'User');
      
      // Dormant firebase code:
      // const res = await sendRegistrationOTP(form.mobile, recaptchaV);
      
      if (res.success) {
        setOtpSent(true); setResendTimer(60);
        // setConfirmation(res.confirmationResult!); // Dormant
        toast.success('Verification Email sent!', { description: `Code sent to ${form.email}` });
      } else { toast.error('Failed to send verification email', { description: res.error }); }
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
    if (code.length !== 6) { toast.error('Enter the complete 6-digit verification code'); return; }
    setOtpLoading(true);
    try {
      // Local email verification check
      if (code === generatedEmailOtp) {
        setOtpVerified(true);
        setPhoneUid('dummy-phone-uid-for-email-verify'); // Dummy UI for backward compat
        toast.success('Email verified!');
        setTimeout(() => goNext(), 500);
      } else {
        toast.error('Verification failed', { description: 'Incorrect verification code.' });
        setOtp(['','','','','','']);
        (document.getElementById(`otp-${uid}-0`) as HTMLInputElement)?.focus();
      }
      
      // Dormant Firebase verify code
      /*
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
      */
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
    if (step === 2 && !otpVerified) { toast.error('Verify your email address first'); return false; }
    if (step === 3) {
      if (role === 'donor') {
        if (!form.aadhar || form.aadhar.length !== 12) { toast.error('Aadhar must be 12 digits'); return false; }
        if (!form.bloodGroup || !form.gender || !form.dob) { toast.error('Fill all donor details'); return false; }
      }
      if (role === 'hospital'  && !form.registrationNo) { toast.error('Enter hospital registration number'); return false; }
      if (role === 'bloodbank' && !form.licenseNo)      { toast.error('Enter blood bank license number');  return false; }
    }
    // Inventory step for bloodbank (step 4)
    if (step === 4 && role === 'bloodbank') {
      // Inventory is optional — just proceed
      return true;
    }
    // Address step
    const addressStep = role === 'bloodbank' ? 5 : 4;
    if (step === addressStep) {
      if (!form.address.trim() || !form.district.trim() || !form.state || !form.pincode) { toast.error('Fill complete address'); return false; }
      if (form.pincode.length !== 6) { toast.error('Pincode must be 6 digits'); return false; }
    }
    // Password step
    const pwdStep = TOTAL_STEPS;
    if (step === pwdStep) {
      if (!form.password || !form.confirmPassword) { toast.error('Set a password'); return false; }
      if (form.password !== form.confirmPassword)  { toast.error('Passwords do not match'); return false; }
      if (form.password.length < 6)                { toast.error('Password must be ≥ 6 characters'); return false; }
      if (!form.acceptTerms)                       { toast.error('Accept terms & conditions'); return false; }
    }
    return true;
  }, [step, form, otpVerified, role, TOTAL_STEPS]);

  const goNext = () => { if (validate()) setStep(s => Math.min(s + 1, TOTAL_STEPS)); };
  const goPrev = () => setStep(s => Math.max(s - 1, 1));

  /* Submit */
  const handleSubmit = async () => {
    if (!validate() || !otpVerified) return;
    setLoading(true);
    try {
      const inventoryForFirestore = role === 'bloodbank'
        ? Object.fromEntries(BLOOD_GROUPS.map(bg => [bg, { total: form.inventory[bg] || 0, available: form.inventory[bg] || 0 }]))
        : undefined;

      const res = await registerUserWithPhone(form.email, form.password, {
        role, fullName: form.fullName, mobile: `+91${form.mobile}`,
        ...(form.username && { username: form.username }),
        address: form.address, district: form.district, state: form.state, pincode: form.pincode,
        isVerified: role === 'donor',
        ...(role === 'donor'     && { aadhar: form.aadhar, bloodGroup: form.bloodGroup, gender: form.gender, dob: form.dob, lastDonationDate: form.dontRemember ? null : form.lastDonationDate, credits: 0 }),
        ...(role === 'hospital'  && { registrationNo: form.registrationNo, totalBeds: form.totalBeds }),
        ...(role === 'bloodbank' && { licenseNo: form.licenseNo, operatingHours: form.operatingHours }),
      }, phoneUid);

      if (res.success) {
        // For bloodbank, also initialise inventory document
        if (role === 'bloodbank' && inventoryForFirestore && res.userId) {
          try {
            const { doc, setDoc } = await import('firebase/firestore');
            const { db } = await import('../firebase');
            await setDoc(doc(db, 'inventory', res.userId), inventoryForFirestore);
          } catch (e) {
            console.warn('Inventory init failed:', e);
          }
        }
        toast.success('Registration successful!', { description: role === 'donor' ? 'You can now log in.' : 'Account pending admin verification.' });
        setTimeout(onLoginClick, 2000);
      } else { toast.error('Registration failed', { description: res.error }); }
    } catch (e: any) { toast.error('Error', { description: e.message ?? 'Unexpected error' }); }
    finally { setLoading(false); }
  };

  /* Google sign-up */
  const handleGoogle = useCallback(async () => {
    setGLoading(true);
    try {
      const res = await signInWithGoogle(role);
      if (res.success) {
        if (role === 'donor') {
          // Donors: direct login
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userRole', role);
          localStorage.setItem('userId', res.userId!);
          if (res.email) localStorage.setItem('userEmail', res.email);
          toast.success(res.isNewUser ? 'Account created with Google!' : 'Signed in with Google!', { description: `Welcome, ${res.displayName ?? ''}` });
          setTimeout(() => { window.location.href = '/'; }, 600);
        } else {
          // Orgs: need to complete profile first
          if (res.isNewUser) {
            // New org account — show profile completion
            setGoogleUser({ uid: res.userId!, displayName: res.displayName ?? '', email: res.email ?? '' });
            setShowGoogleCompletion(true);
            toast.info('Almost there!', { description: 'Complete your organization profile to continue.' });
          } else {
            // Existing account — just log in
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userRole', role);
            localStorage.setItem('userId', res.userId!);
            if (res.email) localStorage.setItem('userEmail', res.email);
            toast.success('Signed in with Google!');
            setTimeout(() => { window.location.href = '/'; }, 600);
          }
        }
      } else if (res.error !== 'Sign-in cancelled.') {
        toast.error('Google sign-up failed', { description: res.error });
      }
    } catch (e: any) { toast.error('Google error', { description: e.message }); }
    finally { setGLoading(false); }
  }, [role]);

  const pwdStrength = getPasswordStrength(form.password);

  /* Total units helper for inventory display */
  const totalInventoryUnits = Object.values(form.inventory).reduce((s, v) => s + v, 0);

  /* ─────────────────── Render ─────────────────── */
  return (
    <div className={`min-h-screen relative overflow-hidden bg-gradient-to-br ${cfg.bgGrad}`}>
      {/* reCAPTCHA anchor */}
      <div id="sp-recaptcha" aria-hidden="true" />

      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className={`absolute -top-40 -right-40 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-br ${cfg.gradient} rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob`} />
        <div className="absolute -bottom-40 -left-40 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-br ${cfg.gradient} rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000`} />
      </div>

      {/* Google Profile Completion Modal */}
      {showGoogleCompletion && googleUser && (
        <GoogleProfileCompletion
          role={role}
          displayName={googleUser.displayName}
          email={googleUser.email}
          googleUid={googleUser.uid}
          cfg={cfg}
          onComplete={() => {
            setShowGoogleCompletion(false);
            toast.success('Profile complete! Pending admin verification.');
            setTimeout(onLoginClick, 1500);
          }}
          onCancel={() => {
            setShowGoogleCompletion(false);
            setGoogleUser(null);
          }}
        />
      )}

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

                    {/* Google notice for orgs */}
                    {role !== 'donor' && (
                      <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>Google sign-up for {role === 'bloodbank' ? 'Blood Banks' : 'Hospitals'} will prompt you to complete your organization profile after sign-in.</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2.5" aria-hidden="true">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-[10px] sm:text-xs text-gray-400 font-medium whitespace-nowrap">or fill in details</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    <Field label="Full Name" required>
                      <TInput value={form.fullName} onChange={v => set('fullName', v)} placeholder="Enter your full name"
                        iconLeft={<User className="w-4 h-4 sm:w-5 sm:h-5" />} />
                    </Field>

                    <Field label="Email Address" required>
                      <TInput type="email" value={form.email} onChange={v => set('email', v)} placeholder="you@example.com"
                        iconLeft={<Mail className="w-4 h-4 sm:w-5 sm:h-5" />} />
                    </Field>

                    <Field label="Mobile Number" required hint="OTP will be sent to this number for verification">
                      <TInput type="tel" inputMode="numeric" maxLength={10}
                        value={form.mobile} onChange={v => set('mobile', v.replace(/\D/g, '').slice(0, 10))}
                        placeholder="9876543210" prefix="+91"
                        iconLeft={<Phone className="w-4 h-4 sm:w-5 sm:h-5" />} />
                      {form.mobile.length > 0 && form.mobile.length < 10 && (
                        <p className="mt-1 text-[10px] text-amber-600 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {10 - form.mobile.length} more digits needed
                        </p>
                      )}
                    </Field>

                    {/* @rakt Username */}
                    <Field
                      label={`Choose your @rakt username${role === 'hospital' || role === 'bloodbank' ? '' : ' (optional)'}`}
                      required={role === 'hospital' || role === 'bloodbank'}
                      hint="3-20 chars: lowercase letters, numbers, dots. E.g. ajay.kumar"
                    >
                      <div className="relative group">
                        <AtSign className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-gray-600 transition-colors pointer-events-none" />
                        <input
                          type="text"
                          value={form.username}
                          onChange={e => handleUsernameChange(e.target.value)}
                          placeholder="yourname"
                          maxLength={20}
                          className="w-full pl-9 sm:pl-11 pr-24 py-3 sm:py-3.5 bg-white/60 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 outline-none transition-all text-gray-800 placeholder-gray-400 text-sm"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 pointer-events-none select-none">@rakt</span>
                      </div>
                      {/* Status indicator */}
                      {form.username.length >= 3 && (
                        <div className={`mt-1.5 flex items-center gap-1.5 text-[11px] font-medium ${
                          usernameStatus === 'checking'  ? 'text-gray-500' :
                          usernameStatus === 'available' ? 'text-green-600' :
                          usernameStatus === 'taken'     ? 'text-red-600' :
                          usernameStatus === 'invalid'   ? 'text-amber-600' : 'text-gray-500'
                        }`}>
                          {usernameStatus === 'checking'  && <><Loader2 className="w-3 h-3 animate-spin" /> Checking availability…</>}
                          {usernameStatus === 'available' && <><CheckCircle2 className="w-3 h-3" /> <strong>{formatUsername(form.username)}</strong> is available!</>}
                          {usernameStatus === 'taken'     && <><AlertCircle className="w-3 h-3" /> This username is taken</>}
                          {usernameStatus === 'invalid'   && <><AlertCircle className="w-3 h-3" /> {isValidUsername(form.username).error}</>}
                        </div>
                      )}
                    </Field>
                  </div>
                )}

                {/* ══ STEP 2: OTP ══ */}
                {step === 2 && (
                  <div className="space-y-5 animate-fadein">
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r ${cfg.gradient} flex items-center justify-center shadow-lg`}>
                        <Mail className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-xl font-bold text-gray-800 mb-1">Verify Email Address</h2>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {otpSent
                            ? `Enter the 6-digit code sent to ${form.email}`
                            : `Click below to receive code on ${form.email}`}
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
                              className={`text-center text-xl sm:text-2xl font-bold border-2 rounded-xl outline-none transition-all touch-manipulation ${
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
                            <CheckCircle2 className="w-5 h-5" /> Email verified successfully!
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
                                ? <>Resend in <strong className="text-gray-700">{resendTimer}s</strong></>
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
                          <TInput inputMode="numeric" maxLength={12}
                            value={form.aadhar} onChange={v => set('aadhar', v.replace(/\D/g, '').slice(0, 12))}
                            placeholder="123456789012" iconLeft={<FileText className="w-4 h-4 sm:w-5 sm:h-5" />} />
                          {form.aadhar.length > 0 && (
                            <div className="flex gap-1 mt-1.5">
                              {Array.from({length: 12}).map((_, i) => (
                                <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i < form.aadhar.length ? 'bg-green-500' : 'bg-gray-200'}`} />
                              ))}
                            </div>
                          )}
                        </Field>
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
                          <TInput type="date" value={form.dob} onChange={v => set('dob', v)}
                            max={new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().split('T')[0]}
                            iconLeft={<Calendar className="w-4 h-4 sm:w-5 sm:h-5" />} />
                        </Field>
                        <Field label="Last Donation Date" hint="Leave blank if you haven't donated before">
                          <TInput type="date" value={form.lastDonationDate} onChange={v => set('lastDonationDate', v)}
                            max={new Date().toISOString().split('T')[0]} disabled={form.dontRemember}
                            iconLeft={<Calendar className="w-4 h-4 sm:w-5 sm:h-5" />} />
                          <label className="flex items-center gap-2 mt-2 cursor-pointer touch-manipulation">
                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 accent-gray-700" checked={form.dontRemember}
                              onChange={e => { set('dontRemember', e.target.checked); if (e.target.checked) set('lastDonationDate', ''); }} />
                            <span className="text-xs sm:text-sm text-gray-600">I don't remember</span>
                          </label>
                        </Field>
                      </>
                    )}

                    {role === 'hospital' && (
                      <>
                        <Field label="Hospital Registration No." required>
                          <TInput value={form.registrationNo} onChange={v => set('registrationNo', v)} placeholder="HOSP-2024-XXXXX"
                            iconLeft={<FileText className="w-4 h-4 sm:w-5 sm:h-5" />} />
                        </Field>
                        <Field label="Total Beds (Optional)" hint="Approximate total bed capacity">
                          <TInput inputMode="numeric" value={form.totalBeds} onChange={v => set('totalBeds', v.replace(/\D/g,''))}
                            placeholder="e.g. 200" iconLeft={<Package className="w-4 h-4 sm:w-5 sm:h-5" />} />
                        </Field>
                        <DocUpload inputId={`docs-hospital-${uid}`} docs={docs} onUpload={handleUpload} onRemove={i => setDocs(d => d.filter((_, x) => x !== i))} />
                      </>
                    )}

                    {role === 'bloodbank' && (
                      <>
                        <Field label="Blood Bank License No." required>
                          <TInput value={form.licenseNo} onChange={v => set('licenseNo', v)} placeholder="BB-2024-XXXXX"
                            iconLeft={<FileText className="w-4 h-4 sm:w-5 sm:h-5" />} />
                        </Field>
                        <Field label="Operating Hours (Optional)" hint="e.g. Mon–Sat 8 AM – 8 PM">
                          <TInput value={form.operatingHours} onChange={v => set('operatingHours', v)} placeholder="Mon–Sat 8:00 AM – 8:00 PM"
                            iconLeft={<Clock className="w-4 h-4 sm:w-5 sm:h-5" />} />
                        </Field>
                        <DocUpload inputId={`docs-bb-${uid}`} docs={docs} onUpload={handleUpload} onRemove={i => setDocs(d => d.filter((_, x) => x !== i))} />
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

                {/* ══ STEP 4: Blood Bank Inventory (bloodbank only) ══ */}
                {step === 4 && role === 'bloodbank' && (
                  <div className="space-y-4 animate-fadein">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Droplet className="w-5 h-5 text-purple-600" fill="currentColor" />
                        <h2 className="text-base sm:text-xl font-bold text-gray-800">Initial Blood Inventory</h2>
                      </div>
                      {totalInventoryUnits > 0 && (
                        <span className="text-xs font-bold bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                          {totalInventoryUnits} units total
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Enter your current blood stock. Use +/− to adjust or type directly. You can update this anytime from the dashboard.
                    </p>

                    <div className="grid grid-cols-4 gap-2.5">
                      {BLOOD_GROUPS.map(bg => (
                        <InventoryInput
                          key={bg}
                          bloodGroup={bg}
                          value={form.inventory[bg] || 0}
                          onChange={v => set('inventory', { ...form.inventory, [bg]: v })}
                        />
                      ))}
                    </div>

                    {/* Quick fill presets */}
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 font-medium">Quick presets:</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: 'Skip (all 0)', values: Object.fromEntries(BLOOD_GROUPS.map(bg => [bg, 0])) },
                          { label: 'Small bank (~20 each)', values: Object.fromEntries(BLOOD_GROUPS.map(bg => [bg, 20])) },
                          { label: 'Medium bank (~50 each)', values: Object.fromEntries(BLOOD_GROUPS.map(bg => [bg, 50])) },
                        ].map(preset => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => set('inventory', preset.values)}
                            className="px-3 py-1.5 text-xs font-semibold bg-white border-2 border-purple-200 text-purple-700 rounded-xl hover:bg-purple-50 active:scale-95 transition-all touch-manipulation"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Blood Group Tips */}
                    <div className="bg-purple-50 rounded-xl p-3 border border-purple-200">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-purple-800 space-y-1">
                          <p className="font-semibold">Inventory Tips:</p>
                          <p>• O+ and A+ are the most commonly needed blood types</p>
                          <p>• O− is the universal donor — keep extra stock if possible</p>
                          <p>• AB+ is the universal recipient blood type</p>
                          <p className="text-purple-600">Critical alert triggers when any group falls below 30 units</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ══ ADDRESS STEP ══ */}
                {((step === 4 && role !== 'bloodbank') || (step === 5 && role === 'bloodbank')) && (
                  <div className="space-y-4 animate-fadein">
                    <h2 className="text-base sm:text-xl font-bold text-gray-800">Address Details</h2>

                    <Field label="Complete Address" required>
                      <div className="relative group">
                        <Home className="absolute left-3 sm:left-3.5 top-3 sm:top-3.5 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-gray-600 transition-colors pointer-events-none" />
                        <textarea rows={3} value={form.address} onChange={e => set('address', e.target.value)}
                          placeholder="Street, Building, Landmark…"
                          className="w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-3 sm:py-3.5 bg-white/60 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 outline-none transition-all resize-none text-sm text-gray-800 placeholder-gray-400" />
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
                      <TInput inputMode="numeric" maxLength={6}
                        value={form.pincode} onChange={v => set('pincode', v.replace(/\D/g, '').slice(0, 6))}
                        placeholder="110001" iconLeft={<MapPin className="w-4 h-4 sm:w-5 sm:h-5" />} />
                    </Field>
                  </div>
                )}

                {/* ══ PASSWORD STEP ══ */}
                {step === TOTAL_STEPS && (
                  <div className="space-y-4 animate-fadein">
                    <h2 className="text-base sm:text-xl font-bold text-gray-800">Set Password &amp; Finish</h2>

                    <Field label="Password" required>
                      <div className="relative group">
                        <Lock className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-gray-600 transition-colors pointer-events-none" />
                        <input type={showPassword ? 'text' : 'password'} value={form.password}
                          onChange={e => set('password', e.target.value)} placeholder="••••••••"
                          className="w-full pl-9 sm:pl-11 pr-10 sm:pr-12 py-3 sm:py-3.5 bg-white/60 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 outline-none transition-all text-sm text-gray-800 placeholder-gray-400" />
                        <button type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide' : 'Show'}
                          className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors touch-manipulation p-0.5">
                          {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                      </div>
                      {/* Password strength meter */}
                      {form.password.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <div className="flex gap-1">
                            {Array.from({length: 5}).map((_, i) => (
                              <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i < pwdStrength.score ? pwdStrength.color : 'bg-gray-200'}`} />
                            ))}
                          </div>
                          <p className={`text-[10px] font-semibold ${
                            pwdStrength.label === 'Strong' ? 'text-green-600' :
                            pwdStrength.label === 'Good'   ? 'text-blue-600' :
                            pwdStrength.label === 'Fair'   ? 'text-amber-600' : 'text-red-500'
                          }`}>
                            Password strength: {pwdStrength.label}
                          </p>
                        </div>
                      )}
                    </Field>

                    <Field label="Confirm Password" required>
                      <div className="relative group">
                        <Lock className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-gray-600 transition-colors pointer-events-none" />
                        <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword}
                          onChange={e => set('confirmPassword', e.target.value)} placeholder="••••••••"
                          className="w-full pl-9 sm:pl-11 pr-10 sm:pr-12 py-3 sm:py-3.5 bg-white/60 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 outline-none transition-all text-sm text-gray-800 placeholder-gray-400" />
                        <button type="button" tabIndex={-1} onClick={() => setShowConfirm(v => !v)} aria-label={showConfirm ? 'Hide' : 'Show'}
                          className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors touch-manipulation p-0.5">
                          {showConfirm ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                      </div>
                      {form.confirmPassword.length > 0 && (
                        <p className={`mt-1 text-[11px] font-medium flex items-center gap-1 ${form.password === form.confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                          {form.password === form.confirmPassword
                            ? <><CheckCircle2 className="w-3 h-3" /> Passwords match</>
                            : <><AlertCircle className="w-3 h-3" /> Passwords don't match</>}
                        </p>
                      )}
                    </Field>

                    {/* Summary card for Blood Banks */}
                    {role === 'bloodbank' && (
                      <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
                        <p className="text-xs font-bold text-purple-800 mb-2 flex items-center gap-1.5">
                          <Droplet className="w-3.5 h-3.5" fill="currentColor" /> Blood Bank Summary
                        </p>
                        <div className="grid grid-cols-4 gap-1.5">
                          {BLOOD_GROUPS.map(bg => {
                            const units = form.inventory[bg] || 0;
                            const colors = BLOOD_GROUP_COLORS[bg];
                            return (
                              <div key={bg} className={`${colors.bg} ${colors.border} border rounded-lg py-1.5 text-center`}>
                                <p className={`text-xs font-black ${colors.text}`}>{bg}</p>
                                <p className={`text-sm font-bold ${colors.text}`}>{units}</p>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-xs text-purple-600 mt-2 font-medium">Total: {totalInventoryUnits} units · License: {form.licenseNo || '—'}</p>
                      </div>
                    )}

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

                  {step < TOTAL_STEPS ? (
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
        select { -webkit-appearance:none; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 12px center; padding-right:36px !important; }
      `}</style>
    </div>
  );
}