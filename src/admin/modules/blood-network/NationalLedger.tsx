import React, { useMemo, useState } from 'react';
import { Database, Search, Filter, Download, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { formatDate, formatDateTime, downloadCSV } from '../../services/exportService';

export const NationalLedger: React.FC = () => {
  const { nationalLedger, loading } = useAdminStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredLedger = useMemo(() => {
    let list = [...nationalLedger];
    
    if (filterType !== 'all') {
      list = list.filter(item => item.type === filterType);
    }
    
    if (filterStatus !== 'all') {
      list = list.filter(item => item.status.toLowerCase() === filterStatus.toLowerCase());
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(item => 
        item.rtid.toLowerCase().includes(q) ||
        (item.patientName && item.patientName.toLowerCase().includes(q)) ||
        (item.donorName && item.donorName.toLowerCase().includes(q)) ||
        (item.hospitalName && item.hospitalName.toLowerCase().includes(q)) ||
        item.bloodGroup.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q)
      );
    }
    
    return list;
  }, [nationalLedger, filterType, filterStatus, searchTerm]);

  const handleExport = () => {
    downloadCSV(
      filteredLedger.map(item => ({
        RTID: item.rtid,
        Type: item.type,
        BloodGroup: item.bloodGroup,
        Units: item.units,
        Status: item.status,
        City: item.city,
        Created: formatDateTime(item.createdAt),
        Entity: item.type === 'request' ? item.hospitalName : item.donorName
      })),
      'national_ledger'
    );
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('pending') || s.includes('processing')) return { bg: 'rgba(251,191,36,0.1)', text: '#fbbf24', border: 'rgba(251,191,36,0.2)' };
    if (s.includes('completed') || s.includes('available') || s.includes('donated')) return { bg: 'rgba(74,222,128,0.1)', text: '#4ade80', border: 'rgba(74,222,128,0.2)' };
    if (s.includes('redeem')) return { bg: 'rgba(96,165,250,0.1)', text: '#60a5fa', border: 'rgba(96,165,250,0.2)' };
    if (s.includes('flagged') || s.includes('reject') || s.includes('cancel')) return { bg: 'rgba(248,113,113,0.1)', text: '#f87171', border: 'rgba(248,113,113,0.2)' };
    return { bg: 'rgba(255,255,255,0.05)', text: '#e2e8f0', border: 'rgba(255,255,255,0.1)' };
  };

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1400, fontFamily: 'Inter, sans-serif' }}>
      {/* ── Page header ── */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Database size={22} color="#a78bfa" /> National Ledger
          </h2>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
            Immutable record of all blood requests and donations across the platform.
          </p>
        </div>
        <button 
          onClick={handleExport}
          disabled={filteredLedger.length === 0}
          style={{
            background: 'rgba(255,255,255,0.05)', color: '#f1f5f9',
            border: '1px solid #475569', borderRadius: 8, padding: '8px 16px',
            fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif',
            cursor: filteredLedger.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, opacity: filteredLedger.length === 0 ? 0.5 : 1
          }}
        >
          <Download size={14} /> Export
        </button>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 280 }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 16, top: 13 }} />
          <input 
            type="text" 
            placeholder="Search RTID, patient, hospital, group..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '11px 16px 11px 42px',
              background: '#1e293b', border: '1px solid #475569', borderRadius: 8,
              color: '#ffffff', fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none'
            }}
          />
        </div>
        <select 
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{
            padding: '11px 16px', background: '#1e293b', border: '1px solid #475569',
            borderRadius: 8, color: '#f1f5f9', fontSize: 13, outline: 'none', cursor: 'pointer'
          }}
        >
          <option value="all">All Transactions</option>
          <option value="request">Requests Only</option>
          <option value="donation">Donations Only</option>
        </select>
        <select 
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{
            padding: '11px 16px', background: '#1e293b', border: '1px solid #475569',
            borderRadius: 8, color: '#f1f5f9', fontSize: 13, outline: 'none', cursor: 'pointer'
          }}
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="available">Available / Completed</option>
          <option value="redeemed">Redeemed</option>
          <option value="flagged">Flagged / Rejected</option>
        </select>
      </div>

      {/* ── Ledger Table ── */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading ledger data...</div>
        ) : filteredLedger.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>No records found</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Type / RTID</th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Blood Group</th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Entity</th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Location</th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Date & Time</th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLedger.map(item => {
                const isReq = item.type === 'request';
                const sColor = getStatusColor(item.status);
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ 
                          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                          background: isReq ? 'rgba(96,165,250,0.1)' : 'rgba(74,222,128,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {isReq ? <ArrowUpRight size={16} color="#60a5fa" /> : <ArrowDownRight size={16} color="#4ade80" />}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: 11, color: isReq ? '#60a5fa' : '#4ade80', fontWeight: 600 }}>
                            {isReq ? 'REQUEST' : 'DONATION'}
                          </p>
                          <p style={{ margin: '2px 0 0 0', fontSize: 13, color: '#ffffff', fontWeight: 600, fontFamily: 'monospace' }}>
                            {item.rtid}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ 
                        display: 'inline-block', padding: '4px 8px', borderRadius: 6,
                        background: '#1a1012', border: '1px solid #475569',
                        color: '#ffffff', fontSize: 12, fontWeight: 700 
                      }}>
                        {item.bloodGroup} <span style={{ color: '#94a3b8', fontWeight: 400 }}>× {item.units}</span>
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <p style={{ margin: 0, fontSize: 13, color: '#f8fafc', fontWeight: 500 }}>
                        {isReq ? item.hospitalName : item.donorName}
                      </p>
                      {item.patientName && (
                        <p style={{ margin: '2px 0 0 0', fontSize: 11, color: '#cbd5e1' }}>
                          For: {item.patientName}
                        </p>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: 13, color: '#e2e8f0' }}>
                      {item.city}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <p style={{ margin: 0, fontSize: 13, color: '#f1f5f9' }}>
                        {formatDate(item.createdAt)}
                      </p>
                      <p style={{ margin: '2px 0 0 0', fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={10} />
                        {new Date(item.createdAt || 0).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ 
                        background: sColor.bg, color: sColor.text, border: `1px solid ${sColor.border}`,
                        padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, letterSpacing: 0.3
                      }}>
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default NationalLedger;
