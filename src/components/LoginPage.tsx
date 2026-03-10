// src/components/LoginPage.tsx
import { useState } from 'react';
import { loginUser } from '../lib/auth';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, UserCircle, Building2, Droplet, ShieldCheck, ArrowLeft } from 'lucide-react';
import logo from '../assets/raktsetu-logo.jpg';

interface LoginPageProps {
  initialRole: string;
  onBack: () => void;
  onSignupClick: (role: string) => void;
}

const roles = [
  { id: 'donor', label: 'Donor', icon: Droplet, color: 'from-red-500 to-pink-500' },
  { id: 'hospital', label: 'Hospital', icon: Building2, color: 'from-blue-500 to-cyan-500' },
  { id: 'bloodbank', label: 'Blood Bank', icon: UserCircle, color: 'from-purple-500 to-violet-500' },
  { id: 'admin', label: 'Admin', icon: ShieldCheck, color: 'from-emerald-500 to-teal-500' }
];

export function LoginPage({ initialRole, onBack, onSignupClick }: LoginPageProps) {
  const [role, setRole] = useState(initialRole || 'donor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentRole = roles.find(r => r.id === role) || roles[0];
  const RoleIcon = currentRole.icon;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      const result = await loginUser(email, password, role);

      if (result.success) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', role);
        localStorage.setItem('userId', result.userId!);

        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
          localStorage.setItem('rememberedRole', role);
        } else {
          localStorage.removeItem('rememberedEmail');
          localStorage.removeItem('rememberedRole');
        }

        toast.success('Login successful!', {
          description: `Welcome back!`
        });

        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      } else {
        toast.error('Login Failed', {
          description: result.error
        });
      }
    } catch (error: any) {
      toast.error('Login Error', {
        description: error.message || 'An unexpected error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br ${currentRole.color} rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob`}></div>
        <div className={`absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000`}></div>
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br ${currentRole.color} rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000`}></div>
      </div>

      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 z-10 flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white group"
      >
        <ArrowLeft className="w-4 h-4 text-gray-600 group-hover:text-gray-900 transition-colors" />
        <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Back to Home</span>
      </button>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Glassmorphic Card */}
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">

            {/* Header with Logo */}
            <div className="relative pt-8 pb-6 px-8 bg-gradient-to-br from-white/50 to-white/30">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg mb-4 ring-4 ring-white/50">
                  <img src={logo} alt="RaktPort Logo" className="w-full h-full object-cover" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-1">Welcome Back</h1>
                <p className="text-sm text-gray-600">Sign in to continue to RaktPort</p>
              </div>
            </div>

            {/* Role Slider */}
            <div className="px-8 pt-6 pb-4">
              <div className="relative bg-gray-100/50 backdrop-blur-sm rounded-2xl p-1.5 shadow-inner">
                <div
                  className={`absolute top-1.5 bottom-1.5 bg-gradient-to-r ${currentRole.color} rounded-xl shadow-lg transition-all duration-300 ease-out`}
                  style={{
                    left: `${(roles.findIndex(r => r.id === role) * 100) / roles.length}%`,
                    width: `${100 / roles.length}%`
                  }}
                />
                <div className="relative grid grid-cols-4 gap-1">
                  {roles.map((r) => {
                    const Icon = r.icon;
                    const isActive = r.id === role;
                    return (
                      <button
                        key={r.id}
                        onClick={() => setRole(r.id)}
                        className={`relative flex flex-col items-center gap-1 py-3 rounded-xl transition-all duration-300 ${isActive ? 'text-white' : 'text-gray-600 hover:text-gray-800'
                          }`}
                      >
                        <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                        <span className="text-xs font-medium">{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="px-8 py-6 space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white/50 backdrop-blur-sm border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 transition-all duration-200 outline-none text-gray-800 placeholder-gray-400"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-gray-600 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 bg-white/50 backdrop-blur-sm border-2 border-gray-200 rounded-xl focus:border-gray-400 focus:ring-4 focus:ring-gray-200/50 transition-all duration-200 outline-none text-gray-800 placeholder-gray-400"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-md peer-checked:bg-gradient-to-br peer-checked:from-gray-700 peer-checked:to-gray-900 peer-checked:border-gray-700 transition-all duration-200 flex items-center justify-center">
                      {rememberMe && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors">
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  className="text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 transform ${loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : `bg-gradient-to-r ${currentRole.color} hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]`
                  }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="px-8 pb-8 pt-4">
              <div className="text-center">
                <span className="text-sm text-gray-600">Don't have an account? </span>
                <button
                  onClick={() => onSignupClick(role)}
                  className={`text-sm font-semibold bg-gradient-to-r ${currentRole.color} bg-clip-text text-transparent hover:underline transition-all`}
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>

          {/* Security Badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
            <ShieldCheck className="w-4 h-4" />
            <span>Secured by Firebase Authentication</span>
          </div>
        </div>
      </div>

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
      `}</style>
    </div>
  );
}