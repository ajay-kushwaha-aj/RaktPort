// src/admin/components/AdminHeader.tsx
import React, { useState } from 'react';
import {
  Search,
  Bell,
  RefreshCw,
  Menu,
  ChevronDown,
  LogOut,
  User,
  Settings,
  Dot,
} from 'lucide-react';
import { useAdminStore } from '../store/adminStore';
import { useNotificationStore } from '../store/notificationStore';

interface AdminHeaderProps {
  adminEmail?: string;
  onLogout: () => void;
  onRefresh?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  adminEmail,
  onLogout,
  onRefresh,
}) => {
  const { activeModule, sidebarCollapsed, toggleSidebar, lastRefreshed, loading } =
    useAdminStore();
  const { unreadCount, togglePanel } = useNotificationStore();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const formatLastRefreshed = (date: Date | null) => {
    if (!date) return 'Never';
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const moduleTitles: Record<string, string> = {
    overview: 'Overview',
    'live-metrics': 'Live Metrics',
    'verify-organizations': 'Verify Organizations',
    'verified-organizations': 'Verified Organizations',
    'pending-requests': 'Pending Requests',
    'national-ledger': 'National Ledger',
    'rtid-tracking': 'RTID Tracking',
    'allocation-control': 'Allocation Control',
    'national-inventory': 'National Inventory',
    'city-inventory': 'City Inventory',
    'analytics-trends': 'Analytics · Trends',
    'demand-vs-supply': 'Demand vs Supply',
    'region-analysis': 'Region Analysis',
    'all-donors': 'All Donors',
    'eligibility-tracking': 'Eligibility Tracking',
    'fraud-alerts': 'Fraud Alerts',
    'emergency-alerts': 'Emergency Alerts',
    'safety-alerts': 'Safety Alerts',
    'audit-logs': 'Audit Logs',
    'system-health': 'System Health',
    settings: 'Settings',
  };

  return (
    <header
      style={{
        height: 64,
        background: '#0f172a',
        borderBottom: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 24px',
        flexShrink: 0,
        position: 'relative',
        zIndex: 30,
      }}
    >
      {/* Hamburger (mobile or collapsed toggle) */}
      <button
        onClick={toggleSidebar}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 6,
          borderRadius: 6,
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#ffffff'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'; }}
      >
        <Menu size={18} />
      </button>

      {/* Page title */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <h1
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 15,
            fontWeight: 600,
            color: '#f8fafc',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {moduleTitles[activeModule] ?? 'Control Center'}
        </h1>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#94a3b8', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Dot size={14} color={lastRefreshed ? '#22c55e' : '#5a5a5a'} style={{ margin: -4 }} />
          Last refreshed: {formatLastRefreshed(lastRefreshed)}
        </p>
      </div>

      {/* Search */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: searchFocused ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${searchFocused ? '#64748b' : '#334155'}`,
          borderRadius: 8,
          padding: '0 12px',
          gap: 8,
          width: 220,
          transition: 'background 0.15s, border 0.15s',
        }}
      >
        <Search size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
        <input
          placeholder="Search modules, RTIDs…"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: 'Inter, sans-serif',
            fontSize: 12,
            color: '#f1f5f9',
            width: '100%',
            padding: '8px 0',
          }}
        />
      </div>

      {/* Refresh */}
      <button
        onClick={onRefresh}
        disabled={loading}
        title="Refresh data"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          padding: 7,
          borderRadius: 7,
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          transition: 'color 0.15s, background 0.15s',
          opacity: loading ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
            (e.currentTarget as HTMLButtonElement).style.color = '#f8fafc';
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
        }}
      >
        <RefreshCw
          size={15}
          style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
        />
      </button>

      {/* Notifications */}
      <button
        onClick={togglePanel}
        title="Notifications"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 7,
          borderRadius: 7,
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          transition: 'color 0.15s, background 0.15s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
          (e.currentTarget as HTMLButtonElement).style.color = '#f8fafc';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
        }}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 16,
              height: 16,
              background: '#2563eb',
              borderRadius: '50%',
              fontFamily: 'Inter, sans-serif',
              fontSize: 9,
              fontWeight: 700,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid #0f172a',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Profile dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setProfileOpen((v) => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: profileOpen ? 'rgba(255,255,255,0.07)' : 'transparent',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            padding: '6px 10px',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => {
            if (!profileOpen) {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (!profileOpen) {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <User size={14} color="#fff" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, color: '#f1f5f9', margin: 0 }}>
              Super Admin
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#94a3b8', margin: 0, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {adminEmail || 'admin@raktport.dev'}
            </p>
          </div>
          <ChevronDown
            size={12}
            color="#94a3b8"
            style={{ transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          />
        </button>

        {/* Dropdown */}
        {profileOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              background: '#1e293b',
              border: '1px solid #475569',
              borderRadius: 10,
              padding: '6px',
              width: 180,
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              zIndex: 50,
            }}
          >
            {[
              { icon: User, label: 'Profile', action: () => { useAdminStore.getState().setActiveModule('settings'); } },
              { icon: Settings, label: 'Settings', action: () => { useAdminStore.getState().setActiveModule('settings'); } },
            ].map(({ icon: Icon, label, action }) => (
              <button
                key={label}
                onClick={() => { action(); setProfileOpen(false); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 13,
                  color: '#e2e8f0',
                  transition: 'background 0.12s, color 0.12s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = '#e2e8f0';
                }}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
            <div style={{ height: 1, background: '#475569', margin: '4px 0' }} />
            <button
              onClick={() => { onLogout(); setProfileOpen(false); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                background: 'transparent',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: 13,
                color: '#3b82f6',
                transition: 'background 0.12s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(37,99,235,0.12)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              <LogOut size={13} />
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Close dropdown on outside click */}
      {profileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 49 }}
          onClick={() => setProfileOpen(false)}
        />
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  );
};

export default AdminHeader;
