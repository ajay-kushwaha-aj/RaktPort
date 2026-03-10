// src/App.tsx
import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { AdminSignupPage } from './components/AdminSignupPage';
import { DonorDashboard } from './components/DonorDashboard';

// --- Import the dashboards with CONSISTENT DEFAULT IMPORTS ---
import HospitalDashboard from './components/HospitalDashboard';
import BloodBankDashboard from './components/BloodBankDashboard';  // ✅ FIXED: Now using default import
import AdminDashboard from './components/AdminDashboard';  // ✅ FIXED: Now using default import
import { Button } from './components/ui/button';

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
    // If user is logged in AND has valid userId, always show dashboard (don't let URL override)
    else if (loggedIn) {
      setIsLoggedIn(true);
      setSelectedRole(role);
      setCurrentView('dashboard');
      return; // Exit early - don't process URL routing when logged in
    }

    // Handle URL routing only when NOT logged in
    if (location.pathname === '/register/admin') {
      setCurrentView('signup');
      setSelectedRole('admin');
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

  const handleLoginClick = () => {
    navigate('/login');
    setCurrentView('login');
  };

  const handleSignupClick = (role: string) => {
    setSelectedRole(role);
    if (role === 'admin') {
      navigate('/register/admin');
    } else {
      setCurrentView('signup');
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
        return <AdminDashboard onLogout={handleLogout} />;

      default:
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-3xl text-[#8B0000] mb-4">Dashboard Not Found</h1>
              <p className="text-gray-600 mb-6">Could not find dashboard for role: {selectedRole}</p>
              <Button
                onClick={handleLogout}
                className="px-6 py-2 bg-[#8B0000] text-white rounded hover:bg-[#6B0000]"
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

          {/* Default Routes */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex flex-col">
                {currentView === 'home' && (
                  <>
                    <Header
                      onLoginClick={handleLoginClick}
                      onSignupClick={handleDonorSignupClick}
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

                {currentView === 'dashboard' && renderDashboard()}
              </div>
            }
          />
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

import { ThemeProvider } from "@/components/theme-provider"

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="viser-theme">
      <AppContent />
    </ThemeProvider>
  )
}