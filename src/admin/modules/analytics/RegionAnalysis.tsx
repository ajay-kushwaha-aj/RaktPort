import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Map } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';

export const RegionAnalysis: React.FC = () => {
  const { nationalLedger } = useAdminStore();

  const cityData = useMemo(() => {
    const map: Record<string, { city: string; activity: number }> = {};
    
    // Aggregate absolute volume of activity (Requests + Donations) per city
    nationalLedger.forEach(item => {
      const city = item.city || 'Unknown';
      if (!map[city]) map[city] = { city, activity: 0 };
      map[city].activity += 1;
    });

    return Object.values(map)
      .sort((a, b) => b.activity - a.activity)
      .slice(0, 10); // Top 10 cities
  }, [nationalLedger]);

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1000, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f0e0e4', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Map size={22} color="#60a5fa" /> Regional Activity Analysis
        </h2>
        <p style={{ fontSize: 13, color: '#6a5a5d', marginTop: 4 }}>
          Top 10 highest-volume cities by total network activity (donations + requests).
        </p>
      </div>

      <div style={{ background: '#0f0a0b', border: '1px solid #1e1214', borderRadius: 16, padding: '32px' }}>
        {cityData.length === 0 ? (
          <p style={{ color: '#6a5a5d', textAlign: 'center' }}>No regional activity data available.</p>
        ) : (
          <div style={{ height: 400, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e1a1e" horizontal={true} vertical={false} />
                <XAxis type="number" stroke="#6a5a5d" tick={{ fill: '#6a5a5d', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="city" type="category" stroke="#e0d0d4" tick={{ fill: '#e0d0d4', fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} width={120} />
                <Tooltip 
                  cursor={{ fill: '#140c0e' }}
                  contentStyle={{ background: '#1a1012', border: '1px solid #2e1a1e', borderRadius: 8, color: '#f0e0e4' }}
                />
                <Bar dataKey="activity" name="Total Network Activity" fill="#60a5fa" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegionAnalysis;
