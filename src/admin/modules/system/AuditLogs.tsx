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
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <ScrollText size={22} color="#a78bfa" /> Audit Logs
          </h2>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
            Immutable chronological record of all actions performed by system administrators.
          </p>
        </div>
        <button 
          onClick={handleExport}
          disabled={filteredLogs.length === 0}
          style={{
            background: 'rgba(255,255,255,0.05)', color: '#f1f5f9',
            border: '1px solid #475569', borderRadius: 8, padding: '8px 16px',
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
        <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 16, top: 13 }} />
        <input 
          type="text" 
          placeholder="Search logs by action, admin email, or details..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            width: '100%', padding: '11px 16px 11px 42px',
            background: '#1e293b', border: '1px solid #475569', borderRadius: 8,
            color: '#ffffff', fontSize: 13, outline: 'none'
          }}
        />
      </div>

      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading audit logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>No audit logs found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Timestamp</th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Admin Identity</th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Action</th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s' }}>
                  <td style={{ padding: '16px 20px', fontSize: 12, color: '#e2e8f0', whiteSpace: 'nowrap' }}>
                    {formatDateTime(log.timestamp)}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: 13, color: '#f8fafc', fontWeight: 500 }}>
                    {log.adminEmail}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ 
                      background: 'rgba(255,255,255,0.05)', color: '#f1f5f9', padding: '4px 8px', 
                      borderRadius: 6, fontSize: 11, fontWeight: 600, fontFamily: 'monospace' 
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: 13, color: '#e2e8f0' }}>
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
