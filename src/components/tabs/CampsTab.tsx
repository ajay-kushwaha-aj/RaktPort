/**
 * CampsTab.tsx — RaktPort v5
 * Blood Donation Camp organising UI — Firebase-connected, clean modern light mode.
 */

import React, { useState, useEffect } from 'react';
import {
  MapPin, Clock, Plus, X,
  Building2, Phone, Tent, Target,
  CheckCircle2, AlertCircle, Edit2, Trash2,
  Heart, Award, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/firebase';
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore';

interface Camp {
  id: string;
  name: string;
  venue: string;
  date: string;
  time: string;
  organizer: string;
  contact: string;
  targetUnits: number;
  collectedUnits: number;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';
  notes?: string;
}

// No local DEMO data — Firebase provides real camps

const STATUS_META: Record<Camp['status'], { color: string; bg: string; border: string; label: string }> = {
  Upcoming:  { color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd', label: 'Upcoming' },
  Ongoing:   { color: '#c2410c', bg: '#fff7ed', border: '#fdba74', label: '🔴 Ongoing' },
  Completed: { color: '#16a34a', bg: '#f0fdf4', border: '#86efac', label: '✓ Completed' },
  Cancelled: { color: '#9ca3af', bg: '#f9fafb', border: '#e5e7eb', label: 'Cancelled' },
};

function ProgressBar({ value, target }: { value: number; target: number }) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  const color = pct >= 80 ? '#16a34a' : pct >= 50 ? '#d97706' : '#3b82f6';
  return (
    <div style={{ width: '100%', height: 6, background: '#f3f4f6', borderRadius: 999, overflow: 'hidden', marginTop: 6 }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: color,
        borderRadius: 999,
        transition: 'width 0.8s ease',
      }} />
    </div>
  );
}

function CampCard({ camp, onEdit, onDelete }: { camp: Camp; onEdit: (c: Camp) => void; onDelete: (id: string) => void }) {
  const meta = STATUS_META[camp.status];
  const dateObj = new Date(camp.date);
  const dd = dateObj.getDate().toString().padStart(2, '0');
  const mo = dateObj.toLocaleString('default', { month: 'short' }).toUpperCase();
  const pct = camp.targetUnits > 0 ? Math.round((camp.collectedUnits / camp.targetUnits) * 100) : 0;

  return (
    <div className="cmp-card">
      {/* Top accent bar */}
      <div style={{ height: 3, background: meta.color, borderRadius: '16px 16px 0 0', margin: '-1px -1px 0' }} />

      <div style={{ padding: '18px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          {/* Date box */}
          <div className="cmp-date-box">
            <span className="cmp-date-dd">{dd}</span>
            <span className="cmp-date-mo">{mo}</span>
          </div>

          {/* Name + metadata */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <h3 className="cmp-name">{camp.name}</h3>
              <span className="cmp-status-badge" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>
                {meta.label}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
              <MapPin size={11} style={{ color: '#C41E3A', flexShrink: 0 }} />
              <span className="cmp-venue">{camp.venue}</span>
            </div>
          </div>
        </div>

        {/* Info chips */}
        <div className="cmp-chips">
          <span className="cmp-chip">
            <Clock size={11} /> {camp.time}
          </span>
          <span className="cmp-chip">
            <Building2 size={11} /> {camp.organizer}
          </span>
          <span className="cmp-chip">
            <Phone size={11} /> {camp.contact}
          </span>
        </div>

        {/* Target progress */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <span className="cmp-progress-label">
              <Target size={11} /> Target Progress
            </span>
            <span className="cmp-progress-val" style={{ color: pct >= 80 ? '#16a34a' : pct >= 50 ? '#d97706' : '#1d4ed8' }}>
              {camp.collectedUnits} / {camp.targetUnits} units · {pct}%
            </span>
          </div>
          <ProgressBar value={camp.collectedUnits} target={camp.targetUnits} />
        </div>

        {/* Notes */}
        {camp.notes && (
          <p className="cmp-notes">{camp.notes}</p>
        )}

        {/* Actions */}
        <div className="cmp-actions">
          <button className="cmp-btn cmp-btn-edit" onClick={() => onEdit(camp)}>
            <Edit2 size={13} /> Edit
          </button>
          <button className="cmp-btn cmp-btn-delete" onClick={() => onDelete(camp.id)}>
            <Trash2 size={13} /> Remove
          </button>
          <span style={{ color: '#94a3b8', fontSize: '0.68rem', fontFamily: 'monospace', marginLeft: 'auto' }}>
            {camp.id}
          </span>
        </div>
      </div>
    </div>
  );
}

function NewCampModal({ onClose, onSave }: { onClose: () => void; onSave: (c: Omit<Camp, 'id' | 'collectedUnits'>) => void }) {
  const [form, setForm] = useState({
    name: '', venue: '', date: '', time: '09:00 AM – 04:00 PM',
    organizer: '', contact: '', targetUnits: 100, status: 'Upcoming' as Camp['status'], notes: '',
  });

  const handleSave = () => {
    if (!form.name || !form.venue || !form.date) {
      toast.error('Please fill camp name, venue, and date');
      return;
    }
    onSave(form);
  };

  const set = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="cmp-modal-overlay" onClick={onClose}>
      <div className="cmp-modal" onClick={e => e.stopPropagation()}>
        <div className="cmp-modal-header">
          <h3 className="cmp-modal-title">
            <Tent size={18} /> New Blood Donation Camp
          </h3>
          <button className="cmp-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="cmp-modal-body">
          <div className="cmp-form-grid">
            <div className="cmp-field cmp-field-full">
              <label className="cmp-label">Camp Name *</label>
              <input className="cmp-input" value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="e.g. City Hospital Blood Drive" />
            </div>
            <div className="cmp-field cmp-field-full">
              <label className="cmp-label">Venue / Address *</label>
              <input className="cmp-input" value={form.venue} onChange={e => set('venue', e.target.value)}
                placeholder="e.g. Town Hall, Ground Floor, Main Road" />
            </div>
            <div className="cmp-field">
              <label className="cmp-label">Date *</label>
              <input className="cmp-input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div className="cmp-field">
              <label className="cmp-label">Timings</label>
              <input className="cmp-input" value={form.time} onChange={e => set('time', e.target.value)}
                placeholder="09:00 AM – 04:00 PM" />
            </div>
            <div className="cmp-field">
              <label className="cmp-label">Organizer / Contact Person</label>
              <input className="cmp-input" value={form.organizer} onChange={e => set('organizer', e.target.value)}
                placeholder="Dr. Name / Organization" />
            </div>
            <div className="cmp-field">
              <label className="cmp-label">Contact Number</label>
              <input className="cmp-input" value={form.contact} onChange={e => set('contact', e.target.value)}
                placeholder="+91 98765 43210" />
            </div>
            <div className="cmp-field">
              <label className="cmp-label">Target Units</label>
              <input className="cmp-input" type="number" min={1} value={form.targetUnits}
                onChange={e => set('targetUnits', Number(e.target.value))} />
            </div>
            <div className="cmp-field">
              <label className="cmp-label">Status</label>
              <select className="cmp-input" value={form.status} onChange={e => set('status', e.target.value as Camp['status'])}>
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="cmp-field cmp-field-full">
              <label className="cmp-label">Notes (optional)</label>
              <textarea className="cmp-input cmp-textarea" value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Any extra instructions or reminders…" />
            </div>
          </div>
        </div>

        <div className="cmp-modal-footer">
          <button className="cmp-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="cmp-btn-save" onClick={handleSave}>
            <Plus size={15} /> Add Camp
          </button>
        </div>
      </div>
    </div>
  );
}

export const CampsTab = () => {
  const [camps, setCamps] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState<'All' | Camp['status']>('All');
  const [editCamp, setEditCamp] = useState<Camp | null>(null);

  // ── Real-time Firestore listener ──
  useEffect(() => {
    const q = query(collection(db, 'camps'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const data: Camp[] = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<Camp, 'id'>),
      }));
      setCamps(data);
      setLoading(false);
    }, err => {
      console.error('CampsTab Firestore error:', err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = filter === 'All' ? camps : camps.filter(c => c.status === filter);

  // ── Add camp (Firestore) ──
  const handleAdd = async (data: Omit<Camp, 'id' | 'collectedUnits'>) => {
    try {
      await addDoc(collection(db, 'camps'), {
        ...data,
        collectedUnits: 0,
        createdAt: serverTimestamp(),
      });
      setShowNew(false);
      toast.success('Camp added!', { description: `${data.name} on ${data.date}` });
    } catch (err) {
      console.error(err);
      toast.error('Failed to add camp');
    }
  };

  // ── Delete camp (Firestore) ──
  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'camps', id));
      toast.success('Camp removed');
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove camp');
    }
  };

  // ── Update camp (Firestore) ──
  const handleUpdate = async (updated: Camp) => {
    try {
      const { id, ...rest } = updated;
      await updateDoc(doc(db, 'camps', id), rest);
      toast.success('Camp updated!');
      setEditCamp(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update camp');
    }
  };

  // KPI summary
  const totalCamps = camps.length;
  const ongoingCamps = camps.filter(c => c.status === 'Ongoing').length;
  const totalTarget = camps.reduce((s, c) => s + (c.targetUnits || 0), 0);
  const totalCollected = camps.reduce((s, c) => s + (c.collectedUnits || 0), 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Oxanium:wght@700;800&display=swap');

        .cmp-root { font-family: 'Sora', sans-serif; display: flex; flex-direction: column; gap: 24px; }

        /* ── KPI strip ── */
        .cmp-kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        @media(max-width:800px) { .cmp-kpi-row { grid-template-columns: repeat(2, 1fr); } }
        @media(max-width:480px) { .cmp-kpi-row { grid-template-columns: 1fr 1fr; } }

        .cmp-kpi-card {
          background: #fff;
          border: 1.5px solid #f0e8e8;
          border-radius: 16px;
          padding: 16px 18px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          transition: all 0.2s;
        }
        .cmp-kpi-card:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.08); }
        .dark .cmp-kpi-card { background: #1e293b; border-color: rgba(255,255,255,0.07); }

        .cmp-kpi-icon {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 10px;
        }
        .cmp-kpi-val {
          font-family: 'Oxanium', monospace;
          font-size: 1.7rem; font-weight: 800;
          color: #111827; line-height: 1;
        }
        .dark .cmp-kpi-val { color: #f0f4ff; }
        .cmp-kpi-label { font-size: 0.7rem; color: #9ca3af; font-weight: 500; margin-top: 3px; }

        /* ── Toolbar ── */
        .cmp-toolbar {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
        }
        .cmp-filter-btn {
          padding: 6px 14px; border-radius: 999px;
          font-size: 0.76rem; font-weight: 600;
          cursor: pointer; border: 1.5px solid;
          transition: all 0.18s;
          font-family: 'Sora', sans-serif;
        }
        .cmp-filter-btn.active {
          background: #C41E3A; border-color: #C41E3A;
          color: #fff; box-shadow: 0 3px 10px rgba(196,30,58,0.25);
        }
        .cmp-filter-btn:not(.active) {
          background: #fff; border-color: #e5e7eb; color: #374151;
        }
        .cmp-filter-btn:not(.active):hover { border-color: #C41E3A; color: #C41E3A; }
        .dark .cmp-filter-btn:not(.active) { background: #1e293b; border-color: rgba(255,255,255,0.1); color: #94a3b8; }

        .cmp-add-btn {
          margin-left: auto;
          display: flex; align-items: center; gap: 7px;
          background: linear-gradient(135deg, #C41E3A, #8b0000);
          border: none; border-radius: 12px;
          padding: 9px 18px;
          color: #fff; font-size: 0.82rem; font-weight: 700;
          cursor: pointer; transition: all 0.2s;
          font-family: 'Sora', sans-serif;
          box-shadow: 0 4px 12px rgba(196,30,58,0.25);
        }
        .cmp-add-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(196,30,58,0.35);
        }

        /* ── Card grid ── */
        .cmp-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }
        @media(max-width:800px) { .cmp-grid { grid-template-columns: 1fr; } }

        /* ── Individual card ── */
        .cmp-card {
          background: #fff;
          border: 1.5px solid #f0e0e0;
          border-radius: 16px;
          transition: all 0.22s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          overflow: hidden;
        }
        .cmp-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 24px rgba(0,0,0,0.09);
        }
        .dark .cmp-card { background: #1e293b; border-color: rgba(255,255,255,0.07); }

        .cmp-date-box {
          width: 46px; height: 46px; border-radius: 12px;
          background: linear-gradient(135deg, #C41E3A, #8b0000);
          color: #fff;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .cmp-date-dd { font-family: 'Oxanium', monospace; font-size: 1.1rem; font-weight: 800; line-height: 1; }
        .cmp-date-mo { font-size: 0.5rem; font-weight: 700; letter-spacing: 0.08em; opacity: 0.85; }

        .cmp-name {
          font-family: 'Sora', sans-serif;
          font-size: 0.92rem; font-weight: 700;
          color: #111827; margin: 0; line-height: 1.3;
        }
        .dark .cmp-name { color: #f0f4ff; }

        .cmp-venue {
          font-size: 0.72rem; color: #64748b;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .dark .cmp-venue { color: #94a3b8; }

        .cmp-status-badge {
          font-size: 0.62rem; font-weight: 800;
          padding: 3px 9px; border-radius: 999px;
          white-space: nowrap; letter-spacing: 0.04em;
        }

        .cmp-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
        .cmp-chip {
          display: inline-flex; align-items: center; gap: 4px;
          background: #f8f9fa; border: 1px solid #e5e7eb;
          border-radius: 999px; padding: 3px 10px;
          font-size: 0.68rem; color: #374151; font-weight: 500;
        }
        .dark .cmp-chip { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); color: #94a3b8; }

        .cmp-progress-label {
          display: flex; align-items: center; gap: 4px;
          font-size: 0.7rem; color: #64748b; font-weight: 500;
        }
        .cmp-progress-val { font-size: 0.72rem; font-weight: 700; }

        .cmp-notes {
          font-size: 0.72rem; color: #9ca3af;
          background: #fafafa; border: 1px solid #f0f0f0;
          border-radius: 8px; padding: 8px 10px;
          margin-top: 10px; margin-bottom: 0;
          font-style: italic;
        }
        .dark .cmp-notes { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.06); }

        .cmp-actions {
          display: flex; align-items: center; gap: 8px; margin-top: 14px;
          padding-top: 12px; border-top: 1px solid #f5f5f5;
        }
        .dark .cmp-actions { border-top-color: rgba(255,255,255,0.06); }

        .cmp-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 12px; border-radius: 8px;
          font-size: 0.72rem; font-weight: 600;
          cursor: pointer; border: 1.5px solid;
          transition: all 0.15s;
          font-family: 'Sora', sans-serif;
        }
        .cmp-btn-edit {
          background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8;
        }
        .cmp-btn-edit:hover { background: #dbeafe; }
        .cmp-btn-delete {
          background: #fff5f5; border-color: #fca5a5; color: #C41E3A;
        }
        .cmp-btn-delete:hover { background: #fee2e2; }

        /* ── Empty ── */
        .cmp-empty {
          background: #fafafa;
          border: 1.5px dashed #e5e7eb;
          border-radius: 18px;
          padding: 50px;
          text-align: center;
        }
        .dark .cmp-empty { background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.07); }

        /* ── Modal ── */
        .cmp-modal-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: cmp-fadein 0.2s ease;
        }
        @keyframes cmp-fadein { from{opacity:0} to{opacity:1} }

        .cmp-modal {
          background: #fff;
          border-radius: 22px;
          width: 100%; max-width: 620px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.2);
          max-height: 90vh; overflow: hidden;
          display: flex; flex-direction: column;
          animation: cmp-slidein 0.28s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes cmp-slidein { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
        .dark .cmp-modal { background: #1e293b; }

        .cmp-modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px 16px;
          border-bottom: 1px solid #f3f4f6;
        }
        .dark .cmp-modal-header { border-bottom-color: rgba(255,255,255,0.07); }

        .cmp-modal-title {
          font-family: 'Sora', sans-serif;
          font-size: 1.05rem; font-weight: 700;
          color: #111827; margin: 0;
          display: flex; align-items: center; gap: 9px;
        }
        .dark .cmp-modal-title { color: #f0f4ff; }

        .cmp-modal-close {
          background: #f3f4f6; border: none; border-radius: 9px;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #6b7280; transition: all 0.15s;
        }
        .cmp-modal-close:hover { background: #fee2e2; color: #C41E3A; }

        .cmp-modal-body { padding: 20px 24px; overflow-y: auto; }

        .cmp-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media(max-width:480px) { .cmp-form-grid { grid-template-columns: 1fr; } }

        .cmp-field { display: flex; flex-direction: column; gap: 5px; }
        .cmp-field-full { grid-column: 1 / -1; }
        .cmp-label { font-size: 0.75rem; font-weight: 700; color: #374151; }
        .dark .cmp-label { color: #e2e8f0; }

        .cmp-input {
          width: 100%; padding: 9px 12px; border-radius: 10px;
          border: 1.5px solid #e5e7eb;
          font-size: 0.83rem; color: #111827;
          background: #fafafa; outline: none;
          transition: border-color 0.18s;
          font-family: 'Sora', sans-serif;
        }
        .cmp-input:focus { border-color: #C41E3A; background: #fff; box-shadow: 0 0 0 3px rgba(196,30,58,0.07); }
        .dark .cmp-input { background: #0f172a; border-color: rgba(255,255,255,0.1); color: #e2e8f0; }
        .cmp-textarea { min-height: 72px; resize: vertical; }

        .cmp-modal-footer {
          display: flex; align-items: center; justify-content: flex-end; gap: 10px;
          padding: 16px 24px 20px;
          border-top: 1px solid #f3f4f6;
        }
        .dark .cmp-modal-footer { border-top-color: rgba(255,255,255,0.07); }

        .cmp-btn-cancel {
          padding: 9px 18px; border-radius: 10px;
          background: #f3f4f6; border: none; color: #374151;
          font-size: 0.82rem; font-weight: 600; cursor: pointer;
          font-family: 'Sora', sans-serif; transition: background 0.15s;
        }
        .cmp-btn-cancel:hover { background: #e5e7eb; }
        .dark .cmp-btn-cancel { background: rgba(255,255,255,0.07); color: #94a3b8; }

        .cmp-btn-save {
          padding: 9px 20px; border-radius: 10px;
          background: linear-gradient(135deg, #C41E3A, #8b0000);
          border: none; color: #fff;
          font-size: 0.82rem; font-weight: 700; cursor: pointer;
          font-family: 'Sora', sans-serif;
          display: flex; align-items: center; gap: 6px;
          box-shadow: 0 4px 12px rgba(196,30,58,0.25);
          transition: all 0.18s;
        }
        .cmp-btn-save:hover { box-shadow: 0 6px 18px rgba(196,30,58,0.35); transform: translateY(-1px); }
      `}</style>

      <div className="cmp-root">

        {/* ── KPI Cards ── */}
        <div className="cmp-kpi-row">
          {[
            { label: 'Total Camps', val: totalCamps, icon: <Tent size={18} />, iconBg: '#fff5f5', iconColor: '#C41E3A' },
            { label: 'Ongoing Now', val: ongoingCamps, icon: <AlertCircle size={18} />, iconBg: '#fff7ed', iconColor: '#ea580c' },
            { label: 'Target Units', val: totalTarget, icon: <Target size={18} />, iconBg: '#eff6ff', iconColor: '#1d4ed8' },
            { label: 'Units Collected', val: totalCollected, icon: <Heart size={18} />, iconBg: '#f0fdf4', iconColor: '#16a34a' },
          ].map(k => (
            <div key={k.label} className="cmp-kpi-card">
              <div className="cmp-kpi-icon" style={{ background: k.iconBg, color: k.iconColor }}>
                {k.icon}
              </div>
              <div className="cmp-kpi-val">{k.val}</div>
              <div className="cmp-kpi-label">{k.label}</div>
            </div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="cmp-toolbar">
          {(['All', 'Upcoming', 'Ongoing', 'Completed', 'Cancelled'] as const).map(f => (
            <button
              key={f}
              className={`cmp-filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
          <button className="cmp-add-btn" onClick={() => setShowNew(true)}>
            <Plus size={15} /> New Camp
          </button>
        </div>

        {/* ── Camp grid ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Loader2 size={28} style={{ color: '#C41E3A', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: 12 }}>Loading camps from database…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="cmp-empty">
            <Tent size={40} style={{ color: '#d1d5db', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#9ca3af', margin: '0 0 6px' }}>
              No camps found
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#c4c9d0', margin: 0 }}>
              {filter !== 'All' ? `No ${filter} camps` : 'Click "New Camp" to organize your first blood donation camp'}
            </p>
            <button className="cmp-add-btn" style={{ margin: '16px auto 0', display: 'inline-flex' }} onClick={() => setShowNew(true)}>
              <Plus size={15} /> Organize a Camp
            </button>
          </div>
        ) : (
          <div className="cmp-grid">
            {filtered.map(c => (
              <CampCard
                key={c.id}
                camp={c}
                onEdit={setEditCamp}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* ── Summary note ── */}
        {totalCollected > 0 && (
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14,
            padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <Award size={20} style={{ color: '#16a34a', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#166534', margin: 0 }}>
                {totalCollected} units collected across all camps
              </p>
              <p style={{ fontSize: '0.72rem', color: '#4ade80', margin: '2px 0 0' }}>
                That's approximately {totalCollected * 3} lives within reach 🩸
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── New Camp Modal ── */}
      {showNew && (
        <NewCampModal onClose={() => setShowNew(false)} onSave={handleAdd} />
      )}

      {editCamp && (
        <div className="cmp-modal-overlay" onClick={() => setEditCamp(null)}>
          <div className="cmp-modal" onClick={e => e.stopPropagation()}>
            <div className="cmp-modal-header">
              <h3 className="cmp-modal-title"><Edit2 size={18} /> Edit Camp</h3>
              <button className="cmp-modal-close" onClick={() => setEditCamp(null)}><X size={18} /></button>
            </div>
            <div className="cmp-modal-body">
              <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                Editing: <strong>{editCamp.name}</strong> ({editCamp.id})
              </p>
              <div style={{ marginTop: 12 }} className="cmp-form-grid">
                <div className="cmp-field">
                  <label className="cmp-label">Units Collected</label>
                  <input
                    className="cmp-input"
                    type="number"
                    min={0}
                    value={editCamp.collectedUnits}
                    onChange={e => setEditCamp(c => c ? { ...c, collectedUnits: Number(e.target.value) } : c)}
                  />
                </div>
                <div className="cmp-field">
                  <label className="cmp-label">Status</label>
                  <select
                    className="cmp-input"
                    value={editCamp.status}
                    onChange={e => setEditCamp(c => c ? { ...c, status: e.target.value as Camp['status'] } : c)}
                  >
                    <option>Upcoming</option>
                    <option>Ongoing</option>
                    <option>Completed</option>
                    <option>Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="cmp-modal-footer">
              <button className="cmp-btn-cancel" onClick={() => setEditCamp(null)}>Cancel</button>
              <button className="cmp-btn-save" onClick={() => editCamp && handleUpdate(editCamp)}>
                <CheckCircle2 size={15} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
