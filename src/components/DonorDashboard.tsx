// DonorDashboard.tsx

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button }  from './ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from './ui/card';
import { Badge }   from './ui/badge';
import {
  Calendar, Heart, Printer, QrCode, Loader2, User, List, KeyRound,
  Edit2, Share2, Award, Droplet, Clock, Star, ShieldCheck, MapPin,
  Phone, Mail, CalendarCheck, Info, ChevronRight, Building2, AlertCircle,
  AlertTriangle, TrendingUp, Activity, Check, X, Timer, Zap, FileText,
  History, Gift, Bell, Eye, EyeOff, XCircle, Download, Sparkles,
  BookOpen, Flame, Target, ChevronDown, ChevronUp, RefreshCw, ExternalLink,
  Shield, Navigation, HeartHandshake, BadgeCheck
} from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from './ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogClose, DialogDescription,
} from './ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input }    from './ui/input';
import { Switch }   from './ui/switch';
import { Label }    from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { calculateDonorEligibility } from '../lib/medical-eligibility';
import QRious from 'qrious';
import { toast } from './ui/sonner';
import logo from '../assets/raktsetu-logo.jpg';
import Swal from 'sweetalert2';
import { db } from '../firebase';
import {
  doc, getDoc, collection, query, where, getDocs,
  addDoc, setDoc, updateDoc, Timestamp, deleteDoc,
} from 'firebase/firestore';

// ─────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────

/** Robust Firestore / Date parser */
const safeDate = (v: any): Date => {
  if (!v) return new Date();
  if (v?.toDate) return v.toDate();
  if (v instanceof Date && !isNaN(v.getTime())) return v;
  if (typeof v === 'string') { const d = new Date(v); if (!isNaN(d.getTime())) return d; }
  if (typeof v === 'number') return new Date(v);
  if (v?.seconds)  return new Date(v.seconds * 1000);
  return new Date();
};

/** DD/MM/YYYY */
const formatDateDMY = (d: Date | string | null | undefined): string => {
  if (!d) return 'N/A';
  try {
    const date = d instanceof Date ? d : new Date(d as string);
    if (isNaN(date.getTime())) return 'N/A';
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${date.getFullYear()}`;
  } catch { return 'N/A'; }
};

/** DD/MM/YYYY HH:MM */
const formatDateTimeDMY = (d: Date | string | null | undefined): string => {
  if (!d) return 'N/A';
  try {
    const date = d instanceof Date ? d : new Date(d as string);
    if (isNaN(date.getTime())) return 'N/A';
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${date.getFullYear()} ${hh}:${min}`;
  } catch { return 'N/A'; }
};

/** Generate unique Donor ID e.g. RKT-A1B2C3 */
export const generateDonorId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'RKT-';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
};

/** Generate appointment RTID */
const generateUniqueAppointmentRtid = async (dateStr: string): Promise<string> => {
  const d  = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'A';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `D-RTID-${dd}${mm}${yy}-${code}`;
};

const calculateAge = (dob?: string): string => {
  if (!dob) return 'N/A';
  const b = new Date(dob);
  if (isNaN(b.getTime())) return 'N/A';
  const t = new Date();
  let age = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) age--;
  return String(age);
};

const normalizeCityName = (city: string): string => {
  if (!city) return '';
  let n = city.toLowerCase().trim();
  const map: Record<string, string[]> = {
    delhi:     ['delhi','new delhi','ncr delhi','delhi ncr','nd'],
    mumbai:    ['mumbai','bombay'],
    bengaluru: ['bengaluru','bangalore'],
    kolkata:   ['kolkata','calcutta'],
    chennai:   ['chennai','madras'],
    hyderabad: ['hyderabad','hyd'],
    pune:      ['pune','poona'],
    gurugram:  ['gurugram','gurgaon'],
    noida:     ['noida','greater noida'],
  };
  for (const [std, vars] of Object.entries(map)) {
    if (vars.some(v => n.includes(v) || v.includes(n))) return std;
  }
  return n;
};

const citiesMatch = (a: string, b: string): boolean => {
  const na = normalizeCityName(a), nb = normalizeCityName(b);
  return na === nb || na.includes(nb) || nb.includes(na);
};

const convert12to24 = (t: string): string => {
  const [time, mod] = t.split(' ');
  let [h, m] = time.split(':');
  if (h === '12') h = '00';
  if (mod === 'PM') h = String(parseInt(h) + 12);
  return `${h}:${m}:00`;
};

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

type DonationComponent = 'Whole Blood' | 'Platelets' | 'Plasma' | 'PRBC';
type DonationStatus =
  | 'Scheduled' | 'Pending' | 'Donated' | 'Verified' | 'Credited'
  | 'Redeemed-Credit' | 'Pledged' | 'Completed' | 'Expired' | 'Archived' | 'Cancelled';
type Gender = 'Male' | 'Female' | 'male' | 'female';

interface DonorDashboardProps { onLogout: () => void; }

interface DonorData {
  fullName?:          string;
  bloodGroup?:        string;
  gender?:            string;
  lastDonationDate?:  string;
  city?:              string;
  pincode?:           string;
  donationsCount?:    number;
  credits?:           number;
  email?:             string;
  mobile?:            string;
  dob?:               string;
  donorId?:           string;   // RKT-XXXXXX
  availabilityMode?:  'available' | 'weekends' | 'unavailable';
}

interface Donation {
  date:         Date;
  rtidCode:     string;
  linkedHrtid:  string;
  hospitalName: string;
  city:         string;
  status:       DonationStatus;
  otp:          string;
  expiryDate?:  Date;
  component?:   DonationComponent;
  qrRedemptionStatus?: 'Redeemed' | 'Pending' | 'Expired';
  otpExpiryTime?:      Date;
  impactTimeline?:     ImpactTimeline;
  time?:        string;
}

interface ImpactTimeline {
  donated:          Date;
  linkedToRequest?: Date;
  usedByPatient?:   Date;
  creditIssued?:    Date;
}

interface BloodCenter {
  id:           string;
  name:         string;
  address:      string;
  phone:        string;
  city?:        string;
  state?:       string;
  pincode?:     string;
  latitude?:    number;
  longitude?:   number;
  fullAddress?: string;
}

interface HrtidDetails {
  patientName:     string;
  bloodGroup:      string;
  units:           string | number;
  hospital:        string;
  rtidCode:        string;
  bloodBankId:     string;
  requiredBy?:     string;
  component?:      DonationComponent;
  impactTimeline?: ImpactTimeline;
}

interface EmergencyAlert {
  id:          string;
  bloodGroup:  string;
  hospitalName:string;
  urgency:     'critical' | 'high' | 'medium';
  expiresAt:   Date;
  hrtid:       string;
  city:        string;
}

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const QUOTES = [
  "You don't have to be a doctor to save lives. Just donate blood. 🩸",
  "Your blood is a lifeline for someone in need. Be a hero today! 🦸",
  "Tears of a mother cannot save her child. But your blood can. ❤️",
  "The finest gesture one can make is to save life by donating blood. 🌟",
  "Every drop counts. Every donor matters. Thank you for being one! 🙏",
];

const HEALTH_TIPS = [
  { icon: '💧', title: 'Hydrate Well', tip: 'Drink at least 500ml of water 2 hours before donating. Proper hydration speeds up the donation process.' },
  { icon: '🥗', title: 'Eat Iron-Rich Foods', tip: 'Spinach, red meat, beans and fortified cereals boost your hemoglobin — eat them 24h before donating.' },
  { icon: '😴', title: 'Sleep Well', tip: 'Get 7–8 hours of sleep the night before donation. Fatigue affects both your eligibility and recovery.' },
  { icon: '🍊', title: 'Vitamin C Boost', tip: 'Pair iron-rich foods with citrus fruits — Vitamin C greatly enhances iron absorption.' },
  { icon: '🚫', title: 'Avoid Alcohol', tip: 'Do not consume alcohol for at least 24 hours before and after donating blood.' },
  { icon: '🏃', title: 'Light Activity Only', tip: 'Avoid strenuous exercise on donation day. Light walking is perfectly fine.' },
  { icon: '🍌', title: 'Post-Donation Snack', tip: 'Have a juice and biscuits after donation. Avoid skipping meals for the rest of the day.' },
  { icon: '📅', title: 'Track Your Dates', tip: 'Whole blood donors must wait 90 days (male) or 120 days (female) between donations.' },
];

const BLOOD_COMPATIBILITY: Record<string, { donateTo: string[]; receiveFrom: string[]; facts: string }> = {
  'A+':  { donateTo: ['A+', 'AB+'],                               receiveFrom: ['A+','A-','O+','O-'],                    facts: 'A+ is the 2nd most common blood type. Great compatibility with A and AB groups.' },
  'A-':  { donateTo: ['A+','A-','AB+','AB-'],                     receiveFrom: ['A-','O-'],                              facts: 'A- donors are valuable — they can donate to all A and AB recipients.' },
  'B+':  { donateTo: ['B+','AB+'],                                receiveFrom: ['B+','B-','O+','O-'],                    facts: 'B+ is relatively rare. Your donation helps other B+ and AB+ patients.' },
  'B-':  { donateTo: ['B+','B-','AB+','AB-'],                     receiveFrom: ['B-','O-'],                              facts: 'B- donors can help both positive and negative B/AB recipients.' },
  'O+':  { donateTo: ['A+','B+','O+','AB+'],                      receiveFrom: ['O+','O-'],                              facts: 'O+ is the most common blood type! Your blood saves lives every day.' },
  'O-':  { donateTo: ['A+','A-','B+','B-','O+','O-','AB+','AB-'], receiveFrom: ['O-'],                                   facts: 'O- is the universal donor. Every emergency room needs your blood.' },
  'AB+': { donateTo: ['AB+'],                                     receiveFrom: ['A+','A-','B+','B-','O+','O-','AB+','AB-'], facts: 'AB+ is the universal recipient and can donate plasma to everyone.' },
  'AB-': { donateTo: ['AB+','AB-'],                               receiveFrom: ['A-','B-','O-','AB-'],                   facts: 'AB- is one of the rarest blood types. Your plasma can help all recipients.' },
};

const COOLDOWN_DAYS: Record<DonationComponent, { male: number; female: number }> = {
  'Whole Blood': { male: 90,  female: 120 },
  'Platelets':   { male: 7,   female: 7   },
  'Plasma':      { male: 14,  female: 14  },
  'PRBC':        { male: 90,  female: 120 },
};

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

// QR Code canvas
interface QRCodeCanvasProps { data: string; size?: number; className?: string; }
const QRCodeCanvas = ({ data, size = 256, className = '' }: QRCodeCanvasProps) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current && data) {
      try {
        new QRious({ element: ref.current, value: data, size, foreground: '#8B0000', level: 'H' });
      } catch (_) {}
    }
  }, [data, size]);
  return <canvas ref={ref} width={size} height={size} className={className} />;
};

// Live countdown timer
interface CountdownTimerProps { targetDate: Date; compact?: boolean; label?: string; }
const CountdownTimer = ({ targetDate, compact = false, label = '' }: CountdownTimerProps) => {
  const [display, setDisplay] = useState('');
  const [isPast,  setIsPast]  = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = targetDate.getTime() - Date.now();
      setIsPast(diff <= 0);
      if (diff <= 0) { setDisplay('Time passed'); return; }
      const days  = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins  = Math.floor((diff % 3600000)  / 60000);
      const secs  = Math.floor((diff % 60000)    / 1000);
      if (days > 1)        setDisplay(`${days}d ${hours}h ${mins}m`);
      else if (days === 1) setDisplay(`1d ${hours}h ${mins}m`);
      else if (hours > 0)  setDisplay(`${hours}h ${mins}m ${secs}s`);
      else                 setDisplay(`${mins}m ${secs}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (compact) return (
    <span className={`text-xs font-mono font-semibold ${isPast ? 'text-red-500' : 'text-blue-600'}`}>
      {label && <span className="opacity-70">{label} </span>}{display}
    </span>
  );

  return (
    <div className={`flex items-center gap-1.5 ${isPast ? 'text-red-600' : 'text-blue-700'}`}>
      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="text-xs font-semibold font-mono">{label && `${label}: `}{display}</span>
    </div>
  );
};

// Component badge
const ComponentBadge = ({ component }: { component: DonationComponent }) => {
  const colors: Record<DonationComponent, string> = {
    'Whole Blood': 'bg-red-100 text-red-700 border-red-300',
    Platelets:     'bg-amber-100 text-amber-700 border-amber-300',
    Plasma:        'bg-yellow-100 text-yellow-700 border-yellow-300',
    PRBC:          'bg-rose-100 text-rose-700 border-rose-300',
  };
  return <Badge variant="outline" className={`text-xs font-medium ${colors[component] ?? ''}`}>{component}</Badge>;
};

// QR status badge
const QRStatusBadge = ({ status, expiryTime }: { status: 'Redeemed'|'Pending'|'Expired'; expiryTime?: Date }) => {
  const cfg = { Redeemed: { cls: 'bg-green-100 text-green-700 border-green-300', lbl: '✅ Redeemed' }, Expired: { cls: 'bg-red-100 text-red-700 border-red-300', lbl: '❌ Expired' }, Pending: { cls: 'bg-yellow-100 text-yellow-700 border-yellow-300', lbl: '⏳ Pending' } }[status];
  const hoursLeft = expiryTime ? Math.max(0, Math.floor((expiryTime.getTime() - Date.now()) / 3600000)) : null;
  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.cls}`}>
      {cfg.lbl}
      {status === 'Pending' && hoursLeft !== null && <span className="ml-1 opacity-75">({hoursLeft}h left)</span>}
    </div>
  );
};

// Impact timeline
const ImpactTimelineView = ({ timeline }: { timeline: ImpactTimeline }) => {
  const stages = [
    { key: 'donated',          label: 'Donated',           date: timeline.donated,          icon: Droplet },
    { key: 'linkedToRequest',  label: 'Linked to Request', date: timeline.linkedToRequest,  icon: Heart },
    { key: 'usedByPatient',    label: 'Used by Patient',   date: timeline.usedByPatient,    icon: Activity },
    { key: 'creditIssued',     label: 'Credit Issued',     date: timeline.creditIssued,     icon: Gift },
  ];
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-800 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-600" /> Impact Journey</h4>
      <div className="relative pl-5">
        {stages.map((s, i) => {
          const Icon = s.icon;
          const done = !!s.date, last = i === stages.length - 1;
          return (
            <div key={s.key} className="relative pb-5">
              {!last && <div className={`absolute left-0 top-5 w-0.5 h-full ${done ? 'bg-green-500' : 'bg-gray-200'}`} />}
              <div className="flex items-start gap-2.5">
                <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="pt-0.5">
                  <p className={`font-medium text-sm ${done ? 'text-gray-800' : 'text-gray-400'}`}>{s.label}</p>
                  {s.date && <p className="text-xs text-gray-400 mt-0.5">{formatDateTimeDMY(s.date)}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-sm text-green-800 font-medium flex items-center gap-2">
        <Heart className="w-4 h-4 fill-green-600 flex-shrink-0" />
        {timeline.usedByPatient ? 'Your donation directly saved a life! 🎉' : timeline.linkedToRequest ? "Your donation is fulfilling a patient's need..." : 'Your donation is being processed...'}
      </div>
    </div>
  );
};

// ── History QR Modal ─────────────────────────────────────────
interface HistoryQRModalProps {
  isOpen: boolean; onClose: () => void;
  data: { rtid: string; payload: string; location: string; date: Date; component?: DonationComponent; qrStatus?: 'Redeemed'|'Pending'|'Expired'; otpExpiryTime?: Date; } | null;
}
const HistoryQRModal = ({ isOpen, onClose, data }: HistoryQRModalProps) => {
  if (!data) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-primary text-center flex items-center justify-center gap-2"><QrCode className="w-5 h-5" /> Donation QR</DialogTitle>
          <DialogDescription className="text-center">RTID: <span className="font-mono font-bold text-black">{data.rtid}</span></DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <QRCodeCanvas data={data.payload} className="border-4 border-white shadow rounded-lg" />
          <div className="text-center space-y-1">
            <p className="text-sm text-muted-foreground">{formatDateDMY(data.date)} · {data.location}</p>
            {data.component && <div className="flex justify-center"><ComponentBadge component={data.component} /></div>}
            {data.qrStatus  && <div className="flex justify-center"><QRStatusBadge status={data.qrStatus} expiryTime={data.otpExpiryTime} /></div>}
          </div>
        </div>
        <Button onClick={onClose} className="w-full rounded-full">Done</Button>
      </DialogContent>
    </Dialog>
  );
};

// ── Printable Donation Slip ───────────────────────────────────
const PrintableDonation = ({ donation, donorData }: { donation: Donation | null; donorData: DonorData }) => {
  const qrRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (donation && qrRef.current) {
      const payload = `${donorData.fullName}|${donorData.bloodGroup}|${donation.rtidCode}|${donation.hospitalName}|${donation.city}|${donation.component || 'Whole Blood'}`;
      try { new QRious({ element: qrRef.current, value: payload, size: 150, level: 'H' }); } catch (_) {}
    }
  }, [donation, donorData]);
  if (!donation) return null;
  const nextEligible = donation.component && COOLDOWN_DAYS[donation.component]
    ? new Date(donation.date.getTime() + COOLDOWN_DAYS[donation.component][donorData.gender?.toLowerCase() === 'female' ? 'female' : 'male'] * 86400000)
    : null;
  return createPortal(
    <>
      <style>{`@media print{@page{size:A4;margin:10mm}body>*:not(#pd-portal){display:none!important}#pd-portal{display:flex!important;position:fixed;inset:0;background:white;z-index:99999;align-items:start;justify-content:center;padding:10mm}.no-print{display:none!important}}@media screen{#pd-portal{display:none!important}}`}</style>
      <div id="pd-portal">
        <div style={{ width: '190mm', border: '2px solid #1a0505', padding: '8mm', fontFamily: 'Georgia, serif', color: '#1a0505' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #8B0000', paddingBottom: '4mm', marginBottom: '5mm' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4mm' }}>
              <img src={logo} alt="" style={{ width: '14mm', height: '14mm', objectFit: 'contain' }} />
              <div>
                <div style={{ fontSize: '14pt', fontWeight: 'bold', color: '#8B0000' }}>RaktPort</div>
                <div style={{ fontSize: '7pt', color: '#555' }}>National Blood Management System</div>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '7.5pt', color: '#555' }}>
              <div>DONATION SLIP</div>
              <div style={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '9pt' }}>{donation.rtidCode}</div>
              <div>Generated: {formatDateDMY(new Date())}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4mm', marginBottom: '4mm' }}>
            <div>
              <div style={{ fontSize: '8pt', fontWeight: 'bold', color: '#8B0000', marginBottom: '2mm', borderBottom: '1px solid #ddd', paddingBottom: '1mm' }}>DONOR DETAILS</div>
              {[['Name', donorData.fullName], ['Donor ID', donorData.donorId || 'N/A'], ['Blood Group', donorData.bloodGroup], ['City', donorData.city]].map(([k, v]) => (
                <div key={k} style={{ fontSize: '8pt', marginBottom: '1mm' }}><b>{k}:</b> {v}</div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: '8pt', fontWeight: 'bold', color: '#8B0000', marginBottom: '2mm', borderBottom: '1px solid #ddd', paddingBottom: '1mm' }}>DONATION DETAILS</div>
              {[['Date', formatDateDMY(donation.date)], ['Time', donation.time || 'N/A'], ['Centre', donation.hospitalName], ['Component', donation.component || 'Whole Blood'], ['Status', donation.status]].map(([k, v]) => (
                <div key={k} style={{ fontSize: '8pt', marginBottom: '1mm' }}><b>{k}:</b> {v}</div>
              ))}
            </div>
          </div>
          {nextEligible && (
            <div style={{ background: '#fff9f0', border: '1px solid #f0d0a0', borderRadius: '3mm', padding: '3mm', marginBottom: '4mm', fontSize: '8pt' }}>
              <b>Next eligible donation date:</b> {formatDateDMY(nextEligible)} ({donation.component || 'Whole Blood'})
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4mm' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '7pt', fontWeight: 'bold', marginBottom: '2mm' }}>SCAN TO VERIFY</div>
              <canvas ref={qrRef} />
            </div>
          </div>
          <div style={{ borderTop: '1px solid #ccc', paddingTop: '3mm', fontSize: '7pt', color: '#777', textAlign: 'center' }}>
            This is a computer-generated document valid across all RaktPort partner networks. • www.raktport.in
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

// ── Impact Certificate ────────────────────────────────────────
interface CertModalProps { isOpen: boolean; onClose: () => void; donorData: DonorData; donationHistory: Donation[]; }
const CertificateModal = ({ isOpen, onClose, donorData, donationHistory }: CertModalProps) => {
  const certRef = useRef<HTMLCanvasElement>(null);
  const qrRef   = useRef<HTMLCanvasElement>(null);

  const completed = donationHistory.filter(d => ['Donated','Completed','Redeemed-Credit','Verified','Credited'].includes(d.status));
  const firstDate = completed.length > 0 ? completed[completed.length - 1].date : null;
  const lastDate  = completed.length > 0 ? completed[0].date : null;
  const lives     = (donorData.donationsCount || 0) * 3;
  const certNo    = `CERT-${donorData.donorId?.replace('RKT-','') || 'XXXXXX'}-${new Date().getFullYear()}`;

  useEffect(() => {
    if (isOpen && qrRef.current) {
      try {
        new QRious({ element: qrRef.current, value: `${donorData.donorId || 'N/A'}|${certNo}|${donorData.bloodGroup}|${donorData.donationsCount || 0}`, size: 80, foreground: '#8B0000', level: 'H' });
      } catch (_) {}
    }
  }, [isOpen, donorData, certNo]);

  const handleDownload = () => window.print();

  return (
    <>
      {/* Print-only certificate */}
      {isOpen && createPortal(
        <>
          <style>{`@media print{@page{size:A4 landscape;margin:0}body>*:not(#cert-portal){display:none!important}#cert-portal{display:block!important;position:fixed;inset:0;background:white;z-index:99999}}.no-print{display:none!important}@media screen{#cert-portal{display:none!important}}`}</style>
          <div id="cert-portal">
            <div style={{
              width: '297mm', height: '210mm', position: 'relative',
              background: 'linear-gradient(135deg, #fff8f5 0%, #ffffff 50%, #fff5f5 100%)',
              fontFamily: "'Georgia', serif", overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '12mm',
            }}>
              {/* Decorative corner borders */}
              {['tl','tr','bl','br'].map(pos => (
                <div key={pos} style={{
                  position: 'absolute',
                  [pos.includes('t') ? 'top' : 'bottom']: '6mm',
                  [pos.includes('l') ? 'left' : 'right']: '6mm',
                  width: '20mm', height: '20mm',
                  borderTop:    pos.includes('t') ? '3px solid #8B0000' : 'none',
                  borderBottom: pos.includes('b') ? '3px solid #8B0000' : 'none',
                  borderLeft:   pos.includes('l') ? '3px solid #8B0000' : 'none',
                  borderRight:  pos.includes('r') ? '3px solid #8B0000' : 'none',
                }} />
              ))}
              {/* Outer border */}
              <div style={{ position: 'absolute', inset: '4mm', border: '1px solid rgba(139,0,0,0.2)', pointerEvents: 'none' }} />

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '5mm', marginBottom: '5mm' }}>
                <img src={logo} alt="" style={{ width: '18mm', height: '18mm', objectFit: 'contain' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20pt', fontWeight: 'bold', color: '#8B0000', letterSpacing: '0.05em' }}>RaktPort</div>
                  <div style={{ fontSize: '8pt', color: '#666', letterSpacing: '0.15em', textTransform: 'uppercase' }}>National Blood Management System</div>
                </div>
                <img src={logo} alt="" style={{ width: '18mm', height: '18mm', objectFit: 'contain', opacity: 0.3 }} />
              </div>

              {/* Divider */}
              <div style={{ width: '180mm', height: '1px', background: 'linear-gradient(to right, transparent, #8B0000 30%, #8B0000 70%, transparent)', marginBottom: '5mm' }} />

              {/* Title */}
              <div style={{ fontSize: '24pt', fontWeight: 'bold', color: '#8B0000', letterSpacing: '0.08em', marginBottom: '2mm', textAlign: 'center' }}>
                CERTIFICATE OF APPRECIATION
              </div>
              <div style={{ fontSize: '9pt', color: '#666', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '6mm', textAlign: 'center' }}>
                This is to certify that
              </div>

              {/* Donor Name */}
              <div style={{ fontSize: '28pt', fontWeight: 'bold', color: '#1a0505', letterSpacing: '-0.02em', marginBottom: '1mm', textAlign: 'center' }}>
                {(donorData.fullName || 'Donor Name').toUpperCase()}
              </div>
              <div style={{ fontSize: '10pt', color: '#8B0000', fontStyle: 'italic', marginBottom: '5mm', textAlign: 'center' }}>
                Donor ID: {donorData.donorId || 'RKT-XXXXXX'} · Blood Group: {donorData.bloodGroup || 'N/A'}
              </div>

              {/* Body text */}
              <div style={{ fontSize: '10pt', color: '#444', lineHeight: 1.7, textAlign: 'center', maxWidth: '200mm', marginBottom: '6mm' }}>
                has generously donated blood <strong style={{ color: '#8B0000' }}>{donorData.donationsCount || 0} time{(donorData.donationsCount || 0) !== 1 ? 's' : ''}</strong> through the RaktPort National Blood Donation Programme,
                potentially saving up to <strong style={{ color: '#8B0000' }}>{lives} lives</strong> through their selfless and noble act of giving.
              </div>

              {/* Stats strip */}
              <div style={{ display: 'flex', gap: '8mm', marginBottom: '6mm', background: '#8B0000', borderRadius: '4mm', padding: '4mm 8mm' }}>
                {[
                  ['Blood Group', donorData.bloodGroup || 'N/A'],
                  ['Total Donations', String(donorData.donationsCount || 0)],
                  ['Lives Impacted', `~${lives}`],
                  ['First Donation', firstDate ? formatDateDMY(firstDate) : 'N/A'],
                  ['Latest Donation', lastDate  ? formatDateDMY(lastDate)  : 'N/A'],
                ].map(([lbl, val]) => (
                  <div key={lbl} style={{ textAlign: 'center', minWidth: '28mm' }}>
                    <div style={{ fontSize: '7pt', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1mm' }}>{lbl}</div>
                    <div style={{ fontSize: '13pt', fontWeight: 'bold', color: 'white' }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Footer row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '230mm', marginTop: '2mm' }}>
                <div style={{ textAlign: 'center' }}>
                  <canvas ref={qrRef} />
                  <div style={{ fontSize: '6pt', color: '#999', marginTop: '1mm' }}>{certNo}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '8pt', color: '#888' }}>Issue Date</div>
                  <div style={{ fontSize: '10pt', fontWeight: 'bold', color: '#333' }}>{formatDateDMY(new Date())}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '50mm', borderBottom: '1px solid #333', marginBottom: '1mm' }} />
                  <div style={{ fontSize: '7.5pt', color: '#666' }}>Authorised by RaktPort</div>
                  <div style={{ fontSize: '7pt', color: '#999' }}>National Blood Authority</div>
                </div>
              </div>

              {/* Bottom tagline */}
              <div style={{ position: 'absolute', bottom: '7mm', textAlign: 'center', width: '100%', fontSize: '7.5pt', color: '#8B0000', fontStyle: 'italic', letterSpacing: '0.05em' }}>
                "Every drop of blood donated is a promise of hope — Thank you for saving lives"
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* UI Modal preview */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-xl rounded-2xl no-print">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary"><Award className="w-5 h-5" /> Impact Certificate</DialogTitle>
            <DialogDescription>Preview your achievement certificate. Click Download to save as PDF.</DialogDescription>
          </DialogHeader>

          {/* Preview card */}
          <div className="rounded-xl overflow-hidden border-2 border-red-100 bg-gradient-to-br from-[#8B0000] to-[#5a0000] p-5 text-white text-center space-y-3">
            <div className="flex justify-center"><img src={logo} alt="" className="w-12 h-12 rounded-xl" /></div>
            <div className="text-xs uppercase tracking-widest opacity-70">Certificate of Appreciation</div>
            <div className="text-2xl font-bold">{donorData.fullName}</div>
            <div className="text-sm opacity-80">{donorData.donorId || 'RKT-XXXXXX'} · {donorData.bloodGroup}</div>
            <div className="flex justify-center gap-6 py-3 bg-white/10 rounded-xl">
              {[['Donations', donorData.donationsCount || 0], ['Lives Saved', `~${lives}`], ['Blood Group', donorData.bloodGroup]].map(([l, v]) => (
                <div key={l as string} className="text-center">
                  <div className="text-xl font-black">{v}</div>
                  <div className="text-xs opacity-70">{l}</div>
                </div>
              ))}
            </div>
            <div className="text-xs opacity-60">{certNo} · Issued {formatDateDMY(new Date())}</div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>Close</Button>
            <Button className="flex-1 bg-primary gap-2" onClick={handleDownload}>
              <Download className="w-4 h-4" /> Download Certificate
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ── Blood Compatibility Modal ─────────────────────────────────
const BloodCompatibilityModal = ({ isOpen, onClose, bloodGroup }: { isOpen: boolean; onClose: () => void; bloodGroup: string }) => {
  const info = BLOOD_COMPATIBILITY[bloodGroup];
  const ALL_GROUPS = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];
  if (!info) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><HeartHandshake className="w-5 h-5 text-red-600" /> Blood Type Compatibility</DialogTitle>
          <DialogDescription>Your blood type <strong>{bloodGroup}</strong> compatibility guide</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Blood group hero */}
          <div className="flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-xl">
              <span className="text-2xl font-black text-white">{bloodGroup}</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 text-center bg-red-50 rounded-xl p-3 border border-red-100">{info.facts}</p>

          {/* Donate to */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5"><Droplet className="w-4 h-4 text-red-500" /> You can donate to</h4>
            <div className="flex flex-wrap gap-2">
              {ALL_GROUPS.map(g => (
                <div key={g} className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all ${
                  info.donateTo.includes(g) ? 'bg-red-500 text-white border-red-600 shadow-md scale-110' : 'bg-gray-100 text-gray-300 border-gray-200'
                }`}>{g}</div>
              ))}
            </div>
          </div>

          {/* Receive from */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5"><Heart className="w-4 h-4 text-green-500 fill-green-500" /> You can receive from</h4>
            <div className="flex flex-wrap gap-2">
              {ALL_GROUPS.map(g => (
                <div key={g} className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-black border-2 transition-all ${
                  info.receiveFrom.includes(g) ? 'bg-green-500 text-white border-green-600 shadow-md scale-110' : 'bg-gray-100 text-gray-300 border-gray-200'
                }`}>{g}</div>
              ))}
            </div>
          </div>

          {bloodGroup === 'O-' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800 flex gap-2">
              <Star className="w-4 h-4 fill-amber-500 flex-shrink-0 mt-0.5" />
              <span><strong>Universal Donor:</strong> Your blood can be given to anyone in an emergency!</span>
            </div>
          )}
          {bloodGroup === 'AB+' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800 flex gap-2">
              <Star className="w-4 h-4 fill-blue-500 flex-shrink-0 mt-0.5" />
              <span><strong>Universal Recipient:</strong> You can receive blood from any blood type!</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── Health Tips Section ───────────────────────────────────────
const HealthTipsSection = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (!isOpen) return;
    const id = setInterval(() => setCurrent(c => (c + 1) % HEALTH_TIPS.length), 4000);
    return () => clearInterval(id);
  }, [isOpen]);
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-600" /> Health Tips for Donors</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Featured tip */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100 text-center min-h-[120px] flex flex-col items-center justify-center transition-all">
            <div className="text-4xl mb-3">{HEALTH_TIPS[current].icon}</div>
            <h3 className="font-bold text-gray-900 mb-1">{HEALTH_TIPS[current].title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{HEALTH_TIPS[current].tip}</p>
          </div>
          {/* Dots */}
          <div className="flex justify-center gap-1.5">
            {HEALTH_TIPS.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${i === current ? 'bg-blue-600 w-6' : 'bg-gray-300 w-2'}`} />
            ))}
          </div>
          {/* All tips list */}
          <div className="space-y-2 max-h-52 overflow-y-auto">
            {HEALTH_TIPS.map((t, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all ${i === current ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}>
                <span className="text-xl flex-shrink-0">{t.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{t.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{t.tip}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── Share Card ────────────────────────────────────────────────
const ShareCardModal = ({ isOpen, onClose, donorData }: { isOpen: boolean; onClose: () => void; donorData: DonorData }) => {
  const shareText = `🩸 I'm a blood donor with RaktPort!\nDonor ID: ${donorData.donorId || 'RKT-XXXXXX'} | Blood Group: ${donorData.bloodGroup}\nTotal Donations: ${donorData.donationsCount || 0} | Lives Impacted: ~${(donorData.donationsCount || 0) * 3}\nJoin me in saving lives: raktport.in`;
  const handleShare = () => {
    if (navigator.share) { navigator.share({ title: 'I am a RaktPort Donor!', text: shareText, url: 'https://raktport.in' }).catch(() => {}); }
    else { navigator.clipboard.writeText(shareText); toast.success('Copied to clipboard!'); }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Share2 className="w-5 h-5 text-primary" /> Share Your Story</DialogTitle>
        </DialogHeader>
        {/* Card preview */}
        <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#8B0000] to-[#4a0000] p-5 text-white text-center space-y-3 shadow-xl">
          <div className="flex items-center justify-center gap-2 text-xs opacity-70 uppercase tracking-widest"><Droplet className="w-3 h-3 fill-current" /> RaktPort Blood Donor</div>
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-black mx-auto">
            {(donorData.fullName || 'D').split(' ').map(s => s[0]).join('').toUpperCase().slice(0,2)}
          </div>
          <div className="text-xl font-bold">{donorData.fullName}</div>
          <div className="text-3xl font-black text-red-200">{donorData.bloodGroup}</div>
          <div className="flex justify-center gap-6 py-2 bg-white/10 rounded-xl">
            {[['Donations', donorData.donationsCount || 0], ['Lives', `~${(donorData.donationsCount||0)*3}`]].map(([l,v]) => (
              <div key={l as string} className="text-center"><div className="text-xl font-black">{v}</div><div className="text-xs opacity-70">{l}</div></div>
            ))}
          </div>
          <div className="text-xs opacity-60">{donorData.donorId || 'RKT-XXXXXX'}</div>
        </div>
        <Button className="w-full bg-primary gap-2" onClick={handleShare}><Share2 className="w-4 h-4" /> Share</Button>
      </DialogContent>
    </Dialog>
  );
};
// DonorDashboard.tsx  — PART 2 of 3
// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export function DonorDashboard({ onLogout }: DonorDashboardProps) {

  // ── State ──
  const [donorData,        setDonorData]        = useState<DonorData>({});
  const [donationHistory,  setDonationHistory]  = useState<Donation[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState('');
  const [isEligible,       setIsEligible]       = useState(false);
  const [eligibilityMsg,   setEligibilityMsg]   = useState('Checking eligibility...');
  const [motivationQuote,  setMotivationQuote]  = useState('');
  const [currentHealthTip, setCurrentHealthTip] = useState(0);
  const [emergencyAlerts,  setEmergencyAlerts]  = useState<EmergencyAlert[]>([]);
  const [centers,          setCenters]          = useState<BloodCenter[]>([]);
  const [selectedCenter,   setSelectedCenter]   = useState<BloodCenter | null>(null);
  const [apiLoading,       setApiLoading]       = useState(false);
  const [donationToPrint,  setDonationToPrint]  = useState<Donation | null>(null);
  const [scheduleCity,     setScheduleCity]     = useState('');

  // Modals
  const [profileOpen,       setProfileOpen]       = useState(false);
  const [scheduleOpen,      setScheduleOpen]      = useState(false);
  const [bookingOpen,       setBookingOpen]       = useState(false);
  const [bookingConfirmOpen,setBookingConfirmOpen]= useState(false);
  const [rescheduleOpen,    setRescheduleOpen]    = useState(false);
  const [certOpen,          setCertOpen]          = useState(false);
  const [compatOpen,        setCompatOpen]        = useState(false);
  const [healthTipsOpen,    setHealthTipsOpen]    = useState(false);
  const [shareOpen,         setShareOpen]         = useState(false);
  const [historyQROpen,     setHistoryQROpen]     = useState(false);
  const [hrtidModalOpen,    setHrtidModalOpen]    = useState(false);
  const [emergencyOpen,     setEmergencyOpen]     = useState(false);

  // QR data
  const [selectedHistoryQR, setSelectedHistoryQR] = useState<any>(null);
  const [hrtidDetails,      setHrtidDetails]      = useState<HrtidDetails | null>(null);
  const [hrtidLoading,      setHrtidLoading]      = useState(false);
  const [bookingDetails,    setBookingDetails]    = useState({ rtid: '', qrPayload: '' });

  // Booking form
  const [bookingForm, setBookingForm] = useState({
    date: '', time: '09:00 AM', component: 'Whole Blood' as DonationComponent,
  });

  // Reschedule
  const [rescheduleForm,     setRescheduleForm]     = useState({ date: '', time: '09:00 AM' });
  const [apptToReschedule,   setApptToReschedule]   = useState<Donation | null>(null);

  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const userId      = localStorage.getItem('userId') || localStorage.getItem('userUid');

  // ── Init ──
  useEffect(() => {
    setMotivationQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    const id = setInterval(() => setCurrentHealthTip(c => (c + 1) % HEALTH_TIPS.length), 8000);
    return () => clearInterval(id);
  }, []);

  // ── Data Fetch ──
  useEffect(() => {
    if (!userId) { setError('Not logged in'); setLoading(false); return; }

    const fetchData = async () => {
      try {
        // 1. Donor profile
        const userRef  = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const d = userSnap.data();

          // Auto-generate donorId if missing (for existing users)
          let donorId = d.donorId;
          if (!donorId) {
            donorId = generateDonorId();
            await updateDoc(userRef, { donorId }).catch(() => {});
          }

          setDonorData({
            fullName:        d.fullName || 'Donor',
            bloodGroup:      d.bloodGroup || 'N/A',
            gender:          d.gender || 'male',
            lastDonationDate:d.lastDonationDate || null,
            city:            d.district || d.city || '',
            pincode:         d.pincode || '',
            donationsCount:  d.donationsCount || 0,
            credits:         d.credits || 0,
            email:           d.email || userId,
            mobile:          d.mobile || 'Not Set',
            dob:             d.dob || null,
            donorId,
            availabilityMode:d.availabilityMode || 'available',
          });
          setScheduleCity(d.district || d.city || '');
          setError('');
        } else {
          setError('Profile not found. Please contact support.');
        }

        // 2. Donation history
        const q    = query(collection(db, 'donations'), where('donorId', '==', userId));
        const snap = await getDocs(q);
        const history: Donation[] = [];

        snap.forEach(docSnap => {
          const d    = docSnap.data() as any;
          const rtid = d.dRtid || d.rtid || d.donationId || docSnap.id;
          const linked = d.linkedHrtid || d.linkedRTID || d.hRtid || 'N/A';

          let status: DonationStatus = d.status;
          if (d.status === 'AVAILABLE' || d.status === 'Donated') status = 'Donated';
          else if (d.status === 'REDEEMED') status = 'Redeemed-Credit';
          else if (d.status === 'CANCELLED' || d.status === 'Cancelled') status = 'Cancelled';
          else if ((d.status === 'Scheduled' || d.status === 'Pending') && safeDate(d.date) < new Date()) status = 'Expired';

          const qrStatus: 'Redeemed'|'Pending'|'Expired' =
            ['REDEEMED','Redeemed-Credit','Completed'].includes(d.status) ? 'Redeemed' :
            d.expiryDate && safeDate(d.expiryDate) < new Date() ? 'Expired' : 'Pending';

          const otpExpiry = d.otpExpiryTime ? safeDate(d.otpExpiryTime) : new Date(safeDate(d.date).getTime() + 86400000);

          const timeline: ImpactTimeline = {
            donated:         safeDate(d.date),
            linkedToRequest: d.linkedDate ? safeDate(d.linkedDate) : (linked !== 'N/A' ? safeDate(d.date) : undefined),
            usedByPatient:   d.usedDate ? safeDate(d.usedDate) : (d.status === 'REDEEMED' ? safeDate(d.redeemedAt || d.date) : undefined),
            creditIssued:    d.creditIssuedDate ? safeDate(d.creditIssuedDate) : (['Donated','AVAILABLE'].includes(d.status) ? safeDate(d.date) : undefined),
          };

          history.push({
            date:              safeDate(d.date),
            rtidCode:          rtid,
            linkedHrtid:       linked,
            hospitalName:      d.bloodBankName || d.hospitalName || 'Blood Bank',
            city:              d.city || d.donationLocation || 'Unknown',
            status,
            otp:               d.otp || '',
            expiryDate:        d.expiryDate ? safeDate(d.expiryDate) : undefined,
            component:         d.component || 'Whole Blood',
            qrRedemptionStatus:qrStatus,
            otpExpiryTime:     otpExpiry,
            impactTimeline:    timeline,
            time:              d.time || '09:00 AM',
          });
        });

        history.sort((a, b) => b.date.getTime() - a.date.getTime());
        setDonationHistory(history);

        // 3. Emergency requests in donor city
        const city = userSnap.data()?.district || userSnap.data()?.city;
        if (city) {
          try {
            const eqSnap = await getDocs(query(
              collection(db, 'bloodRequests'),
              where('city', '==', city),
              where('urgency', 'in', ['Critical', 'High', 'critical', 'high'])
            ));
            const alerts: EmergencyAlert[] = [];
            eqSnap.forEach(d => {
              const data = d.data() as any;
              if (['PENDING','CREATED','PARTIAL'].includes(data.status || '')) {
                const exp = data.requiredBy ? safeDate(data.requiredBy) : new Date(Date.now() + 12 * 3600000);
                if (exp.getTime() > Date.now()) {
                  alerts.push({
                    id: d.id, bloodGroup: data.bloodGroup, hospitalName: data.hospitalName || 'Hospital',
                    urgency: (data.urgency?.toLowerCase() || 'high') as 'critical'|'high'|'medium',
                    expiresAt: exp, hrtid: data.linkedRTID || data.rtid || d.id, city,
                  });
                }
              }
            });
            setEmergencyAlerts(alerts.slice(0, 3));
          } catch (_) {}
        }

      } catch (e: any) {
        console.error(e);
        setError('Failed to load data. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // ── Eligibility ──
  useEffect(() => {
    let latestComp: DonationComponent = 'Whole Blood';
    let latestDate: Date | null = null;
    const done: DonationStatus[] = ['Donated','Redeemed-Credit','Pledged','Completed','Verified','Credited'];
    donationHistory.forEach(d => {
      if (done.includes(d.status)) {
        if (!latestDate || d.date > latestDate) { latestDate = d.date; latestComp = d.component || 'Whole Blood'; }
      }
    });
    const hasPending = donationHistory.some(d => ['Pending','Scheduled'].includes(d.status));
    if (hasPending) { setIsEligible(false); setEligibilityMsg('🚫 You have a pending appointment.'); return; }

    const result = calculateDonorEligibility(
      (donorData.gender as Gender) || 'Male', 'Whole Blood',
      latestDate, latestComp, new Date()
    );
    setIsEligible(result.eligible);
    if (result.eligible) {
      setEligibilityMsg(latestDate ? `✅ Eligible! Last donation ${Math.floor((Date.now() - latestDate!.getTime()) / 86400000)} days ago.` : '✨ Ready for your first donation!');
    } else {
      setEligibilityMsg(result.rejectionReason || 'Not eligible at this time.');
    }
  }, [donorData, donationHistory]);

  // Trigger print
  useEffect(() => {
    if (donationToPrint) { const t = setTimeout(() => window.print(), 500); return () => clearTimeout(t); }
  }, [donationToPrint]);

  // QR for booking confirm
  useEffect(() => {
    if (bookingConfirmOpen && bookingDetails.qrPayload && qrCanvasRef.current) {
      setTimeout(() => {
        if (qrCanvasRef.current) {
          try { new QRious({ element: qrCanvasRef.current, value: bookingDetails.qrPayload, size: 200, foreground: '#8b0000' }); } catch (_) {}
        }
      }, 80);
    }
  }, [bookingConfirmOpen, bookingDetails.qrPayload]);

  // ── Computed ──
  const lastDonationDisplay = useMemo(() => {
    let latest: Date | null = null, comp: DonationComponent = 'Whole Blood';
    if (donorData.lastDonationDate) { const d = new Date(donorData.lastDonationDate); if (!isNaN(d.getTime())) latest = d; }
    const done: DonationStatus[] = ['Donated','Redeemed-Credit','Pledged','Completed','Verified','Credited'];
    donationHistory.forEach(d => { if (done.includes(d.status) && (!latest || d.date > latest)) { latest = d.date; comp = d.component || 'Whole Blood'; } });
    return latest ? `${formatDateDMY(latest)} (${comp})` : 'Never';
  }, [donorData.lastDonationDate, donationHistory]);

  const nextEligibleDate = useMemo((): Date | null => {
    let latest: Date | null = null, comp: DonationComponent = 'Whole Blood';
    const done: DonationStatus[] = ['Donated','Redeemed-Credit','Pledged','Completed','Verified','Credited'];
    donationHistory.forEach(d => { if (done.includes(d.status) && (!latest || d.date > latest)) { latest = d.date; comp = d.component || 'Whole Blood'; } });
    if (!latest) return null;
    const isFemale = (donorData.gender || '').toLowerCase() === 'female';
    const days = COOLDOWN_DAYS[comp][isFemale ? 'female' : 'male'];
    const next = new Date(latest); next.setDate(next.getDate() + days);
    return next;
  }, [donationHistory, donorData.gender]);

  const nextEligibleDisplay = useMemo(() => {
    if (!nextEligibleDate) return 'Ready now!';
    if (nextEligibleDate <= new Date()) return 'Ready now!';
    return formatDateDMY(nextEligibleDate);
  }, [nextEligibleDate]);

  const daysUntilEligible = useMemo(() => {
    if (!nextEligibleDate || nextEligibleDate <= new Date()) return 0;
    return Math.ceil((nextEligibleDate.getTime() - Date.now()) / 86400000);
  }, [nextEligibleDate]);

  const donationStreak = useMemo(() => {
    const done: DonationStatus[] = ['Donated','Redeemed-Credit','Completed'];
    const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 12);
    return donationHistory.filter(d => done.includes(d.status) && d.date >= cutoff).length;
  }, [donationHistory]);

  const computeBadge = (n: number) => n >= 20 ? '💎 Diamond' : n >= 10 ? '🥇 Gold' : n >= 5 ? '🥈 Silver' : '🥉 Bronze';
  const badgeBg      = (n: number) => n >= 20 ? 'bg-blue-600' : n >= 10 ? 'bg-yellow-500' : n >= 5 ? 'bg-gray-400' : 'bg-orange-700';

  // ── Handlers ──

  const handleViewHistoryQR = (d: Donation) => {
    setSelectedHistoryQR({
      rtid: d.rtidCode,
      payload: `${donorData.fullName}|${donorData.bloodGroup}|${d.rtidCode}|${d.hospitalName}|${d.city}|${d.component || 'Whole Blood'}`,
      location: d.hospitalName, date: d.date, component: d.component,
      qrStatus: d.qrRedemptionStatus, otpExpiryTime: d.otpExpiryTime,
    });
    setHistoryQROpen(true);
  };

  const handleFindCenters = async () => {
    if (!scheduleCity.trim()) { toast.error('Please enter a city'); return; }
    setApiLoading(true); setCenters([]);
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'bloodbank'), where('isVerified', '==', true));
      const snap = await getDocs(q);
      const found: BloodCenter[] = [];
      snap.forEach(d => {
        const v = d.data() as any;
        const bankCity = v.district || v.city || '';
        if (citiesMatch(scheduleCity, bankCity)) {
          found.push({
            id: d.id, name: v.fullName || 'Blood Bank',
            address: v.address || '', phone: v.mobile || 'N/A',
            city: bankCity, state: v.state || '', pincode: v.pincode || '',
            latitude: v.latitude, longitude: v.longitude,
            fullAddress: `${v.address || ''}${bankCity ? ', ' + bankCity : ''}${v.state ? ', ' + v.state : ''}${v.pincode ? ' - ' + v.pincode : ''}`,
          });
        }
      });
      // Fallback to blood-banks collection
      if (found.length === 0) {
        const snap2 = await getDocs(collection(db, 'blood-banks'));
        snap2.forEach(d => {
          const v = d.data() as any;
          if (citiesMatch(scheduleCity, v.city || v.district || '')) {
            found.push({ id: d.id, name: v.name || 'Blood Bank', address: v.address || '', phone: v.phone || v.mobile || 'N/A', city: v.city || '', state: v.state || '', pincode: v.pincode || '', fullAddress: v.address || '' });
          }
        });
      }
      setCenters(found);
      if (found.length === 0) toast.error(`No verified blood banks found in "${scheduleCity}"`);
      else toast.success(`Found ${found.length} blood bank(s)`);
    } catch (e: any) { toast.error('Search failed', { description: e.message }); }
    finally { setApiLoading(false); }
  };

  const handleSelectCenter = (c: BloodCenter) => {
    setSelectedCenter(c);
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    setBookingForm({ date: tomorrow.toISOString().split('T')[0], time: '09:00 AM', component: 'Whole Blood' });
    setBookingOpen(true);
  };

  const handleBookAppointment = async () => {
    if (!selectedCenter || !bookingForm.date || !userId) { toast.error('Please fill all fields'); return; }
    setApiLoading(true);
    try {
      const rtid = await generateUniqueAppointmentRtid(bookingForm.date);
      const time24 = convert12to24(bookingForm.time);
      const dt = new Date(`${bookingForm.date}T${time24}`);
      if (isNaN(dt.getTime())) throw new Error('Invalid date/time');

      // Appointment record
      await addDoc(collection(db, 'appointments'), {
        rtid, appointmentRtid: rtid, donorId: userId,
        donorName: donorData.fullName || 'Donor', mobile: donorData.mobile || '',
        gender: donorData.gender || 'Male', bloodGroup: donorData.bloodGroup || 'O+',
        date: Timestamp.fromDate(dt), time: bookingForm.time,
        bloodBankId: selectedCenter.id, bloodBankName: selectedCenter.name,
        status: 'Upcoming', component: bookingForm.component,
        createdAt: Timestamp.now(),
      });

      // Donation record (scheduled)
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await setDoc(doc(db, 'donations', rtid), {
        rtid, dRtid: rtid, appointmentRtid: rtid, donorId: userId,
        donorName: donorData.fullName || 'Donor', donorMobile: donorData.mobile || '',
        bloodGroup: donorData.bloodGroup || 'O+',
        bloodBankId: selectedCenter.id, bloodBankName: selectedCenter.name,
        donationType: 'Regular', component: bookingForm.component,
        status: 'Scheduled', otp, date: Timestamp.fromDate(dt), time: bookingForm.time,
        city: donorData.city || '', donationLocation: donorData.city || '',
        createdAt: Timestamp.now(), otpExpiryTime: Timestamp.fromDate(new Date(dt.getTime() + 86400000)),
        hRtid: null, linkedHrtid: null, patientName: null, hospitalName: null,
      });

      const payload = `${donorData.fullName}|${donorData.bloodGroup}|${rtid}|${selectedCenter.name}|${donorData.city}|${bookingForm.component}`;
      setBookingDetails({ rtid, qrPayload: payload });
      toast.success('Appointment booked!', { description: `RTID: ${rtid}` });
      setBookingOpen(false); setScheduleOpen(false);

      // Refresh
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) { toast.error('Booking failed', { description: e.message }); }
    finally { setApiLoading(false); }
  };

  const handleRescheduleClick = (d: Donation) => {
    setApptToReschedule(d);
    setRescheduleForm({ date: d.date.toISOString().split('T')[0], time: d.time || '09:00 AM' });
    setRescheduleOpen(true);
  };

  const handleRescheduleAppointment = async () => {
    if (!apptToReschedule || !userId) return;
    setApiLoading(true);
    try {
      const rtid    = apptToReschedule.rtidCode;
      const time24  = convert12to24(rescheduleForm.time);
      const newDate = new Date(`${rescheduleForm.date}T${time24}`);

      // Update appointments collection
      const appSnap = await getDocs(query(collection(db, 'appointments'), where('rtid', '==', rtid)));
      if (!appSnap.empty) await updateDoc(appSnap.docs[0].ref, { date: Timestamp.fromDate(newDate), time: rescheduleForm.time, updatedAt: Timestamp.now() });

      // Update donations collection
      const donRef = doc(db, 'donations', rtid);
      const donSnap = await getDoc(donRef);
      if (donSnap.exists()) await updateDoc(donRef, { date: Timestamp.fromDate(newDate), time: rescheduleForm.time, otpExpiryTime: Timestamp.fromDate(new Date(newDate.getTime() + 86400000)), updatedAt: Timestamp.now() });

      setDonationHistory(prev => prev.map(d => d.rtidCode === rtid ? { ...d, date: newDate, time: rescheduleForm.time } : d).sort((a, b) => b.date.getTime() - a.date.getTime()));
      setRescheduleOpen(false);
      toast.success('Rescheduled!', { description: `New: ${formatDateDMY(newDate)} at ${rescheduleForm.time}` });
    } catch (e: any) { toast.error('Reschedule failed', { description: e.message }); }
    finally { setApiLoading(false); }
  };

  const handleCancelAppointment = async (donation: Donation) => {
    const result = await Swal.fire({
      title: 'Cancel Appointment?',
      text: `Cancel your appointment on ${formatDateDMY(donation.date)} at ${donation.hospitalName}?`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#EF4444', cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, Cancel', cancelButtonText: 'Keep It',
    });
    if (!result.isConfirmed) return;
    try {
      const rtid = donation.rtidCode;
      // Cancel in appointments collection
      const appSnap = await getDocs(query(collection(db, 'appointments'), where('rtid', '==', rtid)));
      if (!appSnap.empty) await updateDoc(appSnap.docs[0].ref, { status: 'Cancelled', cancelledAt: Timestamp.now() });
      // Cancel in donations collection
      const donRef = doc(db, 'donations', rtid);
      if ((await getDoc(donRef)).exists()) await updateDoc(donRef, { status: 'Cancelled', cancelledAt: Timestamp.now() });

      setDonationHistory(prev => prev.map(d => d.rtidCode === rtid ? { ...d, status: 'Cancelled' as DonationStatus } : d));
      toast.success('Appointment cancelled.');
    } catch (e: any) { toast.error('Could not cancel', { description: e.message }); }
  };

  const handleViewHrtid = async (hrtid: string) => {
    setHrtidLoading(true); setHrtidModalOpen(true); setHrtidDetails(null);
    try {
      let data: any = null, hospitalName = 'Hospital';
      const tryDoc  = async (id: string) => { try { const s = await getDoc(doc(db, 'bloodRequests', id)); return s.exists() ? s.data() : null; } catch { return null; } };
      const tryQuery = async (field: string, val: string) => { try { const s = await getDocs(query(collection(db, 'bloodRequests'), where(field, '==', val))); return s.empty ? null : s.docs[0].data(); } catch { return null; } };
      data = await tryDoc(hrtid) || await tryQuery('linkedRTID', hrtid) || await tryQuery('rtid', hrtid);
      if (data?.hospitalId) { try { const s = await getDoc(doc(db, 'users', data.hospitalId)); if (s.exists()) hospitalName = s.data().fullName || 'Hospital'; } catch (_) {} }
      if (!data) { toast.error('Request not found'); setHrtidModalOpen(false); return; }
      const matching = donationHistory.find(d => d.linkedHrtid === hrtid);
      setHrtidDetails({ patientName: data.patientName, bloodGroup: data.bloodGroup, units: data.units || data.unitsRequired, hospital: hospitalName, rtidCode: hrtid, bloodBankId: '', component: data.component || 'Whole Blood', requiredBy: data.requiredBy ? formatDateTimeDMY(safeDate(data.requiredBy)) : 'N/A', impactTimeline: matching?.impactTimeline });
    } catch (_) { toast.error('Failed to fetch details'); setHrtidModalOpen(false); }
    finally { setHrtidLoading(false); }
  };

  const handleAvailabilityChange = async (mode: 'available'|'weekends'|'unavailable') => {
    if (!userId) return;
    try {
      await updateDoc(doc(db, 'users', userId), { availabilityMode: mode });
      setDonorData(prev => ({ ...prev, availabilityMode: mode }));
      toast.success('Availability updated');
    } catch (_) { toast.error('Update failed'); }
  };

  const handleLogoutConfirm = () => {
    Swal.fire({ title: 'Logout?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#8B0000', confirmButtonText: 'Yes, Logout' }).then(r => { if (r.isConfirmed) onLogout(); });
  };

  const initials = (n: string) => (n || '').split(' ').map(s => s[0] || '').slice(0, 2).join('').toUpperCase();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

// This is the return() + modals.
// ============================================================
  return (
    <div className="min-h-screen bg-background pb-8">

      {/* ═══ HEADER ═══════════════════════════════════════════ */}
      <header className="bg-[#8B0000] text-white py-4 shadow-lg no-print sticky top-0 z-40">
        <div className="container mx-auto px-4 max-w-3xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img src={logo} alt="RaktPort" className="w-10 h-10 rounded-full border-2 border-white/40 shadow flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold leading-tight truncate">
                Hello, {(donorData.fullName || 'Donor').split(' ')[0]}! 👋
                {donorData.bloodGroup && <span className="ml-2 bg-white/20 text-xs px-2 py-0.5 rounded-full">{donorData.bloodGroup}</span>}
              </h1>
              <p className="text-xs text-red-200 opacity-80 truncate">{donorData.donorId || 'RaktPort Donor'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="secondary" size="sm" className="bg-white text-[#8B0000] hover:bg-gray-100 text-xs px-3" onClick={() => setProfileOpen(true)}>
              <User className="w-3.5 h-3.5 mr-1" /> Profile
            </Button>
            <button onClick={handleLogoutConfirm} className="text-xs font-medium opacity-80 hover:opacity-100 px-1">Logout</button>
          </div>
        </div>
      </header>

      {/* ═══ MOTIVATION BANNER ══════════════════════════════════ */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100 py-2 no-print">
        <p className="text-xs sm:text-sm text-center text-orange-800 font-medium px-4 flex items-center justify-center gap-2">
          <Star className="w-3.5 h-3.5 fill-orange-500 text-orange-500 flex-shrink-0" />
          <em>"{motivationQuote}"</em>
        </p>
      </div>

      {/* ═══ EMERGENCY ALERTS ════════════════════════════════════ */}
      {emergencyAlerts.length > 0 && (
        <div className="no-print">
          {emergencyAlerts.map(alert => (
            <div key={alert.id} className={`px-4 py-3 flex items-center gap-3 flex-wrap ${alert.urgency === 'critical' ? 'bg-red-600' : 'bg-orange-500'} text-white`}>
              <Zap className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-semibold flex-1">
                🚨 Urgent: <strong>{alert.bloodGroup}</strong> needed at {alert.hospitalName}
              </span>
              <Button size="sm" className="bg-white text-red-700 hover:bg-gray-100 text-xs py-1 h-7"
                onClick={() => { setScheduleOpen(true); setEmergencyOpen(false); }}>
                Respond Now
              </Button>
              <button onClick={() => setEmergencyAlerts(prev => prev.filter(a => a.id !== alert.id))} className="opacity-70 hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ═══ MAIN CONTENT ════════════════════════════════════════ */}
      <main className="container mx-auto px-4 max-w-3xl py-5 space-y-5">

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-md flex gap-2 no-print">
            <AlertCircle className="text-red-500 w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* ── ELIGIBILITY + NEXT ELIGIBLE COUNTDOWN ─────────── */}
        <Card className={`shadow-md border-l-4 no-print ${isEligible ? 'border-l-green-500' : 'border-l-red-500'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0 ${isEligible ? 'bg-green-100' : 'bg-red-100'}`}>
                {isEligible ? '🩸' : '🚫'}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm ${isEligible ? 'text-green-700' : 'text-red-600'}`}>{eligibilityMsg}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Last donation: {lastDonationDisplay}</p>

                {!isEligible && nextEligibleDate && nextEligibleDate > new Date() && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <AlarmClock className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-blue-700">Next eligible: {nextEligibleDisplay}</p>
                        <CountdownTimer targetDate={nextEligibleDate} compact label="Time remaining" />
                      </div>
                    </div>
                    {/* Progress bar */}
                    {donationHistory.filter(d => ['Donated','Completed','Redeemed-Credit'].includes(d.status)).length > 0 && (() => {
                      const lastDon = donationHistory.find(d => ['Donated','Completed','Redeemed-Credit'].includes(d.status));
                      if (!lastDon) return null;
                      const comp = lastDon.component || 'Whole Blood';
                      const isFemale = (donorData.gender || '').toLowerCase() === 'female';
                      const total = COOLDOWN_DAYS[comp][isFemale ? 'female' : 'male'] * 86400000;
                      const elapsed = Date.now() - lastDon.date.getTime();
                      const pct = Math.min(Math.round((elapsed / total) * 100), 100);
                      return (
                        <div className="mt-1.5">
                          <div className="flex justify-between text-[10px] text-blue-600 mb-0.5">
                            <span>Recovery progress</span><span>{pct}%</span>
                          </div>
                          <Progress value={pct} className="h-1.5" />
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
              <Button size="sm" onClick={() => setScheduleOpen(true)} disabled={!isEligible}
                className={`flex-shrink-0 text-xs px-3 ${isEligible ? 'bg-green-600 hover:bg-green-700 text-white animate-pulse' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                {isEligible ? '❤️ Donate' : '🚫 Not Yet'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── CREDITS + STREAK ──────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 no-print">
          <Card className="shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => {}}>
            <CardContent className="p-3 text-center">
              <Droplet className="w-5 h-5 text-red-500 fill-red-500 mx-auto mb-1" />
              <p className="text-2xl font-black text-gray-800">{donorData.credits || 0}</p>
              <p className="text-xs text-gray-500">Credits</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-3 text-center">
              <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
              <p className="text-2xl font-black text-gray-800">{donationStreak}</p>
              <p className="text-xs text-gray-500">Streak (12mo)</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-3 text-center">
              <Heart className="w-5 h-5 text-pink-500 fill-pink-400 mx-auto mb-1" />
              <p className="text-2xl font-black text-gray-800">{(donorData.donationsCount || 0) * 3}</p>
              <p className="text-xs text-gray-500">Lives</p>
            </CardContent>
          </Card>
        </div>

        {/* ── QUICK ACTIONS GRID ────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 no-print">
          {[
            { icon: '🏆', label: 'Certificate', action: () => setCertOpen(true), color: 'from-amber-50 to-yellow-50 border-amber-200' },
            { icon: '🩸', label: 'Compatibility', action: () => setCompatOpen(true), color: 'from-red-50 to-rose-50 border-red-200' },
            { icon: '💡', label: 'Health Tips', action: () => setHealthTipsOpen(true), color: 'from-blue-50 to-indigo-50 border-blue-200' },
            { icon: '📤', label: 'Share', action: () => setShareOpen(true), color: 'from-purple-50 to-pink-50 border-purple-200' },
          ].map(({ icon, label, action, color }) => (
            <button key={label} onClick={action}
              className={`bg-gradient-to-br ${color} border rounded-2xl p-4 flex flex-col items-center gap-2 hover:shadow-md active:scale-95 transition-all touch-manipulation`}>
              <span className="text-2xl">{icon}</span>
              <span className="text-xs font-semibold text-gray-700">{label}</span>
            </button>
          ))}
        </div>

        {/* ── ROTATING HEALTH TIP ───────────────────────────── */}
        <div className="no-print bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100 flex items-start gap-3 cursor-pointer" onClick={() => setHealthTipsOpen(true)}>
          <span className="text-2xl flex-shrink-0">{HEALTH_TIPS[currentHealthTip].icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-0.5">
              <p className="text-xs font-bold text-blue-800">{HEALTH_TIPS[currentHealthTip].title}</p>
              <Badge variant="outline" className="text-[9px] px-1 py-0 border-blue-200 text-blue-600 ml-auto">Health Tip</Badge>
            </div>
            <p className="text-xs text-blue-600 line-clamp-2">{HEALTH_TIPS[currentHealthTip].tip}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        </div>

        {/* ── IMPACT SECTION ────────────────────────────────── */}
        <div className="no-print">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2"><Award className="w-4 h-4 text-yellow-500" /> Your Impact</h3>
            <button onClick={() => setCompatOpen(true)} className="text-xs text-primary flex items-center gap-1 font-semibold hover:underline">
              {donorData.bloodGroup} Compatibility <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-white hover:shadow-md transition-shadow border-t-4 border-t-blue-500">
              <CardContent className="p-4 text-center">
                <Droplet className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-2xl font-black">{donorData.donationsCount || 0}</p>
                <p className="text-xs text-gray-500">Total Donations</p>
              </CardContent>
            </Card>
            <Card className="bg-white hover:shadow-md transition-shadow border-t-4 border-t-amber-500">
              <CardContent className="p-4 text-center">
                <Award className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <p className={`text-xs font-bold mt-0.5 px-2 py-0.5 rounded-full text-white ${badgeBg(donorData.donationsCount || 0)} inline-block`}>
                  {computeBadge(donorData.donationsCount || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Current Rank</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            DONATION HISTORY TABLE
        ════════════════════════════════════════════════════════════ */}
        <Card className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-4">
            <CardTitle className="text-sm text-gray-800 flex items-center gap-2">
              <List className="w-4 h-4 text-primary" /> Donation History &amp; Credits
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">Tap QR icon to view verification code. Tap H badge to see patient impact.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {donationHistory.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">
                <List className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No donations yet — start your life-saving journey!</p>
                <Button size="sm" className="mt-3 bg-primary" onClick={() => setScheduleOpen(true)}>Book Appointment</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/30">
                      <TableHead className="text-xs font-semibold px-3 py-2 min-w-[100px]">Date</TableHead>
                      <TableHead className="text-xs font-semibold px-3 py-2 min-w-[130px]">D-RTID</TableHead>
                      <TableHead className="text-xs font-semibold px-3 py-2 hidden sm:table-cell">Component</TableHead>
                      <TableHead className="text-xs font-semibold px-3 py-2 hidden md:table-cell">OTP</TableHead>
                      <TableHead className="text-xs font-semibold px-3 py-2">Status</TableHead>
                      <TableHead className="text-xs font-semibold px-3 py-2 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donationHistory.map((r, i) => {
                      const canCancel = ['Scheduled','Pending'].includes(r.status);
                      const canReschedule = canCancel;
                      const isFuture = r.date.getTime() > Date.now();
                      return (
                        <TableRow key={i} className="hover:bg-gray-50 transition-colors">

                          {/* Date + countdown for scheduled */}
                          <TableCell className="px-3 py-2.5">
                            <div>
                              <p className="text-xs font-semibold text-gray-800">{formatDateDMY(r.date)}</p>
                              {r.time && <p className="text-[10px] text-gray-400">{r.time}</p>}
                              {canCancel && isFuture && (
                                <CountdownTimer targetDate={r.date} compact label="In" />
                              )}
                            </div>
                          </TableCell>

                          {/* RTID + H badge */}
                          <TableCell className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 max-w-[100px] truncate" title={r.rtidCode}>
                                {r.rtidCode?.length > 14 ? r.rtidCode.slice(0,14)+'…' : r.rtidCode}
                              </span>
                              {r.linkedHrtid && r.linkedHrtid !== '—' && r.linkedHrtid !== 'N/A' && (
                                <button onClick={() => handleViewHrtid(r.linkedHrtid)}
                                  className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold border border-blue-200 hover:bg-blue-200" title="View patient impact">H</button>
                              )}
                            </div>
                          </TableCell>

                          {/* Component */}
                          <TableCell className="px-3 py-2.5 hidden sm:table-cell">
                            {r.component && <ComponentBadge component={r.component} />}
                          </TableCell>

                          {/* OTP */}
                          <TableCell className="px-3 py-2.5 hidden md:table-cell">
                            {['Donated','Verified'].includes(r.status) ? (
                              <div>
                                <div className="flex items-center gap-1 text-green-700 font-bold text-xs bg-green-50 px-1.5 py-0.5 rounded w-fit">
                                  <KeyRound className="w-2.5 h-2.5" /> {r.otp}
                                </div>
                              </div>
                            ) : <span className="text-gray-300 text-xs">●●●●●●</span>}
                          </TableCell>

                          {/* Status */}
                          <TableCell className="px-3 py-2.5">
                            {r.status === 'Scheduled' && <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50 text-[10px]">Scheduled</Badge>}
                            {r.status === 'Pending'   && <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50 text-[10px]">Pending</Badge>}
                            {r.status === 'Donated'   && <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50 text-[10px]">Available</Badge>}
                            {r.status === 'Verified'  && <Badge variant="outline" className="border-teal-300 text-teal-700 bg-teal-50 text-[10px]">Verified</Badge>}
                            {r.status === 'Credited'  && <Badge variant="outline" className="border-indigo-300 text-indigo-700 bg-indigo-50 text-[10px]">Credited</Badge>}
                            {r.status === 'Redeemed-Credit' && <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50 text-[10px]">Redeemed</Badge>}
                            {r.status === 'Completed' && <Badge variant="outline" className="border-gray-300 text-gray-600 bg-gray-50 text-[10px]">Completed</Badge>}
                            {r.status === 'Expired'   && <Badge variant="outline" className="border-red-300 text-red-700 bg-red-50 text-[10px]">Expired</Badge>}
                            {r.status === 'Cancelled' && <Badge variant="outline" className="border-gray-400 text-gray-500 bg-gray-100 text-[10px]">Cancelled</Badge>}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="px-3 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-0.5">
                              {canReschedule && (
                                <button onClick={() => handleRescheduleClick(r)} title="Reschedule"
                                  className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 hover:text-blue-700 transition-colors">
                                  <CalendarCheck className="w-4 h-4" />
                                </button>
                              )}
                              {canCancel && (
                                <button onClick={() => handleCancelAppointment(r)} title="Cancel appointment"
                                  className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors">
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button onClick={() => handleViewHistoryQR(r)} title="View QR"
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-primary transition-colors">
                                <QrCode className="w-4 h-4" />
                              </button>
                              <button onClick={() => setDonationToPrint(r)} title="Print slip"
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-primary transition-colors">
                                <Printer className="w-4 h-4" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

      </main>

      {/* ═══════════════════════════════════════════════════════════
          MODALS
      ═══════════════════════════════════════════════════════════ */}

      {/* ── Profile Modal ─────────────────────────────────── */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl no-print max-h-[95vh] overflow-y-auto">
          <div className="flex flex-col sm:flex-row h-full">

            {/* Left: Digital ID Card */}
            <div className="w-full sm:w-[200px] sm:flex-shrink-0 bg-gradient-to-br from-[#8B0000] to-[#5a0000] text-white p-5 flex flex-col items-center justify-center text-center relative">
              <div className="w-20 h-20 rounded-full border-4 border-white/30 bg-white/10 flex items-center justify-center text-3xl font-black mb-3">
                {initials(donorData.fullName || 'D')}
              </div>
              <h2 className="text-lg font-bold mb-0.5">{donorData.fullName}</h2>
              <p className="text-xs text-red-200 mb-3 font-mono">{donorData.donorId || 'RKT-XXXXXX'}</p>
              <div className="bg-white/10 rounded-xl p-3 w-full border border-white/10 mb-3">
                <div className="flex justify-around">
                  <div className="text-center">
                    <p className="text-[10px] text-red-200 uppercase">Blood</p>
                    <p className="text-2xl font-black">{donorData.bloodGroup}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-red-200 uppercase">Age</p>
                    <p className="text-lg font-bold">{calculateAge(donorData.dob)} yr</p>
                  </div>
                </div>
              </div>
              <QRCodeCanvas data={`Profile:${donorData.donorId || userId}`} size={80} className="rounded-lg bg-white p-1" />
              <p className="text-[9px] text-red-300 mt-1.5">Scan to verify</p>
            </div>

            {/* Right: Tabs */}
            <div className="flex-1 bg-white p-4 overflow-y-auto">
              <Tabs defaultValue="overview">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="badges">Badges</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                {/* Overview */}
                <TabsContent value="overview" className="space-y-2.5">
                  {[
                    { icon: MapPin,   label: 'Location',     value: `${donorData.city || '—'}${donorData.pincode ? ', ' + donorData.pincode : ''}` },
                    { icon: BadgeCheck, label: 'Donor ID',   value: donorData.donorId || 'RKT-XXXXXX' },
                    { icon: Mail,     label: 'Email',        value: donorData.email || '—' },
                    { icon: Phone,    label: 'Mobile',       value: donorData.mobile || '—' },
                    { icon: CalendarCheck, label: 'Last Donation', value: lastDonationDisplay },
                    { icon: Calendar, label: 'Next Eligible', value: nextEligibleDisplay },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 font-medium">{label}</p>
                        <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
                      </div>
                    </div>
                  ))}
                  {nextEligibleDate && nextEligibleDate > new Date() && (
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-2">
                        <AlarmClock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-blue-800">Countdown to next donation</p>
                          <CountdownTimer targetDate={nextEligibleDate} compact />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => { setCompatOpen(true); setProfileOpen(false); }}>
                      <HeartHandshake className="w-3.5 h-3.5 mr-1" /> Compatibility
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => { setCertOpen(true); setProfileOpen(false); }}>
                      <Download className="w-3.5 h-3.5 mr-1" /> Certificate
                    </Button>
                  </div>
                </TabsContent>

                {/* Badges */}
                <TabsContent value="badges">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: '🥉', label: 'Bronze Donor',  req: 1,  desc: '1+ donations' },
                      { icon: '🥈', label: 'Silver Donor',  req: 5,  desc: '5+ donations' },
                      { icon: '🥇', label: 'Gold Donor',    req: 10, desc: '10+ donations' },
                      { icon: '💎', label: 'Diamond Donor', req: 20, desc: '20+ donations' },
                    ].map(b => {
                      const unlocked = (donorData.donationsCount || 0) >= b.req;
                      return (
                        <div key={b.label} className={`p-4 rounded-xl border-2 text-center transition-all ${unlocked ? 'border-yellow-300 bg-yellow-50' : 'border-gray-100 bg-gray-50 opacity-50 grayscale'}`}>
                          <span className="text-3xl">{b.icon}</span>
                          <p className="text-xs font-bold mt-1 text-gray-800">{b.label}</p>
                          <p className="text-[10px] text-gray-500">{b.desc}</p>
                          {unlocked && <p className="text-[9px] text-green-600 font-bold mt-0.5">✓ Unlocked</p>}
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>

                {/* Settings */}
                <TabsContent value="settings" className="space-y-4">
                  <div>
                    <Label className="text-sm mb-2 block">Availability Mode</Label>
                    <Select value={donorData.availabilityMode || 'available'} onValueChange={v => handleAvailabilityChange(v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">✅ Available Now</SelectItem>
                        <SelectItem value="weekends">📅 Weekends Only</SelectItem>
                        <SelectItem value="unavailable">🚫 Unavailable</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">Controls visibility in emergency searches</p>
                  </div>
                  <div className="space-y-3">
                    {[['SMS Notifications','Receive updates about camps'],['Emergency Alerts','Get notified for urgent nearby needs'],['Show in Donor List','Allow hospitals to find you']].map(([l,d]) => (
                      <div key={l} className="flex items-center justify-between">
                        <div><Label className="text-sm">{l}</Label><p className="text-xs text-muted-foreground">{d}</p></div>
                        <Switch defaultChecked />
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Schedule / Find Centres Modal ─────────────────── */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="max-w-lg rounded-2xl no-print max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> Find Blood Banks</DialogTitle>
            <DialogDescription>Find verified blood banks near you to book your donation</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Enter city (e.g. Delhi, Mumbai)" value={scheduleCity} onChange={e => setScheduleCity(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleFindCenters()} className="flex-1" />
              <Button onClick={handleFindCenters} disabled={apiLoading || !scheduleCity.trim()}>
                {apiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </Button>
            </div>
            {apiLoading && <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" /><p className="text-sm text-gray-500">Finding blood banks…</p></div>}
            {!apiLoading && centers.length > 0 && (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {centers.map(c => (
                  <div key={c.id} className="border-2 rounded-xl p-3 hover:border-primary cursor-pointer transition-all group" onClick={() => handleSelectCenter(c)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />{c.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-start gap-1"><MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />{c.fullAddress || c.address}</p>
                        {c.phone && <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{c.phone}</p>}
                      </div>
                      <Badge className="bg-primary text-white text-xs flex-shrink-0 group-hover:bg-primary/90">Book</Badge>
                    </div>
                    {c.latitude && c.longitude && (
                      <button className="mt-2 text-[10px] text-blue-600 flex items-center gap-1 hover:underline" onClick={e => { e.stopPropagation(); window.open(`https://www.google.com/maps/dir/?api=1&destination=${c.latitude},${c.longitude}`, '_blank'); }}>
                        <Navigation className="w-3 h-3" /> Get Directions
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!apiLoading && centers.length === 0 && scheduleCity && (
              <div className="text-center py-8 text-gray-400">
                <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No blood banks found in "{scheduleCity}"</p>
                <p className="text-xs mt-1">Try variations like "New Delhi" or "Mumbai"</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Booking Modal ─────────────────────────────────── */}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="max-w-sm rounded-2xl no-print">
          <DialogHeader>
            <DialogTitle>Confirm Appointment</DialogTitle>
            <DialogDescription>Book at <strong>{selectedCenter?.name}</strong></DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs mb-1 block">Date</Label>
              <Input type="date" value={bookingForm.date} min={new Date().toISOString().split('T')[0]} onChange={e => setBookingForm(f => ({...f, date: e.target.value}))} />
            </div>
            <div><Label className="text-xs mb-1 block">Time</Label>
              <Select value={bookingForm.time} onValueChange={v => setBookingForm(f => ({...f, time: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['09:00 AM','10:00 AM','11:00 AM','12:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1 block">Donation Type</Label>
              <Select value={bookingForm.component} onValueChange={v => setBookingForm(f => ({...f, component: v as DonationComponent}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Whole Blood">Whole Blood (90 day interval)</SelectItem>
                  <SelectItem value="Platelets">Platelets (7 day interval)</SelectItem>
                  <SelectItem value="Plasma">Plasma (14 day interval)</SelectItem>
                  <SelectItem value="PRBC">PRBC (90 day interval)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setBookingOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleBookAppointment} disabled={apiLoading || !bookingForm.date}>
              {apiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null} Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Booking Confirm Modal ──────────────────────────── */}
      <Dialog open={bookingConfirmOpen} onOpenChange={setBookingConfirmOpen}>
        <DialogContent className="max-w-sm rounded-2xl text-center no-print">
          <DialogHeader>
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3"><Check className="w-7 h-7 text-green-600" /></div>
            <DialogTitle className="text-green-700">Booking Confirmed!</DialogTitle>
          </DialogHeader>
          <div className="py-4 flex flex-col items-center gap-3 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-xs text-gray-500 font-medium">Show this QR at the centre</p>
            <canvas ref={qrCanvasRef} className="border-4 border-white shadow rounded-lg" />
            <p className="font-mono font-bold text-sm tracking-wider bg-white px-3 py-1 rounded border">{bookingDetails.rtid}</p>
          </div>
          <Button className="w-full mt-2" onClick={() => setBookingConfirmOpen(false)}>Done</Button>
        </DialogContent>
      </Dialog>

      {/* ── Reschedule Modal ───────────────────────────────── */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="max-w-sm rounded-2xl no-print">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>Choose a new date and time for your appointment</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs mb-1 block">New Date</Label>
              <Input type="date" value={rescheduleForm.date} min={new Date().toISOString().split('T')[0]} onChange={e => setRescheduleForm(f => ({...f, date: e.target.value}))} />
            </div>
            <div><Label className="text-xs mb-1 block">New Time</Label>
              <Select value={rescheduleForm.time} onValueChange={v => setRescheduleForm(f => ({...f, time: v}))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['09:00 AM','10:00 AM','11:00 AM','12:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setRescheduleOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleRescheduleAppointment} disabled={apiLoading}>
              {apiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null} Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── H-RTID Details Modal ──────────────────────────── */}
      <Dialog open={hrtidModalOpen} onOpenChange={setHrtidModalOpen}>
        <DialogContent className="rounded-2xl no-print max-w-sm">
          <DialogHeader>
            <DialogTitle>Linked Patient Request</DialogTitle>
            <DialogDescription>This donation was linked to a specific patient need</DialogDescription>
          </DialogHeader>
          {hrtidLoading ? <div className="flex justify-center p-6"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
          : hrtidDetails ? (
            <div className="space-y-3">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-2 text-sm">
                {[['H-RTID', hrtidDetails.rtidCode], ['Patient', hrtidDetails.patientName], ['Hospital', hrtidDetails.hospital], ['Blood Group', hrtidDetails.bloodGroup], ['Units', String(hrtidDetails.units)], ['Required By', hrtidDetails.requiredBy || 'N/A']].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2"><span className="text-xs text-gray-500 font-medium">{k}</span><span className="text-xs font-bold text-gray-900 text-right max-w-[55%] truncate" title={v}>{v}</span></div>
                ))}
              </div>
              {hrtidDetails.impactTimeline && <ImpactTimelineView timeline={hrtidDetails.impactTimeline} />}
            </div>
          ) : <p className="text-center text-sm text-gray-400 py-4">No details available</p>}
        </DialogContent>
      </Dialog>

      {/* ── Feature Modals ────────────────────────────────── */}
      <CertificateModal isOpen={certOpen} onClose={() => setCertOpen(false)} donorData={donorData} donationHistory={donationHistory} />
      <BloodCompatibilityModal isOpen={compatOpen} onClose={() => setCompatOpen(false)} bloodGroup={donorData.bloodGroup || 'O+'} />
      <HealthTipsSection isOpen={healthTipsOpen} onClose={() => setHealthTipsOpen(false)} />
      <ShareCardModal isOpen={shareOpen} onClose={() => setShareOpen(false)} donorData={donorData} />
      <HistoryQRModal isOpen={historyQROpen} onClose={() => setHistoryQROpen(false)} data={selectedHistoryQR} />

      {/* Printable slip */}
      <PrintableDonation donation={donationToPrint} donorData={donorData} />

    </div>
  );
}

export default DonorDashboard;