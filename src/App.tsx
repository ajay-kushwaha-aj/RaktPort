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
  const [currentView, setCurrentView] = useState<View>('home');
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
      // Let it fall through to default routing
    }
    // If user is logged in AND has valid userId, always show dashboard UNLESS trying to view public pages explicitly
    else if (loggedIn) {
      setIsLoggedIn(true);
      setSelectedRole(role);
      
      // Allow logged-in users to view these public pages
      if (location.pathname === '/' || location.pathname === '/impact' || location.pathname === '/locate-site') {
        const viewMap: Record<string, View> = { '/': 'home' };
        setCurrentView(viewMap[location.pathname] || 'home');
      } else {
        setCurrentView('dashboard');
      }
      return; // Exit early - don't process URL routing when logged in
    }

    // Handle URL routing only when NOT logged in
    if (location.pathname === '/register/admin') {
      setCurrentView('signup');
      setSelectedRole('admin');
    } else if (location.pathname.startsWith('/register/')) {
      const roleFromPath = location.pathname.split('/register/')[1];
      if (roleFromPath) setSelectedRole(roleFromPath);
      setCurrentView('signup');
    } else if (location.pathname.startsWith('/login')) {
      const roleParam = new URLSearchParams(location.search).get('role');
      if (roleParam) {
        setSelectedRole(roleParam);
      }
      setCurrentView('login');
    } else if (location.pathname === '/') {
      setCurrentView('home');
    }
  }, [location]);

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    navigate(`/login?role=${role}`);
    setCurrentView('login');
  };

  const handleBackToHome = () => {
    navigate('/');
    setCurrentView('home');
  };

  const handleLoginClick = (role: string = 'donor') => {
    setSelectedRole(role);
    navigate(`/login?role=${role}`);
    setCurrentView('login');
  };

  const handleSignupClick = (role: string = 'donor') => {
    setSelectedRole(role);
    if (role === 'admin') {
      navigate('/register/admin');
    } else {
      setCurrentView('signup');
      navigate(`/register/${role}`);
    }
  };

  const handleDonorSignupClick = () => {
    setSelectedRole('donor');
    navigate('/login?role=donor');
    setCurrentView('signup');
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    setIsLoggedIn(false);
    navigate('/');
    setCurrentView('home');
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

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <Routes>
          {/* Admin Registration Route */}
          <Route
            path="/register/admin"
            element={
              <AdminSignupPage
                onBack={() => {
                  navigate('/login?role=admin');
                  setCurrentView('login');
                }}
                onLoginClick={() => {
                  navigate('/login?role=admin');
                  setCurrentView('login');
                }}
              />
            }
          />

          <Route
            path="/admin"
            element={
              <div className="min-h-screen flex flex-col">
                <LoginPage
                  initialRole="admin"
                  onBack={() => navigate('/')}
                  onSignupClick={(_role: string) => navigate('/register/admin')}
                />
              </div>
            }
          />

          {/* Default Routes */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex flex-col">
                {currentView === 'home' && (
                  <>
                    <Header
                      onLoginClick={handleLoginClick}
                      onSignupClick={handleSignupClick}
                    />
                    <main className="flex-1">
                      <LandingPage
                        onRoleSelect={handleRoleSelect}
                        onDonorSignupClick={handleDonorSignupClick}
                      />
                    </main>
                    <Footer />
                  </>
                )}

                {currentView === 'login' && (
                  <LoginPage
                    initialRole={selectedRole}
                    onBack={handleBackToHome}
                    onSignupClick={handleSignupClick}
                  />
                )}

                {currentView === 'signup' && selectedRole !== 'admin' && (
                  <SignupPage
                    role={selectedRole}
                    onBack={() => {
                      setCurrentView('login');
                      navigate('/login');
                    }}
                    onLoginClick={() => {
                      setCurrentView('login');
                      navigate('/login');
                    }}
                  />
                )}

                {currentView === 'dashboard' && (
                  <>
                    {renderDashboard()}
                  </>
                )}
              </div>
            }
          />
          <Route
            path="/impact"
            element={
              <div className="min-h-screen flex flex-col">
                <Header
                  onLoginClick={handleLoginClick}
                  onSignupClick={handleSignupClick}
                />
                <main className="flex-1">
                  <ImpactPage />
                </main>
                <Footer />
              </div>
            }
          />

          <Route
            path="/locate-site"
            element={
              <div className="min-h-screen flex flex-col">
                <Header
                  onLoginClick={handleLoginClick}
                  onSignupClick={handleSignupClick}
                />
                <main className="flex-1">
                  <LocateDonationSite />
                </main>
                <Footer />
              </div>
            }
          />
        </Routes>

        {/* Global overlays */}
        <PWAInstallPrompt />
        <CookieConsent />
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