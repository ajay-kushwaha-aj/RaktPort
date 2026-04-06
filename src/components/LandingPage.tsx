// src/components/LandingPage.tsx
// RaktPort — Landing Page v4 FINAL
// Full dark-mode, mobile-first, real leaderboard, all illustrations visible everywhere.

import * as React from 'react';
import {
  Search, Heart, Users, FileText, Calendar, UserPlus,
  ShieldCheck, Clock, RefreshCw, X, ChevronRight,
  Droplets, Trophy, AlertCircle, CheckCircle2, MapPin,
  ArrowRight, Activity, Zap, ChevronLeft,
} from 'lucide-react';
import Autoplay from 'embla-carousel-autoplay';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import bannerImage1 from '../assets/one.png';
import bannerImage2 from '../assets/two.png';
import bannerImage3 from '../assets/three.png';
import bannerImage4 from '../assets/four.png';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/* ─── Types ─── */
interface LandingPageProps { onRoleSelect: (role: string) => void; onDonorSignupClick: () => void; }
interface EmergencyRecord {
  rtid: string; patientName: string; bloodGroup: string; units: string;
  hospital: string; city: string; contact: string; urgency: string;
  timestamp: string; status: 'Active' | 'Fulfilled' | 'Cancelled';
}

/* ─── Data ─── */
const BLOOD_TYPES = [
  { type: 'A+', donateTo: 'A+, AB+', receiveFrom: 'A+, A−, O+, O−' },
  { type: 'A−', donateTo: 'A+, A−, AB+, AB−', receiveFrom: 'A−, O−' },
  { type: 'B+', donateTo: 'B+, AB+', receiveFrom: 'B+, B−, O+, O−' },
  { type: 'B−', donateTo: 'B+, B−, AB+, AB−', receiveFrom: 'B−, O−' },
  { type: 'AB+', donateTo: 'AB+ only', receiveFrom: 'All blood types' },
  { type: 'AB−', donateTo: 'AB+, AB−', receiveFrom: 'AB−, A−, B−, O−' },
  { type: 'O+', donateTo: 'A+, B+, O+, AB+', receiveFrom: 'O+, O−' },
  { type: 'O−', donateTo: 'All blood types', receiveFrom: 'O− only' },
];

const LEADERBOARD = [
  { rank: 1, name: 'Arjun Sharma', city: 'Mumbai', state: 'Maharashtra', hospital: 'Tata Memorial Hospital', donations: 48, badge: 'Platinum', bloodType: 'O+', last: '2 days ago', verified: true, streak: 12, impact: 144, initials: 'AS' },
  { rank: 2, name: 'Priya Nair', city: 'Chennai', state: 'Tamil Nadu', hospital: 'Apollo Hospitals', donations: 41, badge: 'Gold', bloodType: 'A+', last: '5 days ago', verified: true, streak: 8, impact: 123, initials: 'PN' },
  { rank: 3, name: 'Rohit Verma', city: 'Delhi', state: 'Delhi NCR', hospital: 'AIIMS New Delhi', donations: 37, badge: 'Gold', bloodType: 'B+', last: '1 week ago', verified: true, streak: 6, impact: 111, initials: 'RV' },
  { rank: 4, name: 'Sneha Patel', city: 'Ahmedabad', state: 'Gujarat', hospital: 'Civil Hospital GMERS', donations: 32, badge: 'Silver', bloodType: 'AB+', last: '10 days ago', verified: true, streak: 5, impact: 96, initials: 'SP' },
  { rank: 5, name: 'Kiran Rao', city: 'Hyderabad', state: 'Telangana', hospital: 'NIMS Hospital', donations: 29, badge: 'Silver', bloodType: 'O−', last: '2 weeks ago', verified: true, streak: 4, impact: 87, initials: 'KR' },
  { rank: 6, name: 'Meena Das', city: 'Kolkata', state: 'West Bengal', hospital: 'SSKM Hospital', donations: 24, badge: 'Bronze', bloodType: 'A−', last: '3 weeks ago', verified: false, streak: 3, impact: 72, initials: 'MD' },
  { rank: 7, name: 'Amit Singh', city: 'Pune', state: 'Maharashtra', hospital: 'Sassoon General Hospital', donations: 21, badge: 'Bronze', bloodType: 'B−', last: '1 month ago', verified: false, streak: 2, impact: 63, initials: 'AS' },
  { rank: 8, name: 'Deepa Krishnan', city: 'Bengaluru', state: 'Karnataka', hospital: 'Victoria Hospital', donations: 18, badge: 'Bronze', bloodType: 'O+', last: '5 weeks ago', verified: true, streak: 2, impact: 54, initials: 'DK' },
  { rank: 9, name: 'Suresh Gupta', city: 'Jaipur', state: 'Rajasthan', hospital: 'SMS Medical College', donations: 15, badge: 'Member', bloodType: 'A+', last: '2 months ago', verified: false, streak: 1, impact: 45, initials: 'SG' },
  { rank: 10, name: 'Ananya Iyer', city: 'Coimbatore', state: 'Tamil Nadu', hospital: 'PSG Hospitals', donations: 12, badge: 'Member', bloodType: 'B+', last: '2 months ago', verified: true, streak: 1, impact: 36, initials: 'AI' },
];

/* Stories of Hope data */
const STORIES = [
  { name: 'Arjun Sharma', city: 'Mumbai', initials: 'AS', donations: 48, quote: 'Donating blood through RaktPort has been incredibly fulfilling. The platform makes it so easy, and knowing my blood saved lives is the best reward.' },
  { name: 'Priya Nair', city: 'Chennai', initials: 'PN', donations: 41, quote: 'The transparency and tracking system is amazing. I can see exactly where my donation goes and the impact it creates.' },
  { name: 'Rohit Verma', city: 'Delhi', initials: 'RV', donations: 37, quote: 'RaktPort helped me find blood for my father during an emergency. The response was immediate and professional. Truly life-saving!' },
  { name: 'Sneha Patel', city: 'Ahmedabad', initials: 'SP', donations: 32, quote: 'As a regular donor, RaktPort keeps me connected with camps near me. The reminders and health tracking make donating seamless.' },
  { name: 'Kiran Rao', city: 'Hyderabad', initials: 'KR', donations: 29, quote: 'My son needed platelets urgently. RaktPort connected us with 3 compatible donors within an hour. Forever grateful!' },
  { name: 'Meena Das', city: 'Kolkata', initials: 'MD', donations: 24, quote: 'I started donating after seeing the impact dashboard. Knowing each donation helps 3 lives keeps me motivated to continue.' },
];

const BADGE_MAP: { [k: string]: { bg: string; text: string; border: string } } = {
  Platinum: { bg: '#e8f4fd', text: '#1a5c8a', border: '#b8d8f0' },
  Gold: { bg: '#fef9ec', text: '#8a5c00', border: '#f0d880' },
  Silver: { bg: '#f5f5f5', text: '#5a5a5a', border: '#d0d0d0' },
  Bronze: { bg: '#fdf2ec', text: '#7a4020', border: '#e0c0a0' },
  Member: { bg: '#f0f0ff', text: '#4040a0', border: '#c0c0e0' },
};

const ELI_RULES: { [k: string]: { [g: string]: number } } = {
  'Whole Blood': { Male: 90, Female: 90 }, 'Platelets': { Male: 14, Female: 14 },
  'Plasma': { Male: 28, Female: 28 }, 'Double Red Cells': { Male: 112, Female: 112 },
};
const RTID_STEPS = ['Collected', 'Lab Testing', 'Separation', 'Blood Bank', 'Issued', 'Transfused'];
const DB_KEY = 'rp_emergency_requests';

/* ─── Utils ─── */
function genRTID(t: 'D' | 'H' = 'H') {
  const n = new Date(), dd = String(n.getDate()).padStart(2, '0'), mm = String(n.getMonth() + 1).padStart(2, '0'), yy = String(n.getFullYear()).slice(2);
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ', al = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = a[Math.floor(Math.random() * a.length)];
  for (let i = 0; i < 4; i++)c += al[Math.floor(Math.random() * al.length)];
  return `${t}-RTID-${dd}${mm}${yy}-${c}`;
}
function isValidRTID(s: string) { return /^[DH]-RTID-\d{6}-[A-Z0-9]{5}$/i.test(s.trim()); }
async function submitDB(data: Omit<EmergencyRecord, 'rtid' | 'timestamp' | 'status'>): Promise<string> {
  await new Promise(r => setTimeout(r, 1400));
  const rtid = genRTID('H'), record: EmergencyRecord = { ...data, rtid, timestamp: new Date().toISOString(), status: 'Active' };
  try { const ex: EmergencyRecord[] = JSON.parse(localStorage.getItem(DB_KEY) || '[]'); ex.push(record); localStorage.setItem(DB_KEY, JSON.stringify(ex)); } catch { }
  return rtid;
}

function addDays(d: Date, days: number) { const r = new Date(d); r.setDate(r.getDate() + days); return r; }
function fmtDate(d: Date) { return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }); }

/* ─── Hooks ─── */
function useCounter(target: number, dur = 1800): number {
  const [v, setV] = React.useState(0);
  React.useEffect(() => { let c = 0; const s = Math.ceil(target / (dur / 16)); const id = setInterval(() => { c = Math.min(c + s, target); setV(c); if (c >= target) clearInterval(id); }, 16); return () => clearInterval(id); }, [target, dur]);
  React.useEffect(() => { const id = setInterval(() => setV(n => n + Math.floor(Math.random() * 2 + 1)), 4200); return () => clearInterval(id); }, []);
  return v;
}
function useReveal(thr = 0.07) {
  const ref = React.useRef<HTMLElement>(null);
  React.useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('lp-vis'); obs.unobserve(el); } }, { threshold: thr });
    obs.observe(el); return () => obs.disconnect();
  }, [thr]);
  return ref as React.RefObject<any>;
}

/* ═══ SVG ILLUSTRATIONS ═══ */


function BloodBagSVG() {
  return (
    <svg viewBox="0 0 260 300" fill="none" className="lp-ill" aria-hidden="true">
      <defs>
        <linearGradient id="bbg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(196,30,58,0.22)" /><stop offset="100%" stopColor="rgba(196,30,58,0.07)" />
        </linearGradient>
      </defs>
      <circle cx="130" cy="148" r="102" fill="rgba(196,30,58,0.06)" />
      <circle cx="130" cy="148" r="76" fill="none" stroke="rgba(196,30,58,0.1)" strokeWidth="1.5" strokeDasharray="6 4" />
      <rect x="72" y="55" width="116" height="132" rx="18" fill="url(#bbg)" stroke="rgba(196,30,58,0.32)" strokeWidth="2" />
      <rect x="76" y="108" width="108" height="77" rx="14" fill="rgba(196,30,58,0.25)" />
      <rect x="96" y="40" width="68" height="19" rx="6" fill="rgba(196,30,58,0.18)" stroke="rgba(196,30,58,0.28)" strokeWidth="1.5" />
      <rect x="122" y="26" width="16" height="18" rx="4" fill="rgba(196,30,58,0.28)" />
      <rect x="128" y="17" width="4" height="13" rx="2" fill="rgba(196,30,58,0.45)" />
      <rect x="112" y="138" width="36" height="7" rx="3.5" fill="rgba(196,30,58,0.68)" />
      <rect x="127" y="123" width="7" height="36" rx="3.5" fill="rgba(196,30,58,0.68)" />
      <path d="M130 187 Q130 210 112 224 Q100 234 100 250" stroke="rgba(196,30,58,0.42)" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M100 250 C100 250 94 258 94 263A6 6 0 0 0 106 263C106 258 100 250 100 250Z" fill="#C41E3A" opacity="0.55" />
      <circle cx="42" cy="78" r="13" fill="none" stroke="rgba(196,30,58,0.11)" strokeWidth="1.5" strokeDasharray="4 3" />
      <circle cx="218" cy="214" r="17" fill="none" stroke="rgba(196,30,58,0.09)" strokeWidth="1.5" strokeDasharray="4 3" />
      <circle cx="208" cy="55" r="11" fill="rgba(196,30,58,0.06)" />
      <circle cx="48" cy="232" r="15" fill="rgba(196,30,58,0.05)" />
    </svg>
  );
}

function NetworkSVG() {
  return (
    <svg viewBox="0 0 280 185" fill="none" className="lp-ill" aria-hidden="true">
      {[{ x: 46, y: 44 }, { x: 234, y: 44 }, { x: 46, y: 148 }, { x: 234, y: 148 }, { x: 140, y: 18 }].map((n, i) => (
        <line key={i} x1="140" y1="96" x2={n.x} y2={n.y} stroke="rgba(196,30,58,0.22)" strokeWidth="1.5" strokeDasharray="5 3" />
      ))}
      <circle cx="140" cy="96" r="28" fill="rgba(196,30,58,0.18)" stroke="#C41E3A" strokeWidth="2" />
      <path d="M 140,84 C 140,84 130,98 130,103 A 10,10 0 0,0 150,103 C 150,98 140,84 140,84 Z" fill="#E8294A" />
      {[{ cx: 46, cy: 44, icon: '🏥' }, { cx: 234, cy: 44, icon: '🏨' }, { cx: 46, cy: 148, icon: '👤' }, { cx: 234, cy: 148, icon: '👤' }, { cx: 140, cy: 18, icon: '🧪' }].map((n, i) => (
        <g key={i}><circle cx={n.cx} cy={n.cy} r="20" fill="rgba(196,30,58,0.1)" stroke="rgba(196,30,58,0.28)" strokeWidth="1.5" />
          <text x={n.cx} y={n.cy + 6} textAnchor="middle" fontSize="14">{n.icon}</text></g>
      ))}
      <circle cx="140" cy="96" r="46" fill="none" stroke="rgba(196,30,58,0.09)" strokeWidth="1" strokeDasharray="5 4" />
    </svg>
  );
}

function CalendarSVG() {
  return (
    <svg viewBox="0 0 260 188" fill="none" className="lp-ill" aria-hidden="true">
      <circle cx="130" cy="94" r="76" fill="rgba(196,30,58,0.05)" />
      <circle cx="130" cy="94" r="55" fill="none" stroke="rgba(196,30,58,0.09)" strokeWidth="1.5" strokeDasharray="6 4" />
      <rect x="88" y="62" width="84" height="66" rx="10" fill="white" stroke="rgba(196,30,58,0.22)" strokeWidth="1.5" />
      <rect x="88" y="62" width="84" height="20" rx="10" fill="rgba(196,30,58,0.12)" />
      <rect x="109" y="52" width="9" height="16" rx="4.5" fill="rgba(196,30,58,0.42)" />
      <rect x="142" y="52" width="9" height="16" rx="4.5" fill="rgba(196,30,58,0.42)" />
      <line x1="88" y1="97" x2="172" y2="97" stroke="rgba(196,30,58,0.08)" strokeWidth="1" />
      {[{ x: 104, y: 111 }, { x: 120, y: 111 }, { x: 136, y: 111 }, { x: 152, y: 111 }, { x: 168, y: 111 }, { x: 104, y: 124 }, { x: 120, y: 124 }].map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r="5" fill={i === 0 ? 'rgba(196,30,58,0.5)' : 'rgba(196,30,58,0.12)'} />
      ))}
      <circle cx="200" cy="155" r="20" fill="rgba(16,185,129,0.12)" stroke="rgba(16,185,129,0.32)" strokeWidth="1.5" />
      <path d="M193 155l5 5 10-10" stroke="rgba(16,185,129,0.85)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="65" cy="65" r="11" fill="rgba(196,30,58,0.05)" />
      <circle cx="210" cy="65" r="7" fill="rgba(196,30,58,0.05)" />
    </svg>
  );
}

function EcgLine({ id, opacity = 0.4 }: { id: string; opacity?: number }) {
  const p = "M0,25 L65,25 L82,8 L96,44 L110,4 L124,46 L138,10 L152,25 L270,25 L287,8 L301,44 L315,4 L329,46 L343,10 L357,25 L475,25 L492,8 L506,44 L520,4 L534,46 L548,10 L562,25 L680,25";
  return (
    <svg viewBox="0 0 680 50" preserveAspectRatio="none" className="lp-ecg" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={`rgba(196,30,58,0)`} />
          <stop offset="25%" stopColor={`rgba(196,30,58,${opacity})`} />
          <stop offset="75%" stopColor={`rgba(196,30,58,${opacity})`} />
          <stop offset="100%" stopColor={`rgba(196,30,58,0)`} />
        </linearGradient>
      </defs>
      <path d="M0,25 L680,25" stroke={`rgba(196,30,58,${opacity * 0.25})`} strokeWidth="0.6" fill="none" />
      <path d={p} stroke={`url(#${id})`} strokeWidth="1.8" fill="none" strokeLinecap="round" className="lp-ecg-path" />
    </svg>
  );
}

/* ─── Service Card helper ─── */
function SvcCard({ svg, title, desc, href, onClick }: { svg: React.ReactNode; title: string; desc: string; href?: string; onClick?: () => void }) {
  const inner = (
    <div className="lp-svc">
      <div className="lp-svc-ico" aria-hidden="true">{svg}</div>
      <h3 className="lp-svc-t">{title}</h3>
      <p className="lp-svc-d">{desc}</p>
      <span className="lp-svc-arr"><ArrowRight size={13} /></span>
    </div>
  );
  if (href) { const ext = href.startsWith('http'); return <a href={href} target={ext ? '_blank' : '_self'} rel={ext ? 'noopener noreferrer' : undefined} style={{ textDecoration: 'none', display: 'block' }}>{inner}</a>; }
  if (onClick) return <button onClick={onClick} style={{ all: 'unset', cursor: 'pointer', display: 'block', width: '100%' }}>{inner}</button>;
  return inner;
}

/* ═══ MAIN COMPONENT ═══ */
export function LandingPage({ onRoleSelect, onDonorSignupClick }: LandingPageProps) {
  const ap = React.useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));
  const [api, setApi] = React.useState<CarouselApi>();
  const [slide, setSlide] = React.useState(0);
  const BANNERS = [bannerImage1, bannerImage2, bannerImage3, bannerImage4];
  React.useEffect(() => { if (!api) return; const fn = () => setSlide(api.selectedScrollSnap()); fn(); api.on('select', fn); return () => { api.off('select', fn); }; }, [api]);

  const [selBlood, setSelBlood] = React.useState<string | null>(null);
  const [emergOpen, setEmergOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [eForm, setEForm] = React.useState({ patientName: '', bloodGroup: '', units: '', hospital: '', city: '', contact: '', urgency: 'Critical' });
  const [eDone, setEDone] = React.useState(false);
  const [eRTID, setERTID] = React.useState('');
  const handleSubmit = async () => { if (!eForm.patientName || !eForm.bloodGroup || !eForm.city) return; setSubmitting(true); try { const r = await submitDB(eForm); setERTID(r); setEDone(true); } finally { setSubmitting(false); } };
  const closeEmerg = () => { setEmergOpen(false); setEDone(false); setERTID(''); setEForm({ patientName: '', bloodGroup: '', units: '', hospital: '', city: '', contact: '', urgency: 'Critical' }); };

  const [rtidIn, setRtidIn] = React.useState('');
  const [rtidRes, setRtidRes] = React.useState<{ current: number; record?: EmergencyRecord | any } | null>(null);
  const [rtidErr, setRtidErr] = React.useState('');

  const track = async () => {
    const v = rtidIn.trim().toUpperCase();
    if (!v) { setRtidErr('Please enter an RTID.'); return; }
    if (!isValidRTID(v)) { setRtidErr('Format: D-RTID-DDMMYY-AXXXX  e.g. D-RTID-060426-A4F7K'); return; }
    setRtidErr('');
    setRtidRes(null);

    try {
      let current = 0;
      let foundRef: any = null;
      let details: any = null;

      if (v.startsWith('D-RTID')) {
        let snap = await getDocs(query(collection(db, 'donations'), where('rtidCode', '==', v)));
        if (!snap.empty) foundRef = snap.docs[0].data();
        else {
          snap = await getDocs(query(collection(db, 'donations'), where('dRtid', '==', v)));
          if (!snap.empty) foundRef = snap.docs[0].data();
        }

        if (foundRef) {
          const st = (foundRef.rtidStatus || foundRef.status || '').toUpperCase();
          if (['SCHEDULED', 'PENDING'].includes(st)) current = 0;
          else if (st === 'DONATED') current = 1;
          else if (['VERIFIED', 'CREDITED'].includes(st)) current = 2;
          else if (['REDEEMED', 'COMPLETED', 'REDEEMED-CREDIT'].includes(st)) current = 4;
          else if (['ADMINISTERED', 'PARTIALLY ADMINISTERED'].includes(st)) current = 6;
          else current = 1;

          if (foundRef.linkedHrtid && foundRef.linkedHrtid !== 'N/A') {
            const hSnap = await getDocs(query(collection(db, 'bloodRequests'), where('rtid', '==', foundRef.linkedHrtid)));
            if (!hSnap.empty) {
              const hData = hSnap.docs[0].data();
              details = { patientName: hData.patientName, bloodGroup: hData.bloodGroup };
              const hst = (hData.status || '').toUpperCase();
              if (hst === 'CLOSED' || hst === 'ADMINISTERED') current = 6;
              else if (hst === 'PARTIALLY ADMINISTERED') current = 5;
            } else {
              details = { patientName: 'Processing at Blood Bank', bloodGroup: foundRef.bloodGroup || foundRef.component || 'Unknown' };
            }
          } else {
            details = { patientName: 'Awaiting Hospital Assignment', bloodGroup: foundRef.bloodGroup || foundRef.component || 'Unknown' };
          }
        }
      } else {
        let snap = await getDocs(query(collection(db, 'bloodRequests'), where('rtid', '==', v)));
        if (!snap.empty) foundRef = snap.docs[0].data();
        else {
          snap = await getDocs(query(collection(db, 'bloodRequests'), where('linkedRTID', '==', v)));
          if (!snap.empty) foundRef = snap.docs[0].data();
        }

        if (foundRef) {
          const st = (foundRef.status || '').toUpperCase();
          if (['CREATED', 'PENDING'].includes(st)) current = 1;
          else if (st === 'PARTIAL' || st === 'PLEDGED' || st === 'PROCESSING') current = 3;
          else if (['REDEEMED', 'HOSPITAL VERIFIED'].includes(st)) current = 4;
          else if (st === 'PARTIALLY ADMINISTERED') current = 5;
          else if (st === 'CLOSED' || st === 'ADMINISTERED') current = 6;
          else current = 1;

          details = { patientName: foundRef.patientName, bloodGroup: foundRef.bloodGroup };
        }
      }

      if (foundRef) {
        setRtidRes({ current: Math.max(1, Math.min(current, 6)), record: details });
      } else {
        setRtidErr('No real-time record found for this RTID.');
      }
    } catch (err) {
      console.error(err);
      setRtidErr('Failed to fetch tracking data. Please try again.');
    }
  };

  const [eliF, setEliF] = React.useState({ lastDate: '', gender: 'Male', component: 'Whole Blood' });
  const [eliRes, setEliRes] = React.useState<string | null>(null);
  const [eliErr, setEliErr] = React.useState('');
  const checkEli = () => { if (!eliF.lastDate) { setEliErr('Please select your last donation date.'); return; } setEliErr(''); const days = ELI_RULES[eliF.component]?.[eliF.gender] ?? 90; const next = addDays(new Date(eliF.lastDate), days); setEliRes(next <= new Date() ? `ok:You are eligible — the ${days}-day interval has passed.` : `wait:Next eligible date: ${fmtDate(next)}`); };

  const cnt1 = useCounter(100), cnt2 = useCounter(2540), cnt3 = useCounter(37), cnt4 = useCounter(849);

  const r0 = useReveal(), r1 = useReveal(), r2 = useReveal(), r3 = useReveal(), r4 = useReveal();
  const r5 = useReveal(), r6 = useReveal(), r7 = useReveal(), r8 = useReveal(), r9 = useReveal(), r10 = useReveal();

  return (
    <>
      <LpStyles />
      <div className="lp" id="main-content">

        {/* ══ HERO ══ */}
        <section className="lp-hero">
          <div className="lp-orb o1" /><div className="lp-orb o2" /><div className="lp-orb o3" />
          {/* Strict two-column: carousel fills full left height, panel right */}
          <div className="lp-hero-grid">
            <div className="lp-car">
              <Carousel opts={{ loop: true }} plugins={[ap.current]} setApi={setApi}>
                <CarouselContent className="ml-0">
                  {BANNERS.map((src, i) => (
                    <CarouselItem key={i} className="p-0">
                      <div className="lp-slide">
                        <img src={src} alt={`RaktPort banner ${i + 1}`} className="lp-slide-img" />
                        <div className="lp-slide-ov" />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
              <div className="lp-dots" aria-hidden="true">
                {BANNERS.map((_, i) => <button key={i} className={`lp-dot${i === slide ? ' on' : ''}`} onClick={() => api?.scrollTo(i)} aria-label={`Slide ${i + 1}`} />)}
              </div>
            </div>

            <div className="lp-panel">
              <span className="lp-badge"><span className="lp-bdot" />India's National Blood Network</span>
              <h1 className="lp-h1">Donate Blood.<br /><span className="lp-red">Save Lives.</span><br />Change India.</h1>
              <p className="lp-panel-p">Real-time blood access connecting donors, hospitals and blood banks nationwide — powered by RTID technology.</p>
              <div className="lp-panel-btns">
                <button className="lp-btn" onClick={onDonorSignupClick}><Droplets size={15} /> Become a Donor</button>
                <button className="lp-btn-s" onClick={() => setEmergOpen(true)}><Zap size={14} /> Emergency Request</button>
              </div>

              <div className="lp-comp-row">
                {['NACO Compliant', 'MoHFW Verified', 'NDHM Integrated'].map(c => (
                  <span key={c} className="lp-comp-tag"><CheckCircle2 size={10} /> {c}</span>
                ))}
              </div>
            </div>
          </div>
          <EcgLine id="h-ecg" opacity={0.5} />
        </section>

        {/* Live stats removed per user request */}
        {/* ══ SERVICES ══ */}
        <section className="lp-sec lp-light" ref={r1}>
          <div className="lp-c">
            <div className="lp-sh"><p className="lp-ey lp-eyr">What We Offer</p>
              <h2 className="lp-h2 lp-h2d">Our <span className="lp-red">Services</span></h2>
              <p className="lp-sub lp-subd">Everything for a faster, smarter blood donation experience</p></div>
            <div className="lp-svc-grid">
              {[
                {
                  href: '/compatibility.html', title: 'Compatibility Chart', desc: 'Find compatible blood groups for any transfusion instantly.',
                  svg: <svg viewBox="0 0 52 52" fill="none"><circle cx="26" cy="26" r="22" fill="rgba(196,30,58,0.09)" /><circle cx="20" cy="23" r="8" fill="none" stroke="#C41E3A" strokeWidth="2" /><line x1="26" y1="29" x2="36" y2="39" stroke="#C41E3A" strokeWidth="2.5" strokeLinecap="round" /></svg>
                },
                {
                  href: '/Donation-eligibility-rules.html', title: 'Eligibility & Rules', desc: 'Check health criteria and understand donation requirements.',
                  svg: <svg viewBox="0 0 52 52" fill="none"><circle cx="26" cy="26" r="22" fill="rgba(196,30,58,0.09)" /><path d="M26 8 L38 13 V26C38 34 26 44 26 44C26 44 14 34 14 26V13Z" fill="rgba(196,30,58,0.1)" stroke="#C41E3A" strokeWidth="2" /><path d="M21 26l4 4 8-8" stroke="#C41E3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                },
                {
                  href: '/bloodcenter.html', title: 'Donation Camps', desc: 'Locate verified blood donation camps near you.',
                  svg: <svg viewBox="0 0 52 52" fill="none"><circle cx="26" cy="26" r="22" fill="rgba(196,30,58,0.09)" /><path d="M26 40C26 40 12 30 12 20A14 14 0 0 1 40 20C40 30 26 40 26 40Z" fill="rgba(196,30,58,0.18)" stroke="#C41E3A" strokeWidth="2" /><circle cx="26" cy="20" r="4" fill="#C41E3A" opacity="0.6" /></svg>
                },
                {
                  onClick: onDonorSignupClick, title: 'Become a Donor', desc: 'Register and track your life-saving impact in real time.',
                  svg: <svg viewBox="0 0 52 52" fill="none"><circle cx="26" cy="26" r="22" fill="rgba(196,30,58,0.09)" /><circle cx="21" cy="21" r="7" fill="none" stroke="#C41E3A" strokeWidth="2" /><path d="M10 43c0-7 4-11 11-11" stroke="#C41E3A" strokeWidth="2" strokeLinecap="round" /><circle cx="36" cy="25" r="5" fill="none" stroke="#C41E3A" strokeWidth="2" /><path d="M30 43c0-5 2-8 6-8" stroke="#C41E3A" strokeWidth="2" strokeLinecap="round" /></svg>
                },
                {
                  href: '/Donation-Preparation&Aftercare.html', title: 'Prep & Aftercare', desc: 'What to do before and after your blood donation.',
                  svg: <svg viewBox="0 0 52 52" fill="none"><circle cx="26" cy="26" r="22" fill="rgba(196,30,58,0.09)" /><rect x="15" y="13" width="22" height="26" rx="4" fill="rgba(196,30,58,0.09)" stroke="#C41E3A" strokeWidth="2" /><line x1="20" y1="21" x2="32" y2="21" stroke="#C41E3A" strokeWidth="2" strokeLinecap="round" /><line x1="20" y1="27" x2="32" y2="27" stroke="#C41E3A" strokeWidth="2" strokeLinecap="round" /><line x1="20" y1="33" x2="26" y2="33" stroke="#C41E3A" strokeWidth="2" strokeLinecap="round" /></svg>
                },
                {
                  href: 'https://pledge.mygov.in/voluntary-blood-donation/', title: 'MyGov Pledge', desc: 'Take the official government blood donation pledge.',
                  svg: <svg viewBox="0 0 52 52" fill="none"><circle cx="26" cy="26" r="22" fill="rgba(196,30,58,0.09)" /><rect x="13" y="17" width="26" height="22" rx="4" fill="rgba(196,30,58,0.09)" stroke="#C41E3A" strokeWidth="2" /><line x1="13" y1="25" x2="39" y2="25" stroke="#C41E3A" strokeWidth="1.5" /><rect x="19" y="11" width="4" height="10" rx="2" fill="#C41E3A" opacity="0.5" /><rect x="29" y="11" width="4" height="10" rx="2" fill="#C41E3A" opacity="0.5" /><path d="M21 31l3 3 6-6" stroke="#C41E3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                },
              ].map((s, i) => (
                <SvcCard key={i} svg={s.svg} title={s.title} desc={s.desc}
                  href={'href' in s ? s.href : undefined} onClick={'onClick' in s ? s.onClick : undefined} />
              ))}
            </div>
          </div>
        </section>

        {/* ══ BLOOD GROUP GUIDE ══ */}
        <section className="lp-sec lp-cream" ref={r2}>
          <div className="lp-c">
            <div className="lp-sh"><p className="lp-ey lp-eyr">Quick Reference</p>
              <h2 className="lp-h2 lp-h2d">Blood Group <span className="lp-red">Guide</span></h2>
              <p className="lp-sub lp-subd">Tap any blood type to see full compatibility info</p></div>
            <div className="lp-bgl">
              <div className="lp-bgl-l">
                <div className="lp-bgrid">
                  {BLOOD_TYPES.map(b => (
                    <button key={b.type} className={`lp-bc${selBlood === b.type ? ' on' : ''}`}
                      onClick={() => setSelBlood(p => p === b.type ? null : b.type)} aria-pressed={selBlood === b.type}>
                      <span className="lp-btype">{b.type}</span>
                      <span className="lp-bhint">{selBlood === b.type ? '▲' : 'tap'}</span>
                    </button>
                  ))}
                </div>
                {selBlood && (() => {
                  const info = BLOOD_TYPES.find(b => b.type === selBlood)!; return (
                    <div className="lp-binfo">
                      <div className="lp-binfo-top">
                        <span className="lp-binfo-ty">{info.type}</span>
                        <button className="lp-binfo-x" onClick={() => setSelBlood(null)}>✕ Close</button>
                      </div>
                      <div className="lp-bcompat">
                        <div className="lp-bcd"><p className="lp-bcl">🩸 Can Donate To</p><p className="lp-bcv">{info.donateTo}</p></div>
                        <div className="lp-bcr"><p className="lp-bcl">💉 Can Receive From</p><p className="lp-bcv">{info.receiveFrom}</p></div>
                      </div>
                    </div>
                  );
                })()}
                <a href="/compatibility.html" className="lp-tl">View Full Compatibility Chart <ArrowRight size={12} /></a>
              </div>
              <div className="lp-bgl-r"><BloodBagSVG /></div>
            </div>
          </div>
        </section>

        {/* ══ RTID TRACKER ══ */}
        <section className="lp-sec lp-dark lp-rel" ref={r3}>
          <div className="lp-gbg" aria-hidden="true" />
          <div className="lp-c lp-rel">
            <div className="lp-sh"><p className="lp-ey">RTID Technology</p>
              <h2 className="lp-h2">Track Your <span className="lp-red">Donation</span></h2>
              <p className="lp-sub">Every donation gets a unique RTID — from collection to transfusion</p></div>
            <div className="lp-rtl">
              <div className="lp-rtl-left"><NetworkSVG /></div>
              <div className="lp-rtbox">
                <p className="lp-rthdr"><Activity size={13} /> Live RTID Tracker</p>
                <p className="lp-rtfmt">Format: <code>D/H-RTID-DDMMYY-AXXXX</code></p>
                <div className="lp-rtrow">
                  <input className="lp-rtin" placeholder="e.g. D-RTID-060426-A4F7K" value={rtidIn}
                    onChange={e => { setRtidIn(e.target.value); setRtidRes(null); setRtidErr(''); }} onKeyDown={e => e.key === 'Enter' && track()} />
                  <button className="lp-rtbtn" onClick={track}>Track</button>
                </div>
                {rtidErr && <p className="lp-rterr">{rtidErr}</p>}
                {rtidRes && (
                  <div className="lp-steps">
                    {RTID_STEPS.map((step, i) => {
                      const done = i < rtidRes.current, act = i === rtidRes.current - 1, last = i === RTID_STEPS.length - 1; return (
                        <div key={step} className="lp-scol">
                          {!last && <div className={`lp-sline${done ? ' ok' : ''}`} />}
                          <div className={`lp-scirc${done ? ' done' : ''}${act ? ' act' : ''}`}>{done ? '✓' : i + 1}</div>
                          <p className={`lp-slbl${(done || act) ? ' hi' : ''}`}>{step}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
                {rtidRes?.record && <p className="lp-rtdet">Patient: <strong>{rtidRes.record.patientName}</strong> · Blood: <strong style={{ color: '#FF6B6B' }}>{rtidRes.record.bloodGroup}</strong></p>}
              </div>
            </div>
          </div>
          <EcgLine id="r-ecg" opacity={0.35} />
        </section>

        {/* ══ HOW IT WORKS ══ */}
        <section className="lp-sec lp-light" ref={r4}>
          <div className="lp-c">
            <div className="lp-sh"><p className="lp-ey lp-eyr">Simple Process</p>
              <h2 className="lp-h2 lp-h2d">How It <span className="lp-red">Works</span></h2></div>
            <div className="lp-how">
              {[{ n: '01', I: UserPlus, t: 'Register', d: 'Create your donor profile in under 2 minutes.' },
              { n: '02', I: ShieldCheck, t: 'Check Eligibility', d: 'Answer quick health questions to confirm readiness.' },
              { n: '03', I: Search, t: 'Book Appointment', d: 'Find a blood bank or camp and book your slot.' },
              { n: '04', I: Heart, t: 'Donate & Save Lives', d: 'Donate and get your digital impact certificate.' }].map((s, i) => (
                <div key={i} className="lp-hw">
                  <div className="lp-hwn">{s.n}</div>
                  <div className="lp-hwi"><s.I size={19} /></div>
                  <h4 className="lp-hwt">{s.t}</h4>
                  <p className="lp-hwd">{s.d}</p>
                  {i < 3 && <div className="lp-hwarr"><ChevronRight size={16} /></div>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ ELIGIBILITY CHECKER ══ */}
        <section className="lp-sec lp-cream" ref={r5}>
          <div className="lp-c">
            <div className="lp-ell">
              <div className="lp-ell-l">
                <p className="lp-ey lp-eyr">Donor Tool</p>
                <h2 className="lp-h2 lp-h2d">When Can I <span className="lp-red">Donate Again?</span></h2>
                <p className="lp-sub lp-subd">Check eligibility based on NACO guidelines instantly.</p>
                <CalendarSVG />
              </div>
              <div className="lp-ell-r">
                <div className="lp-ecard">
                  <div className="lp-ef">
                    <div><label className="lp-lbl">Last Donation Date</label>
                      <input type="date" className="lp-inp" value={eliF.lastDate} max={new Date().toISOString().split('T')[0]}
                        onChange={e => { setEliF(f => ({ ...f, lastDate: e.target.value })); setEliRes(null); setEliErr(''); }} />
                    </div>
                    <div><label className="lp-lbl">Gender</label>
                      <select className="lp-inp lp-sel" value={eliF.gender} onChange={e => { setEliF(f => ({ ...f, gender: e.target.value })); setEliRes(null); }}>
                        <option>Male</option><option>Female</option>
                      </select>
                    </div>
                    <div className="lp-ef-full"><label className="lp-lbl">Blood Component</label>
                      <select className="lp-inp lp-sel" value={eliF.component} onChange={e => { setEliF(f => ({ ...f, component: e.target.value })); setEliRes(null); }}>
                        <option>Whole Blood</option><option>Platelets</option><option>Plasma</option><option>Double Red Cells</option>
                      </select>
                    </div>
                  </div>
                  {eliErr && <p className="lp-elerr">{eliErr}</p>}
                  <button className="lp-btn lp-bfw" onClick={checkEli}>Check Eligibility</button>
                  {eliRes && (() => {
                    const [t, m] = eliRes.split(':'); const ok = t === 'ok'; return (
                      <div className={`lp-eres${ok ? ' lp-eok' : ' lp-ewait'}`}>
                        <span className="lp-eico">{ok ? '✅' : '📅'}</span>
                        <div>
                          <p className="lp-etitle">{ok ? 'Eligible to donate!' : 'Not yet eligible'}</p>
                          <p className="lp-emsg">{m}</p>
                          <p className="lp-enote">{eliF.component} · {ELI_RULES[eliF.component]?.[eliF.gender]}-day interval (NACO)</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ LEADERBOARD ══ */}
        <section className="lp-sec lp-light" ref={r6}>
          <div className="lp-c">
            <div className="lp-sh"><p className="lp-ey lp-eyr">Community Heroes</p>
              <h2 className="lp-h2 lp-h2d">Donor <span className="lp-red">Leaderboard</span></h2>
              <p className="lp-sub lp-subd">India's most dedicated life-savers — verified across 851+ partner blood banks</p></div>
            <div className="lp-lb">
              <div className="lp-lb-tabs">
                <button className="lp-lb-tab on">🏆 All-Time Top 10</button>
                <button className="lp-lb-tab">📅 This Month</button>
                <span className="lp-lb-live"><span className="lp-ldot" /> LIVE</span>
              </div>
              <div className="lp-lb-sum">
                {[{ n: '340+', l: 'Total Donations' }, { n: '1,020+', l: 'Lives Impacted' }, { n: '10', l: 'Cities Covered' }, { n: '7', l: 'Verified Donors' }].map((s, i, a) => (
                  <React.Fragment key={i}>
                    <div className="lp-lb-si"><span className="lp-lb-sn">{s.n}</span><span className="lp-lb-sl">{s.l}</span></div>
                    {i < a.length - 1 && <div className="lp-lb-sdiv" />}
                  </React.Fragment>
                ))}
              </div>
              <div className="lp-lb-list">
                {LEADERBOARD.map(d => {
                  const medal = ['#FFD700', '#C0C0C0', '#CD7F32'];
                  const bc = BADGE_MAP[d.badge] || BADGE_MAP.Member;
                  return (
                    <div key={d.rank} className={`lp-lb-row${d.rank <= 3 ? ' top' : ''}`}>
                      <div className="lp-lb-rank" style={{ background: d.rank <= 3 ? medal[d.rank - 1] : '#f5ede8', color: d.rank <= 3 ? '#1a0505' : '#8a7070' }}>
                        {d.rank <= 3 ? ['🥇', '🥈', '🥉'][d.rank - 1] : `#${d.rank}`}
                      </div>
                      <div className="lp-lb-av">
                        {d.initials}
                        {d.verified && <span className="lp-lb-vt" title="Verified Donor">✓</span>}
                      </div>
                      <div className="lp-lb-info">
                        <div className="lp-lb-nr">
                          <span className="lp-lb-name">{d.name}</span>
                          <span className="lp-lb-badge" style={{ background: bc.bg, color: bc.text, borderColor: bc.border }}>{d.badge}</span>
                          <span className="lp-lb-bt">{d.bloodType}</span>
                        </div>
                        <div className="lp-lb-meta"><MapPin size={9} /> {d.city}, {d.state}&nbsp;·&nbsp;{d.hospital}</div>
                        <div className="lp-lb-sub">
                          <span>🔥 {d.streak}-mo streak</span>
                          <span>❤️ {d.impact} lives</span>
                          <span>Last: {d.last}</span>
                        </div>
                      </div>
                      <div className="lp-lb-cnt"><span className="lp-lb-n">{d.donations}</span><span className="lp-lb-u">donations</span></div>
                    </div>
                  );
                })}
              </div>
              <div className="lp-lb-foot">
                <p className="lp-lb-note">📊 Verified donations from 851+ partner blood banks · Updated in real-time</p>
                <button className="lp-btn" onClick={onDonorSignupClick}>Join the Leaderboard <ChevronRight size={13} /></button>
              </div>
            </div>
          </div>
        </section>

        {/* ══ IMPACT SECTION ══ */}
        <section className="lp-sec lp-cream" id="impact" ref={r9}>
          <div className="lp-c">
            <div className="lp-sh"><p className="lp-ey lp-eyr">Making A Difference</p>
              <h2 className="lp-h2 lp-h2d">Your Impact <span className="lp-red">Matters</span></h2>
              <p className="lp-sub lp-subd">RaktPort connects donors, hospitals, and blood banks into a unified network—ensuring blood reaches patients faster, smarter, and without geographical limits.</p></div>
            <div className="lp-imp-grid">
              {/* Left: Donation Journey Diagram */}
              <div className="lp-imp-dia">
                <svg viewBox="0 0 400 360" fill="none" className="lp-imp-svg">
                  {/* Donation */}
                  <circle cx="80" cy="70" r="48" fill="rgba(196,30,58,0.07)" stroke="rgba(196,30,58,0.18)" strokeWidth="1.5" />
                  <text x="80" y="60" textAnchor="middle" fontSize="24">🩸</text>
                  <text x="80" y="80" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--rp-text, #1A0505)">Donor</text>
                  {/* Arrow 1 */}
                  <path d="M128 55 L170 55" stroke="rgba(196,30,58,0.3)" strokeWidth="2" strokeDasharray="4 3" markerEnd="url(#impArr)" />
                  {/* Testing */}
                  <circle cx="220" cy="50" r="42" fill="rgba(196,30,58,0.07)" stroke="rgba(196,30,58,0.18)" strokeWidth="1.5" />
                  <text x="220" y="42" textAnchor="middle" fontSize="22">🔬</text>
                  <text x="220" y="60" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--rp-text, #1A0505)">RTID Generation</text>
                  {/* Arrow 2 */}
                  <path d="M262 55 L300 80" stroke="rgba(196,30,58,0.3)" strokeWidth="2" strokeDasharray="4 3" markerEnd="url(#impArr)" />
                  {/* Storage */}
                  <circle cx="330" cy="120" r="44" fill="rgba(196,30,58,0.07)" stroke="rgba(196,30,58,0.18)" strokeWidth="1.5" />
                  <text x="330" y="112" textAnchor="middle" fontSize="22">🏦</text>
                  <text x="330" y="130" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--rp-text, #1A0505)">Nearest Certified Center</text>
                  {/* Arrow 3 */}
                  <path d="M316 162 L280 210" stroke="rgba(196,30,58,0.3)" strokeWidth="2" strokeDasharray="4 3" markerEnd="url(#impArr)" />
                  {/* Hospital */}
                  <circle cx="240" cy="250" r="46" fill="rgba(196,30,58,0.07)" stroke="rgba(196,30,58,0.18)" strokeWidth="1.5" />
                  <text x="240" y="242" textAnchor="middle" fontSize="24">🏥</text>
                  <text x="240" y="262" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--rp-text, #1A0505)">Patient Allocation</text>
                  {/* Arrow 4 */}
                  <path d="M194 260 L140 280" stroke="rgba(196,30,58,0.3)" strokeWidth="2" strokeDasharray="4 3" markerEnd="url(#impArr)" />
                  {/* Recovery */}
                  <circle cx="100" cy="295" r="46" fill="rgba(16,185,129,0.08)" stroke="rgba(16,185,129,0.22)" strokeWidth="1.5" />
                  <text x="100" y="284" textAnchor="middle" fontSize="22">💚</text>
                  <text x="100" y="302" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--rp-text, #1A0505)">Recovery</text>
                  <text x="100" y="316" textAnchor="middle" fontSize="8" fill="rgba(122,96,96,0.7)">Tracking</text>
                  {/* Arrow marker */}
                  <defs>
                    <marker id="impArr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                      <path d="M0,0 L8,3 L0,6" fill="rgba(196,30,58,0.4)" />
                    </marker>
                  </defs>
                  {/* Decorative elements */}
                  <circle cx="170" cy="170" r="4" fill="rgba(196,30,58,0.15)" />
                  <circle cx="350" cy="230" r="3" fill="rgba(196,30,58,0.12)" />
                  <circle cx="50" cy="180" r="3.5" fill="rgba(16,185,129,0.15)" />
                </svg>
              </div>
              {/* Right: Content */}
              <div className="lp-imp-content">
                <p className="lp-imp-desc">Our RTID-based tracking system ensures every donation is digitally linked, traceable, and efficiently routed. From donor to patient, RaktPort eliminates delays and enables real-time coordination across healthcare systems.</p>
                <div className="lp-imp-checks">
                  {[
                    'RTID-based transparent tracking system',
                    'Real-time donation tracking',
                    'Cross-location blood access (no regional limitation)',
                    'Verified hospitals & blood bank integration',
                    'Emergency alert system for urgent needs',
                  ].map(item => (
                    <div key={item} className="lp-imp-chk">
                      <span className="lp-imp-ico"><CheckCircle2 size={18} /></span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <a href="/impact" className="lp-btn lp-imp-btn">See How It Works <ArrowRight size={14} /></a>
              </div>
            </div>
          </div>
        </section>

        {/* ══ STORIES OF HOPE ══ */}
        <section className="lp-sec lp-light" ref={r10}>
          <div className="lp-c">
            <div className="lp-sh"><p className="lp-ey lp-eyr">Real Stories</p>
              <h2 className="lp-h2 lp-h2d">Stories of <span className="lp-red">Hope</span></h2>
              <p className="lp-sub lp-subd">Hear from donors and recipients whose lives have been changed through RaktPort.</p></div>
            <div className="lp-stories-grid">
              {STORIES.map((s, i) => (
                <div key={i} className="lp-story-card">
                  <div className="lp-story-hdr">
                    <div className="lp-story-av">{s.initials}</div>
                    <div>
                      <p className="lp-story-name">{s.name}</p>
                      <p className="lp-story-city">{s.city}</p>
                    </div>
                  </div>
                  <p className="lp-story-quote">"{s.quote}"</p>
                  <div className="lp-story-foot">
                    <span className="lp-story-don">🩸 {s.donations} Donations</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ ROLE SELECTION ══ */}
        <section className="lp-sec lp-dark lp-rel" ref={r7}>
          <div className="lp-gbg" aria-hidden="true" />
          <div className="lp-c lp-rel">
            <div className="lp-sh"><p className="lp-ey">Choose Your Role</p>
              <h2 className="lp-h2">Log In or <span className="lp-red">Sign Up</span></h2>
              <p className="lp-sub">Select your role to access your personalised RaktPort dashboard</p></div>
            <div className="lp-rg">
              {[
                {
                  role: 'donor', emoji: '🩸', title: 'For Donors', badge: 'Most Popular',
                  desc: 'Donate blood and track your life-saving impact with RTID technology.',
                  feats: ['Personal health dashboard', 'Full donation history', 'Digital impact certificate', 'Emergency SOS alerts'],
                  svg: <svg viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="36" fill="rgba(196,30,58,0.15)" stroke="rgba(196,30,58,0.25)" strokeWidth="1.5" /><path d="M40 16C40 16 22 34 22 46A18 18 0 0 0 58 46C58 34 40 16 40 16Z" fill="rgba(196,30,58,0.55)" /><ellipse cx="33" cy="43" rx="6" ry="9" fill="rgba(255,255,255,0.22)" transform="rotate(-20 33 43)" /></svg>
                },
                {
                  role: 'hospital', emoji: '🏥', title: 'For Hospitals', badge: null,
                  desc: 'Manage blood requisitions, inventory and coordinate transfusions.',
                  feats: ['NACO-compliant requisition forms', 'Real-time RTID tracking', 'Blood inventory alerts', 'WhatsApp instant alerts'],
                  svg: <svg viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="36" fill="rgba(196,30,58,0.1)" stroke="rgba(196,30,58,0.2)" strokeWidth="1.5" /><rect x="22" y="28" width="36" height="30" rx="4" fill="rgba(196,30,58,0.18)" stroke="rgba(196,30,58,0.38)" strokeWidth="1.5" /><rect x="22" y="22" width="36" height="8" rx="3" fill="rgba(196,30,58,0.2)" /><rect x="34" y="36" width="12" height="4" rx="2" fill="rgba(196,30,58,0.7)" /><rect x="38" y="32" width="4" height="12" rx="2" fill="rgba(196,30,58,0.7)" /></svg>
                },
                {
                  role: 'bloodbank', emoji: '🧪', title: 'For Blood Banks', badge: null,
                  desc: 'Manage donor networks, blood inventory and national coordination.',
                  feats: ['National donor network access', 'Real-time inventory alerts', 'Fraud detection system', 'CSV export & reporting'],
                  svg: <svg viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="36" fill="rgba(196,30,58,0.1)" stroke="rgba(196,30,58,0.2)" strokeWidth="1.5" /><rect x="30" y="20" width="20" height="42" rx="5" fill="rgba(196,30,58,0.12)" stroke="rgba(196,30,58,0.38)" strokeWidth="1.5" /><rect x="26" y="20" width="28" height="9" rx="3" fill="rgba(196,30,58,0.2)" /><rect x="30" y="40" width="20" height="20" rx="3" fill="rgba(196,30,58,0.28)" /><circle cx="40" cy="52" r="5" fill="rgba(196,30,58,0.65)" /></svg>
                },
              ].map(r => (
                <button key={r.role} className={`lp-rc${r.role === 'donor' ? ' feat' : ''}`} onClick={() => onRoleSelect(r.role)}>
                  {r.badge && <span className="lp-rbadge">{r.badge}</span>}
                  <div className="lp-rsvg" aria-hidden="true">{r.svg}</div>
                  <span className="lp-rem" aria-hidden="true">{r.emoji}</span>
                  <h3 className="lp-rt">{r.title}</h3>
                  <p className="lp-rd">{r.desc}</p>
                  <ul className="lp-rf">{r.feats.map(f => <li key={f}><CheckCircle2 size={11} /> {f}</li>)}</ul>
                  <span className="lp-rcta">Get Started <ArrowRight size={12} /></span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ══ IMPACT SECTION ══ */}
        <section className="lp-sec bg-white dark:bg-[#130408] relative">
          <div className="lp-c relative z-10 px-4 md:px-8 max-w-6xl mx-auto">
            <div className="text-center md:text-left mb-12">
              <p className="text-[var(--clr-brand)] font-bold tracking-widest text-sm uppercase mb-2">Making a Difference</p>
              <h2 className="text-4xl md:text-5xl font-bold text-[var(--txt-main)]">Our <span className="text-[var(--clr-brand)]">Impact</span></h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-0">
              <div className="space-y-6">
                <p className="text-[var(--text-secondary)] text-lg leading-relaxed text-left">
                  RaktPort has streamlined emergency blood requests, ensuring that hospitals and patients connect with nearby donors in record time. Our network stands strong with over 18,000 active donors ready to respond.
                </p>
                <ul className="space-y-4 text-left">
                  <li className="flex items-center gap-3 text-[var(--txt-main)] font-semibold text-lg">
                    <CheckCircle2 size={24} className="text-[var(--clr-brand)] flex-shrink-0" /> Over 2,542+ lives saved
                  </li>
                  <li className="flex items-center gap-3 text-[var(--txt-main)] font-semibold text-lg">
                    <CheckCircle2 size={24} className="text-[var(--clr-brand)] flex-shrink-0" /> Response time reduced for rare phenotypes
                  </li>
                  <li className="flex items-center gap-3 text-[var(--txt-main)] font-semibold text-lg">
                    <CheckCircle2 size={24} className="text-[var(--clr-brand)] flex-shrink-0" /> 24 active cities connected directly
                  </li>
                </ul>
                <div className="pt-6 text-left">
                  <a href="/impact" onClick={(e) => { e.preventDefault(); window.location.href = '/impact'; }} className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[var(--clr-brand)] text-white font-bold rounded-xl shadow-lg shadow-[var(--clr-brand)]/20 hover:scale-[1.03] transition-all">
                    See Full Impact & Stories <ArrowRight size={18} />
                  </a>
                </div>
              </div>
              <div className="relative group rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white dark:border-[#2A1015]">
                <img src={bannerImage2} alt="Donation impact" className="w-full h-[400px] md:h-[450px] object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex items-end p-8">
                  <div className="text-white text-left">
                    <h3 className="text-2xl font-bold mb-2">Real Stories, Real Lives</h3>
                    <p className="text-white/85 text-base">Every drop counts towards building a sustainable and self-reliant healthcare ecosystem.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ WHY DONATE ══ */}
        <section className="lp-sec lp-dark lp-rel" ref={r8}>
          <div className="lp-c lp-rel">
            <div className="lp-sh"><p className="lp-ey">The Impact</p>
              <h2 className="lp-h2">Why Your Donation <span className="lp-red">Matters</span></h2></div>
            <div className="lp-wg">
              {[{ I: Heart, stat: '3 lives', sub: 'per donation', t: 'Every 2 Seconds', d: 'Someone in India needs a blood transfusion. One donation saves up to 3 lives.' },
              { I: Clock, stat: '30 min', sub: 'total process', t: 'Just 30 Minutes', d: 'The entire donation takes less than half an hour — your impact lasts a lifetime.' },
              { I: RefreshCw, stat: '24 hrs', sub: 'to replenish', t: 'Replenishes Fast', d: 'Blood volume restores in 24 hours. Red cells fully rebuild within 4–6 weeks.' }].map((f, i) => (
                <div key={i} className="lp-wc">
                  <div className="lp-wstat"><span className="lp-wn">{f.stat}</span><span className="lp-wu">{f.sub}</span></div>
                  <div className="lp-wi"><f.I size={19} /></div>
                  <h4 className="lp-wt">{f.t}</h4>
                  <p className="lp-wd">{f.d}</p>
                </div>
              ))}
            </div>
            <div className="lp-final">
              <p className="lp-ft">Ready to save lives?</p>
              <div className="lp-fbtns">
                <button className="lp-btn lp-blg" onClick={onDonorSignupClick}><Droplets size={16} /> Register as a Donor Today</button>
                <button className="lp-bto" onClick={() => setEmergOpen(true)}><AlertCircle size={14} /> Request Emergency Blood</button>
              </div>
            </div>
          </div>
          <EcgLine id="w-ecg" opacity={0.28} />
        </section>

      </div>

      {/* ══ EMERGENCY MODAL ══ */}
      {emergOpen && (
        <div className="lp-ov" onClick={e => e.target === e.currentTarget && closeEmerg()}>
          <div className="lp-modal" role="dialog" aria-modal="true" aria-label="Emergency Blood Request">
            <div className="lp-mhd">
              <div><p className="lp-mkick">🔴 Emergency Request</p><h3 className="lp-mttl">Request Emergency Blood</h3></div>
              <button className="lp-mx" onClick={closeEmerg} aria-label="Close"><X size={15} /></button>
            </div>
            <div className="lp-mbody">
              {!eDone ? (
                <>
                  <div className="lp-mg">
                    {[{ l: 'Patient Name *', t: 'text', ph: 'Full name', k: 'patientName' }, { l: 'City *', t: 'text', ph: 'City', k: 'city' },
                    { l: 'Units Required', t: 'number', ph: 'e.g. 2', k: 'units' }, { l: 'Hospital Name', t: 'text', ph: 'Hospital / Centre', k: 'hospital' },
                    { l: 'Contact Number', t: 'tel', ph: '+91 XXXXX XXXXX', k: 'contact' }].map(f => (
                      <div key={f.k}><label className="lp-lbl">{f.l}</label>
                        <input className="lp-inp" type={f.t} placeholder={f.ph} value={(eForm as any)[f.k]}
                          onChange={e => setEForm(p => ({ ...p, [f.k]: e.target.value }))} /></div>
                    ))}
                    <div><label className="lp-lbl">Blood Group *</label>
                      <select className="lp-inp lp-sel" value={eForm.bloodGroup} onChange={e => setEForm(p => ({ ...p, bloodGroup: e.target.value }))}>
                        <option value="">Select</option>
                        {['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'].map(bg => <option key={bg}>{bg}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}><label className="lp-lbl">Urgency Level</label>
                    <div className="lp-ur">
                      {['Critical', 'Urgent', 'Moderate'].map(l => (
                        <button key={l} className={`lp-ub${eForm.urgency === l ? ' on' : ''}`} onClick={() => setEForm(p => ({ ...p, urgency: l }))}>
                          {l === 'Critical' ? '🔴' : l === 'Urgent' ? '🟠' : '🟡'} {l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button className="lp-btn lp-bfw" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? <><span className="lp-spin" />Submitting &amp; Notifying…</> : 'Submit Emergency Request'}
                  </button>
                  <p className="lp-mnote">Nearby donors and blood banks will be notified immediately.</p>
                </>
              ) : (
                <div className="lp-mok">
                  <span className="lp-okico">✅</span>
                  <h4 className="lp-okt">Request Submitted!</h4>
                  <p className="lp-okm">Donors in <strong>{eForm.city}</strong> notified for <strong>{eForm.bloodGroup || 'requested'}</strong> blood.</p>
                  <div className="lp-rtd2"><p className="lp-rtd2l">Your RaktPort RTID</p><p className="lp-rtd2v">{eRTID}</p><p className="lp-rtd2h">Use this in the RTID Tracker to follow your request</p></div>
                  {['Nearby donors notified via SMS & app', 'Partner blood banks alerted', 'Emergency response team activated'].map(a => (
                    <div key={a} className="lp-okit"><CheckCircle2 size={13} color="#10B981" /> {a}</div>
                  ))}
                  <button className="lp-btn lp-bfw" style={{ marginTop: 16 }} onClick={closeEmerg}>Close</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ═══ ALL STYLES ═══ */
function LpStyles() {
  return (
    <style>{`
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

/* ── Tokens ── */
:root{
  --p:#C41E3A;--pl:#E8294A;--pd:#7A0E1E;--pdd:#3D0009;
  --dark:#06010A;--dark2:#0F0308;--dark3:#1A050F;
  --lght:#FFFFFF;--crm:#FFF8F5;
  --tx:#1A0505;--mt:#7A6060;
  --ok:#10B981;--bd:rgba(196,30,58,.14);
  /* compat */
  --rp-primary:#C41E3A;--rp-primary-dark:#7A0E1E;
  --rp-bg-dark:#06010A;--rp-text:#1A0505;--clr-brand:#8B0000;
}

/* ── Base ── */
.lp,.lp *{font-family:'DM Sans',system-ui,sans-serif;box-sizing:border-box;margin:0;padding:0;}
.lp{background:#fff;color:var(--tx);}
.lp-c{max-width:1200px;margin:0 auto;padding:0 22px;}
.lp-rel{position:relative;}
.lp-sec{padding:80px 0;}
.lp-light{background:#fff;}.lp-cream{background:var(--crm);}.lp-dark{background:var(--dark);color:#fff;}

/* ── Reveal animation ── */
.lp-stats,.lp-sec{opacity:0;transform:translateY(22px);transition:opacity .65s cubic-bezier(.22,1,.36,1),transform .65s cubic-bezier(.22,1,.36,1);}
.lp-vis{opacity:1!important;transform:none!important;}

/* ── Grid bg ── */
.lp-gbg{position:absolute;inset:0;pointer-events:none;
  background-image:linear-gradient(rgba(196,30,58,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(196,30,58,.04) 1px,transparent 1px);
  background-size:40px 40px;}

/* ── Typography helpers ── */
.lp-sh{text-align:center;margin-bottom:48px;}
.lp-ey{display:inline-flex;align-items:center;gap:8px;font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:12px;}
.lp-ey::before,.lp-ey::after{content:'';width:18px;height:1px;background:currentColor;opacity:.5;}
.lp-eyr{color:var(--p);}
.lp-h2{font-family:'Sora',Georgia,serif;font-weight:800;font-size:clamp(1.8rem,4vw,2.55rem);letter-spacing:-.04em;color:#fff;line-height:1.1;}
.lp-h2d{color:var(--tx)!important;}
.lp-red{color:var(--p);}
.lp-sub{font-size:14px;color:rgba(255,255,255,.46);margin-top:10px;line-height:1.7;max-width:480px;margin-left:auto;margin-right:auto;}
.lp-subd{color:var(--mt)!important;}
.lp-tl{display:inline-flex;align-items:center;gap:6px;color:var(--p);font-size:13px;font-weight:600;text-decoration:none;border-bottom:1px solid rgba(196,30,58,.3);padding-bottom:1px;transition:border-color .2s;margin-top:16px;}
.lp-tl:hover{border-color:var(--p);}

/* ── Form elements ── */
.lp-lbl{display:block;font-size:11.5px;font-weight:600;color:var(--mt);margin-bottom:5px;}
.lp-inp{width:100%;padding:10px 14px;border-radius:10px;border:1.5px solid var(--bd);font-size:13px;font-family:'DM Sans',sans-serif;outline:none;background:#fff;color:var(--tx);transition:border-color .18s;}
.lp-inp:focus{border-color:var(--p);}
.lp-sel{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23C41E3A' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:34px!important;}

/* ── Buttons ── */
.lp-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(135deg,var(--p),var(--pd));color:#fff;border:none;border-radius:12px;padding:12px 26px;font-size:14px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;box-shadow:0 4px 20px rgba(196,30,58,.35);transition:all .2s;}
.lp-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 28px rgba(196,30,58,.45);}
.lp-btn:disabled{opacity:.65;cursor:not-allowed;}
.lp-blg{padding:14px 32px;font-size:15px;}
.lp-bfw{width:100%;}
.lp-btn-s{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.27);color:rgba(255,255,255,.9);border-radius:12px;padding:12px 20px;font-size:13.5px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .22s;white-space:nowrap;}
.lp-btn-s:hover{background:rgba(255,255,255,.13);border-color:rgba(255,255,255,.5);}
.lp-bto{display:inline-flex;align-items:center;gap:7px;background:transparent;border:1.5px solid rgba(196,30,58,.5);color:rgba(255,160,140,.9);border-radius:12px;padding:12px 24px;font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .22s;}
.lp-bto:hover{border-color:var(--p);background:rgba(196,30,58,.1);}

/* ── Illustration wrapper ── */
.lp-ill{width:100%;max-width:240px;display:block;margin:0 auto;}

/* ── ECG ── */
.lp-ecg{width:100%;height:48px;display:block;}
.lp-ecg-path{stroke-dasharray:900;stroke-dashoffset:900;animation:lpEcg 5s ease-in-out infinite;}

/* ════ HERO ════ */
.lp-hero{background:linear-gradient(155deg,#0F0205 0%,#1A0408 42%,#0A0204 100%);position:relative;overflow:hidden;}
.lp-orb{position:absolute;border-radius:50%;pointer-events:none;filter:blur(70px);}
.o1{width:480px;height:480px;background:radial-gradient(circle,rgba(196,30,58,.16),transparent 70%);top:-120px;right:-80px;}
.o2{width:300px;height:300px;background:radial-gradient(circle,rgba(122,14,30,.2),transparent 70%);bottom:0;left:28%;}
.o3{width:200px;height:200px;background:radial-gradient(circle,rgba(196,30,58,.1),transparent 70%);top:40%;left:-50px;}

/* Hero layout: carousel left, panel right, NO blank space */
.lp-hero-grid{display:flex;align-items:stretch;position:relative;z-index:1;min-height:520px;}
.lp-car{flex:1.15;min-width:0;position:relative;overflow:hidden;border-radius:16px;}
/* Force carousel to fill parent height */
.lp-car>div,.lp-car>div>div,.lp-car>div>div>div{height:100%;}
.lp-slide{position:relative;height:100%;min-height:520px;background:rgba(0,0,0,0.2);}
.lp-slide-img{width:100%;height:100%;object-fit:cover;display:block;}
.lp-slide-ov{position:absolute;inset:0;background:linear-gradient(to right,transparent 48%,rgba(10,2,4,1) 100%),linear-gradient(to top,rgba(10,2,4,.75) 0%,transparent 28%);}
.lp-dots{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);display:flex;gap:6px;z-index:5;}
.lp-dot{height:6px;width:6px;border-radius:999px;border:none;outline:none;padding:0;cursor:pointer;transition:all .3s;background:rgba(255,255,255,.32);}
.lp-dot.on{background:var(--p);width:22px;}

.lp-panel{width:388px;flex-shrink:0;display:flex;flex-direction:column;justify-content:center;padding:36px 26px;}
.lp-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(196,30,58,.14);border:1px solid rgba(196,30,58,.28);color:rgba(255,180,180,.9);font-size:9.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:5px 13px;border-radius:999px;width:fit-content;margin-bottom:16px;}
.lp-bdot{width:6px;height:6px;border-radius:50%;background:#E8294A;flex-shrink:0;animation:lpPulse 1.5s ease-in-out infinite;}
.lp-h1{font-family:'Sora',serif;font-weight:800;font-size:clamp(1.75rem,3vw,2.5rem);letter-spacing:-.04em;color:#fff;line-height:1.15;margin-bottom:12px;}
.lp-panel-p{font-size:13px;color:rgba(255,255,255,.47);line-height:1.75;margin-bottom:20px;}
.lp-panel-btns{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;}
.lp-comp-row{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;}
.lp-comp-tag{display:inline-flex;align-items:center;gap:5px;font-size:9.5px;font-weight:600;color:rgba(74,222,128,.8);background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.18);padding:4px 10px;border-radius:6px;}

/* Hero stats mini-bar */
.lp-hero-stats{display:flex;align-items:center;gap:0;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:14px;padding:14px 4px;margin-bottom:16px;}
.lp-hs{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:0 8px;}
.lp-hsn{font-family:'Sora',serif;font-weight:800;font-size:1.1rem;color:var(--p);letter-spacing:-.03em;line-height:1;}
.lp-hsl{font-size:9px;font-weight:600;color:rgba(255,255,255,.4);letter-spacing:.06em;text-transform:uppercase;}
.lp-hs-div{width:1px;height:28px;background:rgba(255,255,255,.1);flex-shrink:0;}

/* ════ STATS ════ */
.lp-stats{background:linear-gradient(90deg,#6A0B1A 0%,#C41E3A 50%,#6A0B1A 100%);padding:26px 0;opacity:0;transform:translateY(12px);transition:opacity .6s,transform .6s;}
.lp-stats.lp-vis{opacity:1;transform:none;}
.lp-stats-row{display:flex;align-items:center;justify-content:center;gap:0;flex-wrap:wrap;}
.lp-stat{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 28px;border-right:1px solid rgba(255,255,255,.11);}
.lp-stat:last-of-type{border-right:none;}
.lp-si{font-size:1.2rem;line-height:1;}
.lp-sn{font-family:'Sora',serif;font-weight:800;font-size:1.45rem;color:#fff;letter-spacing:-.04em;line-height:1;}
.lp-sl{font-size:9.5px;font-weight:600;color:rgba(255,255,255,.52);letter-spacing:.07em;text-transform:uppercase;text-align:center;}
.lp-live{display:flex;align-items:center;gap:6px;margin-left:16px;background:rgba(74,222,128,.12);border:1px solid rgba(74,222,128,.28);color:#4ade80;font-size:9.5px;font-weight:800;letter-spacing:.14em;padding:5px 14px;border-radius:999px;}
.lp-ldot{width:6px;height:6px;border-radius:50%;background:#4ade80;flex-shrink:0;display:inline-block;animation:lpPulse 1.5s ease-in-out infinite;}

/* ════ SERVICES ════ */
.lp-svc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}
.lp-svc{background:#fff;border:1.5px solid rgba(196,30,58,.1);border-radius:18px;padding:24px 18px;transition:all .26s;position:relative;overflow:hidden;height:100%;cursor:pointer;}
.lp-svc::before{content:'';position:absolute;inset:0;opacity:0;background:linear-gradient(135deg,rgba(196,30,58,.06),transparent 60%);transition:opacity .22s;}
.lp-svc:hover{transform:translateY(-4px);border-color:rgba(196,30,58,.28);box-shadow:0 14px 36px rgba(196,30,58,.1);}
.lp-svc:hover::before{opacity:1;}.lp-svc:hover .lp-svc-arr{opacity:1;transform:translate(2px,-2px);}
.lp-svc-ico{width:46px;height:46px;margin-bottom:13px;}
.lp-svc-t{font-family:'Sora',serif;font-weight:700;font-size:.87rem;color:var(--tx);margin-bottom:7px;line-height:1.3;}
.lp-svc-d{font-size:12.5px;color:var(--mt);line-height:1.75;}
.lp-svc-arr{color:var(--p);opacity:0;margin-top:12px;transition:all .22s;display:flex;}

/* ════ BLOOD GUIDE ════ */
.lp-bgl{display:grid;grid-template-columns:1fr 240px;gap:48px;align-items:start;}
.lp-bgl-l{min-width:0;}.lp-bgl-r{width:240px;display:flex;align-items:center;justify-content:center;}
.lp-bgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:22px 0;}
.lp-bc{border-radius:14px;border:1.5px solid rgba(196,30,58,.13);background:#fff;padding:16px 6px 12px;text-align:center;cursor:pointer;transition:all .22s;display:flex;flex-direction:column;align-items:center;gap:5px;font-family:'DM Sans',sans-serif;-webkit-tap-highlight-color:transparent;}
.lp-bc:hover{border-color:var(--p);transform:translateY(-3px);box-shadow:0 7px 18px rgba(196,30,58,.11);}
.lp-bc.on{border-color:var(--p)!important;background:linear-gradient(145deg,#fff5f5,#ffeeee);box-shadow:0 8px 24px rgba(196,30,58,.17);transform:translateY(-3px);}
.lp-btype{font-family:'Sora',serif;font-weight:800;font-size:1.25rem;color:var(--p);letter-spacing:-.03em;line-height:1;}
.lp-bhint{font-size:9px;color:var(--mt);}
.lp-binfo{background:#fff;border:1.5px solid rgba(196,30,58,.17);border-radius:16px;padding:18px;animation:lpUp .2s ease;margin-top:4px;}
.lp-binfo-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.lp-binfo-ty{font-family:'Sora',serif;font-weight:800;font-size:1.75rem;color:var(--p);letter-spacing:-.04em;}
.lp-binfo-x{background:#fff5f5;border:1px solid rgba(196,30,58,.2);border-radius:7px;padding:4px 12px;font-size:11px;color:var(--p);font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;}
.lp-bcompat{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.lp-bcd{background:#fff5f5;border:1px solid rgba(196,30,58,.13);border-radius:12px;padding:12px;}
.lp-bcr{background:#f0faf5;border:1px solid rgba(16,185,129,.16);border-radius:12px;padding:12px;}
.lp-bcl{font-size:9.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--mt);margin-bottom:5px;}
.lp-bcv{font-size:13px;font-weight:700;color:var(--tx);}

/* ════ RTID ════ */
.lp-rtl{display:grid;grid-template-columns:1fr 1.4fr;gap:48px;align-items:start;}
.lp-rtl-left{display:flex;align-items:center;justify-content:center;}
.lp-rtbox{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:26px;backdrop-filter:blur(10px);}
.lp-rthdr{display:flex;align-items:center;gap:8px;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.48);margin-bottom:7px;}
.lp-rtfmt{font-size:11px;color:rgba(255,255,255,.3);margin-bottom:14px;}
.lp-rtfmt code{background:rgba(255,255,255,.06);padding:2px 8px;border-radius:5px;font-family:monospace;color:rgba(255,180,160,.72);}
.lp-rtrow{display:flex;gap:10px;}
.lp-rtin{flex:1;padding:11px 14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:10px;color:#fff;font-size:13px;font-family:'DM Sans',sans-serif;outline:none;transition:border-color .18s;}
.lp-rtin::placeholder{color:rgba(255,255,255,.24);}.lp-rtin:focus{border-color:rgba(196,30,58,.7);}
.lp-rtbtn{padding:11px 20px;background:linear-gradient(135deg,var(--p),var(--pd));color:#fff;border:none;border-radius:10px;font-size:13.5px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;white-space:nowrap;box-shadow:0 4px 16px rgba(196,30,58,.38);transition:all .2s;}
.lp-rtbtn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(196,30,58,.5);}
.lp-rterr{color:#fca5a5;font-size:12px;margin-top:8px;}
.lp-steps{display:flex;margin-top:20px;overflow-x:auto;padding-bottom:6px;scrollbar-width:none;-webkit-overflow-scrolling:touch;}
.lp-steps::-webkit-scrollbar{display:none;}
.lp-scol{display:flex;flex-direction:column;align-items:center;flex:1 0 55px;position:relative;}
.lp-sline{position:absolute;top:14px;left:calc(50% + 15px);width:calc(100% - 30px);height:2px;background:rgba(255,255,255,.1);z-index:0;}
.lp-sline.ok{background:var(--ok);}
.lp-scirc{width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.09);border:2px solid transparent;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:rgba(255,255,255,.28);position:relative;z-index:1;flex-shrink:0;}
.lp-scirc.done{background:var(--ok);color:#014012;}.lp-scirc.act{background:rgba(196,30,58,.3);color:#fff;border-color:var(--p);box-shadow:0 0 10px rgba(196,30,58,.5);}
.lp-slbl{font-size:8.5px;color:rgba(255,255,255,.26);margin-top:6px;text-align:center;line-height:1.3;max-width:52px;}.lp-slbl.hi{color:rgba(255,255,255,.76);}
.lp-rtdet{font-size:11px;color:rgba(255,255,255,.36);text-align:center;margin-top:10px;}

/* ════ HOW IT WORKS ════ */
.lp-how{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;max-width:960px;margin:0 auto;position:relative;}
.lp-hw{background:#fff;border:1.5px solid rgba(196,30,58,.08);border-radius:20px;padding:26px 16px;text-align:center;position:relative;transition:all .24s;}
.lp-hw:hover{border-color:rgba(196,30,58,.2);transform:translateY(-4px);box-shadow:0 12px 32px rgba(196,30,58,.07);}
.lp-hwn{font-family:'Sora',serif;font-weight:800;font-size:2rem;color:rgba(196,30,58,.11);letter-spacing:-.04em;margin-bottom:12px;line-height:1;}
.lp-hwi{width:46px;height:46px;border-radius:13px;background:linear-gradient(135deg,var(--p),var(--pd));display:flex;align-items:center;justify-content:center;color:#fff;margin:0 auto 14px;box-shadow:0 5px 14px rgba(196,30,58,.28);}
.lp-hwt{font-family:'Sora',serif;font-weight:700;font-size:.87rem;color:var(--tx);margin-bottom:7px;}
.lp-hwd{font-size:12px;color:var(--mt);line-height:1.75;}
.lp-hwarr{position:absolute;right:-14px;top:50%;transform:translateY(-50%);color:rgba(196,30,58,.28);z-index:2;}

/* ════ ELIGIBILITY ════ */
.lp-ell{display:grid;grid-template-columns:1fr 1fr;gap:52px;align-items:start;}
.lp-ell-l{display:flex;flex-direction:column;}
.lp-ecard{background:#fff;border:1.5px solid rgba(196,30,58,.11);border-radius:20px;padding:26px;box-shadow:0 10px 36px rgba(196,30,58,.07);}
.lp-ef{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;}
.lp-ef-full{grid-column:1/-1;}
.lp-elerr{color:var(--p);font-size:12px;margin-bottom:10px;}
.lp-eres{border-radius:14px;padding:14px;display:flex;align-items:flex-start;gap:12px;margin-top:14px;animation:lpUp .22s ease;}
.lp-eok{background:#f0faf5;border:1.5px solid rgba(16,185,129,.2);}.lp-ewait{background:#fff8f5;border:1.5px solid rgba(196,30,58,.17);}
.lp-eico{font-size:1.55rem;flex-shrink:0;}.lp-etitle{font-weight:700;font-size:.88rem;color:var(--tx);margin-bottom:3px;}
.lp-emsg{font-size:13px;color:var(--mt);line-height:1.5;margin-bottom:3px;}.lp-enote{font-size:10.5px;color:rgba(122,96,96,.65);}

/* ════ LEADERBOARD ════ */
.lp-lb{background:#fff;border:1.5px solid rgba(196,30,58,.1);border-radius:22px;overflow:hidden;box-shadow:0 14px 48px rgba(196,30,58,.07);max-width:920px;margin:0 auto;}
.lp-lb-tabs{display:flex;align-items:center;gap:6px;padding:14px 18px;border-bottom:1px solid rgba(196,30,58,.07);flex-wrap:wrap;}
.lp-lb-tab{padding:8px 18px;border-radius:999px;border:1.5px solid rgba(196,30,58,.13);background:transparent;color:var(--mt);font-size:12.5px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .18s;}
.lp-lb-tab.on{background:linear-gradient(135deg,var(--p),var(--pd));color:#fff;border-color:transparent;box-shadow:0 3px 12px rgba(196,30,58,.3);}
.lp-lb-live{display:flex;align-items:center;gap:5px;margin-left:auto;font-size:10px;font-weight:800;letter-spacing:.12em;color:#4ade80;}
.lp-lb-sum{display:flex;align-items:center;flex-wrap:wrap;padding:12px 18px;background:rgba(196,30,58,.04);}
.lp-lb-si{flex:1;display:flex;flex-direction:column;align-items:center;padding:6px 10px;min-width:80px;}
.lp-lb-sn{font-family:'Sora',serif;font-weight:800;font-size:1.3rem;color:var(--p);line-height:1;}
.lp-lb-sl{font-size:10px;color:var(--mt);font-weight:600;margin-top:2px;text-align:center;}
.lp-lb-sdiv{width:1px;background:rgba(196,30,58,.1);align-self:stretch;}
.lp-lb-list{padding:6px 12px;}
.lp-lb-row{display:flex;align-items:center;gap:10px;padding:10px 8px;border-radius:12px;transition:background .14s;}
.lp-lb-row:hover{background:rgba(196,30,58,.04);}.lp-lb-row.top{background:rgba(196,30,58,.025);}
.lp-lb-rank{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Sora',serif;font-weight:800;font-size:.77rem;flex-shrink:0;}
.lp-lb-av{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,rgba(196,30,58,.22),rgba(122,14,30,.38));border:1.5px solid rgba(196,30,58,.2);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:var(--p);flex-shrink:0;position:relative;}
.lp-lb-vt{position:absolute;bottom:-2px;right:-2px;width:14px;height:14px;background:#4ade80;border-radius:50%;border:1.5px solid #fff;display:flex;align-items:center;justify-content:center;font-size:7px;color:#014012;}
.lp-lb-info{flex:1;min-width:0;}
.lp-lb-nr{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-bottom:2px;}
.lp-lb-name{font-weight:700;font-size:.84rem;color:var(--tx);}
.lp-lb-badge{font-size:9px;font-weight:700;padding:2px 7px;border-radius:999px;border:1px solid;}
.lp-lb-bt{font-size:9px;font-weight:700;background:#fff0ee;color:var(--p);padding:2px 7px;border-radius:999px;}
.lp-lb-meta{font-size:10.5px;color:var(--mt);display:flex;align-items:center;gap:3px;flex-wrap:wrap;margin-bottom:3px;}
.lp-lb-sub{display:flex;align-items:center;gap:9px;flex-wrap:wrap;font-size:10px;color:var(--mt);}
.lp-lb-cnt{text-align:right;flex-shrink:0;}
.lp-lb-n{font-family:'Sora',serif;font-weight:800;font-size:1.2rem;color:var(--p);display:block;line-height:1;}
.lp-lb-u{font-size:9.5px;color:var(--mt);}
.lp-lb-foot{border-top:1px solid rgba(196,30,58,.07);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
.lp-lb-note{font-size:11px;color:var(--mt);line-height:1.5;}

/* ════ ROLES ════ */
.lp-rg{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}
.lp-rc{position:relative;border-radius:22px;padding:28px 20px;text-align:left;background:rgba(255,255,255,.04);border:1.5px solid rgba(255,255,255,.09);cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .28s;overflow:hidden;display:flex;flex-direction:column;}
.lp-rc::before{content:'';position:absolute;inset:0;opacity:0;background:radial-gradient(ellipse at 30% 0%,rgba(196,30,58,.16),transparent 70%);transition:opacity .28s;}
.lp-rc:hover{border-color:rgba(196,30,58,.4);transform:translateY(-4px);box-shadow:0 20px 50px rgba(0,0,0,.32);}
.lp-rc:hover::before{opacity:1;}.lp-rc.feat{border-color:rgba(196,30,58,.3)!important;background:rgba(196,30,58,.07)!important;}
.lp-rbadge{position:absolute;top:14px;right:14px;font-size:9px;font-weight:800;background:var(--p);color:#fff;padding:3px 10px;border-radius:999px;letter-spacing:.08em;}
.lp-rsvg{width:60px;height:60px;margin-bottom:14px;}.lp-rem{font-size:1.4rem;margin-bottom:9px;display:block;}
.lp-rt{font-family:'Sora',serif;font-weight:700;font-size:1.1rem;color:#fff;margin-bottom:7px;}
.lp-rd{font-size:12.5px;color:rgba(255,255,255,.48);line-height:1.75;margin-bottom:16px;flex:1;}
.lp-rf{list-style:none;padding:0;margin-bottom:20px;display:flex;flex-direction:column;gap:7px;}
.lp-rf li{display:flex;align-items:center;gap:8px;font-size:12px;color:rgba(255,255,255,.6);}
.lp-rf li svg{color:var(--ok);flex-shrink:0;}
.lp-rcta{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:var(--p);transition:gap .2s;}
.lp-rc:hover .lp-rcta{gap:10px;}

/* ════ WHY DONATE ════ */
.lp-wg{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}
.lp-wc{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:22px;padding:28px 22px;transition:all .24s;}
.lp-wc:hover{background:rgba(255,255,255,.07);border-color:rgba(196,30,58,.28);transform:translateY(-3px);}
.lp-wstat{display:flex;flex-direction:column;margin-bottom:18px;}
.lp-wn{font-family:'Sora',serif;font-weight:800;font-size:2.2rem;color:var(--p);letter-spacing:-.04em;line-height:1;}
.lp-wu{font-size:10px;color:rgba(255,255,255,.3);font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin-top:2px;}
.lp-wi{width:40px;height:40px;border-radius:11px;background:rgba(196,30,58,.2);border:1px solid rgba(196,30,58,.28);display:flex;align-items:center;justify-content:center;color:#ff8fa3;margin-bottom:13px;}
.lp-wt{font-family:'Sora',serif;font-weight:700;font-size:.88rem;color:rgba(255,255,255,.9);margin-bottom:7px;}
.lp-wd{font-size:12.5px;color:rgba(255,255,255,.42);line-height:1.8;}
.lp-final{display:flex;flex-direction:column;align-items:center;margin-top:52px;gap:14px;}
.lp-ft{font-family:'Sora',serif;font-weight:700;font-size:1.2rem;color:rgba(255,255,255,.62);}
.lp-fbtns{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;}

/* ════ IMPACT ════ */
.lp-imp-grid{display:grid;grid-template-columns:1fr 1fr;gap:52px;align-items:center;}
.lp-imp-dia{display:flex;align-items:center;justify-content:center;}
.lp-imp-svg{width:100%;max-width:400px;display:block;}
.lp-imp-content{}
.lp-imp-desc{font-size:14.5px;color:var(--mt);line-height:1.85;margin-bottom:28px;}
.lp-imp-checks{display:flex;flex-direction:column;gap:16px;margin-bottom:32px;}
.lp-imp-chk{display:flex;align-items:center;gap:14px;font-size:14.5px;font-weight:500;color:var(--tx);}
.lp-imp-ico{width:32px;height:32px;border-radius:50%;background:rgba(16,185,129,.1);border:1.5px solid rgba(16,185,129,.2);display:flex;align-items:center;justify-content:center;color:#10B981;flex-shrink:0;}
.lp-imp-btn{display:inline-flex;width:auto;text-decoration:none;margin-top:4px;}

/* ════ STORIES ════ */
.lp-stories-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
.lp-story-card{background:#fff;border:1.5px solid rgba(196,30,58,.08);border-radius:20px;padding:24px;transition:all .26s;}
.lp-story-card:hover{transform:translateY(-4px);border-color:rgba(196,30,58,.2);box-shadow:0 12px 36px rgba(196,30,58,.08);}
.lp-story-hdr{display:flex;align-items:center;gap:12px;margin-bottom:16px;}
.lp-story-av{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#C41E3A,#7A0E1E);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:#fff;flex-shrink:0;letter-spacing:-.02em;}
.lp-story-name{font-family:'Sora',serif;font-weight:700;font-size:.92rem;color:var(--tx);line-height:1.2;}
.lp-story-city{font-size:11.5px;color:var(--mt);font-weight:500;margin-top:2px;}
.lp-story-quote{font-size:13.5px;color:var(--mt);line-height:1.8;font-style:italic;margin-bottom:16px;min-height:80px;}
.lp-story-foot{display:flex;align-items:center;padding-top:14px;border-top:1px solid rgba(196,30,58,.07);}
.lp-story-don{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:var(--p);}

/* ════ MODAL ════ */
.lp-ov{position:fixed;inset:0;background:rgba(5,1,8,.82);z-index:300;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(5px);animation:lpFade .22s ease;}
.lp-modal{background:#fff;border-radius:22px;width:100%;max-width:540px;max-height:90vh;overflow-y:auto;box-shadow:0 40px 100px rgba(0,0,0,.45);animation:lpUp .24s ease;}
.lp-mhd{background:linear-gradient(135deg,var(--p),var(--pd));padding:20px 22px;display:flex;align-items:flex-start;justify-content:space-between;border-radius:22px 22px 0 0;gap:12px;}
.lp-mkick{font-size:9.5px;font-weight:700;letter-spacing:.12em;color:rgba(255,255,255,.65);margin-bottom:3px;}
.lp-mttl{font-family:'Sora',serif;font-weight:800;font-size:1.15rem;color:#fff;letter-spacing:-.03em;}
.lp-mx{width:32px;height:32px;border-radius:9px;background:rgba(255,255,255,.15);border:none;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .15s;}
.lp-mx:hover{background:rgba(255,255,255,.26);}
.lp-mbody{padding:22px;}
.lp-mg{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-bottom:12px;}
.lp-ur{display:flex;gap:8px;flex-wrap:wrap;}
.lp-ub{flex:1;min-width:80px;padding:9px;border-radius:10px;border:1.5px solid rgba(196,30,58,.16);background:#fff;color:var(--mt);font-size:12.5px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .18s;}
.lp-ub.on{border-color:var(--p)!important;background:#fff0ee!important;color:var(--p)!important;font-weight:700!important;}
.lp-mnote{font-size:11px;color:var(--mt);text-align:center;margin-top:10px;}
.lp-spin{width:14px;height:14px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;display:inline-block;animation:lpSpin .7s linear infinite;margin-right:6px;}
.lp-mok{text-align:center;padding:6px 0;}
.lp-okico{font-size:2.4rem;display:block;margin-bottom:12px;}
.lp-okt{font-family:'Sora',serif;font-weight:800;font-size:1.15rem;color:var(--tx);margin-bottom:7px;}
.lp-okm{font-size:13px;color:var(--mt);margin-bottom:16px;line-height:1.6;}
.lp-rtd2{background:#FFF8F5;border:1.5px solid rgba(196,30,58,.2);border-radius:14px;padding:16px;margin-bottom:14px;}
.lp-rtd2l{font-size:9.5px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--mt);margin-bottom:5px;}
.lp-rtd2v{font-family:monospace;font-weight:800;font-size:1.15rem;color:var(--p);word-break:break-all;}
.lp-rtd2h{font-size:10.5px;color:var(--mt);margin-top:4px;}
.lp-okit{display:flex;align-items:center;gap:8px;font-size:12.5px;color:#157a4c;font-weight:500;margin-bottom:7px;text-align:left;}

/* ════ ANIMATIONS ════ */
@keyframes lpFloat {0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
@keyframes lpPulse {0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.35)}}
@keyframes lpRipple{0%{opacity:.45;transform:scale(.7)}100%{opacity:0;transform:scale(1.65)}}
@keyframes lpEcg  {0%{stroke-dashoffset:900}55%{stroke-dashoffset:0}100%{stroke-dashoffset:-900}}
@keyframes lpFade {from{opacity:0}to{opacity:1}}
@keyframes lpUp   {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes lpSpin {to{transform:rotate(360deg)}}

/* ═══════════════════════════════════════════
   RESPONSIVE
═══════════════════════════════════════════ */
/* ── Tablet 1024px ── */
@media(max-width:1024px){
  .lp-panel{width:350px;padding:32px 20px;}
  .lp-bgl{grid-template-columns:1fr 200px;gap:32px;}
  .lp-bgl-r{width:200px;}
  .lp-rtl{grid-template-columns:1fr 1.2fr;gap:32px;}
  .lp-ell{grid-template-columns:1fr 1fr;gap:36px;}
  .lp-imp-grid{gap:36px;}
}
/* ── Tablet 860px — stack hero, hide some details ── */
@media(max-width:860px){
  .lp-hero-grid{flex-direction:column;}
  .lp-car{flex:none;}
  .lp-slide{min-height:280px;}
  .lp-slide-ov{background:linear-gradient(to top,rgba(10,2,4,.6) 0%,transparent 38%);}
  .lp-panel{width:100%;padding:26px 20px;flex-direction:row;flex-wrap:wrap;align-items:center;gap:16px;}
  .hbd{order:-1;width:120px;height:148px;margin:0 auto 0 0;flex-shrink:0;}
  .hbd-svg{width:90px;}.hbd-r1{width:70px;height:70px;}.hbd-r2{width:100px;height:100px;}.hbd-r3{width:130px;height:130px;}
  .lp-panel-p,.lp-comp-row{width:100%;}
  .lp-svc-grid{grid-template-columns:repeat(2,1fr);}
  .lp-bgl{grid-template-columns:1fr;gap:24px;}
  .lp-bgl-r{order:-1;margin-bottom:8px;}
  .lp-bgl-r svg{max-width:180px!important;}
  .lp-bgrid{grid-template-columns:repeat(4,1fr);}
  .lp-rtl{grid-template-columns:1fr;gap:24px;}
  .lp-ell{grid-template-columns:1fr;gap:24px;}
  .lp-ell-l{align-items:center;text-align:center;}
  .lp-how{grid-template-columns:repeat(2,1fr);gap:14px;}.lp-hwarr{display:none;}
  .lp-rg{grid-template-columns:1fr 1fr;gap:14px;}
  .lp-wg{grid-template-columns:1fr 1fr;gap:14px;}
  .lp-lb-sub{display:none;}
  .lp-imp-grid{grid-template-columns:1fr;gap:28px;}
  .lp-imp-dia{order:-1;}
  .lp-stories-grid{grid-template-columns:1fr 1fr;gap:16px;}
}
/* ── Mobile 600px ── */
@media(max-width:600px){
  .lp-sec{padding:56px 0;}.lp-c{padding:0 16px;}
  .lp-h2{font-size:1.75rem!important;}.lp-sh{margin-bottom:32px;}
  .lp-panel{padding:18px 16px;flex-direction:column;}
  .hbd{order:0;align-self:center;width:140px;height:172px;margin:0 auto 12px;}
  .hbd-svg{width:100px;}.hbd-r1{width:80px;height:80px;}.hbd-r2{width:115px;height:115px;}.hbd-r3{width:150px;height:150px;}
  .hbd-chip{font-size:9px;padding:3px 8px;}
  .lp-stats-row{overflow-x:auto;flex-wrap:nowrap;justify-content:flex-start;padding:0 8px;scrollbar-width:none;}
  .lp-stats-row::-webkit-scrollbar{display:none;}
  .lp-stat{min-width:88px;padding:6px 14px;}
  .lp-live{flex-shrink:0;margin-left:10px;}
  .lp-svc-grid{grid-template-columns:1fr 1fr;gap:11px;}
  .lp-svc{padding:18px 14px;}.lp-svc-ico{width:40px;height:40px;}.lp-svc-t{font-size:.82rem;}.lp-svc-d{font-size:11.5px;}
  .lp-bgrid{grid-template-columns:repeat(4,1fr);gap:8px;}
  .lp-bc{padding:13px 4px 9px;}.lp-btype{font-size:1.1rem;}
  .lp-bcompat{grid-template-columns:1fr;}
  .lp-bgl-r svg{max-width:140px!important;}
  .lp-rtrow{flex-direction:column;gap:8px;}.lp-rtbtn{width:100%;}
  .lp-how{grid-template-columns:1fr;}
  .lp-ef{grid-template-columns:1fr;}.lp-ef-full{grid-column:auto;}
  .lp-ell-l{align-items:center;text-align:center;}
  .lp-lb-sum{flex-wrap:wrap;}
  .lp-lb-sdiv{display:none;}
  .lp-lb-si{min-width:50%;border-bottom:1px solid rgba(196,30,58,.05);}
  .lp-lb-foot{flex-direction:column;align-items:stretch;}
  .lp-lb-foot .lp-btn{width:100%;justify-content:center;}
  .lp-lb-meta span:last-child{display:none;}
  .lp-rg{grid-template-columns:1fr;}
  .lp-wg{grid-template-columns:1fr;}
  .lp-fbtns{flex-direction:column;align-items:stretch;}
  .lp-blg,.lp-bto{width:100%;justify-content:center;}
  .lp-mg{grid-template-columns:1fr;}
  .lp-ur{}.lp-ub{flex:1;min-width:calc(33% - 6px);}
  .lp-lb-av{width:30px;height:30px;font-size:10px;}.lp-lb-rank{width:28px;height:28px;}
  .lp-stories-grid{grid-template-columns:1fr;}
  .lp-hero-stats{flex-wrap:wrap;gap:8px;}
  .lp-hs-div{display:none;}
  .lp-hs{min-width:calc(33% - 8px);}
}
/* ── XS 380px ── */
@media(max-width:380px){
  .lp-svc-grid{grid-template-columns:1fr;}
  .lp-bgrid{gap:6px;}.lp-btype{font-size:.95rem;}
  .lp-h1{font-size:1.55rem;}
  .lp-c{padding:0 13px;}
}

/* ═══════════════════════════════════════════
   DARK MODE — COMPLETE
═══════════════════════════════════════════ */
/* Token overrides */
.dark .lp{
  --tx:#F0E0DD;--mt:#9A8A82;--bd:rgba(196,30,58,.22);
}

/* Section backgrounds */
.dark .lp{background:var(--dark);}
.dark .lp-light{background:#0F0308;}
.dark .lp-cream{background:#130408;}

/* Section headings / text */
.dark .lp-h2d{color:#F0E0DD!important;}
.dark .lp-subd{color:#9A8A82!important;}
.dark .lp-eyr{color:var(--p);}

/* Services */
.dark .lp-svc{background:#1A0A0E!important;border-color:rgba(196,30,58,.18)!important;}
.dark .lp-svc::before{background:linear-gradient(135deg,rgba(196,30,58,.08),transparent 60%)!important;}
.dark .lp-svc:hover{border-color:rgba(196,30,58,.38)!important;box-shadow:0 14px 36px rgba(0,0,0,.4)!important;}
.dark .lp-svc-t{color:#F0E0DD!important;}
.dark .lp-svc-d{color:#9A8A82!important;}

/* Blood guide cards */
.dark .lp-bc{background:#1A0A0E!important;border-color:rgba(196,30,58,.18)!important;}
.dark .lp-bc:hover{border-color:rgba(196,30,58,.42)!important;box-shadow:0 7px 18px rgba(0,0,0,.35)!important;}
.dark .lp-bc.on{background:linear-gradient(145deg,#2A1015,#1F0C10)!important;border-color:var(--p)!important;}
.dark .lp-bhint{color:#6A5A5A!important;}
.dark .lp-binfo{background:#1A0A0E!important;border-color:rgba(196,30,58,.22)!important;}
.dark .lp-bcd{background:#2A1015!important;border-color:rgba(196,30,58,.18)!important;}
.dark .lp-bcr{background:#0E2018!important;border-color:rgba(16,185,129,.2)!important;}
.dark .lp-bcl{color:#7A6060!important;}
.dark .lp-bcv{color:#F0E0DD!important;}
.dark .lp-binfo-x{background:#2A1015!important;border-color:rgba(196,30,58,.25)!important;}

/* How it works */
.dark .lp-hw{background:#1A0A0E!important;border-color:rgba(196,30,58,.14)!important;}
.dark .lp-hw:hover{border-color:rgba(196,30,58,.3)!important;box-shadow:0 12px 32px rgba(0,0,0,.4)!important;}
.dark .lp-hwt{color:#F0E0DD!important;}
.dark .lp-hwd{color:#9A8A82!important;}

/* Eligibility checker */
.dark .lp-ecard{background:#1A0A0E!important;border-color:rgba(196,30,58,.18)!important;box-shadow:0 10px 36px rgba(0,0,0,.35)!important;}
.dark .lp-inp{background:#140408!important;border-color:rgba(196,30,58,.22)!important;color:#F0E0DD!important;}
.dark .lp-inp:focus{border-color:var(--p)!important;}
.dark .lp-lbl{color:#9A8A82!important;}
.dark .lp-sel{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23C41E3A' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")!important;}
.dark .lp-eok{background:#0E2018!important;border-color:rgba(16,185,129,.22)!important;}
.dark .lp-ewait{background:#2A1015!important;border-color:rgba(196,30,58,.2)!important;}
.dark .lp-etitle{color:#F0E0DD!important;}
.dark .lp-emsg{color:#9A8A82!important;}

/* Leaderboard */
.dark .lp-lb{background:#1A0A0E!important;border-color:rgba(196,30,58,.16)!important;box-shadow:0 14px 48px rgba(0,0,0,.4)!important;}
.dark .lp-lb-tabs{border-color:rgba(196,30,58,.1)!important;}
.dark .lp-lb-tab{color:#9A8A82!important;border-color:rgba(196,30,58,.16)!important;}
.dark .lp-lb-tab:hover{border-color:rgba(196,30,58,.32)!important;color:rgba(255,200,190,.8)!important;}
.dark .lp-lb-tab.on{color:#fff!important;border-color:transparent!important;}
.dark .lp-lb-sum{background:rgba(196,30,58,.07)!important;}
.dark .lp-lb-sl{color:#9A8A82!important;}
.dark .lp-lb-sdiv{background:rgba(196,30,58,.14)!important;}
.dark .lp-lb-row:hover{background:rgba(196,30,58,.06)!important;}
.dark .lp-lb-row.top{background:rgba(196,30,58,.04)!important;}
.dark .lp-lb-name{color:#F0E0DD!important;}
.dark .lp-lb-meta{color:#9A8A82!important;}
.dark .lp-lb-u{color:#9A8A82!important;}
.dark .lp-lb-note{color:#9A8A82!important;}
.dark .lp-lb-foot{border-color:rgba(196,30,58,.1)!important;}

/* Modal */
.dark .lp-modal{background:#1A0A0E!important;}
.dark .lp-mbody .lp-lbl{color:#9A8A82!important;}
.dark .lp-mbody .lp-inp{background:#140408!important;border-color:rgba(196,30,58,.22)!important;color:#F0E0DD!important;}
.dark .lp-mbody .lp-inp:focus{border-color:var(--p)!important;}
.dark .lp-ub{background:#1A0A0E!important;border-color:rgba(196,30,58,.18)!important;color:#9A8A82!important;}
.dark .lp-ub.on{background:#2A1015!important;color:var(--p)!important;border-color:var(--p)!important;}
.dark .lp-mnote{color:#9A8A82!important;}
.dark .lp-okt{color:#F0E0DD!important;}
.dark .lp-okm{color:#9A8A82!important;}
.dark .lp-rtd2{background:#130408!important;border-color:rgba(196,30,58,.22)!important;}
.dark .lp-rtd2l{color:#9A8A82!important;}
.dark .lp-rtd2h{color:#9A8A82!important;}

/* Impact section dark */
.dark .lp-imp-desc{color:#9A8A82!important;}
.dark .lp-imp-chk{color:#F0E0DD!important;}
.dark .lp-imp-ico{background:rgba(16,185,129,.12)!important;border-color:rgba(16,185,129,.25)!important;}
.dark .lp-imp-svg text{fill:#F0E0DD!important;}

/* Stories dark */
.dark .lp-story-card{background:#1A0A0E!important;border-color:rgba(196,30,58,.16)!important;}
.dark .lp-story-card:hover{border-color:rgba(196,30,58,.32)!important;box-shadow:0 12px 36px rgba(0,0,0,.4)!important;}
.dark .lp-story-name{color:#F0E0DD!important;}
.dark .lp-story-city{color:#9A8A82!important;}
.dark .lp-story-quote{color:#9A8A82!important;}
.dark .lp-story-foot{border-color:rgba(196,30,58,.12)!important;}
`}</style>
  );
}