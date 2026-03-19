// HospitalDashboard.tsx — FIXED v3.1.0
// Fixes: (1) Emergency button visibility, (2) Print slip A4, (3) Step-3 form bug,
//        (4) Hospital profile in header, (5) Notification improvements,
//        (6) Request Completion button (marks blood administered → updates BloodBank + Donor)

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
  Hash, Timer, Sparkles, CheckSquare, ExternalLink, Mail, Star,
  BellOff, CheckCheck, Trash, UserCircle, BadgeCheck, HeartHandshake
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import logo from '../assets/raktport-logo.png';

import { db } from '../firebase';
import {
  collection, query, where, getDocs, addDoc, deleteDoc,
  doc, getDoc, updateDoc
} from 'firebase/firestore';

// @ts-ignore
import { BLOOD_GROUPS, generateRtid } from "@/lib/bloodbank-utils";

/* ═══════════════════════════════════════════════════════════════
   GLOBAL STYLES
═══════════════════════════════════════════════════════════════ */
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
  --hd-font-display: 'Outfit', sans-serif;
  --hd-font-body: 'DM Sans', sans-serif;
}

.hd-root { font-family: var(--hd-font-body); background: var(--hd-surface); min-height: 100vh; }

/* ── Animations ── */
@keyframes hd-fade-up   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes hd-scale-in  { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
@keyframes hd-slide-r   { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
@keyframes hd-count-up  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes hd-pulse-ring{ 0%{box-shadow:0 0 0 0 rgba(139,0,0,0.35)} 70%{box-shadow:0 0 0 8px rgba(139,0,0,0)} 100%{box-shadow:0 0 0 0 rgba(139,0,0,0)} }
@keyframes hd-bounce-dot{ 0%,100%{transform:scale(1)} 50%{transform:scale(1.35)} }
@keyframes hd-float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
@keyframes hd-shimmer   { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

.hd-enter    { animation: hd-fade-up  0.42s cubic-bezier(0.4,0,0.2,1) both; }
.hd-enter-sm { animation: hd-scale-in 0.32s cubic-bezier(0.4,0,0.2,1) both; }
.hd-s1{animation-delay:.04s} .hd-s2{animation-delay:.08s} .hd-s3{animation-delay:.12s}
.hd-s4{animation-delay:.16s} .hd-s5{animation-delay:.20s} .hd-s6{animation-delay:.24s}

/* ── Header ── */
.hd-header {
  background: linear-gradient(135deg, #6b0000 0%, #8B0000 50%, #9e0000 100%);
  position: sticky; top: 0; z-index: 50;
  box-shadow: 0 4px 20px rgba(139,0,0,0.28);
}
.hd-header::before {
  content:''; position:absolute; inset:0; pointer-events:none;
  background: radial-gradient(ellipse at 8% 50%, rgba(255,255,255,0.07) 0%, transparent 55%),
              radial-gradient(ellipse at 92% 30%, rgba(255,255,255,0.04) 0%, transparent 40%);
}
.hd-header::after {
  content:''; position:absolute; bottom:0; left:0; right:0; height:1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
}
.hd-logo-frame {
  background:rgba(255,255,255,0.14); border:1.5px solid rgba(255,255,255,0.24);
  border-radius:13px; padding:5px; flex-shrink:0; transition:all 0.3s;
}
.hd-logo-frame:hover { background:rgba(255,255,255,0.22); transform:scale(1.04) rotate(-1deg); }
.hd-brand { font-family:var(--hd-font-display); font-weight:800; color:#fff; letter-spacing:-0.03em; line-height:1; }
.hd-hosp-name { font-size:0.73rem; color:rgba(255,205,185,0.85); font-weight:500; margin-top:2px; display:flex; align-items:center; gap:4px; }
.hd-loc-chip {
  background:rgba(255,255,255,0.11); border:1px solid rgba(255,255,255,0.2); border-radius:999px;
  padding:3px 10px; font-size:0.68rem; color:rgba(255,255,255,0.75); font-weight:500;
  display:flex; align-items:center; gap:4px; white-space:nowrap; transition:background 0.2s; cursor:default;
}
.hd-hdr-btn {
  width:38px; height:38px; border-radius:10px;
  background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2);
  display:flex; align-items:center; justify-content:center;
  color:#fff; cursor:pointer; transition:all 0.2s; position:relative; flex-shrink:0;
}
.hd-hdr-btn:hover { background:rgba(255,255,255,0.22); transform:translateY(-1px); }
.hd-notif-badge {
  position:absolute; top:-5px; right:-5px; min-width:17px; height:17px;
  background:#ff3737; border:2px solid #8B0000; border-radius:999px;
  font-size:8px; font-weight:800; color:#fff; display:flex; align-items:center; justify-content:center; padding:0 3px;
  animation: hd-bounce-dot 1.4s ease-in-out infinite;
}
/* FIX 1: Emergency header button — white bg so it contrasts with crimson header */
.hd-emg-btn {
  display:flex; align-items:center; gap:6px;
  background:#ffffff; border:2px solid rgba(255,255,255,0.6);
  border-radius:10px; padding:6px 14px;
  color:#8B0000; font-size:0.78rem; font-weight:800;
  font-family:var(--hd-font-body); cursor:pointer; transition:all 0.2s;
  box-shadow:0 2px 8px rgba(0,0,0,0.15); white-space:nowrap; flex-shrink:0;
}
.hd-emg-btn:hover { background:#fff5f5; transform:translateY(-1px); box-shadow:0 4px 14px rgba(0,0,0,0.2); }
.hd-logout-btn {
  background:rgba(255,255,255,0.1); border:1.5px solid rgba(255,255,255,0.22);
  border-radius:9px; padding:6px 12px; color:#fff; font-size:0.78rem; font-weight:600;
  display:flex; align-items:center; gap:5px; cursor:pointer; transition:all 0.2s;
  font-family:var(--hd-font-body); white-space:nowrap;
}
.hd-logout-btn:hover { background:rgba(255,70,70,0.28); transform:translateY(-1px); }
.hd-profile-btn {
  background:rgba(255,255,255,0.12); border:1.5px solid rgba(255,255,255,0.22);
  border-radius:10px; padding:5px 10px; color:#fff; font-size:0.72rem; font-weight:600;
  display:flex; align-items:center; gap:5px; cursor:pointer; transition:all 0.2s;
  font-family:var(--hd-font-body); flex-shrink:0;
}
.hd-profile-btn:hover { background:rgba(255,255,255,0.22); transform:translateY(-1px); }

/* ── Nav ── */
.hd-nav { background:#fff; border-bottom:1px solid rgba(139,0,0,0.07); box-shadow:0 2px 8px rgba(0,0,0,0.04); position:sticky; top:64px; z-index:40; }
@media(max-width:640px){ .hd-nav{top:58px;} }
.hd-nav-inner { display:flex; gap:2px; overflow-x:auto; padding:8px 16px; scrollbar-width:none; }
.hd-nav-inner::-webkit-scrollbar{display:none;}
.hd-nav-tab {
  display:flex; align-items:center; gap:6px; padding:7px 14px;
  border-radius:10px; font-size:0.78rem; font-weight:500; cursor:pointer;
  border:none; white-space:nowrap; transition:all 0.22s cubic-bezier(0.4,0,0.2,1);
  background:transparent; color:#6b7280; font-family:var(--hd-font-body); flex-shrink:0;
}
.hd-nav-tab:hover:not(.hd-nav-active){background:rgba(139,0,0,0.05);color:#8B0000;}
.hd-nav-active{background:linear-gradient(135deg,#8B0000,#b30000);color:#fff !important;font-weight:600;box-shadow:0 3px 10px rgba(139,0,0,0.3);transform:translateY(-1px);}

/* ── KPI ── */
.hd-kpi-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;}
@media(min-width:640px){.hd-kpi-grid{grid-template-columns:repeat(3,1fr);}}
@media(min-width:1024px){.hd-kpi-grid{grid-template-columns:repeat(5,1fr);}}
.hd-kpi{background:var(--hd-card);border-radius:16px;padding:18px 16px 14px;border:1px solid var(--hd-border);box-shadow:var(--hd-shadow-sm);transition:all 0.28s cubic-bezier(0.4,0,0.2,1);position:relative;overflow:hidden;}
.hd-kpi::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;border-radius:16px 16px 0 0;}
.hd-kpi:hover{transform:translateY(-3px);box-shadow:var(--hd-shadow-md);border-color:rgba(139,0,0,0.15);}
.hd-kpi.k-red::before{background:linear-gradient(90deg,#8B0000,#c41e3a);}
.hd-kpi.k-green::before{background:linear-gradient(90deg,#059669,#10b981);}
.hd-kpi.k-blue::before{background:linear-gradient(90deg,#0284c7,#38bdf8);}
.hd-kpi.k-amber::before{background:linear-gradient(90deg,#d97706,#fbbf24);}
.hd-kpi.k-purple::before{background:linear-gradient(90deg,#7c3aed,#a78bfa);}
.hd-kpi-val{font-family:var(--hd-font-display);font-size:1.7rem;font-weight:800;color:#111827;line-height:1;animation:hd-count-up 0.5s ease both;}
.hd-kpi-lbl{font-size:0.7rem;color:#9ca3af;font-weight:500;margin-top:3px;letter-spacing:0.02em;}

/* ── Welcome Banner ── */
.hd-welcome{background:linear-gradient(135deg,#6b0000 0%,#8B0000 55%,#9e0000 100%);border-radius:20px;padding:24px 28px;position:relative;overflow:hidden;margin-bottom:20px;}
.hd-welcome::before{content:'';position:absolute;right:-50px;top:-50px;width:220px;height:220px;background:radial-gradient(circle,rgba(255,255,255,0.07) 0%,transparent 65%);border-radius:50%;}
.hd-welcome::after{content:'';position:absolute;left:-30px;bottom:-50px;width:160px;height:160px;background:radial-gradient(circle,rgba(255,255,255,0.04) 0%,transparent 60%);border-radius:50%;}
.hd-welcome-title{font-family:var(--hd-font-display);font-size:1.3rem;font-weight:800;color:#fff;}

/* FIX 1: Welcome banner emergency button — white outlined so it's visible on crimson */
.hd-welcome-emg-btn {
  display:flex; align-items:center; gap:6px;
  background:rgba(255,255,255,0.15); border:1.5px solid rgba(255,255,255,0.45);
  border-radius:11px; padding:7px 14px; color:#fff; font-size:0.78rem; font-weight:700;
  cursor:pointer; transition:all 0.22s; font-family:var(--hd-font-body); backdrop-filter:blur(4px);
}
.hd-welcome-emg-btn:hover{background:rgba(255,255,255,0.28);border-color:rgba(255,255,255,0.7);transform:translateY(-1px);}
.hd-welcome-new-btn{
  display:flex; align-items:center; gap:6px;
  background:#ffffff; border:1.5px solid rgba(255,255,255,0.8);
  border-radius:11px; padding:7px 14px; color:#8B0000; font-size:0.78rem; font-weight:800;
  cursor:pointer; transition:all 0.22s; font-family:var(--hd-font-body); box-shadow:0 2px 8px rgba(0,0,0,0.1);
}
.hd-welcome-new-btn:hover{background:#fff;transform:translateY(-1px);box-shadow:0 4px 14px rgba(0,0,0,0.18);}

/* ── Section ── */
.hd-sec-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
.hd-sec-title{font-family:var(--hd-font-display);font-size:0.95rem;font-weight:700;color:#111827;display:flex;align-items:center;gap:7px;}
.hd-card{background:var(--hd-card);border-radius:18px;border:1px solid var(--hd-border);box-shadow:var(--hd-shadow-sm);}

/* ── Urgency chips ── */
.hd-urg{border-radius:999px;padding:3px 10px;font-size:0.68rem;font-weight:700;letter-spacing:0.03em;display:inline-flex;align-items:center;gap:4px;}
.hd-status{border-radius:999px;padding:3px 10px;font-size:0.67rem;font-weight:700;display:inline-flex;align-items:center;gap:4px;}

/* ── Urgency selector ── */
.hd-urg-selector{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.hd-urg-opt{border-radius:12px;padding:12px 10px;border:2px solid #e5e7eb;cursor:pointer;transition:all 0.2s;text-align:center;background:#fff;}
.hd-urg-opt:hover{border-color:rgba(139,0,0,0.3);}
.hd-urg-opt.sel-emergency{border-color:#ef4444;background:#fef2f2;}
.hd-urg-opt.sel-urgent{border-color:#f97316;background:#fff7ed;}
.hd-urg-opt.sel-routine{border-color:#22c55e;background:#f0fdf4;}
.hd-urg-emoji{font-size:1.4rem;margin-bottom:4px;}
.hd-urg-name{font-size:0.72rem;font-weight:700;}
.hd-urg-time{font-size:0.62rem;color:#9ca3af;margin-top:1px;}

/* ── Act feed ── */
.hd-act-item{display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-bottom:1px solid rgba(139,0,0,0.05);transition:padding 0.2s;}
.hd-act-item:last-child{border-bottom:none;}
.hd-act-item:hover{padding-left:4px;}

/* ── Prog bars ── */
.hd-validity{height:4px;border-radius:999px;background:#e5e7eb;position:relative;overflow:hidden;margin-top:4px;}
.hd-validity-fill{height:100%;border-radius:999px;transition:width 0.6s ease;}
.hd-prog{height:6px;background:#f3f4f6;border-radius:999px;overflow:hidden;margin-top:4px;}
.hd-prog-fill{height:100%;background:linear-gradient(90deg,#8B0000,#c41e3a);border-radius:999px;transition:width 0.6s ease;}

/* ── Search ── */
.hd-search{background:#f8f5f5;border:1.5px solid rgba(139,0,0,0.1);border-radius:10px;padding:8px 12px 8px 36px;font-size:0.8rem;color:#374151;transition:all 0.2s;outline:none;width:100%;font-family:var(--hd-font-body);}
.hd-search:focus{border-color:rgba(139,0,0,0.35);background:#fff;box-shadow:0 0 0 3px rgba(139,0,0,0.08);}

/* ── FAB ── */
.hd-fab{position:fixed;bottom:24px;right:24px;z-index:50;background:linear-gradient(135deg,#8B0000,#c41e3a);color:#fff;border:none;border-radius:50px;padding:12px 20px;font-size:0.85rem;font-weight:700;font-family:var(--hd-font-body);display:flex;align-items:center;gap:8px;cursor:pointer;box-shadow:0 6px 20px rgba(139,0,0,0.4),0 2px 6px rgba(0,0,0,0.15);transition:all 0.3s cubic-bezier(0.4,0,0.2,1);animation:hd-float 3s ease-in-out infinite;}
.hd-fab:hover{transform:scale(1.05) translateY(-2px);box-shadow:0 10px 28px rgba(139,0,0,0.5);animation:none;}
@media(max-width:640px){.hd-fab{bottom:16px;right:16px;padding:10px 16px;font-size:0.78rem;}}

/* ── Form ── */
.hd-input{width:100%;padding:10px 13px;border-radius:10px;border:1.5px solid #e5e7eb;font-size:0.83rem;font-family:var(--hd-font-body);color:#111827;background:#fff;outline:none;transition:all 0.2s;}
.hd-input:focus{border-color:rgba(139,0,0,0.45);box-shadow:0 0 0 3px rgba(139,0,0,0.08);}
.hd-label{font-size:0.75rem;font-weight:600;color:#374151;display:block;margin-bottom:5px;}
.hd-required{color:#ef4444;margin-left:2px;}

/* ── FIX 2: Print styles ── */
@media screen { .hd-print-only { display:none !important; } }
@media print {
  .hd-root, .hd-header, .hd-nav, .hd-fab, .no-print { display:none !important; }
  .hd-print-only { display:block !important; }
  @page { size:A4; margin:12mm; }
  body { print-color-adjust:exact; -webkit-print-color-adjust:exact; }
}

/* ── Responsive ── */
@media(max-width:640px){
  .hd-welcome{padding:18px 20px;}
  .hd-welcome-title{font-size:1.05rem;}
  .hd-kpi-val{font-size:1.4rem;}
}
`;

/* ═══════════════════════════════════════════════════════════════
   NACO / MoHFW URGENCY CONFIG
═══════════════════════════════════════════════════════════════ */
type UrgencyLevel = "Emergency" | "Urgent" | "Routine";

const URGENCY_CONFIG: Record<UrgencyLevel, {
  validityHours:number; color:string; bg:string; border:string;
  emoji:string; timeNeeded:string; description:string; nacoNote:string; selClass:string;
}> = {
  Emergency: {
    validityHours:6,   color:"#b91c1c", bg:"#fef2f2", border:"#fca5a5",
    emoji:"🚨", timeNeeded:"< 30 min",
    description:"Life-threatening — immediate transfusion required.",
    nacoNote:"Massive hemorrhage, trauma, obstetric emergency, surgical crisis",
    selClass:"sel-emergency",
  },
  Urgent: {
    validityHours:12,  color:"#c2410c", bg:"#fff7ed", border:"#fdba74",
    emoji:"⚡", timeNeeded:"2–4 hours",
    description:"Semi-urgent — blood required within a few hours.",
    nacoNote:"Significant anemia, pre-operative preparation, post-surgical bleeding",
    selClass:"sel-urgent",
  },
  Routine: {
    validityHours:48,  color:"#15803d", bg:"#f0fdf4", border:"#86efac",
    emoji:"📋", timeNeeded:"> 4 hours",
    description:"Elective / planned — sufficient advance notice.",
    nacoNote:"Elective surgery, chronic anemia, thalassemia, oncology",
    selClass:"sel-routine",
  },
};

/* ═══════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════ */
type BloodGroup        = "A+"  | "A-"  | "B+"  | "B-"  | "O+"  | "O-"  | "AB+" | "AB-";
type BloodComponentType= "Whole Blood" | "PRBC" | "Platelets" | "FFP" | "Cryoprecipitate";
type TransfusionIndication = "Anemia"|"Surgery"|"Trauma"|"Oncology"|"Obstetric"|"Hemorrhage"|"Thalassemia"|"Other";
type RequestStatus     = "CREATED"|"PENDING"|"PROCESSING"|"PLEDGED"|"PARTIAL"|"REDEEMED"|"HOSPITAL VERIFIED"|"ADMINISTERED"|"CLOSED"|"EXPIRED"|"CANCELLED";

interface DonorInfo  { dRtid:string; name:string; date:string; }
interface BloodRequest {
  id:string; rtid:string; serialNumber?:string;
  patientName:string; bloodGroup:BloodGroup;
  componentType?:BloodComponentType; transfusionIndication?:TransfusionIndication;
  unitsRequired:number; unitsFulfilled:number;
  requiredBy:Date; status:RequestStatus;
  city:string; createdAt:Date;
  patientMobile:string; patientAadhaar:string; pincode:string;
  age?:number; urgency?:UrgencyLevel;
  donors?:DonorInfo[]; doctorName?:string; doctorRegNo?:string;
  wardDepartment?:string; bedNumber?:string;
  validityHours?:number; scannedAt?:string; scannedLocation?:string;
  redeemedAt?:Date; administeredAt?:Date; generatedBy?:string; systemVersion?:string;
}
interface Notification {
  id:string; message:string; time:string;
  type:"new"|"update"|"alert"|"system"; read:boolean;
}

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════ */
const SYSTEM_VERSION = "v3.1.0";
const BLOOD_COMPONENT_TYPES: BloodComponentType[] = ["Whole Blood","PRBC","Platelets","FFP","Cryoprecipitate"];
const TRANSFUSION_INDICATIONS: TransfusionIndication[] = ["Anemia","Surgery","Trauma","Oncology","Obstetric","Hemorrhage","Thalassemia","Other"];

/* ═══════════════════════════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════════════════════════ */
const formatDate = (d:Date) => !d||isNaN(d.getTime())?"—":d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
const formatTime = (d:Date) => !d||isNaN(d.getTime())?"":d.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});
const timeAgo   = (d:Date) => { const diff=Date.now()-d.getTime(); const m=Math.floor(diff/60000); const h=Math.floor(diff/3600000); const dy=Math.floor(diff/86400000); return dy>0?`${dy}d ago`:h>0?`${h}h ago`:`${m}m ago`; };
const generateSerial = () => { const n=new Date(); return `REQ/${n.getFullYear()}/${String(n.getMonth()+1).padStart(2,"0")}/${Math.floor(Math.random()*999999).toString().padStart(6,"0")}`; };
const isRequestValid  = (r:BloodRequest) => { if(!r.validityHours||!r.createdAt) return true; return new Date()<new Date(r.createdAt.getTime()+r.validityHours*3600000); };
const getTimeRemaining= (r:BloodRequest) => { if(!r.validityHours||!r.createdAt) return "N/A"; const diff=new Date(r.createdAt.getTime()+r.validityHours*3600000).getTime()-Date.now(); if(diff<=0) return "Expired"; const h=Math.floor(diff/3600000); const m=Math.floor((diff%3600000)/60000); return h>0?`${h}h ${m}m`:`${m}m`; };
const getValidityPct  = (r:BloodRequest) => { if(!r.validityHours||!r.createdAt) return 100; return Math.max(0,Math.min(100,100-(Date.now()-r.createdAt.getTime())/(r.validityHours*3600000)*100)); };
const getStatusMeta   = (s:string) => {
  const map: Record<string,{bg:string;text:string;border:string;label:string}> = {
    CREATED:          {bg:"#f9fafb",text:"#374151",border:"#d1d5db",label:"Created"},
    PENDING:          {bg:"#fefce8",text:"#854d0e",border:"#fde047",label:"Pending"},
    PROCESSING:       {bg:"#eff6ff",text:"#1d4ed8",border:"#93c5fd",label:"Processing"},
    PLEDGED:          {bg:"#eff6ff",text:"#1d4ed8",border:"#93c5fd",label:"Pledged"},
    PARTIAL:          {bg:"#fff7ed",text:"#c2410c",border:"#fdba74",label:"Partial"},
    REDEEMED:         {bg:"#f0fdf4",text:"#15803d",border:"#86efac",label:"Redeemed"},
    "HOSPITAL VERIFIED":{bg:"#dcfce7",text:"#166534",border:"#4ade80",label:"Verified"},
    ADMINISTERED:     {bg:"#dbeafe",text:"#1e40af",border:"#93c5fd",label:"Administered ✓"},
    CLOSED:           {bg:"#f3f4f6",text:"#374151",border:"#9ca3af",label:"Closed"},
    EXPIRED:          {bg:"#fef2f2",text:"#b91c1c",border:"#fca5a5",label:"Expired"},
    CANCELLED:        {bg:"#fef2f2",text:"#b91c1c",border:"#fca5a5",label:"Cancelled"},
  };
  return map[s?.toUpperCase?.()] || {bg:"#f9fafb",text:"#6b7280",border:"#d1d5db",label:s||"—"};
};
const getQRPayload = (r:BloodRequest) => JSON.stringify({
  rtid:r.rtid, serial:r.serialNumber||"", name:r.patientName, city:r.city,
  bloodGroup:r.bloodGroup, component:r.componentType||"Whole Blood",
  units:r.unitsRequired, urgency:r.urgency||"Routine",
  requiredBy:r.requiredBy?.toISOString?.() || "",
  createdAt:r.createdAt?.toISOString?.() || "",
});

/* ═══════════════════════════════════════════════════════════════
   QR CANVAS
═══════════════════════════════════════════════════════════════ */
const QRCanvas = ({ data, size=200 }: { data:string; size?:number }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current && data) {
      try { new QRious({ element:ref.current, value:data, size, foreground:"#8B0000", level:"H" }); }
      catch(_){}
    }
  }, [data, size]);
  return <canvas ref={ref} width={size} height={size} className="rounded-lg" />;
};

/* ═══════════════════════════════════════════════════════════════
   FIX 2: PRINTABLE SLIP — proper A4, no Tailwind print: classes
═══════════════════════════════════════════════════════════════ */
const PrintableRequest = ({ request, hospital }: { request:BloodRequest|null; hospital:any }) => {
  const qrRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (request && qrRef.current) {
      try { new QRious({ element:qrRef.current, value:getQRPayload(request), size:90, foreground:"#8B0000", level:"H" }); }
      catch(_){}
    }
  }, [request]);
  if (!request) return null;
  const uc  = URGENCY_CONFIG[request.urgency||"Routine"];
  const rem = getTimeRemaining(request);
  const isV = isRequestValid(request);
  const now = new Date();
  return (
    <div className="hd-print-only" style={{fontFamily:"Arial, sans-serif",fontSize:"11px",color:"#000",background:"#fff"}}>
      <div style={{width:"186mm",margin:"0 auto",border:"3px solid #1a1a1a",padding:"10mm",boxSizing:"border-box",minHeight:"267mm"}}>

        {/* Header */}
        <div style={{borderBottom:"2px solid #8B0000",paddingBottom:"8px",marginBottom:"8px",display:"flex",alignItems:"flex-start",gap:"12px"}}>
          <div style={{flex:1}}>
            <div style={{fontSize:"18px",fontWeight:"900",color:"#8B0000",letterSpacing:"-0.5px"}}>RaktPort</div>
            <div style={{fontSize:"8.5px",fontWeight:"700",textTransform:"uppercase",color:"#374151",letterSpacing:"0.5px"}}>National Digital Blood Donation &amp; Management System</div>
            <div style={{fontSize:"8px",color:"#6b7280",marginTop:"2px"}}>Ministry of Health &amp; Family Welfare, Government of India</div>
          </div>
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontSize:"8px",color:"#9ca3af",textTransform:"uppercase"}}>Serial No.</div>
            <div style={{fontFamily:"monospace",fontSize:"10px",fontWeight:"900",marginTop:"2px"}}>{request.serialNumber||"—"}</div>
            <div style={{fontSize:"7.5px",color:"#6b7280",marginTop:"2px"}}>{now.toLocaleString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:true})} IST</div>
          </div>
        </div>

        {/* Title */}
        <div style={{textAlign:"center",marginBottom:"10px"}}>
          <div style={{fontSize:"14px",fontWeight:"900",textTransform:"uppercase",textDecoration:"underline",letterSpacing:"1px"}}>Blood Requisition Form</div>
          <div style={{fontSize:"8.5px",color:"#6b7280",marginTop:"2px"}}>NACO / MoHFW Compliant · {hospital?.fullName||"Hospital"}</div>
        </div>

        {/* Urgency + Status row */}
        <div style={{display:"flex",justifyContent:"center",gap:"10px",marginBottom:"10px"}}>
          <div style={{padding:"5px 14px",border:`2px solid ${uc.border}`,borderRadius:"6px",background:uc.bg,color:uc.color,fontSize:"10.5px",fontWeight:"900",textTransform:"uppercase"}}>
            {uc.emoji} URGENCY: {request.urgency||"ROUTINE"} · Valid {uc.validityHours}h
          </div>
          <div style={{padding:"5px 14px",border:`2px solid ${isV?"#86efac":"#fca5a5"}`,borderRadius:"6px",background:isV?"#f0fdf4":"#fef2f2",color:isV?"#15803d":"#b91c1c",fontSize:"10.5px",fontWeight:"900",textTransform:"uppercase"}}>
            ⏱ VALIDITY: {rem}
          </div>
        </div>

        {/* Patient + Hospital */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"10px"}}>
          <div>
            <div style={{fontWeight:"800",fontSize:"12px",textTransform:"uppercase",borderLeft:"4px solid #8B0000",paddingLeft:"6px",marginBottom:"6px"}}>Patient Information</div>
            <table style={{width:"100%",fontSize:"10.5px",borderCollapse:"collapse"}}>
              {[["Full Name",request.patientName],["Age",`${request.age||"N/A"} Years`],["Mobile",request.patientMobile||"—"],["Aadhaar","XXXX XXXX "+((request.patientAadhaar||"").slice(-4)||"XXXX")],["Ward / Dept",request.wardDepartment||"—"],["Bed No.",request.bedNumber||"—"]].map(([k,v])=>(
                <tr key={k}><td style={{padding:"2px 0",color:"#6b7280",width:"38%",fontWeight:"600"}}>{k}:</td><td style={{padding:"2px 0",fontWeight:"700"}}>{v}</td></tr>
              ))}
            </table>
          </div>
          <div>
            <div style={{fontWeight:"800",fontSize:"12px",textTransform:"uppercase",borderLeft:"4px solid #374151",paddingLeft:"6px",marginBottom:"6px"}}>Requesting Hospital</div>
            <table style={{width:"100%",fontSize:"10.5px",borderCollapse:"collapse"}}>
              {[["Hospital",hospital?.fullName||"—"],["Location",`${hospital?.district||"—"}, ${hospital?.pincode||""}`],["Contact",hospital?.mobile||"—"],["Reg. No.",hospital?.registrationNo||"—"],["Doctor",request.doctorName||"—"],["MCI / SMC",request.doctorRegNo||"—"]].map(([k,v])=>(
                <tr key={k}><td style={{padding:"2px 0",color:"#6b7280",width:"38%",fontWeight:"600"}}>{k}:</td><td style={{padding:"2px 0",fontWeight:"700"}}>{v}</td></tr>
              ))}
            </table>
          </div>
        </div>

        {/* RTID */}
        <div style={{textAlign:"center",margin:"10px 0 8px"}}>
          <div style={{display:"inline-block",border:"2px dashed #9ca3af",borderRadius:"6px",padding:"6px 22px",background:"#f9fafb"}}>
            <div style={{fontSize:"8.5px",color:"#9ca3af",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"3px"}}>RTID (Request Token ID)</div>
            <div style={{fontFamily:"monospace",fontSize:"16px",fontWeight:"900",color:"#8B0000",letterSpacing:"2px"}}>{request.rtid}</div>
          </div>
        </div>

        {/* Blood Details box */}
        <div style={{border:"2.5px solid #111827",borderRadius:"8px",padding:"8px",marginBottom:"10px"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"6px",textAlign:"center"}}>
            <div><div style={{fontSize:"8px",textTransform:"uppercase",color:"#6b7280",fontWeight:"700",marginBottom:"3px"}}>Blood Group</div><div style={{fontSize:"30px",fontWeight:"900",color:"#8B0000",lineHeight:"1"}}>{request.bloodGroup}</div></div>
            <div><div style={{fontSize:"8px",textTransform:"uppercase",color:"#6b7280",fontWeight:"700",marginBottom:"3px"}}>Component</div><div style={{fontSize:"12px",fontWeight:"800",marginTop:"4px"}}>{request.componentType||"Whole Blood"}</div></div>
            <div><div style={{fontSize:"8px",textTransform:"uppercase",color:"#6b7280",fontWeight:"700",marginBottom:"3px"}}>Units</div><div style={{fontSize:"30px",fontWeight:"900",lineHeight:"1"}}>{request.unitsRequired}</div></div>
            <div><div style={{fontSize:"8px",textTransform:"uppercase",color:"#6b7280",fontWeight:"700",marginBottom:"3px"}}>Required By</div><div style={{fontSize:"11px",fontWeight:"800",marginTop:"4px"}}>{formatDate(request.requiredBy)}</div><div style={{fontSize:"10px",color:"#374151"}}>{formatTime(request.requiredBy)}</div></div>
          </div>
        </div>

        {/* Indication */}
        {request.transfusionIndication && (
          <div style={{background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:"6px",padding:"6px 10px",marginBottom:"8px",fontSize:"10.5px"}}>
            <span style={{fontWeight:"800",color:"#1e40af"}}>Indication for Transfusion (NACO): </span>
            <span style={{fontWeight:"600",color:"#1d4ed8"}}>{request.transfusionIndication}</span>
          </div>
        )}

        {/* MoHFW Warning */}
        <div style={{background:"#fef2f2",border:"2px solid #fca5a5",borderRadius:"6px",padding:"8px 10px",marginBottom:"12px"}}>
          <div style={{fontWeight:"800",fontSize:"9px",textTransform:"uppercase",color:"#7f1d1d",marginBottom:"5px"}}>⚠️ MoHFW / NACO Mandatory Requirements</div>
          <ul style={{margin:0,paddingLeft:"14px",fontSize:"9px",color:"#991b1b",lineHeight:"1.6"}}>
            <li>Mandatory ABO-Rh typing, antibody screening &amp; cross-matching before transfusion</li>
            <li>Emergency uncross-matched blood only if immediately life-threatening — document justification</li>
            <li>Verify patient identity (name, age, blood group) before administration</li>
            <li>Monitor patient for 15 min post-transfusion; report adverse reactions to regional blood bank</li>
            <li>Informed consent mandatory for all planned transfusions (National Blood Policy 2020)</li>
          </ul>
        </div>

        {/* Footer with QR + signatures */}
        <div style={{borderTop:"2px solid #111827",paddingTop:"8px",display:"flex",gap:"12px",alignItems:"flex-start"}}>
          <div style={{flexShrink:0,textAlign:"center",width:"100px"}}>
            <canvas ref={qrRef} width={90} height={90} />
            <div style={{fontSize:"7.5px",fontWeight:"700",marginTop:"3px",color:"#374151"}}>Scan to Verify</div>
          </div>
          <div style={{flex:1,fontSize:"8px",color:"#374151",lineHeight:"1.6"}}>
            <div style={{fontWeight:"800",textTransform:"uppercase",fontSize:"8.5px",marginBottom:"3px"}}>Digital Metadata</div>
            <div>Generated by: {request.generatedBy||hospital?.fullName||"Hospital"}</div>
            <div>System: RaktPort {request.systemVersion||SYSTEM_VERSION}</div>
            <div>Timestamp: {new Date(request.createdAt).toLocaleString("en-IN")} IST</div>
            <div style={{marginTop:"5px",fontWeight:"800",textTransform:"uppercase",fontSize:"8.5px"}}>Disclaimer</div>
            <div>This document is electronically generated by RaktPort. Validation subject to QR code authenticity and validity period.</div>
          </div>
          <div style={{flexShrink:0,width:"120px",textAlign:"center"}}>
            <div style={{height:"38px",borderBottom:"1px solid #374151",marginBottom:"4px"}}></div>
            <div style={{fontSize:"8.5px",fontWeight:"800",textTransform:"uppercase"}}>Authorized Signatory</div>
            <div style={{fontSize:"7.5px",color:"#6b7280"}}>(Medical Officer / In-Charge)</div>
            <div style={{fontSize:"7.5px",color:"#9ca3af",marginTop:"4px"}}>Date: {formatDate(new Date())}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   QR MODAL
═══════════════════════════════════════════════════════════════ */
const QRModal = ({ isOpen, onClose, request }: { isOpen:boolean; onClose:()=>void; request:BloodRequest|null }) => {
  if (!request) return null;
  const isV=isRequestValid(request); const rem=getTimeRemaining(request);
  const pct=getValidityPct(request); const sm=getStatusMeta(isV?request.status:"EXPIRED");
  const uc=URGENCY_CONFIG[request.urgency||"Routine"];
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[95vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#8B0000]" style={{fontFamily:"Outfit,sans-serif"}}>
            <QrCode className="w-5 h-5" /> QR Code · {request.rtid}
          </DialogTitle>
          <DialogDescription>Scan at any blood bank to verify this requisition</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          <div className={`p-3 rounded-xl border-2 bg-white ${!isV?"opacity-50":""}`} style={{borderColor:isV?"#e5e7eb":"#fca5a5"}}>
            <QRCanvas data={getQRPayload(request)} size={200} />
          </div>
          <div className="w-full space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 font-medium">Validity remaining</span>
              <span className={`font-bold ${isV?"text-green-600":"text-red-600"}`}>{rem}</span>
            </div>
            <div className="hd-validity">
              <div className="hd-validity-fill" style={{width:`${pct}%`,background:pct>50?"#22c55e":pct>20?"#f59e0b":"#ef4444"}} />
            </div>
          </div>
          <div className="w-full bg-gray-50 rounded-xl p-3 border text-sm space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {[["Patient",request.patientName],["Blood Group",request.bloodGroup],["Component",request.componentType||"Whole Blood"],["Units",String(request.unitsRequired)]].map(([k,v])=>(
                <div key={k}><p className="text-[10px] text-gray-400 uppercase font-semibold">{k}</p><p className="font-semibold text-gray-800">{v}</p></div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="hd-urg" style={{background:uc.bg,color:uc.color,border:`1px solid ${uc.border}`}}>{uc.emoji} {request.urgency||"Routine"}</span>
              <span className="hd-status border" style={{background:sm.bg,color:sm.text,borderColor:sm.border}}>{sm.label}</span>
            </div>
          </div>
        </div>
        <Button onClick={onClose} className="w-full bg-[#8B0000] hover:bg-[#6b0000]">Close</Button>
      </DialogContent>
    </Dialog>
  );
};

/* ═══════════════════════════════════════════════════════════════
   FIX 4: HOSPITAL PROFILE MODAL
═══════════════════════════════════════════════════════════════ */
const ProfileModal = ({ isOpen, onClose, hospital }: { isOpen:boolean; onClose:()=>void; hospital:any }) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="sm:max-w-sm rounded-2xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-[#8B0000]" style={{fontFamily:"Outfit,sans-serif"}}>
          <Building2 className="w-5 h-5" /> Hospital Profile
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
          <div className="w-12 h-12 rounded-xl bg-[#8B0000] flex items-center justify-center text-white text-2xl font-black" style={{fontFamily:"Outfit,sans-serif"}}>
            {(hospital?.fullName||"H")[0]}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">{hospital?.fullName||"—"}</p>
            <p className="text-xs text-gray-500 mt-0.5">Hospital · RaktPort Registered</p>
          </div>
        </div>
        {[
          { icon:<MapPin className="w-4 h-4"/>, label:"Location", val:`${hospital?.district||"—"}, ${hospital?.pincode||""}` },
          { icon:<Phone className="w-4 h-4"/>,  label:"Contact",  val:hospital?.mobile||"—" },
          { icon:<Hash className="w-4 h-4"/>,   label:"Reg. No.", val:hospital?.registrationNo||"—" },
          { icon:<Mail className="w-4 h-4"/>,   label:"Email",    val:hospital?.email||"—" },
        ].map(r=>(
          <div key={r.label} className="flex items-start gap-3 px-1">
            <span className="text-gray-400 mt-0.5 flex-shrink-0">{r.icon}</span>
            <div><p className="text-[10px] text-gray-400 font-semibold uppercase">{r.label}</p><p className="text-sm font-medium text-gray-700">{r.val}</p></div>
          </div>
        ))}
      </div>
    </DialogContent>
  </Dialog>
);

/* ═══════════════════════════════════════════════════════════════
   FIX 5: NOTIFICATION DRAWER with read/clear
═══════════════════════════════════════════════════════════════ */
const NotifDrawer = ({
  isOpen, notifs, onClose, onMarkRead, onMarkAllRead, onClear,
}: {
  isOpen:boolean; notifs:Notification[];
  onClose:()=>void; onMarkRead:(id:string)=>void;
  onMarkAllRead:()=>void; onClear:()=>void;
}) => {
  if (!isOpen) return null;
  const unread = notifs.filter(n=>!n.read).length;
  return (
    <>
      <div className="fixed inset-0 bg-black/15 z-40" onClick={onClose} />
      <div className="fixed top-[70px] right-4 w-80 max-h-[75vh] overflow-hidden z-50 rounded-2xl shadow-2xl border border-gray-200 bg-white flex flex-col hd-enter-sm">
        <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
            <Bell className="w-4 h-4 text-[#8B0000]" /> Notifications
            {unread>0 && <span className="bg-[#8B0000] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unread}</span>}
          </h3>
          <div className="flex items-center gap-1">
            {unread>0 && (
              <button onClick={onMarkAllRead} title="Mark all read"
                className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-green-100 hover:text-green-700 text-gray-500 flex items-center justify-center transition-colors">
                <CheckCheck className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={onClear} title="Clear all"
              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-500 flex items-center justify-center transition-colors">
              <Trash className="w-3.5 h-3.5" />
            </button>
            <button onClick={onClose} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
              <X className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
          {notifs.length===0 ? (
            <div className="p-8 text-center">
              <BellOff className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No notifications</p>
            </div>
          ) : notifs.map(n => (
            <div key={n.id}
              className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors flex items-start gap-2 ${n.read?"opacity-60":""}`}
              onClick={()=>onMarkRead(n.id)}>
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.type==="alert"?"bg-red-500":n.type==="update"?"bg-blue-500":n.type==="system"?"bg-gray-400":"bg-green-500"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 leading-snug">{n.message}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
              </div>
              {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-[#8B0000] mt-2 flex-shrink-0" />}
            </div>
          ))}
        </div>
        {notifs.length>0 && (
          <div className="p-3 border-t flex-shrink-0 bg-gray-50">
            <p className="text-[11px] text-gray-400 text-center">Click notification to mark as read</p>
          </div>
        )}
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════
   FIX 3: NEW REQUEST MODAL — 3-step, no auto-submit
═══════════════════════════════════════════════════════════════ */
const NewRequestModal = ({
  isOpen, onClose, onSubmit, defaultCity, defaultPincode, defaultUrgency, hospitalName,
}: {
  isOpen:boolean; onClose:()=>void; onSubmit:(d:any)=>Promise<void>;
  defaultCity:string; defaultPincode:string; defaultUrgency:UrgencyLevel; hospitalName:string;
}) => {
  // Form fields — all state
  const [patientName,           setPatientName]           = useState("");
  const [age,                   setAge]                   = useState("");
  const [mobile,                setMobile]                = useState("");
  const [aadhaar,               setAadhaar]               = useState("");
  const [wardDepartment,        setWardDepartment]        = useState("");
  const [bedNumber,             setBedNumber]             = useState("");
  const [bloodGroup,            setBloodGroup]            = useState<BloodGroup|"">("");
  const [componentType,         setComponentType]         = useState<BloodComponentType>("Whole Blood");
  const [transfusionIndication, setTransfusionIndication] = useState<TransfusionIndication>("Anemia");
  const [unitsRequired,         setUnitsRequired]         = useState(1);
  const [requiredByDate,        setRequiredByDate]        = useState(new Date().toISOString().split("T")[0]);
  const [requiredByTime,        setRequiredByTime]        = useState("12:00");
  const [doctorName,            setDoctorName]            = useState("");
  const [doctorRegNo,           setDoctorRegNo]           = useState("");
  const [city,                  setCity]                  = useState(defaultCity);
  const [pincode,               setPincode]               = useState(defaultPincode);
  const [urgency,               setUrgency]               = useState<UrgencyLevel>(defaultUrgency);
  const [step,                  setStep]                  = useState(1);
  const [isSubmitting,          setIsSubmitting]          = useState(false);
  const [submitError,           setSubmitError]           = useState("");

  const TOTAL = 3;

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setUrgency(defaultUrgency); setCity(defaultCity); setPincode(defaultPincode);
      setStep(1); setIsSubmitting(false); setSubmitError("");
      setPatientName(""); setAge(""); setMobile(""); setAadhaar("");
      setWardDepartment(""); setBedNumber(""); setBloodGroup("");
      setComponentType("Whole Blood"); setTransfusionIndication("Anemia");
      setUnitsRequired(1); setDoctorName(""); setDoctorRegNo("");
      setRequiredByDate(new Date().toISOString().split("T")[0]); setRequiredByTime("12:00");
    }
  }, [isOpen, defaultUrgency, defaultCity, defaultPincode]);

  const numOnly = (setter:(v:string)=>void, max:number) =>
    (e:React.ChangeEvent<HTMLInputElement>) => setter(e.target.value.replace(/\D/g,"").slice(0,max));

  // FIX 3: separate validation per step — does NOT submit
  const validateStep1 = (): string => {
    if (!patientName.trim())       return "Patient name is required";
    if (!age || +age<=0 || +age>120) return "Enter a valid age (1–120)";
    if (mobile.length!==10)        return "Mobile must be 10 digits";
    if (aadhaar.length!==12)       return "Aadhaar must be 12 digits";
    return "";
  };
  const validateStep2 = (): string => {
    if (!bloodGroup)               return "Select a blood group";
    if (!requiredByDate)           return "Required date is mandatory";
    if (!requiredByTime)           return "Required time is mandatory";
    const dt = new Date(`${requiredByDate}T${requiredByTime}`);
    if (isNaN(dt.getTime()))       return "Invalid date or time";
    return "";
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setSubmitError("");
    if (step===1) { const err=validateStep1(); if(err){setSubmitError(err);toast.error(err);return;} }
    if (step===2) { const err=validateStep2(); if(err){setSubmitError(err);toast.error(err);return;} }
    setStep(s => s + 1);
  };

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setSubmitError("");
    setStep(s => s - 1);
  };

  // FIX 3: final submit — only called from step 3 submit button
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== TOTAL || isSubmitting) return;
    if (!city.trim())              { toast.error("City is required"); return; }
    if (pincode.length!==6)        { toast.error("Valid 6-digit pincode required"); return; }
    setIsSubmitting(true); setSubmitError("");
    try {
      await onSubmit({
        patientName:patientName.trim(), age:+age, mobile, aadhaar,
        wardDepartment:wardDepartment.trim()||null, bedNumber:bedNumber.trim()||null,
        bloodGroup, componentType, transfusionIndication,
        unitsRequired, requiredByDate, requiredByTime,
        doctorName:doctorName.trim()||null, doctorRegNo:doctorRegNo.trim()||null,
        city:city.trim(), pincode, urgency,
      });
      onClose();
    } catch(err:any) {
      setSubmitError(err?.message||"Failed to submit");
      toast.error("Submission failed");
    } finally { setIsSubmitting(false); }
  };

  const uc = URGENCY_CONFIG[urgency];

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={o=>{ if(!o&&!isSubmitting){onClose();}}}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{background:uc.bg}}>{uc.emoji}</div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900" style={{fontFamily:"Outfit,sans-serif"}}>New Blood Requisition</h2>
              <p className="text-xs text-gray-500">NACO/MoHFW Compliant · {hospitalName}</p>
            </div>
            <button type="button" onClick={()=>{if(!isSubmitting)onClose();}} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          {/* Progress steps */}
          <div className="flex items-center gap-1.5 mt-4">
            {["Patient Info","Blood Details","Doctor & Location"].map((s,i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-all ${step===i+1?"bg-[#8B0000] text-white shadow":step>i+1?"bg-green-100 text-green-700":"bg-gray-100 text-gray-400"}`}>
                  {step>i+1 ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-3.5 h-3.5 rounded-full border-2 border-current flex items-center justify-center text-[9px]">{i+1}</span>}
                  <span className="hidden sm:inline">{s}</span>
                </div>
                {i<2 && <div className={`flex-1 h-0.5 rounded-full ${step>i+1?"bg-green-400":"bg-gray-200"}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* FIX 3: form has onSubmit only for step 3 */}
        <form onSubmit={handleFinalSubmit} className="p-5 space-y-5">
          {/* Urgency — always visible */}
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
                  <button key={lvl} type="button" onClick={()=>setUrgency(lvl)} className={`hd-urg-opt ${urgency===lvl?u.selClass:""}`}>
                    <div className="hd-urg-emoji">{u.emoji}</div>
                    <div className="hd-urg-name" style={{color:urgency===lvl?u.color:"#374151"}}>{lvl}</div>
                    <div className="hd-urg-time">{u.timeNeeded}</div>
                    <div className="text-[10px] font-bold mt-1" style={{color:urgency===lvl?u.color:"#9ca3af"}}>Valid {u.validityHours}h</div>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 p-3 rounded-xl border text-xs flex items-start gap-2" style={{background:uc.bg,borderColor:uc.border,color:uc.color}}>
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <div><strong>{uc.description}</strong><div className="opacity-75 mt-0.5">NACO: {uc.nacoNote}</div></div>
            </div>
          </div>

          {submitError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />{submitError}
            </div>
          )}

          {/* Step 1 */}
          {step===1 && (
            <div className="space-y-4 hd-enter">
              <div className="flex items-center gap-2"><User className="w-4 h-4 text-blue-600" /><span className="text-sm font-bold text-gray-800">Patient Information</span></div>
              <div>
                <label className="hd-label">Patient Full Name <span className="hd-required">*</span></label>
                <input className="hd-input" value={patientName} onChange={e=>setPatientName(e.target.value)} placeholder="As per ID proof" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="hd-label">Age (Years) <span className="hd-required">*</span></label>
                  <input className="hd-input" type="number" min="1" max="120" value={age} onChange={e=>setAge(e.target.value)} placeholder="e.g. 35" />
                </div>
                <div>
                  <label className="hd-label">Mobile No. <span className="hd-required">*</span></label>
                  <input className="hd-input" value={mobile} onChange={numOnly(setMobile,10)} maxLength={10} placeholder="10-digit" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="hd-label">Aadhaar No. <span className="hd-required">*</span></label>
                  <input className="hd-input" value={aadhaar} onChange={numOnly(setAadhaar,12)} maxLength={12} placeholder="12-digit" />
                  {aadhaar.length>0 && (
                    <div className="flex gap-0.5 mt-1.5">
                      {Array.from({length:12}).map((_,i)=>(
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

          {/* Step 2 */}
          {step===2 && (
            <div className="space-y-4 hd-enter">
              <div className="flex items-center gap-2"><Droplet className="w-4 h-4 text-red-600" /><span className="text-sm font-bold text-gray-800">Blood Component Details</span></div>
              <div>
                <label className="hd-label">Blood Group <span className="hd-required">*</span></label>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {BLOOD_GROUPS.map((bg:string)=>(
                    <button key={bg} type="button" onClick={()=>setBloodGroup(bg as BloodGroup)}
                      className={`py-2.5 rounded-xl text-sm font-black border-2 transition-all ${bloodGroup===bg?"bg-[#8B0000] text-white border-[#8B0000] scale-105 shadow-md":"bg-gray-50 text-gray-600 border-gray-200 hover:border-[#8B0000]/40"}`}>
                      {bg}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="hd-label">Component Type</label>
                  <select className="hd-input" value={componentType} onChange={e=>setComponentType(e.target.value as BloodComponentType)}>
                    {BLOOD_COMPONENT_TYPES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="hd-label">Units Required <span className="hd-required">*</span></label>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={()=>setUnitsRequired(u=>Math.max(1,u-1))} className="w-9 h-9 rounded-lg border-2 border-gray-200 font-bold text-gray-600 hover:border-[#8B0000] transition-colors flex items-center justify-center">−</button>
                    <input className="hd-input text-center font-bold text-base" type="number" min="1" max="20" value={unitsRequired} onChange={e=>setUnitsRequired(+e.target.value||1)} />
                    <button type="button" onClick={()=>setUnitsRequired(u=>Math.min(20,u+1))} className="w-9 h-9 rounded-lg border-2 border-gray-200 font-bold text-gray-600 hover:border-[#8B0000] transition-colors flex items-center justify-center">+</button>
                  </div>
                </div>
              </div>
              <div>
                <label className="hd-label">Indication for Transfusion <span className="hd-required">*</span></label>
                <div className="grid grid-cols-4 gap-1.5">
                  {TRANSFUSION_INDICATIONS.map(ind=>(
                    <button key={ind} type="button" onClick={()=>setTransfusionIndication(ind)}
                      className={`py-2 rounded-xl text-[11px] font-semibold border-2 transition-all ${transfusionIndication===ind?"bg-blue-600 text-white border-blue-600":"bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300"}`}>
                      {ind}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="hd-label">Required By — Date <span className="hd-required">*</span></label>
                  <input className="hd-input" type="date" value={requiredByDate} min={new Date().toISOString().split("T")[0]} onChange={e=>setRequiredByDate(e.target.value)} />
                </div>
                <div>
                  <label className="hd-label">Required By — Time <span className="hd-required">*</span></label>
                  <input className="hd-input" type="time" value={requiredByTime} onChange={e=>setRequiredByTime(e.target.value)} />
                </div>
              </div>
              {bloodGroup && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                  <strong>⚠️ NACO Requirement:</strong> ABO-Rh compatibility testing mandatory before {componentType} transfusion.
                </div>
              )}
            </div>
          )}

          {/* Step 3 */}
          {step===3 && (
            <div className="space-y-4 hd-enter">
              <div className="flex items-center gap-2"><Stethoscope className="w-4 h-4 text-green-600" /><span className="text-sm font-bold text-gray-800">Doctor & Location Details</span></div>
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
                  <input className="hd-input" value={city} onChange={e=>setCity(e.target.value)} />
                </div>
                <div>
                  <label className="hd-label">Pincode <span className="hd-required">*</span></label>
                  <input className="hd-input" value={pincode} onChange={numOnly(setPincode,6)} maxLength={6} />
                </div>
              </div>
              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Request Summary</p>
                <div className="grid grid-cols-2 gap-3">
                  {[["Patient",patientName||"—"],["Age",age?`${age} yrs`:"—"],["Blood Group",bloodGroup||"—"],["Component",componentType],["Units",String(unitsRequired)],["Urgency",urgency],["Valid for",`${uc.validityHours} hours`],["Indication",transfusionIndication]].map(([k,v])=>(
                    <div key={k}><p className="text-[10px] text-gray-400 font-semibold uppercase">{k}</p><p className="text-xs font-semibold text-gray-800">{v}</p></div>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                <BookOpen className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
                <div><strong>MoHFW / NACO Compliance:</strong> By submitting, you confirm the transfusion is clinically justified, informed consent obtained, and all pre-transfusion checks will be performed.</div>
              </div>
            </div>
          )}

          {/* Navigation buttons — FIX 3: explicit types, no accidental submit */}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            {step > 1 ? (
              <button type="button" onClick={handleBack}
                className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all">
                ← Back
              </button>
            ) : (
              <button type="button" onClick={()=>onClose()}
                className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                Cancel
              </button>
            )}

            {step < TOTAL ? (
              /* Explicit type="button" so it NEVER triggers form submit */
              <button type="button" onClick={handleNext}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                style={{background:"linear-gradient(135deg,#8B0000,#b30000)"}}>
                Continue →
              </button>
            ) : (
              /* Only this button is type="submit" */
              <button type="submit" disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2"
                style={{background:isSubmitting?"#d1d5db":`linear-gradient(135deg,${uc.color},#8B0000)`}}>
                {isSubmitting
                  ? <><Clock className="w-4 h-4 animate-spin" /> Creating…</>
                  : <><FileText className="w-4 h-4" /> Generate RTID & Print</>}
              </button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ═══════════════════════════════════════════════════════════════
   FIX 6: REQUEST COMPLETION MODAL
═══════════════════════════════════════════════════════════════ */
const CompleteModal = ({
  isOpen, onClose, request, onConfirm,
}: {
  isOpen:boolean; onClose:()=>void; request:BloodRequest|null; onConfirm:(id:string,notes:string)=>Promise<void>;
}) => {
  const [notes,       setNotes]       = useState("");
  const [isLoading,   setIsLoading]   = useState(false);
  const [administered,setAdministered]= useState(false);
  const [noReaction,  setNoReaction]  = useState(false);
  const [consentDone, setConsentDone] = useState(false);

  useEffect(() => { if(isOpen){setNotes("");setAdministered(false);setNoReaction(false);setConsentDone(false);} }, [isOpen]);

  if (!request) return null;

  const canSubmit = administered && noReaction;

  const handleConfirm = async () => {
    if (!canSubmit || isLoading) return;
    setIsLoading(true);
    try { await onConfirm(request.id, notes); onClose(); }
    catch(err:any) { toast.error("Failed to mark as completed"); }
    finally { setIsLoading(false); }
  };

  return (
    <Dialog open={isOpen} onOpenChange={o=>{ if(!o&&!isLoading)onClose(); }}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-800" style={{fontFamily:"Outfit,sans-serif"}}>
            <HeartHandshake className="w-5 h-5 text-blue-600" /> Mark Blood Administered
          </DialogTitle>
          <DialogDescription>Confirm that blood has been successfully transfused to the patient</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Patient info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-xl">🩸</div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{request.patientName}</p>
                <p className="text-xs text-gray-500">{request.bloodGroup} · {request.componentType||"Whole Blood"} × {request.unitsRequired} units · RTID: {request.rtid}</p>
              </div>
            </div>
          </div>

          {/* MoHFW post-transfusion checklist */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1.5"><CheckSquare className="w-3.5 h-3.5 text-blue-600" /> MoHFW Post-Transfusion Checklist</p>
            {[
              { id:"admin",   label:"Blood has been administered to the patient",              checked:administered, set:setAdministered, required:true },
              { id:"react",   label:"No immediate adverse transfusion reaction observed",      checked:noReaction,   set:setNoReaction,   required:true },
              { id:"consent", label:"Patient / guardian informed of completed transfusion",    checked:consentDone,  set:setConsentDone,  required:false },
            ].map(item=>(
              <label key={item.id} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${item.checked?"border-green-400 bg-green-50":"border-gray-200 bg-gray-50 hover:border-gray-300"}`}>
                <input type="checkbox" className="mt-0.5 w-4 h-4 accent-green-600 flex-shrink-0" checked={item.checked} onChange={e=>item.set(e.target.checked)} />
                <span className="text-sm text-gray-700 font-medium">{item.label}{item.required && <span className="text-red-500 ml-0.5">*</span>}</span>
              </label>
            ))}
          </div>

          {/* Notes */}
          <div>
            <label className="hd-label">Clinical Notes (optional)</label>
            <textarea className="hd-input" rows={2} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="e.g. Transfusion completed without complications, Hb improved…" style={{resize:"none"}} />
          </div>

          {/* Info box */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
            <div>This will update the RTID status to <strong>ADMINISTERED</strong> on the Blood Bank dashboard and Donor's contribution record.</div>
          </div>
        </div>

        <div className="flex gap-3 mt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} disabled={!canSubmit||isLoading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 ${canSubmit&&!isLoading?"bg-blue-600 hover:bg-blue-700":"bg-gray-300 cursor-not-allowed"}`}>
            {isLoading ? <><Clock className="w-4 h-4 animate-spin"/>Saving…</> : <><BadgeCheck className="w-4 h-4"/>Confirm Administered</>}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ═══════════════════════════════════════════════════════════════
   PREMIUM OVERVIEW
═══════════════════════════════════════════════════════════════ */
function PremiumDashboard({
  requests, hospitalData, kpis, onNewRequest, onViewQR, onDelete, onPrint, onConfirmReceipt, onMarkComplete,
}: {
  requests:BloodRequest[]; hospitalData:any; kpis:any;
  onNewRequest:(u:UrgencyLevel)=>void;
  onViewQR:(r:BloodRequest)=>void; onDelete:(id:string)=>void;
  onPrint:(r:BloodRequest)=>void; onConfirmReceipt:(id:string,r:BloodRequest)=>void;
  onMarkComplete:(r:BloodRequest)=>void;
}) {
  const now = new Date(); const hour = now.getHours();
  const greeting = hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";
  const dateStr = now.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  const pending  = requests.filter(r=>isRequestValid(r)&&!["REDEEMED","HOSPITAL VERIFIED","ADMINISTERED","CLOSED","EXPIRED","CANCELLED"].includes(r.status));
  const critical = requests.filter(r=>r.urgency==="Emergency"&&isRequestValid(r)&&!["REDEEMED","ADMINISTERED","CLOSED"].includes(r.status));
  const recentReqs = [...requests].sort((a,b)=>b.createdAt.getTime()-a.createdAt.getTime()).slice(0,5);
  const bg_dist = BLOOD_GROUPS.reduce((acc:Record<string,number>,bg:string)=>{ acc[bg]=requests.filter(r=>r.bloodGroup===bg&&!["CANCELLED","EXPIRED"].includes(r.status)).length; return acc;},{});
  const maxBgCount = Math.max(...Object.values(bg_dist),1);
  const kpiCards = [
    {label:"Total Requests",  val:kpis.totalRequests,    cls:"k-red",    icon:"📋"},
    {label:"Active Requests", val:kpis.activeRequests,   cls:"k-amber",  icon:"⏳"},
    {label:"Units Required",  val:kpis.totalUnits,       cls:"k-blue",   icon:"🩸"},
    {label:"Donations Rcvd",  val:kpis.donationsReceived,cls:"k-green",  icon:"✅"},
    {label:"Administered",    val:kpis.administered,     cls:"k-purple", icon:"💉"},
  ];

  return (
    <div className="space-y-6">
      {critical.length>0 && (
        <div className="hd-enter bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-xl flex-shrink-0">🚨</div>
          <div className="flex-1"><p className="font-bold text-red-800 text-sm">Emergency Blood Request Active</p><p className="text-xs text-red-600 mt-0.5">{critical.length} emergency request{critical.length>1?"s":""} pending — immediate action required</p></div>
          <span className="text-xs font-bold bg-red-600 text-white px-3 py-1.5 rounded-lg animate-pulse">{critical.length} URGENT</span>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="hd-welcome hd-enter">
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-white/55">{greeting} 👋</p>
              <h2 className="hd-welcome-title mt-1">{(hospitalData?.fullName||"Hospital").toUpperCase()}</h2>
              <p className="text-xs text-white/40 mt-1">{dateStr}</p>
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
            {/* FIX 1: Buttons use distinct styles for visibility on crimson */}
            <div className="flex gap-2 flex-wrap relative z-10">
              <button onClick={()=>onNewRequest("Emergency")} className="hd-welcome-emg-btn">
                <Siren className="w-3.5 h-3.5" /> Emergency Request
              </button>
              <button onClick={()=>onNewRequest("Routine")} className="hd-welcome-new-btn">
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
          {kpiCards.map((m,i)=>(
            <div key={m.label} className={`hd-kpi ${m.cls} hd-enter hd-s${i+1}`}>
              <div className="mb-2 text-2xl">{m.icon}</div>
              <div className="hd-kpi-val">{m.val.toLocaleString()}</div>
              <div className="hd-kpi-lbl">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-col */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Fulfillment */}
          <div className="hd-card p-5 hd-enter hd-s2">
            <div className="hd-sec-hdr mb-4"><span className="hd-sec-title"><TrendingUp className="w-4 h-4 text-green-600" /> Request Fulfillment</span></div>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="4" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#8B0000" strokeWidth="4"
                    strokeDasharray={`${kpis.totalRequests>0?(kpis.requestsRedeemed/kpis.totalRequests)*100:0} 100`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-black text-[#8B0000]" style={{fontFamily:"Outfit,sans-serif"}}>
                    {kpis.totalRequests>0?Math.round((kpis.requestsRedeemed/kpis.totalRequests)*100):0}%
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {[{label:"Administered",val:kpis.administered,color:"#3b82f6"},{label:"Redeemed",val:kpis.requestsRedeemed,color:"#22c55e"},{label:"Active",val:kpis.activeRequests,color:"#f59e0b"}].map(s=>(
                  <div key={s.label}><div className="flex justify-between text-xs mb-0.5"><span className="text-gray-500 font-medium">{s.label}</span><span className="font-bold text-gray-800">{s.val}</span></div><div className="hd-prog"><div className="hd-prog-fill" style={{width:`${kpis.totalRequests>0?(s.val/kpis.totalRequests)*100:0}%`,background:s.color}} /></div></div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Requests */}
          <div className="hd-card overflow-hidden hd-enter hd-s3">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <span className="hd-sec-title"><ClipboardList className="w-4 h-4 text-[#8B0000]" /> Recent Requests</span>
              <span className="text-xs text-gray-400">{requests.length} total</span>
            </div>
            {recentReqs.length===0 ? (
              <div className="text-center py-10"><div className="text-4xl opacity-20 mb-2">📋</div><p className="text-sm text-gray-400">No requests yet</p><button onClick={()=>onNewRequest("Routine")} className="mt-3 text-xs text-[#8B0000] font-semibold hover:underline">Create first request →</button></div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentReqs.map((r,i)=>{
                  const sm=getStatusMeta(isRequestValid(r)?r.status:"EXPIRED");
                  const uc2=URGENCY_CONFIG[r.urgency||"Routine"];
                  const rem=getTimeRemaining(r); const pct=getValidityPct(r);
                  return (
                    <div key={r.id} className="hd-act-item px-4" style={{animationDelay:`${i*0.06}s`}}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 border" style={{background:uc2.bg,color:uc2.color,borderColor:uc2.border}}>
                        {r.urgency==="Emergency"?"🚨":r.urgency==="Urgent"?"⚡":"📋"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap"><span className="text-sm font-semibold text-gray-800 truncate">{r.patientName}</span><span className="text-xs font-black text-red-700 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">{r.bloodGroup}</span></div>
                        <div className="text-[11px] text-gray-400 mt-0.5"><span className="font-mono">{r.rtid}</span> · {r.unitsRequired}u</div>
                        <div className="hd-validity mt-1 w-24"><div className="hd-validity-fill" style={{width:`${pct}%`,background:pct>50?"#22c55e":pct>20?"#f59e0b":"#ef4444"}} /></div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className="hd-status border" style={{background:sm.bg,color:sm.text,borderColor:sm.border}}>{sm.label}</span>
                        <span className="text-[10px] text-gray-400">{rem}</span>
                        {/* FIX 6: Complete button on redeemed requests */}
                        {r.status==="REDEEMED"&&(
                          <button onClick={()=>onMarkComplete(r)} className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1"><HeartHandshake className="w-3 h-3"/>Mark Administered</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-5">
          <div className="hd-card p-5 hd-enter hd-s2">
            <div className="hd-sec-hdr"><span className="hd-sec-title"><Droplet className="w-4 h-4 text-red-600 fill-red-500" /> Blood Group Demand</span></div>
            <div className="space-y-2">
              {BLOOD_GROUPS.filter((bg:string)=>bg_dist[bg]>0).sort((a:string,b:string)=>(bg_dist[b]||0)-(bg_dist[a]||0)).map((bg:string)=>(
                <div key={bg} className="flex items-center gap-2">
                  <span className="text-xs font-black text-red-700 w-8 text-center bg-red-50 rounded-lg py-0.5 border border-red-100">{bg}</span>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${(bg_dist[bg]/maxBgCount)*100}%`,background:"linear-gradient(90deg,#8B0000,#c41e3a)"}} /></div>
                  <span className="text-xs font-bold text-gray-700 w-4 text-right">{bg_dist[bg]}</span>
                </div>
              ))}
              {Object.values(bg_dist).every(v=>v===0) && <p className="text-xs text-gray-400 text-center py-4">No requests yet</p>}
            </div>
          </div>
          <div className="hd-card p-5 hd-enter hd-s3">
            <div className="hd-sec-hdr"><span className="hd-sec-title"><Zap className="w-4 h-4 text-amber-500" /> Quick Actions</span></div>
            <div className="space-y-2">
              {[
                {icon:"🚨",label:"Emergency Request",sub:"Life-threatening / Critical",act:()=>onNewRequest("Emergency")},
                {icon:"⚡",label:"Urgent Request",sub:"Needed in 2–4 hours",act:()=>onNewRequest("Urgent")},
                {icon:"📋",label:"Routine Request",sub:"Elective / Planned",act:()=>onNewRequest("Routine")},
                {icon:"📥",label:"Download Reports",sub:"Export request data",act:()=>toast.info("Exporting…")},
              ].map(a=>(
                <button key={a.label} onClick={a.act} className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 hover:border-red-100 transition-all text-left group">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-base flex-shrink-0">{a.icon}</div>
                  <div><div className="text-sm font-semibold text-gray-800">{a.label}</div><div className="text-[11px] text-gray-400">{a.sub}</div></div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 ml-auto transition-transform group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   REQUESTS TABLE VIEW
═══════════════════════════════════════════════════════════════ */
function RequestsView({
  requests, onViewQR, onCopyRTID, onDelete, onPrint, onConfirmReceipt, onNewRequest, onMarkComplete,
}: {
  requests:BloodRequest[];
  onViewQR:(r:BloodRequest)=>void; onCopyRTID:(rtid:string)=>void;
  onDelete:(id:string)=>void; onPrint:(r:BloodRequest)=>void;
  onConfirmReceipt:(id:string,r:BloodRequest)=>void;
  onNewRequest:(u:UrgencyLevel)=>void;
  onMarkComplete:(r:BloodRequest)=>void;
}) {
  const [search,       setSearch]       = useState("");
  const [filterBG,     setFilterBG]     = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterUrgency,setFilterUrgency]= useState("All");
  const [sortBy,       setSortBy]       = useState("newest");
  const [expanded,     setExpanded]     = useState<string|null>(null);

  const filtered = useMemo(()=>{
    let f=[...requests];
    if(filterBG!=="All")       f=f.filter(r=>r.bloodGroup===filterBG);
    if(filterUrgency!=="All")  f=f.filter(r=>r.urgency===filterUrgency);
    if(filterStatus!=="All"){
      if(filterStatus==="VALID")   f=f.filter(r=>isRequestValid(r)&&!["REDEEMED","ADMINISTERED","EXPIRED","CANCELLED"].includes(r.status));
      else if(filterStatus==="EXPIRED") f=f.filter(r=>!isRequestValid(r)||r.status==="EXPIRED");
      else f=f.filter(r=>r.status===filterStatus);
    }
    if(search){ const s=search.toLowerCase(); f=f.filter(r=>r.patientName.toLowerCase().includes(s)||r.rtid.toLowerCase().includes(s)||(r.serialNumber||"").toLowerCase().includes(s)); }
    if(sortBy==="newest")  f.sort((a,b)=>b.createdAt.getTime()-a.createdAt.getTime());
    if(sortBy==="urgency") f.sort((a,b)=>({Emergency:0,Urgent:1,Routine:2}[a.urgency||"Routine"]||2)-({Emergency:0,Urgent:1,Routine:2}[b.urgency||"Routine"]||2));
    if(sortBy==="validity")f.sort((a,b)=>getValidityPct(b)-getValidityPct(a));
    return f;
  },[requests,filterBG,filterStatus,filterUrgency,search,sortBy]);

  return (
    <div className="space-y-5">
      <div className="hd-card p-4 hd-enter">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="hd-search" placeholder="Search patient name, RTID…" value={search} onChange={e=>setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              {val:filterBG,     set:setFilterBG,     opts:["All",...BLOOD_GROUPS]},
              {val:filterUrgency,set:setFilterUrgency,opts:["All","Emergency","Urgent","Routine"]},
              {val:filterStatus, set:setFilterStatus, opts:["All","VALID","PENDING","PARTIAL","REDEEMED","ADMINISTERED","EXPIRED"]},
              {val:sortBy,       set:setSortBy,       opts:["newest","urgency","validity"]},
            ].map((f,fi)=>(
              <select key={fi} value={f.val} onChange={e=>f.set(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white text-gray-700 font-medium outline-none cursor-pointer">
                {f.opts.map((o:string)=><option key={o}>{o}</option>)}
              </select>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">{filtered.length} of {requests.length} requests</p>
      </div>

      {filtered.length===0 ? (
        <div className="hd-card p-12 text-center">
          <div className="text-5xl opacity-20 mb-3">🔍</div>
          <p className="text-gray-500 font-medium">No requests found</p>
          <button onClick={()=>onNewRequest("Routine")} className="mt-4 text-sm text-[#8B0000] font-semibold hover:underline">Create new request →</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r,i)=>{
            const isV=isRequestValid(r); const sm=getStatusMeta(isV?r.status:"EXPIRED");
            const uc2=URGENCY_CONFIG[r.urgency||"Routine"]; const rem=getTimeRemaining(r);
            const pct=getValidityPct(r); const isExp=expanded===r.id;
            const fulfPct=r.unitsRequired>0?(r.unitsFulfilled/r.unitsRequired)*100:0;
            const canVerify=r.status==="REDEEMED"||r.status==="HOSPITAL VERIFIED";
            const canComplete=r.status==="REDEEMED"||r.status==="HOSPITAL VERIFIED";

            return (
              <div key={r.id} className="hd-card overflow-hidden" style={{animationDelay:`${i*0.04}s`}}>
                <div className="p-4 cursor-pointer" onClick={()=>setExpanded(isExp?null:r.id)}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 border" style={{background:uc2.bg,borderColor:uc2.border}}>
                      {r.urgency==="Emergency"?"🚨":r.urgency==="Urgent"?"⚡":"📋"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-800 text-sm">{r.patientName}</span>
                        {r.age && <span className="text-xs text-gray-400">{r.age}y</span>}
                        <span className="text-xs font-black px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-100">{r.bloodGroup}</span>
                        {r.urgency==="Emergency" && <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">EMERGENCY</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap text-[11px] text-gray-400">
                        <span className="font-mono">{r.rtid}</span>
                        <span>{r.componentType||"Whole Blood"} × {r.unitsRequired}</span>
                        {r.wardDepartment && <span>{r.wardDepartment}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="hd-validity flex-1"><div className="hd-validity-fill" style={{width:`${pct}%`,background:pct>50?"#22c55e":pct>20?"#f59e0b":"#ef4444"}} /></div>
                        <span className={`text-[10px] font-semibold ${isV?"text-gray-500":"text-red-500"}`}>{rem}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className="hd-status border text-[11px]" style={{background:sm.bg,color:sm.text,borderColor:sm.border}}>{sm.label}</span>
                      {r.unitsFulfilled>0 && <span className="text-[10px] text-gray-500">{r.unitsFulfilled}/{r.unitsRequired} fulfilled</span>}
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExp?"rotate-180":""}`} />
                    </div>
                  </div>
                  {r.unitsFulfilled>0 && <div className="hd-prog mt-2"><div className="hd-prog-fill" style={{width:`${fulfPct}%`}} /></div>}
                </div>

                {isExp && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-4 hd-enter">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {[["Serial",r.serialNumber||"—"],["Required By",`${formatDate(r.requiredBy)} ${formatTime(r.requiredBy)}`],["Created",timeAgo(r.createdAt)],["Indication",r.transfusionIndication||"—"],["Doctor",r.doctorName||"—"],["Reg. No",r.doctorRegNo||"—"],["Bed",r.bedNumber||"—"],["Mobile",r.patientMobile||"—"]].map(([k,v])=>(
                        <div key={k}><p className="text-[10px] text-gray-400 font-semibold uppercase">{k}</p><p className="text-gray-800 font-medium mt-0.5">{v}</p></div>
                      ))}
                    </div>
                    {r.administeredAt && (
                      <div className="flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                        <HeartHandshake className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span>Blood administered on <strong>{formatDate(r.administeredAt)} {formatTime(r.administeredAt)}</strong></span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button onClick={e=>{e.stopPropagation();onPrint(r);}} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 transition-all"><Printer className="w-3.5 h-3.5"/>Print Slip</button>
                      <button onClick={e=>{e.stopPropagation();onViewQR(r);}} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 transition-all"><QrCode className="w-3.5 h-3.5"/>View QR</button>
                      <button onClick={e=>{e.stopPropagation();onCopyRTID(r.rtid);}} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 transition-all"><Copy className="w-3.5 h-3.5"/>Copy RTID</button>
                      {canVerify && (
                        <button onClick={e=>{e.stopPropagation();onConfirmReceipt(r.id,r);}} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"><CheckCircle2 className="w-3.5 h-3.5"/>Confirm Receipt</button>
                      )}
                      {/* FIX 6: Mark Administered button */}
                      {canComplete && r.status!=="ADMINISTERED" && (
                        <button onClick={e=>{e.stopPropagation();onMarkComplete(r);}} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
                          <HeartHandshake className="w-3.5 h-3.5"/>Mark Blood Administered
                        </button>
                      )}
                      {r.status!=="REDEEMED"&&r.status!=="ADMINISTERED" && (
                        <button onClick={e=>{e.stopPropagation();onDelete(r.id);}} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-red-200 rounded-lg hover:bg-red-50 text-red-600 transition-all ml-auto"><Trash2 className="w-3.5 h-3.5"/>Delete</button>
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

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════════════════════ */
const HospitalDashboard = ({ onLogout }: { onLogout:()=>void }) => {
  const [requests,          setRequests]          = useState<BloodRequest[]>([]);
  const [hospitalData,      setHospitalData]      = useState<any>(null);
  const [notifications,     setNotifications]     = useState<Notification[]>([]);
  const [isRequestModalOpen,setIsRequestModalOpen]= useState(false);
  const [isQRModalOpen,     setIsQRModalOpen]     = useState(false);
  const [isNotifOpen,       setIsNotifOpen]       = useState(false);
  const [isProfileOpen,     setIsProfileOpen]     = useState(false);
  const [isCompleteOpen,    setIsCompleteOpen]    = useState(false);
  const [selectedRequest,   setSelectedRequest]   = useState<BloodRequest|null>(null);
  const [requestToPrint,    setRequestToPrint]    = useState<BloodRequest|null>(null);
  const [completeTarget,    setCompleteTarget]    = useState<BloodRequest|null>(null);
  const [modalUrgency,      setModalUrgency]      = useState<UrgencyLevel>("Routine");
  const [activeTab,         setActiveTab]         = useState<"overview"|"requests">("overview");
  const [tabKey,            setTabKey]            = useState(0);
  const [loading,           setLoading]           = useState(true);

  const hospitalId = localStorage.getItem("userId");

  /* FIX 2: Print when requestToPrint is set */
  useEffect(() => {
    if (requestToPrint) {
      const t = setTimeout(() => { window.print(); setRequestToPrint(null); }, 600);
      return () => clearTimeout(t);
    }
  }, [requestToPrint]);

  /* Fetch data — same logic as original */
  useEffect(() => {
    if (!hospitalId) { toast.error("Not logged in."); return; }
    const fetchData = async () => {
      setLoading(true);
      try {
        const userSnap = await getDoc(doc(db,"users",hospitalId));
        if (userSnap.exists()) setHospitalData(userSnap.data());

        const snap = await getDocs(query(collection(db,"bloodRequests"),where("hospitalId","==",hospitalId)));
        const fetched: BloodRequest[] = [];
        const rtids = snap.docs.map(d=>d.data().rtid||d.data().linkedRTID).filter(Boolean);
        let allLinkedDonations: any[] = [];
        if (rtids.length>0) {
          for (let i=0; i<rtids.length; i+=10) {
            try {
              const batch = rtids.slice(i,i+10);
              const ds = await getDocs(query(collection(db,"donations"),where("linkedHrtid","in",batch)));
              allLinkedDonations.push(...ds.docs.map(d=>d.data()));
            } catch(_){}
          }
        }
        const parseT = (t:any) => { if(t?.toDate) return t.toDate(); if(typeof t==="string") return new Date(t); return new Date(); };
        snap.forEach(d => {
          const data = d.data();
          const linkedDonors = allLinkedDonations.filter((ld:any)=>ld.linkedHrtid===data.linkedRTID||ld.linkedHrtid===data.rtid).map((ld:any)=>({dRtid:ld.rtidCode||ld.rtid||"N/A",name:ld.donorName||"Anonymous",date:parseT(ld.date).toISOString()}));
          // Map old urgency values
          const raw = data.urgency as string;
          const u: UrgencyLevel = raw==="Critical"||raw==="Emergency" ? "Emergency" : raw==="High"||raw==="Urgent" ? "Urgent" : "Routine";
          fetched.push({
            id:d.id, rtid:data.linkedRTID||data.rtid, serialNumber:data.serialNumber,
            patientName:data.patientName, bloodGroup:data.bloodGroup,
            componentType:data.componentType, transfusionIndication:data.transfusionIndication,
            unitsRequired:parseInt(data.units)||0, unitsFulfilled:data.fulfilled?parseInt(data.fulfilled):linkedDonors.length,
            requiredBy:parseT(data.requiredBy), status:data.status,
            city:data.city, createdAt:parseT(data.createdAt),
            patientMobile:data.patientMobile, patientAadhaar:data.patientAadhaar, pincode:data.pincode,
            age:data.age?parseInt(data.age):undefined, urgency:u,
            donors:linkedDonors, doctorName:data.doctorName, doctorRegNo:data.doctorRegNo,
            wardDepartment:data.wardDepartment, bedNumber:data.bedNumber,
            validityHours:data.validityHours||URGENCY_CONFIG[u].validityHours,
            scannedAt:data.scannedAt, scannedLocation:data.scannedLocation,
            redeemedAt:data.redeemedAt?parseT(data.redeemedAt):undefined,
            administeredAt:data.administeredAt?parseT(data.administeredAt):undefined,
            generatedBy:data.generatedBy, systemVersion:data.systemVersion,
          });
        });
        fetched.sort((a,b)=>b.createdAt.getTime()-a.createdAt.getTime());

        // Auto-expire
        const toExpire: string[] = [];
        fetched.forEach(r=>{
          if(r.validityHours&&r.createdAt){
            const valid=new Date(r.createdAt.getTime()+r.validityHours*3600000);
            if(new Date()>valid&&!["REDEEMED","HOSPITAL VERIFIED","ADMINISTERED","CLOSED","EXPIRED","CANCELLED"].includes(r.status)){
              toExpire.push(r.id); r.status="EXPIRED";
            }
          }
        });
        if(toExpire.length>0){
          await Promise.all(toExpire.map(id=>updateDoc(doc(db,"bloodRequests",id),{status:"EXPIRED"}).catch(()=>{})));
        }
        setRequests(fetched);
        // FIX 5: No "system connected" notification — add only real notifications
        toast.success("Dashboard loaded");
      } catch(err:any) {
        toast.error("Failed to load", {description:err?.message});
      } finally { setLoading(false); }
    };
    fetchData();
  }, [hospitalId]);

  const kpis = useMemo(()=>({
    totalRequests:    requests.length,
    activeRequests:   requests.filter(r=>["PENDING","PARTIAL","PLEDGED"].includes(r.status)&&isRequestValid(r)).length,
    totalUnits:       requests.reduce((s,r)=>s+r.unitsRequired,0),
    donationsReceived:requests.filter(r=>["REDEEMED","HOSPITAL VERIFIED","ADMINISTERED"].includes(r.status)).length,
    requestsRedeemed: requests.filter(r=>["REDEEMED","HOSPITAL VERIFIED","ADMINISTERED","CLOSED"].includes(r.status)).length,
    administered:     requests.filter(r=>r.status==="ADMINISTERED").length,
  }), [requests]);

  /* ── Handlers ── */
  const handleNewRequest = async (data: any) => {
    if (!hospitalId) { toast.error("Hospital ID not found."); return; }
    const reqDateTime = new Date(`${data.requiredByDate}T${data.requiredByTime}:00`);
    if (isNaN(reqDateTime.getTime())) throw new Error("Invalid date/time");
    const newHrtid  = generateRtid("H");
    const serial    = generateSerial();
    const validityH = URGENCY_CONFIG[data.urgency as UrgencyLevel]?.validityHours||48;
    const now       = new Date();
    const reqData: any = {
      hospitalId, bloodBankId:"",
      patientName:data.patientName, patientMobile:data.mobile, patientAadhaar:data.aadhaar,
      bloodGroup:data.bloodGroup, componentType:data.componentType||"Whole Blood",
      transfusionIndication:data.transfusionIndication||"Anemia",
      units:String(data.unitsRequired), fulfilled:"0",
      age:String(data.age), city:data.city, pincode:data.pincode,
      requiredBy:reqDateTime.toISOString(), urgency:data.urgency||"Routine",
      status:"CREATED", linkedRTID:newHrtid, rtid:newHrtid,
      serialNumber:serial, validityHours:validityH, createdAt:now.toISOString(),
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
    toast.success(`Request Created · RTID: ${newHrtid}`, {description:`Valid for ${validityH} hours`});
    // FIX 5: Add real notification
    addNotif(`New ${data.urgency} request for ${data.patientName} (${data.bloodGroup})`, "new");
    setRequestToPrint(newReq);
  };

  const handleConfirmReceipt = async (reqId:string, request:BloodRequest) => {
    try {
      const newStatus = request.status==="REDEEMED"?"HOSPITAL VERIFIED":request.status==="HOSPITAL VERIFIED"?"CLOSED":"REDEEMED";
      await updateDoc(doc(db,"bloodRequests",reqId),{status:newStatus,redeemedAt:new Date().toISOString(),scannedLocation:hospitalData?.fullName||"Hospital"});
      setRequests(prev=>prev.map(r=>r.id===reqId?{...r,status:newStatus as RequestStatus,redeemedAt:new Date()}:r));
      toast.success(`Status → ${newStatus}`);
    } catch { toast.error("Failed to update"); }
  };

  /* FIX 6: Mark blood as administered — writes to bloodRequests + donations + user (donor) */
  const handleMarkComplete = async (reqId:string, notes:string) => {
    const r = requests.find(x=>x.id===reqId);
    if (!r) return;
    const now = new Date();
    // 1. Update bloodRequest status
    await updateDoc(doc(db,"bloodRequests",reqId),{
      status:"ADMINISTERED",
      administeredAt:now.toISOString(),
      administrationNotes:notes||"",
      administeredBy:hospitalData?.fullName||"Hospital",
    });
    // 2. Update all linked donor donations
    if (r.donors && r.donors.length>0) {
      await Promise.all(r.donors.map(async (donor) => {
        try {
          const donQ = await getDocs(query(collection(db,"donations"),where("rtidCode","==",donor.dRtid)));
          donQ.forEach(async (donDoc) => {
            await updateDoc(donDoc.ref,{
              administeredAt:now.toISOString(),
              rtidStatus:"ADMINISTERED",
              patientAdministered:r.patientName,
              hospitalAdministered:hospitalData?.fullName||"Hospital",
            });
          });
        } catch(_){}
      }));
    }
    // 3. Also update by linkedHrtid in donations collection
    try {
      const byHrtid = await getDocs(query(collection(db,"donations"),where("linkedHrtid","==",r.rtid)));
      byHrtid.forEach(async (d) => {
        await updateDoc(d.ref,{
          administeredAt:now.toISOString(),
          rtidStatus:"ADMINISTERED",
          patientAdministered:r.patientName,
          hospitalAdministered:hospitalData?.fullName||"Hospital",
        });
      });
    } catch(_){}
    setRequests(prev=>prev.map(x=>x.id===reqId?{...x,status:"ADMINISTERED",administeredAt:now}:x));
    toast.success("Blood marked as administered", {description:"Donor and Blood Bank dashboards updated"});
    addNotif(`Blood administered to ${r.patientName} · RTID ${r.rtid}`, "update");
  };

  const handleDelete = (id:string) => {
    const r=requests.find(x=>x.id===id);
    if(r?.status==="REDEEMED"||r?.status==="ADMINISTERED"){Swal.fire("Cannot Delete","Completed requests cannot be deleted.","warning");return;}
    Swal.fire({title:"Delete Request?",text:"This cannot be undone.",icon:"warning",showCancelButton:true,confirmButtonColor:"#8B0000",confirmButtonText:"Yes, delete"})
      .then(async res=>{ if(res.isConfirmed){try{await deleteDoc(doc(db,"bloodRequests",id));setRequests(prev=>prev.filter(r=>r.id!==id));toast.success("Deleted");}catch{toast.error("Failed");}} });
  };

  const handleLogout = () => {
    Swal.fire({title:"Logout?",icon:"question",showCancelButton:true,confirmButtonColor:"#8B0000",confirmButtonText:"Yes, logout"})
      .then(res=>{ if(res.isConfirmed) onLogout(); });
  };

  /* FIX 5: notification helpers */
  const addNotif = (message:string, type:Notification["type"]) => {
    setNotifications(prev=>[{id:Date.now().toString(),message,time:"Just now",type,read:false},...prev]);
  };
  const markRead    = (id:string) => setNotifications(prev=>prev.map(n=>n.id===id?{...n,read:true}:n));
  const markAllRead = ()          => setNotifications(prev=>prev.map(n=>({...n,read:true})));
  const clearNotifs = ()          => setNotifications([]);

  const openNewRequest = (urg:UrgencyLevel) => { setModalUrgency(urg); setIsRequestModalOpen(true); };
  const openComplete   = (r:BloodRequest)   => { setCompleteTarget(r); setIsCompleteOpen(true); };
  const handleTabChange= (tab:"overview"|"requests") => { setActiveTab(tab); setTabKey(k=>k+1); };

  const unreadCount = notifications.filter(n=>!n.read).length;

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
                  <span className="text-[10px] text-red-200/40 uppercase tracking-widest font-semibold hidden sm:inline">Hospital Portal</span>
                </div>
                {hospitalData?.fullName && (
                  <div className="hd-hosp-name">
                    <Building2 className="w-3 h-3 flex-shrink-0 text-red-300/70" />
                    <span className="truncate max-w-[180px] sm:max-w-xs">{hospitalData.fullName}</span>
                  </div>
                )}
              </div>

              {/* Location chip */}
              <div className="hd-loc-chip hidden md:flex">
                <MapPin className="w-2.5 h-2.5" />
                {hospitalData?.district||"…"}, {hospitalData?.pincode||"…"}
              </div>

              {/* Emergency button in header — FIX 1 */}
              <button onClick={()=>openNewRequest("Emergency")} className="hd-emg-btn hidden sm:flex">
                <Siren className="w-3.5 h-3.5 text-red-600" />
                <span>Emergency</span>
              </button>

              {/* Action buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                {/* FIX 4: Profile button in header */}
                <button onClick={()=>setIsProfileOpen(true)} className="hd-profile-btn hidden sm:flex" title="Hospital Profile">
                  <UserCircle className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Profile</span>
                </button>
                <button onClick={()=>setIsNotifOpen(!isNotifOpen)} className="hd-hdr-btn" aria-label="Notifications">
                  <Bell className="w-4 h-4" />
                  {unreadCount>0 && <span className="hd-notif-badge">{unreadCount>9?"9+":unreadCount}</span>}
                </button>
                <button onClick={handleLogout} className="hd-logout-btn">
                  <LogOut className="w-3.5 h-3.5" /><span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
            {/* Mobile bottom strip */}
            <div className="flex items-center gap-3 pb-2 sm:hidden">
              <div className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5 text-red-200/40"/><span className="text-[11px] text-red-200/40">{hospitalData?.district||"…"}, {hospitalData?.pincode||"…"}</span></div>
              <button onClick={()=>openNewRequest("Emergency")} className="ml-auto flex items-center gap-1 bg-white text-red-700 text-[11px] font-bold px-2.5 py-1 rounded-lg"><Siren className="w-3 h-3"/>Emergency</button>
            </div>
          </div>
        </header>

        {/* ── NAV ── */}
        <nav className="hd-nav no-print">
          <div className="container mx-auto max-w-7xl">
            <div className="hd-nav-inner">
              {([{id:"overview",label:"Dashboard",icon:"🏥"},{id:"requests",label:"All Requests",icon:"📋",badge:requests.length}] as any[]).map(t=>(
                <button key={t.id} onClick={()=>handleTabChange(t.id)} className={`hd-nav-tab ${activeTab===t.id?"hd-nav-active":""}`}>
                  <span>{t.icon}</span><span>{t.label}</span>
                  {t.badge>0 && <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${activeTab===t.id?"bg-white/20 text-white":"bg-[#8B0000] text-white"}`}>{t.badge}</span>}
                </button>
              ))}
              <div className="ml-auto flex items-center">
                <button onClick={()=>openNewRequest("Routine")} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white" style={{background:"linear-gradient(135deg,#8B0000,#b30000)"}}>
                  <Plus className="w-3.5 h-3.5"/>New Request
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* FIX 5: Notification Drawer */}
        <NotifDrawer
          isOpen={isNotifOpen} notifs={notifications}
          onClose={()=>setIsNotifOpen(false)}
          onMarkRead={markRead} onMarkAllRead={markAllRead} onClear={clearNotifs}
        />

        {/* FIX 4: Profile Modal */}
        <ProfileModal isOpen={isProfileOpen} onClose={()=>setIsProfileOpen(false)} hospital={hospitalData} />

        {/* FIX 6: Complete Modal */}
        <CompleteModal
          isOpen={isCompleteOpen} onClose={()=>setIsCompleteOpen(false)}
          request={completeTarget}
          onConfirm={(id,notes)=>handleMarkComplete(id,notes)}
        />

        {/* ── MAIN ── */}
        <main className="container mx-auto px-3 sm:px-5 py-5 sm:py-7 max-w-7xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="relative w-14 h-14">
                <div className="w-14 h-14 rounded-full border-4 border-red-100 border-t-[#8B0000] animate-spin" />
                <Droplet className="absolute inset-0 m-auto w-5 h-5 text-[#8B0000] fill-[#8B0000]" />
              </div>
              <p className="text-sm text-gray-400 font-medium animate-pulse">Loading dashboard…</p>
            </div>
          ) : (
            <div key={tabKey}>
              {activeTab==="overview" && (
                <PremiumDashboard
                  requests={requests} hospitalData={hospitalData} kpis={kpis}
                  onNewRequest={openNewRequest}
                  onViewQR={r=>{setSelectedRequest(r);setIsQRModalOpen(true);}}
                  onDelete={handleDelete} onPrint={r=>setRequestToPrint(r)}
                  onConfirmReceipt={handleConfirmReceipt}
                  onMarkComplete={openComplete}
                />
              )}
              {activeTab==="requests" && (
                <RequestsView
                  requests={requests}
                  onViewQR={r=>{setSelectedRequest(r);setIsQRModalOpen(true);}}
                  onCopyRTID={rtid=>{navigator.clipboard.writeText(rtid).catch(()=>{}); toast.success("RTID copied!");}}
                  onDelete={handleDelete} onPrint={r=>setRequestToPrint(r)}
                  onConfirmReceipt={handleConfirmReceipt}
                  onNewRequest={openNewRequest}
                  onMarkComplete={openComplete}
                />
              )}
            </div>
          )}
        </main>

        {/* FAB */}
        <button className="hd-fab no-print" onClick={()=>openNewRequest("Routine")}>
          <Plus className="w-5 h-5"/><span>New Request</span>
        </button>

        {/* Modals */}
        <NewRequestModal
          isOpen={isRequestModalOpen} onClose={()=>setIsRequestModalOpen(false)}
          onSubmit={handleNewRequest}
          defaultCity={hospitalData?.district||""} defaultPincode={hospitalData?.pincode||""}
          defaultUrgency={modalUrgency} hospitalName={hospitalData?.fullName||"Hospital"}
        />
        <QRModal isOpen={isQRModalOpen} onClose={()=>setIsQRModalOpen(false)} request={selectedRequest} />
      </div>

      {/* FIX 2: Printable slip — uses hd-print-only class, pure inline styles, no Tailwind print: */}
      <PrintableRequest request={requestToPrint} hospital={hospitalData} />
    </>
  );
};

export default HospitalDashboard;