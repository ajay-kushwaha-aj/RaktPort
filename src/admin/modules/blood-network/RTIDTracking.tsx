import React, { useState } from 'react';
import { Shield, Search, ArrowRight, Activity, CheckCircle2, Clock } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { lookupRTID, RTIDRecord } from '../../services/rtidService';
import { formatDateTime } from '../../services/exportService';

export const RTIDTracking: React.FC = () => {
  const { nationalLedger } = useAdminStore();
  const [searchInput, setSearchInput] = useState('');
  const [result, setResult] = useState<RTIDRecord | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchInput.trim()) return;
    const r = lookupRTID(searchInput, nationalLedger as RTIDRecord[]); // We'll cast because the hook types it slightly differently, but attributes match.
    setResult(r);
    setHasSearched(true);
  };

  return (
    <div style={{ padding: '32px 36px', maxWidth: 900, fontFamily: 'Inter, sans-serif' }}>
      {/* ── Page header ── */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f0e0e4', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={22} color="#4ade80" /> RTID Tracking System
        </h2>
        <p style={{ fontSize: 13, color: '#6a5a5d', marginTop: 4 }}>
          Enter a RaktPort Tracking ID (RTID) to instantly view its global lifecycle and current status.
        </p>
      </div>

      {/* ── Search Bar ── */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} color="#6a5a5d" style={{ position: 'absolute', left: 18, top: 15 }} />
          <input
            type="text"
            placeholder="e.g. D-RTID-010426-A1234 or H-RTID-010426-I1234"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            style={{
              width: '100%', padding: '14px 16px 14px 48px',
              background: '#0f0a0b', border: '1px solid #2e1a1e', borderRadius: 12,
              color: '#f0e0e4', fontSize: 15, fontFamily: 'monospace', outline: 'none'
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            background: '#4ade80', color: '#064e3b',
            border: 'none', borderRadius: 12, padding: '0 24px',
            fontSize: 14, fontWeight: 700, fontFamily: 'Inter, sans-serif',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
          }}
        >
          Track RTID <ArrowRight size={16} />
        </button>
      </form>

      {/* ── Results ── */}
      {hasSearched && !result && (
        <div style={{
          background: '#0f0a0b', border: '1px solid #1e1214', borderRadius: 16,
          padding: 40, textAlign: 'center'
        }}>
          <Activity size={32} color="#6a5a5d" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <h3 style={{ fontSize: 16, color: '#e0d0d4', margin: 0 }}>RTID Not Found</h3>
          <p style={{ color: '#6a5a5d', fontSize: 13, marginTop: 4 }}>
            We couldn't track an active record for "{searchInput}". Please verify the ID.
          </p>
        </div>
      )}

      {hasSearched && result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Header Card */}
          <div style={{
            background: '#0f0a0b', border: '1px solid rgba(74,222,128,0.2)',
            borderRadius: 16, padding: '24px 32px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <span style={{
                  background: 'rgba(74,222,128,0.1)', color: '#4ade80',
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, letterSpacing: 0.5
                }}>
                  {result.type === 'request' ? 'BLOOD REQUEST' : 'BLOOD DONATION'}
                </span>
                <h3 style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 700, color: '#f0e0e4', margin: '8px 0 0 0' }}>
                  {result.rtid}
                </h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#f87171' }}>{result.bloodGroup}</p>
                <p style={{ margin: '2px 0 0 0', fontSize: 13, color: '#7a6a6d' }}>{result.units} Unit(s)</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, paddingTop: 20, borderTop: '1px solid #1e1214' }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: '#6a5a5d', textTransform: 'uppercase', letterSpacing: 0.5 }}>Origin</p>
                <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#e0d0d4', fontWeight: 500 }}>
                  {result.type === 'request' ? result.hospitalName : result.donorName}
                </p>
                <p style={{ margin: '2px 0 0 0', fontSize: 12, color: '#a09094' }}>{result.city}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: '#6a5a5d', textTransform: 'uppercase', letterSpacing: 0.5 }}>Created Date</p>
                <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#e0d0d4', fontWeight: 500 }}>
                  {formatDateTime(result.createdAt)}
                </p>
                <p style={{ margin: '2px 0 0 0', fontSize: 12, color: '#a09094' }}>
                  Current Status: <strong style={{ color: '#f0e0e4' }}>{result.status}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Lifecycle Pipeline */}
          <div style={{
            background: '#0f0a0b', border: '1px solid #1e1214',
            borderRadius: 16, padding: '24px 32px'
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#c0b0b3', margin: '0 0 24px 0' }}>
              Lifecycle Pipeline
            </h3>

            <div style={{ position: 'relative', marginLeft: 16 }}>
              {/* Vertical line constraint */}
              <div style={{ position: 'absolute', top: 10, bottom: 10, left: 11, width: 2, background: '#1e1214', zIndex: 0 }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative', zIndex: 1 }}>
                {(result.lifecycle || []).map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', background: step.completed ? '#4ade80' : '#1e1214',
                      border: step.completed ? 'none' : '2px solid #2e1a1e',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: -2
                    }}>
                      {step.completed && <CheckCircle2 size={14} color="#064e3b" strokeWidth={3} />}
                    </div>
                    <div style={{ flex: 1, opacity: step.completed ? 1 : 0.4 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: step.completed ? '#f0e0e4' : '#6a5a5d' }}>
                        {step.label}
                      </p>
                      <p style={{ margin: '2px 0 0 0', fontSize: 12, color: step.completed ? '#a09094' : '#4a3a3d' }}>
                        {step.completed ? 'Completed' : 'Pending'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default RTIDTracking;
