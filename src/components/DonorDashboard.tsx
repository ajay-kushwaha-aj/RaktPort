// ═══════════════════════════════════════════════════════════════
// DonorDashboard.tsx  — PART 1 of 3
// FIXES:
//   • Certificate download: blob-URL new-window (no more CSS bugs)
//     QR rendered as data-URL, logo resolved as absolute URL,
//     images preloaded before auto-print in new tab
//   • PrintableDonation: RTID highlighted with red border
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ModeToggle } from './mode-toggle';
import { createPortal } from 'react-dom';
import { Button }  from './ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from './ui/card';
import { Badge }   from './ui/badge';
import {
  Calendar, Heart, Printer, QrCode, Loader2, User, List, KeyRound,
  Share2, Award, Droplet, Clock, Star, MapPin,
  Phone, Mail, CalendarCheck, AlertCircle,
  TrendingUp, Activity, Check, X, Timer, Zap,
  Gift, XCircle, Download,
  BookOpen, Flame, ChevronRight,
  Navigation, HeartHandshake, BadgeCheck, Building2,
} from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from './ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from './ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input }  from './ui/input';
import { Switch } from './ui/switch';
import { Label }  from './ui/label';
import { Progress } from './ui/progress';
import { calculateDonorEligibility } from '../lib/medical-eligibility';
import QRious from 'qrious';
import { toast } from './ui/sonner';
import logo from '../assets/raktport-logo.png';
import Swal from 'sweetalert2';
import { db } from '../firebase';
import {
  doc, getDoc, collection, query, where, getDocs,
  addDoc, setDoc, updateDoc, Timestamp,
} from 'firebase/firestore';
import { generateDonorId } from '../lib/auth';
import { formatUsername } from '../lib/identity';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

const safeDate = (v: any): Date => {
  if (!v) return new Date();
  if (v?.toDate) return v.toDate();
  if (v instanceof Date && !isNaN(v.getTime())) return v;
  if (typeof v === 'string') { const d = new Date(v); if (!isNaN(d.getTime())) return d; }
  if (typeof v === 'number') return new Date(v);
  if (v?.seconds) return new Date(v.seconds * 1000);
  return new Date();
};

const formatDateDMY = (d: Date | string | null | undefined): string => {
  if (!d) return 'N/A';
  try {
    const date = d instanceof Date ? d : new Date(d as string);
    if (isNaN(date.getTime())) return 'N/A';
    return `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${date.getFullYear()}`;
  } catch { return 'N/A'; }
};

const formatDateTimeDMY = (d: Date | string | null | undefined): string => {
  if (!d) return 'N/A';
  try {
    const date = d instanceof Date ? d : new Date(d as string);
    if (isNaN(date.getTime())) return 'N/A';
    return `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
  } catch { return 'N/A'; }
};

// generateDonorId is now imported from '../lib/auth'

const generateUniqueAppointmentRtid = async (dateStr: string): Promise<string> => {
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
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
  const n = city.toLowerCase().trim();
  const map: Record<string, string[]> = {
    delhi:['delhi','new delhi','ncr delhi','delhi ncr','nd'], mumbai:['mumbai','bombay'],
    bengaluru:['bengaluru','bangalore'], kolkata:['kolkata','calcutta'],
    chennai:['chennai','madras'], hyderabad:['hyderabad','hyd'],
    pune:['pune','poona'], gurugram:['gurugram','gurgaon'], noida:['noida','greater noida'],
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
type DonationStatus = 'Scheduled'|'Pending'|'Donated'|'Verified'|'Credited'|'Redeemed-Credit'|'Pledged'|'Completed'|'Expired'|'Archived'|'Cancelled';
type Gender = 'Male'|'Female'|'male'|'female';
interface DonorDashboardProps { onLogout: () => void; }
interface DonorData {
  fullName?:string; bloodGroup?:string; gender?:string; lastDonationDate?:string;
  city?:string; pincode?:string; donationsCount?:number; credits?:number;
  email?:string; mobile?:string; dob?:string; donorId?:string;
  internalId?:string; username?:string;
  availabilityMode?:'available'|'weekends'|'unavailable';
}
interface Donation {
  date:Date; rtidCode:string; linkedHrtid:string; hospitalName:string; city:string;
  status:DonationStatus; otp:string; expiryDate?:Date; component?:DonationComponent;
  qrRedemptionStatus?:'Redeemed'|'Pending'|'Expired'; otpExpiryTime?:Date;
  impactTimeline?:ImpactTimeline; time?:string;
}
interface ImpactTimeline { donated:Date; linkedToRequest?:Date; usedByPatient?:Date; creditIssued?:Date; }
interface BloodCenter { id:string; name:string; address:string; phone:string; city?:string; state?:string; pincode?:string; latitude?:number; longitude?:number; fullAddress?:string; }
interface HrtidDetails { patientName:string; bloodGroup:string; units:string|number; hospital:string; rtidCode:string; bloodBankId:string; requiredBy?:string; component?:DonationComponent; impactTimeline?:ImpactTimeline; }
interface EmergencyAlert { id:string; bloodGroup:string; hospitalName:string; urgency:'critical'|'high'|'medium'; expiresAt:Date; hrtid:string; city:string; }

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
  {icon:'💧',title:'Hydrate Well',tip:'Drink at least 500ml of water 2 hours before donating.'},
  {icon:'🥗',title:'Eat Iron-Rich Foods',tip:'Spinach, red meat, beans — eat them 24h before donating.'},
  {icon:'😴',title:'Sleep Well',tip:'Get 7–8 hours of sleep the night before donation.'},
  {icon:'🍊',title:'Vitamin C Boost',tip:'Vitamin C greatly enhances iron absorption.'},
  {icon:'🚫',title:'Avoid Alcohol',tip:'No alcohol for at least 24 hours before and after donating.'},
  {icon:'🏃',title:'Light Activity Only',tip:'Avoid strenuous exercise on donation day.'},
  {icon:'🍌',title:'Post-Donation Snack',tip:'Have juice and biscuits after donation.'},
  {icon:'📅',title:'Track Your Dates',tip:'Whole blood donors wait 90 days (male) or 120 days (female).'},
];

const BLOOD_COMPATIBILITY: Record<string,{donateTo:string[];receiveFrom:string[];facts:string}> = {
  'A+': {donateTo:['A+','AB+'],                              receiveFrom:['A+','A-','O+','O-'],                    facts:'A+ is the 2nd most common blood type.'},
  'A-': {donateTo:['A+','A-','AB+','AB-'],                   receiveFrom:['A-','O-'],                              facts:'A- can donate to all A and AB recipients.'},
  'B+': {donateTo:['B+','AB+'],                              receiveFrom:['B+','B-','O+','O-'],                    facts:'B+ helps other B+ and AB+ patients.'},
  'B-': {donateTo:['B+','B-','AB+','AB-'],                   receiveFrom:['B-','O-'],                              facts:'B- helps both positive and negative B/AB.'},
  'O+': {donateTo:['A+','B+','O+','AB+'],                    receiveFrom:['O+','O-'],                              facts:'O+ is the most common blood type!'},
  'O-': {donateTo:['A+','A-','B+','B-','O+','O-','AB+','AB-'],receiveFrom:['O-'],                                  facts:'O- is the universal donor.'},
  'AB+':{donateTo:['AB+'],                                   receiveFrom:['A+','A-','B+','B-','O+','O-','AB+','AB-'],facts:'AB+ is the universal recipient.'},
  'AB-':{donateTo:['AB+','AB-'],                             receiveFrom:['A-','B-','O-','AB-'],                   facts:'AB- is one of the rarest blood types.'},
};

const COOLDOWN_DAYS: Record<DonationComponent,{male:number;female:number}> = {
  'Whole Blood':{male:90,female:120},
  Platelets:   {male:7, female:7  },
  Plasma:      {male:14,female:14 },
  PRBC:        {male:90,female:120},
};

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

const QRCodeCanvas = ({data,size=256,className=''}:{data:string;size?:number;className?:string}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    if(ref.current && data) try{new QRious({element:ref.current,value:data,size,foreground:'#8B0000',level:'H'});}catch(_){}
  },[data,size]);
  return <canvas ref={ref} width={size} height={size} className={className}/>;
};

const CountdownTimer = ({targetDate,compact=false,label=''}:{targetDate:Date;compact?:boolean;label?:string}) => {
  const [display,setDisplay] = useState('');
  const [isPast,setIsPast]   = useState(false);
  useEffect(()=>{
    const update = () => {
      const diff = targetDate.getTime()-Date.now();
      setIsPast(diff<=0);
      if(diff<=0){setDisplay('Time passed');return;}
      const days=Math.floor(diff/86400000),hours=Math.floor((diff%86400000)/3600000),mins=Math.floor((diff%3600000)/60000),secs=Math.floor((diff%60000)/1000);
      if(days>1) setDisplay(`${days}d ${hours}h ${mins}m`);
      else if(days===1) setDisplay(`1d ${hours}h ${mins}m`);
      else if(hours>0)  setDisplay(`${hours}h ${mins}m ${secs}s`);
      else              setDisplay(`${mins}m ${secs}s`);
    };
    update(); const id=setInterval(update,1000); return ()=>clearInterval(id);
  },[targetDate]);
  if(compact) return <span className={`text-xs font-mono font-semibold ${isPast?'text-red-500':'text-blue-600'}`}>{label&&<span className="opacity-70">{label} </span>}{display}</span>;
  return <div className={`flex items-center gap-1.5 ${isPast?'text-red-600':'text-blue-700'}`}><Clock className="w-3.5 h-3.5 flex-shrink-0"/><span className="text-xs font-semibold font-mono">{label&&`${label}: `}{display}</span></div>;
};

const ComponentBadge = ({component}:{component:DonationComponent}) => {
  const colors:Record<DonationComponent,string> = {'Whole Blood':'bg-red-100 text-red-700 border-red-300',Platelets:'bg-amber-100 text-amber-700 border-amber-300',Plasma:'bg-yellow-100 text-yellow-700 border-yellow-300',PRBC:'bg-rose-100 text-rose-700 border-rose-300'};
  return <Badge variant="outline" className={`text-xs font-medium ${colors[component]??''}`}>{component}</Badge>;
};

const QRStatusBadge = ({status,expiryTime}:{status:'Redeemed'|'Pending'|'Expired';expiryTime?:Date}) => {
  const cfg = {Redeemed:{cls:'bg-green-100 text-green-700 border-green-300',lbl:'✅ Redeemed'},Expired:{cls:'bg-red-100 text-red-700 border-red-300',lbl:'❌ Expired'},Pending:{cls:'bg-yellow-100 text-yellow-700 border-yellow-300',lbl:'⏳ Pending'}}[status];
  const hoursLeft = expiryTime ? Math.max(0,Math.floor((expiryTime.getTime()-Date.now())/3600000)) : null;
  return <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.cls}`}>{cfg.lbl}{status==='Pending'&&hoursLeft!==null&&<span className="ml-1 opacity-75">({hoursLeft}h left)</span>}</div>;
};

const ImpactTimelineView = ({timeline}:{timeline:ImpactTimeline}) => {
  const stages=[{key:'donated',label:'Donated',date:timeline.donated,icon:Droplet},{key:'linkedToRequest',label:'Linked to Request',date:timeline.linkedToRequest,icon:Heart},{key:'usedByPatient',label:'Used by Patient',date:timeline.usedByPatient,icon:Activity},{key:'creditIssued',label:'Credit Issued',date:timeline.creditIssued,icon:Gift}];
  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-800 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-600"/> Impact Journey</h4>
      <div className="relative pl-5">
        {stages.map((s,i)=>{const Icon=s.icon,done=!!s.date,last=i===stages.length-1;return(<div key={s.key} className="relative pb-5">{!last&&<div className={`absolute left-0 top-5 w-0.5 h-full ${done?'bg-green-500':'bg-gray-200'}`}/>}<div className="flex items-start gap-2.5"><div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${done?'bg-green-500 text-white':'bg-gray-200 text-gray-400'}`}><Icon className="w-3.5 h-3.5"/></div><div className="pt-0.5"><p className={`font-medium text-sm ${done?'text-gray-800':'text-gray-400'}`}>{s.label}</p>{s.date&&<p className="text-xs text-gray-400 mt-0.5">{formatDateTimeDMY(s.date)}</p>}</div></div></div>);})}
      </div>
      <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-sm text-green-800 font-medium flex items-center gap-2"><Heart className="w-4 h-4 fill-green-600 flex-shrink-0"/>{timeline.usedByPatient?'Your donation directly saved a life! 🎉':timeline.linkedToRequest?"Your donation is fulfilling a patient's need...":'Your donation is being processed...'}</div>
    </div>
  );
};

const HistoryQRModal = ({isOpen,onClose,data}:{isOpen:boolean;onClose:()=>void;data:{rtid:string;payload:string;location:string;date:Date;component?:DonationComponent;qrStatus?:'Redeemed'|'Pending'|'Expired';otpExpiryTime?:Date}|null}) => {
  if(!data) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader><DialogTitle className="text-primary text-center flex items-center justify-center gap-2"><QrCode className="w-5 h-5"/> Donation QR</DialogTitle><DialogDescription className="text-center">RTID: <span className="font-mono font-bold text-black">{data.rtid}</span></DialogDescription></DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <QRCodeCanvas data={data.payload} className="border-4 border-white shadow rounded-lg"/>
          <div className="text-center space-y-1"><p className="text-sm text-muted-foreground">{formatDateDMY(data.date)} · {data.location}</p>{data.component&&<div className="flex justify-center"><ComponentBadge component={data.component}/></div>}{data.qrStatus&&<div className="flex justify-center"><QRStatusBadge status={data.qrStatus} expiryTime={data.otpExpiryTime}/></div>}</div>
        </div>
        <Button onClick={onClose} className="w-full rounded-full">Done</Button>
      </DialogContent>
    </Dialog>
  );
};

// ── Printable Donation Slip ───────────────────────────────────
const PrintableDonation = ({donation,donorData}:{donation:Donation|null;donorData:DonorData}) => {
  const qrRef = useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    if(donation&&qrRef.current){const payload=`${donorData.fullName}|${donorData.bloodGroup}|${donation.rtidCode}|${donation.hospitalName}|${donation.city}|${donation.component||'Whole Blood'}`;try{new QRious({element:qrRef.current,value:payload,size:120,level:'H'});}catch(_){}}
  },[donation,donorData]);
  if(!donation) return null;
  const nextEligible=donation.component&&COOLDOWN_DAYS[donation.component]?new Date(donation.date.getTime()+COOLDOWN_DAYS[donation.component][donorData.gender?.toLowerCase()==='female'?'female':'male']*86400000):null;
  const consentId = `CID-${donation.rtidCode.split('-').pop()}`;
  return createPortal(<>
    <style>{`@media print{@page{size:A4 portrait;margin:5mm 10mm}body>*:not(#pd-portal){display:none!important}#pd-portal{display:flex!important;position:fixed;inset:0;background:white;z-index:99999;align-items:start;justify-content:center;padding:5mm;box-sizing:border-box}.no-print{display:none!important}}@media screen{#pd-portal{display:none!important}}`}</style>
    <div id="pd-portal">
      <div style={{width:'190mm',height:'265mm',border:'2px solid #1a0505',padding:'6mm 8mm',fontFamily:'Georgia,serif',color:'#1a0505',position:'relative',boxSizing:'border-box',display:'flex',flexDirection:'column'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'2px solid #8B0000',paddingBottom:'4mm',marginBottom:'4mm'}}>
          <div style={{display:'flex',alignItems:'center',gap:'4mm'}}>
            <img src={logo} alt="" style={{width:'14mm',height:'14mm',objectFit:'contain'}}/>
            <div>
              <div style={{fontSize:'14pt',fontWeight:'bold',color:'#8B0000'}}>RaktPort</div>
              <div style={{fontSize:'7pt',color:'#555',textTransform:'uppercase'}}>National Blood Management System</div>
            </div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:'8pt',fontWeight:'bold',color:'#555',marginBottom:'1mm'}}>DONATION SLIP & CONSENT</div>
            <div style={{fontFamily:'monospace',fontWeight:'bold',fontSize:'11pt',color:'#8B0000',background:'#fff0f0',padding:'1mm 3mm',borderRadius:'2mm',border:'2px solid #8B0000',letterSpacing:'0.05em',display:'inline-block'}}>{donation.rtidCode}</div>
          </div>
        </div>

        <div style={{display:'flex',gap:'4mm',marginBottom:'4mm'}}>
          <div style={{flex:1,border:'1px solid #ccc',padding:'3mm',borderRadius:'2mm'}}>
            <div style={{fontSize:'8pt',fontWeight:'bold',color:'#8B0000',borderBottom:'1px solid #ddd',paddingBottom:'1mm',marginBottom:'2mm'}}>DONOR DETAILS</div>
            {[['Name',donorData.fullName],['ID',donorData.internalId||donorData.donorId||'N/A'],['Blood Group',donorData.bloodGroup],['City',donorData.city]].map(([k,v])=><div key={k} style={{fontSize:'8pt',marginBottom:'1.5mm',display:'flex',justifyContent:'space-between'}}><b>{k}:</b> <span>{v}</span></div>)}
          </div>
          <div style={{flex:1,border:'1px solid #ccc',padding:'3mm',borderRadius:'2mm'}}>
            <div style={{fontSize:'8pt',fontWeight:'bold',color:'#8B0000',borderBottom:'1px solid #ddd',paddingBottom:'1mm',marginBottom:'2mm'}}>DONATION DETAILS</div>
            {[['Date',formatDateDMY(donation.date)],['Time',donation.time||'N/A'],['Centre',donation.hospitalName],['Component',donation.component||'Whole Blood']].map(([k,v])=><div key={k} style={{fontSize:'8pt',marginBottom:'1.5mm',display:'flex',justifyContent:'space-between'}}><b>{k}:</b> <span>{v}</span></div>)}
            {nextEligible&&<div style={{fontSize:'7.5pt',marginTop:'2mm',padding:'1mm 2mm',background:'#fff9f0',borderRadius:'1mm',border:'1px solid #ffe4b5'}}><b>Next eligible:</b> {formatDateDMY(nextEligible)} ({donation.component||'Whole Blood'})</div>}
          </div>
        </div>

        {/* Consent Section - NACO Guidelines */}
        <div style={{flex:1,border:'1px solid #8B0000',padding:'4mm',borderRadius:'2mm',backgroundColor:'#fffdfd',marginBottom:'4mm'}}>
          <div style={{fontSize:'9pt',fontWeight:'bold',color:'#8B0000',borderBottom:'1px solid #8B0000',paddingBottom:'1.5mm',marginBottom:'3mm',textAlign:'center'}}>DONOR CONSENT DECLARATION (As per NACO Guidelines)</div>
          <div style={{fontSize:'7.5pt',lineHeight:'1.6',textAlign:'justify',marginBottom:'2mm',color:'#333'}}>
            I declare that I have truthfully answered all questions to the best of my knowledge and fully understood the information provided to me about blood donation. I consent to donate blood/components voluntarily and without any expectation of remuneration.<br/><br/>
            I have been explained about the risks and benefits of blood donation, including the remote risk of adverse reactions. I authorize the <b>{donation.hospitalName}</b> blood bank to test my blood for TTI markers (HIV, Hepatitis B/C, Syphilis, Malaria). I understand my blood may be used for patient treatment, research, or quality control.
          </div>
          
          <div style={{fontSize:'7.5pt', marginBottom:'3mm',color:'#333'}}>
            <div style={{fontWeight:'bold', marginBottom:'1mm'}}>Pre-donation Confirmation:</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1mm'}}>
              {['No high-risk behavior', 'No recent illness/surgery', 'No medication conflicts', 'No recent vaccination/pregnancy etc.'].map(lbl => (
                <div key={lbl} style={{display:'flex', alignItems:'center', gap:'1.5mm'}}>
                  <div style={{width:'2.5mm',height:'2.5mm',border:'1px solid #333',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'6pt'}}>✓</div>
                  <span>{lbl}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{fontSize:'8pt',fontWeight:'bold',marginBottom:'4mm',display:'flex',alignItems:'center',gap:'2mm'}}>
            <div style={{width:'3mm',height:'3mm',border:'1px solid #333',display:'flex',alignItems:'center',justifyContent:'center'}}>✓</div>
            <span>I confirm my voluntary consent digitally.</span>
          </div>
          
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginTop:'auto'}}>
            <div>
              <div style={{fontSize:'7pt',color:'#555',marginBottom:'1mm'}}>Digital Consent ID</div>
              <div style={{fontFamily:'monospace',fontSize:'9pt',fontWeight:'bold',color:'#333'}}>{consentId}</div>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'7pt',color:'#555',marginBottom:'1mm'}}>Donor Signature</div>
              <div style={{width:'40mm',borderBottom:'1px dashed #333',height:'6mm',marginBottom:'1mm'}}/>
              <div style={{fontSize:'7.5pt',fontWeight:'bold'}}>{donorData.fullName?.toUpperCase()}</div>
            </div>
          </div>
        </div>

        {/* Authorization Section */}
        <div style={{display:'flex',gap:'4mm',marginBottom:'auto'}}>
          <div style={{flex:1,border:'1px solid #ccc',padding:'4mm',borderRadius:'2mm',display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
            <div>
              <div style={{fontSize:'8pt',fontWeight:'bold',color:'#333',marginBottom:'3mm'}}>AUTHORIZATION</div>
              <div style={{fontSize:'7pt',color:'#555'}}>Medical Officer In-charge</div>
              <div style={{width:'100%',borderBottom:'1px dashed #999',height:'6mm',marginBottom:'2mm'}}/>
              <div style={{fontSize:'7pt'}}>Name: _______________________</div>
            </div>
          </div>
          <div style={{flex:1,border:'1px solid #ccc',padding:'4mm',borderRadius:'2mm',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
            <div style={{width:'30mm',height:'30mm',border:'2px dashed #ccc',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',opacity:0.6}}>
              <span style={{fontSize:'7pt',color:'#999',textAlign:'center'}}>BLOOD<br/>BANK<br/>SEAL</span>
            </div>
          </div>
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
            <div style={{fontSize:'7pt',fontWeight:'bold',marginBottom:'1mm',color:'#555'}}>SCAN TO VERIFY</div>
            <canvas ref={qrRef} style={{border:'1px solid #eee',padding:'1mm',background:'#fff'}}/>
            <div style={{fontSize:'6pt',color:'#777',marginTop:'1mm'}}>Timestamp: {formatDateTimeDMY(new Date())}</div>
          </div>
        </div>

        <div style={{borderTop:'1px solid #ccc',paddingTop:'2.5mm',fontSize:'6.5pt',color:'#777',textAlign:'center',marginTop:'4mm'}}>
          Computer-generated authorized consent and donation slip document. Valid across all RaktPort partner networks. • www.raktport.in
        </div>
      </div>
    </div>
  </>,document.body);
};

// ─────────────────────────────────────────────────────────────
// CERTIFICATE MODAL  (blob-URL new-window — reliable download)
// ─────────────────────────────────────────────────────────────
interface CertModalProps{isOpen:boolean;onClose:()=>void;donorData:DonorData;donationHistory:Donation[];}
const CertificateModal = ({isOpen,onClose,donorData,donationHistory}:CertModalProps) => {
  const previewQrRef = useRef<HTMLCanvasElement>(null);

  const completed = donationHistory.filter(d=>['Donated','Completed','Redeemed-Credit','Verified','Credited'].includes(d.status));
  const firstDate  = completed.length>0 ? completed[completed.length-1].date : null;
  const lastDate   = completed.length>0 ? completed[0].date : null;
  const lives      = (donorData.donationsCount||0)*3;
  const displayId = donorData.internalId || donorData.donorId || 'N/A';
  const certDonorId = donorData.internalId || donorData.donorId || 'XXXXXX';
  const certNo     = `CERT-${certDonorId.replace(/^(DON|RKT)-/,'')}--${new Date().getFullYear()}`;
  const qrValue    = `${displayId}|${certNo}|${donorData.bloodGroup}|${donorData.donationsCount||0}`;

  // Render preview QR
  useEffect(()=>{
    if(!isOpen) return;
    const t=setTimeout(()=>{if(previewQrRef.current)try{new QRious({element:previewQrRef.current,value:qrValue,size:64,foreground:'#8B0000',level:'H'});}catch(_){}},150);
    return()=>clearTimeout(t);
  },[isOpen,qrValue]);

  // ── Download: open cert in new tab as blob HTML ──
  const handleDownload = () => {
    // QR as data-URL
    const qrCanvas = document.createElement('canvas');
    let qrDataUrl = '';
    try{ new QRious({element:qrCanvas,value:qrValue,size:96,foreground:'#8B0000',level:'H'}); qrDataUrl=qrCanvas.toDataURL('image/png'); }catch(_){}

    // Logo as absolute URL (Vite hashed path)
    const logoUrl = new URL(logo as string, window.location.href).href;

    const statsRows:[string,string][] = [
      ['Blood Group',    donorData.bloodGroup||'N/A'],
      ['Donations',      String(donorData.donationsCount||0)],
      ['Lives Impacted', `~${lives}`],
      ['First Donation', firstDate?formatDateDMY(firstDate):'N/A'],
      ['Latest Donation',lastDate ?formatDateDMY(lastDate) :'N/A'],
    ];

    const mkCorner=(top:string|null,bottom:string|null,left:string|null,right:string|null)=>{
      const pos=[top?`top:${top}`:'',bottom?`bottom:${bottom}`:'',left?`left:${left}`:'',right?`right:${right}`:''].filter(Boolean).join(';');
      const brd=[top?'border-top:3px solid #8B0000':'',bottom?'border-bottom:3px solid #8B0000':'',left?'border-left:3px solid #8B0000':'',right?'border-right:3px solid #8B0000':''].filter(Boolean).join(';');
      return `<div style="position:absolute;${pos};width:20mm;height:20mm;${brd}"></div>`;
    };

    const html=`<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<title>RaktPort Certificate — ${donorData.donorId||'Donor'}</title>
<style>
@page{size:A4 landscape;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Georgia,'Times New Roman',serif;background:#fff}
</style>
</head><body>
<div style="width:297mm;height:210mm;position:relative;overflow:hidden;background:linear-gradient(135deg,#fff8f5 0%,#ffffff 50%,#fff5f5 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12mm">
  ${mkCorner('6mm',null,'6mm',null)}
  ${mkCorner('6mm',null,null,'6mm')}
  ${mkCorner(null,'6mm','6mm',null)}
  ${mkCorner(null,'6mm',null,'6mm')}
  <div style="position:absolute;inset:4mm;border:1px solid rgba(139,0,0,0.2);pointer-events:none"></div>

  <div style="display:flex;align-items:center;gap:5mm;margin-bottom:5mm">
    <img src="${logoUrl}" style="width:18mm;height:18mm;object-fit:contain" onerror="this.style.display='none'"/>
    <div style="text-align:center">
      <div style="font-size:20pt;font-weight:bold;color:#8B0000;letter-spacing:0.05em">RaktPort</div>
      <div style="font-size:8pt;color:#666;letter-spacing:0.15em;text-transform:uppercase">National Blood Management System</div>
    </div>
    <img src="${logoUrl}" style="width:18mm;height:18mm;object-fit:contain;opacity:0.2" onerror="this.style.display='none'"/>
  </div>

  <div style="width:180mm;height:1px;background:linear-gradient(to right,transparent,#8B0000 30%,#8B0000 70%,transparent);margin-bottom:5mm"></div>

  <div style="font-size:24pt;font-weight:bold;color:#8B0000;letter-spacing:0.08em;margin-bottom:2mm;text-align:center">CERTIFICATE OF APPRECIATION</div>
  <div style="font-size:9pt;color:#666;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:5mm;text-align:center">This is to certify that</div>

  <div style="font-size:26pt;font-weight:bold;color:#1a0505;letter-spacing:-0.01em;margin-bottom:1mm;text-align:center">${(donorData.fullName||'Donor Name').toUpperCase()}</div>
  <div style="font-size:10pt;color:#8B0000;font-style:italic;margin-bottom:5mm;text-align:center">ID: ${donorData.internalId || donorData.donorId || 'N/A'} &nbsp;·&nbsp; Blood Group: ${donorData.bloodGroup||'N/A'}</div>

  <div style="font-size:10pt;color:#444;line-height:1.7;text-align:center;max-width:200mm;margin-bottom:6mm">
    has generously donated blood <strong style="color:#8B0000">${donorData.donationsCount||0} time${(donorData.donationsCount||0)!==1?'s':''}</strong>
    through the RaktPort National Blood Donation Programme, potentially saving up to
    <strong style="color:#8B0000">${lives} lives</strong> through their selfless and noble act of giving.
  </div>

  <div style="display:flex;gap:8mm;margin-bottom:6mm;background:#8B0000;border-radius:4mm;padding:4mm 8mm">
    ${statsRows.map(([lbl,val])=>`<div style="text-align:center;min-width:32mm"><div style="font-size:7pt;color:rgba(255,255,255,0.7);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:1.5mm">${lbl}</div><div style="font-size:13pt;font-weight:bold;color:#fff">${val}</div></div>`).join('')}
  </div>

  <div style="display:flex;justify-content:space-between;align-items:flex-end;width:230mm;margin-top:2mm">
    <div style="text-align:center">
      <img src="${qrDataUrl}" style="width:24mm;height:24mm"/>
      <div style="font-size:6pt;color:#999;margin-top:1mm;font-family:monospace">${certNo}</div>
    </div>
    <div style="text-align:center">
      <div style="font-size:8pt;color:#888">Issue Date</div>
      <div style="font-size:10pt;font-weight:bold;color:#333">${formatDateDMY(new Date())}</div>
    </div>
    <div style="text-align:center">
      <div style="width:50mm;border-bottom:1px solid #333;margin-bottom:1mm"></div>
      <div style="font-size:7.5pt;color:#666">Authorised by RaktPort</div>
      <div style="font-size:7pt;color:#999">National Blood Authority</div>
    </div>
  </div>

  <div style="position:absolute;bottom:7mm;text-align:center;width:100%;font-size:7.5pt;color:#8B0000;font-style:italic;letter-spacing:0.05em">
    "Every drop of blood donated is a promise of hope — Thank you for saving lives"
  </div>
</div>
<script>
var imgs=document.querySelectorAll('img'),n=imgs.length,loaded=0;
function tryPrint(){if(++loaded>=n)setTimeout(function(){window.print();},400);}
if(n===0){setTimeout(function(){window.print();},400);}
else{imgs.forEach(function(img){if(img.complete)tryPrint();else{img.onload=tryPrint;img.onerror=tryPrint;}});}
</script>
</body></html>`;

    const blob = new Blob([html],{type:'text/html;charset=utf-8'});
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url,'_blank');
    if(!win) toast.error('Popup blocked',{description:'Allow popups for this site to download the certificate.'});
    setTimeout(()=>URL.revokeObjectURL(url),120000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-2xl no-print max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary"><Award className="w-5 h-5"/> Impact Certificate</DialogTitle>
          <DialogDescription>Certificate opens in a new tab and prints/saves automatically as PDF.</DialogDescription>
        </DialogHeader>

        {/* Preview card */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-red-200" style={{background:'linear-gradient(135deg,#fff8f5 0%,#ffffff 50%,#fff5f5 100%)',fontFamily:'Georgia,serif'}}>
          {(['tl','tr','bl','br'] as const).map(pos=>(
            <div key={pos} className="absolute w-8 h-8 pointer-events-none" style={{[pos.includes('t')?'top':'bottom']:10,[pos.includes('l')?'left':'right']:10,borderTop:pos.includes('t')?'2px solid #8B0000':'none',borderBottom:pos.includes('b')?'2px solid #8B0000':'none',borderLeft:pos.includes('l')?'2px solid #8B0000':'none',borderRight:pos.includes('r')?'2px solid #8B0000':'none'}}/>
          ))}
          <div className="px-8 py-6 text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <img src={logo} alt="" className="w-10 h-10 object-contain rounded-lg"/>
              <div><p className="text-2xl font-bold text-[#8B0000] tracking-wide">RaktPort</p><p className="text-[10px] text-gray-500 tracking-[0.15em] uppercase">National Blood Management System</p></div>
            </div>
            <div className="h-px mx-8" style={{background:'linear-gradient(to right,transparent,#8B0000 30%,#8B0000 70%,transparent)'}}/>
            <div>
              <p className="text-[11px] tracking-[0.2em] text-gray-500 uppercase mb-1">Certificate of Appreciation</p>
              <p className="text-[11px] text-gray-400 mb-2">This is to certify that</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-wide">{(donorData.fullName||'Donor Name').toUpperCase()}</h2>
              <p className="text-sm text-[#8B0000] font-medium mt-1.5 italic">ID: {donorData.internalId || donorData.donorId || 'N/A'} &nbsp;·&nbsp; Blood Group: {donorData.bloodGroup||'N/A'}</p>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed max-w-md mx-auto">has donated blood <strong className="text-[#8B0000]">{donorData.donationsCount||0} time{(donorData.donationsCount||0)!==1?'s':''}</strong> through RaktPort, potentially saving up to <strong className="text-[#8B0000]">~{lives} lives</strong>.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[['Donations',String(donorData.donationsCount||0)],['Lives Saved',`~${lives}`],['Blood Group',donorData.bloodGroup||'N/A'],['First Gift',firstDate?formatDateDMY(firstDate):'N/A'],['Latest',lastDate?formatDateDMY(lastDate):'N/A']].map(([lbl,val])=>(
                <div key={lbl} className="bg-[#8B0000] text-white px-3 py-2 rounded-xl text-center min-w-[72px]"><p className="text-[9px] opacity-70 uppercase tracking-wide mb-0.5">{lbl}</p><p className="text-sm font-bold">{val}</p></div>
              ))}
            </div>
            <div className="h-px mx-4 bg-red-100"/>
            <div className="flex items-center justify-between px-4">
              <div className="flex flex-col items-center"><canvas ref={previewQrRef} className="w-14 h-14 border border-red-100 rounded p-0.5"/><p className="text-[8px] text-gray-400 mt-0.5 font-mono">{certNo}</p></div>
              <div className="text-center"><p className="text-[10px] text-gray-400">Issue Date</p><p className="text-sm font-bold text-gray-700">{formatDateDMY(new Date())}</p></div>
              <div className="text-center"><div className="w-28 border-b border-gray-400 mb-1"/><p className="text-[10px] text-gray-500">Authorised by RaktPort</p><p className="text-[9px] text-gray-400">National Blood Authority</p></div>
            </div>
            <p className="text-xs text-[#8B0000] italic pb-2">"Every drop of blood donated is a promise of hope — Thank you for saving lives"</p>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose}>Close</Button>
          <Button className="flex-1 bg-primary gap-2" onClick={handleDownload}><Download className="w-4 h-4"/> Download Certificate</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── Blood Compatibility Modal ─────────────────────────────────
const BloodCompatibilityModal = ({isOpen,onClose,bloodGroup}:{isOpen:boolean;onClose:()=>void;bloodGroup:string}) => {
  const info=BLOOD_COMPATIBILITY[bloodGroup];
  const ALL=['A+','A-','B+','B-','O+','O-','AB+','AB-'];
  if(!info) return null;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><HeartHandshake className="w-5 h-5 text-red-600"/> Blood Type Compatibility</DialogTitle><DialogDescription>Your blood type <strong>{bloodGroup}</strong> compatibility guide</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-center"><div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-xl"><span className="text-2xl font-black text-white">{bloodGroup}</span></div></div>
          <p className="text-sm text-gray-600 text-center bg-red-50 rounded-xl p-3 border border-red-100">{info.facts}</p>
          <div><h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5"><Droplet className="w-4 h-4 text-red-500"/> You can donate to</h4><div className="flex flex-wrap gap-2">{ALL.map(g=><div key={g} className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-black border-2 ${info.donateTo.includes(g)?'bg-red-500 text-white border-red-600 shadow-md scale-110':'bg-gray-100 text-gray-300 border-gray-200'}`}>{g}</div>)}</div></div>
          <div><h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5"><Heart className="w-4 h-4 text-green-500 fill-green-500"/> You can receive from</h4><div className="flex flex-wrap gap-2">{ALL.map(g=><div key={g} className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-black border-2 ${info.receiveFrom.includes(g)?'bg-green-500 text-white border-green-600 shadow-md scale-110':'bg-gray-100 text-gray-300 border-gray-200'}`}>{g}</div>)}</div></div>
          {bloodGroup==='O-'&&<div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800 flex gap-2"><Star className="w-4 h-4 fill-amber-500 flex-shrink-0 mt-0.5"/><span><strong>Universal Donor:</strong> Your blood can be given to anyone in an emergency!</span></div>}
          {bloodGroup==='AB+'&&<div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800 flex gap-2"><Star className="w-4 h-4 fill-blue-500 flex-shrink-0 mt-0.5"/><span><strong>Universal Recipient:</strong> You can receive blood from any blood type!</span></div>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const HealthTipsSection = ({isOpen,onClose}:{isOpen:boolean;onClose:()=>void}) => {
  const [current,setCurrent]=useState(0);
  useEffect(()=>{if(!isOpen)return;const id=setInterval(()=>setCurrent(c=>(c+1)%HEALTH_TIPS.length),4000);return()=>clearInterval(id);},[isOpen]);
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-600"/> Health Tips for Donors</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100 text-center min-h-[120px] flex flex-col items-center justify-center"><div className="text-4xl mb-3">{HEALTH_TIPS[current].icon}</div><h3 className="font-bold text-gray-900 mb-1">{HEALTH_TIPS[current].title}</h3><p className="text-sm text-gray-600 leading-relaxed">{HEALTH_TIPS[current].tip}</p></div>
          <div className="flex justify-center gap-1.5">{HEALTH_TIPS.map((_,i)=><button key={i} onClick={()=>setCurrent(i)} className={`h-2 rounded-full transition-all ${i===current?'bg-blue-600 w-6':'bg-gray-300 w-2'}`}/>)}</div>
          <div className="space-y-2 max-h-52 overflow-y-auto">{HEALTH_TIPS.map((t,i)=><button key={i} onClick={()=>setCurrent(i)} className={`w-full flex items-start gap-3 p-3 rounded-xl text-left ${i===current?'bg-blue-50 border border-blue-200':'hover:bg-gray-50'}`}><span className="text-xl flex-shrink-0">{t.icon}</span><div><p className="text-sm font-semibold text-gray-800">{t.title}</p><p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{t.tip}</p></div></button>)}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ShareCardModal = ({isOpen,onClose,donorData}:{isOpen:boolean;onClose:()=>void;donorData:DonorData}) => {
  const shareId = donorData.internalId || donorData.donorId || 'RaktPort Donor';
  const shareUsername = donorData.username ? ` | ${formatUsername(donorData.username)}` : '';
  const text=`🩸 I'm a blood donor with RaktPort!\nID: ${shareId}${shareUsername} | Blood Group: ${donorData.bloodGroup}\nTotal Donations: ${donorData.donationsCount||0} | Lives Impacted: ~${(donorData.donationsCount||0)*3}\nJoin me in saving lives: raktport.in`;
  const handleShare=()=>{if(navigator.share)navigator.share({title:'I am a RaktPort Donor!',text,url:'https://raktport.in'}).catch(()=>{});else{navigator.clipboard.writeText(text);toast.success('Copied to clipboard!');}};
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Share2 className="w-5 h-5 text-primary"/> Share Your Story</DialogTitle></DialogHeader>
        <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#8B0000] to-[#4a0000] p-5 text-white text-center space-y-3 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-black mx-auto">{(donorData.fullName||'D').split(' ').map(s=>s[0]).join('').toUpperCase().slice(0,2)}</div>
          <div className="text-xl font-bold">{donorData.fullName}</div>
          <div className="text-3xl font-black text-red-200">{donorData.bloodGroup}</div>
          <div className="flex justify-center gap-6 py-2 bg-white/10 rounded-xl">{[['Donations',donorData.donationsCount||0],['Lives',`~${(donorData.donationsCount||0)*3}`]].map(([l,v])=><div key={l as string} className="text-center"><div className="text-xl font-black">{v}</div><div className="text-xs opacity-70">{l}</div></div>)}</div>
          <div className="text-xs opacity-60">{donorData.internalId || donorData.donorId || 'RaktPort Donor'}</div>
          {donorData.username && <div className="text-[10px] opacity-50 mt-0.5">{formatUsername(donorData.username)}</div>}
        </div>
        <Button className="w-full bg-primary gap-2" onClick={handleShare}><Share2 className="w-4 h-4"/> Share</Button>
      </DialogContent>
    </Dialog>
  );
};

// ═══════════════════════════════════════════════════════════════
// DonorDashboard.tsx  — PART 2 of 3
// FIXES:
//   • handleBookAppointment — waiting period logic:
//       1. Blocks if an active Scheduled/Pending appointment already
//          exists for the SAME blood component
//       2. Blocks if selected date is within the cooldown window
//          for that component (based on last completed donation)
//   • History sorted: upcoming rows always float to top
// ═══════════════════════════════════════════════════════════════

export function DonorDashboard({ onLogout }: DonorDashboardProps) {

  // ── State ──────────────────────────────────────────────────
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
  const [profileOpen,        setProfileOpen]        = useState(false);
  const [scheduleOpen,       setScheduleOpen]       = useState(false);
  const [bookingOpen,        setBookingOpen]         = useState(false);
  const [bookingConfirmOpen, setBookingConfirmOpen]  = useState(false);
  const [rescheduleOpen,     setRescheduleOpen]      = useState(false);
  const [certOpen,           setCertOpen]            = useState(false);
  const [compatOpen,         setCompatOpen]          = useState(false);
  const [healthTipsOpen,     setHealthTipsOpen]      = useState(false);
  const [shareOpen,          setShareOpen]           = useState(false);
  const [historyQROpen,      setHistoryQROpen]       = useState(false);
  const [hrtidModalOpen,     setHrtidModalOpen]      = useState(false);
  const [emergencyOpen,      setEmergencyOpen]       = useState(false);

  // QR / misc state
  const [selectedHistoryQR, setSelectedHistoryQR] = useState<any>(null);
  const [hrtidDetails,      setHrtidDetails]      = useState<HrtidDetails | null>(null);
  const [hrtidLoading,      setHrtidLoading]      = useState(false);
  const [bookingDetails,    setBookingDetails]    = useState({ rtid: '', qrPayload: '' });

  const [bookingForm, setBookingForm] = useState({
    date: '', time: '09:00 AM', component: 'Whole Blood' as DonationComponent,
  });
  const [bookingConsent, setBookingConsent] = useState({
    highRisk: false, illness: false, medication: false, vaccination: false
  });
  const [rescheduleForm,   setRescheduleForm]   = useState({ date: '', time: '09:00 AM' });
  const [apptToReschedule, setApptToReschedule] = useState<Donation | null>(null);

  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const userId = localStorage.getItem('userId') || localStorage.getItem('userUid');

  // ── Init ───────────────────────────────────────────────────
  useEffect(() => {
    setMotivationQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    const id = setInterval(() => setCurrentHealthTip(c => (c + 1) % HEALTH_TIPS.length), 8000);
    return () => clearInterval(id);
  }, []);

  // ── Sorting helper ─────────────────────────────────────────
  const sortHistory = (arr: Donation[]): Donation[] => {
    const UPCOMING: DonationStatus[] = ['Scheduled', 'Pending'];
    return [...arr].sort((a, b) => {
      const aUp = UPCOMING.includes(a.status);
      const bUp = UPCOMING.includes(b.status);
      if (aUp && !bUp) return -1;
      if (!aUp && bUp) return 1;
      if (aUp && bUp)  return a.date.getTime() - b.date.getTime(); // nearest upcoming first
      return b.date.getTime() - a.date.getTime();                  // past: newest first
    });
  };

  // ── Data Fetch ─────────────────────────────────────────────
  useEffect(() => {
    if (!userId) { setError('Not logged in'); setLoading(false); return; }

    const fetchData = async () => {
      try {
        // 1. Donor profile
        const userRef  = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const d = userSnap.data();
          let donorId = d.donorId;
          if (!donorId) { donorId = generateDonorId(); await updateDoc(userRef, { donorId }).catch(() => {}); }
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
            internalId:      d.internalId || undefined,
            username:        d.username || undefined,
            availabilityMode:d.availabilityMode || 'available',
          });
          setScheduleCity(d.district || d.city || '');
          setError('');
        } else {
          setError('Profile not found. Please contact support.');
        }

        // 2. Donation history
        const snap = await getDocs(query(collection(db, 'donations'), where('donorId', '==', userId)));
        const history: Donation[] = [];

        snap.forEach(docSnap => {
          const d    = docSnap.data() as any;
          const rtid = d.dRtid || d.rtid || d.donationId || docSnap.id;
          const linked = d.linkedHrtid || d.linkedRTID || d.hRtid || 'N/A';

          let status: DonationStatus = d.status;
          if      (d.status === 'AVAILABLE' || d.status === 'Donated')                                    status = 'Donated';
          else if (d.status === 'REDEEMED')                                                               status = 'Redeemed-Credit';
          else if (d.status === 'CANCELLED' || d.status === 'Cancelled')                                  status = 'Cancelled';
          else if ((d.status === 'Scheduled' || d.status === 'Pending') && safeDate(d.date) < new Date()) status = 'Expired';

          const qrStatus: 'Redeemed'|'Pending'|'Expired' =
            ['REDEEMED','Redeemed-Credit','Completed'].includes(d.status) ? 'Redeemed' :
            d.expiryDate && safeDate(d.expiryDate) < new Date() ? 'Expired' : 'Pending';

          const otpExpiry = d.otpExpiryTime ? safeDate(d.otpExpiryTime) : new Date(safeDate(d.date).getTime() + 86400000);

          const timeline: ImpactTimeline = {
            donated:         safeDate(d.date),
            linkedToRequest: d.linkedDate ? safeDate(d.linkedDate) : (linked !== 'N/A' && linked !== null && linked !== '' ? safeDate(d.date) : undefined),
            usedByPatient:   d.usedDate ? safeDate(d.usedDate) : (['Redeemed-Credit','Completed'].includes(status) ? safeDate(d.redeemedAt || d.date) : undefined),
            creditIssued:    d.creditIssuedDate ? safeDate(d.creditIssuedDate) : (['Donated','Verified','Credited','Redeemed-Credit','Completed'].includes(status) ? safeDate(d.creditIssuedDate || d.redeemedAt || d.date) : undefined),
          };

          history.push({
            date: safeDate(d.date), rtidCode: rtid, linkedHrtid: linked,
            hospitalName: d.bloodBankName || d.hospitalName || 'Blood Bank',
            city: d.city || d.donationLocation || 'Unknown',
            status, otp: d.otp || '', expiryDate: d.expiryDate ? safeDate(d.expiryDate) : undefined,
            component: d.component || 'Whole Blood', qrRedemptionStatus: qrStatus,
            otpExpiryTime: otpExpiry, impactTimeline: timeline, time: d.time || '09:00 AM',
          });
        });

        setDonationHistory(sortHistory(history));

        // 3. Emergency alerts
        const city = userSnap.data()?.district || userSnap.data()?.city;
        if (city) {
          try {
            const eqSnap = await getDocs(query(collection(db,'bloodRequests'),where('city','==',city),where('urgency','in',['Critical','High','critical','high'])));
            const alerts: EmergencyAlert[] = [];
            eqSnap.forEach(d => {
              const data = d.data() as any;
              if (['PENDING','CREATED','PARTIAL'].includes(data.status||'')) {
                const exp = data.requiredBy ? safeDate(data.requiredBy) : new Date(Date.now()+12*3600000);
                if (exp.getTime()>Date.now()) alerts.push({id:d.id,bloodGroup:data.bloodGroup,hospitalName:data.hospitalName||'Hospital',urgency:(data.urgency?.toLowerCase()||'high') as 'critical'|'high'|'medium',expiresAt:exp,hrtid:data.linkedRTID||data.rtid||d.id,city});
              }
            });
            setEmergencyAlerts(alerts.slice(0,3));
          } catch(_){}
        }
      } catch(e:any) {
        console.error(e); setError('Failed to load data. Please check your connection.');
      } finally { setLoading(false); }
    };
    fetchData();
  }, [userId]);

  // ── Eligibility ────────────────────────────────────────────
  useEffect(()=>{
    let latestComp: DonationComponent = 'Whole Blood', latestDate: Date|null = null;
    const done: DonationStatus[] = ['Donated','Redeemed-Credit','Pledged','Completed','Verified','Credited'];
    donationHistory.forEach(d=>{ if(done.includes(d.status)&&(!latestDate||d.date>latestDate)){latestDate=d.date;latestComp=d.component||'Whole Blood';} });
    const hasPending = donationHistory.some(d=>['Pending','Scheduled'].includes(d.status));
    if(hasPending){setIsEligible(false);setEligibilityMsg('🚫 You have a pending appointment.');return;}
    const result = calculateDonorEligibility((donorData.gender as Gender)||'Male','Whole Blood',latestDate,latestComp,new Date());
    setIsEligible(result.eligible);
    if(result.eligible) setEligibilityMsg(latestDate?`✅ Eligible! Last donation ${Math.floor((Date.now()-latestDate!.getTime())/86400000)} days ago.`:'✨ Ready for your first donation!');
    else setEligibilityMsg(result.rejectionReason||'Not eligible at this time.');
  },[donorData,donationHistory]);

  // Trigger print for donation slip
  useEffect(()=>{ if(donationToPrint){const t=setTimeout(()=>window.print(),500);return()=>clearTimeout(t);} },[donationToPrint]);

  // QR for booking confirm dialog — ref callback ensures canvas is mounted
  const confirmQrRef = useCallback((canvas: HTMLCanvasElement | null) => {
    if (canvas && bookingDetails.qrPayload) {
      try { new QRious({ element: canvas, value: bookingDetails.qrPayload, size: 200, foreground: '#8b0000' }); } catch (_) {}
    }
  }, [bookingDetails.qrPayload]);

  // ── Computed ───────────────────────────────────────────────
  const lastDonationDisplay = useMemo(()=>{
    let latest:Date|null=null,comp:DonationComponent='Whole Blood';
    if(donorData.lastDonationDate){const d=new Date(donorData.lastDonationDate);if(!isNaN(d.getTime()))latest=d;}
    const done:DonationStatus[]=['Donated','Redeemed-Credit','Pledged','Completed','Verified','Credited'];
    donationHistory.forEach(d=>{if(done.includes(d.status)&&(!latest||d.date>latest)){latest=d.date;comp=d.component||'Whole Blood';}});
    return latest?`${formatDateDMY(latest)} (${comp})`:'Never';
  },[donorData.lastDonationDate,donationHistory]);

  const nextEligibleDate = useMemo(():Date|null=>{
    let latest:Date|null=null,comp:DonationComponent='Whole Blood';
    const done:DonationStatus[]=['Donated','Redeemed-Credit','Pledged','Completed','Verified','Credited'];
    donationHistory.forEach(d=>{if(done.includes(d.status)&&(!latest||d.date>latest)){latest=d.date;comp=d.component||'Whole Blood';}});
    if(!latest) return null;
    const isFemale=(donorData.gender||'').toLowerCase()==='female';
    const days=COOLDOWN_DAYS[comp][isFemale?'female':'male'];
    const next=new Date(latest);next.setDate(next.getDate()+days);return next;
  },[donationHistory,donorData.gender]);

  const nextEligibleDisplay = useMemo(()=>{
    if(!nextEligibleDate||nextEligibleDate<=new Date()) return 'Ready now!';
    return formatDateDMY(nextEligibleDate);
  },[nextEligibleDate]);

  const donationStreak = useMemo(()=>{
    const done:DonationStatus[]=['Donated','Redeemed-Credit','Completed'];
    const cutoff=new Date();cutoff.setMonth(cutoff.getMonth()-12);
    return donationHistory.filter(d=>done.includes(d.status)&&d.date>=cutoff).length;
  },[donationHistory]);

  const upcomingAppointments = useMemo(()=>donationHistory.filter(d=>['Scheduled','Pending'].includes(d.status)),[donationHistory]);

  const computeBadge = (n:number) => n>=20?'💎 Diamond':n>=10?'🥇 Gold':n>=5?'🥈 Silver':'🥉 Bronze';
  const badgeBg      = (n:number) => n>=20?'bg-blue-600':n>=10?'bg-yellow-500':n>=5?'bg-gray-400':'bg-orange-700';

  // ── Handlers ───────────────────────────────────────────────

  const handleViewHistoryQR = (d:Donation) => {
    setSelectedHistoryQR({rtid:d.rtidCode,payload:`${donorData.fullName}|${donorData.bloodGroup}|${d.rtidCode}|${d.hospitalName}|${d.city}|${d.component||'Whole Blood'}`,location:d.hospitalName,date:d.date,component:d.component,qrStatus:d.qrRedemptionStatus,otpExpiryTime:d.otpExpiryTime});
    setHistoryQROpen(true);
  };

  const handleFindCenters = async () => {
    if(!scheduleCity.trim()){toast.error('Please enter a city');return;}
    setApiLoading(true);setCenters([]);
    try{
      const snap = await getDocs(query(collection(db,'users'),where('role','==','bloodbank'),where('isVerified','==',true)));
      const found:BloodCenter[]=[];
      snap.forEach(d=>{const v=d.data() as any;const bankCity=v.district||v.city||'';if(citiesMatch(scheduleCity,bankCity))found.push({id:d.id,name:v.fullName||'Blood Bank',address:v.address||'',phone:v.mobile||'N/A',city:bankCity,state:v.state||'',pincode:v.pincode||'',latitude:v.latitude,longitude:v.longitude,fullAddress:`${v.address||''}${bankCity?', '+bankCity:''}${v.state?', '+v.state:''}${v.pincode?' - '+v.pincode:''}`});});
      if(found.length===0){const snap2=await getDocs(collection(db,'blood-banks'));snap2.forEach(d=>{const v=d.data() as any;if(citiesMatch(scheduleCity,v.city||v.district||''))found.push({id:d.id,name:v.name||'Blood Bank',address:v.address||'',phone:v.phone||v.mobile||'N/A',city:v.city||'',state:v.state||'',pincode:v.pincode||'',fullAddress:v.address||''});});}
      setCenters(found);
      if(found.length===0) toast.error(`No verified blood banks found in "${scheduleCity}"`);
      else toast.success(`Found ${found.length} blood bank(s)`);
    }catch(e:any){toast.error('Search failed',{description:e.message});}
    finally{setApiLoading(false);}
  };

  const handleSelectCenter = (c:BloodCenter) => {
    setSelectedCenter(c);
    const tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);
    setBookingForm({date:tomorrow.toISOString().split('T')[0],time:'09:00 AM',component:'Whole Blood'});
    setBookingConsent({highRisk: false, illness: false, medication: false, vaccination: false});
    setBookingOpen(true);
  };

  // ── BOOKING WITH WAITING PERIOD VALIDATION ─────────────────
  const handleBookAppointment = async () => {
    if(!selectedCenter||!bookingForm.date||!userId){toast.error('Please fill all fields');return;}

    const component = bookingForm.component;
    const isFemale  = (donorData.gender||'').toLowerCase()==='female';

    // ① Block if a Scheduled/Pending appointment already exists for this component
    const existingActive = donationHistory.find(d =>
      d.component === component && ['Scheduled','Pending'].includes(d.status)
    );
    if (existingActive) {
      toast.error(`Active appointment already exists`, {
        description: `You already have a scheduled ${component} appointment (${existingActive.rtidCode}) on ${formatDateDMY(existingActive.date)}. Cancel it first or choose a different component.`,
      });
      return;
    }

    // ② Block if selected date is within the cooldown period
    const DONE_STATUSES: DonationStatus[] = ['Donated','Completed','Redeemed-Credit','Verified','Credited','Pledged'];
    const lastOfType = donationHistory
      .filter(d => d.component === component && DONE_STATUSES.includes(d.status))
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

    if (lastOfType) {
      const cooldownDays = COOLDOWN_DAYS[component][isFemale ? 'female' : 'male'];
      const nextAllowed  = new Date(lastOfType.date.getTime() + cooldownDays * 86400000);
      const time24       = convert12to24(bookingForm.time);
      const selectedDt   = new Date(`${bookingForm.date}T${time24}`);

      if (selectedDt < nextAllowed) {
        const daysLeft = Math.ceil((nextAllowed.getTime() - selectedDt.getTime()) / 86400000);
        toast.error(`Too soon for ${component} donation`, {
          description: `You need to wait ${cooldownDays} days between ${component} donations. You can book from ${formatDateDMY(nextAllowed)} (${daysLeft} more day${daysLeft !== 1 ? 's' : ''} remaining).`,
        });
        return;
      }
    }

    // ③ Proceed with booking
    setApiLoading(true);
    try{
      const rtid   = await generateUniqueAppointmentRtid(bookingForm.date);
      const time24 = convert12to24(bookingForm.time);
      const dt     = new Date(`${bookingForm.date}T${time24}`);
      if(isNaN(dt.getTime())) throw new Error('Invalid date/time');

      await addDoc(collection(db,'appointments'),{
        rtid,appointmentRtid:rtid,donorId:userId,
        donorName:donorData.fullName||'Donor',mobile:donorData.mobile||'',
        gender:donorData.gender||'Male',bloodGroup:donorData.bloodGroup||'O+',
        date:Timestamp.fromDate(dt),time:bookingForm.time,
        bloodBankId:selectedCenter.id,bloodBankName:selectedCenter.name,
        status:'Upcoming',component:bookingForm.component,createdAt:Timestamp.now(),
      });

      const otp=Math.floor(100000+Math.random()*900000).toString();
      await setDoc(doc(db,'donations',rtid),{
        rtid,dRtid:rtid,appointmentRtid:rtid,donorId:userId,
        donorName:donorData.fullName||'Donor',donorMobile:donorData.mobile||'',
        bloodGroup:donorData.bloodGroup||'O+',
        bloodBankId:selectedCenter.id,bloodBankName:selectedCenter.name,
        donationType:'Regular',component:bookingForm.component,
        status:'Scheduled',otp,date:Timestamp.fromDate(dt),time:bookingForm.time,
        city:donorData.city||'',donationLocation:donorData.city||'',
        createdAt:Timestamp.now(),otpExpiryTime:Timestamp.fromDate(new Date(dt.getTime()+86400000)),
        hRtid:null,linkedHrtid:null,patientName:null,hospitalName:null,
      });

      const payload=`${donorData.fullName}|${donorData.bloodGroup}|${rtid}|${selectedCenter.name}|${donorData.city}|${bookingForm.component}`;
      setBookingDetails({rtid,qrPayload:payload});
      toast.success('Appointment booked!',{description:`RTID: ${rtid}`});
      setBookingOpen(false);setScheduleOpen(false);
      setBookingConfirmOpen(true);
    }catch(e:any){toast.error('Booking failed',{description:e.message});}
    finally{setApiLoading(false);}
  };

  const handleRescheduleClick = (d:Donation) => {
    setApptToReschedule(d);
    setRescheduleForm({date:d.date.toISOString().split('T')[0],time:d.time||'09:00 AM'});
    setRescheduleOpen(true);
  };

  const handleRescheduleAppointment = async () => {
    if(!apptToReschedule||!userId) return;
    setApiLoading(true);
    try{
      const rtid=apptToReschedule.rtidCode,time24=convert12to24(rescheduleForm.time),newDate=new Date(`${rescheduleForm.date}T${time24}`);
      const appSnap=await getDocs(query(collection(db,'appointments'),where('rtid','==',rtid)));
      if(!appSnap.empty) await updateDoc(appSnap.docs[0].ref,{date:Timestamp.fromDate(newDate),time:rescheduleForm.time,updatedAt:Timestamp.now()});
      const donRef=doc(db,'donations',rtid);const donSnap=await getDoc(donRef);
      if(donSnap.exists()) await updateDoc(donRef,{date:Timestamp.fromDate(newDate),time:rescheduleForm.time,otpExpiryTime:Timestamp.fromDate(new Date(newDate.getTime()+86400000)),updatedAt:Timestamp.now()});
      setDonationHistory(prev=>sortHistory(prev.map(d=>d.rtidCode===rtid?{...d,date:newDate,time:rescheduleForm.time}:d)));
      setRescheduleOpen(false);
      toast.success('Rescheduled!',{description:`New: ${formatDateDMY(newDate)} at ${rescheduleForm.time}`});
    }catch(e:any){toast.error('Reschedule failed',{description:e.message});}
    finally{setApiLoading(false);}
  };

  const handleCancelAppointment = async (donation:Donation) => {
    const result=await Swal.fire({title:'Cancel Appointment?',text:`Cancel your appointment on ${formatDateDMY(donation.date)} at ${donation.hospitalName}?`,icon:'warning',showCancelButton:true,confirmButtonColor:'#EF4444',cancelButtonColor:'#6B7280',confirmButtonText:'Yes, Cancel',cancelButtonText:'Keep It'});
    if(!result.isConfirmed) return;
    try{
      const rtid=donation.rtidCode;
      const appSnap=await getDocs(query(collection(db,'appointments'),where('rtid','==',rtid)));
      if(!appSnap.empty) await updateDoc(appSnap.docs[0].ref,{status:'Cancelled',cancelledAt:Timestamp.now()});
      const donRef=doc(db,'donations',rtid);
      if((await getDoc(donRef)).exists()) await updateDoc(donRef,{status:'Cancelled',cancelledAt:Timestamp.now()});
      setDonationHistory(prev=>sortHistory(prev.map(d=>d.rtidCode===rtid?{...d,status:'Cancelled' as DonationStatus}:d)));
      toast.success('Appointment cancelled.');
    }catch(e:any){toast.error('Could not cancel',{description:e.message});}
  };

  const handleViewHrtid = async (hrtid:string) => {
    setHrtidLoading(true);setHrtidModalOpen(true);setHrtidDetails(null);
    try{
      let data:any=null,hospitalName='Hospital';
      const tryDoc=async(id:string)=>{try{const s=await getDoc(doc(db,'bloodRequests',id));return s.exists()?s.data():null;}catch{return null;}};
      const tryQ=async(field:string,val:string)=>{try{const s=await getDocs(query(collection(db,'bloodRequests'),where(field,'==',val)));return s.empty?null:s.docs[0].data();}catch{return null;}};
      data=await tryDoc(hrtid)||await tryQ('linkedRTID',hrtid)||await tryQ('rtid',hrtid);
      if(data?.hospitalId){try{const s=await getDoc(doc(db,'users',data.hospitalId));if(s.exists())hospitalName=s.data().fullName||'Hospital';}catch(_){}}
      if(!data){toast.error('Request not found');setHrtidModalOpen(false);return;}
      const matching=donationHistory.find(d=>d.linkedHrtid===hrtid);
      setHrtidDetails({patientName:data.patientName,bloodGroup:data.bloodGroup,units:data.units||data.unitsRequired,hospital:hospitalName,rtidCode:hrtid,bloodBankId:'',component:data.component||'Whole Blood',requiredBy:data.requiredBy?formatDateTimeDMY(safeDate(data.requiredBy)):'N/A',impactTimeline:matching?.impactTimeline});
    }catch(_){toast.error('Failed to fetch details');setHrtidModalOpen(false);}
    finally{setHrtidLoading(false);}
  };

  const handleAvailabilityChange = async (mode:'available'|'weekends'|'unavailable') => {
    if(!userId) return;
    try{await updateDoc(doc(db,'users',userId),{availabilityMode:mode});setDonorData(prev=>({...prev,availabilityMode:mode}));toast.success('Availability updated');}
    catch(_){toast.error('Update failed');}
  };

  const handleLogoutConfirm = () => {
    Swal.fire({title:'Logout?',icon:'warning',showCancelButton:true,confirmButtonColor:'#8B0000',confirmButtonText:'Yes, Logout'}).then(r=>{if(r.isConfirmed)onLogout();});
  };

  const initials = (n:string) => (n||'').split(' ').map(s=>s[0]||'').slice(0,2).join('').toUpperCase();
  const AlarmClock = Clock;

  if(loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-12 h-12 animate-spin text-primary"/></div>;

// ─────────────────────────────────────────────────────────────
// END OF PART 2 — Paste Part 3 (the return/JSX) immediately below
// ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
// DonorDashboard.tsx  — PART 3 of 3
// FIXES IN THIS PART:
//   • D-RTID column: full RTID visible — larger font (text-xs),
//     no truncation, wider min-width column, monospace badge
//   • Upcoming rows highlighted in table (blue left border)
//   • Dedicated Upcoming Appointments section with full details
//   • PC + mobile responsive (max-w-6xl)
// ═══════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-background pb-10">

      {/* ═══ HEADER ════════════════════════════════════════════ */}
      <header className="bg-[#8B0000] dark:bg-[#3a0000] text-white py-3 shadow-lg no-print sticky top-0 z-40">
        <div className="container mx-auto px-4 max-w-6xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img src={logo} alt="RaktPort" className="w-10 h-10 rounded-full border-2 border-white/40 shadow flex-shrink-0"/>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold leading-tight flex flex-wrap items-center gap-1.5">
                <span className="truncate max-w-[150px] sm:max-w-[300px]">Hello, {(donorData.fullName||'Donor').split(' ')[0]}! 👋</span>
                {donorData.bloodGroup && <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full flex-shrink-0">{donorData.bloodGroup}</span>}
              </h1>
              <p className="text-xs text-red-200 opacity-80 truncate">
                {donorData.internalId || donorData.donorId || 'RaktPort Donor'}
                {donorData.username && <span className="ml-1.5 opacity-70">· {formatUsername(donorData.username)}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ModeToggle />
            <Button variant="secondary" size="sm" className="bg-white text-[#8B0000] hover:bg-gray-100 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 text-xs px-3" onClick={()=>setProfileOpen(true)}>
              <User className="w-3.5 h-3.5 mr-1"/> Profile
            </Button>
            <button onClick={handleLogoutConfirm} className="text-xs font-medium opacity-80 hover:opacity-100 px-1">Logout</button>
          </div>
        </div>
      </header>

      {/* ═══ MOTIVATION BANNER ═════════════════════════════════ */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-b border-orange-100 dark:border-orange-900/40 py-2 no-print">
        <p className="text-xs sm:text-sm text-center text-orange-800 dark:text-orange-300 font-medium px-4 flex items-center justify-center gap-2">
          <Star className="w-3.5 h-3.5 fill-orange-500 text-orange-500 flex-shrink-0"/>
          <em>"{motivationQuote}"</em>
        </p>
      </div>

      {/* ═══ EMERGENCY ALERTS ══════════════════════════════════ */}
      {emergencyAlerts.length>0 && (
        <div className="no-print">
          {emergencyAlerts.map(alert=>(
            <div key={alert.id} className={`px-4 py-3 flex items-center gap-3 flex-wrap ${alert.urgency==='critical'?'bg-red-600':'bg-orange-500'} text-white`}>
              <Zap className="w-4 h-4 flex-shrink-0"/>
              <span className="text-sm font-semibold flex-1">🚨 Urgent: <strong>{alert.bloodGroup}</strong> needed at {alert.hospitalName}</span>
              <Button size="sm" className="bg-white text-red-700 hover:bg-gray-100 text-xs py-1 h-7" onClick={()=>{setScheduleOpen(true);setEmergencyOpen(false);}}>Respond Now</Button>
              <button onClick={()=>setEmergencyAlerts(prev=>prev.filter(a=>a.id!==alert.id))} className="opacity-70 hover:opacity-100"><X className="w-4 h-4"/></button>
            </div>
          ))}
        </div>
      )}

      {/* ═══ MAIN CONTENT ══════════════════════════════════════ */}
      <main className="container mx-auto px-4 max-w-6xl py-5 space-y-5">

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 p-3 rounded-md flex gap-2 no-print">
            <AlertCircle className="text-red-500 w-4 h-4 mt-0.5 flex-shrink-0"/>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* ── ELIGIBILITY CARD ──────────────────────────────── */}
        <Card className={`shadow-md border-l-4 no-print ${isEligible?'border-l-green-500':'border-l-red-500'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0 ${isEligible?'bg-green-100 dark:bg-green-900/40':'bg-red-100 dark:bg-red-900/40'}`}>{isEligible?'🩸':'🚫'}</div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm ${isEligible?'text-green-700 dark:text-green-400':'text-red-600 dark:text-red-400'}`}>{eligibilityMsg}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Last donation: {lastDonationDisplay}</p>
                {!isEligible&&nextEligibleDate&&nextEligibleDate>new Date()&&(
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2">
                      <AlarmClock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0"/>
                      <div>
                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Next eligible: {nextEligibleDisplay}</p>
                        <CountdownTimer targetDate={nextEligibleDate} compact label="Time remaining"/>
                      </div>
                    </div>
                    {donationHistory.filter(d=>['Donated','Completed','Redeemed-Credit'].includes(d.status)).length>0&&(()=>{
                      const lastDon=donationHistory.find(d=>['Donated','Completed','Redeemed-Credit'].includes(d.status));
                      if(!lastDon) return null;
                      const comp=lastDon.component||'Whole Blood',isFemale=(donorData.gender||'').toLowerCase()==='female';
                      const total=COOLDOWN_DAYS[comp][isFemale?'female':'male']*86400000,elapsed=Date.now()-lastDon.date.getTime();
                      const pct=Math.min(Math.round((elapsed/total)*100),100);
                      return <div className="mt-1.5"><div className="flex justify-between text-[10px] text-blue-600 mb-0.5"><span>Recovery progress</span><span>{pct}%</span></div><Progress value={pct} className="h-1.5"/></div>;
                    })()}
                  </div>
                )}
              </div>
              <Button size="sm" onClick={()=>setScheduleOpen(true)} disabled={!isEligible}
                className={`flex-shrink-0 text-xs px-4 py-2 ${isEligible?'bg-green-600 hover:bg-green-700 text-white animate-pulse':'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                {isEligible?'❤️ Donate':'🚫 Not Yet'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── STATS ROW ─────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 no-print">
          {[
            {icon:<Droplet className="w-5 h-5 text-red-500 fill-red-500 mx-auto mb-1"/>, val:donorData.credits||0,   label:'Credits'},
            {icon:<Flame   className="w-5 h-5 text-orange-500 mx-auto mb-1"/>,           val:donationStreak,         label:'Streak (12mo)'},
            {icon:<Heart   className="w-5 h-5 text-pink-500 fill-pink-400 mx-auto mb-1"/>,val:(donorData.donationsCount||0)*3,label:'Lives'},
          ].map(({icon,val,label})=>(
            <Card key={label} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4 text-center">{icon}<p className="text-2xl font-black text-gray-800 dark:text-gray-100">{val}</p><p className="text-xs text-gray-500 dark:text-gray-400">{label}</p></CardContent>
            </Card>
          ))}
        </div>

        {/* ── QUICK ACTIONS ─────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 no-print">
          {[
            {icon:'🏆',label:'Certificate', action:()=>setCertOpen(true),       color:'from-amber-50 to-yellow-50 border-amber-200 dark:from-amber-950/30 dark:to-yellow-950/30 dark:border-amber-800'},
            {icon:'🩸',label:'Compatibility',action:()=>setCompatOpen(true),    color:'from-red-50 to-rose-50 border-red-200 dark:from-red-950/30 dark:to-rose-950/30 dark:border-red-800'},
            {icon:'💡',label:'Health Tips',  action:()=>setHealthTipsOpen(true),color:'from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-950/30 dark:to-indigo-950/30 dark:border-blue-800'},
            {icon:'📤',label:'Share',        action:()=>setShareOpen(true),     color:'from-purple-50 to-pink-50 border-purple-200 dark:from-purple-950/30 dark:to-pink-950/30 dark:border-purple-800'},
          ].map(({icon,label,action,color})=>(
            <button key={label} onClick={action} className={`bg-gradient-to-br ${color} border rounded-2xl p-4 flex flex-col items-center gap-2 hover:shadow-md active:scale-95 transition-all touch-manipulation`}>
              <span className="text-2xl">{icon}</span><span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{label}</span>
            </button>
          ))}
        </div>

        {/* ── HEALTH TIP BANNER ─────────────────────────────── */}
        <div className="no-print bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl p-4 border border-blue-100 dark:border-blue-800 flex items-start gap-3 cursor-pointer" onClick={()=>setHealthTipsOpen(true)}>
          <span className="text-2xl flex-shrink-0">{HEALTH_TIPS[currentHealthTip].icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-0.5">
              <p className="text-xs font-bold text-blue-800 dark:text-blue-300">{HEALTH_TIPS[currentHealthTip].title}</p>
              <Badge variant="outline" className="text-[9px] px-1 py-0 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 ml-auto">Health Tip</Badge>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 line-clamp-2">{HEALTH_TIPS[currentHealthTip].tip}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5"/>
        </div>

        {/* ── IMPACT SECTION ────────────────────────────────── */}
        <div className="no-print">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2"><Award className="w-4 h-4 text-yellow-500"/> Your Impact</h3>
            <button onClick={()=>setCompatOpen(true)} className="text-xs text-primary flex items-center gap-1 font-semibold hover:underline">{donorData.bloodGroup} Compatibility <ChevronRight className="w-3 h-3"/></button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {icon:<Droplet className="w-5 h-5 text-blue-500 mx-auto mb-1"/>,   val:donorData.donationsCount||0,           label:'Total Donations', border:'border-t-blue-500'},
              {icon:<Award   className="w-5 h-5 text-amber-500 mx-auto mb-1"/>, val:<span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${badgeBg(donorData.donationsCount||0)}`}>{computeBadge(donorData.donationsCount||0)}</span>, label:'Current Rank', border:'border-t-amber-500'},
              {icon:<Heart   className="w-5 h-5 text-pink-500 fill-pink-400 mx-auto mb-1"/>, val:(donorData.donationsCount||0)*3, label:'Lives Impacted', border:'border-t-pink-500'},
              {icon:<CalendarCheck className="w-5 h-5 text-green-500 mx-auto mb-1"/>, val:<span className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-tight">{nextEligibleDisplay}</span>, label:'Next Eligible', border:'border-t-green-500'},
            ].map(({icon,val,label,border})=>(
              <Card key={label} className={`bg-white dark:bg-gray-900 hover:shadow-md transition-shadow border-t-4 ${border}`}>
                <CardContent className="p-4 text-center">{icon}<p className="text-2xl font-black dark:text-gray-100">{val}</p><p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p></CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            UPCOMING APPOINTMENTS — dedicated section
        ════════════════════════════════════════════════════ */}
        {upcomingAppointments.length>0&&(
          <div className="no-print">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-blue-600 dark:text-blue-400"/> Upcoming Appointments
                <Badge className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5">{upcomingAppointments.length}</Badge>
              </h3>
              <Button size="sm" variant="outline" className="text-xs border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40" onClick={()=>setScheduleOpen(true)}>+ Book New</Button>
            </div>
            <div className="space-y-3">
              {upcomingAppointments.map((appt,i)=>{
                const isFuture=appt.date.getTime()>Date.now();
                return (
                  <Card key={i} className="border-2 border-blue-200 bg-gradient-to-r from-blue-50/60 to-white shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Date badge */}
                        <div className="w-14 h-14 rounded-xl bg-blue-600 flex flex-col items-center justify-center text-white flex-shrink-0 shadow-md">
                          <span className="text-xl font-black leading-none">{String(appt.date.getDate()).padStart(2,'0')}</span>
                          <span className="text-[10px] opacity-80 uppercase tracking-wide">{appt.date.toLocaleString('default',{month:'short'})}</span>
                          <span className="text-[9px] opacity-60">{appt.date.getFullYear()}</span>
                        </div>
                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            {/* Full RTID — monospace, no truncation */}
                            <span className="font-mono text-xs bg-blue-100 text-blue-900 px-2 py-0.5 rounded-md border border-blue-300 font-bold tracking-wider whitespace-nowrap">{appt.rtidCode}</span>
                            <ComponentBadge component={appt.component||'Whole Blood'}/>
                            <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50 text-[10px]">{appt.status}</Badge>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{appt.hospitalName}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                            <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3"/>{appt.time||'N/A'}</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3"/>{appt.city||'N/A'}</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1"><Droplet className="w-3 h-3 text-red-400"/>{appt.component||'Whole Blood'}</span>
                          </div>
                          {isFuture&&(
                            <div className="mt-1.5 inline-flex items-center gap-1 bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">
                              <Timer className="w-3 h-3"/><CountdownTimer targetDate={appt.date} compact label="In"/>
                            </div>
                          )}
                        </div>
                        {/* Actions */}
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <button onClick={()=>handleRescheduleClick(appt)} title="Reschedule" className="p-2 hover:bg-blue-100 rounded-xl text-blue-500 hover:text-blue-700 transition-colors"><CalendarCheck className="w-4 h-4"/></button>
                          <button onClick={()=>handleCancelAppointment(appt)} title="Cancel"     className="p-2 hover:bg-red-50 rounded-xl text-red-400 hover:text-red-600 transition-colors"><XCircle className="w-4 h-4"/></button>
                          <button onClick={()=>handleViewHistoryQR(appt)}    title="View QR"    className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-primary transition-colors"><QrCode className="w-4 h-4"/></button>
                          <button onClick={()=>setDonationToPrint(appt)}     title="Print"      className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-primary transition-colors"><Printer className="w-4 h-4"/></button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            DONATION HISTORY TABLE
            FIX: D-RTID column — full text, larger font, no truncation
        ════════════════════════════════════════════════════ */}
        <Card className="bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-100 dark:border-gray-800 overflow-hidden">
          <CardHeader className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 p-4">
            <CardTitle className="text-sm text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <List className="w-4 h-4 text-primary"/> Donation History &amp; Credits
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Tap QR icon to view verification code. Tap H badge to see patient impact.
              {upcomingAppointments.length>0&&<span className="ml-2 text-blue-600 font-medium">· {upcomingAppointments.length} upcoming shown first</span>}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {donationHistory.length===0 ? (
              <div className="p-10 text-center text-muted-foreground">
                <List className="w-8 h-8 mx-auto mb-2 opacity-30"/>
                <p className="text-sm">No donations yet — start your life-saving journey!</p>
                <Button size="sm" className="mt-3 bg-primary" onClick={()=>setScheduleOpen(true)}>Book Appointment</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/30">
                      {/* Wider columns so RTID fits */}
                      <TableHead className="text-xs font-semibold px-3 py-2 min-w-[110px]">Date</TableHead>
                      <TableHead className="text-xs font-semibold px-3 py-2 min-w-[200px]">D-RTID</TableHead>
                      <TableHead className="text-xs font-semibold px-3 py-2 min-w-[120px]">Component</TableHead>
                      <TableHead className="text-xs font-semibold px-3 py-2 min-w-[100px]">OTP</TableHead>
                      <TableHead className="text-xs font-semibold px-3 py-2 min-w-[100px]">Status</TableHead>
                      <TableHead className="text-xs font-semibold px-3 py-2 text-right min-w-[130px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donationHistory.map((r,i)=>{
                      const canCancel=['Scheduled','Pending'].includes(r.status);
                      const isFuture=r.date.getTime()>Date.now();
                      const isUpcoming=canCancel;
                      return (
                        <TableRow key={i} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isUpcoming?'bg-blue-50/40 dark:bg-blue-900/20 border-l-2 border-l-blue-400 dark:border-l-blue-500':''}`}>

                          {/* Date */}
                          <TableCell className="px-3 py-2.5">
                            <div>
                              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{formatDateDMY(r.date)}</p>
                              {r.time&&<p className="text-[10px] text-gray-400 dark:text-gray-500">{r.time}</p>}
                              {canCancel&&isFuture&&<CountdownTimer targetDate={r.date} compact label="In"/>}
                            </div>
                          </TableCell>

                          {/* ── D-RTID: full text, text-xs (no truncation) ── */}
                          <TableCell className="px-3 py-2.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`font-mono text-xs px-2 py-1 rounded-md border font-semibold whitespace-nowrap select-all ${
                                isUpcoming
                                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600'
                              }`}>
                                {r.rtidCode}
                              </span>
                              {r.linkedHrtid&&r.linkedHrtid!=='—'&&r.linkedHrtid!=='N/A'&&(
                                <button onClick={()=>handleViewHrtid(r.linkedHrtid)}
                                  className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold border border-blue-200 hover:bg-blue-200 flex-shrink-0"
                                  title="View patient impact">H</button>
                              )}
                            </div>
                          </TableCell>

                          {/* Component */}
                          <TableCell className="px-3 py-2.5">
                            {r.component&&<ComponentBadge component={r.component}/>}
                          </TableCell>

                          {/* OTP */}
                          <TableCell className="px-3 py-2.5">
                            {['Donated','Verified'].includes(r.status)?(
                              <div className="flex items-center gap-1 text-green-700 font-bold text-xs bg-green-50 px-1.5 py-0.5 rounded w-fit">
                                <KeyRound className="w-2.5 h-2.5"/> {r.otp}
                              </div>
                            ):<span className="text-gray-300 text-xs">●●●●●●</span>}
                          </TableCell>

                          {/* Status */}
                          <TableCell className="px-3 py-2.5">
                            {r.status==='Scheduled'       &&<Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50 text-[10px]">Scheduled</Badge>}
                            {r.status==='Pending'         &&<Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50 text-[10px]">Pending</Badge>}
                            {r.status==='Donated'         &&<Badge variant="outline" className="border-green-300 text-green-700 bg-green-50 text-[10px]">Available</Badge>}
                            {r.status==='Verified'        &&<Badge variant="outline" className="border-teal-300 text-teal-700 bg-teal-50 text-[10px]">Verified</Badge>}
                            {r.status==='Credited'        &&<Badge variant="outline" className="border-indigo-300 text-indigo-700 bg-indigo-50 text-[10px]">Credited</Badge>}
                            {r.status==='Redeemed-Credit' &&<Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50 text-[10px]">Redeemed</Badge>}
                            {r.status==='Completed'       &&<Badge variant="outline" className="border-gray-300 text-gray-600 bg-gray-50 text-[10px]">Completed</Badge>}
                            {r.status==='Expired'         &&<Badge variant="outline" className="border-red-300 text-red-700 bg-red-50 text-[10px]">Expired</Badge>}
                            {r.status==='Cancelled'       &&<Badge variant="outline" className="border-gray-400 text-gray-500 bg-gray-100 text-[10px]">Cancelled</Badge>}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="px-3 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-0.5">
                              {canCancel&&<button onClick={()=>handleRescheduleClick(r)} title="Reschedule" className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-500 hover:text-blue-700 transition-colors"><CalendarCheck className="w-4 h-4"/></button>}
                              {canCancel&&<button onClick={()=>handleCancelAppointment(r)} title="Cancel" className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors"><XCircle className="w-4 h-4"/></button>}
                              <button onClick={()=>handleViewHistoryQR(r)} title="View QR" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-primary transition-colors"><QrCode className="w-4 h-4"/></button>
                              <button onClick={()=>setDonationToPrint(r)} title="Print slip" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-primary transition-colors"><Printer className="w-4 h-4"/></button>
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

      {/* ═══════════════════════════════════════════════════════
          MODALS
      ═══════════════════════════════════════════════════════ */}

      {/* ── Profile ───────────────────────────────────────── */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl no-print max-h-[95vh] overflow-y-auto">
          <div className="flex flex-col sm:flex-row h-full">
            <div className="w-full sm:w-[200px] sm:flex-shrink-0 bg-gradient-to-br from-[#8B0000] to-[#5a0000] text-white p-5 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full border-4 border-white/30 bg-white/10 flex items-center justify-center text-3xl font-black mb-3">{initials(donorData.fullName||'D')}</div>
              <h2 className="text-lg font-bold mb-0.5">{donorData.fullName}</h2>
              <p className="text-xs text-red-200 mb-1 font-mono">{donorData.internalId || 'N/A'}</p>
              {donorData.username && <p className="text-xs text-red-300 mb-3">{formatUsername(donorData.username)}</p>}
              {!donorData.username && <div className="mb-3" />}
              <div className="bg-white/10 rounded-xl p-3 w-full border border-white/10 mb-3">
                <div className="flex justify-around">
                  <div className="text-center"><p className="text-[10px] text-red-200 uppercase">Blood</p><p className="text-2xl font-black">{donorData.bloodGroup}</p></div>
                  <div className="text-center"><p className="text-[10px] text-red-200 uppercase">Age</p><p className="text-lg font-bold">{calculateAge(donorData.dob)} yr</p></div>
                </div>
              </div>
              <QRCodeCanvas data={`Profile:${donorData.internalId || userId}`} size={80} className="rounded-lg bg-white p-1"/>
              <p className="text-[9px] text-red-300 mt-1.5">Scan to verify</p>
            </div>
            <div className="flex-1 bg-white p-4 overflow-y-auto">
              <Tabs defaultValue="overview">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="badges">Badges</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-2.5">
                  {[
                    {icon:MapPin,      label:'Location',     value:`${donorData.city||'—'}${donorData.pincode?', '+donorData.pincode:''}`},
                    {icon:BadgeCheck,  label:'Donor ID',  value:donorData.internalId || '—'},
                    ...(donorData.username ? [{icon:BadgeCheck, label:'@rakt Username', value:formatUsername(donorData.username)}] : []),
                    {icon:Mail,        label:'Email',        value:donorData.email||'—'},
                    {icon:Phone,       label:'Mobile',       value:donorData.mobile||'—'},
                    {icon:CalendarCheck,label:'Last Donation',value:lastDonationDisplay},
                    {icon:Calendar,   label:'Next Eligible', value:nextEligibleDisplay},
                  ].map(({icon:Icon,label,value})=>(
                    <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <Icon className="w-4 h-4 text-gray-400 flex-shrink-0"/>
                      <div className="min-w-0"><p className="text-[10px] text-gray-400 font-medium">{label}</p><p className="text-sm font-semibold text-gray-800 truncate">{value}</p></div>
                    </div>
                  ))}
                  {nextEligibleDate&&nextEligibleDate>new Date()&&(
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-2"><AlarmClock className="w-4 h-4 text-blue-600 flex-shrink-0"/><div><p className="text-xs font-bold text-blue-800">Countdown to next donation</p><CountdownTimer targetDate={nextEligibleDate} compact/></div></div>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={()=>{setCompatOpen(true);setProfileOpen(false);}}><HeartHandshake className="w-3.5 h-3.5 mr-1"/> Compatibility</Button>
                    <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={()=>{setCertOpen(true);setProfileOpen(false);}}><Download className="w-3.5 h-3.5 mr-1"/> Certificate</Button>
                  </div>
                </TabsContent>
                <TabsContent value="badges">
                  <div className="grid grid-cols-2 gap-3">
                    {[{icon:'🥉',label:'Bronze Donor',req:1,desc:'1+ donations'},{icon:'🥈',label:'Silver Donor',req:5,desc:'5+ donations'},{icon:'🥇',label:'Gold Donor',req:10,desc:'10+ donations'},{icon:'💎',label:'Diamond Donor',req:20,desc:'20+ donations'}].map(b=>{
                      const unlocked=(donorData.donationsCount||0)>=b.req;
                      return <div key={b.label} className={`p-4 rounded-xl border-2 text-center ${unlocked?'border-yellow-300 bg-yellow-50':'border-gray-100 bg-gray-50 opacity-50 grayscale'}`}><span className="text-3xl">{b.icon}</span><p className="text-xs font-bold mt-1 text-gray-800">{b.label}</p><p className="text-[10px] text-gray-500">{b.desc}</p>{unlocked&&<p className="text-[9px] text-green-600 font-bold mt-0.5">✓ Unlocked</p>}</div>;
                    })}
                  </div>
                </TabsContent>
                <TabsContent value="settings" className="space-y-4">
                  <div>
                    <Label className="text-sm mb-2 block">Availability Mode</Label>
                    <Select value={donorData.availabilityMode||'available'} onValueChange={v=>handleAvailabilityChange(v as any)}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent><SelectItem value="available">✅ Available Now</SelectItem><SelectItem value="weekends">📅 Weekends Only</SelectItem><SelectItem value="unavailable">🚫 Unavailable</SelectItem></SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">Controls visibility in emergency searches</p>
                  </div>
                  <div className="space-y-3">
                    {[['SMS Notifications','Receive updates about camps'],['Emergency Alerts','Get notified for urgent nearby needs'],['Show in Donor List','Allow hospitals to find you']].map(([l,d])=>(
                      <div key={l} className="flex items-center justify-between"><div><Label className="text-sm">{l}</Label><p className="text-xs text-muted-foreground">{d}</p></div><Switch defaultChecked/></div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Find Blood Banks ──────────────────────────────── */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="max-w-lg rounded-2xl no-print max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-primary"/> Find Blood Banks</DialogTitle><DialogDescription>Find verified blood banks near you</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Enter city (e.g. Delhi, Mumbai)" value={scheduleCity} onChange={e=>setScheduleCity(e.target.value)} onKeyPress={e=>e.key==='Enter'&&handleFindCenters()} className="flex-1"/>
              <Button onClick={handleFindCenters} disabled={apiLoading||!scheduleCity.trim()}>{apiLoading?<Loader2 className="w-4 h-4 animate-spin"/>:'Search'}</Button>
            </div>
            {apiLoading&&<div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2"/><p className="text-sm text-gray-500">Finding blood banks…</p></div>}
            {!apiLoading&&centers.length>0&&(
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {centers.map(c=>(
                  <div key={c.id} className="border-2 rounded-xl p-3 hover:border-primary cursor-pointer transition-all group" onClick={()=>handleSelectCenter(c)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gray-900 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-primary flex-shrink-0"/>{c.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-start gap-1"><MapPin className="w-3 h-3 flex-shrink-0 mt-0.5"/>{c.fullAddress||c.address}</p>
                        {c.phone&&<p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3"/>{c.phone}</p>}
                      </div>
                      <Badge className="bg-primary text-white text-xs flex-shrink-0 group-hover:bg-primary/90">Book</Badge>
                    </div>
                    {c.latitude&&c.longitude&&(
                      <button className="mt-2 text-[10px] text-blue-600 flex items-center gap-1 hover:underline" onClick={e=>{e.stopPropagation();window.open(`https://www.google.com/maps/dir/?api=1&destination=${c.latitude},${c.longitude}`,'_blank');}}>
                        <Navigation className="w-3 h-3"/> Get Directions
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!apiLoading&&centers.length===0&&scheduleCity&&<div className="text-center py-8 text-gray-400"><Building2 className="w-10 h-10 mx-auto mb-2 opacity-30"/><p className="text-sm">No blood banks found in "{scheduleCity}"</p></div>}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Booking Modal ─────────────────────────────────── */}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="max-w-sm rounded-2xl no-print">
          <DialogHeader><DialogTitle>Confirm Appointment</DialogTitle><DialogDescription>Book at <strong>{selectedCenter?.name}</strong></DialogDescription></DialogHeader>

          {/* Waiting period info banner */}
          {bookingForm.component && (() => {
            const isFemale=(donorData.gender||'').toLowerCase()==='female';
            const cooldown=COOLDOWN_DAYS[bookingForm.component as DonationComponent];
            const days=cooldown?cooldown[isFemale?'female':'male']:0;
            const existingActive=donationHistory.find(d=>d.component===bookingForm.component&&['Scheduled','Pending'].includes(d.status));
            if(existingActive) return (
              <div className="mx-1 mb-1 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5"/>
                <span><strong>Active appointment exists</strong> for {bookingForm.component} on {formatDateDMY(existingActive.date)}. Cancel it first.</span>
              </div>
            );
            return (
              <div className="mx-1 mb-1 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex items-start gap-2">
                <Clock className="w-4 h-4 flex-shrink-0 mt-0.5"/>
                <span><strong>{bookingForm.component}</strong> requires a <strong>{days}-day</strong> waiting period between donations {isFemale?'(female)':'(male)'}.</span>
              </div>
            );
          })()}

          <div className="space-y-3 py-2">
            <div><Label className="text-xs mb-1 block">Date</Label><Input type="date" value={bookingForm.date} min={new Date().toISOString().split('T')[0]} onChange={e=>setBookingForm(f=>({...f,date:e.target.value}))}/></div>
            <div><Label className="text-xs mb-1 block">Time</Label>
              <Select value={bookingForm.time} onValueChange={v=>setBookingForm(f=>({...f,time:v}))}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>{['09:00 AM','10:00 AM','11:00 AM','12:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM'].map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1 block">Donation Type</Label>
              <Select value={bookingForm.component} onValueChange={v=>setBookingForm(f=>({...f,component:v as DonationComponent}))}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Whole Blood">Whole Blood (90d ♂ / 120d ♀)</SelectItem>
                  <SelectItem value="Platelets">Platelets (7-day interval)</SelectItem>
                  <SelectItem value="Plasma">Plasma (14-day interval)</SelectItem>
                  <SelectItem value="PRBC">PRBC (90d ♂ / 120d ♀)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="mt-3 p-3 bg-red-50/50 border border-red-100 rounded-xl space-y-2">
              <Label className="text-[11px] font-bold text-red-800">Pre-donation Questionnaire (NACO)</Label>
              <p className="text-[10px] text-red-600/80 leading-tight mb-2">Please confirm you meet the following baseline requirements:</p>
              {[
                {key:'highRisk', label:'No high-risk behavior'},
                {key:'illness', label:'No recent illness, infection, or major surgery'},
                {key:'medication', label:'No medication conflicts'},
                {key:'vaccination', label:'No recent vaccination, tattoo, or pregnancy etc.'}
              ].map(q => (
                <div key={q.key} className="flex items-start gap-2">
                  <input 
                    type="checkbox" 
                    id={`consent-${q.key}`} 
                    checked={bookingConsent[q.key as keyof typeof bookingConsent]} 
                    onChange={(e)=>setBookingConsent(s=>({...s, [q.key]: e.target.checked}))}
                    className="mt-0.5 w-3 h-3 text-red-600 border-red-300 rounded focus:ring-red-500 cursor-pointer"
                  />
                  <Label htmlFor={`consent-${q.key}`} className="text-[10px] sm:text-xs font-medium leading-tight cursor-pointer text-gray-700">{q.label}</Label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={()=>setBookingOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleBookAppointment} disabled={apiLoading||!bookingForm.date||!Object.values(bookingConsent).every(Boolean)}>
              {apiLoading?<Loader2 className="w-3.5 h-3.5 animate-spin mr-1"/>:null} Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Booking Confirmed ─────────────────────────────── */}
      <Dialog open={bookingConfirmOpen} onOpenChange={setBookingConfirmOpen}>
        <DialogContent className="max-w-sm rounded-2xl text-center no-print">
          <DialogHeader>
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3"><Check className="w-7 h-7 text-green-600"/></div>
            <DialogTitle className="text-green-700">Booking Confirmed!</DialogTitle>
          </DialogHeader>
          <div className="py-4 flex flex-col items-center gap-3 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-xs text-gray-500 font-medium">Show this QR at the centre</p>
            <canvas ref={confirmQrRef} className="border-4 border-white shadow rounded-lg"/>
            <p className="font-mono font-bold text-sm tracking-wider bg-white px-3 py-1 rounded border">{bookingDetails.rtid}</p>
          </div>
          <Button className="w-full mt-2" onClick={()=>{setBookingConfirmOpen(false);window.location.reload();}}>Done</Button>
        </DialogContent>
      </Dialog>

      {/* ── Reschedule ────────────────────────────────────── */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="max-w-sm rounded-2xl no-print">
          <DialogHeader><DialogTitle>Reschedule Appointment</DialogTitle><DialogDescription>Choose a new date and time</DialogDescription></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs mb-1 block">New Date</Label><Input type="date" value={rescheduleForm.date} min={new Date().toISOString().split('T')[0]} onChange={e=>setRescheduleForm(f=>({...f,date:e.target.value}))}/></div>
            <div><Label className="text-xs mb-1 block">New Time</Label>
              <Select value={rescheduleForm.time} onValueChange={v=>setRescheduleForm(f=>({...f,time:v}))}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>{['09:00 AM','10:00 AM','11:00 AM','12:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM'].map(t=><SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={()=>setRescheduleOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleRescheduleAppointment} disabled={apiLoading}>{apiLoading?<Loader2 className="w-3.5 h-3.5 animate-spin mr-1"/>:null} Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── H-RTID Details ────────────────────────────────── */}
      <Dialog open={hrtidModalOpen} onOpenChange={setHrtidModalOpen}>
        <DialogContent className="rounded-2xl no-print max-w-sm">
          <DialogHeader><DialogTitle>Linked Patient Request</DialogTitle><DialogDescription>This donation was linked to a specific patient need</DialogDescription></DialogHeader>
          {hrtidLoading?<div className="flex justify-center p-6"><Loader2 className="w-7 h-7 animate-spin text-primary"/></div>:hrtidDetails?(
            <div className="space-y-3">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-800 space-y-2 text-sm">
                {[['H-RTID',hrtidDetails.rtidCode],['Patient',hrtidDetails.patientName],['Hospital',hrtidDetails.hospital],['Blood Group',hrtidDetails.bloodGroup],['Units',String(hrtidDetails.units)],['Required By',hrtidDetails.requiredBy||'N/A']].map(([k,v])=>(
                  <div key={k} className="flex justify-between gap-2"><span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{k}</span><span className="text-xs font-bold text-gray-900 dark:text-gray-100 text-right leading-tight max-w-[65%] break-words">{v}</span></div>
                ))}
              </div>
              {hrtidDetails.impactTimeline&&<ImpactTimelineView timeline={hrtidDetails.impactTimeline}/>}
            </div>
          ):<p className="text-center text-sm text-gray-400 py-4">No details available</p>}
        </DialogContent>
      </Dialog>

      {/* ── Feature Modals ────────────────────────────────── */}
      <CertificateModal isOpen={certOpen} onClose={()=>setCertOpen(false)} donorData={donorData} donationHistory={donationHistory}/>
      <BloodCompatibilityModal isOpen={compatOpen} onClose={()=>setCompatOpen(false)} bloodGroup={donorData.bloodGroup||'O+'}/>
      <HealthTipsSection isOpen={healthTipsOpen} onClose={()=>setHealthTipsOpen(false)}/>
      <ShareCardModal isOpen={shareOpen} onClose={()=>setShareOpen(false)} donorData={donorData}/>
      <HistoryQRModal isOpen={historyQROpen} onClose={()=>setHistoryQROpen(false)} data={selectedHistoryQR}/>

      {/* Printable slip */}
      <PrintableDonation donation={donationToPrint} donorData={donorData}/>

    </div>
  );
}

export default DonorDashboard;
