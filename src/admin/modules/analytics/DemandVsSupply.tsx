import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChart } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';

export const DemandVsSupply: React.FC = () => {
  const { nationalInventory, nationalLedger } = useAdminStore();

  const groupedData = useMemo(() => {
    // Scaffold data for all 8 groups
    const dataObj: Record<string, { group: string; supply: number; demand: number }> = {
      'A+': { group: 'A+', supply: 0, demand: 0 },
      'A-': { group: 'A-', supply: 0, demand: 0 },
      'B+': { group: 'B+', supply: 0, demand: 0 },
      'B-': { group: 'B-', supply: 0, demand: 0 },
      'O+': { group: 'O+', supply: 0, demand: 0 },
      'O-': { group: 'O-', supply: 0, demand: 0 },
      'AB+': { group: 'AB+', supply: 0, demand: 0 },
      'AB-': { group: 'AB-', supply: 0, demand: 0 },
    };

    // Calculate live supply from inventory
    nationalInventory.forEach(inv => {
      if (dataObj[inv.bloodGroup]) dataObj[inv.bloodGroup].supply += inv.units;
    });

    // Calculate live demand from active pending requests in the ledger
    nationalLedger
      .filter(item => item.type === 'request' && item.status.toLowerCase() === 'pending')
      .forEach(req => {
        if (dataObj[req.bloodGroup]) dataObj[req.bloodGroup].demand += req.units;
      });

    return Object.values(dataObj);
  }, [nationalInventory, nationalLedger]);

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f0e0e4', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <PieChart size={22} color="#fbbf24" /> Demand vs Supply Ratio
        </h2>
        <p style={{ fontSize: 13, color: '#6a5a5d', marginTop: 4 }}>
          Live comparison of currently available inventory versus active unmet pending requests.
        </p>
      </div>

      <div style={{ background: '#0f0a0b', border: '1px solid #1e1214', borderRadius: 16, padding: '32px' }}>
        <div style={{ height: 500, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={groupedData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e1a1e" vertical={false} />
              <XAxis dataKey="group" stroke="#6a5a5d" tick={{ fill: '#e0d0d4', fontSize: 13, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#6a5a5d" tick={{ fill: '#6a5a5d', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: '#140c0e' }}
                contentStyle={{ background: '#1a1012', border: '1px solid #2e1a1e', borderRadius: 8, color: '#f0e0e4' }}
              />
              <Legend wrapperStyle={{ paddingTop: 20, fontSize: 13, color: '#c0b0b3' }} />
              <Bar dataKey="supply" name="Available Supply" fill="#4ade80" radius={[4, 4, 0, 0]} barSize={32} />
              <Bar dataKey="demand" name="Pending Demand" fill="#f87171" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DemandVsSupply;
