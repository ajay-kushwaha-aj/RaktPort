// src/components/LandingPage.tsx
import * as React from 'react';
import {
  Search, Building2, Heart, Users, FileText, Calendar,
  UserPlus, ClipboardList, Settings, ShieldCheck,
  Clock, RefreshCw, X, ChevronRight, Droplets,
  Trophy, AlertCircle, CheckCircle2, MapPin, Hash,
} from 'lucide-react';
import Autoplay from 'embla-carousel-autoplay';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import bannerImage1 from '../assets/one.png';
import bannerImage2 from '../assets/two.png';
import bannerImage3 from '../assets/three.png';
import bannerImage4 from '../assets/four.png';

/* ─────────────────────── Types ─────────────────────── */
interface LandingPageProps {
  onRoleSelect: (role: string) => void;
  onDonorSignupClick: () => void;
}

interface EmergencyRecord {
  rtid: string;
  patientName: string;
  bloodGroup: string;
  units: string;
  hospital: string;
  city: string;
  contact: string;
  urgency: string;
  timestamp: string;
  status: 'Active' | 'Fulfilled' | 'Cancelled';
}

/* ─────────────────────── Constants ─────────────────── */
const BLOOD_TYPES = [
  { type: 'A+', donateTo: 'A+, AB+', receiveFrom: 'A+, A−, O+, O−', color: '#c0392b' },
  { type: 'A−', donateTo: 'A+, A−, AB+, AB−', receiveFrom: 'A−, O−', color: '#922b21' },
  { type: 'B+', donateTo: 'B+, AB+', receiveFrom: 'B+, B−, O+, O−', color: '#c0392b' },
  { type: 'B−', donateTo: 'B+, B−, AB+, AB−', receiveFrom: 'B−, O−', color: '#922b21' },
  { type: 'AB+', donateTo: 'AB+ only', receiveFrom: 'All blood types', color: '#8B0000' },
  { type: 'AB−', donateTo: 'AB+, AB−', receiveFrom: 'AB−, A−, B−, O−', color: '#6b0000' },
  { type: 'O+', donateTo: 'A+, B+, O+, AB+', receiveFrom: 'O+, O−', color: '#c0392b' },
  { type: 'O−', donateTo: 'All blood types', receiveFrom: 'O− only', color: '#922b21' },
];

const LEADERBOARD = [
  { rank: 1, name: 'Arjun Sharma', city: 'Mumbai', donations: 48, badge: 'Platinum', bloodType: 'O+' },
  { rank: 2, name: 'Priya Nair', city: 'Chennai', donations: 41, badge: 'Gold', bloodType: 'A+' },
  { rank: 3, name: 'Rohit Verma', city: 'Delhi', donations: 37, badge: 'Gold', bloodType: 'B+' },
  { rank: 4, name: 'Sneha Patel', city: 'Ahmedabad', donations: 32, badge: 'Silver', bloodType: 'AB+' },
  { rank: 5, name: 'Kiran Rao', city: 'Hyderabad', donations: 29, badge: 'Silver', bloodType: 'O−' },
  { rank: 6, name: 'Meena Das', city: 'Kolkata', donations: 24, badge: 'Bronze', bloodType: 'A−' },
  { rank: 7, name: 'Amit Singh', city: 'Pune', donations: 21, badge: 'Bronze', bloodType: 'B−' },
];

const ELIGIBILITY_RULES: Record<string, Record<string, number>> = {
  'Whole Blood': { Male: 90, Female: 90 },
  'Platelets': { Male: 14, Female: 14 },
  'Plasma': { Male: 28, Female: 28 },
  'Double Red Cells': { Male: 112, Female: 112 },
};

const RTID_STEPS = [
  'Donation Collected',
  'Laboratory Testing',
  'Component Separation',
  'Blood Bank Storage',
  'Issued to Hospital',
  'Transfused',
];

const DB_KEY = 'rp_emergency_requests';

/* ─────────────────────── Utilities ─────────────────── */

/**
 * Generates a RaktPort Transfusion ID
 * Format: <Type>-RTID-<DDMMYY>-<AXXXX>
 * Examples: D-RTID-100326-A4F7K | H-RTID-100326-B9X2P
 */
function genRTID(type: 'D' | 'H' = 'H'): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(2);
  const alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const alnum = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  // First char is always a letter, followed by 4 alphanumerics
  let code = alpha[Math.floor(Math.random() * alpha.length)];
  for (let i = 0; i < 4; i++) code += alnum[Math.floor(Math.random() * alnum.length)];
  return `${type}-RTID-${dd}${mm}${yy}-${code}`;
}

/** Validate RTID format: X-RTID-DDMMYY-AXXXX */
function isValidRTID(s: string): boolean {
  return /^[DH]-RTID-\d{6}-[A-Z0-9]{5}$/i.test(s.trim());
}

/** Simulate async API + write to localStorage */
async function submitEmergencyToDB(
  data: Omit<EmergencyRecord, 'rtid' | 'timestamp' | 'status'>,
): Promise<string> {
  await new Promise(r => setTimeout(r, 1400)); // Simulate API latency
  const rtid: string = genRTID('H');
  const record: EmergencyRecord = {
    ...data,
    rtid,
    timestamp: new Date().toISOString(),
    status: 'Active',
  };
  try {
    const existing: EmergencyRecord[] = JSON.parse(localStorage.getItem(DB_KEY) || '[]');
    existing.push(record);
    localStorage.setItem(DB_KEY, JSON.stringify(existing));
    /* In production, replace with:
       await fetch('/api/emergency-requests', { method:'POST', body:JSON.stringify(record) }); */
    console.log('[RaktPort DB] Emergency request saved:', record);
  } catch (e) {
    console.warn('[RaktPort DB] Write failed:', e);
  }
  return rtid;
}

/** Look up RTID — checks real DB first, then falls back to deterministic mock */
function lookupRTID(rtid: string): { current: number; record?: EmergencyRecord } {
  try {
    const records: EmergencyRecord[] = JSON.parse(localStorage.getItem(DB_KEY) || '[]');
    const found = records.find(r => r.rtid.toUpperCase() === rtid.trim().toUpperCase());
    if (found) {
      const elapsedMin = (Date.now() - new Date(found.timestamp).getTime()) / 60000;
      const current = Math.min(Math.floor(elapsedMin / 5) + 1, 6);
      return { current: Math.max(current, 1), record: found };
    }
  } catch (_) { }
  // Demo fallback: derive progress from last char
  const code = rtid.trim().toUpperCase().slice(-1);
  const codeVal = code.charCodeAt(0) || 65;
  return { current: Math.min((codeVal % 6) + 1, 6) };
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* ─────────────────────── Hooks ─────────────────────── */
function useLiveCounter(target: number, duration = 1800): number {
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    let v = 0;
    const step = Math.ceil(target / (duration / 16));
    const id = setInterval(() => {
      v = Math.min(v + step, target);
      setVal(v);
      if (v >= target) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [target, duration]);
  React.useEffect(() => {
    const id = setInterval(() => setVal(n => n + Math.floor(Math.random() * 2 + 1)), 4200);
    return () => clearInterval(id);
  }, []);
  return val;
}

/* ─────────────────────── Component ─────────────────── */
export function LandingPage({ onRoleSelect, onDonorSignupClick }: LandingPageProps) {

  /* Carousel */
  const autoplayPlugin = React.useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));
  const [carouselApi, setCarouselApi] = React.useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const TOTAL_SLIDES = 4;
  const BANNERS = [bannerImage1, bannerImage2, bannerImage3, bannerImage4];

  React.useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => setCurrentSlide(carouselApi.selectedScrollSnap());
    onSelect();
    carouselApi.on('select', onSelect);
    return () => { carouselApi.off('select', onSelect); };
  }, [carouselApi]);

  /* Blood guide */
  const [selectedBlood, setSelectedBlood] = React.useState<string | null>(null);

  /* Emergency modal */
  const [emergencyOpen, setEmergencyOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [emergencyForm, setEmergencyForm] = React.useState({
    patientName: '', bloodGroup: '', units: '', hospital: '', city: '', contact: '', urgency: 'Critical',
  });
  const [emergencySubmitted, setEmergencySubmitted] = React.useState(false);
  const [generatedRTID, setGeneratedRTID] = React.useState('');

  const handleEmergencySubmit = async () => {
    if (!emergencyForm.patientName || !emergencyForm.bloodGroup || !emergencyForm.city) return;
    setSubmitting(true);
    try {
      const rtid = await submitEmergencyToDB(emergencyForm);
      setGeneratedRTID(rtid);
      setEmergencySubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const closeEmergency = () => {
    setEmergencyOpen(false);
    setEmergencySubmitted(false);
    setEmergencyForm({ patientName: '', bloodGroup: '', units: '', hospital: '', city: '', contact: '', urgency: 'Critical' });
    setGeneratedRTID('');
  };

  /* RTID tracker */
  const [rtidInput, setRtidInput] = React.useState('');
  const [rtidResult, setRtidResult] = React.useState<{ current: number; record?: EmergencyRecord } | null>(null);
  const [rtidError, setRtidError] = React.useState('');

  const handleTrack = () => {
    const val = rtidInput.trim().toUpperCase();
    if (!val) { setRtidError('Please enter an RTID.'); return; }
    if (!isValidRTID(val)) { setRtidError('Format: D-RTID-DDMMYY-AXXXX  (e.g. D-RTID-100326-A4F7K)'); return; }
    setRtidError('');
    setRtidResult(lookupRTID(val));
  };

  /* Eligibility checker */
  const [eliForm, setEliForm] = React.useState({ lastDate: '', gender: 'Male', component: 'Whole Blood' });
  const [eliResult, setEliResult] = React.useState<string | null>(null);
  const [eliError, setEliError] = React.useState('');

  const checkEligibility = () => {
    if (!eliForm.lastDate) { setEliError('Please select your last donation date.'); return; }
    setEliError('');
    const days = ELIGIBILITY_RULES[eliForm.component]?.[eliForm.gender] ?? 90;
    const next = addDays(new Date(eliForm.lastDate), days);
    setEliResult(next <= new Date()
      ? `✅ You are eligible to donate now! (${days}-day interval has passed)`
      : `📅 You can donate again on: ${formatDate(next)}`);
  };

  /* Live counters */
  const livesSaved = useLiveCounter(100);
  const activeDonors = useLiveCounter(2540);
  const emergReqs = useLiveCounter(37);
  const banksOnline = useLiveCounter(849);

  /* ──────────────────── Render ──────────────────── */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

        .lp * { font-family:'Plus Jakarta Sans',sans-serif; box-sizing:border-box; }
        .lp-d { font-family:'Sora',sans-serif; font-weight:800; letter-spacing:-0.04em; }

        /* ── Hero layout: side-by-side on desktop, stacked on mobile ── */
        .hero-wrap {
          display: flex;
          align-items: stretch;
          background: #180404;
          /* isolate from sticky header */
          isolation: isolate;
          z-index: 0;
        }
        .hero-carousel-col {
          flex: 1;
          min-width: 0;
          position: relative;
          overflow: hidden;
        }
        /* Make shadcn Carousel fill full width with no gap */
        .hero-carousel-col [data-radix-scroll-area-viewport],
        .hero-carousel-col .embla__container { height: 100%; }

        .hero-right-panel {
          width: 310px;
          flex-shrink: 0;
          background: linear-gradient(165deg, #1c0606 0%, #2e0a0a 100%);
          border-left: 1px solid rgba(255,255,255,0.08);
          padding: 22px 18px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 12px;
        }
        @media (max-width:1100px) { .hero-right-panel { width:272px; padding:18px 14px; } }
        @media (max-width:860px)  { .hero-right-panel { width:240px; padding:16px 12px; } }
        @media (max-width:768px)  { .hero-right-panel { display:none; } }

        /* Mobile CTA strip */
        .hero-mob-cta {
          display: none;
          background: #7B0000;
          padding: 12px 14px;
          gap: 9px;
        }
        @media (max-width:768px) { .hero-mob-cta { display:flex; flex-wrap:wrap; } }

        /* Carousel dots */
        .c-dot { height:7px; border-radius:999px; transition:all 0.3s ease; cursor:pointer; border:none; outline:none; padding:0; }
        .c-dot.on  { background:#8B0000; width:24px; }
        .c-dot.off { background:rgba(255,255,255,0.45); width:7px; }
        .c-dot.off:hover { background:rgba(255,255,255,0.8); }

        /* Compliance badges */
        .badge-item { display:flex; align-items:center; gap:6px; font-size:11.5px; font-weight:600; color:#5a7a52; white-space:nowrap; }

        /* Live stats */
        .stat-live { padding:20px 12px; border-radius:14px; background:rgba(255,255,255,0.09); border:1px solid rgba(255,255,255,0.13); text-align:center; transition:all 0.25s; }
        .stat-live:hover { background:rgba(255,255,255,0.15); transform:translateY(-2px); }
        .stat-pulse { display:inline-block; width:8px; height:8px; border-radius:50%; background:#4ade80; margin-right:5px; animation:pg 1.6s ease-in-out infinite; }
        @keyframes pg { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.55;transform:scale(1.35);} }

        /* Service cards */
        .svc-card { background:white; border:1.5px solid #f0e8e4; border-radius:18px; padding:24px 18px; text-align:center; transition:transform 0.26s cubic-bezier(.25,.8,.25,1),border-color 0.22s,box-shadow 0.26s; cursor:pointer; display:flex; flex-direction:column; align-items:center; height:100%; position:relative; overflow:hidden; }
        .svc-card::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(139,0,0,0.04),transparent 60%); opacity:0; transition:opacity 0.22s; }
        .svc-card:hover { transform:translateY(-4px); border-color:#8B0000; box-shadow:0 14px 30px rgba(139,0,0,0.1); }
        .svc-card:hover::before { opacity:1; }
        .svc-icon { color:#8B0000; margin-bottom:12px; transition:transform 0.22s; }
        .svc-card:hover .svc-icon { transform:scale(1.1); }

        /* Blood cards */
        .blood-card { border-radius:14px; border:1.5px solid #f0e8e4; background:white; padding:16px 6px 12px; text-align:center; cursor:pointer; transition:all 0.22s ease; position:relative; min-height:76px; display:flex; flex-direction:column; align-items:center; justify-content:center; user-select:none; -webkit-tap-highlight-color:transparent; }
        .blood-card:hover  { border-color:#c0392b; box-shadow:0 6px 18px rgba(139,0,0,0.12); transform:translateY(-2px); }
        .blood-card.sel    { border-color:#8B0000; background:linear-gradient(145deg,#fff5f5,#fff0ee); box-shadow:0 8px 26px rgba(139,0,0,0.16); transform:translateY(-3px); }
        .blood-type-lbl    { font-family:'Sora',sans-serif; font-weight:800; letter-spacing:-0.04em; line-height:1; }
        .blood-sub         { font-size:9px; color:#9a8a82; margin-top:4px; }
        .blood-info-panel  { background:white; border:1.5px solid #e8d8d5; border-radius:16px; padding:18px 20px; margin:14px auto 0; max-width:540px; animation:pan-in 0.22s ease; box-shadow:0 8px 26px rgba(139,0,0,0.09); }
        @keyframes pan-in { from{opacity:0;transform:translateY(8px);} to{opacity:1;transform:translateY(0);} }

        /* Step circle */
        .step-num { width:46px; height:46px; border-radius:50%; background:linear-gradient(135deg,#8B0000,#c0392b); color:white; font-family:'Sora',sans-serif; font-weight:800; font-size:1.1rem; display:flex; align-items:center; justify-content:center; box-shadow:0 5px 14px rgba(139,0,0,0.3); }

        /* Role cards */
        .role-card { border-radius:18px; border:2px solid #f0e5e3; padding:26px 18px; background:white; cursor:pointer; transition:all 0.3s cubic-bezier(.25,.8,.25,1); display:flex; flex-direction:column; align-items:center; text-align:center; position:relative; overflow:hidden; width:100%; }
        .role-card::after { content:''; position:absolute; bottom:-70px; right:-70px; width:160px; height:160px; border-radius:50%; background:rgba(139,0,0,0.04); transition:transform 0.4s; }
        .role-card:hover { border-color:#8B0000; transform:translateY(-4px); box-shadow:0 18px 38px rgba(139,0,0,0.11); background:linear-gradient(160deg,#fff5f5,white); }
        .role-card:hover::after { transform:scale(2.8); }
        .role-icon { color:#8B0000; margin-bottom:12px; transition:transform 0.22s; }
        .role-card:hover .role-icon { transform:scale(1.1); color:#6b0000; }

        /* Eyebrow */
        .ey { font-size:10.5px; font-weight:700; letter-spacing:0.18em; text-transform:uppercase; color:#8B0000; display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:10px; }
        .ey::before,.ey::after { content:''; display:block; width:24px; height:1px; background:currentColor; opacity:0.35; }

        /* Why donate */
        .why-card { padding:20px 16px; border-radius:14px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.14); display:flex; gap:14px; align-items:flex-start; transition:all 0.22s; }
        .why-card:hover { background:rgba(255,255,255,0.13); transform:translateY(-2px); }
        .why-icon-wrap { width:42px; height:42px; border-radius:12px; flex-shrink:0; display:flex; align-items:center; justify-content:center; background:rgba(192,57,43,0.35); border:1px solid rgba(255,255,255,0.15); }

        /* Leaderboard row */
        .lb-row { display:flex; align-items:center; gap:12px; padding:12px 16px; border-radius:12px; transition:background 0.18s; }
        .lb-row:hover { background:#fff5f5; }

        /* RTID tracker row (full-section variant) */
        .rtid-step-col { display:flex; flex-direction:column; align-items:center; flex:1 0 64px; position:relative; }

        /* Modal */
        .modal-bd { position:fixed; inset:0; background:rgba(10,0,0,0.72); z-index:200; display:flex; align-items:center; justify-content:center; padding:16px; backdrop-filter:blur(4px); animation:mfade 0.2s ease; }
        @keyframes mfade { from{opacity:0;} to{opacity:1;} }
        .modal-box { background:white; border-radius:22px; width:100%; max-width:520px; max-height:90vh; overflow-y:auto; box-shadow:0 30px 80px rgba(0,0,0,0.35); animation:mslide 0.24s ease; }
        @keyframes mslide { from{transform:translateY(18px);opacity:0;} to{transform:translateY(0);opacity:1;} }

        /* Form inputs */
        .fi { width:100%; padding:10px 13px; border-radius:10px; border:1.5px solid #e8ddd5; background:white; font-size:13px; font-family:'Plus Jakarta Sans',sans-serif; transition:border-color 0.18s; outline:none; color:#1a0505; }
        .fi:focus { border-color:#8B0000; }
        .fi-dark { background:rgba(255,255,255,0.09); border:1px solid rgba(255,255,255,0.22); color:white; font-size:12px; }
        .fi-dark::placeholder { color:rgba(255,255,255,0.38); }
        .fi-dark:focus { border-color:rgba(192,57,43,0.8); }
        .fl { font-size:11.5px; font-weight:600; color:#5a4a42; margin-bottom:5px; display:block; }
        .sel-arrow { appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238B0000' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 10px center; padding-right:30px !important; }

        /* Buttons */
        .btn-p { background:linear-gradient(135deg,#8B0000,#c0392b); color:white; border:none; border-radius:10px; padding:11px 24px; font-size:13.5px; font-weight:700; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.2s; box-shadow:0 4px 14px rgba(139,0,0,0.3); }
        .btn-p:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 20px rgba(139,0,0,0.4); }
        .btn-p:disabled { opacity:0.65; cursor:not-allowed; }
        .btn-ow { background:transparent; color:white; border:1.5px solid rgba(255,255,255,0.65); border-radius:10px; padding:10px 18px; font-size:13px; font-weight:600; cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; transition:all 0.2s; }
        .btn-ow:hover { background:rgba(255,255,255,0.12); border-color:white; }

        /* Mobile responsive */
        @media (max-width:640px) {
          .lp-st { font-size:1.9rem !important; }
          .blood-card { padding:12px 4px 8px; }
          .blood-type-lbl { font-size:1.2rem !important; }
          .why-card { flex-direction:column; }
          .rtid-step-col { flex:1 0 52px; }
        }

        /* ══════════════════ DARK MODE ══════════════════ */

        /* Compliance badges bar */
        .dark .lp-badges-bar { background:#1a1a1a !important; border-color:#2a2a2a !important; }
        .dark .badge-item { color:#7aaa72 !important; }

        /* Service cards */
        .dark .svc-card { background:#1a1a1a !important; border-color:#2a2a2a !important; }
        .dark .svc-card::before { background:linear-gradient(135deg,rgba(192,57,43,0.08),transparent 60%) !important; }
        .dark .svc-card:hover { border-color:#8B0000 !important; box-shadow:0 14px 30px rgba(139,0,0,0.2) !important; }
        .dark .svc-card h3 { color:#f0e0dd !important; }
        .dark .svc-card p { color:#9a8a82 !important; }

        /* How it works */
        .dark .lp-section-white { background:#111 !important; }
        .dark .lp-section-white h4 { color:#f0e0dd !important; }
        .dark .lp-section-white p { color:#9a8a82 !important; }
        .dark .lp-section-white .ey { color:#c0392b !important; }
        .dark .lp-section-white h2 { color:#f0e0dd !important; }

        /* Blood group guide section */
        .dark .lp-section-cream { background:#151515 !important; }
        .dark .lp-section-cream .ey { color:#c0392b !important; }
        .dark .lp-section-cream h2 { color:#f0e0dd !important; }
        .dark .lp-section-cream p { color:#9a8a82 !important; }
        .dark .blood-card { background:#1a1a1a !important; border-color:#2a2a2a !important; }
        .dark .blood-card:hover { border-color:#c0392b !important; box-shadow:0 6px 18px rgba(139,0,0,0.25) !important; }
        .dark .blood-card.sel { background:linear-gradient(145deg,#2a1515,#1f1010) !important; border-color:#8B0000 !important; box-shadow:0 8px 26px rgba(139,0,0,0.3) !important; }
        .dark .blood-sub { color:#7a6a62 !important; }
        .dark .blood-info-panel { background:#1a1a1a !important; border-color:#2a2a2a !important; box-shadow:0 8px 26px rgba(0,0,0,0.3) !important; }
        .dark .blood-info-panel .lp-d { color:#c0392b !important; }
        .dark .blood-info-panel p[style*="color:#1a0505"] { color:#f0e0dd !important; }

        /* Eligibility checker */
        .dark .lp-eli-card { background:#1a1a1a !important; border-color:#2a2a2a !important; box-shadow:0 10px 40px rgba(0,0,0,0.3) !important; }
        .dark .fi { background:#222 !important; border-color:#333 !important; color:#e0d0cc !important; }
        .dark .fi:focus { border-color:#8B0000 !important; }
        .dark .fl { color:#b0a098 !important; }

        /* Leaderboard */
        .dark .lp-leaderboard { background:#1a1a1a !important; border-color:#2a2a2a !important; box-shadow:0 10px 40px rgba(0,0,0,0.3) !important; }
        .dark .lb-row:hover { background:#221515 !important; }
        .dark .lb-row span[style*="color:#1a0505"] { color:#f0e0dd !important; }

        /* Role selection section */
        .dark .lp-role-wrap { background:#1a1a1a !important; border-color:#2a2a2a !important; box-shadow:0 18px 55px rgba(0,0,0,0.3) !important; }
        .dark .role-card { background:#1e1e1e !important; border-color:#2a2a2a !important; }
        .dark .role-card:hover { border-color:#8B0000 !important; box-shadow:0 18px 38px rgba(139,0,0,0.2) !important; background:linear-gradient(160deg,#2a1515,#1e1e1e) !important; }
        .dark .role-card h4 { color:#f0e0dd !important; }
        .dark .role-card p { color:#9a8a82 !important; }
        .dark .role-card .role-icon { color:#c0392b !important; }
        .dark .role-card:hover .role-icon { color:#ff4444 !important; }

        /* Emergency modal */
        .dark .modal-box { background:#1a1a1a !important; }
        .dark .modal-box .fl { color:#b0a098 !important; }
        .dark .modal-box .fi { background:#222 !important; border-color:#333 !important; color:#e0d0cc !important; }
        .dark .modal-box .fi:focus { border-color:#8B0000 !important; }
      `}</style>

      <div className="lp" id="main-content">

        {/* ══════════════════ HERO ══════════════════ */}
        <div className="hero-wrap">

          {/* Left: Carousel (no overlap with right panel) */}
          <div className="hero-carousel-col">
            {/* shadcn Carousel — override default -ml-4 and pl-4 for full-bleed */}
            <Carousel
              opts={{ loop: true }}
              plugins={[autoplayPlugin.current]}
              setApi={setCarouselApi}
              className="w-full"
            >
              <CarouselContent className="ml-0">
                {BANNERS.map((src, i) => (
                  <CarouselItem key={i} className="p-0">
                    <div style={{ position: 'relative' }}>
                      <img
                        src={src}
                        alt={`RaktPort Banner ${i + 1}`}
                        style={{ width: '100%', display: 'block', objectFit: 'cover' }}
                      />
                      {/* Bottom gradient so dots are readable */}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.38) 0%, transparent 45%)', pointerEvents: 'none' }} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            {/* Dots — inside carousel col, above gradient */}
            <div style={{ position: 'absolute', bottom: 13, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 5 }}>
              {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
                <button key={i} className={`c-dot ${i === currentSlide ? 'on' : 'off'}`} onClick={() => carouselApi?.scrollTo(i)} aria-label={`Slide ${i + 1}`} />
              ))}
            </div>
          </div>

          {/* Right: Panel (desktop only — NOT overlapping carousel) */}
          <aside className="hero-right-panel" aria-label="Quick Actions">

            {/* RTID Tracker widget */}
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: '14px', border: '1px solid rgba(255,255,255,0.14)' }}>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Hash size={10} /> Track Donation
              </p>
              <div style={{ display: 'flex', gap: 6, marginBottom: rtidError ? 6 : 0 }}>
                <input
                  className="fi fi-dark"
                  style={{ flex: 1, borderRadius: 8, padding: '8px 10px' }}
                  placeholder="e.g. D-RTID-100326-A4F7K"
                  value={rtidInput}
                  onChange={e => { setRtidInput(e.target.value.toUpperCase()); setRtidResult(null); setRtidError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleTrack()}
                />
                <button onClick={handleTrack} className="btn-p" style={{ padding: '8px 12px', fontSize: '12px', borderRadius: 8 }}>Track</button>
              </div>
              {rtidError && <p style={{ color: '#fca5a5', fontSize: '10px', marginTop: 4 }}>{rtidError}</p>}

              {/* Inline progress dots */}
              {rtidResult && (
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {RTID_STEPS.map((step, i) => {
                    const done = i < rtidResult.current;
                    return (
                      <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: done ? '#4ade80' : 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: done ? '#014012' : 'rgba(255,255,255,0.45)', flexShrink: 0 }}>
                          {done ? '✓' : i + 1}
                        </div>
                        <span style={{ fontSize: '9px', color: done ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.38)', whiteSpace: 'nowrap' }}>{step.split(' ')[0]}</span>
                        {i < RTID_STEPS.length - 1 && <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: '9px', marginLeft: 1 }}>›</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Emergency button */}
            <button
              onClick={() => setEmergencyOpen(true)}
              style={{ width: '100%', background: 'linear-gradient(135deg,#c0392b,#e74c3c)', color: 'white', border: 'none', borderRadius: 12, padding: '13px 16px', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(192,57,43,0.55)' }}
            >
              <AlertCircle size={16} /> 🔴 Need Blood Now? Emergency
            </button>

            {/* Donor button */}
            <button onClick={onDonorSignupClick} className="btn-ow" style={{ width: '100%', textAlign: 'center' }}>
              🩸 Register as Donor
            </button>
          </aside>
        </div>

        {/* Mobile CTA strip — shown only on mobile */}
        <div className="hero-mob-cta">
          <button onClick={() => setEmergencyOpen(true)}
            style={{ flex: 1, background: 'linear-gradient(135deg,#c0392b,#e74c3c)', color: 'white', border: 'none', borderRadius: 10, padding: '12px 10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <AlertCircle size={15} /> Request Emergency Blood
          </button>
          <button onClick={onDonorSignupClick}
            style={{ flex: 1, background: 'rgba(255,255,255,0.14)', color: 'white', border: '1.5px solid rgba(255,255,255,0.58)', borderRadius: 10, padding: '12px 10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Droplets size={15} /> Become a Donor
          </button>
        </div>

        {/* Compliance badges */}
        <div className="lp-badges-bar" style={{ background: '#fff', borderBottom: '1px solid #f0e8e4', padding: '10px 0' }}>
          <div className="container mx-auto px-4">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', alignItems: 'center', justifyContent: 'center' }}>
              {['Compliant with NACO Guidelines', 'Integrated with National Digital Health Mission', 'Verified Blood Banks', 'MoHFW Approved Platform'].map(b => (
                <div key={b} className="badge-item"><CheckCircle2 size={13} color="#5a7a52" />{b}</div>
              ))}
            </div>
          </div>
        </div>

        {/* ══════════════════ LIVE STATS ══════════════════ */}
        <section style={{ background: '#7B0000', padding: '36px 0' }}>
          <div className="container mx-auto px-4">
            <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginBottom: 16, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span className="stat-pulse" /> Live Data
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }} className="sm:grid-cols-4">
              {[
                { label: 'Lives Saved Today', v: livesSaved, icon: '❤️' },
                { label: 'Active Donors Online', v: activeDonors, icon: '🩸' },
                { label: 'Emergency Requests', v: emergReqs, icon: '🚨' },
                { label: 'Blood Banks Online', v: banksOnline, icon: '🏥' },
              ].map(s => (
                <div key={s.label} className="stat-live">
                  <div style={{ fontSize: '1.3rem', marginBottom: 3 }}>{s.icon}</div>
                  <div className="lp-d" style={{ fontSize: '1.75rem', color: 'white', lineHeight: 1 }}>{s.v.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', marginTop: 5, fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════ RTID TRACKER (full-width section, mobile-primary) ══════════════════ */}
        <section style={{ background: '#1a0505', padding: '44px 0' }}>
          <div className="container mx-auto px-4" style={{ maxWidth: 720 }}>
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <div className="ey" style={{ color: 'rgba(220,160,150,0.7)' }}>
                <span style={{ background: 'rgba(220,160,150,0.35)', width: 22, height: 1, display: 'block' }} />
                Track Your Donation
                <span style={{ background: 'rgba(220,160,150,0.35)', width: 22, height: 1, display: 'block' }} />
              </div>
              <h2 className="lp-d lp-st" style={{ fontSize: '2.2rem', color: 'white', lineHeight: 1.1 }}>
                RTID <span style={{ color: '#c0392b' }}>Tracker</span>
              </h2>
              <p style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.38)', marginTop: 6 }}>
                Format: <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 7px', borderRadius: 5, letterSpacing: '0.05em' }}>D-RTID-DDMMYY-AXXXX</code>
              </p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.11)', borderRadius: 18, padding: '22px' }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: rtidResult ? 18 : 0 }}>
                <input
                  className="fi fi-dark"
                  style={{ flex: 1, borderRadius: 10 }}
                  placeholder="Enter RTID  e.g. D-RTID-100326-A4F7K"
                  value={rtidInput}
                  onChange={e => { setRtidInput(e.target.value.toUpperCase()); setRtidResult(null); setRtidError(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleTrack()}
                />
                <button onClick={handleTrack} className="btn-p" style={{ whiteSpace: 'nowrap' }}>Track Donation</button>
              </div>
              {rtidError && <p style={{ color: '#fca5a5', fontSize: '12px', marginTop: 6 }}>{rtidError}</p>}

              {rtidResult && (
                <div>
                  <div style={{ display: 'flex', overflowX: 'auto', paddingBottom: 6 }}>
                    {RTID_STEPS.map((step, i) => {
                      const done = i < rtidResult.current;
                      const active = i === rtidResult.current - 1;
                      const last = i === RTID_STEPS.length - 1;
                      return (
                        <div key={step} className="rtid-step-col">
                          {/* connector line */}
                          {!last && (
                            <div style={{ position: 'absolute', top: 15, left: 'calc(50% + 16px)', width: 'calc(100% - 32px)', height: 2, background: done ? '#4ade80' : 'rgba(255,255,255,0.14)', zIndex: 0 }} />
                          )}
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: done ? '#4ade80' : active ? 'rgba(192,57,43,0.45)' : 'rgba(255,255,255,0.11)', border: active ? '2px solid #c0392b' : '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: done ? '#014012' : active ? 'white' : 'rgba(255,255,255,0.38)', position: 'relative', zIndex: 1, flexShrink: 0 }}>
                            {done ? '✓' : i + 1}
                          </div>
                          <p style={{ fontSize: '9px', color: done ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.38)', marginTop: 6, textAlign: 'center', lineHeight: 1.35, maxWidth: 64 }}>{step}</p>
                        </div>
                      );
                    })}
                  </div>
                  {rtidResult.record && (
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: 6, textAlign: 'center' }}>
                      Patient: <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{rtidResult.record.patientName}</strong> · Blood: <strong style={{ color: '#c0392b' }}>{rtidResult.record.bloodGroup}</strong>
                    </p>
                  )}
                  <p style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.35)', marginTop: 4, textAlign: 'center', fontFamily: 'monospace' }}>{rtidInput}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ══════════════════ SERVICES ══════════════════ */}
        <section className="lp-section-cream" style={{ padding: '64px 0', background: '#fdf8f6' }}>
          <div className="container mx-auto px-4">
            <div style={{ textAlign: 'center', marginBottom: 44 }}>
              <div className="ey">What We Offer</div>
              <h2 className="lp-d lp-st" style={{ fontSize: '2.5rem', color: '#1a0505', lineHeight: 1.15 }}>Our <span style={{ color: '#8B0000' }}>Services</span></h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <SvcCard href="/compatibility.html" icon={<Search className="w-8 h-8" />} title="Blood Compatibility Chart" desc="Find compatible blood groups instantly for donors and recipients." />
              <SvcCard href="/Donation-eligibility-rules.html" icon={<ShieldCheck className="w-8 h-8" />} title="Donation Eligibility & Rules" desc="Check eligibility and understand the rules before you donate." />
              <SvcCard href="/bloodcenter.html" icon={<Heart className="w-8 h-8" />} title="Blood Donation Camps" desc="Locate and participate in nearby blood donation camps." />
              <SvcCard onClick={onDonorSignupClick} icon={<Users className="w-8 h-8" />} title="Become A Donor" desc="Register, manage your profile, and track your life-saving impact." />
              <SvcCard href="/Donation-Preparation&Aftercare.html" icon={<FileText className="w-8 h-8" />} title="Preparation & Aftercare" desc="Everything you need before and after donating blood." />
              <SvcCard href="https://pledge.mygov.in/voluntary-blood-donation/" icon={<Calendar className="w-8 h-8" />} title="MyGov Pledge" desc="Take the official pledge to donate blood regularly." />
            </div>
          </div>
        </section>

        {/* ══════════════════ HOW IT WORKS ══════════════════ */}
        <section className="lp-section-white" style={{ padding: '64px 0', background: 'white' }}>
          <div className="container mx-auto px-4">
            <div style={{ textAlign: 'center', marginBottom: 44 }}>
              <div className="ey">Simple Process</div>
              <h2 className="lp-d lp-st" style={{ fontSize: '2.5rem', color: '#1a0505', lineHeight: 1.15 }}>How It <span style={{ color: '#8B0000' }}>Works</span></h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {[
                { n: '1', icon: <UserPlus size={18} />, t: 'Register', d: 'Create your donor profile in under 2 minutes.' },
                { n: '2', icon: <ShieldCheck size={18} />, t: 'Check Eligibility', d: 'Answer quick health questions to confirm readiness.' },
                { n: '3', icon: <Search size={18} />, t: 'Find a Camp', d: 'Locate the nearest donation camp or blood bank.' },
                { n: '4', icon: <Heart size={18} />, t: 'Donate & Save', d: 'Donate and receive your digital certificate.' },
              ].map(s => (
                <div key={s.n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div className="step-num">{s.n}</div>
                  <div style={{ color: '#8B0000', margin: '10px 0 5px' }}>{s.icon}</div>
                  <h4 style={{ fontWeight: 700, color: '#1a0505', fontSize: '0.92rem', marginBottom: 5 }}>{s.t}</h4>
                  <p style={{ fontSize: '12px', color: '#7a6868', lineHeight: 1.65 }}>{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════ BLOOD GROUP GUIDE ══════════════════ */}
        <section className="lp-section-cream" style={{ padding: '64px 0', background: '#fdf8f6' }}>
          <div className="container mx-auto px-4">
            <div style={{ textAlign: 'center', marginBottom: 10 }}>
              <div className="ey">Quick Reference</div>
              <h2 className="lp-d lp-st" style={{ fontSize: '2.5rem', color: '#1a0505', lineHeight: 1.15 }}>Blood Group <span style={{ color: '#8B0000' }}>Guide</span></h2>
              <p style={{ fontSize: '12px', color: '#7a6868', marginTop: 8 }}>Tap any card to see compatibility info.</p>
            </div>

            {selectedBlood && (() => {
              const info = BLOOD_TYPES.find(b => b.type === selectedBlood)!;
              return (
                <div className="blood-info-panel">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 10, background: 'linear-gradient(135deg,#8B0000,#c0392b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="lp-d" style={{ fontSize: '1.1rem', color: 'white' }}>{info.type}</span>
                      </div>
                      <p className="lp-d" style={{ fontSize: '1.6rem', color: '#8B0000', lineHeight: 1 }}>{info.type}</p>
                    </div>
                    <button onClick={() => setSelectedBlood(null)} style={{ background: '#fdf0ee', border: '1px solid #f0d5d0', borderRadius: 8, padding: '4px 11px', fontSize: '11px', color: '#8B0000', fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>✕ Close</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div style={{ background: '#fff5f5', borderRadius: 10, padding: '12px 14px', border: '1px solid #f5ddd8' }}>
                      <p style={{ fontSize: '10px', fontWeight: 700, color: '#c0392b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>🩸 Can Donate To</p>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#1a0505' }}>{info.donateTo}</p>
                    </div>
                    <div style={{ background: '#f0faf4', borderRadius: 10, padding: '12px 14px', border: '1px solid #c8ead5' }}>
                      <p style={{ fontSize: '10px', fontWeight: 700, color: '#1a7a3a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>💉 Can Receive From</p>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#1a0505' }}>{info.receiveFrom}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, maxWidth: 640, margin: '16px auto 0' }} className="sm:grid-cols-8">
              {BLOOD_TYPES.map(b => (
                <button key={b.type} className={`blood-card${selectedBlood === b.type ? ' sel' : ''}`} onClick={() => setSelectedBlood(p => p === b.type ? null : b.type)} aria-pressed={selectedBlood === b.type}>
                  <span className="blood-type-lbl" style={{ fontSize: '1.4rem', color: b.color }}>{b.type}</span>
                  <span className="blood-sub">{selectedBlood === b.type ? '▲' : 'Tap'}</span>
                  {selectedBlood === b.type && <div style={{ position: 'absolute', top: 5, right: 5, width: 7, height: 7, borderRadius: '50%', background: '#8B0000' }} />}
                </button>
              ))}
            </div>
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#9a8a82', marginTop: 14 }}>
              <a href="/compatibility.html" style={{ color: '#8B0000', fontWeight: 700, textDecoration: 'none' }}>View Full Compatibility Chart →</a>
            </p>
          </div>
        </section>

        {/* ══════════════════ ELIGIBILITY CHECKER ══════════════════ */}
        <section className="lp-section-white" style={{ padding: '64px 0', background: 'white' }}>
          <div className="container mx-auto px-4" style={{ maxWidth: 700 }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div className="ey">Donor Tool</div>
              <h2 className="lp-d lp-st" style={{ fontSize: '2.5rem', color: '#1a0505', lineHeight: 1.15 }}>Next Donation <span style={{ color: '#8B0000' }}>Eligibility</span></h2>
              <p style={{ fontSize: '13px', color: '#7a6868', marginTop: 8 }}>When Can I Donate Again?</p>
            </div>
            <div className="lp-eli-card" style={{ background: 'white', borderRadius: 20, border: '1.5px solid #f0e5e2', boxShadow: '0 10px 40px rgba(139,0,0,0.08)', padding: '28px 24px' }}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ marginBottom: 14 }}>
                <div>
                  <label className="fl">Last Donation Date</label>
                  <input type="date" className="fi sel-arrow" value={eliForm.lastDate} onChange={e => { setEliForm(f => ({ ...f, lastDate: e.target.value })); setEliResult(null); setEliError(''); }} max={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label className="fl">Gender</label>
                  <select className="fi sel-arrow" value={eliForm.gender} onChange={e => { setEliForm(f => ({ ...f, gender: e.target.value })); setEliResult(null); }}>
                    <option>Male</option><option>Female</option>
                  </select>
                </div>
                <div>
                  <label className="fl">Blood Component</label>
                  <select className="fi sel-arrow" value={eliForm.component} onChange={e => { setEliForm(f => ({ ...f, component: e.target.value })); setEliResult(null); }}>
                    <option>Whole Blood</option><option>Platelets</option>
                    <option>Plasma</option><option>Double Red Cells</option>
                  </select>
                </div>
              </div>
              {eliError && <p style={{ color: '#c0392b', fontSize: '12px', marginBottom: 10 }}>{eliError}</p>}
              <button onClick={checkEligibility} className="btn-p" style={{ width: '100%', padding: '12px' }}>Check Eligibility</button>
              {eliResult && (
                <div style={{ marginTop: 16, background: eliResult.startsWith('✅') ? '#f0faf4' : '#fff8f5', border: `1.5px solid ${eliResult.startsWith('✅') ? '#c8ead5' : '#f0d5ca'}`, borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ fontSize: '1.4rem', flexShrink: 0 }}>{eliResult.startsWith('✅') ? '✅' : '📅'}</div>
                  <div>
                    <p style={{ fontWeight: 700, color: '#1a0505', fontSize: '14px', marginBottom: 3 }}>
                      {eliResult.startsWith('✅') ? 'Eligible to donate now!' : 'Not yet eligible'}
                    </p>
                    <p style={{ fontSize: '13px', color: '#5a6a52', fontWeight: 500 }}>{eliResult.replace('✅ ', '').replace('📅 ', '')}</p>
                    <p style={{ fontSize: '11px', color: '#9a8a82', marginTop: 4 }}>
                      Based on NACO guidelines · <strong>{eliForm.component}</strong> · {ELIGIBILITY_RULES[eliForm.component]?.[eliForm.gender]}-day interval
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ══════════════════ LEADERBOARD ══════════════════ */}
        <section className="lp-section-cream" style={{ padding: '64px 0', background: '#fdf8f6' }}>
          <div className="container mx-auto px-4" style={{ maxWidth: 700 }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div className="ey">Community</div>
              <h2 className="lp-d lp-st" style={{ fontSize: '2.5rem', color: '#1a0505', lineHeight: 1.15 }}>Donor <span style={{ color: '#8B0000' }}>Leaderboard</span></h2>
              <p style={{ fontSize: '13px', color: '#7a6868', marginTop: 8 }}>Recognising India's most dedicated life-savers</p>
            </div>
            <div className="lp-leaderboard" style={{ background: 'white', borderRadius: 20, border: '1.5px solid #f0e5e2', boxShadow: '0 10px 40px rgba(139,0,0,0.07)', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(100deg,#6b0000,#8B0000)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trophy size={17} color="rgba(255,230,180,0.9)" />
                <span style={{ color: 'white', fontWeight: 700, fontSize: '0.88rem', letterSpacing: '0.05em' }}>TOP DONORS — THIS MONTH</span>
                <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.8)', fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: 999, letterSpacing: '0.1em' }}>LIVE</span>
              </div>
              <div style={{ padding: '8px 10px' }}>
                {LEADERBOARD.map(donor => {
                  const bColors: Record<string, { bg: string; c: string }> = { Platinum: { bg: '#e8f4fd', c: '#1a5c8a' }, Gold: { bg: '#fef9ec', c: '#8a5c00' }, Silver: { bg: '#f5f5f5', c: '#5a5a5a' }, Bronze: { bg: '#fdf2ec', c: '#7a4020' } };
                  const rColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
                  const bc = bColors[donor.badge] || bColors.Bronze;
                  return (
                    <div key={donor.rank} className="lb-row">
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: donor.rank <= 3 ? rColors[donor.rank - 1] : '#f5f0ee', color: donor.rank <= 3 ? '#1a0505' : '#8a7070', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                        {donor.rank <= 3 ? ['🥇', '🥈', '🥉'][donor.rank - 1] : `#${donor.rank}`}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1a0505' }}>{donor.name}</span>
                          <span style={{ fontSize: '10px', fontWeight: 700, background: bc.bg, color: bc.c, padding: '2px 7px', borderRadius: 999 }}>{donor.badge}</span>
                          <span style={{ fontSize: '10px', fontWeight: 700, background: '#fff0ee', color: '#8B0000', padding: '2px 7px', borderRadius: 999 }}>{donor.bloodType}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#9a8a82', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={10} />{donor.city}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div className="lp-d" style={{ fontSize: '1.3rem', color: '#8B0000', lineHeight: 1 }}>{donor.donations}</div>
                        <div style={{ fontSize: '10px', color: '#9a8a82' }}>donations</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ borderTop: '1px solid #f5eee8', padding: '12px 20px', textAlign: 'center' }}>
                <button onClick={onDonorSignupClick} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8B0000', fontSize: '13px', fontWeight: 700, fontFamily: "'Plus Jakarta Sans',sans-serif", display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  Join the leaderboard — Register as Donor <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════ ROLE SELECTION ══════════════════ */}
        <section className="lp-section-white" style={{ padding: '64px 0', background: 'white' }}>
          <div className="container mx-auto px-4">
            <div className="lp-role-wrap" style={{ background: 'white', borderRadius: 22, border: '1px solid #f0e5e2', boxShadow: '0 18px 55px rgba(139,0,0,0.08)', overflow: 'hidden' }}>
              <div style={{ background: 'linear-gradient(100deg,#6b0000,#8B0000)', padding: '36px 28px', textAlign: 'center' }}>
                <div className="ey" style={{ color: 'rgba(255,210,200,0.75)' }}>
                  <span style={{ background: 'rgba(255,210,200,0.35)', width: 22, height: 1, display: 'block' }} />Choose Your Role<span style={{ background: 'rgba(255,210,200,0.35)', width: 22, height: 1, display: 'block' }} />
                </div>
                <h3 className="lp-d" style={{ fontSize: '2rem', color: 'white', marginTop: 8 }}>Log In or Sign Up</h3>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', marginTop: 5 }}>Select your role to access your personalised dashboard</p>
              </div>
              <div style={{ padding: '28px 24px' }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <RoleCard title="For Donors" desc="Donate blood and track your life-saving impact" icon={<UserPlus className="w-11 h-11" />} onClick={() => onRoleSelect('donor')} badge="Most Common" />
                  <RoleCard title="For Blood Banks" desc="Manage inventory, requests, and donor networks" icon={<Building2 className="w-11 h-11" />} onClick={() => onRoleSelect('bloodbank')} />
                  <RoleCard title="For Hospitals" desc="Manage inventory and coordinate transfusions" icon={<ClipboardList className="w-11 h-11" />} onClick={() => onRoleSelect('hospital')} />
                  <RoleCard title="Admin Login" desc="System administration and platform monitoring" icon={<Settings className="w-11 h-11" />} onClick={() => onRoleSelect('admin')} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════ WHY DONATE ══════════════════ */}
        <section style={{ background: '#1a0505', padding: '60px 0' }}>
          <div className="container mx-auto px-4">
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div className="ey" style={{ color: 'rgba(220,160,150,0.7)' }}>
                <span style={{ background: 'rgba(220,160,150,0.35)', width: 22, height: 1, display: 'block' }} />Did You Know?<span style={{ background: 'rgba(220,160,150,0.35)', width: 22, height: 1, display: 'block' }} />
              </div>
              <h2 className="lp-d" style={{ fontSize: '2.2rem', color: 'white', marginTop: 8 }}>
                Why Your Donation <span style={{ color: '#c0392b' }}>Matters</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {[
                { I: Heart, t: 'Every 2 Seconds', d: 'Someone in India needs a blood transfusion. One donation can save up to 3 lives.' },
                { I: Clock, t: 'Only 30 Minutes', d: 'The entire donation process takes less than half an hour — impact lasts a lifetime.' },
                { I: RefreshCw, t: 'Replenishes in 24 Hrs', d: 'Blood volume restores in a day; red cells rebuild within 4–6 weeks.' },
              ].map(f => (
                <div key={f.t} className="why-card">
                  <div className="why-icon-wrap"><f.I size={20} color="rgba(255,200,180,1)" strokeWidth={2.2} /></div>
                  <div>
                    <h4 style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', marginBottom: 5 }}>{f.t}</h4>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', lineHeight: 1.75 }}>{f.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ══════════════════ EMERGENCY MODAL ══════════════════ */}
      {emergencyOpen && (
        <div className="modal-bd" onClick={e => e.target === e.currentTarget && closeEmergency()}>
          <div className="modal-box">
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg,#8B0000,#c0392b)', padding: '20px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2 }}>🔴 Emergency Request</p>
                <h3 style={{ color: 'white', fontWeight: 800, fontSize: '1.2rem', fontFamily: "'Sora',sans-serif", letterSpacing: '-0.03em' }}>Request Emergency Blood</h3>
              </div>
              <button onClick={closeEmergency} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '22px' }}>
              {!emergencySubmitted ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ marginBottom: 12 }}>
                    <div>
                      <label className="fl">Patient Name *</label>
                      <input className="fi" placeholder="Full name" value={emergencyForm.patientName} onChange={e => setEmergencyForm(f => ({ ...f, patientName: e.target.value }))} />
                    </div>
                    <div>
                      <label className="fl">Blood Group *</label>
                      <select className="fi sel-arrow" value={emergencyForm.bloodGroup} onChange={e => setEmergencyForm(f => ({ ...f, bloodGroup: e.target.value }))}>
                        <option value="">Select Blood Group</option>
                        {['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'].map(bg => <option key={bg}>{bg}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="fl">Units Required</label>
                      <input className="fi" type="number" min="1" max="20" placeholder="e.g. 2" value={emergencyForm.units} onChange={e => setEmergencyForm(f => ({ ...f, units: e.target.value }))} />
                    </div>
                    <div>
                      <label className="fl">Hospital Name</label>
                      <input className="fi" placeholder="Hospital / Medical Centre" value={emergencyForm.hospital} onChange={e => setEmergencyForm(f => ({ ...f, hospital: e.target.value }))} />
                    </div>
                    <div>
                      <label className="fl">City *</label>
                      <input className="fi" placeholder="City" value={emergencyForm.city} onChange={e => setEmergencyForm(f => ({ ...f, city: e.target.value }))} />
                    </div>
                    <div>
                      <label className="fl">Contact Number</label>
                      <input className="fi" type="tel" placeholder="+91 XXXXX XXXXX" value={emergencyForm.contact} onChange={e => setEmergencyForm(f => ({ ...f, contact: e.target.value }))} />
                    </div>
                  </div>

                  {/* Urgency level */}
                  <div style={{ marginBottom: 16 }}>
                    <label className="fl">Urgency Level</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {['Critical', 'Urgent', 'Moderate'].map(lvl => (
                        <button key={lvl} onClick={() => setEmergencyForm(f => ({ ...f, urgency: lvl }))}
                          style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: `1.5px solid ${emergencyForm.urgency === lvl ? '#8B0000' : '#e0d0ca'}`, background: emergencyForm.urgency === lvl ? '#fff0ee' : 'white', color: emergencyForm.urgency === lvl ? '#8B0000' : '#5a4a42', fontWeight: emergencyForm.urgency === lvl ? 700 : 500, fontSize: '12.5px', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif", transition: 'all 0.18s' }}>
                          {lvl === 'Critical' ? '🔴' : lvl === 'Urgent' ? '🟠' : '🟡'} {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleEmergencySubmit}
                    disabled={submitting}
                    className="btn-p"
                    style={{ width: '100%', padding: '13px', fontSize: '14px' }}
                  >
                    {submitting ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                        Submitting &amp; Notifying…
                      </span>
                    ) : 'Submit Emergency Request'}
                  </button>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <p style={{ fontSize: '11px', color: '#9a8a82', textAlign: 'center', marginTop: 10 }}>
                    Nearby donors and blood banks will be notified immediately.
                  </p>
                </>
              ) : (
                /* Success screen */
                <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
                  <div style={{ width: 66, height: 66, borderRadius: '50%', background: '#f0faf4', border: '3px solid #4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.9rem' }}>✅</div>
                  <h4 style={{ fontWeight: 800, fontSize: '1.2rem', color: '#1a0505', marginBottom: 8, fontFamily: "'Sora',sans-serif" }}>Request Submitted!</h4>
                  <p style={{ fontSize: '13px', color: '#5a6a52', marginBottom: 18, lineHeight: 1.65 }}>
                    Nearby donors and blood banks in <strong>{emergencyForm.city}</strong> have been notified for <strong>{emergencyForm.bloodGroup || 'requested'}</strong> blood.
                  </p>

                  {/* RTID display */}
                  <div style={{ background: '#fdf8f6', border: '1.5px solid #f0d5ca', borderRadius: 14, padding: '16px 20px', marginBottom: 18 }}>
                    <p style={{ fontSize: '10px', fontWeight: 700, color: '#9a8a82', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 6 }}>Your RaktPort RTID</p>
                    <p style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.25rem', color: '#8B0000', letterSpacing: '0.05em', wordBreak: 'break-all' }}>{generatedRTID}</p>
                    <p style={{ fontSize: '11px', color: '#9a8a82', marginTop: 5 }}>Use this to track your blood request status in the RTID Tracker</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18, textAlign: 'left' }}>
                    {['Nearby donors notified via SMS & app', 'Partner blood banks alerted', 'Emergency response team activated'].map(a => (
                      <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '12.5px', color: '#1a7a3a', fontWeight: 500 }}>
                        <CheckCircle2 size={14} color="#4ade80" /> {a}
                      </div>
                    ))}
                  </div>
                  <button onClick={closeEmergency} style={{ background: '#8B0000', color: 'white', border: 'none', borderRadius: 10, padding: '11px 32px', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Service Card ─── */
function SvcCard({ icon, title, desc, href, onClick }: { icon: React.ReactNode; title: string; desc: string; href?: string; onClick?: () => void; }) {
  const inner = (
    <div className="svc-card">
      <div className="svc-icon">{icon}</div>
      <h3 className="svc-title" style={{ fontWeight: 700, color: '#1a0505', fontSize: '0.88rem', marginBottom: 6, lineHeight: 1.3 }}>{title}</h3>
      <p className="svc-desc" style={{ fontSize: '11.5px', color: '#7a6868', lineHeight: 1.65 }}>{desc}</p>
    </div>
  );
  if (href) { const ext = href.startsWith('http'); return <a href={href} target={ext ? '_blank' : '_self'} rel={ext ? 'noopener noreferrer' : undefined} style={{ display: 'block', height: '100%', textDecoration: 'none' }}>{inner}</a>; }
  if (onClick) return <button onClick={onClick} style={{ display: 'block', height: '100%', width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>{inner}</button>;
  return inner;
}

/* ─── Role Card ─── */
function RoleCard({ title, desc, icon, onClick, badge }: { title: string; desc: string; icon: React.ReactNode; onClick: () => void; badge?: string; }) {
  return (
    <button onClick={onClick} className="role-card">
      {badge && <span style={{ position: 'absolute', top: 10, right: 10, fontSize: '9px', fontWeight: 700, background: '#fff0ee', color: '#8B0000', border: '1px solid #f0d0ca', padding: '2px 8px', borderRadius: 999, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{badge}</span>}
      <div className="role-icon">{icon}</div>
      <h4 className="role-title" style={{ fontWeight: 700, color: '#1a0505', fontSize: '0.95rem', marginBottom: 6, lineHeight: 1.2 }}>{title}</h4>
      <p className="role-desc" style={{ fontSize: '11.5px', color: '#7a6868', lineHeight: 1.65 }}>{desc}</p>
    </button>
  );
}