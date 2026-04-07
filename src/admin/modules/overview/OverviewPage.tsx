// src/admin/modules/overview/OverviewPage.tsx
import React, { useMemo, useState, useEffect } from 'react';
import {
  Droplets,
  Users,
  ScanLine,
  Building2,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Activity,
  Zap,
} from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { formatDateTime } from '../../services/exportService';

// ─── KPI Card ─────────────────────────────────────────────────────────────────

const KPICard: React.FC<{
  label: string;
  value: number | string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  delta?: string;
  deltaUp?: boolean;
  onClick?: () => void;
}> = ({ label, value, icon: Icon, iconColor, iconBg, delta, deltaUp, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: '#0f0a0b',
      border: '1px solid #1e1214',
      borderRadius: 12,
      padding: '20px 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'border-color 0.2s, background 0.15s',
    }}
    onMouseEnter={(e) => {
      if (onClick) {
        (e.currentTarget as HTMLDivElement).style.borderColor = '#3e1a20';
        (e.currentTarget as HTMLDivElement).style.background = '#120a0c';
      } else {
        (e.currentTarget as HTMLDivElement).style.borderColor = '#2e1a1e';
      }
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLDivElement).style.borderColor = '#1e1214';
      (e.currentTarget as HTMLDivElement).style.background = '#0f0a0b';
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: 11,
        color: '#7a6a6d',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
      }}>
        {label}
      </span>
      <div style={{
        width: 34,
        height: 34,
        borderRadius: 8,
        background: iconBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Icon size={16} color={iconColor} />
      </div>
    </div>
    <div>
      <p style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: 30,
        fontWeight: 700,
        color: '#f0e0e4',
        margin: 0,
        letterSpacing: -0.5,
      }}>
        {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
      </p>
      {delta && (
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 11,
          color: deltaUp ? '#4ade80' : '#f87171',
          margin: '4px 0 0 0',
        }}>
          {deltaUp ? '↑' : '↓'} {delta}
        </p>
      )}
    </div>
  </div>
);

// ─── Stat Bar Card ─────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  label: string;
  value: number;
  sublabel: string;
  color: string;
  onClick?: () => void;
}> = ({ label, value, sublabel, color, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: '#0f0a0b',
      border: '1px solid #1e1214',
      borderRadius: 10,
      padding: '16px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'border-color 0.15s',
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLDivElement).style.borderColor = '#2e1a1e';
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLDivElement).style.borderColor = '#1e1214';
    }}
  >
    <div style={{ width: 4, height: 36, borderRadius: 2, background: color, flexShrink: 0 }} />
    <div>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 22, fontWeight: 700, color: '#e0d0d4', margin: 0 }}>
        {value.toLocaleString('en-IN')}
      </p>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#7a6a6d', margin: 0 }}>
        {label}
      </p>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#5a4a4d', margin: 0 }}>
        {sublabel}
      </p>
    </div>
  </div>
);

// ─── Activity Row ──────────────────────────────────────────────────────────────

const ActivityRow: React.FC<{
  label: string;
  value: string | number;
  color: string;
}> = ({ label, value, color }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '7px 0',
    borderBottom: '1px solid #160d0f',
  }}>
    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#7a6a6d' }}>{label}</span>
    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color }}>{value}</span>
  </div>
);

// ─── Overview Page ─────────────────────────────────────────────────────────────

export const OverviewPage: React.FC = () => {
  const {
    metrics,
    lastRefreshed,
    loading,
    nationalLedger,
    setActiveModule,
    auditLog,
  } = useAdminStore();

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Today's activity counts from live ledger
  const today = currentTime.toISOString().split('T')[0];
  const todayActivity = useMemo(() => {
    const todayEntries = nationalLedger.filter((e) => {
      const d = new Date(e.createdAt || 0);
      return d.toISOString().split('T')[0] === today;
    });
    return {
      requests: todayEntries.filter((e) => e.type === 'request').length,
      donations: todayEntries.filter((e) => e.type === 'donation').length,
    };
  }, [nationalLedger, today]);

  // Most recent audit events (last 5)
  const recentActivity = useMemo(() => auditLog.slice(0, 5), [auditLog]);

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1400, fontFamily: 'Inter, sans-serif' }}>

      {/* ── Page header ──────────────────────────────────────────── */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f0e0e4', margin: 0 }}>
            Control Center Overview
          </h2>
          <p style={{ fontSize: 13, color: '#6a5a5d', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            Real-time national blood access network status
            {loading && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#C41E3A' }}>
                <RefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} />
                Syncing…
              </span>
            )}
          </p>
        </div>
        {lastRefreshed && (
          <div style={{
            background: 'rgba(74,222,128,0.06)',
            border: '1px solid rgba(74,222,128,0.15)',
            borderRadius: 8,
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <Activity size={11} color="#4ade80" />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#4ade80' }}>
              Live · {currentTime.toLocaleString('en-IN', {
                month: 'short', day: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
              })}
            </span>
          </div>
        )}
      </div>

      {/* ── KPI Grid ──────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 14,
        marginBottom: 28,
      }}>
        <KPICard
          label="Total Blood Requests"
          value={metrics.totalRequests}
          icon={Droplets}
          iconColor="#60a5fa"
          iconBg="rgba(96,165,250,0.1)"
          onClick={() => setActiveModule('national-ledger')}
        />
        <KPICard
          label="Completed Donations"
          value={metrics.totalDonations}
          icon={TrendingUp}
          iconColor="#4ade80"
          iconBg="rgba(74,222,128,0.1)"
          onClick={() => setActiveModule('national-ledger')}
        />
        <KPICard
          label="Active RTIDs"
          value={metrics.activeRTIDs}
          icon={ScanLine}
          iconColor="#a78bfa"
          iconBg="rgba(167,139,250,0.1)"
          onClick={() => setActiveModule('rtid-tracking')}
        />
        <KPICard
          label="Registered Donors"
          value={metrics.totalDonors}
          icon={Users}
          iconColor="#fbbf24"
          iconBg="rgba(251,191,36,0.1)"
          onClick={() => setActiveModule('all-donors')}
        />
      </div>

      {/* ── Org Status + Alerts ────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#5a4a4d',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 12,
        }}>
          Organization & Alert Status
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
          gap: 10,
        }}>
          <StatCard
            label="Verified Organizations"
            value={metrics.verifiedOrgsCount}
            sublabel="Hospitals & Blood Banks"
            color="#4ade80"
            onClick={() => setActiveModule('verified-organizations')}
          />
          <StatCard
            label="Pending Verification"
            value={metrics.pendingOrgsCount}
            sublabel="Awaiting admin review"
            color="#fbbf24"
            onClick={() => setActiveModule('verify-organizations')}
          />
          <StatCard
            label="Fraud Alerts"
            value={metrics.fraudAlertsCount}
            sublabel="Flagged requests"
            color="#E8294A"
            onClick={() => setActiveModule('fraud-alerts')}
          />
          <StatCard
            label="Ledger Entries"
            value={nationalLedger.length}
            sublabel="Requests + Donations"
            color="#a78bfa"
            onClick={() => setActiveModule('national-ledger')}
          />
        </div>
      </div>

      {/* ── Bottom two-column grid ─────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
      }}>

        {/* Today's Activity */}
        <div style={{
          background: '#0f0a0b',
          border: '1px solid #1e1214',
          borderRadius: 12,
          padding: '20px 22px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Clock size={13} color="#C41E3A" />
            <h3 style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#7a6a6d',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: 0.7,
            }}>
              Today's Activity
            </h3>
          </div>
          <ActivityRow label="New blood requests" value={todayActivity.requests} color="#60a5fa" />
          <ActivityRow label="Donations processed" value={todayActivity.donations} color="#4ade80" />
          <ActivityRow label="Active RTIDs (pending)" value={metrics.activeRTIDs} color="#a78bfa" />
          <ActivityRow label="Orgs pending verification" value={metrics.pendingOrgsCount} color="#fbbf24" />
          <ActivityRow label="Fraud flags" value={metrics.fraudAlertsCount} color="#E8294A" />

          {lastRefreshed && (
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 10,
              color: '#4a3a3d',
              marginTop: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}>
              <Zap size={10} color="#C41E3A" />
              Live data — last synced {formatDateTime(lastRefreshed)}
            </p>
          )}
        </div>

        {/* Recent Audit Activity */}
        <div style={{
          background: '#0f0a0b',
          border: '1px solid #1e1214',
          borderRadius: 12,
          padding: '20px 22px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={13} color="#fbbf24" />
              <h3 style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#7a6a6d',
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: 0.7,
              }}>
                Recent Activity
              </h3>
            </div>
            <button
              onClick={() => setActiveModule('audit-logs')}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: 11,
                color: '#C41E3A',
                padding: 0,
              }}
            >
              View all →
            </button>
          </div>

          {recentActivity.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 120,
              gap: 8,
            }}>
              <Building2 size={28} color="#2a1a1d" />
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#4a3a4d', margin: 0 }}>
                {loading ? 'Loading activity…' : 'No recent activity'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {recentActivity.map((entry) => {
                const typeColor =
                  entry.action.toLowerCase().includes('verif') ? '#4ade80' :
                  entry.action.toLowerCase().includes('fraud') ? '#E8294A' :
                  entry.action.toLowerCase().includes('request') ? '#60a5fa' :
                  '#a78bfa';
                return (
                  <div key={entry.id} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '8px 0',
                    borderBottom: '1px solid #160d0f',
                  }}>
                    <div style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: typeColor,
                      marginTop: 5,
                      flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <p style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#c0b0b3',
                        margin: 0,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {entry.action}
                      </p>
                      <p style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: 11,
                        color: '#5a4a5d',
                        margin: '1px 0 0 0',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {entry.details}
                      </p>
                    </div>
                    <span style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: 10,
                      color: '#4a3a4d',
                      flexShrink: 0,
                      paddingTop: 2,
                    }}>
                      {formatDateTime(entry.timestamp)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default OverviewPage;
