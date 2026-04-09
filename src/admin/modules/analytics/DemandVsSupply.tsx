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
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <PieChart size={22} color="#fbbf24" /> Demand vs Supply Ratio
        </h2>
        <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
          Live comparison of currently available inventory versus active unmet pending requests.
        </p>
      </div>

      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: '32px' }}>
        <div style={{ height: 500, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={groupedData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" vertical={false} />
              <XAxis dataKey="group" stroke="#94a3b8" tick={{ fill: '#f8fafc', fontSize: 13, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: '#1e293b' }}
                contentStyle={{ background: '#1a1012', border: '1px solid #475569', borderRadius: 8, color: '#ffffff' }}
              />
              <Legend wrapperStyle={{ paddingTop: 20, fontSize: 13, color: '#f1f5f9' }} />
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
