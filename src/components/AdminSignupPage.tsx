// src/components/AdminSignupPage.tsx
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Settings,
  Shield,
  CheckCircle2,
  Smartphone,
  KeyRound,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  Eye,
  EyeOff
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { db } from '../firebase';
import { doc, setDoc, getDoc, query, where, collection, getDocs } from 'firebase/firestore';
import {
  initRecaptcha,
  sendRegistrationOTP,
  verifyRegistrationOTP,
  registerUserWithPhone
} from '../lib/auth';
import type { RecaptchaVerifier } from 'firebase/auth';
import { toast } from 'sonner';

interface AdminSignupPageProps {
  onBack: () => void;
  onLoginClick: () => void;
}

interface FormData {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
  adminKey: string;
  state: string;
  district: string;
  pincode: string;
}

// Admin registration keys loaded from environment variable (comma-separated).
// Extra commas and whitespace are ignored. In development, a warning is logged
// if the variable is missing or results in no valid keys.
const VALID_ADMIN_KEYS: string[] = (import.meta.env.VITE_ADMIN_REGISTRATION_KEYS ?? '')
  .split(',')
  .map((k: string) => k.trim())
  .filter(Boolean);

if (import.meta.env.DEV && VALID_ADMIN_KEYS.length === 0) {
  console.warn(
    '[AdminSignup] VITE_ADMIN_REGISTRATION_KEYS is not set or contains no valid entries. ' +
    'Admin registration will be unavailable. Set this variable in your .env file.'
  );
}

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export function AdminSignupPage({ onBack, onLoginClick }: AdminSignupPageProps) {
  // Form state
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    adminKey: '',
    state: '',
    district: '',
    pincode: '',
  });

  // UI states
  const [step, setStep] = useState(1); // 1: Admin Key, 2: Details, 3: OTP, 4: Password
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP states
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [phoneAuthUid, setPhoneAuthUid] = useState('');

  // Initialize Recaptcha
  useEffect(() => {
    const verifier = initRecaptcha('recaptcha-container');
    setRecaptchaVerifier(verifier);

    return () => {
      if (verifier) {
        verifier.clear();
      }
    };
  }, []);

  // Timer for OTP resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    setError('');
  };

  const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>, field: string, limit: number) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= limit) {
      setFormData(prev => ({ ...prev, [field]: value }));
      setError('');
    }
  };

  // Validate admin key
  const validateAdminKey = () => {
    if (!formData.adminKey.trim()) {
      setError('Admin key is required');
      return false;
    }

    if (VALID_ADMIN_KEYS.length === 0) {
      setError('Admin registration is currently unavailable due to missing configuration. Please contact your system administrator.');
      return false;
    }

    if (!VALID_ADMIN_KEYS.includes(formData.adminKey.trim())) {
      setError('Invalid admin registration key. Contact system administrator.');
      return false;
    }

    return true;
  };

  // Validate step 2 (Details)
  const validateDetails = () => {
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return false;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (formData.mobile.length !== 10) {
      setError('Mobile number must be exactly 10 digits');
      return false;
    }

    if (!formData.state || !formData.district || !formData.pincode) {
      setError('Please fill all location details');
      return false;
    }

    if (formData.pincode.length !== 6) {
      setError('Pincode must be 6 digits');
      return false;
    }

    return true;
  };

  // Validate step 4 (Password)
  const validatePassword = () => {
    if (!formData.password || !formData.confirmPassword) {
      setError('Please set a password');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  // Send OTP
  const handleSendOTP = async () => {
    if (!recaptchaVerifier) {
      toast.error('Recaptcha not initialized. Please refresh the page.');
      return;
    }

    setOtpLoading(true);
    setError('');

    try {
      const result = await sendRegistrationOTP(formData.mobile, recaptchaVerifier);

      if (result.success) {
        setOtpSent(true);
        setResendTimer(60);
        setConfirmationResult(result.confirmationResult);
        toast.success('OTP sent successfully', {
          description: `Check your phone ending in ${formData.mobile.slice(-4)}`
        });
      } else {
        setError(result.error || 'Failed to send OTP');
        toast.error('Failed to send OTP', {
          description: result.error
        });
      }
    } catch (error: any) {
      setError(error.message || 'Failed to send OTP');
      toast.error('Error sending OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      setError('Please enter complete OTP');
      toast.error('Please enter complete OTP');
      return;
    }

    setOtpLoading(true);
    setError('');

    try {
      const result = await verifyRegistrationOTP(otpCode, confirmationResult);

      if (result.success && result.phoneAuthUser) {
        setOtpVerified(true);
        setPhoneAuthUid(result.phoneAuthUser.uid);
        toast.success('Phone number verified successfully!');

        setTimeout(() => {
          setStep(4);
        }, 500);
      } else {
        setError(result.error || 'Invalid OTP');
        toast.error('OTP verification failed', {
          description: result.error
        });
        setOtp(['', '', '', '', '', '']);
        document.getElementById('otp-0')?.focus();
      }
    } catch (error: any) {
      setError(error.message || 'Verification failed');
      toast.error('Verification error');
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    setOtp(['', '', '', '', '', '']);
    await handleSendOTP();
  };

  // Handle step navigation
  const handleNext = async () => {
    setError('');

    if (step === 1) {
      if (validateAdminKey()) {
        setStep(2);
      }
    } else if (step === 2) {
      if (validateDetails()) {
        setStep(3);
      }
    } else if (step === 3) {
      if (!otpVerified) {
        setError('Please verify your phone number with OTP');
        return;
      }
      setStep(4);
    }
  };

  const handleBack = () => {
    setError('');
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword()) return;
    if (!otpVerified) {
      setError('Phone number must be verified');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Register admin with phone verification
      const result = await registerUserWithPhone(
        formData.email,
        formData.password,
        {
          role: 'admin',
          fullName: formData.fullName,
          mobile: `+91${formData.mobile}`,
          district: formData.district,
          pincode: formData.pincode,
          state: formData.state,
          isVerified: true, // Admins are auto-verified
        },
        phoneAuthUid
      );

      if (result.success) {
        toast.success('Admin Registration Successful!', {
          description: 'You can now login to your admin account',
          duration: 3000
        });

        setTimeout(() => {
          onLoginClick();
        }, 2000);
      } else {
        setError(result.error || 'Registration failed');
        toast.error('Registration Failed', {
          description: result.error
        });
      }
    } catch (err: any) {
      console.error("Admin Signup Error:", err);
      setError(err.message || 'Registration failed. Please try again.');
      toast.error('Registration Error', {
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 py-12 relative overflow-hidden">
      {/* Recaptcha Container (Hidden) */}
      <div id="recaptcha-container"></div>

      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <Button
          onClick={onBack}
          variant="ghost"
          className="mb-6 text-emerald-700 hover:bg-emerald-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Button>

        <div className="max-w-2xl mx-auto">
          <Card className="p-8 border-t-4 border-emerald-600 shadow-2xl bg-[var(--clr-bg-card)]/90 backdrop-blur-sm">
            {/* Logo and Title */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                  <Shield className="w-12 h-12 text-[var(--txt-inverse)]" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-emerald-800 mb-2">Admin Registration</h2>
              <p className="text-[var(--txt-body)]">RaktPort - Secure Admin Access</p>
              <div className="mt-4 h-1 w-20 bg-gradient-to-r from-emerald-500 to-teal-500 mx-auto rounded-full"></div>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center justify-between mb-8 px-4">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${s < step ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-[var(--txt-inverse)] scale-100' :
                    s === step ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-[var(--txt-inverse)] scale-110 shadow-lg' :
                      'bg-gray-200 text-[var(--txt-body)]'
                    }`}>
                    {s < step ? <CheckCircle2 className="w-6 h-6" /> : s}
                  </div>
                  {s < 4 && (
                    <div className={`flex-1 h-1 mx-2 rounded ${s < step ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gray-200'
                      }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-[var(--clr-emergency)] p-4 mb-6 rounded-r-lg animate-in fade-in duration-300">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 mr-3 mt-0.5 text-red-700 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Registration Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>

              {/* STEP 1: Admin Key Verification */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                      <KeyRound className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--txt-heading)]">Verify Admin Access</h3>
                    <p className="text-sm text-[var(--txt-body)] mt-2">
                      Enter your admin registration key to continue
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminKey" className="text-gray-700 font-semibold">
                      Admin Registration Key *
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="adminKey"
                        type="password"
                        placeholder="Enter admin registration key"
                        value={formData.adminKey}
                        onChange={handleChange}
                        className="pl-10 border-2 border-[var(--clr-border)] focus:border-emerald-500 focus:ring-emerald-200"
                        required
                      />
                    </div>
                    <p className="text-xs text-[var(--txt-body)] mt-2">
                      <Shield className="w-3 h-3 inline mr-1" />
                      Contact your system administrator for the registration key
                    </p>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-[var(--clr-info)] p-4 rounded-r-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Security Notice:</strong> Admin keys are confidential and should not be shared.
                      Each key can only be used for authorized personnel.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 2: Personal & Location Details */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                      <User className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--txt-heading)]">Personal Information</h3>
                    <p className="text-sm text-[var(--txt-body)] mt-2">
                      Enter your details for admin account creation
                    </p>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-gray-700 font-semibold">
                      Full Name *
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="pl-10 border-2 border-[var(--clr-border)] focus:border-emerald-500 focus:ring-emerald-200"
                        required
                      />
                    </div>
                  </div>

                  {/* Email and Mobile */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700 font-semibold">
                        Email Address *
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="admin@example.com"
                          value={formData.email}
                          onChange={handleChange}
                          className="pl-10 border-2 border-[var(--clr-border)] focus:border-emerald-500 focus:ring-emerald-200"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mobile" className="text-gray-700 font-semibold">
                        Mobile Number *
                      </Label>
                      <div className="flex gap-2">
                        <div className="flex items-center px-3 border-2 border-[var(--clr-border)] rounded-md bg-[var(--clr-bg-page)] text-[var(--txt-body)] font-semibold">
                          +91
                        </div>
                        <div className="relative flex-1">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            id="mobile"
                            type="tel"
                            placeholder="10-digit number"
                            value={formData.mobile}
                            onChange={(e) => handleNumericChange(e, 'mobile', 10)}
                            className="pl-10 border-2 border-[var(--clr-border)] focus:border-emerald-500 focus:ring-emerald-200"
                            required
                          />
                        </div>
                      </div>
                      <p className="text-xs text-[var(--txt-body)]">
                        OTP will be sent to this number for verification
                      </p>
                    </div>
                  </div>

                  {/* Location Details */}
                  <div className="pt-4 border-t border-[var(--clr-border)]">
                    <h4 className="text-lg font-semibold text-[var(--txt-heading)] mb-4">Location Details</h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="state" className="text-gray-700 font-semibold">
                          State *
                        </Label>
                        <select
                          id="state"
                          value={formData.state}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border-2 border-[var(--clr-border)] rounded-md focus:border-emerald-500 focus:ring-emerald-200 focus:outline-none"
                          required
                        >
                          <option value="">Select State</option>
                          {indianStates.map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="district" className="text-gray-700 font-semibold">
                          District *
                        </Label>
                        <Input
                          id="district"
                          type="text"
                          placeholder="e.g., New Delhi"
                          value={formData.district}
                          onChange={handleChange}
                          className="border-2 border-[var(--clr-border)] focus:border-emerald-500 focus:ring-emerald-200"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pincode" className="text-gray-700 font-semibold">
                          Pincode *
                        </Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            id="pincode"
                            type="text"
                            placeholder="110001"
                            value={formData.pincode}
                            onChange={(e) => handleNumericChange(e, 'pincode', 6)}
                            className="pl-10 border-2 border-[var(--clr-border)] focus:border-emerald-500 focus:ring-emerald-200"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: OTP Verification */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-4 shadow-lg">
                      <Smartphone className="w-10 h-10 text-[var(--txt-inverse)]" />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--txt-heading)]">Verify Phone Number</h3>
                    <p className="text-sm text-[var(--txt-body)] mt-2">
                      {otpSent
                        ? `Enter the 6-digit OTP sent to +91 ${formData.mobile}`
                        : `Click below to receive OTP on +91 ${formData.mobile}`
                      }
                    </p>
                  </div>

                  {!otpSent ? (
                    <Button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={otpLoading}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-[var(--txt-inverse)] py-6 text-lg font-semibold shadow-lg"
                    >
                      {otpLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Sending OTP...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <KeyRound className="w-5 h-5" />
                          <span>Send OTP</span>
                        </div>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-6">
                      {/* OTP Input Boxes */}
                      <div className="flex justify-center gap-3">
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            id={`otp-${index}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            disabled={otpVerified}
                            className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl transition-all outline-none ${otpVerified
                              ? 'bg-green-50 border-[var(--clr-success)] text-green-700'
                              : 'bg-[var(--clr-bg-card)] border-[var(--clr-border)] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200'
                              }`}
                          />
                        ))}
                      </div>

                      {otpVerified ? (
                        <div className="flex items-center justify-center gap-2 text-[var(--clr-success)] font-semibold bg-green-50 py-3 rounded-lg">
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Phone Verified Successfully!</span>
                        </div>
                      ) : (
                        <>
                          <Button
                            type="button"
                            onClick={handleVerifyOTP}
                            disabled={otpLoading || otp.join('').length !== 6}
                            className={`w-full py-6 text-lg font-semibold shadow-lg ${otp.join('').length === 6
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-[var(--txt-inverse)]'
                              : 'bg-gray-300 text-[var(--txt-body)] cursor-not-allowed'
                              }`}
                          >
                            {otpLoading ? (
                              <div className="flex items-center justify-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Verifying...</span>
                              </div>
                            ) : (
                              'Verify OTP'
                            )}
                          </Button>

                          <div className="text-center">
                            {resendTimer > 0 ? (
                              <p className="text-sm text-[var(--txt-body)]">
                                Resend OTP in <span className="font-bold text-emerald-600">{resendTimer}s</span>
                              </p>
                            ) : (
                              <button
                                type="button"
                                onClick={handleResendOTP}
                                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 underline"
                              >
                                Resend OTP
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: Password Setup */}
              {step === 4 && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                      <Lock className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--txt-heading)]">Set Your Password</h3>
                    <p className="text-sm text-[var(--txt-body)] mt-2">
                      Create a secure password for your admin account
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-700 font-semibold">
                        Password *
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Min 6 characters"
                          value={formData.password}
                          onChange={handleChange}
                          className="pl-10 pr-10 border-2 border-[var(--clr-border)] focus:border-emerald-500 focus:ring-emerald-200"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[var(--txt-body)]"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-gray-700 font-semibold">
                        Confirm Password *
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Re-enter password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="pl-10 pr-10 border-2 border-[var(--clr-border)] focus:border-emerald-500 focus:ring-emerald-200"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[var(--txt-body)]"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-[var(--clr-info)] p-4 rounded-r-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Password Requirements:</strong>
                    </p>
                    <ul className="list-disc list-inside text-xs text-blue-700 mt-2 space-y-1">
                      <li>At least 6 characters long</li>
                      <li>Use a mix of letters and numbers for better security</li>
                      <li>Avoid using common passwords</li>
                    </ul>
                  </div>

                  <div className="bg-emerald-50 border-l-4 border-emerald-400 p-4 rounded-r-lg">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-800 mb-1">Admin Account Benefits:</p>
                        <ul className="text-xs text-emerald-700 space-y-1">
                          <li>• Full system access and management capabilities</li>
                          <li>• User verification and approval authority</li>
                          <li>• Blood request monitoring and coordination</li>
                          <li>• Platform analytics and reporting</li>
                          <li>• No additional approval required - instant activation</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-[var(--clr-border)]">
                {step > 1 && (
                  <Button
                    type="button"
                    onClick={handleBack}
                    variant="outline"
                    disabled={loading || otpLoading}
                    className="border-2 border-[var(--clr-border)] hover:bg-[var(--clr-bg-page)]"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                )}

                {step < 4 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={loading || otpLoading || (step === 3 && otpSent && !otpVerified)}
                    className="ml-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-[var(--txt-inverse)]"
                  >
                    {step === 3 && !otpVerified ? 'Verify OTP First' : 'Next'}
                    <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading}
                    className="ml-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-[var(--txt-inverse)] px-8 py-6 text-lg font-bold shadow-lg"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Registering...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Complete Registration</span>
                      </div>
                    )}
                  </Button>
                )}
              </div>

              {/* Login Link */}
              <div className="text-center pt-6 border-t border-[var(--clr-border)]">
                <p className="text-[var(--txt-body)] mb-3">Already have an admin account?</p>
                <Button
                  type="button"
                  onClick={onLoginClick}
                  variant="outline"
                  className="border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                >
                  Login to Admin Dashboard
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes blob {
          0%, 100% { 
            transform: translate(0, 0) scale(1); 
          }
          25% { 
            transform: translate(20px, -20px) scale(1.1); 
          }
          50% { 
            transform: translate(-20px, 20px) scale(0.9); 
          }
          75% { 
            transform: translate(20px, 20px) scale(1.05); 
          }
        }
        
        .animate-blob {
          animation: blob 8s infinite ease-in-out;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}