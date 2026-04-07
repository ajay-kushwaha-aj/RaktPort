import React, { useState } from 'react';
import { Settings as SettingsIcon, User, Shield, Info, Save } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';

export const Settings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const adminName = localStorage.getItem('adminName') || 'Super Admin';
  const adminEmail = localStorage.getItem('adminEmail') || 'admin@raktport.in';

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // alert or swal can be used here for confirmation
    }, 800);
  };

  return (
    <div style={{ padding: '32px 36px', maxWidth: 800, fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f0e0e4', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <SettingsIcon size={22} color="#f472b6" /> System Settings
        </h2>
        <p style={{ fontSize: 13, color: '#6a5a5d', marginTop: 4 }}>
          Manage your administrator profile, security preferences, and global dashboard configurations.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 32 }}>
        {/* Profile Section */}
        <section>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#c0b0b3', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={16} /> Administrator Profile
          </h3>
          <div style={{ background: '#0f0a0b', border: '1px solid #1e1214', borderRadius: 12, padding: 24, display: 'grid', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6a5a5d', marginBottom: 6 }}>Full Name</label>
                <input type="text" defaultValue={adminName} style={{
                  width: '100%', padding: '10px 14px', background: '#140c0e', border: '1px solid #2e1a1e', borderRadius: 8, color: '#f0e0e4', fontSize: 14, outline: 'none'
                }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6a5a5d', marginBottom: 6 }}>Email Address</label>
                <input type="email" disabled defaultValue={adminEmail} style={{
                  width: '100%', padding: '10px 14px', background: '#140c0e', border: '1px solid #2e1a1e', borderRadius: 8, color: '#6a5a5d', fontSize: 14, outline: 'none', cursor: 'not-allowed'
                }} />
              </div>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#c0b0b3', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={16} /> Session Security
          </h3>
          <div style={{ background: '#0f0a0b', border: '1px solid #1e1214', borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, fontSize: 14, color: '#e0d0d4', fontWeight: 500 }}>Two-Factor Authentication (2FA)</p>
                <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#6a5a5d' }}>Currently enforced globally for all admin accounts.</p>
              </div>
              <button disabled style={{ background: '#1a1012', border: '1px solid #4ade80', color: '#4ade80', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'not-allowed' }}>
                Enabled by Default
              </button>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #1e1214', margin: '20px 0' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, fontSize: 14, color: '#e0d0d4', fontWeight: 500 }}>Global Read-Only Role</p>
                <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#6a5a5d' }}>Role assigned by super administrator.</p>
              </div>
              <span style={{ fontSize: 13, color: '#c0b0b3', fontWeight: 600 }}>{localStorage.getItem('adminRole')?.toUpperCase() || 'SUPER ADMIN'}</span>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#c0b0b3', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Info size={16} /> About Platform
          </h3>
          <div style={{ background: '#0f0a0b', border: '1px solid #1e1214', borderRadius: 12, padding: 24, fontSize: 13, color: '#a09094' }}>
            <p style={{ margin: '0 0 8px 0' }}><strong>RaktPort Admin Control Center</strong> version 1.0.0 (Phase 1)</p>
            <p style={{ margin: '0 0 8px 0' }}>Built for the Indian National Blood Network System.</p>
            <p style={{ margin: 0 }}>© 2026 RaktPort. All rights reserved.</p>
          </div>
        </section>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button
            onClick={handleSave}
            style={{
              background: '#f87171', color: '#0f0a0b', border: 'none', borderRadius: 8, padding: '10px 24px',
              fontSize: 14, fontWeight: 700, fontFamily: 'Inter, sans-serif', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            {loading ? 'Saving...' : <><Save size={16} /> Save Preferences</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
