// HospitalDashboard.tsx — Production-grade, NACO/MoHFW compliant, fully Firebase-integrated
// Redesigned with Outfit + DM Sans typography, refined crimson medical aesthetic
// All original Firebase logic preserved 100%

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Swal from "sweetalert2";
import QRious from "qrious";
import {
  Bell, LogOut, Plus, QrCode, Copy, Trash2, X, Printer, FileText,
  Activity, Droplet, Gift, CheckCircle, CheckCircle2, XCircle, Clock,
  Siren, FileDown, Phone, PieChart, AlertCircle, Search, Shield,
  MapPin, User, Stethoscope, Building2, AlertTriangle, ChevronDown,
  ChevronRight, TrendingUp, BarChart2, Calendar, RefreshCw, Zap,
  Heart, Package, Filter, Info, ArrowRight, BookOpen, ClipboardList,
  Hash, Timer, Sparkles, CheckSquare, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/sonner";
import logo from '../assets/raktport-logo.png';

import { db } from '../firebase';
import {
  collection, query, where, getDocs, addDoc, deleteDoc,
  doc, getDoc, updateDoc
} from 'firebase/firestore';

// @ts-ignore
import { BLOOD_GROUPS, generateRtid } from "@/lib/bloodbank-utils";

/* ═══════════════════════════════════════════════════════════════════
   GLOBAL STYLES
═══════════════════════════════════════════════════════════════════ */
const HD_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

:root {
  --hd-crimson: #8B0000;
  --hd-crimson-dark: #6b0000;
  --hd-crimson-light: #fff0f0;
  --hd-crimson-mid: #b30000;
  --hd-surface: #fafaf8;
  --hd-card: #ffffff;
  --hd-border: rgba(139,0,0,0.08);
  --hd-text: #111827;
  --hd-muted: #6b7280;
  --hd-shadow-sm: 0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.03);
  --hd-shadow-md: 0 4px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05);
  --hd-shadow-lg: 0 8px 28px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.06);
  --hd-font-display: 'Outfit', sans-serif;
  --hd-font-body: 'DM Sans', sans-serif;
}

.hd-root { font-family: var(--hd-font-body); background: var(--hd-surface); min-height: 100vh; }

/* ── Animations ── */
@keyframes hd-fade-up   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes hd-fade-in   { from{opacity:0} to{opacity:1} }
@keyframes hd-scale-in  { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
@keyframes hd-slide-r   { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
@keyframes hd-count-up  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes hd-pulse-ring { 0%{box-shadow:0 0 0 0 rgba(139,0,0,0.35)} 70%{box-shadow:0 0 0 8px rgba(139,0,0,0)} 100%{box-shadow:0 0 0 0 rgba(139,0,0,0)} }
@keyframes hd-shimmer   { 0%{background-position:-200% center} 100%{background-position:200% center} }
@keyframes hd-bounce-dot { 0%,100%{transform:scale(1)} 50%{transform:scale(1.3)} }
@keyframes hd-float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
@keyframes hd-spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

.hd-enter    { animation: hd-fade-up  0.45s cubic-bezier(0.4,0,0.2,1) both; }
.hd-enter-sm { animation: hd-scale-in 0.35s cubic-bezier(0.4,0,0.2,1) both; }
.hd-slide    { animation: hd-slide-r  0.38s cubic-bezier(0.4,0,0.2,1) both; }

/* Stagger helper */
.hd-s1 { animation-delay:0.04s } .hd-s2 { animation-delay:0.08s }
.hd-s3 { animation-delay:0.12s } .hd-s4 { animation-delay:0.16s }
.hd-s5 { animation-delay:0.20s } .hd-s6 { animation-delay:0.24s }

/* ── Header ── */
.hd-header {
  background: linear-gradient(135deg, #6b0000 0%, #8B0000 50%, #9e0000 100%);
  position: sticky; top: 0; z-index: 50;
  box-shadow: 0 4px 20px rgba(139,0,0,0.25);
}
.hd-header::before {
  content:''; position:absolute; inset:0; pointer-events:none;
  background: radial-gradient(ellipse at 10% 50%, rgba(255,255,255,0.06) 0%, transparent 55%),
              radial-gradient(ellipse at 90% 30%, rgba(255,255,255,0.04) 0%, transparent 40%);
}
.hd-header::after {
  content:''; position:absolute; bottom:0; left:0; right:0; height:1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
}
.hd-logo-frame {
  background: rgba(255,255,255,0.14); border: 1.5px solid rgba(255,255,255,0.24);
  border-radius: 13px; padding: 5px; flex-shrink: 0;
  transition: all 0.3s ease;
}
.hd-logo-frame:hover { background: rgba(255,255,255,0.22); transform: scale(1.04) rotate(-1deg); }
.hd-brand { font-family: var(--hd-font-display); font-weight:800; color:#fff; letter-spacing:-0.03em; line-height:1; }
.hd-hosp-name { font-size:0.78rem; color:rgba(255,205,185,0.9); font-weight:500; margin-top:2px; display:flex; align-items:center; gap:4px; }
.hd-loc-chip {
  background:rgba(255,255,255,0.11); border:1px solid rgba(255,255,255,0.2);
  border-radius:999px; padding:3px 10px; font-size:0.68rem; color:rgba(255,255,255,0.75); font-weight:500;
  display:flex; align-items:center; gap:4px; backdrop-filter:blur(6px); white-space:nowrap;
  transition: background 0.2s;
}
.hd-loc-chip:hover { background:rgba(255,255,255,0.19); }
.hd-hdr-btn {
  width:38px; height:38px; border-radius:10px;
  background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2);
  display:flex; align-items:center; justify-content:center;
  color:#fff; cursor:pointer; transition:all 0.2s; position:relative; flex-shrink:0;
}
.hd-hdr-btn:hover { background:rgba(255,255,255,0.2); transform:translateY(-1px); }
.hd-notif-badge {
  position:absolute; top:-5px; right:-5px; min-width:17px; height:17px;
  background:#ff3737; border:2px solid #8B0000; border-radius:999px;
  font-size:8px; font-weight:800; color:#fff;
  display:flex; align-items:center; justify-content:center; padding:0 3px;
  animation: hd-bounce-dot 1.4s ease-in-out infinite;
}
.hd-logout-btn {
  background:rgba(255,255,255,0.1); border:1.5px solid rgba(255,255,255,0.22);
  border-radius:9px; padding:6px 14px; color:#fff; font-size:0.78rem; font-weight:600;
  display:flex; align-items:center; gap:5px; cursor:pointer; transition:all 0.2s;
  font-family: var(--hd-font-body); white-space:nowrap;
}
.hd-logout-btn:hover { background:rgba(255,70,70,0.28); border-color:rgba(255,140,120,0.4); transform:translateY(-1px); }

/* ── Nav ── */
.hd-nav { background:#fff; border-bottom:1px solid rgba(139,0,0,0.07); box-shadow:0 2px 8px rgba(0,0,0,0.04); position:sticky; top:66px; z-index:40; }
@media(max-width:640px){ .hd-nav { top:58px; } }
.hd-nav-inner { display:flex; gap:2px; overflow-x:auto; padding:8px 16px; scrollbar-width:none; }
.hd-nav-inner::-webkit-scrollbar { display:none; }
.hd-nav-tab {
  display:flex; align-items:center; gap:6px; padding:7px 14px;
  border-radius:10px; font-size:0.78rem; font-weight:500; cursor:pointer;
  border:none; white-space:nowrap; transition:all 0.22s cubic-bezier(0.4,0,0.2,1);
  background:transparent; color:#6b7280; font-family:var(--hd-font-body); flex-shrink:0;
}
.hd-nav-tab:hover:not(.hd-nav-active) { background:rgba(139,0,0,0.05); color:#8B0000; }
.hd-nav-active {
  background:linear-gradient(135deg,#8B0000,#b30000); color:#fff !important;
  font-weight:600; box-shadow:0 3px 10px rgba(139,0,0,0.3); transform:translateY(-1px);
}

/* ── KPI Cards ── */
.hd-kpi-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
@media(min-width:640px)  { .hd-kpi-grid { grid-template-columns:repeat(3,1fr); } }
@media(min-width:1024px) { .hd-kpi-grid { grid-template-columns:repeat(5,1fr); } }

.hd-kpi {
  background:var(--hd-card); border-radius:16px; padding:18px 16px 14px;
  border:1px solid var(--hd-border); box-shadow:var(--hd-shadow-sm);
  transition:all 0.28s cubic-bezier(0.4,0,0.2,1); position:relative; overflow:hidden;
}
.hd-kpi::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; border-radius:16px 16px 0 0; }
.hd-kpi:hover { transform:translateY(-3px); box-shadow:var(--hd-shadow-md); border-color:rgba(139,0,0,0.15); }
.hd-kpi.k-red::before    { background:linear-gradient(90deg,#8B0000,#c41e3a); }
.hd-kpi.k-green::before  { background:linear-gradient(90deg,#059669,#10b981); }
.hd-kpi.k-blue::before   { background:linear-gradient(90deg,#0284c7,#38bdf8); }
.hd-kpi.k-amber::before  { background:linear-gradient(90deg,#d97706,#fbbf24); }
.hd-kpi.k-purple::before { background:linear-gradient(90deg,#7c3aed,#a78bfa); }
.hd-kpi-icon { width:36px; height:36px; border-radius:9px; display:flex; align-items:center; justify-content:center; margin-bottom:10px; }
.hd-kpi-val  { font-family:var(--hd-font-display); font-size:1.7rem; font-weight:800; color:#111827; line-height:1; animation:hd-count-up 0.5s ease both; }
.hd-kpi-lbl  { font-size:0.7rem; color:#9ca3af; font-weight:500; margin-top:3px; letter-spacing:0.02em; }
.hd-kpi-meta { font-size:0.65rem; color:#d1d5db; margin-top:5px; font-weight:500; }

/* ── Welcome Banner ── */
.hd-welcome {
  background:linear-gradient(135deg,#6b0000 0%,#8B0000 55%,#9e0000 100%);
  border-radius:20px; padding:24px 28px; position:relative; overflow:hidden; margin-bottom:20px;
}
.hd-welcome::before {
  content:''; position:absolute; right:-50px; top:-50px; width:220px; height:220px;
  background:radial-gradient(circle,rgba(255,255,255,0.07) 0%,transparent 65%); border-radius:50%;
}
.hd-welcome::after {
  content:''; position:absolute; left:-30px; bottom:-50px; width:160px; height:160px;
  background:radial-gradient(circle,rgba(255,255,255,0.04) 0%,transparent 60%); border-radius:50%;
}
.hd-welcome-title { font-family:var(--hd-font-display); font-size:1.3rem; font-weight:800; color:#fff; }
.hd-welcome-sub   { font-size:0.78rem; color:rgba(255,210,195,0.8); margin-top:2px; }

/* ── Section Headers ── */
.hd-sec-hdr  { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
.hd-sec-title { font-family:var(--hd-font-display); font-size:0.95rem; font-weight:700; color:#111827; display:flex; align-items:center; gap:7px; }
.hd-sec-link  { font-size:0.73rem; color:#8B0000; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:2px; transition:gap 0.2s; }
.hd-sec-link:hover { gap:5px; }

/* ── White Cards ── */
.hd-card { background:var(--hd-card); border-radius:18px; border:1px solid var(--hd-border); box-shadow:var(--hd-shadow-sm); }

/* ── Status Table Rows ── */
.hd-row { transition:all 0.2s; cursor:pointer; }
.hd-row:hover { background:#fdf8f8 !important; }

/* ── Urgency Chips ── */
.hd-urg { border-radius:999px; padding:3px 10px; font-size:0.68rem; font-weight:700; letter-spacing:0.03em; display:inline-flex; align-items:center; gap:4px; }
.hd-urg.emergency { background:#fef2f2; color:#b91c1c; border:1px solid #fca5a5; }
.hd-urg.urgent    { background:#fff7ed; color:#c2410c; border:1px solid #fdba74; }
.hd-urg.routine   { background:#f0fdf4; color:#15803d; border:1px solid #86efac; }

/* ── Status Chip ── */
.hd-status { border-radius:999px; padding:3px 10px; font-size:0.67rem; font-weight:700; display:inline-flex; align-items:center; gap:4px; }

/* ── Quick Actions ── */
.hd-qa-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
@media(min-width:640px) { .hd-qa-grid { grid-template-columns:repeat(4,1fr); } }
.hd-qa-card {
  background:#fff; border-radius:14px; padding:16px 14px; border:1.5px solid rgba(139,0,0,0.08);
  cursor:pointer; transition:all 0.25s cubic-bezier(0.4,0,0.2,1);
  display:flex; flex-direction:column; align-items:flex-start; gap:8px;
  box-shadow:0 1px 4px rgba(0,0,0,0.04); position:relative; overflow:hidden;
}
.hd-qa-card:hover { transform:translateY(-3px); box-shadow:0 8px 20px rgba(139,0,0,0.12); border-color:rgba(139,0,0,0.22); }
.hd-qa-icon { width:36px; height:36px; border-radius:9px; display:flex; align-items:center; justify-content:center; }
.hd-qa-title { font-size:0.8rem; font-weight:700; color:#111827; }
.hd-qa-sub   { font-size:0.67rem; color:#9ca3af; }

/* ── Activity Feed ── */
.hd-act-item { display:flex; align-items:flex-start; gap:10px; padding:9px 0; border-bottom:1px solid rgba(139,0,0,0.05); transition:padding 0.2s; }
.hd-act-item:last-child { border-bottom:none; }
.hd-act-item:hover { padding-left:4px; }

/* ── Timeline ── */
.hd-timeline { position:relative; padding-left:20px; }
.hd-timeline::before { content:''; position:absolute; left:7px; top:6px; bottom:6px; width:2px; background:linear-gradient(180deg,#8B0000,#f87171,transparent); border-radius:999px; }
.hd-tl-dot { position:absolute; left:-20px; top:3px; width:14px; height:14px; border-radius:50%; border:2px solid #8B0000; background:#fff; display:flex; align-items:center; justify-content:center; }
.hd-tl-dot.done { background:#8B0000; }
.hd-tl-item { position:relative; padding-bottom:14px; }
.hd-tl-item:last-child { padding-bottom:0; }

/* ── Validity Bar ── */
.hd-validity { height:4px; border-radius:999px; background:#e5e7eb; position:relative; overflow:hidden; margin-top:4px; }
.hd-validity-fill { height:100%; border-radius:999px; transition:width 0.6s ease; }

/* ── Fulfillment Progress ── */
.hd-prog { height:6px; background:#f3f4f6; border-radius:999px; overflow:hidden; margin-top:4px; }
.hd-prog-fill { height:100%; background:linear-gradient(90deg,#8B0000,#c41e3a); border-radius:999px; transition:width 0.6s ease; }

/* ── Search Bar ── */
.hd-search {
  background:#f8f5f5; border:1.5px solid rgba(139,0,0,0.1); border-radius:10px;
  padding:8px 12px 8px 36px; font-size:0.8rem; color:#374151;
  transition:all 0.2s; outline:none; width:100%; font-family:var(--hd-font-body);
}
.hd-search:focus { border-color:rgba(139,0,0,0.35); background:#fff; box-shadow:0 0 0 3px rgba(139,0,0,0.08); }

/* ── Floating New Request Button ── */
.hd-fab {
  position:fixed; bottom:24px; right:24px; z-index:50;
  background:linear-gradient(135deg,#8B0000,#c41e3a); color:#fff;
  border:none; border-radius:50px; padding:12px 20px;
  font-size:0.85rem; font-weight:700; font-family:var(--hd-font-body);
  display:flex; align-items:center; gap:8px; cursor:pointer;
  box-shadow:0 6px 20px rgba(139,0,0,0.4), 0 2px 6px rgba(0,0,0,0.15);
  transition:all 0.3s cubic-bezier(0.4,0,0.2,1);
  animation: hd-float 3s ease-in-out infinite;
}
.hd-fab:hover { transform:scale(1.05) translateY(-2px); box-shadow:0 10px 28px rgba(139,0,0,0.5); animation:none; }
@media(max-width:640px) { .hd-fab { bottom:16px; right:16px; padding:10px 16px; font-size:0.78rem; } }

/* ── Form Inputs ── */
.hd-input {
  width:100%; padding:10px 13px; border-radius:10px; border:1.5px solid #e5e7eb;
  font-size:0.83rem; font-family:var(--hd-font-body); color:#111827;
  background:#fff; outline:none; transition:all 0.2s;
}
.hd-input:focus { border-color:rgba(139,0,0,0.45); box-shadow:0 0 0 3px rgba(139,0,0,0.08); }
.hd-label { font-size:0.75rem; font-weight:600; color:#374151; display:block; margin-bottom:5px; }
.hd-required { color:#ef4444; margin-left:2px; }

/* ── Urgency Selector ── */
.hd-urg-selector { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
.hd-urg-opt {
  border-radius:12px; padding:12px 10px; border:2px solid #e5e7eb;
  cursor:pointer; transition:all 0.2s; text-align:center; background:#fff;
}
.hd-urg-opt:hover { border-color:rgba(139,0,0,0.3); }
.hd-urg-opt.sel-emergency { border-color:#ef4444; background:#fef2f2; }
.hd-urg-opt.sel-urgent    { border-color:#f97316; background:#fff7ed; }
.hd-urg-opt.sel-routine   { border-color:#22c55e; background:#f0fdf4; }
.hd-urg-emoji { font-size:1.4rem; margin-bottom:4px; }
.hd-urg-name  { font-size:0.72rem; font-weight:700; }
.hd-urg-time  { font-size:0.62rem; color:#9ca3af; margin-top:1px; }

/* ── Responsive ── */
@media(max-width:640px) {
  .hd-welcome { padding:18px 20px; }
  .hd-welcome-title { font-size:1.1rem; }
  .hd-kpi-val { font-size:1.4rem; }
  .hd-urg-selector { grid-template-columns:1fr 1fr 1fr; gap:6px; }
}

/* ── Print ── */
@media print {
  .no-print, .hd-header, .hd-nav, .hd-fab { display:none !important; }
  body > *:not(.print-content) { display:none !important; }
}
`;

/* ═══════════════════════════════════════════════════════════════════
   NACO / MoHFW COMPLIANT URGENCY LEVELS
   Source: NACO Blood Transfusion Guidelines, MoHFW India
═══════════════════════════════════════════════════════════════════ */
type UrgencyLevel = "Emergency" | "Urgent" | "Routine";

const URGENCY_CONFIG: Record<UrgencyLevel, {
  validityHours: number; color: string; bg: string; border: string;
  emoji: string; icon: string; timeNeeded: string; description: string;
  nacoNote: string; selClass: string;
}> = {
  Emergency: {
    validityHours: 6,
    color: "#b91c1c", bg: "#fef2f2", border: "#fca5a5",
    emoji: "🚨", icon: "🔴", timeNeeded: "< 30 minutes",
    description: "Life-threatening. Immediate transfusion required.",
    nacoNote: "Massive hemorrhage, trauma, obstetric emergency, surgical crisis",
    selClass: "sel-emergency",
  },
  Urgent: {
    validityHours: 12,
    color: "#c2410c", bg: "#fff7ed", border: "#fdba74",
    emoji: "⚡", icon: "🟠", timeNeeded: "2 – 4 hours",
    description: "Semi-urgent. Blood required within a few hours.",
    nacoNote: "Significant anemia, pre-operative preparation, post-surgical bleeding",
    selClass: "sel-urgent",
  },
  Routine: {
    validityHours: 48,
    color: "#15803d", bg: "#f0fdf4", border: "#86efac",
    emoji: "📋", icon: "🟢", timeNeeded: "> 4 hours",
    description: "Elective/planned. Sufficient advance notice given.",
    nacoNote: "Elective surgery, chronic anemia management, thalassemia, oncology",
    selClass: "sel-routine",
  },
};

/* ═══════════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════════ */
type BloodGroup = "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-";
type BloodComponentType = "Whole Blood" | "PRBC" | "Platelets" | "FFP" | "Cryoprecipitate";
type TransfusionIndication = "Anemia" | "Surgery" | "Trauma" | "Oncology" | "Obstetric" | "Hemorrhage" | "Thalassemia" | "Other";
type RequestStatus = "CREATED" | "PENDING" | "PROCESSING" | "PLEDGED" | "PARTIAL" | "REDEEMED" | "HOSPITAL VERIFIED" | "CLOSED" | "EXPIRED" | "CANCELLED";

interface DonorInfo { dRtid: string; name: string; date: string; }
interface BloodRequest {
  id: string; rtid: string; serialNumber?: string;
  patientName: string; bloodGroup: BloodGroup;
  componentType?: BloodComponentType; transfusionIndication?: TransfusionIndication;
  unitsRequired: number; unitsFulfilled: number;
  requiredBy: Date; status: RequestStatus;
  city: string; createdAt: Date;
  patientMobile: string; patientAadhaar: string; pincode: string;
  age?: number; urgency?: UrgencyLevel;
  donors?: DonorInfo[]; doctorName?: string; doctorRegNo?: string;
  wardDepartment?: string; bedNumber?: string;
  validityHours?: number; scannedAt?: string; scannedLocation?: string;
  redeemedAt?: Date; generatedBy?: string; systemVersion?: string;
}
interface Notification { id: string; message: string; time: string; type: "new" | "update" | "alert"; }

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════════ */
const SYSTEM_VERSION = "v3.0.0";
const BLOOD_COMPONENT_TYPES: BloodComponentType[] = ["Whole Blood","PRBC","Platelets","FFP","Cryoprecipitate"];
const TRANSFUSION_INDICATIONS: TransfusionIndication[] = ["Anemia","Surgery","Trauma","Oncology","Obstetric","Hemorrhage","Thalassemia","Other"];
const INITIAL_NOTIFS: Notification[] = [{ id:"1", message:"System connected to Firebase.", time:"Just now", type:"new" }];

/* ═══════════════════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════════════════ */
const formatDate = (date: Date): string => {
  if (!date || isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
};
const formatTime = (date: Date): string => {
  if (!date || isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" });
};
const formatDateTime = (date: Date): string => {
  if (!date || isNaN(date.getTime())) return "—";
  return `${formatDate(date)} ${formatTime(date)}`;
};
const generateSerialNumber = (): string => {
  const now = new Date();
  return `REQ/${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,"0")}/${Math.floor(Math.random()*999999).toString().padStart(6,"0")}`;
};
const isRequestValid = (r: BloodRequest): boolean => {
  if (!r.validityHours || !r.createdAt) return true;
  const validUntil = new Date(r.createdAt.getTime() + r.validityHours * 3600000);
  return new Date() < validUntil;
};
const getTimeRemaining = (r: BloodRequest): string => {
  if (!r.validityHours || !r.createdAt) return "N/A";
  const validUntil = new Date(r.createdAt.getTime() + r.validityHours * 3600000);
  const diff = validUntil.getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};
const getValidityPct = (r: BloodRequest): number => {
  if (!r.validityHours || !r.createdAt) return 100;
  const total = r.validityHours * 3600000;
  const elapsed = Date.now() - r.createdAt.getTime();
  return Math.max(0, Math.min(100, 100 - (elapsed / total * 100)));
};
const getQRPayload = (r: BloodRequest): string => JSON.stringify({
  rtid: r.rtid, serial: r.serialNumber||"",
  name: r.patientName, city: r.city,
  bloodGroup: r.bloodGroup, component: r.componentType||"Whole Blood",
  units: r.unitsRequired, urgency: r.urgency||"Routine",
  requiredBy: r.requiredBy?.toISOString?.() || "",
  createdAt: r.createdAt?.toISOString?.() || "",
});
const getStatusMeta = (status: string): { bg:string; text:string; border:string; label:string } => {
  switch (status?.toUpperCase()) {
    case "CREATED":          return { bg:"#f9fafb", text:"#374151", border:"#d1d5db", label:"Created" };
    case "PENDING":          return { bg:"#fefce8", text:"#854d0e", border:"#fde047", label:"Pending" };
    case "PROCESSING":
    case "PLEDGED":          return { bg:"#eff6ff", text:"#1d4ed8", border:"#93c5fd", label:"Processing" };
    case "PARTIAL":          return { bg:"#fff7ed", text:"#c2410c", border:"#fdba74", label:"Partial" };
    case "REDEEMED":         return { bg:"#f0fdf4", text:"#15803d", border:"#86efac", label:"Redeemed" };
    case "HOSPITAL VERIFIED":return { bg:"#dcfce7", text:"#166534", border:"#4ade80", label:"Verified" };
    case "CLOSED":           return { bg:"#f3f4f6", text:"#374151", border:"#9ca3af", label:"Closed" };
    case "EXPIRED":
    case "CANCELLED":        return { bg:"#fef2f2", text:"#b91c1c", border:"#fca5a5", label:"Expired" };
    default:                 return { bg:"#f9fafb", text:"#6b7280", border:"#d1d5db", label:status };
  }
};
const copyToClipboard = async (text: string): Promise<boolean> => {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
};
const timeAgo = (date: Date): string => {
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m >= 0) return `${m}m ago`;
  return "just now";
};

/* ═══════════════════════════════════════════════════════════════════
   QR CANVAS COMPONENT
═══════════════════════════════════════════════════════════════════ */
const QRCanvas = ({ data, size=220 }: { data:string; size?:number }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current && data) {
      try { new QRious({ element:ref.current, value:data, size, foreground:"#8B0000", level:"H" }); }
      catch(_) {}
    }
  }, [data, size]);
  return <canvas ref={ref} width={size} height={size} className="rounded-lg" />;
};

/* ═══════════════════════════════════════════════════════════════════
   PRINTABLE SLIP  (same as original, zero changes)
═══════════════════════════════════════════════════════════════════ */
const PrintableRequest = ({ request, hospital }: { request: BloodRequest|null; hospital:any }) => {
  const qrRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (request && qrRef.current) {
      new QRious({ element:qrRef.current, value:getQRPayload(request), size:100, level:"H" });
    }
  }, [request]);
  if (!request) return null;
  const uc = URGENCY_CONFIG[request.urgency||"Routine"];
  const rem = getTimeRemaining(request);
  const isV = isRequestValid(request);
  return (
    <>
      <style>{`@media print{@page{size:A4;margin:10mm}body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}`}</style>
      <div className="hidden print:block bg-white font-sans">
        <div className="w-full max-w-[190mm] mx-auto">
          <div className="border-[3px] border-gray-900 p-6">
            <div className="border-b-2 border-[#8B0000] pb-3 mb-3 flex items-start gap-3">
              <img src={logo} className="h-12 w-12 object-contain" alt="RaktPort" />
              <div className="flex-1">
                <div className="text-xl font-black text-[#8B0000] uppercase">RaktPort</div>
                <div className="text-[9px] font-bold uppercase text-gray-700">National Digital Blood Donation & Management System</div>
                <div className="text-[8px] text-gray-500">Ministry of Health & Family Welfare, Govt. of India</div>
              </div>
              <div className="text-right">
                <div className="text-[8px] text-gray-500 uppercase">Serial No.</div>
                <div className="font-mono text-[10px] font-bold">{request.serialNumber}</div>
                <div className="text-[7px] text-gray-400 mt-0.5">
                  {new Date(request.createdAt).toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit",hour12:true})}
                </div>
              </div>
            </div>
            <div className="text-center mb-3">
              <div className="text-base font-extrabold uppercase underline">Blood Requisition Form</div>
              <div className="text-[9px] text-gray-500 mt-0.5">NACO / MoHFW Compliant · {new Date().toLocaleString("en-IN")}</div>
            </div>
            <div className="flex justify-center gap-3 mb-3">
              <div className={`px-3 py-1.5 border-2 rounded text-[10px] font-bold uppercase`} style={{background:uc.bg,borderColor:uc.border,color:uc.color}}>
                {uc.emoji} Urgency: {request.urgency||"Routine"}
              </div>
              <div className={`px-3 py-1.5 border-2 rounded text-[10px] font-bold uppercase ${isV?"text-green-700 border-green-400 bg-green-50":"text-red-700 border-red-400 bg-red-50"}`}>
                Validity: {rem}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5 mb-3">
              <div>
                <div className="font-bold text-[13px] uppercase border-l-4 border-[#8B0000] pl-2 mb-1.5">Patient Information</div>
                <div className="text-[11px] space-y-0.5">
                  <p><b>Name:</b> {request.patientName}</p>
                  <p><b>Age:</b> {request.age||"N/A"} Years</p>
                  <p><b>Mobile:</b> {request.patientMobile}</p>
                  {request.wardDepartment && <p><b>Ward/Dept:</b> {request.wardDepartment}</p>}
                  {request.bedNumber && <p><b>Bed No:</b> {request.bedNumber}</p>}
                </div>
              </div>
              <div>
                <div className="font-bold text-[13px] uppercase border-l-4 border-gray-600 pl-2 mb-1.5">Requesting Hospital</div>
                <div className="text-[11px] space-y-0.5">
                  <p><b>Name:</b> {hospital?.fullName||"Hospital"}</p>
                  <p><b>Location:</b> {hospital?.district}, {hospital?.pincode}</p>
                  <p><b>Contact:</b> {hospital?.mobile||"N/A"}</p>
                  {request.doctorName && <p><b>Doctor:</b> {request.doctorName}</p>}
                  {request.doctorRegNo && <p><b>Reg. No:</b> {request.doctorRegNo}</p>}
                </div>
              </div>
            </div>
            <div className="text-center mb-3">
              <div className="text-[11px] font-semibold mb-1">RTID Code</div>
              <div className="inline-block font-mono px-3 py-1.5 border-2 border-gray-300 bg-gray-50 text-[14px] font-bold">{request.rtid}</div>
            </div>
            <div className="border-2 border-gray-300 py-3 mb-3">
              <div className="grid grid-cols-4 gap-2 px-3">
                <div className="text-center"><p className="text-[9px] uppercase text-gray-600 font-semibold mb-1">Blood Group</p><p className="text-3xl font-black text-[#8B0000]">{request.bloodGroup}</p></div>
                <div className="text-center"><p className="text-[9px] uppercase text-gray-600 font-semibold mb-1">Component</p><p className="text-[13px] font-bold mt-1">{request.componentType||"Whole Blood"}</p></div>
                <div className="text-center"><p className="text-[9px] uppercase text-gray-600 font-semibold mb-1">Units Required</p><p className="text-3xl font-black">{request.unitsRequired}</p></div>
                <div className="text-center"><p className="text-[9px] uppercase text-gray-600 font-semibold mb-1">Required By</p><p className="font-bold text-sm mt-1">{formatDate(request.requiredBy)}</p><p className="text-[10px]">{formatTime(request.requiredBy)}</p></div>
              </div>
            </div>
            {request.transfusionIndication && (
              <div className="bg-blue-50 border border-blue-200 rounded px-3 py-1.5 mb-3">
                <p className="text-[10px] font-bold uppercase text-blue-900">Indication for Transfusion (NACO Guideline):</p>
                <p className="text-[12px] font-semibold text-blue-700">{request.transfusionIndication}</p>
              </div>
            )}
            <div className="bg-red-50 border-2 border-red-300 rounded px-3 py-2 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold uppercase text-red-900 mb-1">⚠️ MoHFW / NACO Mandatory Requirements</p>
                  <ul className="text-[9.5px] text-red-800 space-y-0.5 list-disc list-inside leading-snug">
                    <li>Mandatory ABO-Rh typing, antibody screening & cross-matching before transfusion</li>
                    <li>Emergency uncross-matched blood only if immediately life-threatening (document justification)</li>
                    <li>Verify patient identity (name, age, blood group) before administration</li>
                    <li>Monitor patient 15 min post-transfusion; report adverse reactions to regional blood bank</li>
                    <li>Informed consent mandatory for all planned transfusions</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="border-t-2 border-gray-800 pt-3 mt-auto">
              <div className="flex gap-3 items-start">
                <div className="flex flex-col items-center flex-shrink-0" style={{width:"105px"}}>
                  <canvas ref={qrRef} width={100} height={100} />
                  <p className="text-[8px] text-center mt-1 font-semibold">Scan to Verify</p>
                </div>
                <div className="text-[8px] text-gray-700 leading-snug flex-1">
                  <p className="font-bold uppercase text-[8.5px] mb-0.5">Digital Signature & Metadata:</p>
                  <p className="mb-0.5">Generated by: {request.generatedBy||hospital?.fullName}</p>
                  <p className="mb-0.5">System: RaktPort {request.systemVersion||SYSTEM_VERSION}</p>
                  <p className="mb-1.5">Timestamp: {new Date(request.createdAt).toLocaleString("en-IN")} IST</p>
                  <p className="font-bold uppercase text-[8.5px] mb-0.5">Disclaimer:</p>
                  <p>This document is electronically generated by RaktPort. Validation subject to QR code authenticity and validity period.</p>
                </div>
                <div className="w-32 text-center flex-shrink-0">
                  <div className="h-10 border-b border-gray-400 mb-1"></div>
                  <p className="text-[8.5px] font-bold uppercase">Authorized Signatory</p>
                  <p className="text-[7.5px]">(Medical Officer / In-Charge)</p>
                  <p className="text-[7px] text-gray-500 mt-1">Date: {formatDate(new Date())}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   QR MODAL
═══════════════════════════════════════════════════════════════════ */
const QRModal = ({ isOpen, onClose, request }: { isOpen:boolean; onClose:()=>void; request:BloodRequest|null }) => {
  if (!request) return null;
  const isV = isRequestValid(request);
  const rem = getTimeRemaining(request);
  const pct = getValidityPct(request);
  const sm  = getStatusMeta(isV ? request.status : "EXPIRED");
  const uc  = URGENCY_CONFIG[request.urgency||"Routine"];
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[95vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#8B0000]" style={{fontFamily:"Outfit,sans-serif"}}>
            <QrCode className="w-5 h-5" /> Request QR · {request.rtid}
          </DialogTitle>
          <DialogDescription>Scan at any blood bank to verify & process this requisition</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="relative">
            <div className={`p-3 rounded-xl border-2 bg-white ${!isV?"opacity-50":""}`} style={{borderColor:isV?"#e5e7eb":"#fca5a5"}}>
              <QRCanvas data={getQRPayload(request)} size={200} />
            </div>
            {!isV && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-red-50/80 backdrop-blur-sm">
                <Badge className="bg-red-600 text-white text-sm px-3 py-1">EXPIRED</Badge>
              </div>
            )}
          </div>
          {/* Validity Bar */}
          <div className="w-full space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 font-medium">Validity remaining</span>
              <span className={`font-bold ${isV?"text-green-600":"text-red-600"}`}>{rem}</span>
            </div>
            <div className="hd-validity">
              <div className="hd-validity-fill" style={{width:`${pct}%`,background:isV?pct>50?"#22c55e":"#f59e0b":"#ef4444"}} />
            </div>
          </div>
          <div className="w-full space-y-2 bg-gray-50 rounded-xl p-3 border text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div><p className="text-[10px] text-gray-400 uppercase font-semibold">Patient</p><p className="font-semibold text-gray-800">{request.patientName}</p></div>
              <div><p className="text-[10px] text-gray-400 uppercase font-semibold">Blood Group</p><p className="font-bold text-red-700 text-lg">{request.bloodGroup}</p></div>
              <div><p className="text-[10px] text-gray-400 uppercase font-semibold">Component</p><p className="font-semibold">{request.componentType||"Whole Blood"}</p></div>
              <div><p className="text-[10px] text-gray-400 uppercase font-semibold">Units</p><p className="font-bold text-2xl" style={{fontFamily:"Outfit,sans-serif"}}>{request.unitsRequired}</p></div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="hd-urg" style={{background:uc.bg,color:uc.color,borderColor:uc.border}} >
                {uc.emoji} {request.urgency||"Routine"} · {rem} left
              </span>
              <span className="hd-status" style={{background:sm.bg,color:sm.text,borderColor:sm.border,border:"1px solid"}}>{sm.label}</span>
            </div>
          </div>
          {request.status==="REDEEMED" && request.redeemedAt && (
            <div className="w-full bg-green-50 border border-green-200 rounded-xl p-3">
              <p className="font-semibold text-green-900 text-sm flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Redeemed Successfully
              </p>
              <p className="text-xs text-green-700 mt-1">{new Date(request.redeemedAt).toLocaleString("en-IN")}</p>
              {request.scannedLocation && <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{request.scannedLocation}</p>}
            </div>
          )}
        </div>
        <Button onClick={onClose} className="w-full mt-1 bg-[#8B0000] hover:bg-[#6b0000]">Close</Button>
      </DialogContent>
    </Dialog>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   NEW REQUEST MODAL — NACO/MoHFW COMPLIANT
═══════════════════════════════════════════════════════════════════ */
const NewRequestModal = ({
  isOpen, onClose, onSubmit,
  defaultCity, defaultPincode, defaultUrgency, hospitalName,
}: {
  isOpen:boolean; onClose:()=>void; onSubmit:(data:any)=>void;
  defaultCity:string; defaultPincode:string; defaultUrgency:UrgencyLevel; hospitalName:string;
}) => {
  const [patientName,          setPatientName]          = useState("");
  const [bloodGroup,           setBloodGroup]           = useState<BloodGroup|"">("");
  const [componentType,        setComponentType]        = useState<BloodComponentType>("Whole Blood");
  const [transfusionIndication,setTransfusionIndication]= useState<TransfusionIndication>("Anemia");
  const [unitsRequired,        setUnitsRequired]        = useState("1");
  const [requiredByDate,       setRequiredByDate]       = useState(new Date().toISOString().split("T")[0]);
  const [requiredByTime,       setRequiredByTime]       = useState("12:00");
  const [age,                  setAge]                  = useState("");
  const [city,                 setCity]                 = useState(defaultCity);
  const [pincode,              setPincode]              = useState(defaultPincode);
  const [mobile,               setMobile]               = useState("");
  const [aadhaar,              setAadhaar]              = useState("");
  const [urgency,              setUrgency]              = useState<UrgencyLevel>(defaultUrgency);
  const [doctorName,           setDoctorName]           = useState("");
  const [doctorRegNo,          setDoctorRegNo]          = useState("");
  const [wardDepartment,       setWardDepartment]       = useState("");
  const [bedNumber,            setBedNumber]            = useState("");
  const [isSubmitting,         setIsSubmitting]         = useState(false);
  const [step,                 setStep]                 = useState(1); // 1=patient 2=blood 3=doctor

  useEffect(() => {
    if (isOpen) { setUrgency(defaultUrgency); setCity(defaultCity); setPincode(defaultPincode); setStep(1); }
  }, [isOpen, defaultUrgency, defaultCity, defaultPincode]);

  const handleNumeric = (setter:(v:string)=>void, maxLen:number) =>
    (e:React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value.replace(/\D/g,"").slice(0,maxLen); setter(v);
    };

  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    try {
      if (!patientName?.trim())                   { toast.error("Patient name is required"); return; }
      if (!bloodGroup)                             { toast.error("Select a blood group"); return; }
      if (!age || parseInt(age)<=0 || parseInt(age)>120) { toast.error("Enter a valid age (1-120)"); return; }
      if (!mobile?.trim() || mobile.length!==10)  { toast.error("Enter a valid 10-digit mobile number"); return; }
      if (!aadhaar?.trim() || aadhaar.length!==12){ toast.error("Enter a valid 12-digit Aadhaar number"); return; }
      if (!city?.trim())                          { toast.error("City is required"); return; }
      if (!pincode?.trim() || pincode.length!==6) { toast.error("Enter a valid 6-digit pincode"); return; }
      if (!requiredByDate || !requiredByTime)     { toast.error("Required date and time are mandatory"); return; }
      setIsSubmitting(true);
      await onSubmit({
        patientName:patientName.trim(), bloodGroup, componentType, transfusionIndication,
        unitsRequired:parseInt(unitsRequired)||1,
        requiredByDate, requiredByTime,
        age:parseInt(age), city:city.trim(), pincode:pincode.trim(),
        mobile:mobile.trim(), aadhaar:aadhaar.trim(), urgency,
        doctorName:doctorName?.trim()||null, doctorRegNo:doctorRegNo?.trim()||null,
        wardDepartment:wardDepartment?.trim()||null, bedNumber:bedNumber?.trim()||null,
      });
      setPatientName(""); setBloodGroup(""); setComponentType("Whole Blood");
      setTransfusionIndication("Anemia"); setUnitsRequired("1");
      setAge(""); setMobile(""); setAadhaar("");
      setDoctorName(""); setDoctorRegNo(""); setWardDepartment(""); setBedNumber("");
      setRequiredByDate(new Date().toISOString().split("T")[0]); setRequiredByTime("12:00");
    } catch (err) { toast.error("Failed to submit. Please try again."); }
    finally { setIsSubmitting(false); }
  };

  const uc = URGENCY_CONFIG[urgency];
  const TOTAL = 3;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o && !isSubmitting) { onClose(); setStep(1); } }}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl p-0">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{background:uc.bg}}>{uc.emoji}</div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900" style={{fontFamily:"Outfit,sans-serif"}}>New Blood Requisition</h2>
              <p className="text-xs text-gray-500">NACO/MoHFW Compliant · {hospitalName}</p>
            </div>
            <button onClick={() => { onClose(); setStep(1); }} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          {/* Steps */}
          <div className="flex items-center gap-2 mt-4">
            {["Patient Info","Blood Details","Doctor & Location"].map((s,i) => (
              <React.Fragment key={s}>
                <button
                  onClick={() => { if (i+1 < step) setStep(i+1); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${step===i+1?"bg-[#8B0000] text-white shadow-md":step>i+1?"bg-green-100 text-green-700 cursor-pointer":"bg-gray-100 text-gray-400"}`}
                >
                  {step>i+1 ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center text-[10px]">{i+1}</span>}
                  <span className="hidden sm:inline">{s}</span>
                </button>
                {i < TOTAL-1 && <div className={`flex-1 h-0.5 rounded-full transition-all ${step>i+1?"bg-green-400":"bg-gray-200"}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">

          {/* URGENCY SELECTOR — always visible */}
          <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Siren className="w-4 h-4 text-red-600" />
              <span className="text-sm font-bold text-gray-800">Urgency Level</span>
              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-semibold">NACO Guideline</span>
            </div>
            <div className="hd-urg-selector">
              {(["Emergency","Urgent","Routine"] as UrgencyLevel[]).map(lvl => {
                const u = URGENCY_CONFIG[lvl];
                return (
                  <button
                    key={lvl} type="button"
                    onClick={() => setUrgency(lvl)}
                    className={`hd-urg-opt ${urgency===lvl ? u.selClass : ""}`}
                  >
                    <div className="hd-urg-emoji">{u.emoji}</div>
                    <div className="hd-urg-name" style={{color:urgency===lvl?u.color:"#374151"}}>{lvl}</div>
                    <div className="hd-urg-time">{u.timeNeeded}</div>
                    <div className="text-[10px] font-bold mt-1.5" style={{color:urgency===lvl?u.color:"#9ca3af"}}>
                      Valid {u.validityHours}h
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex items-start gap-2 p-3 rounded-xl border text-xs" style={{background:uc.bg,borderColor:uc.border,color:uc.color}}>
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <div>
                <strong>{uc.description}</strong>
                <div className="opacity-75 mt-0.5">NACO Indication: {uc.nacoNote}</div>
              </div>
            </div>
          </div>

          {/* ── STEP 1: Patient Info ── */}
          {step === 1 && (
            <div className="space-y-4 hd-enter">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-gray-800">Patient Information</span>
              </div>
              <div>
                <label className="hd-label">Patient Full Name <span className="hd-required">*</span></label>
                <input className="hd-input" value={patientName} onChange={e=>setPatientName(e.target.value)} placeholder="As per ID proof" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="hd-label">Age (Years) <span className="hd-required">*</span></label>
                  <input className="hd-input" type="number" min="1" max="120" value={age} onChange={e=>setAge(e.target.value)} placeholder="e.g. 35" required />
                </div>
                <div>
                  <label className="hd-label">Mobile No. <span className="hd-required">*</span></label>
                  <input className="hd-input" value={mobile} onChange={handleNumeric(setMobile,10)} maxLength={10} placeholder="10-digit" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="hd-label">Aadhaar No. <span className="hd-required">*</span></label>
                  <input className="hd-input" value={aadhaar} onChange={handleNumeric(setAadhaar,12)} maxLength={12} placeholder="12-digit" required />
                  {aadhaar.length>0 && (
                    <div className="flex gap-0.5 mt-1.5">
                      {Array.from({length:12}).map((_,i) => (
                        <div key={i} className={`flex-1 h-1 rounded-full transition-all ${i<aadhaar.length?"bg-[#8B0000]":"bg-gray-200"}`} />
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="hd-label">Bed Number</label>
                  <input className="hd-input" value={bedNumber} onChange={e=>setBedNumber(e.target.value)} placeholder="e.g. ICU-12" />
                </div>
              </div>
              <div>
                <label className="hd-label">Ward / Department</label>
                <input className="hd-input" value={wardDepartment} onChange={e=>setWardDepartment(e.target.value)} placeholder="e.g. ICU, OT, Emergency" />
              </div>
            </div>
          )}

          {/* ── STEP 2: Blood Details ── */}
          {step === 2 && (
            <div className="space-y-4 hd-enter">
              <div className="flex items-center gap-2 mb-1">
                <Droplet className="w-4 h-4 text-red-600" />
                <span className="text-sm font-bold text-gray-800">Blood Component Requirements</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="hd-label">Blood Group <span className="hd-required">*</span></label>
                  <div className="grid grid-cols-4 gap-1.5 mt-1">
                    {BLOOD_GROUPS.map((bg:string) => (
                      <button key={bg} type="button" onClick={()=>setBloodGroup(bg as BloodGroup)}
                        className={`py-2 rounded-lg text-xs font-black border-2 transition-all ${bloodGroup===bg?"bg-[#8B0000] text-white border-[#8B0000] shadow-md scale-105":"bg-gray-50 text-gray-600 border-gray-200 hover:border-[#8B0000]/40"}`}>
                        {bg}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="hd-label">Component Type <span className="hd-required">*</span></label>
                    <select className="hd-input" value={componentType} onChange={e=>setComponentType(e.target.value as BloodComponentType)} style={{appearance:"none"}}>
                      {BLOOD_COMPONENT_TYPES.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="hd-label">Units Required <span className="hd-required">*</span></label>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={()=>setUnitsRequired(String(Math.max(1,parseInt(unitsRequired)-1)))}
                        className="w-9 h-9 rounded-lg border-2 border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:border-[#8B0000] transition-colors">−</button>
                      <input className="hd-input text-center font-bold text-lg flex-1" type="number" min="1" max="20" value={unitsRequired} onChange={e=>setUnitsRequired(e.target.value)} />
                      <button type="button" onClick={()=>setUnitsRequired(String(Math.min(20,parseInt(unitsRequired)+1)))}
                        className="w-9 h-9 rounded-lg border-2 border-gray-200 flex items-center justify-center font-bold text-gray-600 hover:border-[#8B0000] transition-colors">+</button>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="hd-label">Indication for Transfusion <span className="hd-required">*</span></label>
                <div className="grid grid-cols-4 gap-1.5">
                  {TRANSFUSION_INDICATIONS.map(ind => (
                    <button key={ind} type="button" onClick={()=>setTransfusionIndication(ind)}
                      className={`py-2 px-1 rounded-lg text-[11px] font-semibold border-2 transition-all text-center ${transfusionIndication===ind?"bg-blue-600 text-white border-blue-600":"bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300"}`}>
                      {ind}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="hd-label">Required By — Date <span className="hd-required">*</span></label>
                  <input className="hd-input" type="date" value={requiredByDate} onChange={e=>setRequiredByDate(e.target.value)} min={new Date().toISOString().split("T")[0]} required />
                </div>
                <div>
                  <label className="hd-label">Required By — Time <span className="hd-required">*</span></label>
                  <input className="hd-input" type="time" value={requiredByTime} onChange={e=>setRequiredByTime(e.target.value)} required />
                </div>
              </div>
              {/* NACO Compatibility note */}
              {bloodGroup && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                  <strong>⚠️ NACO Requirement:</strong> ABO-Rh compatibility testing mandatory before {componentType}. Ensure cross-match with donor unit for PRBC/Whole Blood.
                </div>
              )}
            </div>
          )}

          {/* ── STEP 3: Doctor & Location ── */}
          {step === 3 && (
            <div className="space-y-4 hd-enter">
              <div className="flex items-center gap-2 mb-1">
                <Stethoscope className="w-4 h-4 text-green-600" />
                <span className="text-sm font-bold text-gray-800">Prescribing Doctor & Location</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="hd-label">Doctor Name</label>
                  <input className="hd-input" value={doctorName} onChange={e=>setDoctorName(e.target.value)} placeholder="Dr. Full Name" />
                </div>
                <div>
                  <label className="hd-label">MCI Registration No.</label>
                  <input className="hd-input" value={doctorRegNo} onChange={e=>setDoctorRegNo(e.target.value)} placeholder="MCI/SMC Reg. No." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="hd-label">City <span className="hd-required">*</span></label>
                  <input className="hd-input" value={city} onChange={e=>setCity(e.target.value)} required />
                </div>
                <div>
                  <label className="hd-label">Pincode <span className="hd-required">*</span></label>
                  <input className="hd-input" value={pincode} onChange={handleNumeric(setPincode,6)} maxLength={6} required />
                </div>
              </div>
              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">Request Summary</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    ["Patient",patientName||"—"],["Age",age?`${age} yrs`:"—"],
                    ["Blood Group",bloodGroup||"—"],["Component",componentType],
                    ["Units",unitsRequired],["Urgency",urgency],
                    ["Valid for",`${uc.validityHours} hours`],["Indication",transfusionIndication],
                  ].map(([k,v]) => (
                    <div key={k} className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-semibold uppercase">{k}</span>
                      <span className="font-semibold text-gray-800 text-xs">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* MoHFW Disclaimer */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                <BookOpen className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
                <div>
                  <strong>MoHFW / NACO Compliance:</strong> By submitting, you confirm that the transfusion is clinically justified, informed consent has been taken, and all pre-transfusion checks will be performed as per National Blood Policy guidelines.
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            {step > 1 ? (
              <button type="button" onClick={()=>setStep(s=>s-1)}
                className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
                ← Back
              </button>
            ) : (
              <button type="button" onClick={()=>{ onClose(); setStep(1); }}
                className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                Cancel
              </button>
            )}
            {step < TOTAL ? (
              <button type="button"
                onClick={() => {
                  if (step===1) {
                    if (!patientName||!age||!mobile||!aadhaar) { toast.error("Fill all required patient fields"); return; }
                    if (mobile.length!==10) { toast.error("Mobile must be 10 digits"); return; }
                    if (aadhaar.length!==12) { toast.error("Aadhaar must be 12 digits"); return; }
                  }
                  if (step===2) {
                    if (!bloodGroup) { toast.error("Select blood group"); return; }
                    if (!requiredByDate||!requiredByTime) { toast.error("Required date/time mandatory"); return; }
                  }
                  setStep(s=>s+1);
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                style={{background:"linear-gradient(135deg,#8B0000,#b30000)"}}>
                Continue →
              </button>
            ) : (
              <button
                type="submit" disabled={isSubmitting}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 ${urgency==="Emergency"?"animate-pulse":""}`}
                style={{background:isSubmitting?"#d1d5db":`linear-gradient(135deg,${uc.color},#8B0000)`}}>
                {isSubmitting ? (
                  <><Clock className="w-4 h-4 animate-spin" /> Creating Request…</>
                ) : (
                  <><FileText className="w-4 h-4" /> Generate RTID & Print</>
                )}
              </button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   NOTIFICATION DRAWER
═══════════════════════════════════════════════════════════════════ */
const NotifDrawer = ({ isOpen, notifs, onClose }: { isOpen:boolean; notifs:Notification[]; onClose:()=>void }) => {
  if (!isOpen) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed top-[70px] right-4 w-80 max-h-[75vh] overflow-y-auto z-50 rounded-2xl shadow-2xl border border-gray-200 bg-white hd-enter-sm">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><Bell className="w-4 h-4 text-[#8B0000]" /> Notifications</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><X className="w-3.5 h-3.5" /></button>
        </div>
        <div className="divide-y">
          {notifs.length===0 ? <div className="p-8 text-center text-gray-400 text-sm">No notifications</div> : notifs.map(n => (
            <div key={n.id} className="p-4 hover:bg-gray-50 cursor-pointer">
              <div className="flex items-start gap-2">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${n.type==="alert"?"bg-red-500":n.type==="update"?"bg-blue-500":"bg-green-500"}`} />
                <div><p className="text-sm text-gray-700">{n.message}</p><p className="text-xs text-gray-400 mt-0.5">{n.time}</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   PREMIUM OVERVIEW (Dashboard Home)
═══════════════════════════════════════════════════════════════════ */
function PremiumDashboard({
  requests, hospitalData, kpis, onNewRequest, onViewQR, onDelete, onPrint, onConfirmReceipt,
}: {
  requests:BloodRequest[]; hospitalData:any; kpis:any;
  onNewRequest:(u:UrgencyLevel)=>void;
  onViewQR:(r:BloodRequest)=>void;
  onDelete:(id:string)=>void;
  onPrint:(r:BloodRequest)=>void;
  onConfirmReceipt:(id:string,r:BloodRequest)=>void;
}) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";
  const dateStr = now.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});

  const pending    = requests.filter(r=>isRequestValid(r)&&!["REDEEMED","HOSPITAL VERIFIED","CLOSED","EXPIRED","CANCELLED"].includes(r.status));
  const critical   = requests.filter(r=>r.urgency==="Emergency"&&isRequestValid(r)&&!["REDEEMED","CLOSED"].includes(r.status));
  const recentReqs = [...requests].sort((a,b)=>b.createdAt.getTime()-a.createdAt.getTime()).slice(0,4);

  const bg_dist = BLOOD_GROUPS.reduce((acc:Record<string,number>,bg:string) => {
    acc[bg] = requests.filter(r=>r.bloodGroup===bg&&!["CANCELLED","EXPIRED"].includes(r.status)).length;
    return acc;
  }, {});
  const maxBgCount = Math.max(...Object.values(bg_dist), 1);

  const kpiCards = [
    { label:"Total Requests", val:kpis.totalRequests,   cls:"k-red",    icon:"📋", bg:"#fff0f0" },
    { label:"Active Requests", val:kpis.activeRequests, cls:"k-amber",  icon:"⏳", bg:"#fffbeb" },
    { label:"Units Required",  val:kpis.totalUnits,     cls:"k-blue",   icon:"🩸", bg:"#eff6ff" },
    { label:"Donations Rcvd",  val:kpis.donationsReceived,cls:"k-green",icon:"✅", bg:"#f0fdf4" },
    { label:"Redeemed",        val:kpis.requestsRedeemed,cls:"k-purple",icon:"🎯", bg:"#faf5ff" },
  ];

  return (
    <div className="space-y-6">
      {/* Critical Alert */}
      {critical.length > 0 && (
        <div className="hd-enter bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-xl flex-shrink-0">🚨</div>
          <div className="flex-1">
            <p className="font-bold text-red-800 text-sm">Emergency Blood Request Active</p>
            <p className="text-xs text-red-600 mt-0.5">{critical.length} emergency request{critical.length>1?"s":""} pending · Immediate action required</p>
          </div>
          <span className="text-xs font-bold bg-red-600 text-white px-3 py-1.5 rounded-lg animate-pulse">{critical.length} URGENT</span>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="hd-welcome hd-enter">
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="hd-welcome-sub">{greeting} 👋</p>
              <h2 className="hd-welcome-title mt-1">{hospitalData?.fullName||"Hospital"}</h2>
              <p className="text-xs text-white/50 mt-1">{dateStr}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {pending.length>0 && (
                  <span className="inline-flex items-center gap-1.5 bg-white/15 text-white/90 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20">
                    <Clock className="w-3 h-3" />{pending.length} active request{pending.length>1?"s":""}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 bg-white/10 text-white/70 text-xs px-3 py-1.5 rounded-full border border-white/15">
                  <MapPin className="w-3 h-3" />{hospitalData?.district||"…"}, {hospitalData?.pincode||"…"}
                </span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={()=>onNewRequest("Emergency")}
                className="flex items-center gap-2 bg-red-700/80 hover:bg-red-700 border border-red-400/40 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all animate-pulse hover:animate-none">
                <Siren className="w-3.5 h-3.5" /> Emergency Request
              </button>
              <button onClick={()=>onNewRequest("Routine")}
                className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all">
                <Plus className="w-3.5 h-3.5" /> New Request
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div>
        <div className="hd-sec-hdr"><span className="hd-sec-title"><BarChart2 className="w-4 h-4 text-[#8B0000]" /> Overview</span></div>
        <div className="hd-kpi-grid">
          {kpiCards.map((m,i) => (
            <div key={m.label} className={`hd-kpi ${m.cls} hd-enter hd-s${i+1}`}>
              <div className="hd-kpi-icon" style={{background:m.bg}}><span className="text-lg">{m.icon}</span></div>
              <div className="hd-kpi-val">{m.val.toLocaleString()}</div>
              <div className="hd-kpi-lbl">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">

          {/* Fulfillment Progress */}
          <div className="hd-card p-5 hd-enter hd-s2">
            <div className="hd-sec-hdr mb-4">
              <span className="hd-sec-title"><TrendingUp className="w-4 h-4 text-green-600" /> Request Fulfillment</span>
            </div>
            <div className="flex items-center gap-4">
              {/* Donut */}
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="4" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#8B0000" strokeWidth="4"
                    strokeDasharray={`${kpis.totalRequests>0?(kpis.requestsRedeemed/kpis.totalRequests)*100:0} 100`}
                    strokeLinecap="round" style={{transition:"stroke-dasharray 0.8s ease"}} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-black text-[#8B0000]" style={{fontFamily:"Outfit,sans-serif"}}>
                    {kpis.totalRequests>0?Math.round((kpis.requestsRedeemed/kpis.totalRequests)*100):0}%
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {[
                  {label:"Redeemed",val:kpis.requestsRedeemed,color:"#22c55e",max:kpis.totalRequests},
                  {label:"Active",val:kpis.activeRequests,color:"#f59e0b",max:kpis.totalRequests},
                  {label:"Units Received",val:kpis.donationsReceived,color:"#3b82f6",max:kpis.totalUnits},
                ].map(s=>(
                  <div key={s.label}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-gray-500 font-medium">{s.label}</span>
                      <span className="font-bold text-gray-800">{s.val}</span>
                    </div>
                    <div className="hd-prog"><div className="hd-prog-fill" style={{width:`${s.max>0?(s.val/s.max)*100:0}%`,background:s.color}} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Requests Table */}
          <div className="hd-card overflow-hidden hd-enter hd-s3">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <span className="hd-sec-title"><ClipboardList className="w-4 h-4 text-[#8B0000]" /> Recent Requests</span>
              <span className="text-xs text-gray-400">{requests.length} total</span>
            </div>
            {recentReqs.length===0 ? (
              <div className="text-center py-10">
                <div className="text-4xl opacity-20 mb-2">📋</div>
                <p className="text-sm text-gray-400">No requests yet</p>
                <button onClick={()=>onNewRequest("Routine")} className="mt-3 text-xs text-[#8B0000] font-semibold hover:underline">Create first request →</button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentReqs.map((r,i) => {
                  const sm  = getStatusMeta(isRequestValid(r)?r.status:"EXPIRED");
                  const uc2 = URGENCY_CONFIG[r.urgency||"Routine"];
                  const rem = getTimeRemaining(r);
                  const pct = getValidityPct(r);
                  return (
                    <div key={r.id} className="hd-act-item px-4 hd-enter" style={{animationDelay:`${i*0.06}s`}}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 border"
                        style={{background:`${uc2.bg}`,color:uc2.color,borderColor:uc2.border}}>
                        {r.urgency==="Emergency"?"🚨":r.urgency==="Urgent"?"⚡":"📋"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-800 truncate">{r.patientName}</span>
                          <span className="text-xs font-black text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">{r.bloodGroup}</span>
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-2">
                          <span className="font-mono">{r.rtid}</span> · {r.unitsRequired} unit{r.unitsRequired>1?"s":""}
                        </div>
                        <div className="hd-validity mt-1.5 w-24">
                          <div className="hd-validity-fill" style={{width:`${pct}%`,background:pct>50?"#22c55e":pct>20?"#f59e0b":"#ef4444"}} />
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className="hd-status border" style={{background:sm.bg,color:sm.text,borderColor:sm.border}}>{sm.label}</span>
                        <span className="text-[10px] text-gray-400">{rem}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Blood Group Distribution */}
          <div className="hd-card p-5 hd-enter hd-s2">
            <div className="hd-sec-hdr">
              <span className="hd-sec-title"><Droplet className="w-4 h-4 text-red-600 fill-red-500" /> Blood Group Demand</span>
            </div>
            <div className="space-y-2">
              {BLOOD_GROUPS.filter((bg:string)=>bg_dist[bg]>0).sort((a:string,b:string)=>(bg_dist[b]||0)-(bg_dist[a]||0)).map((bg:string)=>(
                <div key={bg} className="flex items-center gap-2">
                  <span className="text-xs font-black text-red-700 w-8 text-center bg-red-50 rounded-lg py-0.5 border border-red-100">{bg}</span>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{width:`${(bg_dist[bg]/maxBgCount)*100}%`,background:"linear-gradient(90deg,#8B0000,#c41e3a)"}} />
                  </div>
                  <span className="text-xs font-bold text-gray-700 w-4 text-right">{bg_dist[bg]}</span>
                </div>
              ))}
              {Object.values(bg_dist).every(v=>v===0) && (
                <p className="text-xs text-gray-400 text-center py-4">No requests yet</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="hd-card p-5 hd-enter hd-s3">
            <div className="hd-sec-hdr"><span className="hd-sec-title"><Zap className="w-4 h-4 text-amber-500" /> Quick Actions</span></div>
            <div className="space-y-2">
              {[
                { icon:"🚨", label:"Emergency Request", sub:"Life-threatening / Critical", color:"#b91c1c", bg:"#fef2f2", act:()=>onNewRequest("Emergency") },
                { icon:"⚡", label:"Urgent Request",    sub:"Needed in 2-4 hours",         color:"#c2410c", bg:"#fff7ed", act:()=>onNewRequest("Urgent")    },
                { icon:"📋", label:"Routine Request",   sub:"Elective / Planned",           color:"#15803d", bg:"#f0fdf4", act:()=>onNewRequest("Routine")   },
                { icon:"📥", label:"Download Reports",  sub:"Export request data",          color:"#1d4ed8", bg:"#eff6ff", act:()=>toast.info("Exporting…")  },
              ].map(a => (
                <button key={a.label} onClick={a.act}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 hover:border-opacity-50 transition-all text-left group"
                  style={{"--c":a.color} as any}
                  onMouseEnter={e=>(e.currentTarget.style.borderColor=a.color+"40")}
                  onMouseLeave={e=>(e.currentTarget.style.borderColor="")}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{background:a.bg}}>{a.icon}</div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{a.label}</div>
                    <div className="text-[11px] text-gray-400">{a.sub}</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 ml-auto transition-transform group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          </div>

          {/* Hospital Info */}
          <div className="hd-card p-5 hd-enter hd-s4">
            <div className="hd-sec-hdr"><span className="hd-sec-title"><Building2 className="w-4 h-4 text-blue-600" /> Hospital Profile</span></div>
            <div className="space-y-2.5">
              {[
                {icon:<MapPin className="w-3.5 h-3.5"/>,   label:hospitalData?.district ? `${hospitalData.district}, ${hospitalData.pincode||""}` : "—"},
                {icon:<Phone className="w-3.5 h-3.5"/>,    label:hospitalData?.mobile||"—"},
                {icon:<Hash className="w-3.5 h-3.5"/>,     label:hospitalData?.registrationNo||"—"},
              ].map((r,i)=>(
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-gray-400">{r.icon}</span>{r.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   REQUESTS TABLE VIEW
═══════════════════════════════════════════════════════════════════ */
function RequestsView({
  requests, onViewQR, onCopyRTID, onDelete, onPrint, onConfirmReceipt, onNewRequest,
}: {
  requests:BloodRequest[];
  onViewQR:(r:BloodRequest)=>void; onCopyRTID:(rtid:string)=>void;
  onDelete:(id:string)=>void; onPrint:(r:BloodRequest)=>void;
  onConfirmReceipt:(id:string,r:BloodRequest)=>void;
  onNewRequest:(u:UrgencyLevel)=>void;
}) {
  const [search,       setSearch]       = useState("");
  const [filterBG,     setFilterBG]     = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterUrgency,setFilterUrgency]= useState("All");
  const [sortBy,       setSortBy]       = useState("newest");
  const [expanded,     setExpanded]     = useState<string|null>(null);

  const filtered = useMemo(() => {
    let f = [...requests];
    if (filterBG!=="All")      f=f.filter(r=>r.bloodGroup===filterBG);
    if (filterUrgency!=="All") f=f.filter(r=>r.urgency===filterUrgency);
    if (filterStatus!=="All") {
      if (filterStatus==="VALID")   f=f.filter(r=>isRequestValid(r)&&!["REDEEMED","EXPIRED","CANCELLED"].includes(r.status));
      else if (filterStatus==="EXPIRED") f=f.filter(r=>!isRequestValid(r)||r.status==="EXPIRED");
      else f=f.filter(r=>r.status===filterStatus);
    }
    if (search) {
      const s=search.toLowerCase();
      f=f.filter(r=>r.patientName.toLowerCase().includes(s)||r.rtid.toLowerCase().includes(s)||(r.serialNumber||"").toLowerCase().includes(s));
    }
    f.sort((a,b) => {
      if (sortBy==="newest") return b.createdAt.getTime()-a.createdAt.getTime();
      if (sortBy==="urgency") {
        const order={Emergency:0,Urgent:1,Routine:2};
        return (order[a.urgency||"Routine"]||2)-(order[b.urgency||"Routine"]||2);
      }
      if (sortBy==="validity") return getValidityPct(b)-getValidityPct(a);
      return 0;
    });
    return f;
  }, [requests,filterBG,filterStatus,filterUrgency,search,sortBy]);

  const handleConfirm = (r:BloodRequest) => {
    Swal.fire({
      title:"Confirm Blood Receipt",
      html:`<div class="text-left space-y-3 p-2"><p class="text-sm text-gray-700">Confirm receipt for:</p><div class="bg-blue-50 p-3 rounded-lg border border-blue-200 text-sm space-y-1"><p><b>RTID:</b> <span class="font-mono">${r.rtid}</span></p><p><b>Patient:</b> ${r.patientName}</p><p><b>Blood:</b> ${r.bloodGroup} — ${r.componentType||"Whole Blood"} × ${r.unitsRequired} units</p></div><p class="text-sm text-red-600 font-semibold">⚠️ This action is irreversible.</p></div>`,
      icon:"question", showCancelButton:true,
      confirmButtonColor:"#16a34a", cancelButtonColor:"#6b7280",
      confirmButtonText:"Confirm Receipt", cancelButtonText:"Cancel",
    }).then(res=>{ if(res.isConfirmed) onConfirmReceipt(r.id,r); });
  };

  return (
    <div className="space-y-5">
      {/* Filters Bar */}
      <div className="hd-card p-4 hd-enter">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="hd-search" placeholder="Search patient name, RTID, serial…" value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { val:filterBG,     set:setFilterBG,     opts:["All",...BLOOD_GROUPS], label:"Blood Group" },
              { val:filterUrgency,set:setFilterUrgency,opts:["All","Emergency","Urgent","Routine"], label:"Urgency" },
              { val:filterStatus, set:setFilterStatus, opts:["All","VALID","PENDING","PARTIAL","REDEEMED","EXPIRED"], label:"Status" },
              { val:sortBy,       set:setSortBy,       opts:[{v:"newest",l:"Newest"},{v:"urgency",l:"Urgency"},{v:"validity",l:"Validity"}].map(x=>x.v), label:"Sort" },
            ].map(f=>(
              <select key={f.label} value={f.val} onChange={e=>f.set(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white text-gray-700 font-medium outline-none focus:border-[#8B0000]/40 cursor-pointer"
                style={{appearance:"none",paddingRight:"1.5rem",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 6px center"}}>
                {f.opts.map((o:string)=><option key={o} value={o}>{o}</option>)}
              </select>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">{filtered.length} of {requests.length} requests shown</p>
      </div>

      {/* Table / Cards */}
      {filtered.length===0 ? (
        <div className="hd-card p-12 text-center hd-enter">
          <div className="text-5xl opacity-20 mb-3">🔍</div>
          <p className="text-gray-500 font-medium">No requests found</p>
          <button onClick={()=>onNewRequest("Routine")} className="mt-4 text-sm text-[#8B0000] font-semibold hover:underline">Create new request →</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r,i)=>{
            const isV  = isRequestValid(r);
            const sm   = getStatusMeta(isV?r.status:"EXPIRED");
            const uc2  = URGENCY_CONFIG[r.urgency||"Routine"];
            const rem  = getTimeRemaining(r);
            const pct  = getValidityPct(r);
            const canVerify = r.status==="REDEEMED";
            const isExpanded = expanded===r.id;
            const fulfPct = r.unitsRequired>0?(r.unitsFulfilled/r.unitsRequired)*100:0;

            return (
              <div key={r.id} className={`hd-card overflow-hidden transition-all hd-enter`} style={{animationDelay:`${i*0.04}s`}}>
                <div className="p-4 cursor-pointer" onClick={()=>setExpanded(isExpanded?null:r.id)}>
                  <div className="flex items-start gap-3">
                    {/* Urgency indicator */}
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 border"
                      style={{background:uc2.bg,borderColor:uc2.border}}>
                      {r.urgency==="Emergency"?"🚨":r.urgency==="Urgent"?"⚡":"📋"}
                    </div>
                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-800 text-sm">{r.patientName}</span>
                        {r.age && <span className="text-xs text-gray-400">{r.age}y</span>}
                        <span className="text-xs font-black px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-100">{r.bloodGroup}</span>
                        {r.urgency==="Emergency" && <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">EMERGENCY</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-[11px] font-mono text-gray-400">{r.rtid}</span>
                        <span className="text-[11px] text-gray-500">{r.componentType||"Whole Blood"} × {r.unitsRequired}</span>
                        {r.wardDepartment && <span className="text-[11px] text-gray-400">{r.wardDepartment}</span>}
                      </div>
                      {/* Validity bar */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="hd-validity flex-1">
                          <div className="hd-validity-fill" style={{width:`${pct}%`,background:pct>50?"#22c55e":pct>20?"#f59e0b":"#ef4444"}} />
                        </div>
                        <span className={`text-[10px] font-semibold ${isV?"text-gray-500":"text-red-500"}`}>{rem}</span>
                      </div>
                    </div>
                    {/* Status + toggle */}
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className="hd-status border text-[11px]" style={{background:sm.bg,color:sm.text,borderColor:sm.border}}>{sm.label}</span>
                      {r.unitsFulfilled>0 && (
                        <span className="text-[10px] text-gray-500">{r.unitsFulfilled}/{r.unitsRequired} fulfilled</span>
                      )}
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded?"rotate-180":""}`} />
                    </div>
                  </div>
                  {/* Fulfillment bar */}
                  {r.unitsFulfilled>0 && (
                    <div className="hd-prog mt-2">
                      <div className="hd-prog-fill" style={{width:`${fulfPct}%`}} />
                    </div>
                  )}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-4 hd-enter">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {[
                        ["Serial",r.serialNumber||"—"],
                        ["Required By",`${formatDate(r.requiredBy)} ${formatTime(r.requiredBy)}`],
                        ["Created",timeAgo(r.createdAt)],
                        ["Indication",r.transfusionIndication||"—"],
                        ["Doctor",r.doctorName||"—"],
                        ["Reg. No",r.doctorRegNo||"—"],
                        ["Bed",r.bedNumber||"—"],
                        ["Mobile",r.patientMobile||"—"],
                      ].map(([k,v])=>(
                        <div key={k}><p className="text-gray-400 font-semibold uppercase text-[10px]">{k}</p><p className="text-gray-800 font-medium mt-0.5">{v}</p></div>
                      ))}
                    </div>
                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <button onClick={e=>{e.stopPropagation();onPrint(r);}} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 transition-all"><Printer className="w-3.5 h-3.5" /> Print Slip</button>
                      <button onClick={e=>{e.stopPropagation();onViewQR(r);}} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 transition-all"><QrCode className="w-3.5 h-3.5" /> View QR</button>
                      <button onClick={e=>{e.stopPropagation();onCopyRTID(r.rtid);}} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 transition-all"><Copy className="w-3.5 h-3.5" /> Copy RTID</button>
                      {canVerify && (
                        <button onClick={e=>{e.stopPropagation();handleConfirm(r);}} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"><CheckCircle2 className="w-3.5 h-3.5" /> Confirm Receipt</button>
                      )}
                      {r.status!=="REDEEMED" && (
                        <button onClick={e=>{e.stopPropagation();onDelete(r.id);}} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-red-200 rounded-lg hover:bg-red-50 text-red-600 transition-all ml-auto"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN HOSPITAL DASHBOARD
═══════════════════════════════════════════════════════════════════ */
const HospitalDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const [requests,          setRequests]          = useState<BloodRequest[]>([]);
  const [hospitalData,      setHospitalData]      = useState<any>(null);
  const [notifications,     setNotifications]     = useState(INITIAL_NOTIFS);
  const [isRequestModalOpen,setIsRequestModalOpen]= useState(false);
  const [isQRModalOpen,     setIsQRModalOpen]     = useState(false);
  const [isNotifOpen,       setIsNotifOpen]       = useState(false);
  const [selectedRequest,   setSelectedRequest]   = useState<BloodRequest|null>(null);
  const [requestToPrint,    setRequestToPrint]    = useState<BloodRequest|null>(null);
  const [modalUrgency,      setModalUrgency]      = useState<UrgencyLevel>("Routine");
  const [activeTab,         setActiveTab]         = useState<"overview"|"requests">("overview");
  const [tabKey,            setTabKey]            = useState(0);
  const [loading,           setLoading]           = useState(true);

  const hospitalId = localStorage.getItem("userId");

  // Auto-print
  useEffect(() => {
    if (requestToPrint) {
      const t = setTimeout(() => { window.print(); setRequestToPrint(null); }, 500);
      return () => clearTimeout(t);
    }
  }, [requestToPrint]);

  // Fetch data (same logic as original)
  useEffect(() => {
    if (!hospitalId) { toast.error("Not logged in."); return; }
    const fetchData = async () => {
      setLoading(true);
      try {
        const userRef = doc(db,"users",hospitalId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) setHospitalData(userSnap.data());

        const q = query(collection(db,"bloodRequests"),where("hospitalId","==",hospitalId));
        const snap = await getDocs(q);
        const fetched: BloodRequest[] = [];
        let allLinkedDonations: any[] = [];
        const rtids = snap.docs.map(d=>d.data().rtid||d.data().linkedRTID).filter(Boolean);
        if (rtids.length>0) {
          for (let i=0;i<rtids.length;i+=10) {
            try {
              const batch=rtids.slice(i,i+10);
              const ds=await getDocs(query(collection(db,"donations"),where("linkedHrtid","in",batch)));
              allLinkedDonations.push(...ds.docs.map(d=>d.data()));
            } catch(_) {}
          }
        }
        const parseT=(t:any)=>{ if(t?.toDate) return t.toDate(); if(typeof t==="string") return new Date(t); return new Date(); };
        snap.forEach(d=>{
          const data=d.data();
          const linkedDonors=allLinkedDonations
            .filter((ld:any)=>ld.linkedHrtid===data.linkedRTID||ld.linkedHrtid===data.rtid)
            .map((ld:any)=>({dRtid:ld.rtidCode||ld.rtid||"N/A",name:ld.donorName||"Anonymous",date:parseT(ld.date).toISOString()}));

          // Map old urgency values to new NACO levels
          const rawUrgency = data.urgency as string;
          let mappedUrgency: UrgencyLevel = "Routine";
          if (rawUrgency === "Critical" || rawUrgency === "Emergency") mappedUrgency = "Emergency";
          else if (rawUrgency === "High" || rawUrgency === "Urgent")   mappedUrgency = "Urgent";
          else if (rawUrgency === "Normal" || rawUrgency === "Routine") mappedUrgency = "Routine";
          else if (rawUrgency) mappedUrgency = (rawUrgency as UrgencyLevel) || "Routine";

          fetched.push({
            id:d.id, rtid:data.linkedRTID||data.rtid,
            serialNumber:data.serialNumber, patientName:data.patientName,
            bloodGroup:data.bloodGroup, componentType:data.componentType,
            transfusionIndication:data.transfusionIndication,
            unitsRequired:parseInt(data.units)||0,
            unitsFulfilled:data.fulfilled?parseInt(data.fulfilled):linkedDonors.length,
            requiredBy:parseT(data.requiredBy), status:data.status,
            city:data.city, createdAt:parseT(data.createdAt),
            patientMobile:data.patientMobile, patientAadhaar:data.patientAadhaar,
            pincode:data.pincode, age:data.age?parseInt(data.age):undefined,
            urgency:mappedUrgency,
            donors:linkedDonors, doctorName:data.doctorName, doctorRegNo:data.doctorRegNo,
            wardDepartment:data.wardDepartment, bedNumber:data.bedNumber,
            validityHours:data.validityHours||URGENCY_CONFIG[mappedUrgency].validityHours,
            scannedAt:data.scannedAt, scannedLocation:data.scannedLocation,
            redeemedAt:data.redeemedAt?parseT(data.redeemedAt):undefined,
            generatedBy:data.generatedBy, systemVersion:data.systemVersion,
          });
        });
        fetched.sort((a,b)=>b.createdAt.getTime()-a.createdAt.getTime());

        // Auto-expire
        const now=new Date(); const toExpire:string[]=[];
        fetched.forEach(r=>{
          if(r.validityHours&&r.createdAt) {
            const valid=new Date(r.createdAt.getTime()+r.validityHours*3600000);
            if(now>valid&&!["REDEEMED","HOSPITAL VERIFIED","CLOSED","EXPIRED","CANCELLED"].includes(r.status)) {
              toExpire.push(r.id); r.status="EXPIRED" as RequestStatus;
            }
          }
        });
        if(toExpire.length>0) {
          await Promise.all(toExpire.map(id=>updateDoc(doc(db,"bloodRequests",id),{status:"EXPIRED"}).catch(()=>{})));
        }
        setRequests(fetched);
        toast.success("Dashboard loaded");
      } catch(err:any) {
        toast.error("Failed to load", { description: err?.message });
        setRequests([]);
      } finally { setLoading(false); }
    };
    fetchData();
  }, [hospitalId]);

  // KPIs
  const kpis = useMemo(() => ({
    totalRequests:    requests.length,
    activeRequests:   requests.filter(r=>["PENDING","PARTIAL","PLEDGED"].includes(r.status)&&isRequestValid(r)).length,
    totalUnits:       requests.reduce((s,r)=>s+r.unitsRequired,0),
    donationsReceived:requests.filter(r=>r.status==="REDEEMED"||r.status==="HOSPITAL VERIFIED").length,
    requestsRedeemed: requests.filter(r=>r.status==="REDEEMED"||r.status==="HOSPITAL VERIFIED"||r.status==="CLOSED").length,
  }), [requests]);

  // Handlers — all identical logic to original
  const handleNewRequest = async (data: any) => {
    if (!hospitalId) { toast.error("Hospital ID not found."); return; }
    try {
      const reqDateTime = new Date(`${data.requiredByDate}T${data.requiredByTime}:00`);
      if (isNaN(reqDateTime.getTime())) { toast.error("Invalid date/time"); return; }
      const newHrtid     = generateRtid("H");
      const serial       = generateSerialNumber();
      const validityH    = URGENCY_CONFIG[data.urgency as UrgencyLevel]?.validityHours || 48;
      const now          = new Date();
      const reqData: any = {
        hospitalId, bloodBankId:"",
        patientName:data.patientName, patientMobile:data.mobile, patientAadhaar:data.aadhaar,
        bloodGroup:data.bloodGroup, componentType:data.componentType||"Whole Blood",
        transfusionIndication:data.transfusionIndication||"Anemia",
        units:String(data.unitsRequired), fulfilled:"0",
        age:String(data.age), city:data.city, pincode:data.pincode,
        requiredBy:reqDateTime.toISOString(), urgency:data.urgency||"Routine",
        status:"CREATED", linkedRTID:newHrtid, rtid:newHrtid,
        serialNumber:serial, validityHours:validityH,
        createdAt:now.toISOString(),
        doctorName:data.doctorName||"", doctorRegNo:data.doctorRegNo||"",
        wardDepartment:data.wardDepartment||"", bedNumber:data.bedNumber||"",
        generatedBy:hospitalData?.fullName||"Hospital", systemVersion:SYSTEM_VERSION,
      };
      const ref = await addDoc(collection(db,"bloodRequests"),reqData);
      const newReq: BloodRequest = {
        id:ref.id, rtid:newHrtid, serialNumber:serial,
        patientName:data.patientName, bloodGroup:data.bloodGroup as BloodGroup,
        componentType:data.componentType as BloodComponentType,
        transfusionIndication:data.transfusionIndication as TransfusionIndication,
        unitsRequired:data.unitsRequired, unitsFulfilled:0,
        requiredBy:reqDateTime, status:"CREATED",
        city:data.city, createdAt:now,
        patientMobile:data.mobile, patientAadhaar:data.aadhaar, pincode:data.pincode,
        age:data.age, urgency:data.urgency as UrgencyLevel,
        donors:[], doctorName:data.doctorName, doctorRegNo:data.doctorRegNo,
        wardDepartment:data.wardDepartment, bedNumber:data.bedNumber,
        validityHours:validityH, generatedBy:hospitalData?.fullName, systemVersion:SYSTEM_VERSION,
      };
      setRequests(prev=>[newReq,...prev]);
      setIsRequestModalOpen(false);
      toast.success("Request Created", { description:`RTID: ${newHrtid} · Valid ${validityH}h` });
      setNotifications(prev=>[{id:Date.now().toString(),message:`New ${data.urgency} request for ${data.patientName}`,time:"Just now",type:"new"},...prev]);
      setRequestToPrint(newReq);
    } catch(err:any) {
      toast.error("Failed to create request", { description:err?.message });
    }
  };

  const handleConfirmReceipt = async (reqId:string, request:BloodRequest) => {
    try {
      const ref = doc(db,"bloodRequests",reqId);
      const newStatus: RequestStatus = request.status==="REDEEMED"?"HOSPITAL VERIFIED":request.status==="HOSPITAL VERIFIED"?"CLOSED":"REDEEMED";
      await updateDoc(ref,{ status:newStatus, redeemedAt:new Date().toISOString(), scannedLocation:hospitalData?.fullName||"Hospital" });
      setRequests(prev=>prev.map(r=>r.id===reqId?{...r,status:newStatus,redeemedAt:new Date(),scannedLocation:hospitalData?.fullName}:r));
      toast.success(`Status updated to ${newStatus}`);
    } catch(err) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = (id:string) => {
    const r = requests.find(x=>x.id===id);
    if (r?.status==="REDEEMED") { Swal.fire("Cannot Delete","Redeemed requests cannot be deleted.","warning"); return; }
    Swal.fire({ title:"Delete Request?", text:"This action cannot be undone.", icon:"warning",
      showCancelButton:true, confirmButtonColor:"#8B0000", confirmButtonText:"Yes, delete" })
      .then(async res => {
        if (res.isConfirmed) {
          try { await deleteDoc(doc(db,"bloodRequests",id)); setRequests(prev=>prev.filter(r=>r.id!==id)); toast.success("Deleted"); }
          catch { toast.error("Failed to delete"); }
        }
      });
  };

  const handleLogout = () => {
    Swal.fire({ title:"Logout?", icon:"question", showCancelButton:true,
      confirmButtonColor:"#8B0000", confirmButtonText:"Yes, logout" })
      .then(res=>{ if(res.isConfirmed) onLogout(); });
  };

  const openNewRequest = (urg: UrgencyLevel) => {
    setModalUrgency(urg);
    setIsRequestModalOpen(true);
  };

  const handleTabChange = (tab: "overview"|"requests") => {
    setActiveTab(tab);
    setTabKey(k=>k+1);
  };

  const navTabs = [
    { id:"overview" as const,  label:"Dashboard",  icon:"🏥" },
    { id:"requests" as const,  label:"All Requests", icon:"📋", badge:requests.length },
  ];

  return (
    <>
      <style>{HD_STYLES}</style>
      <div className="hd-root no-print">

        {/* ── HEADER ── */}
        <header className="hd-header no-print">
          <div className="container mx-auto px-3 sm:px-5 max-w-7xl relative z-10">
            <div className="flex items-center gap-2 sm:gap-3 py-3">
              <div className="hd-logo-frame">
                <img src={logo} alt="RaktPort" className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-lg" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="hd-brand text-xl sm:text-[1.3rem]">RaktPort</span>
                  <span className="text-[10px] text-red-200/50 uppercase tracking-widest font-semibold hidden sm:inline">Hospital Portal</span>
                </div>
                {hospitalData?.fullName && (
                  <div className="hd-hosp-name">
                    <Building2 className="w-3 h-3 flex-shrink-0 text-red-300/70" />
                    <span className="truncate max-w-[180px] sm:max-w-xs">{hospitalData.fullName}</span>
                  </div>
                )}
              </div>
              <div className="hd-loc-chip hidden md:flex">
                <MapPin className="w-2.5 h-2.5" />
                {hospitalData?.district||"…"}, {hospitalData?.pincode||"…"}
              </div>
              {/* Pending urgent banner */}
              {requests.filter(r=>r.urgency==="Emergency"&&isRequestValid(r)&&!["REDEEMED","CLOSED"].includes(r.status)).length>0 && (
                <div className="hidden sm:flex items-center gap-1.5 bg-red-900/40 border border-red-400/30 text-red-100 text-xs font-bold px-3 py-1.5 rounded-full animate-pulse">
                  <Siren className="w-3 h-3" />
                  {requests.filter(r=>r.urgency==="Emergency"&&isRequestValid(r)&&!["REDEEMED","CLOSED"].includes(r.status)).length} Emergency
                </div>
              )}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-auto">
                <button onClick={()=>setIsNotifOpen(!isNotifOpen)} className="hd-hdr-btn" aria-label="Notifications">
                  <Bell className="w-4 h-4" />
                  {notifications.length>0 && <span className="hd-notif-badge">{notifications.length>9?"9+":notifications.length}</span>}
                </button>
                <button onClick={handleLogout} className="hd-logout-btn">
                  <LogOut className="w-3.5 h-3.5" /><span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
            {/* Mobile location */}
            <div className="flex items-center gap-2 pb-2 md:hidden">
              <MapPin className="w-2.5 h-2.5 text-red-200/40" />
              <span className="text-[11px] text-red-200/45">{hospitalData?.district||"…"}, {hospitalData?.pincode||"…"}</span>
            </div>
          </div>
        </header>

        {/* ── NAV ── */}
        <nav className="hd-nav no-print">
          <div className="container mx-auto max-w-7xl">
            <div className="hd-nav-inner">
              {navTabs.map(t=>(
                <button key={t.id} onClick={()=>handleTabChange(t.id)}
                  className={`hd-nav-tab ${activeTab===t.id?"hd-nav-active":""}`}>
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                  {t.badge && t.badge>0 && (
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${activeTab===t.id?"bg-white/20 text-white":"bg-[#8B0000] text-white"}`}>{t.badge}</span>
                  )}
                </button>
              ))}
              <div className="ml-auto flex items-center">
                <button
                  onClick={()=>openNewRequest("Routine")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:shadow-lg"
                  style={{background:"linear-gradient(135deg,#8B0000,#b30000)"}}>
                  <Plus className="w-3.5 h-3.5" /> New Request
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Notifications Drawer */}
        <NotifDrawer isOpen={isNotifOpen} notifs={notifications} onClose={()=>setIsNotifOpen(false)} />

        {/* ── MAIN CONTENT ── */}
        <main className="container mx-auto px-3 sm:px-5 py-5 sm:py-7 max-w-7xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="relative w-14 h-14">
                <div className="w-14 h-14 rounded-full border-4 border-red-100 border-t-[#8B0000] animate-spin" />
                <Droplet className="absolute inset-0 m-auto w-5 h-5 text-[#8B0000] fill-[#8B0000]" />
              </div>
              <p className="text-sm text-gray-400 font-medium animate-pulse">Loading Hospital Dashboard…</p>
            </div>
          ) : (
            <div key={tabKey}>
              {activeTab === "overview" && (
                <PremiumDashboard
                  requests={requests} hospitalData={hospitalData} kpis={kpis}
                  onNewRequest={openNewRequest}
                  onViewQR={r=>{ setSelectedRequest(r); setIsQRModalOpen(true); }}
                  onDelete={handleDelete}
                  onPrint={r=>setRequestToPrint(r)}
                  onConfirmReceipt={handleConfirmReceipt}
                />
              )}
              {activeTab === "requests" && (
                <RequestsView
                  requests={requests}
                  onViewQR={r=>{ setSelectedRequest(r); setIsQRModalOpen(true); }}
                  onCopyRTID={rtid=>{ copyToClipboard(rtid); toast.success("RTID copied!"); }}
                  onDelete={handleDelete}
                  onPrint={r=>setRequestToPrint(r)}
                  onConfirmReceipt={handleConfirmReceipt}
                  onNewRequest={openNewRequest}
                />
              )}
            </div>
          )}
        </main>

        {/* FAB — visible on requests tab on mobile */}
        <button className="hd-fab no-print" onClick={()=>openNewRequest("Routine")}>
          <Plus className="w-5 h-5" />
          <span>New Request</span>
        </button>

        {/* Modals */}
        <NewRequestModal
          isOpen={isRequestModalOpen}
          onClose={()=>setIsRequestModalOpen(false)}
          onSubmit={handleNewRequest}
          defaultCity={hospitalData?.district||""}
          defaultPincode={hospitalData?.pincode||""}
          defaultUrgency={modalUrgency}
          hospitalName={hospitalData?.fullName||"Hospital"}
        />
        <QRModal isOpen={isQRModalOpen} onClose={()=>setIsQRModalOpen(false)} request={selectedRequest} />
      </div>

      {/* Printable slip */}
      <PrintableRequest request={requestToPrint} hospital={hospitalData} />
    </>
  );
};

export default HospitalDashboard;