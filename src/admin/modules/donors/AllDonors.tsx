import React, { useMemo, useState } from 'react';
import { Users, Search, Download, FileText, CheckCircle2, UserX, Ban } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { formatDate, downloadCSV } from '../../services/exportService';
import Swal from 'sweetalert2';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';

export const AllDonors: React.FC = () => {
  const { donors, loading } = useAdminStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [bgFilter, setBgFilter] = useState('all');

  const filteredDonors = useMemo(() => {
    let list = [...donors];

    if (bgFilter !== 'all') {
      list = list.filter(d => d.bloodGroup === bgFilter);
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(d => 
        d.name.toLowerCase().includes(q) || 
        d.city.toLowerCase().includes(q) ||
        d.phone.includes(q)
      );
    }

    // Sort by most donations first
    list.sort((a, b) => b.totalDonations - a.totalDonations);
    return list;
  }, [donors, searchTerm, bgFilter]);

  const handleExport = () => {
    downloadCSV(
      filteredDonors.map(d => ({
        Name: d.name,
        BloodGroup: d.bloodGroup,
        Phone: d.phone,
        Location: `${d.city}, ${d.state}`,
        TotalDonations: d.totalDonations,
        LastDonation: formatDate(d.lastDonationDate),
        Eligible: d.isEligible ? 'Yes' : 'No'
      })),
      'donors_export'
    );
  };

  const handleSuspend = async (donorId: string, donorName: string) => {
    const result = await Swal.fire({
      title: 'Suspend Donor?',
      text: `Are you sure you want to suspend ${donorName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f87171',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Suspend',
      background: '#1e293b',
      color: '#ffffff'
    });

    if (result.isConfirmed) {
      try {
        await updateDoc(doc(db, 'users', donorId), { status: 'suspended' });
        Swal.fire({ title: 'Suspended!', text: 'Donor suspended.', icon: 'success', background: '#1e293b', color: '#ffffff' });
      } catch (e: any) {
        Swal.fire({ title: 'Error', text: 'Action failed: ' + e.message, icon: 'error', background: '#1e293b', color: '#ffffff' });
      }
    }
  };

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1200, fontFamily: 'Inter, sans-serif' }}>
      {/* ── Page header ── */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={22} color="#fbbf24" /> Registered Donors
          </h2>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
            Manage the national donor database, export contacts, and track individual contributions.
          </p>
        </div>
        <button 
          onClick={handleExport}
          disabled={filteredDonors.length === 0}
          style={{
            background: 'rgba(255,255,255,0.05)', color: '#f1f5f9',
            border: '1px solid #475569', borderRadius: 8, padding: '8px 16px',
            fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif',
            cursor: filteredDonors.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, opacity: filteredDonors.length === 0 ? 0.5 : 1
          }}
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 280 }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 16, top: 13 }} />
          <input 
            type="text" 
            placeholder="Search donors by name, city, or phone..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%', padding: '11px 16px 11px 42px',
              background: '#1e293b', border: '1px solid #475569', borderRadius: 8,
              color: '#ffffff', fontSize: 13, outline: 'none'
            }}
          />
        </div>
        <select 
          value={bgFilter}
          onChange={e => setBgFilter(e.target.value)}
          style={{
            padding: '11px 16px', background: '#1e293b', border: '1px solid #475569',
            borderRadius: 8, color: '#f1f5f9', fontSize: 13, outline: 'none', cursor: 'pointer'
          }}
        >
          <option value="all">All Blood Groups</option>
          {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
            <option key={bg} value={bg}>{bg}</option>
          ))}
        </select>
      </div>

      {/* ── Table ── */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Loading donors...</div>
        ) : filteredDonors.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>No donors found matching criteria.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Donor / Blood Group</th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Location</th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Contact</th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Contributions</th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Eligibility</th>
                <th style={{ padding: '14px 20px', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDonors.map(donor => (
                <tr key={donor.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ 
                        width: 36, height: 36, borderRadius: 10, background: 'rgba(248,113,113,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#f87171', fontSize: 13, fontWeight: 800
                      }}>
                        {donor.bloodGroup}
                      </div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>{donor.name}</p>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: 13, color: '#e2e8f0' }}>
                    {donor.city}{donor.state ? `, ${donor.state}` : ''}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: 13, color: '#e2e8f0', fontFamily: 'monospace' }}>
                    {donor.phone || 'N/A'}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#ffffff' }}>{donor.totalDonations}</p>
                    {donor.totalDonations > 0 && (
                      <p style={{ margin: '2px 0 0 0', fontSize: 11, color: '#94a3b8' }}>
                        Last: {formatDate(donor.lastDonationDate)}
                      </p>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    {donor.isEligible ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#4ade80', fontSize: 12, fontWeight: 600 }}>
                        <CheckCircle2 size={14} /> Eligible
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#f87171', fontSize: 12, fontWeight: 600 }}>
                        <UserX size={14} /> Ineligible (90 days)
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <button 
                      onClick={() => handleSuspend(donor.id, donor.name)}
                      style={{
                        background: 'transparent', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)',
                        borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
                      }}
                    >
                      <Ban size={14} /> Suspend
                    </button>
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

export default AllDonors;
