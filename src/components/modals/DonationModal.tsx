/**
 * DonationModal.tsx — RaktPort v5 Premium Redesign
 * "Process Donation Check-In" — clean, modern, glassmorphic form
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Loader2, CheckCircle2, AlertCircle, User, Droplet,
  Shield, Building2, X, Zap, Heart,
  Activity, AlarmClock, ArrowRight, Info, Target
} from 'lucide-react';
import { db } from '@/firebase';
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  checkInData?: any;
}

interface RRTIDData {
  patientName: string;
  bloodGroup: string;
  component?: string;
  unitsRequired: number;
  requiredBy?: string;
  hospitalName: string;
  district?: string;
  state?: string;
  status?: string;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const BG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'A+':  { bg: '#fff5f5', text: '#b91c1c', border: '#fca5a5' },
  'A-':  { bg: '#fff0f6', text: '#be185d', border: '#fbcfe8' },
  'B+':  { bg: '#eff6ff', text: '#1d4ed8', border: '#93c5fd' },
  'B-':  { bg: '#f0f9ff', text: '#0369a1', border: '#7dd3fc' },
  'O+':  { bg: '#f0fdf4', text: '#166534', border: '#86efac' },
  'O-':  { bg: '#f0fdfa', text: '#0f766e', border: '#5eead4' },
  'AB+': { bg: '#faf5ff', text: '#7e22ce', border: '#c4b5fd' },
  'AB-': { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' },
};

export const DonationModal = ({ isOpen, onClose, onSubmit, checkInData }: DonationModalProps) => {
  const [donorName, setDonorName] = useState('');
  const [mobile, setMobile] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [donationType, setDonationType] = useState('Regular');
  const [component, setComponent] = useState('Whole Blood');
  const [rRtid, setRRtid] = useState('');
  const [rRtidData, setRRtidData] = useState<RRTIDData | null>(null);
  const [rRtidLoading, setRRtidLoading] = useState(false);
  const [rRtidError, setRRtidError] = useState('');
  const [rRtidValid, setRRtidValid] = useState(false);

  const isCheckIn = !!checkInData;
  const bgPal = bloodGroup ? BG_COLORS[bloodGroup] : null;

  useEffect(() => {
    if (checkInData) {
      setDonorName(checkInData.donorName || '');
      setMobile(checkInData.mobile || '');
      setBloodGroup(checkInData.bloodGroup || '');
      setComponent(checkInData.component || 'Whole Blood');
      setDonationType('Regular');
      setRRtid(''); setRRtidData(null);
    } else {
      resetForm();
    }
  }, [checkInData, isOpen]);

  const validateRRTID = async (rtid: string) => {
    if (!rtid.trim()) { setRRtidData(null); setRRtidError(''); setRRtidValid(false); return; }
    setRRtidLoading(true); setRRtidError(''); setRRtidValid(false);
    try {
      let requestData: any = null;
      const docSnap = await getDoc(doc(db, 'bloodRequests', rtid));
      if (docSnap.exists()) {
        requestData = docSnap.data();
      } else {
        for (const q of [
          query(collection(db, 'bloodRequests'), where('linkedRTID', '==', rtid)),
          query(collection(db, 'bloodRequests'), where('rtid', '==', rtid)),
        ]) {
          const qs = await getDocs(q);
          if (!qs.empty) { requestData = qs.docs[0].data(); break; }
        }
      }
      if (!requestData) throw new Error('RH/RU-RTID not found in system');
      let hospitalName = requestData.hospitalName || 'Hospital';
      if (requestData.hospitalId) {
        try {
          const hDoc = await getDoc(doc(db, 'users', requestData.hospitalId));
          if (hDoc.exists()) hospitalName = hDoc.data().fullName || hospitalName;
        } catch (_) {}
      }
      let requiredByText = 'N/A';
      if (requestData.requiredBy) {
        try {
          const d = requestData.requiredBy.toDate ? requestData.requiredBy.toDate() : new Date(requestData.requiredBy);
          requiredByText = d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (_) {}
      }
      setRRtidData({
        patientName: requestData.patientName || 'Patient',
        bloodGroup: requestData.bloodGroup || 'Unknown',
        component: requestData.component || 'Whole Blood',
        unitsRequired: requestData.unitsRequired || 1,
        requiredBy: requiredByText,
        hospitalName, district: requestData.district || '', state: requestData.state || '',
        status: requestData.status || 'PENDING',
      });
      setRRtidValid(true);
    } catch (err: any) {
      setRRtidError(err.message || 'Failed to validate RH/RU-RTID');
      setRRtidData(null); setRRtidValid(false);
    } finally { setRRtidLoading(false); }
  };

  useEffect(() => {
    if (donationType === 'RH/RU-RTID-Linked Donation' && rRtid.length >= 10) {
      const t = setTimeout(() => validateRRTID(rRtid), 500);
      return () => clearTimeout(t);
    } else { setRRtidData(null); setRRtidError(''); setRRtidValid(false); }
  }, [rRtid, donationType]);

  const resetForm = () => {
    setDonorName(''); setMobile(''); setBloodGroup('');
    setDonationType('Regular'); setComponent('Whole Blood');
    setRRtid(''); setRRtidData(null); setRRtidError(''); setRRtidValid(false);
  };

  const handleSubmit = () => {
    if (!donorName.trim()) { alert('Please enter donor name'); return; }
    if (!bloodGroup) { alert('Please select blood group'); return; }
    if (donationType === 'RH/RU-RTID-Linked Donation') {
      if (!rRtid.trim()) { alert('Please enter RH/RU-RTID'); return; }
      if (!rRtidValid) { alert('Please wait for RH/RU-RTID validation'); return; }
    }
    onSubmit({
      donorName: donorName.trim(),
      mobile: mobile.trim() || checkInData?.mobile || '',
      bloodGroup, donationType, component,
      rRtid: donationType === 'RH/RU-RTID-Linked Donation' ? rRtid : null,
      rRtidData: donationType === 'RH/RU-RTID-Linked Donation' ? rRtidData : null,
    });
    resetForm();
  };

  const handleClose = () => { resetForm(); onClose(); };

  const DONATION_TYPES = [
    { value: 'Regular', icon: <Droplet size={18} style={{ color: '#C41E3A' }} />, iconBg: '#fff5f5', label: 'Regular Donation', desc: 'Standard walk-in or appointment donation' },
    { value: 'RH/RU-RTID-Linked Donation', icon: <Building2 size={18} style={{ color: '#7c3aed' }} />, iconBg: '#f5f3ff', label: 'Request-Linked', desc: 'Linked to hospital blood request' },
    { value: 'Emergency', icon: <AlarmClock size={18} style={{ color: '#ea580c' }} />, iconBg: '#fff7ed', label: 'Emergency', desc: 'Urgent critical donation' },
  ];

  const COMPONENTS = ['Whole Blood', 'Platelets', 'Plasma', 'PRBC'];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-0 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

          .dm-root { font-family: 'Plus Jakarta Sans', sans-serif; }

          /* ── Header ── */
          .dm-header {
            background: linear-gradient(135deg, #C41E3A 0%, #8b0000 60%, #6b0000 100%);
            padding: 24px 28px 20px;
            position: relative; overflow: hidden;
          }
          .dm-header::before {
            content: ''; position: absolute; right: -30px; top: -30px;
            width: 160px; height: 160px;
            background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 65%);
            border-radius: 50%;
          }
          .dm-header::after {
            content: ''; position: absolute; left: -20px; bottom: -40px;
            width: 120px; height: 120px;
            background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 60%);
            border-radius: 50%;
          }
          .dm-header-inner { position: relative; z-index: 1; display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }

          .dm-header-icon {
            width: 52px; height: 52px; border-radius: 14px;
            background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25);
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          }
          .dm-header-title {
            font-family: 'Sora', Georgia, serif;
            font-size: 1.25rem; font-weight: 800; color: #fff; margin: 0 0 4px; line-height: 1.2;
          }
          .dm-header-sub { font-size: 0.8rem; color: rgba(255,210,200,0.85); margin: 0; }
          .dm-close-btn {
            width: 30px; height: 30px; border-radius: 8px;
            background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);
            color: rgba(255,255,255,0.8); display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all 0.18s; flex-shrink: 0;
          }
          .dm-close-btn:hover { background: rgba(255,255,255,0.22); color: #fff; }

          /* Check-in info strip */
          .dm-checkin-strip {
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.18);
            border-radius: 10px; padding: 10px 14px; margin-top: 14px;
            display: flex; align-items: center; gap: 10px;
          }
          .dm-checkin-strip span { font-size: 0.75rem; color: rgba(255,255,255,0.9); font-weight: 500; }
          .dm-checkin-badge {
            font-size: 0.62rem; font-weight: 800; padding: 2px 8px;
            background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3);
            color: #fff; border-radius: 999px; letter-spacing: 0.04em;
          }

          /* ── Body ── */
          .dm-body { padding: 24px 28px; display: flex; flex-direction: column; gap: 20px; background: #fff; }
          .dark .dm-body { background: #1e293b; }

          /* ── Section label ── */
          .dm-section-label {
            font-family: 'Sora', sans-serif;
            font-size: 0.72rem; font-weight: 700; color: #94a3b8;
            text-transform: uppercase; letter-spacing: 0.1em;
            display: flex; align-items: center; gap: 6px;
            margin-bottom: 12px;
          }
          .dm-section-label::after {
            content: ''; flex: 1; height: 1px; background: #f0f0f0;
          }
          .dark .dm-section-label::after { background: rgba(255,255,255,0.08); }

          /* ── Form fields ── */
          .dm-field { display: flex; flex-direction: column; gap: 5px; }
          .dm-label {
            font-size: 0.78rem; font-weight: 700; color: #374151;
          }
          .dark .dm-label { color: #e2e8f0; }
          .dm-label-badge {
            font-size: 0.62rem; font-weight: 600; padding: 1px 6px;
            background: #eff6ff; color: #1d4ed8; border-radius: 999px;
            border: 1px solid #bfdbfe; margin-left: 6px;
          }

          .dm-input {
            width: 100%; height: 44px; border-radius: 12px;
            border: 1.5px solid #e5e7eb;
            padding: 0 14px;
            font-size: 0.87rem; color: #111827;
            background: #fafafa; outline: none;
            transition: all 0.18s;
            font-family: 'Plus Jakarta Sans', sans-serif;
          }
          .dm-input:focus { border-color: #C41E3A; background: #fff; box-shadow: 0 0 0 3px rgba(196,30,58,0.07); }
          .dm-input:disabled { background: #f0f7ff; border-color: #bfdbfe; color: #1e40af; cursor: default; font-weight: 600; }
          .dark .dm-input { background: #0f172a; border-color: rgba(255,255,255,0.1); color: #f0f4ff; }
          .dark .dm-input:focus { border-color: #f87171; box-shadow: 0 0 0 3px rgba(248,113,113,0.1); }
          .dark .dm-input:disabled { background: rgba(59,130,246,0.08); border-color: rgba(59,130,246,0.2); color: #93c5fd; }

          .dm-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
          @media (max-width: 560px) { .dm-grid-2 { grid-template-columns: 1fr; } }

          /* ── Blood group pill picker — horizontal wrap, no overlap ── */
          .dm-bg-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
          }
          @media (max-width: 400px) { .dm-bg-grid { grid-template-columns: repeat(4, 1fr); } }

          .dm-bg-pill {
            padding: 10px 6px; border-radius: 10px; border: 1.5px solid;
            display: flex; align-items: center; justify-content: center;
            font-family: 'Sora', monospace; font-size: 0.85rem; font-weight: 800;
            cursor: pointer; transition: all 0.2s;
            min-width: 0; white-space: nowrap;
          }
          .dm-bg-pill:not(.dm-bg-selected):hover { transform: scale(1.08); }
          .dm-bg-selected {
            box-shadow: 0 0 0 2px #fff, 0 0 0 4px currentColor;
            transform: scale(1.08);
          }
          .dm-bg-pill-disabled { cursor: not-allowed; opacity: 0.85; }

          /* ── Donation type cards ── */
          .dm-type-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
          @media (max-width: 480px) { .dm-type-grid { grid-template-columns: 1fr; } }

          .dm-type-card {
            border: 1.5px solid #e5e7eb; border-radius: 12px; padding: 12px;
            cursor: pointer; transition: all 0.18s; text-align: left;
            background: #fafafa;
          }
          .dm-type-card:hover { border-color: #C41E3A; background: #fff5f5; }
          .dm-type-card.dm-type-active {
            border-color: #C41E3A; background: #fff5f5;
            box-shadow: 0 0 0 3px rgba(196,30,58,0.08);
          }
          .dark .dm-type-card { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.09); }
          .dark .dm-type-card.dm-type-active { background: rgba(196,30,58,0.08); border-color: rgba(196,30,58,0.3); }

          .dm-type-icon-wrap {
            width: 36px; height: 36px; border-radius: 10px;
            display: flex; align-items: center; justify-content: center;
            margin-bottom: 8px; flex-shrink: 0;
          }
          .dm-type-name { font-size: 0.78rem; font-weight: 700; color: #111827; }
          .dark .dm-type-name { color: #f0f4ff; }
          .dm-type-desc { font-size: 0.65rem; color: #9ca3af; margin-top: 2px; }

          /* ── Component selector ── */
          .dm-comp-grid { display: flex; flex-wrap: wrap; gap: 8px; }
          .dm-comp-pill {
            padding: 6px 14px; border-radius: 999px; border: 1.5px solid #e5e7eb;
            font-size: 0.76rem; font-weight: 600; cursor: pointer; transition: all 0.18s;
            background: #fafafa; color: #374151;
          }
          .dm-comp-pill:hover { border-color: #C41E3A; color: #C41E3A; }
          .dm-comp-pill.dm-comp-active {
            background: #C41E3A; border-color: #C41E3A;
            color: #fff; box-shadow: 0 3px 10px rgba(196,30,58,0.25);
          }
          .dark .dm-comp-pill { background: rgba(255,255,255,0.05); color: #94a3b8; border-color: rgba(255,255,255,0.1); }
          .dark .dm-comp-pill.dm-comp-active { background: #C41E3A; border-color: #C41E3A; color: #fff; }

          /* ── RTID Input ── */
          .dm-rtid-input-wrap { position: relative; }
          .dm-rtid-input {
            width: 100%; height: 46px; border-radius: 12px;
            border: 1.5px solid #e5e7eb;
            padding: 0 46px 0 14px;
            font-family: 'Sora', monospace; font-size: 0.85rem; font-weight: 600;
            color: #111827; background: #fafafa; outline: none; transition: all 0.18s;
            letter-spacing: 0.02em;
          }
          .dm-rtid-input:focus { border-color: #7c3aed; background: #fff; box-shadow: 0 0 0 3px rgba(124,58,237,0.07); }
          .dm-rtid-input.valid { border-color: #16a34a; }
          .dm-rtid-input.error { border-color: #C41E3A; }
          .dark .dm-rtid-input { background: #0f172a; color: #f0f4ff; border-color: rgba(255,255,255,0.1); }

          .dm-rtid-icon {
            position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          }

          /* ── Validated patient card ── */
          .dm-patient-card {
            background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
            border: 1.5px solid #86efac; border-radius: 14px; padding: 16px;
            display: flex; flex-direction: column; gap: 10px;
            animation: dm-pop 0.3s cubic-bezier(0.34,1.56,0.64,1);
          }
          @keyframes dm-pop { from{transform:scale(0.96);opacity:0} to{transform:scale(1);opacity:1} }
          .dark .dm-patient-card { background: rgba(22,163,74,0.08); border-color: rgba(22,163,74,0.3); }

          .dm-patient-header {
            display: flex; align-items: center; gap: 8px;
            font-size: 0.8rem; font-weight: 700; color: #166534;
          }
          .dark .dm-patient-header { color: #4ade80; }
          .dm-patient-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          .dm-patient-field {
            background: rgba(255,255,255,0.7); border: 1px solid rgba(22,163,74,0.15);
            border-radius: 9px; padding: 9px 11px;
          }
          .dark .dm-patient-field { background: rgba(255,255,255,0.05); }
          .dm-patient-field-label { font-size: 0.62rem; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
          .dm-patient-field-val { font-size: 0.87rem; font-weight: 700; color: #111827; margin-top: 2px; }
          .dark .dm-patient-field-val { color: #f0f4ff; }
          .dm-patient-impact {
            background: rgba(255,255,255,0.5); border: 1px solid rgba(22,163,74,0.2);
            border-radius: 9px; padding: 9px 12px;
            font-size: 0.76rem; color: #166534; font-weight: 500;
            display: flex; align-items: center; gap: 8px;
          }
          .dark .dm-patient-impact { background: rgba(22,163,74,0.07); color: #4ade80; }

          /* ── Footer ── */
          .dm-footer {
            padding: 16px 28px 24px; display: flex; align-items: center; gap: 10px;
            border-top: 1px solid #f0f0f0; background: #fff;
          }
          .dark .dm-footer { background: #1e293b; border-top-color: rgba(255,255,255,0.07); }

          .dm-cancel-btn {
            padding: 10px 20px; border-radius: 12px;
            background: #f3f4f6; border: 1px solid #e5e7eb;
            color: #374151; font-size: 0.84rem; font-weight: 600; cursor: pointer;
            font-family: 'Plus Jakarta Sans', sans-serif; transition: all 0.18s;
          }
          .dm-cancel-btn:hover { background: #e5e7eb; }
          .dark .dm-cancel-btn { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.1); color: #94a3b8; }

          .dm-submit-btn {
            flex: 1; height: 46px; border-radius: 12px;
            background: linear-gradient(135deg, #C41E3A, #8b0000);
            border: none; color: #fff;
            font-family: 'Sora', sans-serif; font-size: 0.92rem; font-weight: 700;
            cursor: pointer; transition: all 0.2s;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            box-shadow: 0 4px 14px rgba(196,30,58,0.3);
          }
          .dm-submit-btn:hover:not(:disabled) {
            background: linear-gradient(135deg, #a0142e, #6b0000);
            box-shadow: 0 8px 22px rgba(196,30,58,0.4);
            transform: translateY(-1px);
          }
          .dm-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        `}</style>

        <div className="dm-root">
          {/* ── HEADER ── */}
          <div className="dm-header">
            <div className="dm-header-inner">
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="dm-header-icon">
                  {isCheckIn ? <Zap size={24} style={{ color: '#fff' }} /> : <Droplet size={24} style={{ color: '#fff', fill: 'rgba(255,255,255,0.7)' }} />}
                </div>
                <div>
                  <h2 className="dm-header-title">
                    {isCheckIn ? 'Process Donation Check-In' : 'Record New Donation'}
                  </h2>
                  <p className="dm-header-sub">
                    {isCheckIn
                      ? 'Complete the donation process for this scheduled appointment'
                      : 'Register a walk-in or emergency blood donation'}
                  </p>
                </div>
              </div>
              {/* X button removed — use Dialog overlay click to close */}
            </div>

            {isCheckIn && (
              <div className="dm-checkin-strip">
                <Shield size={14} style={{ color: 'rgba(255,255,255,0.9)', flexShrink: 0 }} />
                <span>Pre-filled from appointment record</span>
                <span className="dm-checkin-badge">VERIFIED</span>
              </div>
            )}
          </div>

          {/* ── BODY ── */}
          <div className="dm-body">

            {/* Section: Donor Information */}
            <div>
              <div className="dm-section-label">
                <User size={12} /> Donor Information
              </div>
              <div className="dm-grid-2">
                <div className="dm-field">
                  <label className="dm-label">
                    Full Name
                    {isCheckIn && <span className="dm-label-badge">Registered</span>}
                  </label>
                  <input
                    className="dm-input"
                    placeholder="e.g. Ramesh Kumar"
                    value={donorName}
                    onChange={e => setDonorName(e.target.value)}
                    disabled={isCheckIn}
                  />
                </div>
                <div className="dm-field">
                  <label className="dm-label">
                    Mobile Number
                    <span style={{ fontSize: '0.65rem', color: '#9ca3af', marginLeft: 5 }}>(optional)</span>
                  </label>
                  <input
                    className="dm-input"
                    placeholder="+91 98765 43210"
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    disabled={isCheckIn}
                  />
                </div>
              </div>
            </div>

            {/* Section: Blood Group */}
            <div>
              <div className="dm-section-label">
                <Heart size={12} /> Blood Group
                {isCheckIn && <span className="dm-label-badge" style={{ marginLeft: 0 }}>Registered</span>}
              </div>
              <div className="dm-bg-grid">
                {BLOOD_GROUPS.map(bg => {
                  const pal = BG_COLORS[bg];
                  const isSelected = bloodGroup === bg;
                  return (
                    <button
                      key={bg}
                      className={`dm-bg-pill ${isSelected ? 'dm-bg-selected' : ''} ${isCheckIn ? 'dm-bg-pill-disabled' : ''}`}
                      style={{
                        background: isSelected ? pal.text : pal.bg,
                        color: isSelected ? '#fff' : pal.text,
                        borderColor: pal.border,
                      }}
                      onClick={() => { if (!isCheckIn) setBloodGroup(bg); }}
                      disabled={isCheckIn}
                    >
                      {bg}
                    </button>
                  );
                })}
              </div>
              {!bloodGroup && !isCheckIn && (
                <p style={{ fontSize: '0.7rem', color: '#f59e0b', marginTop: 7, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Info size={11} /> Select blood group above
                </p>
              )}
            </div>

            {/* Section: Donation Type */}
            <div>
              <div className="dm-section-label">
                <Droplet size={12} /> Donation Type
              </div>
              <div className="dm-type-grid">
                {DONATION_TYPES.map(dt => (
                  <button
                    key={dt.value}
                    className={`dm-type-card ${donationType === dt.value ? 'dm-type-active' : ''}`}
                    onClick={() => setDonationType(dt.value)}
                  >
                    <div className="dm-type-icon-wrap" style={{ background: dt.iconBg }}>
                      {dt.icon}
                    </div>
                    <div className="dm-type-name">{dt.label}</div>
                    <div className="dm-type-desc">{dt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Section: Component */}
            <div>
              <div className="dm-section-label">
                <Droplet size={12} /> Blood Component
              </div>
              <div className="dm-comp-grid">
                {COMPONENTS.map(c => (
                  <button
                    key={c}
                    className={`dm-comp-pill ${component === c ? 'dm-comp-active' : ''}`}
                    onClick={() => setComponent(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Section: RTID Linking (only for linked donation) */}
            {donationType === 'RH/RU-RTID-Linked Donation' && (
              <div>
                <div className="dm-section-label">
                  <Building2 size={12} /> Patient Request Linking
                </div>
                <div className="dm-field">
                  <label className="dm-label">RH/RU-RTID (Patient Request ID)</label>
                  <div className="dm-rtid-input-wrap">
                    <input
                      className={`dm-rtid-input ${rRtidValid ? 'valid' : rRtidError ? 'error' : ''}`}
                      placeholder="e.g. RH-RTID-250126-Q1099"
                      value={rRtid}
                      onChange={e => setRRtid(e.target.value.toUpperCase())}
                    />
                    <span className="dm-rtid-icon">
                      {rRtidLoading && <Loader2 size={16} style={{ color: '#7c3aed', animation: 'spin 1s linear infinite' }} />}
                      {rRtidValid && <CheckCircle2 size={16} style={{ color: '#16a34a' }} />}
                      {rRtidError && <AlertCircle size={16} style={{ color: '#C41E3A' }} />}
                    </span>
                  </div>
                  {rRtidError && (
                    <p style={{ fontSize: '0.72rem', color: '#C41E3A', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertCircle size={11} /> {rRtidError}
                    </p>
                  )}
                </div>

                {/* Validated patient details */}
                {rRtidValid && rRtidData && (
                  <div className="dm-patient-card" style={{ marginTop: 12 }}>
                    <div className="dm-patient-header">
                      <CheckCircle2 size={15} /> Request Validated — Patient Info
                    </div>
                    <div className="dm-patient-grid">
                      <div className="dm-patient-field">
                        <div className="dm-patient-field-label">Patient Name</div>
                        <div className="dm-patient-field-val">{rRtidData.patientName}</div>
                      </div>
                      <div className="dm-patient-field">
                        <div className="dm-patient-field-label">Blood Group</div>
                        <div className="dm-patient-field-val" style={{ color: '#C41E3A', fontSize: '1.1rem' }}>{rRtidData.bloodGroup}</div>
                      </div>
                      <div className="dm-patient-field">
                        <div className="dm-patient-field-label">Component</div>
                        <div className="dm-patient-field-val">{rRtidData.component}</div>
                      </div>
                      <div className="dm-patient-field">
                        <div className="dm-patient-field-label">Units Required</div>
                        <div className="dm-patient-field-val">{rRtidData.unitsRequired}</div>
                      </div>
                      <div className="dm-patient-field" style={{ gridColumn: '1 / -1' }}>
                        <div className="dm-patient-field-label">Hospital</div>
                        <div className="dm-patient-field-val">{rRtidData.hospitalName}</div>
                      </div>
                      {rRtidData.requiredBy && rRtidData.requiredBy !== 'N/A' && (
                        <div className="dm-patient-field" style={{ gridColumn: '1 / -1' }}>
                          <div className="dm-patient-field-label">Required By</div>
                          <div className="dm-patient-field-val" style={{ color: '#C41E3A', fontSize: '0.82rem' }}>{rRtidData.requiredBy}</div>
                        </div>
                      )}
                    </div>
                    <div className="dm-patient-impact">
                      <Target size={14} style={{ color: '#166534', flexShrink: 0 }} />
                      This donation will directly help <strong style={{ marginLeft: 3 }}>{rRtidData.patientName}</strong>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── FOOTER ── */}
          <div className="dm-footer">
            <button className="dm-cancel-btn" onClick={handleClose}>Cancel</button>
            <button
              className="dm-submit-btn"
              onClick={handleSubmit}
              disabled={donationType === 'RH/RU-RTID-Linked Donation' && !rRtidValid}
            >
              <CheckCircle2 size={16} />
              {isCheckIn ? 'Confirm Check-In & Record Donation' : 'Record Donation'}
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};