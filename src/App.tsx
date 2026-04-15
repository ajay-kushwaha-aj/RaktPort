// src/App.tsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { AdminSignupPage } from './components/AdminSignupPage';
import { DonorDashboard } from './components/DonorDashboard';
import { ImpactPage } from './components/ImpactPage';
import { LocateDonationSite } from './components/LocateDonationSite';
// --- Import the dashboards with CONSISTENT DEFAULT IMPORTS ---
import HospitalDashboard from './components/hospital/HospitalDashboard';
import BloodBankDashboard from './components/BloodBankDashboard';
import AdminLayout from './admin/AdminLayout';
import { Button } from './components/ui/button';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { CookieConsent } from './components/CookieConsent';
import { FeedbackWidget } from './components/FeedbackWidget';
import { BackToTop } from './components/BackToTop';

// --- Error Boundary to prevent blank page on runtime errors ---
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Application error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h1 style={{ color: 'var(--clr-brand)', fontSize: '1.5rem', marginBottom: '1rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#555', marginBottom: '1rem' }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1.5rem',
              backgroundColor: 'var(--clr-brand)',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Imports for providers ---
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create the query client
const queryClient = new QueryClient();

type View = 'home' | 'login' | 'signup' | 'dashboard';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedRole, setSelectedRole] = useState<string>('donor');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const role = localStorage.getItem('userRole') || 'donor';
    const userId = localStorage.getItem('userId');

    // FIX: Check for corrupted state (logged in but missing userId)
    if (loggedIn && !userId) {
      console.warn("Corrupted session detected: Logged in but no userId. Forcing logout.");
      localStorage.clear(); // Safe to clear all for this app to ensure clean slate
      setIsLoggedIn(false);
    } else if (loggedIn) {
      setIsLoggedIn(true);
      setSelectedRole(role);
      
      // If user is logged in (session exists) and their current location.pathname 
      // starts with /login or /register, automatically navigate to /dashboard
      if (location.pathname.startsWith('/login') || location.pathname.startsWith('/register') || location.pathname === '/admin') {
        navigate('/dashboard', { replace: true });
      }
    } else {
      setIsLoggedIn(false);
      // Sync selectedRole with URL for unauthenticated flows
      if (location.pathname.startsWith('/register/')) {
        const roleFromPath = location.pathname.split('/register/')[1];
        if (roleFromPath && roleFromPath !== 'admin') {
          setSelectedRole(roleFromPath);
        } else if (location.pathname === '/register/admin') {
          setSelectedRole('admin');
        }
      } else if (location.pathname.startsWith('/login')) {
        const roleParam = new URLSearchParams(location.search).get('role');
        if (roleParam) {
          setSelectedRole(roleParam);
        }
      } else if (location.pathname === '/admin') {
        setSelectedRole('admin');
      }
    }
  }, [location.pathname, location.search, navigate]);

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    navigate(`/login?role=${role}`);
  };

  const handleLoginClick = (role: string = 'donor') => {
    setSelectedRole(role);
    navigate(`/login?role=${role}`);
  };

  const handleSignupClick = (role: string = 'donor') => {
    setSelectedRole(role);
    if (role === 'admin') {
      navigate('/register/admin');
    } else {
      navigate(`/register/${role}`);
    }
  };

  const handleDonorSignupClick = () => {
    setSelectedRole('donor');
    navigate('/register/donor');
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    setIsLoggedIn(false);
    navigate('/');
  };

  const renderDashboard = () => {
    switch (selectedRole) {
      case 'donor':
        return <DonorDashboard onLogout={handleLogout} />;
      case 'hospital':
        return <HospitalDashboard onLogout={handleLogout} />;
      case 'bloodbank':
        return <BloodBankDashboard onLogout={handleLogout} />;
      case 'admin':
        return <AdminLayout onLogout={handleLogout} />;
      default:
        return (
          <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)]">
            <div className="text-center">
              <h1 className="text-3xl text-[var(--clr-brand)] mb-4">Dashboard Not Found</h1>
              <p className="text-[var(--text-secondary)] mb-6">Could not find dashboard for role: {selectedRole}</p>
              <Button
                onClick={handleLogout}
                className="px-6 py-2 bg-rp-primary text-[var(--txt-inverse)] rounded hover:bg-[var(--rp-primary-dark)]"
              >
                Logout
              </Button>
            </div>
          </div>
        );
    }
  };

  const WithHeaderFooter = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen flex flex-col">
      <Header onLoginClick={handleLoginClick} onSignupClick={handleSignupClick} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <Routes>
          <Route 
            path="/" 
            element={
              <WithHeaderFooter>
                <LandingPage onRoleSelect={handleRoleSelect} onDonorSignupClick={handleDonorSignupClick} />
              </WithHeaderFooter>
            } 
          />

          <Route 
            path="/login" 
            element={
              <div className="min-h-screen flex flex-col">
                <LoginPage
                  initialRole={selectedRole || new URLSearchParams(location.search).get('role') || 'donor'}
                  onBack={() => navigate('/')}
                  onSignupClick={handleSignupClick}
                />
              </div>
            }
          />

          <Route 
            path="/admin" 
            element={
              <div className="min-h-screen flex flex-col">
                <LoginPage
                  initialRole="admin"
                  onBack={() => navigate('/')}
                  onSignupClick={() => navigate('/register/admin')}
                />
              </div>
            }
          />

          <Route
            path="/register/admin"
            element={
              <AdminSignupPage
                onBack={() => navigate('/login?role=admin')}
                onLoginClick={() => navigate('/login?role=admin')}
              />
            }
          />

          <Route 
            path="/register/:role" 
            element={
              <div className="min-h-screen flex flex-col">
                <SignupPage
                  role={selectedRole}
                  onBack={() => navigate('/login')}
                  onLoginClick={() => navigate('/login')}
                />
              </div>
            } 
          />

          <Route 
            path="/dashboard" 
            element={
              isLoggedIn ? renderDashboard() : <div className="min-h-screen flex flex-col"><LoginPage initialRole="donor" onBack={() => navigate('/')} onSignupClick={handleSignupClick} /></div>
            } 
          />

          <Route
            path="/impact"
            element={
              <WithHeaderFooter>
                <ImpactPage />
              </WithHeaderFooter>
            }
          />

          <Route
            path="/locate-site"
            element={
              <WithHeaderFooter>
                <LocateDonationSite />
              </WithHeaderFooter>
            }
          />

          {/* Fallback component handles any undefined routes by dropping to landing */}
          <Route path="*" element={<WithHeaderFooter><LandingPage onRoleSelect={handleRoleSelect} onDonorSignupClick={handleDonorSignupClick} /></WithHeaderFooter>} />
        </Routes>

        {/* Global overlays */}
        <PWAInstallPrompt />
        <CookieConsent />
        <BackToTop />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

import { ThemeProvider } from "@/components/theme-provider"

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" storageKey="viser-theme">
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  )
}