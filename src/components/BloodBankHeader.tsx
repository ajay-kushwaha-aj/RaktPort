/**
 * BloodBankHeader.tsx  — RaktPort v5.1 "Clean Light"
 * Fonts: Sora + Plus Jakarta Sans (matches landing page title)
 * Fixes: blood bank name truncation, single location, profile button, clean layout
 */

import React, { useState, useEffect } from 'react';
import { Bell, LogOut, Droplet, MapPin, MessageSquarePlus, RefreshCw, UserCircle } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import { FeedbackWidget } from './FeedbackWidget';
import logo from '../assets/raktport-logo.png';

interface BloodBankHeaderProps {
  onNotificationClick: () => void;
  notificationCount: number;
  bloodRequestsCount: number;
  onLogout: () => void;
  location: string;
  bloodBankName?: string;
  onProfileClick?: () => void;
}

function LiveDot({ color = '#10b981' }: { color?: string }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8, flexShrink: 0 }}>
      <span style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: color, opacity: 0.4,
        animation: 'hdr-ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
      }} />
      <span style={{ borderRadius: '50%', width: 8, height: 8, background: color, position: 'relative' }} />
    </span>
  );
}

export const BloodBankHeader = ({
  onNotificationClick, notificationCount, bloodRequestsCount,
  onLogout, location, bloodBankName, onProfileClick,
}: BloodBankHeaderProps) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        @keyframes hdr-ping {
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes hdr-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes hdr-fadein {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Root ── */
        .hdr-root {
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
          background: #ffffff;
          border-bottom: 1px solid rgba(196,30,58,0.1);
          box-shadow: 0 1px 4px rgba(139,0,0,0.05), 0 4px 16px rgba(0,0,0,0.04);
          position: sticky; top: 0; z-index: 50;
          animation: hdr-fadein 0.35s cubic-bezier(0.22,1,0.36,1) both;
        }
        .dark .hdr-root {
          background: #111827;
          border-bottom-color: rgba(255,255,255,0.07);
          box-shadow: 0 1px 6px rgba(0,0,0,0.3);
        }

        /* Crimson shimmer top line */
        .hdr-topline {
          height: 3px;
          background: linear-gradient(90deg, #8b0000 0%, #C41E3A 40%, #ff4d6d 60%, #C41E3A 80%, #8b0000 100%);
          background-size: 200% 100%;
          animation: hdr-shimmer 3.5s linear infinite;
        }

        /* ── Inner wrapper ── */
        .hdr-inner {
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 20px;
        }

        /* ── Main row ── */
        .hdr-main-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 0;
          min-height: 58px;
        }

        /* ── Logo ring ── */
        .hdr-logo-ring {
          width: 42px; height: 42px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.22s ease;
          flex-shrink: 0;
        }
        .hdr-logo-ring:hover {
          transform: scale(1.05);
        }

        /* ── Brand block ── */
        .hdr-brand-block {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
          flex-shrink: 1;
        }
        .hdr-brand-row-top {
          display: flex;
          align-items: baseline;
          gap: 6px;
          flex-wrap: nowrap;
        }
        .hdr-brand-name {
          font-family: 'Sora', Georgia, serif;
          font-size: 1.3rem;
          font-weight: 800;
          color: #C41E3A;
          letter-spacing: -0.04em;
          line-height: 1;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .dark .hdr-brand-name { color: #f87171; }
        .hdr-brand-sub {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.58rem;
          font-weight: 700;
          color: #C41E3A;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          opacity: 0.75;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* Blood bank name — NOT truncated, full text on second line */
        .hdr-bank-name {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 0.72rem;
          font-weight: 600;
          color: #7a1527;
          display: flex;
          align-items: center;
          gap: 5px;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 260px;
        }
        .dark .hdr-bank-name { color: #fca5a5; }

        /* ── Divider ── */
        .hdr-div {
          width: 1px; height: 28px;
          background: #e5e7eb;
          flex-shrink: 0;
          align-self: center;
        }
        .dark .hdr-div { background: rgba(255,255,255,0.08); }

        /* ── Single location pill (center-ish) ── */
        .hdr-location {
          display: inline-flex; align-items: center; gap: 5px;
          background: #f8faff;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          padding: 5px 12px 5px 8px;
          font-size: 0.72rem; font-weight: 500;
          color: #475569;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.18s;
        }
        .hdr-location:hover { background: #f0f4ff; border-color: #c7d7f0; }
        .dark .hdr-location {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.1);
          color: #94a3b8;
        }

        /* ── Live badge ── */
        .hdr-live {
          display: flex; align-items: center; gap: 5px;
          font-size: 0.62rem; font-weight: 700; font-family: 'Sora', monospace;
          color: #16a34a; letter-spacing: 0.07em;
          flex-shrink: 0;
        }

        /* ── Pending requests pill ── */
        .hdr-req-pill {
          display: inline-flex; align-items: center; gap: 6px;
          background: #fff0f1; border: 1px solid rgba(196,30,58,0.35);
          border-radius: 999px; padding: 4px 12px 4px 7px;
          font-size: 0.7rem; color: #C41E3A; font-weight: 700;
          white-space: nowrap; flex-shrink: 0;
        }
        .dark .hdr-req-pill { background: rgba(196,30,58,0.1); color: #fca5a5; }

        /* ── Clock ── */
        .hdr-clock {
          display: flex; flex-direction: column; align-items: flex-end; gap: 1px;
          font-family: 'Sora', monospace;
          flex-shrink: 0;
        }
        .hdr-clock-time {
          font-size: 0.85rem; font-weight: 700;
          color: #1e293b; letter-spacing: 0.02em;
        }
        .dark .hdr-clock-time { color: #e2e8f0; }
        .hdr-clock-date { font-size: 0.6rem; font-weight: 500; color: #94a3b8; }

        /* ── Icon buttons ── */
        .hdr-icon-btn {
          width: 36px; height: 36px; border-radius: 10px;
          background: #f8f9fa; border: 1px solid #e5e7eb;
          display: flex; align-items: center; justify-content: center;
          color: #6b7280; cursor: pointer;
          transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
          position: relative; flex-shrink: 0;
        }
        .hdr-icon-btn:hover {
          background: #fff0f1; border-color: rgba(196,30,58,0.3);
          color: #C41E3A; transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(196,30,58,0.14);
        }
        .dark .hdr-icon-btn {
          background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.1); color: #94a3b8;
        }
        .dark .hdr-icon-btn:hover {
          background: rgba(196,30,58,0.15); border-color: rgba(196,30,58,0.35); color: #fca5a5;
        }

        /* ── Notification badge ── */
        .hdr-notif-badge {
          position: absolute; top: -5px; right: -5px;
          min-width: 16px; height: 16px; padding: 0 3px;
          background: #C41E3A; border: 2px solid #fff;
          border-radius: 999px; font-size: 8px; font-weight: 800;
          color: #fff; display: flex; align-items: center; justify-content: center;
          animation: hdr-ping 2s ease-in-out infinite;
        }
        .dark .hdr-notif-badge { border-color: #111827; }

        /* ── Profile button ── */
        .hdr-profile-btn {
          display: flex; align-items: center; gap: 6px;
          background: #f0f9ff; border: 1px solid #bae6fd;
          border-radius: 10px; padding: 7px 13px;
          color: #0369a1; font-size: 0.76rem; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
          font-family: 'Plus Jakarta Sans', sans-serif; white-space: nowrap;
          flex-shrink: 0;
        }
        .hdr-profile-btn:hover {
          background: #e0f2fe; border-color: #7dd3fc;
          box-shadow: 0 3px 10px rgba(3,105,161,0.15);
          transform: translateY(-1px);
        }
        .dark .hdr-profile-btn {
          background: rgba(3,105,161,0.1); border-color: rgba(3,105,161,0.25); color: #7dd3fc;
        }

        /* ── Refresh button ── */
        .hdr-refresh-btn {
          display: inline-flex; align-items: center; gap: 6px;
          background: #f0fdf4; border: 1px solid #86efac;
          border-radius: 10px; padding: 7px 13px;
          color: #15803d; font-size: 0.76rem; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
          font-family: 'Plus Jakarta Sans', sans-serif; white-space: nowrap; flex-shrink: 0;
        }
        .hdr-refresh-btn:hover {
          background: #dcfce7; border-color: #4ade80;
          box-shadow: 0 4px 10px rgba(22,163,74,0.2); transform: translateY(-1px);
        }
        .dark .hdr-refresh-btn {
          background: rgba(22,163,74,0.09); border-color: rgba(22,163,74,0.25); color: #4ade80;
        }

        /* ── Logout button ── */
        .hdr-logout {
          display: flex; align-items: center; gap: 6px;
          background: #fff5f5; border: 1px solid rgba(196,30,58,0.2);
          border-radius: 10px; padding: 7px 13px;
          color: #C41E3A; font-size: 0.76rem; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
          font-family: 'Plus Jakarta Sans', sans-serif; white-space: nowrap; flex-shrink: 0;
        }
        .hdr-logout:hover {
          background: #C41E3A; border-color: #C41E3A; color: #fff;
          box-shadow: 0 4px 12px rgba(196,30,58,0.25);
        }
        .dark .hdr-logout {
          background: rgba(196,30,58,0.08); border-color: rgba(196,30,58,0.22); color: #fca5a5;
        }
        .dark .hdr-logout:hover { background: rgba(196,30,58,0.22); color: #fff; }

        /* ── Spacer ── */
        .hdr-spacer { flex: 1; min-width: 0; }

        /* ── Responsive hide ── */
        @media (max-width: 900px) {
          .hdr-clock { display: none !important; }
          .hdr-req-pill { display: none !important; }
          .hdr-location { display: none !important; }
          .hdr-live { display: none !important; }
          .hdr-div.hdr-div-mid { display: none !important; }
          .hdr-refresh-btn span { display: none; }
          .hdr-refresh-btn { padding: 7px 10px; }
          .hdr-profile-btn span { display: none; }
          .hdr-profile-btn { padding: 7px 10px; }
        }
        @media (max-width: 640px) {
          .hdr-main-row { gap: 7px; padding: 7px 0; }
          .hdr-brand-name { font-size: 1.1rem; }
          .hdr-logout span { display: none; }
          .hdr-logout { padding: 7px 10px; }
        }
      `}</style>

      <header className="hdr-root">
        <div className="hdr-topline" />
        <div className="hdr-inner">
          <div className="hdr-main-row">

            {/* Logo */}
            <div className="hdr-logo-ring">
              <img src={logo} alt="RaktPort" style={{ width: 26, height: 26, objectFit: 'contain', borderRadius: 4 }} />
            </div>

            {/* Brand: RaktPort · BLOOD BANK + bank name below */}
            <div className="hdr-brand-block">
              <div className="hdr-brand-row-top">
                <span className="hdr-brand-name">RaktPort</span>
                <span className="hdr-brand-sub">Blood Bank</span>
              </div>
              {bloodBankName && (
                <div className="hdr-bank-name">
                  <Droplet size={9} style={{ color: '#C41E3A', flexShrink: 0 }} />
                  {bloodBankName}
                </div>
              )}
            </div>

            {/* Location — single, center */}
            <div className="hdr-div hdr-div-mid" />
            <span className="hdr-location">
              <MapPin size={11} style={{ color: '#C41E3A', flexShrink: 0 }} />
              {location}
            </span>
            <span className="hdr-live">
              <LiveDot /> LIVE
            </span>

            {/* Pending requests pill */}
            {bloodRequestsCount > 0 && (
              <span className="hdr-req-pill">
                <span style={{
                  width: 17, height: 17, borderRadius: '50%',
                  background: '#C41E3A', color: '#fff',
                  fontSize: 9, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {bloodRequestsCount > 9 ? '9+' : bloodRequestsCount}
                </span>
                Pending
              </span>
            )}

            <div className="hdr-spacer" />

            {/* Clock */}
            <div className="hdr-clock">
              <span className="hdr-clock-time">{timeStr}</span>
              <span className="hdr-clock-date">{dateStr}</span>
            </div>

            <div className="hdr-div" />

            {/* Refresh */}
            <button className="hdr-refresh-btn" onClick={() => window.location.reload()} title="Refresh Data">
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>

            <div className="hdr-div" />

            {/* Mode Toggle */}
            <ModeToggle />

            {/* Feedback */}
            <FeedbackWidget customTrigger={
              <button className="hdr-icon-btn" title="Feedback">
                <MessageSquarePlus size={14} />
              </button>
            } />

            {/* Notifications */}
            <button className="hdr-icon-btn" onClick={onNotificationClick} aria-label="Notifications">
              <Bell size={14} />
              {notificationCount > 0 && (
                <span className="hdr-notif-badge">{notificationCount > 9 ? '9+' : notificationCount}</span>
              )}
            </button>

            {/* Profile */}
            <button className="hdr-profile-btn" onClick={onProfileClick} title="Blood Bank Profile">
              <UserCircle size={15} />
              <span>Profile</span>
            </button>

            {/* Logout */}
            <button className="hdr-logout" onClick={onLogout}>
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
};