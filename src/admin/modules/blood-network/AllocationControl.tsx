import React, { useMemo } from 'react';
import { ArrowRightLeft, Droplet, ArrowRight, Building2, User } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { formatDate } from '../../services/exportService';

export const AllocationControl: React.FC = () => {
  const { nationalLedger, nationalInventory } = useAdminStore();

  // Find all pending requests
  const pendingRequests = useMemo(() => {
    return nationalLedger.filter(item => item.type === 'request' && item.status.toLowerCase() === 'pending')
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [nationalLedger]);

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200, fontFamily: 'Inter, sans-serif' }}>
      {/* ── Page header ── */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f0e0e4', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <ArrowRightLeft size={22} color="#60a5fa" /> Allocation Control
        </h2>
        <p style={{ fontSize: 13, color: '#6a5a5d', marginTop: 4 }}>
          Manually route available national blood inventory to pending critical or unmet hospital requests.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: 24 }}>
        
        {/* Pending Requests Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: '#c0b0b3', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Pending Requests ({pendingRequests.length})
          </h3>
          
          {pendingRequests.length === 0 ? (
            <div style={{ background: '#0f0a0b', border: '1px solid #1e1214', borderRadius: 12, padding: 40, textAlign: 'center' }}>
              <p style={{ margin: 0, color: '#6a5a5d', fontSize: 14 }}>No pending requests require manual allocation.</p>
            </div>
          ) : (
            pendingRequests.map(req => {
              const bgObj = nationalInventory.find(i => i.bloodGroup === req.bloodGroup);
              const availableUnits = bgObj ? bgObj.units : 0;
              const isFulfilled = availableUnits >= req.units;
              
              return (
                <div key={req.id} style={{
                  background: '#0f0a0b', border: '1px solid #1e1214', borderRadius: 12, padding: '20px 24px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 11, color: '#60a5fa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {req.rtid}
                      </p>
                      <h4 style={{ margin: '4px 0 0 0', fontSize: 18, fontWeight: 700, color: '#f0e0e4', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Droplet size={16} color="#f87171" fill="#f87171" />
                        {req.bloodGroup} <span style={{ fontSize: 14, color: '#7a6a6d', fontWeight: 500 }}>× {req.units} units</span>
                      </h4>
                    </div>
                    <span style={{ 
                      background: isFulfilled ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                      color: isFulfilled ? '#4ade80' : '#f87171',
                      padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600
                    }}>
                      {isFulfilled ? 'Inventory Available' : 'Shortage'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#a09094', fontSize: 13 }}>
                      <Building2 size={14} color="#6a5a5d" /> {req.hospitalName}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#a09094', fontSize: 13 }}>
                      <User size={14} color="#6a5a5d" /> {req.patientName || 'Confidential'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ margin: 0, fontSize: 12, color: '#6a5a5d' }}>
                      Requested: {formatDate(req.createdAt)} • {req.city}
                    </p>
                    <button
                      disabled={!isFulfilled}
                      style={{
                        background: isFulfilled ? '#60a5fa' : 'transparent',
                        color: isFulfilled ? '#0f172a' : '#c0b0b3',
                        border: isFulfilled ? 'none' : '1px solid #2e1a1e',
                        borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600,
                        cursor: isFulfilled ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', gap: 6, opacity: isFulfilled ? 1 : 0.5
                      }}
                    >
                      {isFulfilled ? 'Allocate Units' : 'Wait for Stock'}
                      {isFulfilled && <ArrowRight size={14} />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Global Stock Column */}
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: '#c0b0b3', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>
            National Reserve
          </h3>
          <div style={{ background: '#0f0a0b', border: '1px solid #1e1214', borderRadius: 12, padding: '20px 24px' }}>
            {nationalInventory.map(inv => (
              <div key={inv.bloodGroup} style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                padding: '12px 0', borderBottom: '1px solid #160d0f' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(248,113,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Droplet size={16} color="#f87171" fill="#f87171" />
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#e0d0d4' }}>{inv.bloodGroup}</span>
                </div>
                <span style={{ fontSize: 16, fontWeight: 700, color: inv.units === 0 ? '#6a5a5d' : '#f0e0e4' }}>
                  {inv.units} <span style={{ fontSize: 12, color: '#6a5a5d', fontWeight: 500 }}>units</span>
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AllocationControl;
