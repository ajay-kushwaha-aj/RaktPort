import React from 'react';
import { ActivitySquare, Database, Server, Zap } from 'lucide-react';

export const SystemHealth: React.FC = () => {
  return (
    <div style={{ padding: '32px 36px', maxWidth: 1000, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f0e0e4', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <ActivitySquare size={22} color="#4ade80" /> System Health
        </h2>
        <p style={{ fontSize: 13, color: '#6a5a5d', marginTop: 4 }}>
          Live telemetry and operational status of platform microservices.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {/* Firebase DB */}
        <div style={{ background: '#0f0a0b', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 12, padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(74,222,128,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Database size={24} color="#4ade80" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f0e0e4' }}>Firestore Database</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#a09094' }}>Latency: 42ms • Status: Operational</p>
          </div>
        </div>

        {/* Global Edge Network */}
        <div style={{ background: '#0f0a0b', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 12, padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(74,222,128,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Server size={24} color="#4ade80" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f0e0e4' }}>Edge Network</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#a09094' }}>Uptime: 99.99% • Nodes: 12 Active</p>
          </div>
        </div>

        {/* Real-time Subscriptions */}
        <div style={{ background: '#0f0a0b', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 12, padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(74,222,128,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap size={24} color="#4ade80" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#f0e0e4' }}>Socket / Listeners</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#a09094' }}>Connected • Active Subscriptions: 4</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;
