import React, { useState } from 'react';
import { Shield, Search, ArrowRight, Activity, CheckCircle2, Clock, Database } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { lookupRTID, RTIDRecord } from '../../services/rtidService';
import { formatDateTime } from '../../services/exportService';

export const RTIDTracking: React.FC = () => {
  const { nationalLedger } = useAdminStore();
  const [searchInput, setSearchInput] = useState('');
  const [result, setResult] = useState<RTIDRecord | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [encMigrating, setEncMigrating] = useState(false);

  /* ── PII Encryption Migration (DPDP Act 2023) ── */
  const handleEncryptionMigration = async () => {
    if (!window.confirm(
      "⚠️ DPDP Encryption Migration\n\n" +
      "This will encrypt ALL plaintext Aadhaar and mobile fields in:\n" +
      "• users collection\n" +
      "• bloodRequests collection\n\n" +
      "Already encrypted values (enc:...) will be skipped.\n\nProceed?"
    )) return;
    setEncMigrating(true);
    try {
      const { collection, getDocs, writeBatch, doc } = await import('firebase/firestore');
      const { db } = await import('../../../firebase');
      const { encryptField, isEncrypted, hashField } = await import('../../../lib/crypto');
      
      let totalEncrypted = 0;
      
      // 1. Encrypt users collection (aadhar, mobile)
      const userSnap = await getDocs(collection(db, 'users'));
      const userBatch = writeBatch(db);
      let userCount = 0;
      
      for (const d of userSnap.docs) {
        const data = d.data();
        const updates: Record<string, string> = {};
        
        if (data.aadhar && !isEncrypted(data.aadhar)) {
          updates.aadhar = await encryptField(data.aadhar);
        }
        if (data.mobile && !isEncrypted(data.mobile)) {
          // Store hash for phone lookup before encrypting
          updates.mobileHash = await hashField(data.mobile);
          updates.mobile = await encryptField(data.mobile);
        }
        
        if (Object.keys(updates).length > 0) {
          userBatch.update(doc(db, 'users', d.id), updates);
          userCount++;
        }
      }
      
      if (userCount > 0) {
        await userBatch.commit();
        totalEncrypted += userCount;
      }
      
      // 2. Encrypt bloodRequests collection (patientAadhaar, patientMobile)
      const reqSnap = await getDocs(collection(db, 'bloodRequests'));
      const reqBatch = writeBatch(db);
      let reqCount = 0;
      
      for (const d of reqSnap.docs) {
        const data = d.data();
        const updates: Record<string, string> = {};
        
        if (data.patientAadhaar && !isEncrypted(data.patientAadhaar)) {
          updates.patientAadhaar = await encryptField(data.patientAadhaar);
        }
        if (data.patientMobile && !isEncrypted(data.patientMobile)) {
          updates.patientMobile = await encryptField(data.patientMobile);
        }
        
        if (Object.keys(updates).length > 0) {
          reqBatch.update(doc(db, 'bloodRequests', d.id), updates);
          reqCount++;
        }
      }
      
      if (reqCount > 0) {
        await reqBatch.commit();
        totalEncrypted += reqCount;
      }
      
      if (totalEncrypted > 0) {
        alert(`✅ Encrypted PII in ${totalEncrypted} documents!\n\n• ${userCount} user record(s)\n• ${reqCount} blood request(s)`);
      } else {
        alert("All records are already encrypted. No migration needed.");
      }
    } catch (err) {
      console.error('[Encryption Migration]', err);
      alert("Encryption migration failed. See console for details.");
    } finally {
      setEncMigrating(false);
    }
  };

  const handleMigration = async () => {
    if (!window.confirm("Are you sure you want to migrate all R-RTID and H-RTID records to RH-RTID? This will modify the database.")) return;
    setMigrating(true);
    try {
      const { collection, getDocs, writeBatch, doc } = await import('firebase/firestore');
      const { db } = await import('../../../firebase');
      const bReqs = await getDocs(collection(db, 'bloodRequests'));
      const dons = await getDocs(collection(db, 'donations'));
      
      const batch = writeBatch(db);
      let count = 0;
      
      const migrateStr = (s: string) => {
        if (!s) return s;
        if (s.startsWith('R-RTID')) return s.replace(/^R-RTID/, 'RH-RTID');
        if (s.startsWith('H-RTID')) return s.replace(/^H-RTID/, 'RH-RTID');
        return s;
      };

      bReqs.forEach(d => {
        const data = d.data();
        let newId = d.id;
        if (newId.startsWith('R-RTID') || newId.startsWith('H-RTID')) {
          newId = migrateStr(newId);
          const newRef = doc(db, 'bloodRequests', newId);
          const updatedData = { ...data };
          if (updatedData.rtid) updatedData.rtid = migrateStr(updatedData.rtid);
          if (updatedData.linkedRTID) updatedData.linkedRTID = migrateStr(updatedData.linkedRTID);
          batch.set(newRef, updatedData);
          batch.delete(d.ref);
          count++;
        } else {
          let updates: any = {};
          let changed = false;
          if (data.rtid && (data.rtid.startsWith('R-RTID') || data.rtid.startsWith('H-RTID'))) {
            updates.rtid = migrateStr(data.rtid); changed = true;
          }
          if (data.linkedRTID && (data.linkedRTID.startsWith('R-RTID') || data.linkedRTID.startsWith('H-RTID'))) {
            updates.linkedRTID = migrateStr(data.linkedRTID); changed = true;
          }
          if (changed) { batch.update(d.ref, updates); count++; }
        }
      });

      dons.forEach(d => {
        const data = d.data();
        let updates: any = {};
        let changed = false;
        
        if (data.linkedRrtid && (data.linkedRrtid.startsWith('R-RTID') || data.linkedRrtid.startsWith('H-RTID'))) {
          updates.linkedRrtid = migrateStr(data.linkedRrtid); changed = true;
        }
        if (data.rRtid && (data.rRtid.startsWith('R-RTID') || data.rRtid.startsWith('H-RTID'))) {
          updates.rRtid = migrateStr(data.rRtid); changed = true;
        }
        if (data.donationType === 'R-RTID-Linked Donation') {
          updates.donationType = 'RH/RU-RTID-Linked Donation'; changed = true;
        }
        if (changed) { batch.update(d.ref, updates); count++; }
      });
      
      if (count > 0) {
        await batch.commit();
        alert(`Migrated ${count} records successfully!`);
      } else {
        alert("No records needed migration.");
      }
    } catch (err) {
      console.error(err);
      alert("Migration failed. See console.");
    } finally {
      setMigrating(false);
    }
  };

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={22} color="#4ade80" /> RTID Tracking System
          </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button 
            onClick={handleEncryptionMigration} 
            disabled={encMigrating}
            style={{
              background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px',
              fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: encMigrating ? 'wait' : 'pointer'
            }}
          >
            <Shield size={15} /> {encMigrating ? 'Encrypting PII...' : '🔒 Encrypt PII (DPDP)'}
          </button>
          <button 
            onClick={handleMigration} 
            disabled={migrating}
            style={{
              background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px',
              fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: migrating ? 'wait' : 'pointer'
            }}
          >
            <Database size={15} /> {migrating ? 'Migrating DB...' : 'Run DB Migration'}
          </button>
        </div>
        </div>
        <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
          Enter a RaktPort Tracking ID (RTID) to instantly view its global lifecycle and current status.
        </p>
      </div>

      {/* ── Search Bar ── */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: 18, top: 15 }} />
          <input
            type="text"
            placeholder="e.g. D-RTID-010426-A1234 or RH/RU-RTID-010426-I1234"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            style={{
              width: '100%', padding: '14px 16px 14px 48px',
              background: '#1e293b', border: '1px solid #475569', borderRadius: 12,
              color: '#ffffff', fontSize: 15, fontFamily: 'monospace', outline: 'none'
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
          background: '#1e293b', border: '1px solid #334155', borderRadius: 16,
          padding: 40, textAlign: 'center'
        }}>
          <Activity size={32} color="#94a3b8" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <h3 style={{ fontSize: 16, color: '#f8fafc', margin: 0 }}>RTID Not Found</h3>
          <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
            We couldn't track an active record for "{searchInput}". Please verify the ID.
          </p>
        </div>
      )}

      {hasSearched && result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Header Card */}
          <div style={{
            background: '#1e293b', border: '1px solid rgba(74,222,128,0.2)',
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
                <h3 style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 700, color: '#ffffff', margin: '8px 0 0 0' }}>
                  {result.rtid}
                </h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#f87171' }}>{result.bloodGroup}</p>
                <p style={{ margin: '2px 0 0 0', fontSize: 13, color: '#cbd5e1' }}>{result.units} Unit(s)</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, paddingTop: 20, borderTop: '1px solid #334155' }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Origin</p>
                <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#f8fafc', fontWeight: 500 }}>
                  {result.type === 'request' ? result.hospitalName : result.donorName}
                </p>
                <p style={{ margin: '2px 0 0 0', fontSize: 12, color: '#e2e8f0' }}>{result.city}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Created Date</p>
                <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#f8fafc', fontWeight: 500 }}>
                  {formatDateTime(result.createdAt)}
                </p>
                <p style={{ margin: '2px 0 0 0', fontSize: 12, color: '#e2e8f0' }}>
                  Current Status: <strong style={{ color: '#ffffff' }}>{result.status}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Lifecycle Pipeline */}
          <div style={{
            background: '#1e293b', border: '1px solid #334155',
            borderRadius: 16, padding: '24px 32px'
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', margin: '0 0 24px 0' }}>
              Lifecycle Pipeline
            </h3>

            <div style={{ position: 'relative', marginLeft: 16 }}>
              {/* Vertical line constraint */}
              <div style={{ position: 'absolute', top: 10, bottom: 10, left: 11, width: 2, background: '#334155', zIndex: 0 }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative', zIndex: 1 }}>
                {(result.lifecycle || []).map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', background: step.completed ? '#4ade80' : '#334155',
                      border: step.completed ? 'none' : '2px solid #475569',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: -2
                    }}>
                      {step.completed && <CheckCircle2 size={14} color="#064e3b" strokeWidth={3} />}
                    </div>
                    <div style={{ flex: 1, opacity: step.completed ? 1 : 0.4 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: step.completed ? '#ffffff' : '#94a3b8' }}>
                        {step.label}
                      </p>
                      <p style={{ margin: '2px 0 0 0', fontSize: 12, color: step.completed ? '#e2e8f0' : '#64748b' }}>
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
