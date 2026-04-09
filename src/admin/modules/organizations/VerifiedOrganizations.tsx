import React, { useMemo, useState } from 'react';
import { Building2, Search, Mail, MapPin, FileText, Phone, Filter, CheckCircle2, Download, Droplet } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { formatDate, downloadCSV, downloadPDF } from '../../services/exportService';

export const VerifiedOrganizations: React.FC = () => {
  const { organizations, loading } = useAdminStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'hospital' | 'bloodbank'>('all');

  const verifiedOrgs = useMemo(() => {
    let list = organizations.filter(o => o.status === 'verified');
    if (filterType !== 'all') {
      list = list.filter(o => o.type === filterType);
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(o => 
        o.name.toLowerCase().includes(q) || 
        o.email.toLowerCase().includes(q) || 
        o.city.toLowerCase().includes(q) ||
        o.registrationNumber.toLowerCase().includes(q)
      );
    }
    return list;
  }, [organizations, filterType, searchTerm]);

  const getExportData = () => {
    return verifiedOrgs.map(o => ({
      Name: o.name,
      Type: o.type,
      Email: o.email,
      Phone: o.phone,
      City: o.city,
      State: o.state,
      License: o.registrationNumber,
      VerifiedAt: formatDate(o.verifiedAt)
    }));
  };

  const handleExportCSV = () => {
    downloadCSV(getExportData(), 'verified_organizations');
  };

  const handleExportPDF = () => {
    downloadPDF(getExportData(), 'verified_organizations', 'Verified Organizations Report');
  };

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200 }}>
      {/* ── Page header ── */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', margin: 0 }}>
            Verified Organizations
          </h2>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
            Manage approved Hospitals and Blood Banks currently active in the RaktPort network.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            onClick={handleExportCSV}
            disabled={verifiedOrgs.length === 0}
            style={{
              background: 'rgba(255,255,255,0.05)', color: '#f1f5f9',
              border: '1px solid #475569', borderRadius: 8, padding: '8px 16px',
              fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif',
              cursor: verifiedOrgs.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, opacity: verifiedOrgs.length === 0 ? 0.5 : 1
            }}
          >
            <Download size={14} /> CSV
          </button>
          <button 
            onClick={handleExportPDF}
            disabled={verifiedOrgs.length === 0}
            style={{
              background: 'rgba(37,99,235,0.1)', color: '#2563eb',
              border: '1px solid rgba(37,99,235,0.2)', borderRadius: 8, padding: '8px 16px',
              fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif',
              cursor: verifiedOrgs.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, opacity: verifiedOrgs.length === 0 ? 0.5 : 1
            }}
          >
            <FileText size={14} /> PDF
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 280 }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 16, top: 13 }} />
          <input 
            type="text" 
            placeholder="Search by name, email, city, or license..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '11px 16px 11px 42px',
              background: '#1e293b',
              border: '1px solid #475569',
              borderRadius: 8,
              color: '#ffffff',
              fontSize: 13,
              fontFamily: 'Inter, sans-serif',
              outline: 'none'
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={16} color="#94a3b8" />
          <select 
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
            style={{
              padding: '11px 16px',
              background: '#1e293b',
              border: '1px solid #475569',
              borderRadius: 8,
              color: '#ffffff',
              fontSize: 13,
              fontFamily: 'Inter, sans-serif',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Types</option>
            <option value="hospital">Hospitals Only</option>
            <option value="bloodbank">Blood Banks Only</option>
          </select>
        </div>
      </div>

      {/* ── List ── */}
      {loading ? (
        <p style={{ color: '#94a3b8', fontSize: 14 }}>Loading verified organizations...</p>
      ) : verifiedOrgs.length === 0 ? (
        <div style={{ 
          background: '#1e293b', border: '1px solid #334155', borderRadius: 12, 
          padding: '60px 20px', textAlign: 'center' 
        }}>
          <Building2 size={32} color="#94a3b8" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <h3 style={{ fontSize: 16, color: '#ffffff', margin: 0 }}>No Organizations Found</h3>
          <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
            {searchTerm || filterType !== 'all' ? 'Try adjusting your search filters.' : 'There are no verified organizations yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {verifiedOrgs.map(org => (
            <div key={org.id} style={{
              background: '#1e293b', 
              border: '1px solid #334155',
              borderRadius: 12,
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 24,
              transition: 'border-color 0.2s'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flex: 1, minWidth: 0 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, 
                  background: org.type === 'hospital' ? 'rgba(96,165,250,0.1)' : 'rgba(244,114,182,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {org.type === 'hospital' ? (
                    <Building2 size={24} color="#60a5fa" />
                  ) : (
                    <Droplet size={24} color="#60a5fa" />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#ffffff' }}>
                      {org.name}
                    </h3>
                    <span style={{
                      background: 'rgba(74,222,128,0.1)', color: '#4ade80',
                      padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: 0.5
                    }}>
                      Verified {org.type === 'hospital' ? 'Hospital' : 'Blood Bank'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Mail size={13} color="#94a3b8" /> {org.email}
                    </p>
                    <p style={{ margin: 0, fontSize: 13, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={13} color="#94a3b8" /> {org.phone || 'N/A'}
                    </p>
                    <p style={{ margin: 0, fontSize: 13, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={13} color="#94a3b8" /> {org.address}
                    </p>
                    <p style={{ margin: 0, fontSize: 13, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={13} color="#94a3b8" /> License: {org.registrationNumber}
                    </p>
                  </div>
                  
                  {org.verifiedAt && (
                    <p style={{ margin: '12px 0 0 0', fontSize: 11, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={12} />
                      Verified on {formatDate(org.verifiedAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VerifiedOrganizations;
