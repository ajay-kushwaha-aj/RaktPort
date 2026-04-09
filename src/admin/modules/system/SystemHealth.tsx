import React, { useState, useEffect } from 'react';
import { ActivitySquare, Database, Server, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';

export const SystemHealth: React.FC = () => {
  const { lastRefreshed, loading, metrics, nationalLedger } = useAdminStore();
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [dbStatus, setDbStatus] = useState<'checking' | 'operational' | 'degraded'>('checking');

  // Measure actual Firestore latency by timing the last refresh
  useEffect(() => {
    const measurePing = async () => {
      try {
        const start = performance.now();
        const { collection, getDocs, limit, query } = await import('firebase/firestore');
        const { db } = await import('../../../firebase');
        await getDocs(query(collection(db, 'users'), limit(1)));
        const end = performance.now();
        setPingMs(Math.round(end - start));
        setDbStatus('operational');
      } catch {
        setDbStatus('degraded');
        setPingMs(null);
      }
    };
    measurePing();
    const interval = setInterval(measurePing, 30000); // Re-check every 30s
    return () => clearInterval(interval);
  }, []);

  const isOperational = dbStatus === 'operational';
  const borderColor = isOperational ? 'rgba(74,222,128,0.2)' : 'rgba(251,191,36,0.3)';
  const statusIcon = isOperational ? CheckCircle2 : AlertTriangle;
  const statusColor = isOperational ? '#4ade80' : '#fbbf24';

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1000, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f0e0e4', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <ActivitySquare size={22} color={statusColor} /> System Health
        </h2>
        <p style={{ fontSize: 13, color: '#6a5a5d', marginTop: 4 }}>
          Live platform status and operational telemetry.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {/* Firebase DB */}
        <div style={{ background: '#0f0a0b', border: `1px solid ${borderColor}`, borderRadius: 12, padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: `rgba(${isOperational ? '74,222,128' : '251,191,36'},0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Database size={24} color={statusColor} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f0e0e4' }}>Firestore Database</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#a09094' }}>
              {dbStatus === 'checking' ? 'Measuring latency…' :
               dbStatus === 'operational' ? `Latency: ${pingMs}ms • Status: Operational` :
               'Status: Degraded — connection issues'}
            </p>
          </div>
        </div>

        {/* Data Pipeline */}
        <div style={{ background: '#0f0a0b', border: `1px solid ${borderColor}`, borderRadius: 12, padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(74,222,128,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Server size={24} color={statusColor} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f0e0e4' }}>Data Pipeline</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#a09094' }}>
              Records loaded: {nationalLedger.length.toLocaleString('en-IN')} • Donors: {metrics.totalDonors.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Real-time Subscriptions */}
        <div style={{ background: '#0f0a0b', border: `1px solid ${borderColor}`, borderRadius: 12, padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(74,222,128,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={24} color={statusColor} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f0e0e4' }}>Real-Time Listeners</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#a09094' }}>
              {loading ? 'Syncing…' : 'Connected'} • Active Subscriptions: 3 (users, requests, donations)
            </p>
          </div>
        </div>
      </div>

      {/* Last Refreshed Info */}
      {lastRefreshed && (
        <div style={{
          marginTop: 24,
          background: '#0f0a0b',
          border: '1px solid #1e1214',
          borderRadius: 10,
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 12,
          color: '#6a5a5d',
        }}>
          <Zap size={13} color="#4ade80" />
          Last data sync: {lastRefreshed.toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
          })}
        </div>
      )}
    </div>
  );
};

export default SystemHealth;
