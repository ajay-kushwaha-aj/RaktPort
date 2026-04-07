import React, { useMemo, useState } from 'react';
import { Building2, CheckCircle, XCircle, Search, Mail, MapPin, FileText, Phone, Filter, Droplet, ExternalLink } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { verifyOrganization } from '../../services/adminDataService';
import { formatDate } from '../../services/exportService';
import Swal from 'sweetalert2';

export const VerifyOrganizations: React.FC = () => {
  const { organizations, loading } = useAdminStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'hospital' | 'bloodbank'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const pendingOrgs = useMemo(() => {
    let list = organizations.filter(o => o.status === 'pending');
    if (filterType !== 'all') {
      list = list.filter(o => o.type === filterType);
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(o => 
        o.name.toLowerCase().includes(q) || 
        o.email.toLowerCase().includes(q) || 
        o.city.toLowerCase().includes(q)
      );
    }
    return list;
  }, [organizations, filterType, searchTerm]);

  const handleVerify = async (orgId: string, action: 'verified' | 'rejected') => {
    try {
      const result = await Swal.fire({
        title: action === 'verified' ? 'Approve Organization?' : 'Reject Organization?',
        text: action === 'verified' 
          ? 'This organization will get access to the platform.' 
          : 'This organization will be rejected.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: action === 'verified' ? '#4ade80' : '#f87171',
        cancelButtonColor: '#4a3a3d',
        confirmButtonText: action === 'verified' ? 'Approve' : 'Reject',
        background: '#120a0c',
        color: '#f0e0e4'
      });

      if (result.isConfirmed) {
        setActionLoading(orgId);
        await verifyOrganization(orgId, action);
        Swal.fire({
          title: action === 'verified' ? 'Approved!' : 'Rejected',
          text: `Organization has been ${action}.`,
          icon: 'success',
          background: '#120a0c',
          color: '#f0e0e4',
          confirmButtonColor: '#4ade80'
        });
      }
    } catch (e: any) {
      Swal.fire({
        title: 'Error',
        text: 'Action failed: ' + e.message,
        icon: 'error',
        background: '#120a0c',
        color: '#f0e0e4'
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200 }}>
      {/* ── Page header ── */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f0e0e4', margin: 0 }}>
          Verify Organizations
        </h2>
        <p style={{ fontSize: 13, color: '#6a5a5d', marginTop: 4 }}>
          Review and approve new Hospitals and Blood Banks requesting platform access.
        </p>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 280 }}>
          <Search size={16} color="#6a5a5d" style={{ position: 'absolute', left: 16, top: 13 }} />
          <input 
            type="text" 
            placeholder="Search by name, email, or city..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '11px 16px 11px 42px',
              background: '#0f0a0b',
              border: '1px solid #2e1a1e',
              borderRadius: 8,
              color: '#f0e0e4',
              fontSize: 13,
              fontFamily: 'Inter, sans-serif',
              outline: 'none'
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={16} color="#6a5a5d" />
          <select 
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
            style={{
              padding: '11px 16px',
              background: '#0f0a0b',
              border: '1px solid #2e1a1e',
              borderRadius: 8,
              color: '#f0e0e4',
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
        <p style={{ color: '#6a5a5d', fontSize: 14 }}>Loading pending organizations...</p>
      ) : pendingOrgs.length === 0 ? (
        <div style={{ 
          background: '#0f0a0b', border: '1px solid #1e1214', borderRadius: 12, 
          padding: '60px 20px', textAlign: 'center' 
        }}>
          <CheckCircle size={32} color="#4ade80" style={{ margin: '0 auto 12px', opacity: 0.8 }} />
          <h3 style={{ fontSize: 16, color: '#f0e0e4', margin: 0 }}>All Caught Up!</h3>
          <p style={{ color: '#6a5a5d', fontSize: 13, marginTop: 4 }}>
            There are no pending organizations needing verification.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {pendingOrgs.map(org => (
            <div key={org.id} style={{
              background: '#0f0a0b', 
              border: '1px solid #1e1214',
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
                    <Droplet size={24} color="#f472b6" />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f0e0e4' }}>
                      {org.name}
                    </h3>
                    <span style={{
                      background: 'rgba(251,191,36,0.1)', color: '#fbbf24',
                      padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: 0.5
                    }}>
                      {org.type === 'hospital' ? 'Hospital' : 'Blood Bank'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 13, color: '#a09094', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Mail size={13} color="#6a5a5d" /> {org.email}
                    </p>
                    <p style={{ margin: 0, fontSize: 13, color: '#a09094', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={13} color="#6a5a5d" /> {org.phone || 'N/A'}
                    </p>
                    <p style={{ margin: 0, fontSize: 13, color: '#a09094', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={13} color="#6a5a5d" /> {org.address}
                    </p>
                    <p style={{ margin: 0, fontSize: 13, color: '#a09094', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={13} color="#6a5a5d" /> License: {org.registrationNumber}
                    </p>
                  </div>
                  
                  <p style={{ margin: '12px 0 0 0', fontSize: 11, color: '#5a4a5d' }}>
                    Registered on: {formatDate(org.createdAt)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                <button 
                  onClick={() => handleVerify(org.id, 'verified')}
                  disabled={actionLoading === org.id}
                  style={{
                    background: '#4ade80', color: '#064e3b',
                    border: 'none', borderRadius: 8, padding: '8px 16px',
                    fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                    cursor: actionLoading === org.id ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    minWidth: 100, opacity: actionLoading === org.id ? 0.7 : 1
                  }}
                >
                  <CheckCircle size={16} />
                  {actionLoading === org.id ? 'Wait...' : 'Approve'}
                </button>
                <button 
                  onClick={() => handleVerify(org.id, 'rejected')}
                  disabled={!!actionLoading}
                  style={{
                    background: 'transparent', color: '#f87171',
                    border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '8px 16px',
                    fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    minWidth: 100, opacity: actionLoading ? 0.5 : 1
                  }}
                >
                  <XCircle size={16} /> Reject
                </button>
                {org.documentUrls && org.documentUrls.length > 0 && (
                  <button 
                    onClick={() => window.open(org.documentUrls![0], '_blank')}
                    style={{
                      background: 'transparent', color: '#60a5fa',
                      border: '1px solid rgba(96,165,250,0.3)', borderRadius: 8, padding: '8px 16px',
                      fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      minWidth: 100, marginTop: 8
                    }}
                  >
                    <ExternalLink size={16} /> View Doc
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VerifyOrganizations;
