//(Part 1 - Imports and Initial Setup)
// src/components/SignupPage.ts
import { useState, useEffect } from 'react';
import {
  initRecaptcha,
  sendRegistrationOTP,
  verifyRegistrationOTP,
  registerUserWithPhone
} from '../lib/auth';
import { toast } from 'sonner';
import {
  ArrowLeft, Eye, EyeOff, Upload, X, CheckCircle2,
  User, Mail, Phone, Lock, MapPin, Calendar, Droplet,
  FileText, Building2, Heart, Shield, AlertCircle, Loader2,
  ChevronRight, ChevronLeft, Home, Smartphone, KeyRound
} from 'lucide-react';
import logo from '../assets/raktsetu-logo.jpg';
import { db } from '../firebase';
import { doc, setDoc, ConfirmationResult } from 'firebase/firestore';
import type { RecaptchaVerifier } from 'firebase/auth';

// @ts-ignore
import { BLOOD_GROUPS } from '@/lib/bloodbank-utils';

interface SignupPageProps {
  role: string;
  onBack: () => void;
  onLoginClick: () => void;
}

const roleConfig = {
  donor: {
    title: 'Donor Registration',
    subtitle: 'Join our life-saving community',
    icon: Heart,
    gradient: 'from-red-500 to-pink-500',
    bgGradient: 'from-red-50 via-pink-50 to-orange-50',
    lightBg: 'bg-red-50',
    darkBg: 'bg-red-100'
  },
  hospital: {
    title: 'Hospital Registration',
    subtitle: 'Partner with us to save lives',
    icon: Building2,
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-50 via-cyan-50 to-sky-50',
    lightBg: 'bg-blue-50',
    darkBg: 'bg-blue-100'
  },
  bloodbank: {
    title: 'Blood Bank Registration',
    subtitle: 'Manage inventory efficiently',
    icon: Droplet,
    gradient: 'from-purple-500 to-violet-500',
    bgGradient: 'from-purple-50 via-violet-50 to-fuchsia-50',
    lightBg: 'bg-purple-50',
    darkBg: 'bg-purple-100'
  },
  admin: {
    title: 'Admin Registration',
    subtitle: 'Manage the platform',
    icon: Shield,
    gradient: 'from-emerald-500 to-teal-500',
    bgGradient: 'from-emerald-50 via-teal-50 to-green-50',
    lightBg: 'bg-emerald-50',
    darkBg: 'bg-emerald-100'
  }
};

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export function SignupPage({ role, onBack, onLoginClick }: SignupPageProps) {
  const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.donor;
  const RoleIcon = config.icon;

  // Step management - Added OTP verification step
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP Verification States
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [phoneAuthUid, setPhoneAuthUid] = useState('');

  // Form Data - keeping all existing fields
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    address: '',
    district: '',
    state: '',
    pincode: '',
    aadhar: '',
    bloodGroup: '',
    gender: '',
    dob: '',
    lastDonationDate: '',
    dontRememberDonation: false,
    licenseNo: '',
    registrationNo: '',
    inventory: {} as Record<string, number>,
    acceptTerms: false
  });

  // Document Upload
  const [uploadedDocs, setUploadedDocs] = useState<File[]>([]);

  // Continue in Part 4...
  // SignupPage.tsx (Part 2 - OTP Functions and Handlers)

  // Initialize Recaptcha on component mount
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

  // Handle form field changes
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files).filter(file => {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is too large. Max size is 5MB`);
          return false;
        }
        return true;
      });
      setUploadedDocs(prev => [...prev, ...newFiles]);
      toast.success(`${newFiles.length} document(s) uploaded`);
    }
  };

  const removeFile = (index: number) => {
    setUploadedDocs(prev => prev.filter((_, i) => i !== index));
    toast.info('Document removed');
  };

  // Send OTP to phone number
  const handleSendOTP = async () => {
    if (!formData.mobile || formData.mobile.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!recaptchaVerifier) {
      toast.error('Recaptcha not initialized. Please refresh the page.');
      return;
    }

    setOtpLoading(true);

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
        toast.error('Failed to send OTP', {
          description: result.error
        });
      }
    } catch (error: any) {
      toast.error('Error sending OTP', {
        description: error.message
      });
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  // Handle OTP backspace
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
      toast.error('Please enter complete OTP');
      return;
    }

    setOtpLoading(true);

    try {
      const result = await verifyRegistrationOTP(otpCode, confirmationResult);

      if (result.success && result.phoneAuthUser) {
        setOtpVerified(true);
        setPhoneAuthUid(result.phoneAuthUser.uid);
        toast.success('Phone number verified successfully!');

        // Move to next step automatically
        setTimeout(() => {
          nextStep();
        }, 500);
      } else {
        toast.error('OTP verification failed', {
          description: result.error
        });
        // Clear OTP inputs on failure
        setOtp(['', '', '', '', '', '']);
        document.getElementById('otp-0')?.focus();
      }
    } catch (error: any) {
      toast.error('Verification error', {
        description: error.message
      });
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

  // Continue to Part 5 for validation and submission...
  // SignupPage.tsx (Part 3 - Validation and Submission)

  // Validate current step
  const validateStep = () => {
    // Step 1: Basic Information
    if (step === 1) {
      if (!formData.fullName || !formData.email || !formData.mobile) {
        toast.error('Please fill all required fields');
        return false;
      }
      if (formData.mobile.length !== 10) {
        toast.error('Mobile number must be 10 digits');
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error('Please enter a valid email address');
        return false;
      }
    }

    // Step 2: OTP Verification
    if (step === 2) {
      if (!otpVerified) {
        toast.error('Please verify your phone number with OTP');
        return false;
      }
    }

    // Step 3: Role-specific details
    if (step === 3) {
      if (role === 'donor') {
        if (!formData.aadhar || formData.aadhar.length !== 12) {
          toast.error('Aadhar must be 12 digits');
          return false;
        }
        if (!formData.bloodGroup || !formData.gender || !formData.dob) {
          toast.error('Please fill all donor details');
          return false;
        }
      }
      if (role === 'hospital' && !formData.registrationNo) {
        toast.error('Please provide registration number');
        return false;
      }
      if (role === 'bloodbank' && !formData.licenseNo) {
        toast.error('Please provide license number');
        return false;
      }
      if (role === 'admin') {
        // Admin can proceed without additional fields
      }
    }

    // Step 4: Address
    if (step === 4) {
      if (!formData.address || !formData.district || !formData.state || !formData.pincode) {
        toast.error('Please fill complete address');
        return false;
      }
      if (formData.pincode.length !== 6) {
        toast.error('Pincode must be 6 digits');
        return false;
      }
    }

    // Step 5: Password and Terms
    if (step === 5) {
      if (!formData.password || !formData.confirmPassword) {
        toast.error('Please set a password');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return false;
      }
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return false;
      }
      if (!formData.acceptTerms) {
        toast.error('Please accept terms and conditions');
        return false;
      }
    }

    return true;
  };

  // Navigate to next step
  const nextStep = () => {
    if (validateStep()) {
      setStep(prev => Math.min(prev + 1, 5));
    }
  };

  // Navigate to previous step
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  // Handle registration submission
  const handleSubmit = async () => {
    if (!validateStep()) return;

    if (!otpVerified) {
      toast.error('Phone number must be verified');
      return;
    }

    setLoading(true);

    try {
      // Register user with verified phone number
      const result = await registerUserWithPhone(
        formData.email,
        formData.password,
        {
          role: role,
          fullName: formData.fullName,
          mobile: `+91${formData.mobile}`,
          address: formData.address,
          district: formData.district,
          state: formData.state,
          pincode: formData.pincode,
          isVerified: role === 'donor', // Donors are auto-verified
          ...(role === 'donor' && {
            aadhar: formData.aadhar,
            bloodGroup: formData.bloodGroup,
            gender: formData.gender,
            dob: formData.dob,
            lastDonationDate: formData.dontRememberDonation ? null : formData.lastDonationDate,
            credits: 0,
          }),
          ...(role === 'hospital' && {
            registrationNo: formData.registrationNo,
          }),
          ...(role === 'bloodbank' && {
            licenseNo: formData.licenseNo,
            inventory: formData.inventory,
          }),
          ...(role === 'admin' && {
            // Admin specific fields if any
          })
        },
        phoneAuthUid
      );

      if (result.success) {
        toast.success('Registration Successful!', {
          description: role === 'donor'
            ? 'You can now login to your account'
            : 'Your account is pending admin verification'
        });

        // Redirect to login
        setTimeout(() => {
          onLoginClick();
        }, 2000);
      } else {
        toast.error('Registration Failed', {
          description: result.error
        });
      }
    } catch (error: any) {
      toast.error('Registration Error', {
        description: error.message || 'An unexpected error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  // Continue to Part 6 for UI rendering...
  // SignupPage.tsx (Part 4 - UI Rendering Steps 1 & 2)

  return (
    <div className={`min-h-screen relative overflow-hidden bg-gradient-to-br ${config.bgGradient}`}>
      {/* Recaptcha Container (Hidden) */}
      <div id="recaptcha-container"></div>

      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br ${config.gradient} rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob`}></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br ${config.gradient} rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000`}></div>
      </div>

      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 z-10 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back to Home</span>
      </button>

      <div className="relative min-h-screen flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Main Card */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">

            {/* Header */}
            <div className="relative pt-8 pb-6 px-8 bg-gradient-to-br from-white/50 to-white/30">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg mb-4">
                  <img src={logo} alt="RaktPort Logo" className="w-full h-full object-cover" />
                </div>
                <div className={`flex items-center gap-2 mb-2`}>
                  <RoleIcon className="w-6 h-6" />
                  <h1 className="text-2xl font-bold text-gray-800">{config.title}</h1>
                </div>
                <p className="text-sm text-gray-600">{config.subtitle}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="px-8 pt-6">
              <div className="flex items-center justify-between mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className="flex items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${s < step ? `bg-gradient-to-r ${config.gradient} text-white` :
                      s === step ? `bg-gradient-to-r ${config.gradient} text-white scale-110` :
                        'bg-gray-200 text-gray-500'
                      }`}>
                      {s < step ? <CheckCircle2 className="w-5 h-5" /> : s}
                    </div>
                    {s < 5 && (
                      <div className={`flex-1 h-1 mx-2 rounded ${s < step ? `bg-gradient-to-r ${config.gradient}` : 'bg-gray-200'
                        }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>Basic</span>
                <span>OTP</span>
                <span>Details</span>
                <span>Address</span>
                <span>Finish</span>
              </div>
            </div>

            {/* Form Content */}
            <div className="px-8 py-6">
              <form className="space-y-6">

                {/* STEP 1: Basic Information */}
                {step === 1 && (
                  <div className="space-y-5 animate-in fade-in duration-500">
                    <h2 className="text-xl font-bold text-gray-800">Basic Information</h2>

                    <div className="space-y-4">
                      {/* Full Name */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                          <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => handleChange('fullName', e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-white/50 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 transition-all outline-none"
                            placeholder="Enter your full name"
                            required
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-white/50 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 transition-all outline-none"
                            placeholder="you@example.com"
                            required
                          />
                        </div>
                      </div>

                      {/* Mobile Number */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                          <div className="absolute left-12 top-1/2 -translate-y-1/2 text-gray-600 font-medium">+91</div>
                          <input
                            type="tel"
                            value={formData.mobile}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                              handleChange('mobile', value);
                            }}
                            className="w-full pl-20 pr-4 py-3.5 bg-white/50 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 transition-all outline-none"
                            placeholder="9876543210"
                            maxLength={10}
                            required
                          />
                        </div>
                        <p className="mt-1.5 text-xs text-gray-500">
                          OTP will be sent to this number for verification
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: OTP Verification */}
                {step === 2 && (
                  <div className="space-y-5 animate-in fade-in duration-500">
                    <div className="text-center">
                      <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-r ${config.gradient} flex items-center justify-center mb-4`}>
                        <Smartphone className="w-10 h-10 text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-800 mb-2">Verify Phone Number</h2>
                      <p className="text-sm text-gray-600">
                        {otpSent
                          ? `Enter the 6-digit OTP sent to +91 ${formData.mobile}`
                          : `Click below to receive OTP on +91 ${formData.mobile}`
                        }
                      </p>
                    </div>

                    {!otpSent ? (
                      <button
                        type="button"
                        onClick={handleSendOTP}
                        disabled={otpLoading}
                        className={`w-full py-4 rounded-xl font-semibold text-white shadow-lg transition-all bg-gradient-to-r ${config.gradient} hover:shadow-xl`}
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
                      </button>
                    ) : (
                      <div className="space-y-4">
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
                                ? 'bg-green-50 border-green-500 text-green-700'
                                : 'bg-white/50 border-gray-300 focus:border-gray-500 focus:ring-4 focus:ring-gray-200/50'
                                }`}
                            />
                          ))}
                        </div>

                        {otpVerified ? (
                          <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
                            <CheckCircle2 className="w-5 h-5" />
                            <span>Phone Verified Successfully!</span>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={handleVerifyOTP}
                              disabled={otpLoading || otp.join('').length !== 6}
                              className={`w-full py-4 rounded-xl font-semibold text-white shadow-lg transition-all ${otp.join('').length === 6
                                ? `bg-gradient-to-r ${config.gradient} hover:shadow-xl`
                                : 'bg-gray-300 cursor-not-allowed'
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
                            </button>

                            <div className="text-center">
                              {resendTimer > 0 ? (
                                <p className="text-sm text-gray-600">
                                  Resend OTP in <span className="font-bold">{resendTimer}s</span>
                                </p>
                              ) : (
                                <button
                                  type="button"
                                  onClick={handleResendOTP}
                                  className="text-sm font-semibold text-gray-700 hover:text-gray-900 underline"
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

                {/* Continue to Part 7 for remaining steps... */}

                {/* STEP 3: Role-specific Details */}
                {step === 3 && (
                  <div className="space-y-5 animate-in fade-in duration-500">
                    <h2 className="text-xl font-bold text-gray-800">
                      {role === 'donor' && 'Donor Details'}
                      {role === 'hospital' && 'Hospital Details'}
                      {role === 'bloodbank' && 'Blood Bank Details'}
                      {role === 'admin' && 'Admin Details'}
                    </h2>

                    {/* DONOR FIELDS */}
                    {role === 'donor' && (
                      <div className="space-y-4">
                        {/* Aadhar Number */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Aadhar Number <span className="text-red-500">*</span>
                          </label>
                          <div className="relative group">
                            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gray-600" />
                            <input
                              type="text"
                              value={formData.aadhar}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                                handleChange('aadhar', value);
                              }}
                              className="w-full pl-12 pr-4 py-3.5 bg-white/50 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 transition-all outline-none"
                              placeholder="123456789012"
                              maxLength={12}
                              required
                            />
                          </div>
                        </div>

                        {/* Blood Group and Gender Row */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Blood Group <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={formData.bloodGroup}
                              onChange={(e) => handleChange('bloodGroup', e.target.value)}
                              className="w-full px-4 py-3.5 bg-white/50 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 transition-all outline-none"
                              required
                            >
                              <option value="">Select</option>
                              {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                                <option key={bg} value={bg}>{bg}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Gender <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={formData.gender}
                              onChange={(e) => handleChange('gender', e.target.value)}
                              className="w-full px-4 py-3.5 bg-white/50 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 transition-all outline-none"
                              required
                            >
                              <option value="">Select</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>

                        {/* Date of Birth */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Date of Birth <span className="text-red-500">*</span>
                          </label>
                          <div className="relative group">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gray-600" />
                            <input
                              type="date"
                              value={formData.dob}
                              onChange={(e) => handleChange('dob', e.target.value)}
                              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                              className="w-full pl-12 pr-4 py-3.5 bg-white/50 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 transition-all outline-none"
                              required
                            />
                          </div>
                        </div>

                        {/* Last Donation Date */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Last Donation Date (Optional)
                          </label>
                          <div className="relative group">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gray-600" />
                            <input
                              type="date"
                              value={formData.lastDonationDate}
                              onChange={(e) => handleChange('lastDonationDate', e.target.value)}
                              disabled={formData.dontRememberDonation}
                              max={new Date().toISOString().split('T')[0]}
                              className="w-full pl-12 pr-4 py-3.5 bg-white/50 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 transition-all outline-none disabled:opacity-50"
                            />
                          </div>
                          <label className="flex items-center gap-2 mt-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.dontRememberDonation}
                              onChange={(e) => {
                                handleChange('dontRememberDonation', e.target.checked);
                                if (e.target.checked) handleChange('lastDonationDate', '');
                              }}
                              className="w-4 h-4 rounded border-gray-300"
                            />
                            <span className="text-sm text-gray-600">I don't remember</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* HOSPITAL FIELDS */}
                    {role === 'hospital' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Hospital Registration Number <span className="text-red-500">*</span>
                          </label>
                          <div className="relative group">
                            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gray-600" />
                            <input
                              type="text"
                              value={formData.registrationNo}
                              onChange={(e) => handleChange('registrationNo', e.target.value)}
                              className="w-full pl-12 pr-4 py-3.5 bg-white/50 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 transition-all outline-none"
                              placeholder="HOSP-2024-XXXXX"
                              required
                            />
                          </div>
                        </div>

                        {/* Document Upload */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Upload Registration Documents
                          </label>
                          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
                            <input
                              type="file"
                              id="hospital-docs"
                              multiple
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                            <label htmlFor="hospital-docs" className="cursor-pointer">
                              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                              <p className="text-sm text-gray-600">Click to upload documents</p>
                              <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (Max 5MB each)</p>
                            </label>
                          </div>
                          {uploadedDocs.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {uploadedDocs.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                  <span className="text-sm text-gray-700">{file.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* BLOOD BANK FIELDS */}
                    {role === 'bloodbank' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Blood Bank License Number <span className="text-red-500">*</span>
                          </label>
                          <div className="relative group">
                            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gray-600" />
                            <input
                              type="text"
                              value={formData.licenseNo}
                              onChange={(e) => handleChange('licenseNo', e.target.value)}
                              className="w-full pl-12 pr-4 py-3.5 bg-white/50 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 transition-all outline-none"
                              placeholder="BB-2024-XXXXX"
                              required
                            />
                          </div>
                        </div>

                        {/* Document Upload */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Upload License Documents
                          </label>
                          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
                            <input
                              type="file"
                              id="bloodbank-docs"
                              multiple
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                            <label htmlFor="bloodbank-docs" className="cursor-pointer">
                              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                              <p className="text-sm text-gray-600">Click to upload documents</p>
                              <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (Max 5MB each)</p>
                            </label>
                          </div>
                          {uploadedDocs.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {uploadedDocs.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                  <span className="text-sm text-gray-700">{file.name}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ADMIN FIELDS */}
                    {role === 'admin' && (
                      <div className="p-6 bg-emerald-50 rounded-xl border-2 border-emerald-200">
                        <div className="flex items-start gap-3">
                          <Shield className="w-6 h-6 text-emerald-600 mt-1" />
                          <div>
                            <h3 className="font-bold text-emerald-900 mb-2">Admin Registration</h3>
                            <p className="text-sm text-emerald-700">
                              As an admin, you'll have access to manage the entire platform including user verification, blood requests, and system settings.
                            </p>
                            <p className="text-sm text-emerald-700 mt-2">
                              Your account will require super admin approval before activation.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Continue to Part 8 for Step 4 and 5... */}
                {/* STEP 4: Address Details */}
                {step === 4 && (
                  <div className="space-y-5 animate-in fade-in duration-500">
                    <h2 className="text-xl font-bold text-gray-800">Address Details</h2>

                    <div className="space-y-4">
                      {/* Address */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Complete Address <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                          <Home className="absolute left-4 top-4 w-5 h-5 text-gray-400 group-focus-within:text-gray-600" />
                          <textarea
                            value={formData.address}
                            onChange={(e) => handleChange('address', e.target.value)}
                            rows={3}
                            className="w-full pl-12 pr-4 py-3.5 bg-white/50 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 transition-all outline-none resize-none"
                            placeholder="Street, Building, Landmark"
                            required
                          />
                        </div>
                      </div>

                      {/* District and State */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            District <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.district}
                            onChange={(e) => handleChange('district', e.target.value)}
                            className="w-full px-4 py-3.5 bg-white/50 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 transition-all outline-none"
                            placeholder="District"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            State <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={formData.state}
                            onChange={(e) => handleChange('state', e.target.value)}
                            className="w-full px-4 py-3.5 bg-white/50 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 transition-all outline-none"
                            required
                          >
                            <option value="">Select State</option>
                            {indianStates.map(state => (
                              <option key={state} value={state}>{state}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Pincode */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Pincode <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gray-600" />
                          <input
                            type="text"
                            value={formData.pincode}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                              handleChange('pincode', value);
                            }}
                            className="w-full pl-12 pr-4 py-3.5 bg-white/50 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 transition-all outline-none"
                            placeholder="110001"
                            maxLength={6}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 5: Password and Terms */}
                {step === 5 && (
                  <div className="space-y-5 animate-in fade-in duration-500">
                    <h2 className="text-xl font-bold text-gray-800">Set Password & Confirm</h2>

                    <div className="space-y-4">
                      {/* Password */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gray-600" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            className="w-full pl-12 pr-12 py-3.5 bg-white/50 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 transition-all outline-none"
                            placeholder="••••••••"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Confirm Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-gray-600" />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={formData.confirmPassword}
                            onChange={(e) => handleChange('confirmPassword', e.target.value)}
                            className="w-full pl-12 pr-12 py-3.5 bg-white/50 border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 transition-all outline-none"
                            placeholder="••••••••"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      {/* Password Requirements */}
                      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-800">
                          <p className="font-semibold mb-1">Password Requirements:</p>
                          <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>At least 6 characters long</li>
                            <li>Use a mix of letters and numbers for better security</li>
                          </ul>
                        </div>
                      </div>

                      {/* Terms and Conditions */}
                      <div className="space-y-4 pt-4">
                        <label className="flex items-start gap-3 cursor-pointer group">
                          <div className="relative mt-0.5">
                            <input
                              type="checkbox"
                              checked={formData.acceptTerms}
                              onChange={(e) => handleChange('acceptTerms', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-5 h-5 border-2 border-gray-300 rounded-md peer-checked:bg-gray-700 peer-checked:border-gray-700 transition-all flex items-center justify-center">
                              {formData.acceptTerms && (
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              )}
                            </div>
                          </div>
                          <span className="text-sm text-gray-700 leading-relaxed group-hover:text-gray-900">
                            I agree to the <span className="font-semibold text-gray-900">Terms & Conditions</span> and <span className="font-semibold text-gray-900">Privacy Policy</span> of RaktPort
                          </span>
                        </label>

                        {/* Role-specific Notices */}
                        {role === 'donor' && (
                          <div className={`p-4 ${config.lightBg} rounded-xl border-l-4 border-red-500`}>
                            <p className="text-sm text-gray-700">
                              <strong className="text-red-700">Note:</strong> By registering, you pledge to donate blood voluntarily and maintain eligibility criteria.
                            </p>
                          </div>
                        )}

                        {(role === 'hospital' || role === 'bloodbank' || role === 'admin') && (
                          <div className={`p-4 bg-amber-50 rounded-xl border-l-4 border-amber-500`}>
                            <p className="text-sm text-gray-700">
                              <strong className="text-amber-700">Important:</strong> Your account requires admin verification before login access is granted.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      disabled={loading}
                      className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-semibold text-gray-700 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      Previous
                    </button>
                  )}

                  {step < 5 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={step === 2 && otpSent && !otpVerified}
                      className={`ml-auto flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${config.gradient} text-white rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      Next
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading || !formData.acceptTerms}
                      className={`ml-auto flex items-center gap-2 px-8 py-4 bg-gradient-to-r ${config.gradient} text-white rounded-xl hover:shadow-xl transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Complete Registration
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Login Link */}
                <div className="text-center pt-4">
                  <span className="text-sm text-gray-600">Already have an account? </span>
                  <button
                    type="button"
                    onClick={onLoginClick}
                    className={`text-sm font-semibold bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent hover:underline`}
                  >
                    Login here
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Animations CSS */}
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
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-in {
          animation-fill-mode: both;
        }
        
        .fade-in {
          animation-name: fade-in;
        }
        
        .duration-500 {
          animation-duration: 500ms;
        }
      `}</style>
    </div>
  );
}