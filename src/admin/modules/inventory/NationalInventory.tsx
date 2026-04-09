import React, { useMemo } from 'react';
import { Package, Droplet, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';

export const NationalInventory: React.FC = () => {
  const { nationalInventory } = useAdminStore();

  const totalUnits = useMemo(() => 
    nationalInventory.reduce((acc, curr) => acc + curr.units, 0),
  [nationalInventory]);

  const maxUnits = useMemo(() => 
    Math.max(...nationalInventory.map(i => i.units), 100), // at least 100 as denominator
  [nationalInventory]);

  const getLevel = (units: number) => {
    if (units >= 50) return { label: 'Excellent', color: '#4ade80', bg: 'rgba(74,222,128,0.1)' };
    if (units >= 20) return { label: 'Good', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' };
    if (units >= 10) return { label: 'Low', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' };
    return { label: 'Critical', color: '#f87171', bg: 'rgba(248,113,113,0.1)' };
  };

  const criticalGroups = nationalInventory.filter(i => i.units < 10);

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200, fontFamily: 'Inter, sans-serif' }}>
      {/* ── Page header ── */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Package size={22} color="#fbbf24" /> National Blood Inventory
        </h2>
        <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
          Live stock levels aggregated from all verified blood banks and hospitals across the country.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 24, alignItems: 'start' }}>
        
        {/* Inventory Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {nationalInventory.map(item => {
            const level = getLevel(item.units);
            const pct = Math.min((item.units / maxUnits) * 100, 100);
            
            return (
              <div key={item.bloodGroup} style={{
                background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: '24px 28px',
                transition: 'border-color 0.2s', position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Droplet fill={level.color} color={level.color} size={20} />
                    <span style={{ fontSize: 24, fontWeight: 800, color: '#ffffff' }}>{item.bloodGroup}</span>
                  </div>
                  <span style={{ 
                    background: level.bg, color: level.color, padding: '4px 10px', 
                    borderRadius: 8, fontSize: 11, fontWeight: 700, letterSpacing: 0.5 
                  }}>
                    {level.label}
                  </span>
                </div>
                
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <p style={{ margin: 0, fontSize: 36, fontWeight: 800, color: '#f8fafc' }}>{item.units}</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>AVAILABLE UNITS</p>
                </div>
                
                <div style={{ width: '100%', background: '#1a1012', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', background: level.color, width: `${pct}%`, transition: 'width 0.5s ease-out' 
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Global Summary Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Total */}
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '24px 28px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Total National Stock
            </p>
            <p style={{ margin: '12px 0 0 0', fontSize: 42, fontWeight: 800, color: '#ffffff' }}>
              {totalUnits}
            </p>
          </div>

          {/* Alerts */}
          {criticalGroups.length > 0 && (
            <div style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: '24px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f87171', marginBottom: 12 }}>
                <AlertTriangle size={18} />
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Critical Shortages</h3>
              </div>
              <p style={{ margin: '0 0 16px 0', fontSize: 13, color: '#f1f5f9', lineHeight: 1.5 }}>
                The following blood groups have dropped below minimum safe thresholds:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {criticalGroups.map(c => (
                  <span key={c.bloodGroup} style={{ 
                    background: '#f87171', color: '#1e293b', padding: '4px 12px', 
                    borderRadius: 6, fontSize: 13, fontWeight: 800 
                  }}>
                    {c.bloodGroup} ({c.units})
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Stock Trends
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <TrendingUp size={16} color="#4ade80" />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#f8fafc' }}>Incoming donations</p>
                <p style={{ margin: 0, fontSize: 11, color: '#e2e8f0' }}>+5% this week</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <TrendingDown size={16} color="#f87171" />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#f8fafc' }}>Outgoing requests</p>
                <p style={{ margin: 0, fontSize: 11, color: '#e2e8f0' }}>-2% this week</p>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default NationalInventory;
