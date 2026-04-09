import React, { useMemo } from 'react';
import { ShieldAlert, AlertTriangle, AlertOctagon, CheckCircle } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';

export const FraudAlerts: React.FC = () => {
  const ledger = useAdminStore((s) => s.nationalLedger);

  // Synthesize fraud alerts from flagged items in ledger or generic rules
  const alerts = useMemo(() => {
    // Look for flagged ledger items
    const fromLedger = ledger
      .filter(item => item.status && item.status.toLowerCase().includes('flagged'))
      .map(item => ({
        id: item.id,
        rtid: item.rtid,
        type: 'Suspicious Activity',
        severity: 'high',
        description: `Flagged transaction detected. Entity: ${item.type === 'request' ? item.hospitalName : item.donorName} in ${item.city}`,
        timestamp: item.createdAt
      }));

    // Generate some heuristic rules for demo
    const rules = [];
    const highVolumeRequest = ledger.find(item => Number(item.units) > 8);
    if (highVolumeRequest) {
      rules.push({
        id: `heur-${highVolumeRequest.id || 'unknown'}`,
        rtid: highVolumeRequest.rtid || 'N/A',
        type: 'Anomalous Volume',
        severity: 'medium',
        description: `Unusually high volume request (${highVolumeRequest.units} units) from ${highVolumeRequest.hospitalName || 'Unknown'}`,
        timestamp: highVolumeRequest.createdAt
      });
    }

    return [...fromLedger, ...rules].sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
    });
  }, [ledger]);

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1000, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldAlert size={22} color="#f87171" /> Fraud Detection System
        </h2>
        <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
          Automated heuristic engine flagging suspicious transaction patterns on the RaktPort ledger.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {alerts.length === 0 ? (
          <div style={{ 
            background: '#1e293b', border: '1px solid #334155', borderRadius: 12, 
            padding: '40px 20px', textAlign: 'center' 
          }}>
            <CheckCircle size={32} color="#4ade80" style={{ margin: '0 auto 12px', opacity: 0.8 }} />
            <h3 style={{ fontSize: 16, color: '#ffffff', margin: 0 }}>System Secure</h3>
            <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
              No anomalous or fraudulent activities detected in the network.
            </p>
          </div>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} style={{
              background: '#1e293b', 
              border: `1px solid ${alert.severity === 'high' ? 'rgba(248,113,113,0.3)' : 'rgba(251,191,36,0.3)'}`,
              borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: 16
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: alert.severity === 'high' ? 'rgba(248,113,113,0.1)' : 'rgba(251,191,36,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {alert.severity === 'high' 
                  ? <AlertOctagon size={20} color="#f87171" />
                  : <AlertTriangle size={20} color="#fbbf24" />
                }
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#ffffff' }}>
                      {alert.type}
                    </h3>
                    <span style={{
                      background: '#1a1012', color: '#e2e8f0', fontFamily: 'monospace',
                      padding: '2px 8px', borderRadius: 6, fontSize: 11
                    }}>
                      {alert.rtid}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    {alert.timestamp && !isNaN(new Date(alert.timestamp).getTime()) 
                      ? new Date(alert.timestamp).toLocaleString() 
                      : 'Unknown Date'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#f1f5f9', lineHeight: 1.5 }}>
                  {alert.description}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FraudAlerts;
