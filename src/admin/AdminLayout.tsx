// src/admin/AdminLayout.tsx
// Root shell for the entire admin dashboard.
// Renders: Sidebar (fixed, collapsible) + AdminHeader (top bar) + content area
import React, { useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { AdminHeader } from './components/AdminHeader';
import { NotificationPanel } from './components/NotificationPanel';
import { AdminRoutes } from './AdminRoutes';
import { useAdminStore } from './store/adminStore';
import {
  fetchAllAdminData,
  fetchAdminDetails,
  subscribeToRealtimeAlerts,
  subscribeToRealtimeData,
} from './services/adminDataService';
import { toast } from 'sonner';

interface AdminLayoutProps {
  onLogout: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ onLogout }) => {
  const handleRefresh = useCallback(async () => {
    try {
      await fetchAllAdminData();
      toast.success('Dashboard refreshed');
    } catch (_) {
      toast.error('Refresh failed — check your connection');
    }
  }, []);

  useEffect(() => {
    // Initial data load
    fetchAdminDetails();
    fetchAllAdminData().catch((e) =>
      console.error('[AdminLayout] initial fetch failed:', e)
    );

    // Real-time emergency alert subscription
    const unsubAlerts = subscribeToRealtimeAlerts();

    // Real-time data listener — auto-refreshes dashboard when Firestore data changes
    const unsubData = subscribeToRealtimeData();

    return () => {
      unsubAlerts();
      unsubData();
    };
  }, []);

  const adminEmail =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('userEmail') || undefined
      : undefined;

  return (
    // Force dark mode — ignore system preference
    <div
      data-theme="dark"
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: '#020617',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        // Force Inter font for the entire admin shell
      }}
    >
      {/* Google Fonts: Inter */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        /* Admin shell resets — scoped so they don't bleed out */
        .admin-shell * {
          box-sizing: border-box;
        }
        .admin-shell button {
          font-family: Inter, sans-serif;
        }
        .admin-shell input {
          font-family: Inter, sans-serif;
        }

        /* Custom scrollbar for admin */
        .admin-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .admin-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .admin-scroll::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 2px;
        }
        .admin-scroll::-webkit-scrollbar-thumb:hover {
          background: #3a2a2d;
        }

        @keyframes admin-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div
        className="admin-shell"
        style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}
      >
        {/* ── Fixed Left Sidebar ──────────────────────────── */}
        <Sidebar adminEmail={adminEmail} onLogout={onLogout} />

        {/* ── Right: Header + Content ─────────────────────── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: '#020617',
          }}
        >
          <AdminHeader
            adminEmail={adminEmail}
            onLogout={onLogout}
            onRefresh={handleRefresh}
          />

          {/* ── Scrollable Module Content ─────────────────── */}
          <main
            className="admin-scroll"
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              background: '#0f172a',
            }}
          >
            <AdminRoutes />
          </main>
        </div>

        {/* ── Notification Panel (slide-in) ──────────────── */}
        <NotificationPanel />
      </div>
    </div>
  );
};

export default AdminLayout;
