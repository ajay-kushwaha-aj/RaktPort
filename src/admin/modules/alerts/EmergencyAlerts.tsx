import React, { useMemo } from 'react';
import { Siren, MapPin, Clock } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';

export const EmergencyAlerts: React.FC = () => {
  const { nationalLedger } = useAdminStore();

  const emergencyRequests = useMemo(() => {
    return nationalLedger.filter(item => 
      item.type === 'request' && 
      item.status.toLowerCase() === 'pending' &&
      item.units >= 3 // Heuristic: >= 3 units is considered an emergency for admin routing
    ).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [nationalLedger]);

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1000, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f87171', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Siren size={22} color="#f87171" className="animate-pulse" /> Emergency SOS Queue
        </h2>
        <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
          Live feed of critical mass-casualty or high-volume blood requests requiring immediate geographic allocation overrides.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {emergencyRequests.length === 0 ? (
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '40px 20px', textAlign: 'center' }}>
            <Siren size={32} color="#94a3b8" style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <h3 style={{ fontSize: 16, color: '#f8fafc', margin: 0 }}>No Critical Emergencies</h3>
            <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
              The national grid is stable. No pending requests meet the critical high-volume threshold.
            </p>
          </div>
        ) : (
          emergencyRequests.map(req => (
            <div key={req.id} style={{
              background: 'linear-gradient(90deg, rgba(248,113,113,0.05) 0%, #1e293b 100%)', 
              border: '1px solid rgba(248,113,113,0.3)', borderLeft: '4px solid #f87171',
              borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ 
                    background: '#f87171', color: '#fff', padding: '2px 8px', 
                    borderRadius: 6, fontSize: 13, fontWeight: 800 
                  }}>
                    {req.bloodGroup}
                  </span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#ffffff' }}>
                    {req.units} Units Required
                  </span>
                </div>
                
                <h4 style={{ margin: '0 0 12px 0', fontSize: 15, color: '#f8fafc', fontWeight: 600 }}>
                  {req.hospitalName}
                </h4>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#e2e8f0' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {req.city}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> Requested: {new Date(req.createdAt || 0).toLocaleTimeString()}</span>
                  <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>{req.rtid}</span>
                </div>
              </div>

              <button style={{
                background: '#f87171', color: '#1e293b', border: 'none', borderRadius: 8,
                padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer'
              }}>
                Initiate Override
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EmergencyAlerts;
