/**
 * AppointmentsTab.tsx  ─  RaktPort v5 "Clean Light"
 * Sections:
 *  1. Pending Check-Ins  — Upcoming appointments (awaiting check-in)
 *  2. Completed Today    — Only appointments checked-in today
 *  3. Appointment History — Everything before today (completed or cancelled)
 */

import React, { useState, useMemo } from 'react';
import {
  Calendar, Clock, User, Phone, Heart,
  CheckCircle, ChevronDown, ChevronUp, Zap, History,
  XCircle, ChevronRight
} from 'lucide-react';
import { Appointment } from '@/types/bloodbank';
import { formatDate } from '@/lib/bloodbank-utils';

interface AppointmentsTabProps {
  appointments: Appointment[];
  onCheckIn: (appt: Appointment) => void;
}

const BG_PALETTE: Record<string, { bg: string; text: string; border: string; darkBg: string; darkText: string }> = {
  'A+':  { bg: '#fff5f5', text: '#b91c1c', border: '#fca5a5', darkBg: 'rgba(185,28,28,0.15)', darkText: '#f87171' },
  'A-':  { bg: '#fff0f6', text: '#be185d', border: '#fbcfe8', darkBg: 'rgba(190,24,93,0.15)',  darkText: '#f472b6' },
  'B+':  { bg: '#eff6ff', text: '#1d4ed8', border: '#93c5fd', darkBg: 'rgba(29,78,216,0.15)',  darkText: '#60a5fa' },
  'B-':  { bg: '#f0f9ff', text: '#0369a1', border: '#7dd3fc', darkBg: 'rgba(3,105,161,0.15)',  darkText: '#38bdf8' },
  'O+':  { bg: '#f0fdf4', text: '#166534', border: '#86efac', darkBg: 'rgba(22,101,52,0.15)',  darkText: '#4ade80' },
  'O-':  { bg: '#f0fdfa', text: '#0f766e', border: '#5eead4', darkBg: 'rgba(15,118,110,0.15)', darkText: '#2dd4bf' },
  'AB+': { bg: '#faf5ff', text: '#7e22ce', border: '#c4b5fd', darkBg: 'rgba(109,40,217,0.15)', darkText: '#c084fc' },
  'AB-': { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe', darkBg: 'rgba(91,33,182,0.15)',  darkText: '#a78bfa' },
};

function BloodGroupBadge({ group }: { group: string }) {
  const pal = BG_PALETTE[group] || BG_PALETTE['O+'];
  return (
    <span
      className="apt-bg-badge"
      style={{
        background: pal.bg, color: pal.text,
        border: `1.5px solid ${pal.border}`,
        '--dark-bg': pal.darkBg, '--dark-text': pal.darkText,
      } as any}
    >
      {group}
    </span>
  );
}

function ApptCard({ appt, onCheckIn }: { appt: Appointment; onCheckIn: () => void }) {
  const [hovered, setHovered] = useState(false);
  const date = appt.date instanceof Date ? appt.date : new Date(appt.date);
  const dd = date.getDate().toString().padStart(2, '0');
  const mo = date.toLocaleString('default', { month: 'short' }).toUpperCase();

  return (
    <div
      className={`apt-card ${hovered ? 'apt-card--hovered' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Left accent + date */}
      <div className="apt-card-left">
        <div className="apt-date-box">
          <span className="apt-date-dd">{dd}</span>
          <span className="apt-date-mo">{mo}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="apt-card-body">
        {/* Top row: name + status */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="apt-avatar">
              <User size={16} />
            </div>
            <div>
              <h3 className="apt-donor-name">{appt.donorName}</h3>
              {(appt.rtid || appt.appointmentRtid) && (
                <p className="apt-rtid">{appt.rtid || appt.appointmentRtid}</p>
              )}
            </div>
          </div>
          <span className="apt-status-badge apt-status-upcoming">UPCOMING</span>
        </div>

        {/* Info grid */}
        <div className="apt-info-grid">
          <div className="apt-info-item">
            <Heart size={12} className="apt-info-icon apt-icon-red" />
            <BloodGroupBadge group={appt.bloodGroup} />
            {appt.gender && <span className="apt-gender">{appt.gender}</span>}
          </div>
          <div className="apt-info-item">
            <Clock size={12} className="apt-info-icon" />
            <span className="apt-info-text">{appt.time || '—'}</span>
          </div>
          <div className="apt-info-item">
            <Calendar size={12} className="apt-info-icon" />
            <span className="apt-info-text">{formatDate(appt.date)}</span>
          </div>
          {appt.mobile && (
            <div className="apt-info-item">
              <Phone size={12} className="apt-info-icon" />
              <span className="apt-info-text">{appt.mobile}</span>
            </div>
          )}
        </div>

        {/* Check-in button */}
        <button className="apt-checkin-btn" onClick={onCheckIn}>
          <Zap size={13} />
          Check In &amp; Record Donation
        </button>
      </div>
    </div>
  );
}

function CompletedTodayCard({ appt }: { appt: Appointment }) {
  return (
    <div className="apt-done-card">
      <div className="apt-done-icon">
        <CheckCircle size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="apt-done-name">{appt.donorName}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
          <BloodGroupBadge group={appt.bloodGroup} />
          <span className="apt-done-meta">
            {appt.time || formatDate(appt.date)}
          </span>
          {appt.dRtid && (
            <span className="apt-done-meta" style={{ fontFamily: 'monospace' }}>D-RTID: {appt.dRtid}</span>
          )}
        </div>
      </div>
      <span className="apt-status-badge apt-status-done">✓ DONE</span>
    </div>
  );
}

function HistoryRow({ appt }: { appt: Appointment }) {
  const isCompleted = appt.status === 'Completed';
  const isCancelled = appt.status === 'Cancelled';
  const date = appt.date instanceof Date ? appt.date : new Date(appt.date);
  const dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="apt-hist-row">
      {/* Status icon */}
      <div className={`apt-hist-dot ${isCompleted ? 'apt-hist-dot-done' : 'apt-hist-dot-cancel'}`}>
        {isCompleted
          ? <CheckCircle size={13} />
          : <XCircle size={13} />
        }
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="apt-hist-name">{appt.donorName}</span>
          <BloodGroupBadge group={appt.bloodGroup} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
          <span className="apt-hist-meta">
            <Calendar size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />
            {dateStr}
          </span>
          {appt.time && (
            <span className="apt-hist-meta">
              <Clock size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />
              {appt.time}
            </span>
          )}
          {appt.dRtid && (
            <span className="apt-hist-rtid">{appt.dRtid}</span>
          )}
        </div>
      </div>

      {/* Status badge */}
      <span className={`apt-status-badge ${isCompleted ? 'apt-status-done' : 'apt-status-cancelled'}`}>
        {isCompleted ? '✓ Done' : 'Cancelled'}
      </span>
    </div>
  );
}

export const AppointmentsTab = ({ appointments, onCheckIn }: AppointmentsTabProps) => {
  const [showCompletedToday, setShowCompletedToday] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(10);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const getApptDate = (appt: Appointment): Date => {
    if (!appt.date) return new Date(0);
    if (appt.date instanceof Date) return appt.date;
    if (appt.date.toDate) return appt.date.toDate(); // Firestore Timestamp
    return new Date(appt.date);
  };

  // 1. Upcoming (pending check-in) — any date, status Upcoming
  const upcoming = useMemo(() =>
    appointments
      .filter(a => a.status === 'Upcoming')
      .sort((a, b) => getApptDate(a).getTime() - getApptDate(b).getTime()),
    [appointments]
  );

  // 2. Completed TODAY only
  const completedToday = useMemo(() =>
    appointments.filter(a => {
      if (a.status !== 'Completed') return false;
      const d = getApptDate(a);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    }).sort((a, b) => getApptDate(b).getTime() - getApptDate(a).getTime()),
    [appointments, today]
  );

  // 3. History = Completed or Cancelled BEFORE today
  const history = useMemo(() =>
    appointments
      .filter(a => {
        if (a.status === 'Upcoming') return false;
        const d = getApptDate(a);
        d.setHours(0, 0, 0, 0);
        return d.getTime() < today.getTime();
      })
      .sort((a, b) => getApptDate(b).getTime() - getApptDate(a).getTime()),
    [appointments, today]
  );

  const visibleHistory = history.slice(0, historyPage);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Oxanium:wght@700;800&display=swap');

        /* ── Grid ── */
        .apt-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        @media(max-width: 1024px) { .apt-grid { grid-template-columns: repeat(2, 1fr); } }
        @media(max-width: 600px)  { .apt-grid { grid-template-columns: 1fr; } }

        /* ── Card ── */
        .apt-card {
          background: #ffffff;
          border: 1.5px solid #f0e0e0;
          border-left: 4px solid #3b82f6;
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          gap: 0;
          transition: all 0.24s cubic-bezier(0.4,0,0.2,1);
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .apt-card--hovered {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(59,130,246,0.14), 0 4px 10px rgba(0,0,0,0.06);
          border-color: rgba(59,130,246,0.35);
        }
        .dark .apt-card {
          background: #1e2a3b;
          border-color: rgba(255,255,255,0.09);
        }
        .dark .apt-card--hovered {
          border-color: rgba(59,130,246,0.4);
          box-shadow: 0 12px 28px rgba(59,130,246,0.2);
        }

        /* ── Card left accent ── */
        .apt-card-left {
          padding: 18px 12px 18px 14px;
          display: flex; flex-direction: column; align-items: center;
          background: #f8fbff;
          border-right: 1px solid #e8f0fe;
          flex-shrink: 0;
          min-width: 58px;
        }
        .dark .apt-card-left {
          background: rgba(59,130,246,0.06);
          border-right-color: rgba(59,130,246,0.12);
        }

        .apt-date-box {
          display: flex; flex-direction: column; align-items: center;
          gap: 1px;
        }
        .apt-date-dd {
          font-family: 'Oxanium', monospace;
          font-size: 1.4rem; font-weight: 800;
          color: #1e40af; line-height: 1;
        }
        .dark .apt-date-dd { color: #60a5fa; }
        .apt-date-mo {
          font-family: 'Oxanium', monospace;
          font-size: 0.58rem; font-weight: 700;
          color: #64748b;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        /* ── Card body ── */
        .apt-card-body {
          padding: 14px 16px;
          display: flex; flex-direction: column; gap: 12px;
          flex: 1; min-width: 0;
        }

        /* ── Avatar ── */
        .apt-avatar {
          width: 36px; height: 36px; border-radius: 10px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          display: flex; align-items: center; justify-content: center;
          color: #3b82f6; flex-shrink: 0;
        }
        .dark .apt-avatar {
          background: rgba(59,130,246,0.12);
          border-color: rgba(59,130,246,0.25);
        }

        /* ── Donor name ── */
        .apt-donor-name {
          font-family: 'Sora', sans-serif;
          font-size: 0.92rem; font-weight: 700;
          color: #111827; line-height: 1.2;
        }
        .dark .apt-donor-name { color: #f0f4ff; }

        .apt-rtid {
          font-family: monospace;
          font-size: 0.63rem; color: #94a3b8; margin-top: 2px;
        }

        /* ── Status badges ── */
        .apt-status-badge {
          font-size: 0.6rem; font-weight: 800;
          padding: 3px 9px; border-radius: 999px;
          white-space: nowrap; flex-shrink: 0;
          letter-spacing: 0.04em;
        }
        .apt-status-upcoming {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
        }
        .dark .apt-status-upcoming {
          background: rgba(59,130,246,0.12);
          border-color: rgba(59,130,246,0.3);
          color: #60a5fa;
        }
        .apt-status-done {
          background: #f0fdf4;
          border: 1px solid #86efac;
          color: #16a34a;
        }
        .dark .apt-status-done {
          background: rgba(16,185,129,0.1);
          border-color: rgba(16,185,129,0.25);
          color: #4ade80;
        }
        .apt-status-cancelled {
          background: #fef2f2;
          border: 1px solid #fca5a5;
          color: #dc2626;
        }
        .dark .apt-status-cancelled {
          background: rgba(220,38,38,0.1);
          border-color: rgba(220,38,38,0.25);
          color: #f87171;
        }

        /* ── Blood group badge ── */
        .apt-bg-badge {
          font-family: 'Oxanium', monospace;
          font-size: 0.78rem; font-weight: 800;
          padding: 2px 8px; border-radius: 6px;
          display: inline-block;
        }
        .dark .apt-bg-badge {
          background: var(--dark-bg) !important;
          color: var(--dark-text) !important;
          border-color: var(--dark-text) !important;
          opacity: 0.9;
        }

        /* ── Info grid ── */
        .apt-info-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 6px 10px;
        }
        .apt-info-item {
          display: flex; align-items: center; gap: 5px;
        }
        .apt-info-icon {
          color: #94a3b8; flex-shrink: 0;
        }
        .apt-icon-red { color: #C41E3A !important; }
        .apt-info-text {
          font-size: 0.75rem; color: #374151; font-weight: 500;
        }
        .dark .apt-info-text { color: #cbd5e1; }
        .apt-gender {
          font-size: 0.65rem; color: #9ca3af; margin-left: 3px;
        }

        /* ── Check-in button ── */
        .apt-checkin-btn {
          width: 100%; padding: 9px 12px;
          border-radius: 10px;
          background: linear-gradient(135deg, #C41E3A, #8b0000);
          border: none;
          color: #fff;
          font-size: 0.8rem; font-weight: 700;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 7px;
          transition: all 0.2s;
          font-family: 'Sora', sans-serif;
          box-shadow: 0 3px 10px rgba(196,30,58,0.25);
        }
        .apt-checkin-btn:hover {
          background: linear-gradient(135deg, #a0142e, #6b0000);
          box-shadow: 0 6px 18px rgba(196,30,58,0.35);
          transform: translateY(-1px);
        }

        /* ── Completed card (today) ── */
        .apt-done-card {
          background: #fafafa;
          border: 1px solid #f0f0f0;
          border-left: 3px solid #10b981;
          border-radius: 12px;
          padding: 12px 14px;
          display: flex; align-items: center; gap: 12px;
          transition: all 0.2s;
        }
        .apt-done-card:hover { background: #f6fdf9; }
        .dark .apt-done-card {
          background: rgba(16,185,129,0.04);
          border-color: rgba(255,255,255,0.06);
        }
        .dark .apt-done-card:hover { background: rgba(16,185,129,0.08); }

        .apt-done-icon {
          width: 34px; height: 34px; border-radius: 9px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          display: flex; align-items: center; justify-content: center;
          color: #16a34a; flex-shrink: 0;
        }
        .dark .apt-done-icon {
          background: rgba(16,185,129,0.1);
          border-color: rgba(16,185,129,0.25);
        }

        .apt-done-name {
          font-size: 0.85rem; font-weight: 600;
          color: #374151;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .dark .apt-done-name { color: #e2e8f0; }

        .apt-done-meta {
          font-size: 0.65rem; color: #9ca3af;
        }

        /* ── History row ── */
        .apt-hist-row {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 14px;
          border-radius: 12px;
          background: #ffffff;
          border: 1px solid #f3f4f6;
          transition: all 0.18s;
        }
        .apt-hist-row:hover { background: #f9fafb; border-color: #e5e7eb; }
        .dark .apt-hist-row { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.06); }
        .dark .apt-hist-row:hover { background: rgba(255,255,255,0.06); }

        .apt-hist-dot {
          width: 30px; height: 30px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .apt-hist-dot-done {
          background: #f0fdf4; color: #16a34a;
          border: 1px solid #bbf7d0;
        }
        .apt-hist-dot-cancel {
          background: #fef2f2; color: #dc2626;
          border: 1px solid #fca5a5;
        }
        .dark .apt-hist-dot-done { background: rgba(22,163,74,0.1); border-color: rgba(22,163,74,0.25); }
        .dark .apt-hist-dot-cancel { background: rgba(220,38,38,0.1); border-color: rgba(220,38,38,0.25); }

        .apt-hist-name {
          font-size: 0.84rem; font-weight: 600; color: #111827;
        }
        .dark .apt-hist-name { color: #f0f4ff; }
        .apt-hist-meta {
          font-size: 0.68rem; color: #9ca3af;
        }
        .apt-hist-rtid {
          font-family: monospace; font-size: 0.62rem;
          background: #f3f4f6; color: #6b7280;
          padding: 1px 6px; border-radius: 4px;
        }
        .dark .apt-hist-rtid { background: rgba(255,255,255,0.08); color: #94a3b8; }

        /* ── Section header ── */
        .apt-section-hdr {
          display: flex; align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .apt-section-title {
          font-family: 'Sora', sans-serif;
          font-size: 0.92rem; font-weight: 700;
          color: #111827;
          display: flex; align-items: center; gap: 8px;
        }
        .dark .apt-section-title { color: #f0f4ff; }

        .apt-count-badge {
          font-size: 0.7rem; font-weight: 800;
          padding: 2px 9px; border-radius: 999px;
        }

        /* ── Empty state ── */
        .apt-empty {
          background: #fafafa;
          border: 1.5px dashed #e5e7eb;
          border-radius: 16px;
          padding: 40px;
          text-align: center;
        }
        .dark .apt-empty {
          background: rgba(255,255,255,0.02);
          border-color: rgba(255,255,255,0.08);
        }

        /* ── Collapse toggle ── */
        .apt-collapse-btn {
          display: flex; align-items: center; gap: 10px;
          width: 100%; background: none; border: none;
          cursor: pointer; padding: 10px 14px;
          border-radius: 12px;
          transition: background 0.15s;
          text-align: left;
          margin-bottom: 12px;
        }
        .apt-collapse-btn:hover { background: #f5f3ff; }
        .dark .apt-collapse-btn:hover { background: rgba(255,255,255,0.04); }

        /* ── Load more ── */
        .apt-load-more {
          width: 100%; padding: 10px; border-radius: 10px;
          background: #f8f9fa; border: 1px solid #e5e7eb;
          font-size: 0.78rem; font-weight: 600; color: #374151;
          cursor: pointer; transition: all 0.18s;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          font-family: 'Sora', sans-serif; margin-top: 10px;
        }
        .apt-load-more:hover { background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; }
        .dark .apt-load-more { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); color: #94a3b8; }

        /* ── History panel ── */
        .apt-hist-panel {
          background: #f9fafb;
          border: 1px solid #f0f0f0;
          border-radius: 14px;
          overflow: hidden;
        }
        .dark .apt-hist-panel { background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.06); }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* ── 1. Pending Check-Ins ── */}
        <div>
          <div className="apt-section-hdr">
            <div className="apt-section-title">
              <Calendar size={16} style={{ color: '#3b82f6' }} />
              Pending Check-Ins
              <span className="apt-count-badge" style={{
                background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8'
              }}>
                {upcoming.length}
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
              Click "Check In" to record donation
            </p>
          </div>

          {upcoming.length === 0 ? (
            <div className="apt-empty">
              <Calendar size={32} style={{ color: '#d1d5db', margin: '0 auto 10px' }} />
              <p style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: 500 }}>No pending appointments</p>
              <p style={{ fontSize: '0.73rem', color: '#c4cacf', marginTop: 4 }}>New appointments will appear here</p>
            </div>
          ) : (
            <div className="apt-grid">
              {upcoming.map(a => (
                <ApptCard
                  key={a.rtid || a.appointmentRtid}
                  appt={a}
                  onCheckIn={() => onCheckIn(a)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── 2. Completed Today (collapsible) ── */}
        {completedToday.length > 0 && (
          <div>
            <button className="apt-collapse-btn" onClick={() => setShowCompletedToday(v => !v)}>
              <CheckCircle size={15} style={{ color: '#10b981', flexShrink: 0 }} />
              <span className="apt-section-title" style={{ margin: 0 }}>
                Completed Today
              </span>
              <span className="apt-count-badge" style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a'
              }}>
                {completedToday.length}
              </span>
              <span style={{ marginLeft: 'auto', color: '#94a3b8' }}>
                {showCompletedToday ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </span>
            </button>

            {showCompletedToday && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {completedToday.map(a => (
                  <CompletedTodayCard key={a.rtid || a.appointmentRtid} appt={a} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 3. Appointment History ── */}
        {history.length > 0 && (
          <div>
            <button className="apt-collapse-btn" onClick={() => setShowHistory(v => !v)}>
              <History size={15} style={{ color: '#6366f1', flexShrink: 0 }} />
              <span className="apt-section-title" style={{ margin: 0 }}>
                Appointment History
              </span>
              <span className="apt-count-badge" style={{
                background: '#f5f3ff', border: '1px solid #ddd6fe', color: '#7c3aed'
              }}>
                {history.length}
              </span>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: 6 }}>
                Yesterday to earliest
              </span>
              <span style={{ marginLeft: 'auto', color: '#94a3b8' }}>
                {showHistory ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </span>
            </button>

            {showHistory && (
              <div className="apt-hist-panel">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '8px' }}>
                  {visibleHistory.map(a => (
                    <HistoryRow key={a.rtid || a.appointmentRtid || Math.random()} appt={a} />
                  ))}
                </div>

                {history.length > historyPage && (
                  <button
                    className="apt-load-more"
                    style={{ margin: '0 8px 8px' }}
                    onClick={() => setHistoryPage(p => p + 10)}
                  >
                    <ChevronRight size={14} />
                    Load {Math.min(10, history.length - historyPage)} more
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};