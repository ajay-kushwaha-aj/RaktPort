import React, { useState, useCallback, useEffect } from 'react';
import Swal from 'sweetalert2';
import {
  Loader2, PlusCircle, AlertTriangle, Activity, Droplet, Package,
  Clock, TrendingUp, TrendingDown, Users, CalendarCheck, Shield,
  CheckCircle2, Zap, ArrowRight, Heart, BarChart2, RefreshCw,
  Bell, Search, ChevronRight, Sparkles, Flame, LayoutDashboard
} from 'lucide-react';
import { toast } from 'sonner';
import { Appointment, BloodGroup } from '@/types/bloodbank';
import { BloodBankHeader } from '@/components/BloodBankHeader';
import { BloodBankNavigation, TabType } from '@/components/BloodBankNavigation';
import { NotificationDrawer } from '@/components/NotificationDrawer';
import { OverviewTab } from '@/components/tabs/OverviewTab';
import { InventoryTab } from '@/components/tabs/InventoryTab';
import { AppointmentsTab } from '@/components/tabs/AppointmentsTab';
import { DonationsTab } from '@/components/tabs/DonationsTab';
import { RedemptionsTab } from '@/components/tabs/RedemptionsTab';
import { VerifyTab } from '@/components/tabs/VerifyTab';
import { RtidVerifyTab } from '@/components/tabs/RtidVerifyTab';
import { ReportsTab } from '@/components/tabs/ReportsTab';
import { Button } from '@/components/ui/button';
import { generateRtid } from '@/lib/bloodbank-utils';
import { BloodRequestModal } from '@/components/modals/BloodRequestModal';
import { DonationModal } from '@/components/modals/DonationModal';
import { AppointmentModal } from '@/components/modals/AppointmentModal';
import { db } from '../firebase';
import {
  collection, getDocs, query, where, doc, getDoc,
  addDoc, updateDoc, Timestamp, setDoc,
} from 'firebase/firestore';
import { useBloodBankData } from '@/hooks/useBloodBankData';

/* ─── Styles ─────────────────────────────────────────── */
const dashStyles = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');

.bbd-root {
  font-family: 'DM Sans', sans-serif;
  min-height: 100vh;
  background: #fafaf8;
}
.dark .bbd-root { background: #120202; }

/* ── Page-level fade-in ── */
@keyframes bbd-fadein  { from{opacity:0; transform:translateY(10px);} to{opacity:1; transform:translateY(0);} }
@keyframes bbd-slidein { from{opacity:0; transform:translateX(-8px);} to{opacity:1; transform:translateX(0);} }
@keyframes bbd-pop     { 0%{transform:scale(0.94);opacity:0;} 100%{transform:scale(1);opacity:1;} }
@keyframes bbd-count   { from{transform:translateY(6px);opacity:0;} to{transform:translateY(0);opacity:1;} }
@keyframes bbd-pulse-soft { 0%,100%{opacity:1;} 50%{opacity:0.65;} }
@keyframes bbd-shimmer { 0%{background-position:-200% center;} 100%{background-position:200% center;} }
@keyframes bbd-float { 0%,100%{transform:translateY(0px);} 50%{transform:translateY(-6px);} }

.bbd-page-enter { animation: bbd-fadein 0.45s cubic-bezier(0.4,0,0.2,1) both; }
.bbd-slide-in   { animation: bbd-slidein 0.35s cubic-bezier(0.4,0,0.2,1) both; }

/* ── KPI Cards ── */
.bbd-kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
@media(min-width:1024px) { .bbd-kpi-grid { grid-template-columns: repeat(6, 1fr); } }
@media(max-width:640px)  { .bbd-kpi-grid { grid-template-columns: repeat(2, 1fr); gap:10px; } }

.bbd-kpi-card {
  background: #fff;
  border-radius: 16px;
  padding: 18px 16px 14px;
  border: 1px solid rgba(139,0,0,0.07);
  box-shadow: 0 2px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);
  transition: all 0.28s cubic-bezier(0.4,0,0.2,1);
  position: relative; overflow: hidden;
  animation: bbd-pop 0.4s cubic-bezier(0.4,0,0.2,1) both;
}
.bbd-kpi-card::before {
  content:''; position:absolute; top:0; left:0; right:0; height:3px;
  border-radius:16px 16px 0 0;
}
.bbd-kpi-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.09), 0 2px 6px rgba(0,0,0,0.06);
}
.dark .bbd-kpi-card { background:#1e0505; border-color:rgba(255,255,255,0.07); }

.bbd-kpi-card.c-crimson::before { background:linear-gradient(90deg,var(--clr-brand),#c41e3a); }
.bbd-kpi-card.c-emerald::before { background:linear-gradient(90deg,var(--clr-success),var(--clr-success)); }
.bbd-kpi-card.c-blue::before    { background:linear-gradient(90deg,#0284c7,#38bdf8); }
.bbd-kpi-card.c-amber::before   { background:linear-gradient(90deg,#d97706,#fbbf24); }
.bbd-kpi-card.c-purple::before  { background:linear-gradient(90deg,#7c3aed,#a78bfa); }
.bbd-kpi-card.c-rose::before    { background:linear-gradient(90deg,#e11d48,#fb7185); }

.bbd-kpi-icon {
  width:38px; height:38px; border-radius:10px;
  display:flex; align-items:center; justify-content:center;
  margin-bottom:10px;
  font-size:1.1rem;
}
.bbd-kpi-val {
  font-family: 'Outfit', sans-serif;
  font-size:1.75rem; font-weight:800; color:#0f0a0a; line-height:1;
  animation: bbd-count 0.5s ease both;
}
.dark .bbd-kpi-val { color:#fff5f5; }
.bbd-kpi-label { font-size:0.72rem; color:#9ca3af; font-weight:500; margin-top:3px; letter-spacing:0.03em; }
.bbd-kpi-trend { font-size:0.68rem; font-weight:600; display:flex; align-items:center; gap:3px; margin-top:6px; }

/* ── Welcome Banner ── */
.bbd-welcome {
  background: linear-gradient(135deg,var(--clr-brand) 0%,#a00000 50%,#7b0000 100%);
  border-radius: 20px;
  padding: 24px 28px;
  position: relative; overflow: hidden;
  margin-bottom: 20px;
}
.bbd-welcome::before {
  content:''; position:absolute; right:-40px; top:-40px;
  width:220px; height:220px;
  background:radial-gradient(circle,rgba(255,255,255,0.07) 0%,transparent 65%);
  border-radius:50%;
}
.bbd-welcome::after {
  content:''; position:absolute; left:-30px; bottom:-50px;
  width:180px; height:180px;
  background:radial-gradient(circle,rgba(255,255,255,0.04) 0%,transparent 60%);
  border-radius:50%;
}
.bbd-welcome-title { font-family:'Outfit',sans-serif; font-size:1.35rem; font-weight:800; color:#fff; margin-bottom:4px; }
.bbd-welcome-sub   { font-size:0.8rem; color:rgba(255,210,200,0.8); font-weight:400; }
.bbd-welcome-date  { font-size:0.72rem; color:rgba(255,255,255,0.5); font-weight:500; margin-top:2px; }

/* ── Blood Inventory Mini Grid ── */
.bbd-inv-grid {
  display:grid;
  grid-template-columns:repeat(8,1fr);
  gap:8px;
}
@media(max-width:640px) { .bbd-inv-grid { grid-template-columns:repeat(4,1fr); gap:6px; } }

.bbd-inv-cell {
  border-radius:12px; padding:10px 6px 8px;
  text-align:center; border:1.5px solid;
  transition:all 0.25s ease; cursor:pointer;
  position:relative; overflow:hidden;
}
.bbd-inv-cell:hover { transform:translateY(-2px) scale(1.03); }
.bbd-inv-cell::after { content:''; position:absolute; bottom:0; left:0; right:0; height:3px; border-radius:0 0 12px 12px; background:currentColor; opacity:0.25; }
.bbd-inv-group { font-family:'Outfit',sans-serif; font-size:1rem; font-weight:800; line-height:1; margin-bottom:2px; }
.bbd-inv-units { font-size:1.1rem; font-weight:800; font-family:'Outfit',sans-serif; line-height:1; }
.bbd-inv-sub   { font-size:0.58rem; color:#9ca3af; font-weight:500; margin-top:1px; }
.bbd-inv-bar   { width:100%; height:3px; background:#e5e7eb; border-radius:999px; margin-top:5px; overflow:hidden; }
.bbd-inv-bar-fill { height:100%; border-radius:999px; transition:width 0.6s ease; }

/* ── Section Headers ── */
.bbd-section-hdr {
  display:flex; align-items:center; justify-content:space-between;
  margin-bottom:12px;
}
.bbd-section-title {
  font-family:'Outfit',sans-serif; font-size:0.95rem; font-weight:700; color:#1a0a0a;
  display:flex; align-items:center; gap:7px;
}
.dark .bbd-section-title { color:#fff5f5; }
.bbd-section-link { font-size:0.75rem; color:var(--clr-brand); font-weight:600; cursor:pointer; display:flex; align-items:center; gap:3px; transition:gap 0.2s; }
.bbd-section-link:hover { gap:6px; }

/* ── Quick Actions ── */
.bbd-actions-grid {
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:10px;
}
@media(min-width:768px) { .bbd-actions-grid { grid-template-columns:repeat(4,1fr); } }

.bbd-action-card {
  background:#fff; border-radius:14px; padding:16px 14px 14px;
  border:1.5px solid rgba(139,0,0,0.08);
  cursor:pointer; transition:all 0.25s cubic-bezier(0.4,0,0.2,1);
  display:flex; flex-direction:column; align-items:flex-start; gap:8px;
  box-shadow:0 1px 4px rgba(0,0,0,0.04);
  position:relative; overflow:hidden;
  text-align:left;
}
.bbd-action-card::before {
  content:''; position:absolute; bottom:-20px; right:-20px;
  width:70px; height:70px; border-radius:50%;
  opacity:0.06; transition:all 0.3s;
}
.bbd-action-card:hover { transform:translateY(-3px); box-shadow:0 8px 20px rgba(139,0,0,0.12); border-color:rgba(139,0,0,0.2); }
.bbd-action-card:hover::before { opacity:0.12; transform:scale(1.3); }
.dark .bbd-action-card { background:#1e0505; border-color:rgba(255,255,255,0.07); }
.bbd-action-icon { width:36px; height:36px; border-radius:9px; display:flex; align-items:center; justify-content:center; }
.bbd-action-title { font-size:0.82rem; font-weight:700; color:#1a0a0a; }
.dark .bbd-action-title { color:#fff5f5; }
.bbd-action-sub { font-size:0.68rem; color:#9ca3af; font-weight:400; margin-top:-4px; }

/* ── Recent Activity ── */
.bbd-activity-item {
  display:flex; align-items:center; gap:12px; padding:10px 0;
  border-bottom:1px solid rgba(139,0,0,0.06);
  transition:all 0.2s;
  animation: bbd-fadein 0.3s ease both;
}
.bbd-activity-item:last-child { border-bottom:none; }
.bbd-activity-item:hover { padding-left:4px; }
.bbd-activity-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.bbd-activity-text { flex:1; min-width:0; }
.bbd-activity-label { font-size:0.8rem; font-weight:500; color:#374151; }
.dark .bbd-activity-label { color:#e5e7eb; }
.bbd-activity-sub { font-size:0.68rem; color:#9ca3af; margin-top:1px; }
.bbd-activity-time { font-size:0.65rem; color:#d1d5db; font-weight:500; flex-shrink:0; white-space:nowrap; }

/* ── Appointment card ── */
.bbd-appt-card {
  background:#fff; border:1.5px solid rgba(139,0,0,0.08);
  border-radius:14px; padding:14px; margin-bottom:8px;
  display:flex; align-items:center; gap:12px;
  transition:all 0.25s; cursor:pointer;
  box-shadow:0 1px 4px rgba(0,0,0,0.04);
}
.bbd-appt-card:hover { transform:translateX(3px); box-shadow:0 4px 14px rgba(139,0,0,0.1); border-color:rgba(139,0,0,0.2); }
.dark .bbd-appt-card { background:#1e0505; border-color:rgba(255,255,255,0.07); }
.bbd-appt-date { width:44px; height:44px; border-radius:10px; background:linear-gradient(135deg,var(--clr-brand),#b30000); color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; flex-shrink:0; font-family:'Outfit',sans-serif; }
.bbd-appt-dd { font-size:1rem; font-weight:800; line-height:1; }
.bbd-appt-mo { font-size:0.52rem; font-weight:600; opacity:0.75; letter-spacing:0.05em; text-transform:uppercase; }

/* ── Alert Banner ── */
.bbd-alert {
  border-radius:14px; padding:14px 16px;
  display:flex; align-items:flex-start; gap:12px;
  animation:bbd-pulse-soft 2s ease-in-out infinite;
}
.bbd-alert.critical { background:#fff0f0; border:1.5px solid #fca5a5; }
.bbd-alert.warning  { background:#fffbeb; border:1.5px solid #fcd34d; }

/* ── Floating Action ── */
.bbd-fab {
  position:fixed; bottom:24px; right:24px; z-index:50;
  width:54px; height:54px; border-radius:50%;
  background:linear-gradient(135deg,var(--clr-brand),#c41e3a);
  color:#fff; border:none; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 6px 20px rgba(139,0,0,0.4), 0 2px 6px rgba(0,0,0,0.15);
  transition:all 0.3s cubic-bezier(0.4,0,0.2,1);
  animation:bbd-float 3s ease-in-out infinite;
}
.bbd-fab:hover { transform:scale(1.1) translateY(-2px); box-shadow:0 10px 28px rgba(139,0,0,0.5); animation:none; }

/* ── White Cards ── */
.bbd-card {
  background:#fff; border-radius:18px;
  border:1px solid rgba(139,0,0,0.07);
  box-shadow:0 2px 10px rgba(0,0,0,0.04);
}
.dark .bbd-card { background:#1e0505; border-color:rgba(255,255,255,0.07); }

/* ── Stat Sparkline Placeholder ── */
.bbd-sparkline { width:60px; height:24px; }

/* ── Search Bar ── */
.bbd-search { 
  background:#f8f5f5; border:1.5px solid rgba(139,0,0,0.1); border-radius:10px;
  padding:8px 12px 8px 36px; font-size:0.8rem; color:#374151; 
  transition:all 0.2s; outline:none; width:100%; font-family:'DM Sans',sans-serif;
}
.bbd-search:focus { border-color:rgba(139,0,0,0.35); background:#fff; box-shadow:0 0 0 3px rgba(139,0,0,0.08); }
`;

/* ─── Types ─────────────────────────────────────────── */
const BLOOD_GROUPS = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];

const BG_COLORS: Record<string, { bg:string; text:string; border:string; bar:string }> = {
  'A+': { bg:'#fff5f5', text:'#b91c1c', border:'#fca5a5', bar:'var(--clr-emergency)' },
  'A-': { bg:'#fff1f2', text:'#be185d', border:'#fda4af', bar:'#f43f5e' },
  'B+': { bg:'#eff6ff', text:'#1d4ed8', border:'#93c5fd', bar:'var(--clr-info)' },
  'B-': { bg:'#f0f9ff', text:'#0369a1', border:'#7dd3fc', bar:'#0ea5e9' },
  'O+': { bg:'#f0fdf4', text:'#166534', border:'#86efac', bar:'#22c55e' },
  'O-': { bg:'#f0fdfa', text:'#0f766e', border:'#5eead4', bar:'#14b8a6' },
  'AB+':{ bg:'#faf5ff', text:'#7e22ce', border:'#c4b5fd', bar:'#8b5cf6' },
  'AB-':{ bg:'#f5f3ff', text:'#6d28d9', border:'#ddd6fe', bar:'#7c3aed' },
};

function getLevel(units: number) {
  if (units >= 50) return { label:'Good',    cls:'text-emerald-600', barClass:'bg-emerald-500' };
  if (units >= 30) return { label:'Moderate', cls:'text-[var(--clr-info)]',    barClass:'bg-[var(--clr-info)]'    };
  if (units >= 10) return { label:'Low',      cls:'text-amber-600',   barClass:'bg-amber-500'   };
  return                    { label:'Critical', cls:'text-[var(--clr-emergency)]',    barClass:'bg-[var(--clr-emergency)]'     };
}

/* ─── Premium Overview ─────────────────────────────── */
interface PremiumOverviewProps {
  kpi: any;
  bloodBankData: any;
  inventory: any;
  appointments: any[];
  donations: any[];
  criticalGroups: string[];
  onNavigate: (tab: TabType) => void;
  onAppointmentOpen: () => void;
  onDonationOpen: () => void;
  onRefresh: () => void;
}

function PremiumOverview({
  kpi, bloodBankData, inventory, appointments, donations,
  criticalGroups, onNavigate, onAppointmentOpen, onDonationOpen, onRefresh
}: PremiumOverviewProps) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  const upcomingToday = appointments.filter(a => {
    const d = a.date instanceof Date ? a.date : new Date(a.date);
    return d.toDateString() === now.toDateString() && a.status === 'Upcoming';
  });

  const recentDonations = [...donations]
    .sort((a,b) => {
      const da = a.date instanceof Date ? a.date : new Date(a.date);
      const db2 = b.date instanceof Date ? b.date : new Date(b.date);
      return db2.getTime() - da.getTime();
    })
    .slice(0, 5);

  const maxInv = Math.max(...BLOOD_GROUPS.map(bg => inventory?.[bg]?.available || 0), 1);

  const kpiCards = [
    { label:'Total Inventory', val: kpi.totalInventory,     icon:'🗃️', cls:'c-crimson', trend:null,    subtext:'units stored'  },
    { label:'Available Units',  val: kpi.availableUnits,     icon:'✅', cls:'c-emerald', trend:'up',    subtext:'ready to use'  },
    { label:'Today\'s Appts',   val: kpi.todayAppointments,  icon:'📅', cls:'c-blue',    trend:null,    subtext:'scheduled'     },
    { label:'Donations',        val: kpi.totalDonations,     icon:'🩸', cls:'c-amber',   trend:'up',    subtext:'all time'      },
    { label:'Redemptions',      val: kpi.totalRedemptions,   icon:'🔄', cls:'c-purple',  trend:null,    subtext:'fulfilled'     },
    { label:'Blood Requests',   val: kpi.totalBloodRequests, icon:'🏥', cls:'c-rose',    trend: kpi.totalBloodRequests > 0 ? 'up' : null, subtext:'pending'     },
  ];

  const quickActions = [
    { icon:'📅', label:'New Appointment',   sub:'Schedule a donor',  color:'var(--clr-brand)', bg:'#fff5f5',  action: onAppointmentOpen },
    { icon:'🩸', label:'Record Donation',   sub:'Walk-in / Check-in',color:'var(--clr-emergency)', bg:'#fff0f0',  action: onDonationOpen    },
    { icon:'✅', label:'Verify & Redeem',   sub:'RTID verification', color:'var(--clr-success)', bg:'#f0fdf4',  action: () => onNavigate('verify')     },
    { icon:'📊', label:'View Reports',      sub:'Analytics & export',color:'#0284c7', bg:'#f0f9ff',  action: () => onNavigate('reports')    },
  ];

  return (
    <div className="bbd-page-enter space-y-5">

      {/* Critical Alert */}
      {criticalGroups.length > 0 && (
        <div className="bbd-alert critical">
          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 text-lg">🚨</div>
          <div className="flex-1">
            <p className="text-sm font-bold text-red-800">Critical Blood Shortage</p>
            <p className="text-xs text-[var(--clr-emergency)] mt-0.5">
              {criticalGroups.join(', ')} below 10 units. Immediate procurement required.
            </p>
          </div>
          <button onClick={() => onNavigate('inventory')} className="text-xs font-bold text-red-700 bg-red-100 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors whitespace-nowrap flex-shrink-0">
            View Inventory →
          </button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="bbd-welcome">
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="bbd-welcome-sub">{greeting} 👋</p>
              <h2 className="bbd-welcome-title mt-1">
                {bloodBankData?.fullName || 'Blood Bank'}
              </h2>
              <p className="bbd-welcome-date">{dateStr}</p>
              {upcomingToday.length > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <span className="inline-flex items-center gap-1.5 bg-white/15 text-white/90 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20">
                    <CalendarCheck className="w-3 h-3" />
                    {upcomingToday.length} appointment{upcomingToday.length > 1 ? 's' : ''} today
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={onAppointmentOpen}
                className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/25 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-100"
              >
                <PlusCircle className="w-4 h-4" />
                Quick Appointment
              </button>
              <button
                onClick={onRefresh}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white/80 text-sm px-3 py-2 rounded-xl transition-all"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div>
        <div className="bbd-section-hdr">
          <span className="bbd-section-title">
            <BarChart2 className="w-4 h-4 text-red-700" /> Key Metrics
          </span>
        </div>
        <div className="bbd-kpi-grid">
          {kpiCards.map((m, i) => (
            <div
              key={m.label}
              className={`bbd-kpi-card ${m.cls}`}
              style={{ animationDelay: `${i * 0.07}s` }}
            >
              <div className="bbd-kpi-icon" style={{ background: m.cls === 'c-crimson' ? '#fff0f0' : m.cls === 'c-emerald' ? '#f0fdf4' : m.cls === 'c-blue' ? '#eff6ff' : m.cls === 'c-amber' ? '#fffbeb' : m.cls === 'c-purple' ? '#faf5ff' : '#fff0f4' }}>
                <span className="text-lg">{m.icon}</span>
              </div>
              <div className="bbd-kpi-val">{m.val.toLocaleString()}</div>
              <div className="bbd-kpi-label">{m.label}</div>
              <div className="bbd-kpi-trend" style={{ color: m.trend === 'up' ? 'var(--clr-success)' : '#9ca3af' }}>
                {m.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                <span>{m.subtext}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main 2-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left column (2/3) */}
        <div className="lg:col-span-2 space-y-5">

          {/* Blood Inventory */}
          <div className="bbd-card p-5">
            <div className="bbd-section-hdr">
              <span className="bbd-section-title">
                <Droplet className="w-4 h-4 text-red-700 fill-red-600" /> Blood Inventory
              </span>
              <button onClick={() => onNavigate('inventory')} className="bbd-section-link">
                Full View <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="bbd-inv-grid">
              {BLOOD_GROUPS.map(bg => {
                const inv = inventory?.[bg] || { total:0, available:0 };
                const units = inv.available;
                const c = BG_COLORS[bg];
                const level = getLevel(units);
                const pct = maxInv > 0 ? Math.min((units / Math.max(maxInv, 50)) * 100, 100) : 0;
                return (
                  <div
                    key={bg}
                    className="bbd-inv-cell"
                    style={{ background:c.bg, borderColor:c.border, color:c.text }}
                    onClick={() => onNavigate('inventory')}
                    title={`${bg}: ${units} available / ${inv.total} total`}
                  >
                    <div className="bbd-inv-group" style={{color:c.text}}>{bg}</div>
                    <div className="bbd-inv-units" style={{color:c.text}}>{units}</div>
                    <div className="bbd-inv-sub">{level.label}</div>
                    <div className="bbd-inv-bar">
                      <div className="bbd-inv-bar-fill" style={{width:`${pct}%`, background:c.bar}} />
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-gray-100">
              {[
                { label:'Critical (<10)', color:'var(--clr-emergency)' },
                { label:'Low (<30)',       color:'#f59e0b' },
                { label:'Moderate (<50)', color:'var(--clr-info)' },
                { label:'Good (50+)',      color:'#22c55e' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{background:l.color}} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <div className="bbd-section-hdr">
              <span className="bbd-section-title"><Zap className="w-4 h-4 text-amber-500" /> Quick Actions</span>
            </div>
            <div className="bbd-actions-grid">
              {quickActions.map((a, i) => (
                <button
                  key={a.label}
                  className="bbd-action-card"
                  onClick={a.action}
                  style={{'--action-color': a.color} as any}
                >
                  <style>{`.bbd-action-card:nth-child(${i+1})::before { background:${a.color}; }`}</style>
                  <div className="bbd-action-icon" style={{background:a.bg}}>
                    <span className="text-lg">{a.icon}</span>
                  </div>
                  <div>
                    <div className="bbd-action-title">{a.label}</div>
                    <div className="bbd-action-sub">{a.sub}</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 mt-auto self-end" />
                </button>
              ))}
            </div>
          </div>

          {/* Recent Donations */}
          <div className="bbd-card p-5">
            <div className="bbd-section-hdr">
              <span className="bbd-section-title"><Activity className="w-4 h-4 text-red-700" /> Recent Donations</span>
              <button onClick={() => onNavigate('donations')} className="bbd-section-link">
                All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {recentDonations.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2 opacity-30">🩸</div>
                <p className="text-sm text-gray-400 font-medium">No donations yet</p>
                <button onClick={onDonationOpen} className="mt-3 text-xs text-[var(--clr-emergency)] font-semibold hover:underline">Record first donation →</button>
              </div>
            ) : (
              recentDonations.map((d, i) => {
                const bgCols = BG_COLORS[d.bloodGroup] || BG_COLORS['O+'];
                const date = d.date instanceof Date ? d.date : new Date(d.date);
                const timeAgo = (() => {
                  const diff = Date.now() - date.getTime();
                  const mins = Math.floor(diff / 60000);
                  const hrs  = Math.floor(diff / 3600000);
                  const days = Math.floor(diff / 86400000);
                  if (days > 0)   return `${days}d ago`;
                  if (hrs > 0)    return `${hrs}h ago`;
                  if (mins >= 0)  return `${mins}m ago`;
                  return 'just now';
                })();
                return (
                  <div key={d.dRtid || i} className="bbd-activity-item" style={{animationDelay:`${i*0.05}s`}}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-black"
                      style={{background:bgCols.bg, color:bgCols.text, border:`1px solid ${bgCols.border}`}}>
                      {d.bloodGroup}
                    </div>
                    <div className="bbd-activity-text">
                      <div className="bbd-activity-label truncate">{d.donorName || 'Anonymous Donor'}</div>
                      <div className="bbd-activity-sub">{d.dRtid || '—'} · {d.component || 'Whole Blood'}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="bbd-activity-time">{timeAgo}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        d.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                        d.status === 'REDEEMED'  ? 'bg-purple-100 text-purple-700' :
                        d.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>{d.status}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column (1/3) */}
        <div className="space-y-5">

          {/* Inventory Summary Card */}
          <div className="bbd-card p-5">
            <div className="bbd-section-hdr">
              <span className="bbd-section-title"><Package className="w-4 h-4 text-[var(--clr-info)]" /> Stock Summary</span>
            </div>
            <div className="space-y-3">
              {[
                { label:'Total Units',     val: kpi.totalInventory,   color:'var(--clr-brand)', icon:'📦' },
                { label:'Available',       val: kpi.availableUnits,   color:'var(--clr-success)', icon:'✅' },
                { label:'Reserved',        val: Math.max(0, kpi.totalInventory - kpi.availableUnits), color:'#d97706', icon:'🔒' },
                { label:'Critical Groups', val: criticalGroups.length, color: criticalGroups.length > 0 ? 'var(--clr-emergency)' : '#6b7280', icon:'🚨' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-500 flex items-center gap-2">
                    <span>{s.icon}</span>{s.label}
                  </span>
                  <span className="text-sm font-bold" style={{color:s.color}}>{s.val}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="w-full mt-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-red-800 to-red-600 rounded-xl hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              Manage Inventory →
            </button>
          </div>

          {/* Today's Appointments */}
          <div className="bbd-card p-5">
            <div className="bbd-section-hdr">
              <span className="bbd-section-title"><CalendarCheck className="w-4 h-4 text-[var(--clr-info)]" /> Today's Appointments</span>
              <button onClick={() => onNavigate('appointments')} className="bbd-section-link">
                All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {upcomingToday.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-3xl opacity-25 mb-2">📅</div>
                <p className="text-xs text-gray-400">No appointments today</p>
                <button onClick={onAppointmentOpen} className="mt-2 text-xs text-[var(--clr-info)] font-semibold hover:underline">Schedule one →</button>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {upcomingToday.map((a, i) => {
                  const date = a.date instanceof Date ? a.date : new Date(a.date);
                  const bgc = BG_COLORS[a.bloodGroup] || BG_COLORS['O+'];
                  return (
                    <div key={a.appointmentRtid || i} className="bbd-appt-card">
                      <div className="bbd-appt-date">
                        <span className="bbd-appt-dd">{date.getDate()}</span>
                        <span className="bbd-appt-mo">{date.toLocaleString('default',{month:'short'})}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{a.donorName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded" style={{background:bgc.bg, color:bgc.text}}>{a.bloodGroup}</span>
                          <span className="text-[10px] text-gray-400">{a.time || ''}</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-blue-50 text-[var(--clr-info)] font-semibold px-2 py-1 rounded-full flex-shrink-0">Upcoming</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Fulfillment Rate */}
          <div className="bbd-card p-5">
            <div className="bbd-section-hdr">
              <span className="bbd-section-title"><Flame className="w-4 h-4 text-amber-500" /> Fulfillment Rate</span>
            </div>
            <div className="text-center py-3">
              {(() => {
                const rate = kpi.totalBloodRequests > 0
                  ? Math.round((kpi.totalRedemptions / kpi.totalBloodRequests) * 100)
                  : 0;
                const color = rate >= 80 ? 'var(--clr-success)' : rate >= 50 ? '#d97706' : 'var(--clr-emergency)';
                return (
                  <>
                    <div className="relative w-24 h-24 mx-auto mb-3">
                      <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                        <circle
                          cx="18" cy="18" r="15.9" fill="none"
                          stroke={color} strokeWidth="3"
                          strokeDasharray={`${rate * 0.999}, 100`}
                          strokeLinecap="round"
                          style={{transition:'stroke-dasharray 1s ease'}}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-black" style={{color, fontFamily:'Outfit,sans-serif'}}>{rate}%</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {kpi.totalRedemptions} of {kpi.totalBloodRequests} requests fulfilled
                    </p>
                  </>
                );
              })()}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <div className="text-lg font-black text-green-700" style={{fontFamily:'Outfit,sans-serif'}}>{kpi.totalRedemptions}</div>
                <div className="text-[10px] text-[var(--clr-success)] font-medium">Redeemed</div>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <div className="text-lg font-black text-red-700" style={{fontFamily:'Outfit,sans-serif'}}>{Math.max(0, kpi.totalBloodRequests - kpi.totalRedemptions)}</div>
                <div className="text-[10px] text-[var(--clr-emergency)] font-medium">Pending</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ─── Main Dashboard Component ─────────────────────── */
export const BloodBankDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const {
    loading, bloodBankData, inventory, appointments, donations,
    redemptions, bloodRequests, notifications, bloodBankId, kpi, criticalGroups
  } = useBloodBankData();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [actionLoading, setActionLoading] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [bloodRequestModalOpen, setBloodRequestModalOpen] = useState(false);
  const [donationModalOpen, setDonationModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [checkInData, setCheckInData] = useState<Appointment | undefined>(undefined);
  const [tabKey, setTabKey] = useState(0); // For animation reset

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setTabKey(k => k + 1);
  }, []);

  const handleLogoutConfirm = () => {
    Swal.fire({
      title:'Logout?', text:'Are you sure you want to logout?', icon:'warning',
      showCancelButton:true, confirmButtonColor:'#d33', cancelButtonColor:'#3085d6',
      confirmButtonText:'Yes, logout!'
    }).then(result => {
      if (result.isConfirmed) { localStorage.clear(); onLogout(); }
    });
  };

  const handleCheckIn = (appointment: Appointment) => {
    setCheckInData(appointment);
    setDonationModalOpen(true);
  };

  /* ── All handlers kept identical to original ── */
  const handleRegisterAppointment = async (data: any) => {
    if (!bloodBankId) { toast.error('Blood Bank ID not found'); return; }
    setActionLoading(true);
    try {
      const appRtid = generateRtid('A');
      let appointmentDate: Timestamp;
      if (data.date instanceof Date)           appointmentDate = Timestamp.fromDate(data.date);
      else if (typeof data.date === 'string')  appointmentDate = Timestamp.fromDate(new Date(data.date));
      else                                     appointmentDate = Timestamp.fromDate(new Date());

      await addDoc(collection(db, 'appointments'), {
        rtid: appRtid, donorName:data.donorName||'', mobile:data.mobile||'',
        gender:data.gender||'Male', bloodGroup:data.bloodGroup||'O+',
        date:appointmentDate, time:data.time||'10:00',
        bloodBankId, bloodBankName:bloodBankData?.fullName||'Blood Bank',
        status:'Upcoming', createdAt:Timestamp.now(),
        district:bloodBankData?.district||'', pincode:bloodBankData?.pincode||'',
      });
      toast.success('Appointment Scheduled', { description:`${data.donorName} - ${appRtid}` });
      setAppointmentModalOpen(false);
      setTimeout(() => handleTabChange('appointments'), 500);
    } catch (err: any) {
      toast.error('Failed to schedule appointment', { description: err.message });
    } finally { setActionLoading(false); }
  };

  const handleDonation = async (data: any) => {
    if (!bloodBankId) { toast.error('Blood Bank ID not found'); return; }
    setActionLoading(true);
    try {
      const finalDonorName  = data.donorName || checkInData?.donorName || 'Unknown Donor';
      const finalBloodGroup = data.bloodGroup || checkInData?.bloodGroup || 'O+';
      const finalMobile     = data.mobile || checkInData?.mobile || '';
      let dRtid: string;
      if (checkInData && checkInData.appointmentRtid) dRtid = checkInData.appointmentRtid;
      else dRtid = generateRtid('D');
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      let linkedHRTID = null, patientName = null, hospitalName = null;
      if (data.donationType === 'H-RTID-Linked Donation' && data.hRtid && data.hRtidData) {
        linkedHRTID = data.hRtid; patientName = data.hRtidData.patientName; hospitalName = data.hRtidData.hospitalName;
      }
      const donationRef = doc(db, 'donations', dRtid);
      const existingDonation = await getDoc(donationRef);
      if (existingDonation.exists()) {
        await updateDoc(donationRef, {
          status:'AVAILABLE', donationType:data.donationType||'Regular', component:data.component||'Whole Blood',
          otp, actualDonationDate:Timestamp.now(), hRtid:linkedHRTID, linkedHrtid:linkedHRTID,
          patientName, hospitalName, linkedDate:linkedHRTID?Timestamp.now():null,
          impactTimeline:{donated:Timestamp.now(),linkedToRequest:linkedHRTID?Timestamp.now():null,usedByPatient:null,creditIssued:null},
          updatedAt:Timestamp.now()
        });
      } else {
        await setDoc(donationRef, {
          rtid:dRtid, dRtid, bloodBankId, bloodBankName:bloodBankData?.fullName||'Blood Bank',
          donorName:finalDonorName, donorMobile:finalMobile, bloodGroup:finalBloodGroup,
          donationType:data.donationType||'Regular', component:data.component||'Whole Blood',
          otp, status:'AVAILABLE', date:Timestamp.now(), createdAt:Timestamp.now(),
          donationLocation:bloodBankData?.district||'Blood Bank', city:bloodBankData?.district||'Unknown',
          hRtid:linkedHRTID, linkedHrtid:linkedHRTID, patientName, hospitalName,
          linkedDate:linkedHRTID?Timestamp.now():null,
          impactTimeline:{donated:Timestamp.now(),linkedToRequest:linkedHRTID?Timestamp.now():null,usedByPatient:null,creditIssued:null},
          appointmentRtid:checkInData?.appointmentRtid||null, donorId:checkInData?.donorId||null
        });
      }
      const bg = finalBloodGroup as BloodGroup;
      const currentBgInv = inventory && inventory[bg] ? inventory[bg] : {total:0,available:0};
      await updateDoc(doc(db,'inventory',bloodBankId), {
        [bg]:{ total:(currentBgInv.total||0)+1, available:(currentBgInv.available||0)+1 }
      });
      if (checkInData?.appointmentRtid) {
        const aq = query(collection(db,'appointments'),where('rtid','==',checkInData.appointmentRtid));
        const as = await getDocs(aq);
        if (!as.empty) await updateDoc(as.docs[0].ref,{status:'Completed',completedAt:Timestamp.now()});
      }
      if (checkInData?.donorId) {
        const donorRef = doc(db,'users',checkInData.donorId);
        const donorDoc = await getDoc(donorRef);
        if (donorDoc.exists()) {
          const d2 = donorDoc.data();
          await updateDoc(donorRef,{
            donationsCount:(d2.donationsCount||0)+1, credits:(d2.credits||0)+1,
            lastDonationDate:new Date().toISOString()
          });
        }
      }
      if (linkedHRTID) {
        try {
          let reqRef: any = null, reqData: any = null;
          const reqSnap = await getDoc(doc(db,'bloodRequests',linkedHRTID));
          if (reqSnap.exists()) { reqRef=reqSnap.ref; reqData=reqSnap.data(); }
          else {
            for (const q of [query(collection(db,'bloodRequests'),where('linkedRTID','==',linkedHRTID)),query(collection(db,'bloodRequests'),where('rtid','==',linkedHRTID))]) {
              const qs = await getDocs(q);
              if (!qs.empty) { reqRef=qs.docs[0].ref; reqData=qs.docs[0].data(); break; }
            }
          }
          if (reqRef && reqData) {
            const nf = (reqData.unitsFulfilled||0)+1;
            await updateDoc(reqRef,{status:nf>=(reqData.unitsRequired||1)?'FULFILLED':'PARTIAL',unitsFulfilled:nf,fulfilledBy:bloodBankId,lastUpdated:Timestamp.now()});
          }
        } catch(_) {}
      }
      const msg = linkedHRTID ? `Linked to patient ${patientName}!` : `${finalDonorName} - D-RTID: ${dRtid}`;
      toast.success('Donation Recorded', { description: msg });
      setDonationModalOpen(false); setCheckInData(undefined);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      toast.error('Failed to record donation', { description: err.message });
    } finally { setActionLoading(false); }
  };

  const handleVerifyAndRedeem = async (hRtid: string, dRtid: string, otp: string) => {
    setActionLoading(true);
    try {
      let reqRef: any = null, reqData: any = null;
      let reqSnap = await getDoc(doc(db,'bloodRequests',hRtid));
      if (reqSnap.exists()) { reqRef=reqSnap.ref; reqData=reqSnap.data(); }
      else {
        for (const q of [query(collection(db,'bloodRequests'),where('linkedRTID','==',hRtid)),query(collection(db,'bloodRequests'),where('rtid','==',hRtid))]) {
          const qs = await getDocs(q); if (!qs.empty){reqSnap=qs.docs[0];reqRef=reqSnap.ref;reqData=reqSnap.data();break;}
        }
      }
      if (!reqData) throw new Error('Blood request not found.');
      
      let donRef: any=null, donData: any=null;
      if (dRtid) {
        let donSnap = await getDoc(doc(db,'donations',dRtid));
        if (donSnap.exists()){donRef=donSnap.ref;donData=donSnap.data();}
        else {
          for (const q of [query(collection(db,'donations'),where('rtid','==',dRtid)),query(collection(db,'donations'),where('dRtid','==',dRtid))]) {
            const qs=await getDocs(q);if(!qs.empty){donSnap=qs.docs[0];donRef=donSnap.ref;donData=donSnap.data();break;}
          }
        }
        if (!donData) throw new Error('Donation not found.');
        if (!['AVAILABLE','Donated'].includes(donData.status)) throw new Error(`Donation not available. Status: ${donData.status}`);
        if (donData.otp && donData.otp!==otp) throw new Error('Invalid OTP.');
      }

      setActionLoading(false);

      const confirmText = donData 
        ? `<div class="text-left text-sm space-y-3 mt-4">
             <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
               <p class="text-xs text-gray-500 uppercase font-bold mb-1">Patient Info</p>
               <p class="font-bold text-gray-800">${reqData.patientName}</p>
               <p class="text-xs text-gray-600 mt-1">Hospital: ${reqData.hospitalName || bloodBankData?.fullName || 'Hospital'}</p>
               <p class="text-xs text-gray-600">Request: <span class="font-bold text-[var(--clr-emergency)]">${reqData.bloodGroup}</span></p>
             </div>
             <div class="bg-blue-50 p-3 rounded-lg border border-blue-200">
               <p class="text-xs text-[var(--clr-info)]/70 uppercase font-bold mb-1">Donor Source</p>
               <p class="font-bold text-blue-900">${donData.donorName || 'Anonymous'}</p>
               <p class="text-xs text-blue-700 mt-1">D-RTID: <span class="font-mono">${donData.dRtid || donData.rtid}</span></p>
               <p class="text-xs text-blue-700">Donated: <span class="font-bold text-[var(--clr-emergency)]">${donData.bloodGroup}</span></p>
             </div>
           </div>`
        : `<div class="text-left text-sm space-y-3 mt-4">
             <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
               <p class="text-xs text-gray-500 uppercase font-bold mb-1">Patient Info</p>
               <p class="font-bold text-gray-800">${reqData.patientName}</p>
               <p class="text-xs text-gray-600 mt-1">Hospital: ${reqData.hospitalName || bloodBankData?.fullName || 'Hospital'}</p>
             </div>
           </div>`;

      const result = await Swal.fire({
        title: 'Confirm Redemption',
        html: confirmText,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: 'var(--clr-success)',
        cancelButtonColor: '#d1d5db',
        confirmButtonText: 'Yes, Complete Transfer',
        cancelButtonText: 'Cancel'
      });

      if (!result.isConfirmed) return;

      setActionLoading(true);

      if (donData) {
        await updateDoc(donRef,{status:'REDEEMED',hRtid,linkedHrtid:hRtid,redemptionDate:Timestamp.now(),redeemedAt:Timestamp.now(),patientName:reqData.patientName||'Patient',hospitalName:reqData.hospitalName||bloodBankData?.fullName||'Hospital',linkedDate:Timestamp.now(),usedDate:Timestamp.now()});
        const bg = donData.bloodGroup as BloodGroup;
        const cbi = inventory && inventory[bg] ? inventory[bg] : {total:0,available:0};
        await updateDoc(doc(db,'inventory',bloodBankId!),{[bg]:{total:cbi.total,available:Math.max(0,(cbi.available||0)-1)}});
        if (donData.donorId) {
          const dr=doc(db,'users',donData.donorId);const dd=await getDoc(dr);
          if(dd.exists()) await updateDoc(dr,{credits:(dd.data().credits||0)+1});
        }
      }
      const nf=(reqData.unitsFulfilled||0)+1,req2=reqData.unitsRequired||1;
      await updateDoc(reqRef,{status:nf>=req2?'REDEEMED':'PARTIAL',unitsFulfilled:nf,fulfilled:nf,redeemedAt:Timestamp.now(),scannedLocation:bloodBankData?.fullName||'Blood Bank',fulfilledBy:bloodBankId});
      toast.success('Redemption Successful! 🎉',{description:`${reqData.patientName} received ${nf} unit(s) of ${reqData.bloodGroup}`});
      setTimeout(()=>window.location.reload(),2000);
    } catch (err: any) {
      toast.error(err.message||'Redemption Failed');
    } finally { setActionLoading(false); }
  };

  const handleVerifyRtid = async (rtid: string) => {
    setActionLoading(true);
    try {
      let data: any=null, type='';
      if (rtid.toUpperCase().includes('H-RTID')||rtid.toUpperCase().startsWith('H')) {
        for (const q of [getDoc(doc(db,'bloodRequests',rtid)),getDocs(query(collection(db,'bloodRequests'),where('linkedRTID','==',rtid))),getDocs(query(collection(db,'bloodRequests'),where('rtid','==',rtid)))]) {
          const r=await q;
          if ('exists' in r&&r.exists()){data=r.data();type='Blood Request';break;}
          else if ('empty' in r&&!r.empty){data=r.docs[0].data();type='Blood Request';break;}
        }
      } else {
        for (const q of [getDoc(doc(db,'donations',rtid)),getDocs(query(collection(db,'donations'),where('rtid','==',rtid))),getDocs(query(collection(db,'donations'),where('dRtid','==',rtid)))]) {
          const r=await q;
          if ('exists' in r&&r.exists()){data=r.data();type='Donation';break;}
          else if ('empty' in r&&!r.empty){data=r.docs[0].data();type='Donation';break;}
        }
      }
      if (!data) throw new Error('RTID not found');
      const sc=data.status==='AVAILABLE'?'text-[var(--clr-success)]':data.status==='REDEEMED'?'text-[var(--clr-emergency)]':'text-yellow-600';
      await Swal.fire({
        title:'✅ Verified', icon:'success', confirmButtonColor:'var(--clr-success)',
        html:`<div class="text-left space-y-3 p-4">
          <div class="bg-blue-50 p-3 rounded-lg border border-blue-200"><p class="text-sm text-gray-600 mb-1">Type</p><p class="font-bold text-lg">${type}</p></div>
          <div class="bg-gray-50 p-3 rounded-lg border border-gray-200"><p class="text-sm text-gray-600 mb-1">ID</p><p class="font-mono font-bold">${data.rtid||rtid}</p></div>
          <div class="bg-gray-50 p-3 rounded-lg border border-gray-200"><p class="text-sm text-gray-600 mb-1">Name</p><p class="font-semibold">${data.patientName||data.donorName||'N/A'}</p></div>
          <div class="bg-gray-50 p-3 rounded-lg border border-gray-200"><p class="text-sm text-gray-600 mb-1">Blood Group</p><p class="font-bold text-[var(--clr-emergency)] text-xl">${data.bloodGroup||'N/A'}</p></div>
          <div class="bg-gray-50 p-3 rounded-lg border border-gray-200"><p class="text-sm text-gray-600 mb-1">Status</p><p class="font-bold ${sc}">${data.status||'N/A'}</p></div>
        </div>`
      });
    } catch(err:any){ toast.error(err.message); }
    finally{ setActionLoading(false); }
  };

  /* Loading */
  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-red-100 border-t-red-700 animate-spin" />
        <Droplet className="absolute inset-0 m-auto w-6 h-6 text-red-700 fill-red-600" />
      </div>
      <p className="text-sm text-gray-500 font-medium animate-pulse">Loading Blood Bank Dashboard…</p>
    </div>
  );

  if (!bloodBankId) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
      <p className="text-gray-500 mb-6 text-center max-w-sm">Your account could not be verified as a Blood Bank. Please contact the administrator.</p>
      <Button onClick={onLogout}>Back to Login</Button>
    </div>
  );

  return (
    <>
      <style>{dashStyles}</style>
      <div className="bbd-root">

        {/* Header */}
        <BloodBankHeader
          onNotificationClick={() => setNotificationDrawerOpen(!notificationDrawerOpen)}
          notificationCount={notifications.filter(n => !n.read).length}
          bloodRequestsCount={bloodRequests.length}
          onLogout={handleLogoutConfirm}
          location={`${bloodBankData?.district||'…'}, ${bloodBankData?.pincode||'…'}`}
          bloodBankName={bloodBankData?.fullName}
        />

        {/* Navigation */}
        <BloodBankNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          appointmentCount={appointments.filter(a => a.status === 'Upcoming').length}
          requestCount={bloodRequests.length}
        />

        {/* Global Action Loading Overlay */}
        {actionLoading && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-center justify-center">
            <div className="bg-white rounded-2xl p-6 shadow-2xl flex items-center gap-4">
              <Loader2 className="w-7 h-7 animate-spin text-red-700" />
              <p className="text-sm font-semibold text-gray-700">Processing…</p>
            </div>
          </div>
        )}

        {/* Notifications Drawer */}
        <NotificationDrawer
          isOpen={notificationDrawerOpen}
          notifications={notifications}
          onClose={() => setNotificationDrawerOpen(false)}
        />

        {/* Main Content */}
        <main className="container mx-auto px-3 sm:px-5 py-5 sm:py-7 max-w-7xl">

          {/* Critical Alert Banner (non-overview tabs) */}
          {activeTab !== 'overview' && criticalGroups.length > 0 && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-sm text-red-800">
              <AlertTriangle className="w-4 h-4 text-[var(--clr-emergency)] flex-shrink-0" />
              <span><strong>Critical:</strong> {criticalGroups.join(', ')} below 30 units.</span>
              <button onClick={() => handleTabChange('inventory')} className="ml-auto text-xs font-bold text-red-700 hover:underline">View →</button>
            </div>
          )}

          {/* Tab content with key for animation */}
          <div key={tabKey} className="bbd-page-enter">

            {activeTab === 'overview' && (
              <PremiumOverview
                kpi={kpi}
                bloodBankData={bloodBankData}
                inventory={inventory}
                appointments={appointments}
                donations={donations}
                criticalGroups={criticalGroups}
                onNavigate={handleTabChange}
                onAppointmentOpen={() => setAppointmentModalOpen(true)}
                onDonationOpen={() => { setCheckInData(undefined); setDonationModalOpen(true); }}
                onRefresh={() => window.location.reload()}
              />
            )}

            {activeTab === 'inventory' && inventory && <InventoryTab inventory={inventory} />}

            {activeTab === 'appointments' && (
              <AppointmentsTab appointments={appointments} onCheckIn={handleCheckIn} />
            )}

            {activeTab === 'donations'   && <DonationsTab donations={donations} />}
            {activeTab === 'redemptions' && <RedemptionsTab redemptions={redemptions} />}
            {activeTab === 'verify'      && <VerifyTab onVerifyAndRedeem={handleVerifyAndRedeem} />}
            {activeTab === 'rtidVerify'  && <RtidVerifyTab onVerifyRtid={handleVerifyRtid} />}
            {activeTab === 'reports'     && (
              <ReportsTab inventory={inventory} donations={donations} redemptions={redemptions} criticalGroups={criticalGroups} />
            )}

            {activeTab === 'camps' && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4 opacity-30">⛺</div>
                <h2 className="text-xl font-bold text-gray-500 mb-2">Blood Donation Camps</h2>
                <p className="text-sm text-gray-400">Coming soon — organize & manage camps</p>
              </div>
            )}
          </div>
        </main>

        {/* Quick Appointment FAB (visible on all tabs) */}
        {activeTab !== 'overview' && (
          <button
            className="bbd-fab"
            onClick={() => setAppointmentModalOpen(true)}
            title="Quick Appointment"
          >
            <PlusCircle className="w-6 h-6" />
          </button>
        )}

        {/* Modals */}
        <BloodRequestModal
          isOpen={bloodRequestModalOpen}
          onClose={() => setBloodRequestModalOpen(false)}
          onSubmit={() => { toast.info('Inter-bank request not implemented yet'); setBloodRequestModalOpen(false); }}
        />

        <DonationModal
          key={checkInData ? `donation-${checkInData.appointmentRtid}` : 'new-donation'}
          isOpen={donationModalOpen}
          onClose={() => { setDonationModalOpen(false); setCheckInData(undefined); }}
          onSubmit={handleDonation}
          checkInData={checkInData}
        />

        <AppointmentModal
          isOpen={appointmentModalOpen}
          onClose={() => setAppointmentModalOpen(false)}
          onSubmit={handleRegisterAppointment}
        />
      </div>
    </>
  );
};

export default BloodBankDashboard;