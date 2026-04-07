import React, { useState } from 'react';
import { ScrollText, Search, Download } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { formatDateTime, downloadCSV } from '../../services/exportService';

export const AuditLogs: React.FC = () => {
  const { auditLog, loading } = useAdminStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = auditLog.filter(log => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return log.action.toLowerCase().includes(q) || 
           log.adminEmail.toLowerCase().includes(q) ||
           log.details.toLowerCase().includes(q);
  });

  const handleExport = () => {
    downloadCSV(
      filteredLogs.map(log => ({
        Admin: log.adminEmail,
        Action: log.action,
        Details: log.details,
        Timestamp: formatDateTime(log.timestamp)
      })),
      'admin_audit_logs'
    );
  };

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1000, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f0e0e4', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <ScrollText size={22} color="#a78bfa" /> Audit Logs
          </h2>
          <p style={{ fontSize: 13, color: '#6a5a5d', marginTop: 4 }}>
            Immutable chronological record of all actions performed by system administrators.
          </p>
        </div>
        <button 
          onClick={handleExport}
          disabled={filteredLogs.length === 0}
          style={{
            background: 'rgba(255,255,255,0.05)', color: '#c0b0b3',
            border: '1px solid #2e1a1e', borderRadius: 8, padding: '8px 16px',
            fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif',
            cursor: filteredLogs.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, opacity: filteredLogs.length === 0 ? 0.5 : 1
          }}
        >
          <Download size={14} /> Export Logs
        </button>
      </div>

      {/* ── Search Bar ── */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <Search size={16} color="#6a5a5d" style={{ position: 'absolute', left: 16, top: 13 }} />
        <input 
          type="text" 
          placeholder="Search logs by action, admin email, or details..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            width: '100%', padding: '11px 16px 11px 42px',
            background: '#0f0a0b', border: '1px solid #2e1a1e', borderRadius: 8,
            color: '#f0e0e4', fontSize: 13, outline: 'none'
          }}
        />
      </div>

      <div style={{ background: '#0f0a0b', border: '1px solid #1e1214', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#6a5a5d' }}>Loading audit logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#6a5a5d' }}>No audit logs found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#140c0e', borderBottom: '1px solid #1e1214' }}>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 600, color: '#6a5a5d', textTransform: 'uppercase', letterSpacing: 0.5 }}>Timestamp</th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 600, color: '#6a5a5d', textTransform: 'uppercase', letterSpacing: 0.5 }}>Admin Identity</th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 600, color: '#6a5a5d', textTransform: 'uppercase', letterSpacing: 0.5 }}>Action</th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 600, color: '#6a5a5d', textTransform: 'uppercase', letterSpacing: 0.5 }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s' }}>
                  <td style={{ padding: '16px 20px', fontSize: 12, color: '#a09094', whiteSpace: 'nowrap' }}>
                    {formatDateTime(log.timestamp)}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: 13, color: '#e0d0d4', fontWeight: 500 }}>
                    {log.adminEmail}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ 
                      background: 'rgba(255,255,255,0.05)', color: '#c0b0b3', padding: '4px 8px', 
                      borderRadius: 6, fontSize: 11, fontWeight: 600, fontFamily: 'monospace' 
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: 13, color: '#a09094' }}>
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
