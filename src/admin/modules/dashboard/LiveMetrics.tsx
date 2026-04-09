import React, { useState, useEffect, useMemo } from 'react';
import { Activity, Clock } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const LiveMetrics: React.FC = () => {
  const { metrics, nationalLedger } = useAdminStore();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Build real chart data from the national ledger: group by day for the last 15 days
  const chartData = useMemo(() => {
    const days: { time: string; requests: number; donations: number }[] = [];
    const now = new Date();

    for (let i = 14; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0]; // YYYY-MM-DD
      const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

      const dayEntries = nationalLedger.filter((e) => {
        const entryDate = new Date(e.createdAt || 0);
        return entryDate.toISOString().split('T')[0] === key;
      });

      days.push({
        time: label,
        requests: dayEntries.filter((e) => e.type === 'request').length,
        donations: dayEntries.filter((e) => e.type === 'donation').length,
      });
    }
    return days;
  }, [nationalLedger]);

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={22} color="#60a5fa" /> Real-Time Live Metrics
          </h2>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
            Live network activity based on actual Firestore data.
          </p>
        </div>
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={16} color="#4ade80" />
          <span style={{ color: '#4ade80', fontWeight: 600, fontSize: 14, fontFamily: 'monospace' }}>
            {currentTime.toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Active RTIDs', value: metrics.activeRTIDs, color: '#60a5fa' },
          { label: 'Total Operations', value: nationalLedger.length, color: '#60a5fa' },
          { label: 'Network Pending Orgs', value: metrics.pendingOrgsCount, color: '#fbbf24' },
          { label: 'System Anomalies', value: metrics.fraudAlertsCount, color: '#f87171' }
        ].map(m => (
          <div key={m.label} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '24px' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: 12, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>{m.label}</p>
            <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>

      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: '24px' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 24 }}>Network Activity (Last 15 Days)</h3>
        <div style={{ height: 300, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="time" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#1a1012', border: '1px solid #475569', borderRadius: 8, color: '#ffffff' }}
                itemStyle={{ color: '#ffffff' }}
              />
              <Line type="monotone" dataKey="requests" name="Requests" stroke="#60a5fa" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="donations" name="Donations" stroke="#60a5fa" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default LiveMetrics;
