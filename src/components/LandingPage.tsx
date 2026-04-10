// src/components/LandingPage.tsx
// RaktPort — Landing Page v1
// Decision-based hero, urgency-driven, RTID innovation, donor conversion optimised.

import * as React from 'react';
import {
  Heart, Users, FileText, Calendar, UserPlus,
  ShieldCheck, Clock, RefreshCw, X, ChevronRight,
  Droplets, AlertCircle, CheckCircle2, MapPin,
  ArrowRight, Activity, Zap, Fingerprint,
  Globe, Award, Search, Star, Sparkles,
} from 'lucide-react';
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
  { type: 'A+', donateTo: 'A+, AB+', receiveFrom: 'A+, A−, O+, O−', tag: '' },
  { type: 'A−', donateTo: 'A+, A−, AB+, AB−', receiveFrom: 'A−, O−', tag: '' },
  { type: 'B+', donateTo: 'B+, AB+', receiveFrom: 'B+, B−, O+, O−', tag: '' },
  { type: 'B−', donateTo: 'B+, B−, AB+, AB−', receiveFrom: 'B−, O−', tag: '' },
  { type: 'AB+', donateTo: 'AB+ only', receiveFrom: 'All blood types', tag: '🌟 Universal Recipient' },
  { type: 'AB−', donateTo: 'AB+, AB−', receiveFrom: 'AB−, A−, B−, O−', tag: '' },
  { type: 'O+', donateTo: 'A+, B+, O+, AB+', receiveFrom: 'O+, O−', tag: '' },
  { type: 'O−', donateTo: 'All blood types', receiveFrom: 'O− only', tag: '🌟 Universal Donor' },
];

const STORIES = [
  { name: 'Arjun Sharma', city: 'Mumbai', initials: 'AS', donations: 48, role: 'Donor', quote: 'Donating blood through RaktPort has been incredibly fulfilling. The platform makes it so easy, and knowing my blood saved lives is the best reward.', stars: 5 },
  { name: 'Priya Nair', city: 'Chennai', initials: 'PN', donations: 41, role: 'Donor', quote: 'The transparency and tracking system is amazing. I can see exactly where my donation goes and the impact it creates.', stars: 5 },
  { name: 'Rohit Verma', city: 'Delhi', initials: 'RV', donations: 0, role: 'Recipient\'s Son', quote: 'RaktPort helped me find blood for my father during an emergency. The response was immediate and professional. Truly life-saving!', stars: 5 },
  { name: 'Sneha Patel', city: 'Ahmedabad', initials: 'SP', donations: 32, role: 'Regular Donor', quote: 'As a regular donor, RaktPort keeps me connected with camps near me. The reminders and health tracking make donating seamless.', stars: 5 },
  { name: 'Kiran Rao', city: 'Hyderabad', initials: 'KR', donations: 0, role: 'Parent', quote: 'My son needed platelets urgently. RaktPort connected us with 3 compatible donors within an hour. Forever grateful!', stars: 5 },
  { name: 'Meena Das', city: 'Kolkata', initials: 'MD', donations: 24, role: 'First-time Donor', quote: 'I started donating after seeing the impact dashboard. Knowing each donation helps 3 lives keeps me motivated to continue.', stars: 4 },
];

const ELI_RULES: { [k: string]: { [g: string]: number } } = {
  'Whole Blood': { Male: 90, Female: 90 }, 'Platelets': { Male: 14, Female: 14 },
  'Plasma': { Male: 28, Female: 28 }, 'Double Red Cells': { Male: 112, Female: 112 },
};
const D_RTID_STEPS = ['Collected', 'Lab Testing', 'Separation', 'Blood Bank', 'Issued', 'Transfused'];
const R_RTID_STEPS = ['Requested', 'Processing', 'Matched', 'Verified', 'Issued', 'Completed'];
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

/* ═══ SVG Illustrations ═══ */
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

/* ─── Feature Card ─── */
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="lp-feat">
      <div className="lp-feat-ico">{icon}</div>
      <h3 className="lp-feat-t">{title}</h3>
      <p className="lp-feat-d">{desc}</p>
    </div>
  );
}

/* ═══ MAIN COMPONENT ═══ */
export function LandingPage({ onRoleSelect, onDonorSignupClick }: LandingPageProps) {
  const [selBlood, setSelBlood] = React.useState<string | null>(null);
  const [emergOpen, setEmergOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [eForm, setEForm] = React.useState({ patientName: '', bloodGroup: '', units: '', hospital: '', city: '', contact: '', urgency: 'Critical' });
  const [eDone, setEDone] = React.useState(false);
  const [eRTID, setERTID] = React.useState('');
  const handleSubmit = async () => { if (!eForm.patientName || !eForm.bloodGroup || !eForm.city) return; setSubmitting(true); try { const r = await submitDB(eForm); setERTID(r); setEDone(true); } finally { setSubmitting(false); } };
  const closeEmerg = () => { setEmergOpen(false); setEDone(false); setERTID(''); setEForm({ patientName: '', bloodGroup: '', units: '', hospital: '', city: '', contact: '', urgency: 'Critical' }); };

  const [rtidIn, setRtidIn] = React.useState('');
  const [rtidRes, setRtidRes] = React.useState<{ current: number; type: 'D' | 'R'; record?: EmergencyRecord | any } | null>(null);
  const [rtidErr, setRtidErr] = React.useState('');
  const [rtidLoading, setRtidLoading] = React.useState(false);

  const track = async () => {
    const v = rtidIn.trim().toUpperCase();
    if (!v) { setRtidErr('Please enter an RTID.'); return; }
    if (!isValidRTID(v)) { setRtidErr('Format: D/R-RTID-DDMMYY-AXXXX  e.g. D-RTID-060426-A4F7K'); return; }
    setRtidErr(''); setRtidRes(null); setRtidLoading(true);

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
          if (foundRef.linkedRrtid && foundRef.linkedRrtid !== 'N/A') {
            const hSnap = await getDocs(query(collection(db, 'bloodRequests'), where('rtid', '==', foundRef.linkedRrtid)));
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
        setRtidRes({ current: Math.max(1, Math.min(current, 6)), type: v.startsWith('D-RTID') ? 'D' : 'R', record: details });
      } else {
        setRtidErr('No real-time record found for this RTID.');
      }
    } catch (err) {
      console.error(err);
      setRtidErr('Failed to fetch tracking data. Please try again.');
    } finally {
      setRtidLoading(false);
    }
  };

  /* Eligibility checker */
  const [eliF, setEliF] = React.useState({ lastDate: '', gender: 'Male', component: 'Whole Blood' });
  const [eliRes, setEliRes] = React.useState<string | null>(null);
  const [eliErr, setEliErr] = React.useState('');
  const checkEli = () => { if (!eliF.lastDate) { setEliErr('Please select your last donation date.'); return; } setEliErr(''); const days = ELI_RULES[eliF.component]?.[eliF.gender] ?? 90; const next = addDays(new Date(eliF.lastDate), days); setEliRes(next <= new Date() ? `ok:You are eligible — the ${days}-day interval has passed.` : `wait:Next eligible date: ${fmtDate(next)}`); };

  const cnt1 = useCounter(101), cnt2 = useCounter(2542), cnt3 = useCounter(851);

  const r0 = useReveal(), r1 = useReveal(), r2 = useReveal(), r3 = useReveal(), r4 = useReveal();
  const r5 = useReveal(), r6 = useReveal(), r7 = useReveal(), r8 = useReveal(), r9 = useReveal();

  return (
    <>
      <LpStyles />
      <div className="lp" id="main-content">

        {/* ══ 1. HERO — Decision-Based Layout ══ */}
        <section className="lp-hero">
          <div className="lp-orb o1" /><div className="lp-orb o2" /><div className="lp-orb o3" />
          <div className="lp-hero-split">

            {/* Left: Emotional messaging */}
            <div className="lp-hero-left">
              <span className="lp-badge"><span className="lp-bdot" />India's National Blood Network</span>
              <h1 className="lp-h1">
                Someone in India needs blood <span className="lp-h1-em">every 2 seconds.</span><br />
                <span className="lp-h1-you">You can save them.</span>
              </h1>
              <p className="lp-hero-sub">
                RaktPort connects donors, hospitals, and blood banks instantly using <strong>RTID technology</strong> — ensuring blood reaches patients faster, smarter, and transparently.
              </p>

              {/* Stats mini-row below hero text */}
              <div className="lp-hero-stats">
                <div className="lp-hs"><span className="lp-hsn">1 donation</span><span className="lp-hsl">= 3 lives saved</span></div>
                <div className="lp-hs-div" />
                <div className="lp-hs"><span className="lp-hsn">30 min</span><span className="lp-hsl">total process</span></div>
                <div className="lp-hs-div" />
                <div className="lp-hs"><span className="lp-hsn">24 hrs</span><span className="lp-hsl">to replenish</span></div>
              </div>
            </div>

            {/* Right: CTA panel */}
            <div className="lp-hero-right">
              <div className="lp-cta-card">
                <div className="lp-cta-glow" />
                <p className="lp-cta-lead">Take action now</p>
                <h2 className="lp-cta-head">Your blood can<br /><span className="lp-red">save 3 lives</span> today</h2>

                <button className="lp-btn lp-btn-hero" id="hero-donate-btn" onClick={onDonorSignupClick}>
                  <Heart size={18} /> Become a Donor
                </button>

                <button className="lp-btn-s lp-btn-emg" onClick={() => setEmergOpen(true)}>
                  <Zap size={14} /> Emergency Blood Request
                </button>

                <div className="lp-comp-row">
                  {['NACO Compliant', 'MoHFW Verified', 'NDHM Integrated'].map(c => (
                    <span key={c} className="lp-comp-tag"><CheckCircle2 size={10} /> {c}</span>
                  ))}
                </div>
              </div>
            </div>

          </div>
          <EcgLine id="h-ecg" opacity={0.5} />
        </section>

        {/* ══ 2. WHY DONATION MATTERS (MOVED UP) ══ */}
        <section className="lp-sec lp-dark lp-rel" ref={r0}>
          <div className="lp-c lp-rel">
            <div className="lp-why-grid">
              {[
                { I: Heart, stat: '3 lives', sub: 'per donation', t: 'Every 2 Seconds', d: 'Someone in India needs a blood transfusion. One donation separates into 3 components and saves up to 3 lives.' },
                { I: Clock, stat: '30 min', sub: 'total process', t: 'Just 30 Minutes', d: 'The entire donation takes less than half an hour — but your impact lasts a lifetime for the recipient.' },
                { I: RefreshCw, stat: '24 hrs', sub: 'to replenish', t: 'Replenishes Fast', d: 'Your blood volume restores within 24 hours. Red cells fully rebuild within 4–6 weeks.' },
              ].map((f, i) => (
                <div key={i} className="lp-why-card">
                  <div className="lp-why-stat">
                    <span className="lp-why-num">{f.stat}</span>
                    <span className="lp-why-unit">{f.sub}</span>
                  </div>
                  <div className="lp-why-ico"><f.I size={20} /></div>
                  <h4 className="lp-why-t">{f.t}</h4>
                  <p className="lp-why-d">{f.d}</p>
                </div>
              ))}
            </div>
          </div>
          <EcgLine id="w-ecg" opacity={0.28} />
        </section>

        {/* ══ 3. URGENCY + IMPACT STATS ══ */}
        <section className="lp-stats lp-vis">
          <div className="lp-c">
            <div className="lp-stats-inner">
              <div className="lp-stats-lead">
                <span className="lp-stats-big">1 donation = 3 lives saved</span>
              </div>
              <div className="lp-stats-row">
                <div className="lp-stat">
                  <span className="lp-si">🩸</span>
                  <span className="lp-sn">{cnt1}+</span>
                  <span className="lp-sl">Donations Today</span>
                </div>
                <div className="lp-stat">
                  <span className="lp-si">❤️</span>
                  <span className="lp-sn">{cnt2.toLocaleString()}+</span>
                  <span className="lp-sl">Lives Saved This Month</span>
                </div>
                <div className="lp-stat">
                  <span className="lp-si">🏥</span>
                  <span className="lp-sn">{cnt3}+</span>
                  <span className="lp-sl">Blood Banks Connected</span>
                </div>
                <div className="lp-live"><span className="lp-ldot" /> LIVE</div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ 4. HOW IT WORKS — RTID-Based ══ */}
        <section className="lp-sec lp-light" ref={r1}>
          <div className="lp-c">
            <div className="lp-sh">
              <p className="lp-ey lp-eyr">RTID Innovation</p>
              <h2 className="lp-h2 lp-h2d">How <span className="lp-red">RaktPort</span> Works</h2>
              <p className="lp-sub lp-subd">A technology-first approach to blood donation — every step tracked, every unit accounted for</p>
            </div>
            <div className="lp-how">
              {[
                { n: '01', I: Fingerprint, t: 'Generate Your RTID', d: 'Receive a unique RaktPort Transfusion ID — your digital identity for every donation, fully traceable across the network.' },
                { n: '02', I: Activity, t: 'Get Matched Instantly', d: 'Our intelligent matching system connects you with the nearest hospital or urgent blood request in real time.' },
                { n: '03', I: MapPin, t: 'Donate Anywhere', d: 'Walk into any verified partner blood bank or donation camp. Your RTID works across all locations nationwide.' },
                { n: '04', I: Award, t: 'Track Your Impact', d: 'Follow your donation digitally — from collection to transfusion. Receive your Digital Impact Certificate.' },
              ].map((s, i) => (
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

        {/* ══ 5. FEATURES — "What You Can Do with RaktPort" ══ */}
        <section className="lp-sec lp-cream" ref={r2}>
          <div className="lp-c">
            <div className="lp-sh">
              <p className="lp-ey lp-eyr">Platform Features</p>
              <h2 className="lp-h2 lp-h2d">What You Can Do with <span className="lp-red">RaktPort</span></h2>
              <p className="lp-sub lp-subd">Every feature designed around your impact — not just functionality</p>
            </div>
            <div className="lp-feat-grid">
              <FeatureCard
                icon={<Globe size={22} />}
                title="Donate Anywhere Using RTID"
                desc="Your unique RTID works across 851+ verified blood banks and hospitals nationwide — no geographical limitations."
              />
              <FeatureCard
                icon={<Zap size={22} />}
                title="Emergency Blood Matching in Minutes"
                desc="Smart matching connects urgent requests with compatible donors nearby."
              />
              <FeatureCard
                icon={<Activity size={22} />}
                title="Track Your Donation Journey"
                desc="Follow your blood from collection to transfusion in real time. Know exactly where your donation went and who it helped."
              />
              <FeatureCard
                icon={<Search size={22} />}
                title="Find Verified Blood Banks"
                desc="Access a comprehensive directory of NACO-verified blood banks, donation camps, and hospital blood centres near you."
              />
              <FeatureCard
                icon={<ShieldCheck size={22} />}
                title="Smart Eligibility Check"
                desc="Instantly check if you're eligible to donate based on NACO guidelines — component-specific intervals and health criteria."
              />
              <FeatureCard
                icon={<Award size={22} />}
                title="Digital Impact Certificate"
                desc="Receive a verified Digital Impact Certificate after every donation — shareable, trackable, and proof of your life-saving contribution."
              />
            </div>
          </div>
        </section>

        {/* ══ 6. BLOOD GROUP GUIDE ══ */}
        <section className="lp-sec lp-light" ref={r3}>
          <div className="lp-c">
            <div className="lp-sh">
              <p className="lp-ey lp-eyr">Quick Reference</p>
              <h2 className="lp-h2 lp-h2d">Blood Group <span className="lp-red">Guide</span></h2>
              <p className="lp-sub lp-subd">Tap any blood type to see full compatibility .</p>
              <p className="lp-sub lp-subd"><b>O−</b> is the <b>  universal donor</b></p>
              <p className="lp-sub lp-subd"><b>AB+</b> is the <b>universal recipient</b></p>
            </div>
            <div className="lp-bgl">
              <div className="lp-bgl-l">
                <div className="lp-bgrid">
                  {BLOOD_TYPES.map(b => (
                    <button key={b.type} className={`lp-bc${selBlood === b.type ? ' on' : ''}${b.tag ? ' special' : ''}`}
                      onClick={() => setSelBlood(p => p === b.type ? null : b.type)} aria-pressed={selBlood === b.type}>
                      <span className="lp-btype">{b.type}</span>
                      {b.tag && <span className="lp-btag">{b.tag.includes('Donor') ? 'Universal Donor' : 'Universal Recipient'}</span>}
                      <span className="lp-bhint">{selBlood === b.type ? '▲' : 'tap'}</span>
                    </button>
                  ))}
                </div>
                {selBlood && (() => {
                  const info = BLOOD_TYPES.find(b => b.type === selBlood)!; return (
                    <div className="lp-binfo">
                      <div className="lp-binfo-top">
                        <span className="lp-binfo-ty">{info.type}</span>
                        {info.tag && <span className="lp-binfo-tag">{info.tag}</span>}
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

        {/* ══ 7. RTID TRACKER ══ */}
        <section className="lp-sec lp-dark lp-rel" ref={r4}>
          <div className="lp-gbg" aria-hidden="true" />
          <div className="lp-c lp-rel">
            <div className="lp-sh">
              <p className="lp-ey">RTID Technology</p>
              <h2 className="lp-h2">Track Your <span className="lp-red">Donation</span></h2>
              <p className="lp-sub">Enter your RTID to track your donation across hospitals and see its real-time impact — from collection to transfusion.</p>
            </div>
            <div className="lp-rtl">
              <div className="lp-rtl-left"><NetworkSVG /></div>
              <div className="lp-rtbox">
                <p className="lp-rthdr"><Activity size={13} /> Live RTID Tracker</p>
                <p className="lp-rtfmt">Format: <code>D/R-RTID-DDMMYY-AXXXX</code></p>
                <div className="lp-rtrow">
                  <input className="lp-rtin" placeholder="e.g. D-RTID-060426-A4F7K" value={rtidIn}
                    onChange={e => { setRtidIn(e.target.value); setRtidRes(null); setRtidErr(''); }} onKeyDown={e => e.key === 'Enter' && track()} />
                  <button className="lp-rtbtn" onClick={track} disabled={rtidLoading}>
                    {rtidLoading ? <span className="lp-spin" /> : 'Track'}
                  </button>
                </div>
                {rtidErr && <p className="lp-rterr"><AlertCircle size={12} /> {rtidErr}</p>}
                {rtidLoading && <div className="lp-rt-loading"><span className="lp-spin" /> Fetching donation data…</div>}
                {rtidRes && (
                  <>
                    <div className="lp-rt-success"><CheckCircle2 size={14} /> Donation record found!</div>
                    <div className="lp-steps">
                      {(rtidRes.type === 'D' ? D_RTID_STEPS : R_RTID_STEPS).map((step, i) => {
                        const done = i < rtidRes.current, act = i === rtidRes.current - 1, last = i === 5; return (
                          <div key={step} className="lp-scol">
                            {!last && <div className={`lp-sline${done ? ' ok' : ''}`} />}
                            <div className={`lp-scirc${done ? ' done' : ''}${act ? ' act' : ''}`}>{done ? '✓' : i + 1}</div>
                            <p className={`lp-slbl${(done || act) ? ' hi' : ''}`}>{step}</p>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
                {rtidRes?.record && <p className="lp-rtdet">Patient: <strong>{rtidRes.record.patientName}</strong> · Blood: <strong style={{ color: '#FF6B6B' }}>{rtidRes.record.bloodGroup}</strong></p>}
              </div>
            </div>
          </div>
          <EcgLine id="r-ecg" opacity={0.35} />
        </section>

        {/* ══ 8. COMPACT ELIGIBILITY CHECKER ══ */}
        <section className="lp-sec lp-cream" ref={r5}>
          <div className="lp-c">
            <div className="lp-ell">
              <div className="lp-ell-l">
                <p className="lp-ey lp-eyr">Donor Tool</p>
                <h2 className="lp-h2 lp-h2d">When Can I <span className="lp-red">Donate Again?</span></h2>
                <p className="lp-sub lp-subd">Check eligibility based on NACO guidelines instantly.</p>
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

        {/* ══ 9. IMPACT SECTION — Dynamic ══ */}
        <section className="lp-sec lp-light" id="impact" ref={r6}>
          <div className="lp-c">
            <div className="lp-sh">
              <p className="lp-ey lp-eyr">Making A Difference</p>
              <h2 className="lp-h2 lp-h2d">Your Impact <span className="lp-red">Matters</span></h2>
              <p className="lp-sub lp-subd">RaktPort connects donors, hospitals, and blood banks into a unified network — ensuring blood reaches patients faster and smarter.</p>
            </div>

            {/* Dynamic impact personalisation */}
            <div className="lp-impact-personal">
              <div className="lp-impact-card lp-impact-zero">
                <div className="lp-impact-ico">🩸</div>
                <h3 className="lp-impact-stat">You have saved <span className="lp-red">0 lives</span> yet</h3>
                <p className="lp-impact-msg">Your next donation can save <strong>3 lives</strong>. Join thousands of donors making a difference every day.</p>
                <div className="lp-impact-bar">
                  <div className="lp-impact-fill" style={{ width: '0%' }} />
                </div>
                <span className="lp-impact-label">0 of 3 lives — your first donation awaits</span>
                <button className="lp-btn lp-impact-cta" onClick={onDonorSignupClick}>
                  <Heart size={15} /> Start Your Journey
                </button>
              </div>
              <div className="lp-impact-card lp-impact-next">
                <div className="lp-impact-ico">🎯</div>
                <h3 className="lp-impact-stat">Your next donation<br />can save <span className="lp-red">3 lives</span></h3>
                <p className="lp-impact-msg">Every unit of blood separates into red cells, plasma, and platelets — reaching 3 different patients in need.</p>
                <div className="lp-impact-checks-sm">
                  {['Red Blood Cells → Trauma patients', 'Plasma → Burn victims', 'Platelets → Cancer patients'].map(item => (
                    <div key={item} className="lp-impact-chk-sm"><CheckCircle2 size={14} /> <span>{item}</span></div>
                  ))}
                </div>
              </div>
            </div>

            {/* RTID journey diagram */}
            <div className="lp-imp-grid">
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
              </div>
            </div>
          </div>
        </section>

        {/* ══ 10. STORIES OF HOPE ══ */}
        <section className="lp-sec lp-cream" ref={r7}>
          <div className="lp-c">
            <div className="lp-sh">
              <p className="lp-ey lp-eyr">Real Stories</p>
              <h2 className="lp-h2 lp-h2d">Stories of <span className="lp-red">Hope</span></h2>
              <p className="lp-sub lp-subd">Real voices from donors and recipients whose lives were changed through RaktPort.</p>
            </div>
            <div className="lp-stories-grid">
              {STORIES.map((s, i) => (
                <div key={i} className="lp-story-card">
                  <div className="lp-story-hdr">
                    <div className="lp-story-av">{s.initials}</div>
                    <div>
                      <p className="lp-story-name">{s.name}</p>
                      <p className="lp-story-city">{s.city} · <span className="lp-story-role">{s.role}</span></p>
                    </div>
                  </div>
                  <div className="lp-story-stars">
                    {Array.from({ length: s.stars }).map((_, j) => <Star key={j} size={13} fill="#E8294A" color="#E8294A" />)}
                  </div>
                  <p className="lp-story-quote">"{s.quote}"</p>
                  <div className="lp-story-foot">
                    {s.donations > 0 && <span className="lp-story-don">🩸 {s.donations} Donations</span>}
                    {s.donations === 0 && <span className="lp-story-recipt">💝 Recipient Story</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ 11. FINAL CTA ══ */}
        <section className="lp-sec lp-dark lp-rel" ref={r8}>
          <div className="lp-c lp-rel">
            <div className="lp-final">
              <p className="lp-ey">Take Action</p>
              <h2 className="lp-h2" style={{ marginBottom: 8 }}>Ready to <span className="lp-red">save lives?</span></h2>
              <p className="lp-ft-sub">Every donation matters. Every second counts. Begin your journey today.</p>
              <div className="lp-fbtns">
                <button className="lp-btn lp-blg" onClick={onDonorSignupClick}><Droplets size={16} /> Register as a Donor Today</button>
                <button className="lp-bto" onClick={() => setEmergOpen(true)}><AlertCircle size={14} /> Request Emergency Blood</button>
              </div>
            </div>
          </div>
          <EcgLine id="f-ecg" opacity={0.28} />
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
  --dark:#020617;--dark2:#0f172a;--dark3:#1e293b;
  --lght:#FFFFFF;--crm:#FFF8F5;
  --tx:#1A0505;--mt:#7A6060;
  --ok:#10B981;--bd:rgba(196,30,58,.14);
  --rp-primary:#C41E3A;--rp-primary-dark:#7A0E1E;
  --rp-bg-dark:#020617;--rp-text:#1A0505;--clr-brand:#8B0000;
}

/* ── Base ── */
.lp,.lp *{font-family:'DM Sans',system-ui,sans-serif;box-sizing:border-box;margin:0;padding:0;}
.lp{background:#fff;color:var(--tx);}
.lp-c{max-width:1200px;margin:0 auto;padding:0 22px;}
.lp-rel{position:relative;}
.lp-sec{padding:80px 0;}
.lp-light{background:#fff;}.lp-cream{background:var(--crm);}.lp-dark{background:var(--dark);color:#fff;}

/* ── Reveal ── */
.lp-stats,.lp-sec{opacity:0;transform:translateY(22px);transition:opacity .65s cubic-bezier(.22,1,.36,1),transform .65s cubic-bezier(.22,1,.36,1);}
.lp-vis{opacity:1!important;transform:none!important;}

/* ── Grid bg ── */
.lp-gbg{position:absolute;inset:0;pointer-events:none;
  background-image:linear-gradient(rgba(196,30,58,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(196,30,58,.04) 1px,transparent 1px);
  background-size:40px 40px;}

/* ── Typography ── */
.lp-sh{text-align:center;margin-bottom:48px;}
.lp-ey{display:inline-flex;align-items:center;gap:8px;font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:12px;}
.lp-ey::before,.lp-ey::after{content:'';width:18px;height:1px;background:currentColor;opacity:.5;}
.lp-eyr{color:var(--p);}
.lp-h2{font-family:'Sora',Georgia,serif;font-weight:800;font-size:clamp(1.8rem,4vw,2.55rem);letter-spacing:-.04em;color:#fff;line-height:1.1;}
.lp-h2d{color:var(--tx)!important;}
.lp-red{color:var(--p);}
.lp-sub{font-size:14px;color:rgba(255,255,255,.46);margin-top:10px;line-height:1.7;max-width:520px;margin-left:auto;margin-right:auto;}
.lp-subd{color:var(--mt)!important;}
.lp-tl{display:inline-flex;align-items:center;gap:6px;color:var(--p);font-size:13px;font-weight:600;text-decoration:none;border-bottom:1px solid rgba(196,30,58,.3);padding-bottom:1px;transition:border-color .2s;margin-top:16px;}
.lp-tl:hover{border-color:var(--p);}

/* ── Form ── */
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

/* ── Illustration ── */
.lp-ill{width:100%;max-width:240px;display:block;margin:0 auto;}

/* ── ECG ── */
.lp-ecg{width:100%;height:48px;display:block;}
.lp-ecg-path{stroke-dasharray:900;stroke-dashoffset:900;animation:lpEcg 5s ease-in-out infinite;}

/* ════ HERO ════ */
.lp-hero{background:linear-gradient(155deg,#020617 0%,#0f172a 42%,#020617 100%);position:relative;overflow:hidden;padding:60px 0 0;}
.lp-orb{position:absolute;border-radius:50%;pointer-events:none;filter:blur(70px);}
.o1{width:480px;height:480px;background:radial-gradient(circle,rgba(196,30,58,.16),transparent 70%);top:-120px;right:-80px;}
.o2{width:300px;height:300px;background:radial-gradient(circle,rgba(122,14,30,.2),transparent 70%);bottom:0;left:28%;}
.o3{width:200px;height:200px;background:radial-gradient(circle,rgba(196,30,58,.1),transparent 70%);top:40%;left:-50px;}

.lp-hero-split{display:flex;align-items:center;gap:48px;max-width:1200px;margin:0 auto;padding:0 22px;position:relative;z-index:1;min-height:480px;}
.lp-hero-left{flex:1.2;min-width:0;}
.lp-hero-right{flex:0.8;display:flex;justify-content:center;align-items:center;}

.lp-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(196,30,58,.14);border:1px solid rgba(196,30,58,.28);color:rgba(255,180,180,.9);font-size:9.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:5px 13px;border-radius:999px;width:fit-content;margin-bottom:20px;}
.lp-bdot{width:6px;height:6px;border-radius:50%;background:#E8294A;flex-shrink:0;animation:lpPulse 1.5s ease-in-out infinite;}

.lp-h1{font-family:'Sora',serif;font-weight:800;font-size:clamp(1.8rem,3.5vw,2.8rem);letter-spacing:-.04em;color:#fff;line-height:1.18;margin-bottom:18px;}
.lp-h1-em{color:var(--pl);display:inline;}
.lp-h1-you{color:#fff;display:inline;position:relative;}

.lp-hero-sub{font-size:14.5px;color:rgba(255,255,255,.52);line-height:1.8;margin-bottom:28px;max-width:540px;}
.lp-hero-sub strong{color:rgba(255,255,255,.8);}

/* Hero stats mini */
.lp-hero-stats{display:flex;align-items:center;gap:0;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:14px;padding:14px 4px;}
.lp-hs{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:0 8px;}
.lp-hsn{font-family:'Sora',serif;font-weight:800;font-size:1.1rem;color:var(--p);letter-spacing:-.03em;line-height:1;}
.lp-hsl{font-size:9px;font-weight:600;color:rgba(255,255,255,.4);letter-spacing:.06em;text-transform:uppercase;}
.lp-hs-div{width:1px;height:28px;background:rgba(255,255,255,.1);flex-shrink:0;}

/* CTA Card */
.lp-cta-card{position:relative;background:rgba(255,255,255,0.04);border:1.5px solid rgba(255,255,255,0.1);border-radius:24px;padding:36px 30px;backdrop-filter:blur(12px);overflow:hidden;max-width:380px;width:100%;}
.lp-cta-glow{position:absolute;top:-40px;right:-40px;width:160px;height:160px;background:radial-gradient(circle,rgba(196,30,58,.25),transparent 70%);pointer-events:none;}
.lp-cta-lead{font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:12px;}
.lp-cta-head{font-family:'Sora',serif;font-weight:800;font-size:1.5rem;color:#fff;letter-spacing:-.03em;line-height:1.2;margin-bottom:24px;}

.lp-btn-hero{width:100%;padding:16px 28px;font-size:16px;border-radius:14px;box-shadow:0 6px 28px rgba(196,30,58,.45);margin-bottom:12px;}
.lp-btn-hero:hover{transform:translateY(-3px);box-shadow:0 10px 36px rgba(196,30,58,.55);}
.lp-btn-emg{width:100%;justify-content:center;margin-bottom:20px;}

.lp-comp-row{display:flex;flex-wrap:wrap;gap:6px;}
.lp-comp-tag{display:inline-flex;align-items:center;gap:5px;font-size:9.5px;font-weight:600;color:rgba(74,222,128,.8);background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.18);padding:4px 10px;border-radius:6px;}

/* ════ WHY DONATE (Dark Section) ════ */
.lp-why-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;padding:0 0 20px;}
.lp-why-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:22px;padding:28px 22px;transition:all .24s;text-align:center;}
.lp-why-card:hover{background:rgba(255,255,255,.07);border-color:rgba(196,30,58,.28);transform:translateY(-3px);}
.lp-why-stat{display:flex;flex-direction:column;margin-bottom:18px;align-items:center;}
.lp-why-num{font-family:'Sora',serif;font-weight:800;font-size:2.4rem;color:var(--p);letter-spacing:-.04em;line-height:1;}
.lp-why-unit{font-size:10px;color:rgba(255,255,255,.3);font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin-top:2px;}
.lp-why-ico{width:44px;height:44px;border-radius:12px;background:rgba(196,30,58,.2);border:1px solid rgba(196,30,58,.28);display:flex;align-items:center;justify-content:center;color:#ff8fa3;margin:0 auto 14px;}
.lp-why-t{font-family:'Sora',serif;font-weight:700;font-size:.9rem;color:rgba(255,255,255,.9);margin-bottom:8px;}
.lp-why-d{font-size:12.5px;color:rgba(255,255,255,.42);line-height:1.8;}

/* ════ STATS ════ */
.lp-stats{background:linear-gradient(90deg,#6A0B1A 0%,#C41E3A 50%,#6A0B1A 100%);padding:32px 0;}
.lp-stats-inner{text-align:center;}
.lp-stats-lead{margin-bottom:20px;}
.lp-stats-big{font-family:'Sora',serif;font-weight:800;font-size:clamp(1.2rem,3vw,1.6rem);color:#fff;letter-spacing:-.03em;}
.lp-stats-row{display:flex;align-items:center;justify-content:center;gap:0;flex-wrap:wrap;}
.lp-stat{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 32px;border-right:1px solid rgba(255,255,255,.11);}
.lp-stat:last-of-type{border-right:none;}
.lp-si{font-size:1.2rem;line-height:1;}
.lp-sn{font-family:'Sora',serif;font-weight:800;font-size:1.55rem;color:#fff;letter-spacing:-.04em;line-height:1;}
.lp-sl{font-size:9.5px;font-weight:600;color:rgba(255,255,255,.52);letter-spacing:.07em;text-transform:uppercase;text-align:center;}
.lp-live{display:flex;align-items:center;gap:6px;margin-left:16px;background:rgba(74,222,128,.12);border:1px solid rgba(74,222,128,.28);color:#4ade80;font-size:9.5px;font-weight:800;letter-spacing:.14em;padding:5px 14px;border-radius:999px;}
.lp-ldot{width:6px;height:6px;border-radius:50%;background:#4ade80;flex-shrink:0;display:inline-block;animation:lpPulse 1.5s ease-in-out infinite;}

/* ════ HOW IT WORKS ════ */
.lp-how{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;max-width:960px;margin:0 auto;position:relative;}
.lp-hw{background:#fff;border:1.5px solid rgba(196,30,58,.08);border-radius:20px;padding:26px 16px;text-align:center;position:relative;transition:all .24s;}
.lp-hw:hover{border-color:rgba(196,30,58,.2);transform:translateY(-4px);box-shadow:0 12px 32px rgba(196,30,58,.07);}
.lp-hwn{font-family:'Sora',serif;font-weight:800;font-size:2rem;color:rgba(196,30,58,.11);letter-spacing:-.04em;margin-bottom:12px;line-height:1;}
.lp-hwi{width:46px;height:46px;border-radius:13px;background:linear-gradient(135deg,var(--p),var(--pd));display:flex;align-items:center;justify-content:center;color:#fff;margin:0 auto 14px;box-shadow:0 5px 14px rgba(196,30,58,.28);}
.lp-hwt{font-family:'Sora',serif;font-weight:700;font-size:.87rem;color:var(--tx);margin-bottom:7px;}
.lp-hwd{font-size:12px;color:var(--mt);line-height:1.75;}
.lp-hwarr{position:absolute;right:-14px;top:50%;transform:translateY(-50%);color:rgba(196,30,58,.28);z-index:2;}

/* ════ FEATURES ════ */
.lp-feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}
.lp-feat{background:#fff;border:1.5px solid rgba(196,30,58,.1);border-radius:18px;padding:26px 20px;transition:all .26s;position:relative;overflow:hidden;cursor:default;}
.lp-feat::before{content:'';position:absolute;inset:0;opacity:0;background:linear-gradient(135deg,rgba(196,30,58,.06),transparent 60%);transition:opacity .22s;}
.lp-feat:hover{transform:translateY(-4px);border-color:rgba(196,30,58,.28);box-shadow:0 14px 36px rgba(196,30,58,.1);}
.lp-feat:hover::before{opacity:1;}
.lp-feat-ico{width:46px;height:46px;border-radius:13px;background:linear-gradient(135deg,rgba(196,30,58,.12),rgba(196,30,58,.05));border:1.5px solid rgba(196,30,58,.15);display:flex;align-items:center;justify-content:center;color:var(--p);margin-bottom:14px;}
.lp-feat-t{font-family:'Sora',serif;font-weight:700;font-size:.87rem;color:var(--tx);margin-bottom:7px;line-height:1.3;}
.lp-feat-d{font-size:12.5px;color:var(--mt);line-height:1.75;}

/* ════ BLOOD GUIDE ════ */
.lp-bgl{display:grid;grid-template-columns:1fr 240px;gap:48px;align-items:start;}
.lp-bgl-l{min-width:0;}.lp-bgl-r{width:240px;display:flex;align-items:center;justify-content:center;}
.lp-bgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:22px 0;}
.lp-bc{border-radius:14px;border:1.5px solid rgba(196,30,58,.13);background:#fff;padding:16px 6px 12px;text-align:center;cursor:pointer;transition:all .22s;display:flex;flex-direction:column;align-items:center;gap:5px;font-family:'DM Sans',sans-serif;-webkit-tap-highlight-color:transparent;}
.lp-bc:hover{border-color:var(--p);transform:translateY(-3px);box-shadow:0 7px 18px rgba(196,30,58,.11);}
.lp-bc.on{border-color:var(--p)!important;background:linear-gradient(145deg,#fff5f5,#ffeeee);box-shadow:0 8px 24px rgba(196,30,58,.17);transform:translateY(-3px);}
.lp-bc.special{border-color:rgba(196,30,58,.28)!important;background:linear-gradient(145deg,#fff8f5,#fff0ee);}
.lp-btype{font-family:'Sora',serif;font-weight:800;font-size:1.25rem;color:var(--p);letter-spacing:-.03em;line-height:1;}
.lp-btag{font-size:7px;font-weight:700;color:var(--p);letter-spacing:.05em;text-transform:uppercase;background:rgba(196,30,58,.08);padding:2px 6px;border-radius:4px;margin-top:2px;}
.lp-bhint{font-size:9px;color:var(--mt);}
.lp-binfo{background:#fff;border:1.5px solid rgba(196,30,58,.17);border-radius:16px;padding:18px;animation:lpUp .2s ease;margin-top:4px;}
.lp-binfo-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;gap:8px;}
.lp-binfo-ty{font-family:'Sora',serif;font-weight:800;font-size:1.75rem;color:var(--p);letter-spacing:-.04em;}
.lp-binfo-tag{font-size:10px;font-weight:700;color:var(--p);background:rgba(196,30,58,.08);padding:3px 10px;border-radius:999px;white-space:nowrap;}
.lp-binfo-x{background:#fff5f5;border:1px solid rgba(196,30,58,.2);border-radius:7px;padding:4px 12px;font-size:11px;color:var(--p);font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;margin-left:auto;}
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
.lp-rtfmt{font-size:11px;color:rgba(255,255,255,.3);margin-bottom:4px;}
.lp-rtex{font-size:11px;color:rgba(255,255,255,.22);margin-bottom:14px;}
.lp-rtex code,.lp-rtfmt code{background:rgba(255,255,255,.06);padding:2px 8px;border-radius:5px;font-family:monospace;color:rgba(255,180,160,.72);}
.lp-rtrow{display:flex;gap:10px;}
.lp-rtin{flex:1;padding:11px 14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:10px;color:#fff;font-size:13px;font-family:'DM Sans',sans-serif;outline:none;transition:border-color .18s;}
.lp-rtin::placeholder{color:rgba(255,255,255,.24);}.lp-rtin:focus{border-color:rgba(196,30,58,.7);}
.lp-rtbtn{padding:11px 20px;background:linear-gradient(135deg,var(--p),var(--pd));color:#fff;border:none;border-radius:10px;font-size:13.5px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;white-space:nowrap;box-shadow:0 4px 16px rgba(196,30,58,.38);transition:all .2s;display:flex;align-items:center;gap:6px;}
.lp-rtbtn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 20px rgba(196,30,58,.5);}
.lp-rtbtn:disabled{opacity:.7;cursor:not-allowed;}
.lp-rterr{color:#fca5a5;font-size:12px;margin-top:8px;display:flex;align-items:center;gap:5px;}
.lp-rt-loading{color:rgba(255,255,255,.5);font-size:12px;margin-top:12px;display:flex;align-items:center;gap:8px;}
.lp-rt-success{color:#4ade80;font-size:12px;margin-top:12px;display:flex;align-items:center;gap:6px;font-weight:600;}
.lp-steps{display:flex;margin-top:16px;overflow-x:auto;padding-bottom:6px;scrollbar-width:none;-webkit-overflow-scrolling:touch;}
.lp-steps::-webkit-scrollbar{display:none;}
.lp-scol{display:flex;flex-direction:column;align-items:center;flex:1 0 55px;position:relative;}
.lp-sline{position:absolute;top:14px;left:calc(50% + 15px);width:calc(100% - 30px);height:2px;background:rgba(255,255,255,.1);z-index:0;}
.lp-sline.ok{background:var(--ok);}
.lp-scirc{width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.09);border:2px solid transparent;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:rgba(255,255,255,.28);position:relative;z-index:1;flex-shrink:0;}
.lp-scirc.done{background:var(--ok);color:#014012;}.lp-scirc.act{background:rgba(196,30,58,.3);color:#fff;border-color:var(--p);box-shadow:0 0 10px rgba(196,30,58,.5);}
.lp-slbl{font-size:8.5px;color:rgba(255,255,255,.26);margin-top:6px;text-align:center;line-height:1.3;max-width:52px;}.lp-slbl.hi{color:rgba(255,255,255,.76);}
.lp-rtdet{font-size:11px;color:rgba(255,255,255,.36);text-align:center;margin-top:10px;}

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

/* ════ IMPACT PERSONAL ════ */
.lp-impact-personal{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:52px;}
.lp-impact-card{background:#fff;border:1.5px solid rgba(196,30,58,.1);border-radius:22px;padding:32px 26px;transition:all .26s;}
.lp-impact-card:hover{transform:translateY(-3px);box-shadow:0 14px 40px rgba(196,30,58,.08);}
.lp-impact-ico{font-size:2.4rem;margin-bottom:16px;}
.lp-impact-stat{font-family:'Sora',serif;font-weight:800;font-size:1.2rem;color:var(--tx);letter-spacing:-.03em;line-height:1.3;margin-bottom:10px;}
.lp-impact-msg{font-size:13px;color:var(--mt);line-height:1.75;margin-bottom:16px;}
.lp-impact-bar{width:100%;height:8px;background:rgba(196,30,58,.08);border-radius:999px;overflow:hidden;margin-bottom:8px;}
.lp-impact-fill{height:100%;background:linear-gradient(90deg,var(--p),var(--pl));border-radius:999px;transition:width 1s ease;}
.lp-impact-label{font-size:10.5px;color:var(--mt);display:block;margin-bottom:18px;}
.lp-impact-cta{width:100%;}
.lp-impact-checks-sm{display:flex;flex-direction:column;gap:10px;}
.lp-impact-chk-sm{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--tx);font-weight:500;}
.lp-impact-chk-sm svg{color:var(--ok);flex-shrink:0;}

/* ════ IMPACT GRID ════ */
.lp-imp-grid{max-width:680px;margin:0 auto;}
.lp-imp-content{}
.lp-imp-desc{font-size:14.5px;color:var(--mt);line-height:1.85;margin-bottom:28px;text-align:center;}
.lp-imp-checks{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.lp-imp-chk{display:flex;align-items:center;gap:12px;font-size:13.5px;font-weight:500;color:var(--tx);}
.lp-imp-ico{width:32px;height:32px;border-radius:50%;background:rgba(16,185,129,.1);border:1.5px solid rgba(16,185,129,.2);display:flex;align-items:center;justify-content:center;color:#10B981;flex-shrink:0;}

/* ════ STORIES ════ */
.lp-stories-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
.lp-story-card{background:#fff;border:1.5px solid rgba(196,30,58,.08);border-radius:20px;padding:24px;transition:all .26s;}
.lp-story-card:hover{transform:translateY(-4px);border-color:rgba(196,30,58,.2);box-shadow:0 12px 36px rgba(196,30,58,.08);}
.lp-story-hdr{display:flex;align-items:center;gap:12px;margin-bottom:12px;}
.lp-story-av{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#C41E3A,#7A0E1E);display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;color:#fff;flex-shrink:0;letter-spacing:-.02em;box-shadow:0 4px 14px rgba(196,30,58,.3);}
.lp-story-name{font-family:'Sora',serif;font-weight:700;font-size:.92rem;color:var(--tx);line-height:1.2;}
.lp-story-city{font-size:11.5px;color:var(--mt);font-weight:500;margin-top:2px;}
.lp-story-role{color:var(--p);font-weight:600;}
.lp-story-stars{display:flex;gap:2px;margin-bottom:10px;}
.lp-story-quote{font-size:13.5px;color:var(--mt);line-height:1.8;font-style:italic;margin-bottom:16px;min-height:80px;}
.lp-story-foot{display:flex;align-items:center;padding-top:14px;border-top:1px solid rgba(196,30,58,.07);}
.lp-story-don{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:var(--p);}
.lp-story-recipt{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:var(--ok);}

/* ════ FINAL CTA ════ */
.lp-final{display:flex;flex-direction:column;align-items:center;padding:20px 0;gap:12px;text-align:center;}
.lp-ft-sub{font-size:14px;color:rgba(255,255,255,.42);margin-bottom:16px;max-width:420px;}
.lp-fbtns{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;}

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
@keyframes lpEcg  {0%{stroke-dashoffset:900}55%{stroke-dashoffset:0}100%{stroke-dashoffset:-900}}
@keyframes lpFade {from{opacity:0}to{opacity:1}}
@keyframes lpUp   {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes lpSpin {to{transform:rotate(360deg)}}

/* ═══════════════════════════════════════════
   RESPONSIVE
═══════════════════════════════════════════ */
@media(max-width:1024px){
  .lp-hero-split{gap:32px;}
  .lp-bgl{grid-template-columns:1fr 200px;gap:32px;}
  .lp-bgl-r{width:200px;}
  .lp-rtl{grid-template-columns:1fr 1.2fr;gap:32px;}
  .lp-ell{grid-template-columns:1fr 1fr;gap:36px;}
  .lp-impact-personal{gap:18px;}
}
@media(max-width:860px){
  .lp-hero-split{flex-direction:column;gap:28px;min-height:auto;padding:0 18px;}
  .lp-hero-right{width:100%;}
  .lp-cta-card{max-width:100%;}
  .lp-hero{padding:40px 0 0;}
  .lp-why-grid{grid-template-columns:1fr 1fr;gap:14px;}
  .lp-feat-grid{grid-template-columns:repeat(2,1fr);}
  .lp-bgl{grid-template-columns:1fr;gap:24px;}
  .lp-bgl-r{order:-1;margin-bottom:8px;}
  .lp-bgl-r svg{max-width:180px!important;}
  .lp-bgrid{grid-template-columns:repeat(4,1fr);}
  .lp-rtl{grid-template-columns:1fr;gap:24px;}
  .lp-ell{grid-template-columns:1fr;gap:24px;}
  .lp-ell-l{align-items:center;text-align:center;}
  .lp-how{grid-template-columns:repeat(2,1fr);gap:14px;}.lp-hwarr{display:none;}
  .lp-impact-personal{grid-template-columns:1fr;}
  .lp-imp-checks{grid-template-columns:1fr;}
  .lp-stories-grid{grid-template-columns:1fr 1fr;gap:16px;}
  .lp-stats-row{flex-wrap:wrap;gap:8px;}
  .lp-stat{min-width:100px;padding:6px 18px;}
}
@media(max-width:600px){
  .lp-sec{padding:56px 0;}.lp-c{padding:0 16px;}
  .lp-h2{font-size:1.75rem!important;}.lp-sh{margin-bottom:32px;}
  .lp-hero-split{padding:0 16px;}
  .lp-hero-stats{flex-wrap:wrap;gap:8px;}
  .lp-hs-div{display:none;}
  .lp-hs{min-width:calc(33% - 8px);}
  .lp-why-grid{grid-template-columns:1fr;}
  .lp-feat-grid{grid-template-columns:1fr 1fr;gap:11px;}
  .lp-feat{padding:18px 14px;}.lp-feat-t{font-size:.82rem;}.lp-feat-d{font-size:11.5px;}
  .lp-bgrid{grid-template-columns:repeat(4,1fr);gap:8px;}
  .lp-bc{padding:13px 4px 9px;}.lp-btype{font-size:1.1rem;}
  .lp-bcompat{grid-template-columns:1fr;}
  .lp-bgl-r svg{max-width:140px!important;}
  .lp-rtrow{flex-direction:column;gap:8px;}.lp-rtbtn{width:100%;justify-content:center;}
  .lp-how{grid-template-columns:1fr;}
  .lp-ef{grid-template-columns:1fr;}.lp-ef-full{grid-column:auto;}
  .lp-ell-l{align-items:center;text-align:center;}
  .lp-fbtns{flex-direction:column;align-items:stretch;}
  .lp-blg,.lp-bto{width:100%;justify-content:center;}
  .lp-mg{grid-template-columns:1fr;}
  .lp-stories-grid{grid-template-columns:1fr;}
  .lp-stats-lead{margin-bottom:12px;}
  .lp-stats-big{font-size:1.1rem;}
  .lp-stat{min-width:90px;padding:6px 14px;}
  .lp-live{flex-shrink:0;margin-left:10px;}
}
@media(max-width:380px){
  .lp-feat-grid{grid-template-columns:1fr;}
  .lp-bgrid{gap:6px;}.lp-btype{font-size:.95rem;}
  .lp-h1{font-size:1.55rem;}
  .lp-c{padding:0 13px;}
}

/* ═══════════════════════════════════════════
   DARK MODE — COMPLETE
═══════════════════════════════════════════ */
.dark .lp{
  --tx:#F0E0DD;--mt:#9A8A82;--bd:rgba(196,30,58,.22);
}
.dark .lp{background:var(--dark);}
.dark .lp-light{background:#020617;}
.dark .lp-cream{background:#0f172a;}
.dark .lp-red{color:#ffffff!important;}

/* Section headings */
.dark .lp-h2d{color:#F0E0DD!important;}
.dark .lp-subd{color:#9A8A82!important;}
.dark .lp-eyr{color:var(--p);}

/* Features */
.dark .lp-feat{background:#1A0A0E!important;border-color:rgba(196,30,58,.18)!important;}
.dark .lp-feat::before{background:linear-gradient(135deg,rgba(196,30,58,.08),transparent 60%)!important;}
.dark .lp-feat:hover{border-color:rgba(196,30,58,.38)!important;box-shadow:0 14px 36px rgba(0,0,0,.4)!important;}
.dark .lp-feat-t{color:#F0E0DD!important;}
.dark .lp-feat-d{color:#9A8A82!important;}
.dark .lp-feat-ico{background:linear-gradient(135deg,rgba(196,30,58,.2),rgba(196,30,58,.08))!important;border-color:rgba(196,30,58,.25)!important;}

/* Blood guide */
.dark .lp-bc{background:#1A0A0E!important;border-color:rgba(196,30,58,.18)!important;}
.dark .lp-bc:hover{border-color:rgba(196,30,58,.42)!important;box-shadow:0 7px 18px rgba(0,0,0,.35)!important;}
.dark .lp-bc.on{background:linear-gradient(145deg,#2A1015,#1F0C10)!important;border-color:var(--p)!important;}
.dark .lp-bc.special{background:linear-gradient(145deg,#2A1015,#200C0F)!important;}
.dark .lp-bhint{color:#6A5A5A!important;}
.dark .lp-binfo{background:#1A0A0E!important;border-color:rgba(196,30,58,.22)!important;}
.dark .lp-bcd{background:#2A1015!important;border-color:rgba(196,30,58,.18)!important;}
.dark .lp-bcr{background:#0E2018!important;border-color:rgba(16,185,129,.2)!important;}
.dark .lp-bcl{color:#7A6060!important;}
.dark .lp-bcv{color:#F0E0DD!important;}
.dark .lp-binfo-x{background:#2A1015!important;border-color:rgba(196,30,58,.25)!important;}
.dark .lp-binfo-tag{background:rgba(196,30,58,.15)!important;}
.dark .lp-btag{background:rgba(196,30,58,.2)!important;}

/* How it works */
.dark .lp-hw{background:#1A0A0E!important;border-color:rgba(196,30,58,.14)!important;}
.dark .lp-hw:hover{border-color:rgba(196,30,58,.3)!important;box-shadow:0 12px 32px rgba(0,0,0,.4)!important;}
.dark .lp-hwt{color:#F0E0DD!important;}
.dark .lp-hwd{color:#9A8A82!important;}

/* Eligibility */
.dark .lp-ecard{background:#1A0A0E!important;border-color:rgba(196,30,58,.18)!important;box-shadow:0 10px 36px rgba(0,0,0,.35)!important;}
.dark .lp-inp{background:#140408!important;border-color:rgba(196,30,58,.22)!important;color:#F0E0DD!important;}
.dark .lp-inp:focus{border-color:var(--p)!important;}
.dark .lp-lbl{color:#9A8A82!important;}
.dark .lp-sel{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23C41E3A' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")!important;background-repeat:no-repeat!important;background-position:right 14px center!important;}
.dark .lp-eok{background:#0E2018!important;border-color:rgba(16,185,129,.22)!important;}
.dark .lp-ewait{background:#2A1015!important;border-color:rgba(196,30,58,.2)!important;}
.dark .lp-etitle{color:#F0E0DD!important;}
.dark .lp-emsg{color:#9A8A82!important;}

/* Impact personal */
.dark .lp-impact-card{background:#1A0A0E!important;border-color:rgba(196,30,58,.16)!important;}
.dark .lp-impact-card:hover{box-shadow:0 14px 40px rgba(0,0,0,.35)!important;}
.dark .lp-impact-stat{color:#F0E0DD!important;}
.dark .lp-impact-msg{color:#9A8A82!important;}
.dark .lp-impact-bar{background:rgba(196,30,58,.14)!important;}
.dark .lp-impact-label{color:#7A6060!important;}
.dark .lp-impact-chk-sm{color:#F0E0DD!important;}

/* Impact section */
.dark .lp-imp-desc{color:#9A8A82!important;}
.dark .lp-imp-chk{color:#F0E0DD!important;}
.dark .lp-imp-ico{background:rgba(16,185,129,.12)!important;border-color:rgba(16,185,129,.25)!important;}

/* Stories */
.dark .lp-story-card{background:#1A0A0E!important;border-color:rgba(196,30,58,.16)!important;}
.dark .lp-story-card:hover{border-color:rgba(196,30,58,.32)!important;box-shadow:0 12px 36px rgba(0,0,0,.4)!important;}
.dark .lp-story-name{color:#F0E0DD!important;}
.dark .lp-story-city{color:#9A8A82!important;}
.dark .lp-story-quote{color:#9A8A82!important;}
.dark .lp-story-foot{border-color:rgba(196,30,58,.12)!important;}

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
`}</style>
  );
}