import React, { useMemo } from 'react';
import { Calendar, UserX, CheckCircle2 } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';

export const EligibilityTracking: React.FC = () => {
  const { donors } = useAdminStore();

  const donorsWithHistory = useMemo(() => {
    return donors.filter(d => d.totalDonations > 0 && d.lastDonationDate).sort((a, b) => {
      // sort by ineligible first, then by date
      if (a.isEligible === b.isEligible) {
        const timeA = a.lastDonationDate ? new Date(a.lastDonationDate).getTime() : 0;
        const timeB = b.lastDonationDate ? new Date(b.lastDonationDate).getTime() : 0;
        return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
      }
      return a.isEligible ? 1 : -1;
    });
  }, [donors]);

  // Calculate days since last donation
  const getDaysSince = (date?: string | null) => {
    if (!date) return 0;
    const diffTime = Math.abs(new Date().getTime() - new Date(date).getTime());
    if (isNaN(diffTime)) return 0;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200, fontFamily: 'Inter, sans-serif' }}>
      {/* ── Page header ── */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Calendar size={22} color="#60a5fa" /> Eligibility Tracking
        </h2>
        <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
          Monitor the 90-day biological recovery window for recent donors to ensure safety compliance.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {donorsWithHistory.map(donor => {
          const daysSince = getDaysSince(donor.lastDonationDate);
          const daysRemaining = Math.max(90 - daysSince, 0);
          const bg = donor.isEligible ? 'rgba(74,222,128,0.05)' : 'rgba(248,113,113,0.05)';
          const border = donor.isEligible ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)';

          return (
            <div key={donor.id} style={{ 
              background: '#1e293b', border: `1px solid ${border}`, borderRadius: 12, padding: '20px',
              position: 'relative', overflow: 'hidden'
            }}>
              {/* Progress bar background for ineligible */}
              {!donor.isEligible && (
                 <div style={{ 
                   position: 'absolute', bottom: 0, left: 0, height: 4, background: '#f87171',
                   width: `${(daysSince / 90) * 100}%`, transition: 'width 1s'
                 }} />
              )}

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#ffffff' }}>{donor.name}</h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: 12, color: '#e2e8f0' }}>{donor.phone}</p>
                </div>
                <div style={{ 
                  width: 32, height: 32, borderRadius: 8, background: '#1a1012', border: '1px solid #475569',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#f8fafc', fontSize: 12, fontWeight: 800
                }}>
                  {donor.bloodGroup}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: bg, padding: '12px', borderRadius: 8 }}>
                {donor.isEligible ? (
                  <>
                    <CheckCircle2 size={24} color="#4ade80" />
                    <div>
                      <p style={{ margin: 0, color: '#4ade80', fontSize: 13, fontWeight: 700 }}>Eligible to Donate</p>
                      <p style={{ margin: '2px 0 0 0', color: '#94a3b8', fontSize: 11 }}>Recovered &gt; 90 days</p>
                    </div>
                  </>
                ) : (
                  <>
                    <UserX size={24} color="#f87171" />
                    <div>
                      <p style={{ margin: 0, color: '#f87171', fontSize: 13, fontWeight: 700 }}>In Recovery Phase</p>
                      <p style={{ margin: '2px 0 0 0', color: '#e2e8f0', fontSize: 11 }}>
                        {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining until eligible
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {donorsWithHistory.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: '#94a3b8', background: '#1e293b', border: '1px solid #334155', borderRadius: 12 }}>
            No donation history available to track eligibility.
          </div>
        )}
      </div>
    </div>
  );
};

export default EligibilityTracking;
