import React, { useState, useEffect } from 'react';
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

  // Generate some live mock data for the chart to show activity in the last 15 minutes
  const chartData = Array.from({ length: 15 }).map((_, i) => ({
    time: `-${15 - i}m`,
    requests: Math.floor(Math.random() * 5 + (metrics.activeRTIDs / 50)),
    donations: Math.floor(Math.random() * 8 + (metrics.totalDonations / 100))
  }));

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f0e0e4', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={22} color="#f472b6" /> Real-Time Live Metrics
          </h2>
          <p style={{ fontSize: 13, color: '#6a5a5d', marginTop: 4 }}>
            Continuous stream of network activity and system load.
          </p>
        </div>
        <div style={{ background: '#0f0a0b', border: '1px solid #1e1214', borderRadius: 8, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={16} color="#4ade80" />
          <span style={{ color: '#4ade80', fontWeight: 600, fontSize: 14, fontFamily: 'monospace' }}>
            {currentTime.toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Active RTIDs', value: metrics.activeRTIDs, color: '#f472b6' },
          { label: 'Total Operations', value: nationalLedger.length, color: '#60a5fa' },
          { label: 'Network Pending Orgs', value: metrics.pendingOrgsCount, color: '#fbbf24' },
          { label: 'System Anomalies', value: metrics.fraudAlertsCount, color: '#f87171' }
        ].map(m => (
          <div key={m.label} style={{ background: '#0f0a0b', border: '1px solid #1e1214', borderRadius: 12, padding: '24px' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: 12, color: '#6a5a5d', fontWeight: 600, textTransform: 'uppercase' }}>{m.label}</p>
            <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>

      <div style={{ background: '#0f0a0b', border: '1px solid #1e1214', borderRadius: 16, padding: '24px' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#c0b0b3', marginBottom: 24 }}>Network Activity (Last 15 Minutes)</h3>
        <div style={{ height: 300, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="time" stroke="#2e1a1e" tick={{ fill: '#6a5a5d', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#2e1a1e" tick={{ fill: '#6a5a5d', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1a1012', border: '1px solid #2e1a1e', borderRadius: 8, color: '#f0e0e4' }}
                itemStyle={{ color: '#f0e0e4' }}
              />
              <Line type="monotone" dataKey="requests" stroke="#f472b6" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="donations" stroke="#60a5fa" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default LiveMetrics;
