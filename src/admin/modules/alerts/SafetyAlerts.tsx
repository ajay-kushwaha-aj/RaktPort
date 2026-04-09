import React from 'react';
import { TrafficCone, CheckCircle } from 'lucide-react';

export const SafetyAlerts: React.FC = () => {
  return (
    <div style={{ padding: '32px 36px', maxWidth: 1000, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <TrafficCone size={22} color="#fbbf24" /> System Safety & Integrity
        </h2>
        <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
          Platform infrastructure and SLA integrity warnings.
        </p>
      </div>

      <div style={{ 
        background: '#1e293b', border: '1px solid #334155', borderRadius: 12, 
        padding: '40px 20px', textAlign: 'center' 
      }}>
        <CheckCircle size={32} color="#4ade80" style={{ margin: '0 auto 12px', opacity: 0.8 }} />
        <h3 style={{ fontSize: 16, color: '#ffffff', margin: 0 }}>All Systems Nominal</h3>
        <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
          No infrastructure errors, API degradation, or SLA breaches detected at this time.
        </p>
      </div>
    </div>
  );
};

export default SafetyAlerts;
