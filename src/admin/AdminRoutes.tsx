// src/admin/AdminRoutes.tsx
// Maps sidebar module IDs → module page components.
// Uses internal state routing (no React Router sub-routes)
// to stay compatible with App.tsx single-route-per-dashboard pattern.
import React, { lazy, Suspense } from 'react';
import { useAdminStore } from './store/adminStore';

// ─── Eager ───────────────────────────────────────────────────────────────────
import OverviewPage from './modules/overview/OverviewPage';

const LiveMetrics = lazy(() => import('./modules/dashboard/LiveMetrics'));

// Organizations
const VerifyOrganizations    = lazy(() => import('./modules/organizations/VerifyOrganizations'));
const VerifiedOrganizations  = lazy(() => import('./modules/organizations/VerifiedOrganizations'));
const PendingRequests        = lazy(() => import('./modules/organizations/PendingRequests'));

// Blood Network
const NationalLedger    = lazy(() => import('./modules/blood-network/NationalLedger'));
const RTIDTracking      = lazy(() => import('./modules/blood-network/RTIDTracking'));
const AllocationControl = lazy(() => import('./modules/blood-network/AllocationControl'));

// Inventory
const NationalInventory = lazy(() => import('./modules/inventory/NationalInventory'));
const CityInventory     = lazy(() => import('./modules/inventory/CityInventory'));

// Analytics
const AnalyticsTrends  = lazy(() => import('./modules/analytics/AnalyticsTrends'));
const DemandVsSupply   = lazy(() => import('./modules/analytics/DemandVsSupply'));
const RegionAnalysis   = lazy(() => import('./modules/analytics/RegionAnalysis'));

// Donors
const AllDonors            = lazy(() => import('./modules/donors/AllDonors'));
const EligibilityTracking  = lazy(() => import('./modules/donors/EligibilityTracking'));

// Alerts
const FraudAlerts     = lazy(() => import('./modules/alerts/FraudAlerts'));
const EmergencyAlerts = lazy(() => import('./modules/alerts/EmergencyAlerts'));
const SafetyAlerts    = lazy(() => import('./modules/alerts/SafetyAlerts'));

// System
const AuditLogs    = lazy(() => import('./modules/system/AuditLogs'));
const SystemHealth = lazy(() => import('./modules/system/SystemHealth'));
const Settings     = lazy(() => import('./modules/system/Settings'));

// ─── Fallback Skeleton ────────────────────────────────────────────────────────

const ModuleFallback: React.FC<{ label?: string }> = ({ label }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
    gap: 12,
    fontFamily: 'Inter, sans-serif',
  }}>
    <div style={{
      width: 36,
      height: 36,
      borderRadius: '50%',
      border: '3px solid #1e1214',
      borderTopColor: '#C41E3A',
      animation: 'spin 0.8s linear infinite',
    }} />
    <p style={{ fontSize: 13, color: '#5a4a4d', margin: 0 }}>
      Loading {label ?? 'module'}…
    </p>
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ─── Coming Soon stub (for modules not yet built) ─────────────────────────────

const ComingSoon: React.FC<{ title: string }> = ({ title }) => (
  <div style={{
    padding: '40px 36px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
    gap: 16,
    fontFamily: 'Inter, sans-serif',
  }}>
    <div style={{
      width: 56,
      height: 56,
      borderRadius: 14,
      background: 'rgba(196,30,58,0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 26,
    }}>
      🛠
    </div>
    <h2 style={{ fontSize: 18, fontWeight: 600, color: '#d0c0c4', margin: 0 }}>
      {title}
    </h2>
    <p style={{ fontSize: 13, color: '#5a4a4d', margin: 0, textAlign: 'center', maxWidth: 320 }}>
      This module is being built as part of Phase 3. The routing and store are already wired.
    </p>
    <span style={{
      background: 'rgba(196,30,58,0.12)',
      color: '#E8294A',
      fontSize: 11,
      fontWeight: 600,
      padding: '4px 12px',
      borderRadius: 20,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    }}>
      Phase 3 — Coming Soon
    </span>
  </div>
);

// ─── Route Map ────────────────────────────────────────────────────────────────

const routeMap: Record<string, () => React.ReactElement> = {
  'overview':               () => <OverviewPage />,
  'live-metrics':           () => <Suspense fallback={<ModuleFallback label="Live Metrics" />}><LiveMetrics /></Suspense>,
  'verify-organizations':   () => <Suspense fallback={<ModuleFallback label="Verify Organizations" />}><VerifyOrganizations /></Suspense>,
  'verified-organizations': () => <Suspense fallback={<ModuleFallback label="Verified Organizations" />}><VerifiedOrganizations /></Suspense>,
  'pending-requests':       () => <Suspense fallback={<ModuleFallback label="Pending Requests" />}><PendingRequests /></Suspense>,
  'national-ledger':        () => <Suspense fallback={<ModuleFallback label="National Ledger" />}><NationalLedger /></Suspense>,
  'rtid-tracking':          () => <Suspense fallback={<ModuleFallback label="RTID Tracking" />}><RTIDTracking /></Suspense>,
  'allocation-control':     () => <Suspense fallback={<ModuleFallback label="Allocation Control" />}><AllocationControl /></Suspense>,
  'national-inventory':     () => <Suspense fallback={<ModuleFallback label="National Inventory" />}><NationalInventory /></Suspense>,
  'city-inventory':         () => <Suspense fallback={<ModuleFallback label="City Inventory" />}><CityInventory /></Suspense>,
  'analytics-trends':       () => <Suspense fallback={<ModuleFallback label="Trends" />}><AnalyticsTrends /></Suspense>,
  'demand-vs-supply':       () => <Suspense fallback={<ModuleFallback label="Demand vs Supply" />}><DemandVsSupply /></Suspense>,
  'region-analysis':        () => <Suspense fallback={<ModuleFallback label="Region Analysis" />}><RegionAnalysis /></Suspense>,
  'all-donors':             () => <Suspense fallback={<ModuleFallback label="All Donors" />}><AllDonors /></Suspense>,
  'eligibility-tracking':   () => <Suspense fallback={<ModuleFallback label="Eligibility Tracking" />}><EligibilityTracking /></Suspense>,
  'fraud-alerts':           () => <Suspense fallback={<ModuleFallback label="Fraud Alerts" />}><FraudAlerts /></Suspense>,
  'emergency-alerts':       () => <Suspense fallback={<ModuleFallback label="Emergency Alerts" />}><EmergencyAlerts /></Suspense>,
  'safety-alerts':          () => <Suspense fallback={<ModuleFallback label="Safety Alerts" />}><SafetyAlerts /></Suspense>,
  'audit-logs':             () => <Suspense fallback={<ModuleFallback label="Audit Logs" />}><AuditLogs /></Suspense>,
  'system-health':          () => <Suspense fallback={<ModuleFallback label="System Health" />}><SystemHealth /></Suspense>,
  'settings':               () => <Suspense fallback={<ModuleFallback label="Settings" />}><Settings /></Suspense>,
};

// ─── AdminRoutes Component ────────────────────────────────────────────────────

export const AdminRoutes: React.FC = () => {
  const { activeModule } = useAdminStore();
  const render = routeMap[activeModule];
  if (!render) {
    return <ComingSoon title={activeModule} />;
  }
  return render();
};

export default AdminRoutes;
