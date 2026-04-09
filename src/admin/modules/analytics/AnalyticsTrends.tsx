import React, { useMemo } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, TrendingUp } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';

/**
 * Aggregate real data from the national ledger into monthly buckets
 * for the last 6 months, using actual Firestore records.
 */
const useTrendData = () => {
  const { nationalLedger, nationalInventory } = useAdminStore();

  return useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();
    const buckets: { name: string; requests: number; donations: number; shortages: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      const monthEntries = nationalLedger.filter((e) => {
        const entryDate = new Date(e.createdAt || 0);
        const entryKey = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`;
        return entryKey === monthKey;
      });

      const requests = monthEntries.filter((e) => e.type === 'request').length;
      const donations = monthEntries.filter((e) => e.type === 'donation').length;
      // Shortages: requests that are still pending (unfulfilled)
      const shortages = monthEntries.filter(
        (e) => e.type === 'request' && e.status.toLowerCase() === 'pending'
      ).length;

      buckets.push({
        name: monthNames[d.getMonth()],
        requests,
        donations,
        shortages,
      });
    }
    return buckets;
  }, [nationalLedger]);
};

export const AnalyticsTrends: React.FC = () => {
  const { loading } = useAdminStore();
  const trendData = useTrendData();

  const hasData = trendData.some(d => d.requests > 0 || d.donations > 0);

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200, fontFamily: 'Inter, sans-serif' }}>
      {/* ── Page header ── */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f0e0e4', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Activity size={22} color="#a78bfa" /> Platform Trends
        </h2>
        <p style={{ fontSize: 13, color: '#6a5a5d', marginTop: 4 }}>
          6-month historical analysis of national blood requests versus completed donations based on real data.
        </p>
      </div>

      {loading ? (
        <p style={{ color: '#6a5a5d' }}>Loading trends data...</p>
      ) : !hasData ? (
        <div style={{ background: '#0f0a0b', border: '1px solid #1e1214', borderRadius: 16, padding: '60px 32px', textAlign: 'center' }}>
          <Activity size={36} color="#2a1a1d" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 16, color: '#e0d0d4', margin: 0 }}>No Trend Data Yet</h3>
          <p style={{ color: '#6a5a5d', fontSize: 13, marginTop: 4 }}>
            Trend charts will populate automatically as blood requests and donations accumulate over time.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 24 }}>
          
          {/* Main Area Chart */}
          <div style={{ background: '#0f0a0b', border: '1px solid #1e1214', borderRadius: 16, padding: '24px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#e0d0d4' }}>Donations vs Requests</h3>
              <div style={{ display: 'flex', gap: 16 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#c0b0b3' }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: '#4ade80' }} /> Donations
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#c0b0b3' }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: '#60a5fa' }} /> Requests
                </span>
              </div>
            </div>

            <div style={{ height: 400, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDonations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2e1a1e" vertical={false} />
                  <XAxis dataKey="name" stroke="#6a5a5d" tick={{ fill: '#6a5a5d', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#6a5a5d" tick={{ fill: '#6a5a5d', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ background: '#1a1012', border: '1px solid #2e1a1e', borderRadius: 8, color: '#f0e0e4' }}
                    itemStyle={{ fontSize: 13, fontWeight: 500 }}
                  />
                  <Area type="monotone" dataKey="donations" name="Donations" stroke="#4ade80" strokeWidth={3} fillOpacity={1} fill="url(#colorDonations)" />
                  <Area type="monotone" dataKey="requests" name="Requests" stroke="#60a5fa" strokeWidth={3} fillOpacity={1} fill="url(#colorRequests)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary Line Chart */}
          <div style={{ background: '#0f0a0b', border: '1px solid #1e1214', borderRadius: 16, padding: '24px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#e0d0d4', display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={18} color="#f87171" /> 
                Unfulfilled Requests Index
              </h3>
            </div>

            <div style={{ height: 250, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2e1a1e" vertical={false} />
                  <XAxis dataKey="name" stroke="#6a5a5d" tick={{ fill: '#6a5a5d', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#6a5a5d" tick={{ fill: '#6a5a5d', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ background: '#1a1012', border: '1px solid #2e1a1e', borderRadius: 8, color: '#f0e0e4' }}
                  />
                  <Line type="monotone" dataKey="shortages" name="Unfulfilled Requests" stroke="#f87171" strokeWidth={3} dot={{ r: 4, fill: '#140c0e' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default AnalyticsTrends;
