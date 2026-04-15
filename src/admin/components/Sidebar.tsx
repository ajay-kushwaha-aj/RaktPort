// src/admin/components/Sidebar.tsx
import React, { useState } from 'react';
import {
  LayoutDashboard,
  Activity,
  Building2,
  CheckCircle2,
  Clock,
  Droplets,
  BookOpen,
  ScanLine,
  Shuffle,
  Package,
  Globe,
  MapPin,
  BarChart3,
  TrendingUp,
  Scale,
  Users,
  ShieldAlert,
  Bell,
  AlertTriangle,
  ShieldCheck,
  ScrollText,
  Cpu,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  UserCircle,
} from 'lucide-react';
import raktportLogo from '../../assets/raktport-logo.png';
import { useAdminStore } from '../store/adminStore';

// ─── Nav Structure ──────────────────────────────────────────────────────────

interface NavChild {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavSection {
  id: string;
  label: string;
  icon: React.ElementType;
  children: NavChild[];
}

const buildNavSections = (
  pendingOrgsCount: number,
  fraudAlertsCount: number
): NavSection[] => [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    children: [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'live-metrics', label: 'Live Metrics', icon: Activity },
    ],
  },
  {
    id: 'organizations',
    label: 'Organizations',
    icon: Building2,
    children: [
      {
        id: 'verify-organizations',
        label: 'Verify Organizations',
        icon: CheckCircle2,
        badge: pendingOrgsCount || undefined,
      },
      { id: 'verified-organizations', label: 'Verified Organizations', icon: CheckCircle2 },
      { id: 'pending-requests', label: 'Pending Requests', icon: Clock },
    ],
  },
  {
    id: 'blood-network',
    label: 'Blood Network',
    icon: Droplets,
    children: [
      { id: 'national-ledger', label: 'National Ledger', icon: BookOpen },
      { id: 'rtid-tracking', label: 'RTID Tracking', icon: ScanLine },
      { id: 'allocation-control', label: 'Allocation Control', icon: Shuffle },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Package,
    children: [
      { id: 'national-inventory', label: 'National Inventory', icon: Globe },
      { id: 'city-inventory', label: 'City Inventory', icon: MapPin },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    children: [
      { id: 'analytics-trends', label: 'Trends', icon: TrendingUp },
      { id: 'demand-vs-supply', label: 'Demand vs Supply', icon: Scale },
      { id: 'region-analysis', label: 'Region Analysis', icon: MapPin },
    ],
  },
  {
    id: 'donors',
    label: 'Donors',
    icon: Users,
    children: [
      { id: 'all-donors', label: 'All Donors', icon: Users },
      { id: 'eligibility-tracking', label: 'Eligibility Tracking', icon: ShieldCheck },
    ],
  },
  {
    id: 'alerts',
    label: 'Alerts & Security',
    icon: ShieldAlert,
    children: [
      {
        id: 'fraud-alerts',
        label: 'Fraud Alerts',
        icon: ShieldAlert,
        badge: fraudAlertsCount || undefined,
      },
      { id: 'emergency-alerts', label: 'Emergency Alerts', icon: Bell },
      { id: 'safety-alerts', label: 'Safety Alerts', icon: AlertTriangle },
    ],
  },
  {
    id: 'system',
    label: 'System',
    icon: Cpu,
    children: [
      { id: 'audit-logs', label: 'Audit Logs', icon: ScrollText },
      { id: 'system-health', label: 'System Health', icon: Cpu },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

// ─── Sidebar Component ───────────────────────────────────────────────────────

interface SidebarProps {
  adminEmail?: string;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ adminEmail, onLogout }) => {
  const { activeModule, setActiveModule, sidebarCollapsed, toggleSidebar, metrics } =
    useAdminStore();

  const navSections = buildNavSections(metrics.pendingOrgsCount, metrics.fraudAlertsCount);

  // Which sections are open (expanded) — start with the section containing the active module open
  const getInitialOpen = () => {
    const section = navSections.find((s) => s.children.some((c) => c.id === activeModule));
    return section ? [section.id] : ['dashboard'];
  };
  const [openSections, setOpenSections] = useState<string[]>(getInitialOpen);

  const toggleSection = (sectionId: string) => {
    if (sidebarCollapsed) {
      // In mini mode, expand sidebar first
      toggleSidebar();
      setOpenSections([sectionId]);
      return;
    }
    setOpenSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    );
  };

  const handleItemClick = (itemId: string) => {
    setActiveModule(itemId);
  };

  return (
    <aside
      style={{
        width: sidebarCollapsed ? 64 : 260,
        minWidth: sidebarCollapsed ? 64 : 260,
        height: '100vh',
        background: 'linear-gradient(180deg, #0f172a 0%, #0d0709 100%)',
        borderRight: '1px solid #1e1014',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'relative',
        zIndex: 40,
      }}
    >
      {/* ── Logo ─────────────────────────────────────────── */}
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: sidebarCollapsed ? '0 12px' : '0 16px',
          borderBottom: '1px solid #1e1014',
          flexShrink: 0,
        }}
      >
        {/* Logo image — square crop, rounded */}
        <img
          src={raktportLogo}
          alt="RaktPort"
          style={{
            width: 36,
            height: 36,
            objectFit: 'contain',
            objectPosition: 'center',
            flexShrink: 0,
          }}
        />
        {!sidebarCollapsed && (
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700, color: '#ffffff', letterSpacing: 0.5, margin: 0, lineHeight: 1.1 }}>
              RaktPort
            </p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, fontWeight: 500, color: '#2563eb', letterSpacing: 1.5, textTransform: 'uppercase', margin: 0 }}>
              Control Center
            </p>
          </div>
        )}
      </div>

      {/* ── Nav scroll area ──────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0' }}>
        {navSections.map((section) => {
          const SectionIcon = section.icon;
          const isOpen = openSections.includes(section.id);
          const hasActive = section.children.some((c) => c.id === activeModule);

          return (
            <div key={section.id} style={{ marginBottom: 2 }}>
              {/* Section header */}
              <button
                onClick={() => toggleSection(section.id)}
                title={sidebarCollapsed ? section.label : undefined}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: sidebarCollapsed ? '9px 16px' : '9px 16px 9px 18px',
                  background: hasActive && sidebarCollapsed ? 'rgba(37,99,235,0.12)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 6,
                  margin: '0 6px',
                  transition: 'background 0.15s',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!hasActive || !sidebarCollapsed) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    hasActive && sidebarCollapsed ? 'rgba(37,99,235,0.12)' : 'transparent';
                }}
              >
                {hasActive && sidebarCollapsed && (
                  <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 2, background: '#2563eb' }} />
                )}
                <SectionIcon
                  size={16}
                  color={hasActive ? '#3b82f6' : '#cbd5e1'}
                  style={{ flexShrink: 0 }}
                />
                {!sidebarCollapsed && (
                  <>
                    <span style={{
                      flex: 1,
                      textAlign: 'left',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 12,
                      fontWeight: 600,
                      color: hasActive ? '#ffffff' : '#e2e8f0',
                      letterSpacing: 0.3,
                      textTransform: 'uppercase',
                    }}>
                      {section.label}
                    </span>
                    <ChevronDown
                      size={13}
                      color="#94a3b8"
                      style={{
                        transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                        transition: 'transform 0.2s',
                        flexShrink: 0,
                      }}
                    />
                  </>
                )}
              </button>

              {/* Children (collapsed = tooltip only when collapsed, expand otherwise) */}
              {!sidebarCollapsed && isOpen && (
                <div style={{ paddingLeft: 0 }}>
                  {section.children.map((child) => {
                    const ChildIcon = child.icon;
                    const isActive = child.id === activeModule;
                    return (
                      <button
                        key={child.id}
                        onClick={() => handleItemClick(child.id)}
                        style={{
                          width: 'calc(100% - 12px)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '7px 14px 7px 36px',
                          margin: '1px 6px',
                          background: isActive ? 'rgba(37,99,235,0.15)' : 'transparent',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.background =
                            isActive ? 'rgba(37,99,235,0.15)' : 'transparent';
                        }}
                      >
                        {isActive && (
                          <div style={{
                            position: 'absolute',
                            left: 0,
                            top: '15%',
                            bottom: '15%',
                            width: 3,
                            borderRadius: 2,
                            background: '#2563eb',
                          }} />
                        )}
                        <ChildIcon
                          size={14}
                          color={isActive ? '#3b82f6' : '#94a3b8'}
                          style={{ flexShrink: 0 }}
                        />
                        <span style={{
                          flex: 1,
                          textAlign: 'left',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: 13,
                          fontWeight: isActive ? 600 : 400,
                          color: isActive ? '#ffffff' : '#cbd5e1',
                        }}>
                          {child.label}
                        </span>
                        {child.badge !== undefined && child.badge > 0 && (
                          <span style={{
                            background: '#2563eb',
                            color: '#fff',
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: 10,
                            fontFamily: 'Inter, sans-serif',
                            lineHeight: 1.6,
                          }}>
                            {child.badge > 99 ? '99+' : child.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Bottom: Admin pill + collapse toggle ─────────── */}
      <div
        style={{
          borderTop: '1px solid #1e1014',
          padding: '10px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          flexShrink: 0,
        }}
      >
        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-end',
            gap: 6,
            padding: '6px 10px',
            background: 'transparent',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            color: '#94a3b8',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#e2e8f0'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'; }}
        >
          {sidebarCollapsed ? (
            <ChevronRight size={15} />
          ) : (
            <>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'currentColor' }}>
                Collapse
              </span>
              <ChevronLeft size={15} />
            </>
          )}
        </button>

        {/* Admin profile pill */}
        <div
          onClick={() => handleItemClick('settings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
            padding: sidebarCollapsed ? '6px' : '6px 10px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid #1a1012',
            borderRadius: 8,
            marginBottom: sidebarCollapsed ? 8 : 12,
            transition: 'background 0.2s',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
          }}
        >
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <UserCircle size={18} color="#fff" />
          </div>
          {!sidebarCollapsed && (
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600, color: '#f1f5f9', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Super Admin
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#94a3b8', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {adminEmail || 'admin@raktport.dev'}
              </p>
            </div>
          )}
          {!sidebarCollapsed && (
            <button
              onClick={onLogout}
              title="Logout"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                color: '#94a3b8',
                flexShrink: 0,
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#3b82f6'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'; }}
            >
              <LogOut size={14} />
            </button>
          )}
        </div>

        {/* Logout when collapsed */}
        {sidebarCollapsed && (
          <button
            onClick={onLogout}
            title="Logout"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '7px 8px',
              background: 'transparent',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              color: '#94a3b8',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#3b82f6'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'; }}
          >
            <LogOut size={15} />
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
