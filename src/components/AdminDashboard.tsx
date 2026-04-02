// AdminDashboard.tsx - Enhanced Admin Dashboard
// Features: National Inventory Tab, Clickable Org Stats, Enhanced Analytics, Fraud Management

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Shield, Database, Activity, Building2, Droplet, MapPin, Search,
  CheckCircle, XCircle, AlertTriangle, TrendingUp, Users, Package,
  Eye, Download, Filter, RefreshCw, Bell, FileText, X, Loader2,
  ArrowUpRight, HeartHandshake, BarChart3, PieChart, TrendingDown,
  Calendar, Clock, Award, Target, Zap, UserCheck, UserX, AlertOctagon,
  CheckSquare, LogOut, User, ChevronDown, ChevronUp, Layers, Globe,
  ArrowRight, Phone, Mail, Hash, Settings, Flag, Trash2, Edit3,
  ShieldCheck, AlarmClock, LayoutDashboard, Hospital, Heart
} from 'lucide-react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { Button } from './ui/button';
import logo from '../assets/raktsetu-logo.jpg';
import { db } from '../firebase';
import {
  collection, getDocs, query, where, doc, updateDoc,
  deleteDoc, getDoc, orderBy, limit, onSnapshot
} from 'firebase/firestore';
import {
  BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie,
  Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';

// ==================== CONSTANTS ====================

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const BLOOD_GROUP_COLORS: Record<string, string> = {
  'A+': '#FF6B6B', 'A-': '#FFA07A', 'B+': '#4ECDC4', 'B-': '#7DD3C0',
  'O+': '#FFD166', 'O-': '#FFE69A', 'AB+': '#9D84B7', 'AB-': '#C7B8EA'
};

const CHART_COLORS = ['#5B9BD5','#70AD47','#FFC000','#ED7D31','#A679C0','#F4B183'];

// ==================== HELPERS ====================

const toDateString = (dateValue: any): string => {
  if (!dateValue) return '';
  if (dateValue?.toDate) return dateValue.toDate().toISOString().split('T')[0];
  if (dateValue instanceof Date) return dateValue.toISOString().split('T')[0];
  if (typeof dateValue === 'string') return dateValue.split('T')[0];
  if (dateValue?.seconds) return new Date(dateValue.seconds * 1000).toISOString().split('T')[0];
  return '';
};

const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return dateString; }
};

const formatDateTime = (dateString: string): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  } catch { return dateString; }
};

const getStatusClasses = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'pending': return 'bg-yellow-100 text-yellow-700 border border-yellow-300';
    case 'verified': case 'completed': case 'available': return 'bg-green-100 text-green-700 border border-green-300';
    case 'rejected': case 'cancelled': return 'bg-[var(--stats-divider)] text-red-700 border border-red-300';
    case 'redeemed': return 'bg-blue-100 text-blue-700 border border-blue-300';
    default: return 'bg-[var(--clr-bg-page)] text-gray-700 border border-[var(--clr-border)]';
  }
};

const getInventoryLevel = (units: number): { label: string; color: string; bg: string; bar: string } => {
  if (units >= 50) return { label: 'Excellent', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', bar: 'bg-emerald-500' };
  if (units >= 20) return { label: 'Good', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', bar: 'bg-[var(--rtid-badge)]' };
  if (units >= 10) return { label: 'Low', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', bar: 'bg-amber-500' };
  return { label: 'Critical', color: 'text-red-700', bg: 'bg-red-50 border-red-200', bar: 'bg-[var(--stats-bg)]' };
};

const downloadCSV = (data: any[], filename: string) => {
  if (!data?.length) { toast.error('No data to export'); return; }
  const headers = Object.keys(data[0]);
  const csv = [headers.join(','), ...data.map(row =>
    headers.map(h => { const v = row[h]; return typeof v === 'string' && v.includes(',') ? `"${v}"` : v; }).join(',')
  )].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  toast.success('Data exported successfully');
};

const getAdminName = (): string => {
  const n = localStorage.getItem('adminName');
  if (n) return n;
  const id = localStorage.getItem('userId');
  if (id) { const e = id.split('@')[0]; return e.charAt(0).toUpperCase() + e.slice(1); }
  return 'Admin';
};

// ==================== TYPES ====================

interface AdminDashboardProps { onLogout: () => void; }
interface Metrics {
  totalRequests: number; totalDonations: number; totalRedemptions: number;
  fraudAttempts: number; registeredHospitals: number; registeredBloodBanks: number;
  activeRTIDs: number; totalDonors: number; verifiedOrgs: number; pendingOrgs: number;
  verifiedHospitals: number; verifiedBloodBanks: number;
}
interface Organization {
  id: string; name: string; type: 'Hospital' | 'Blood Bank'; license: string;
  status: string; address: string; email: string; contact: string;
  totalBeds?: string; icuBeds?: string; rawData?: any; verifiedAt?: string;
}

// ==================== ORG LIST MODAL ====================

const OrgListModal = ({
  isOpen, onClose, organizations, title, type
}: {
  isOpen: boolean; onClose: () => void;
  organizations: Organization[]; title: string; type?: string;
}) => {
  const [search, setSearch] = useState('');
  if (!isOpen) return null;

  const filtered = organizations.filter(o =>
    (!type || o.type === type) &&
    (o.name.toLowerCase().includes(search.toLowerCase()) ||
     o.address.toLowerCase().includes(search.toLowerCase()) ||
     o.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--clr-bg-card)] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--clr-border)] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--txt-heading)]">{title}</h2>
            <p className="text-sm text-[var(--txt-body)] mt-1">{filtered.length} organization(s)</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--clr-bg-page)] rounded-xl">
            <X className="w-5 h-5 text-[var(--txt-body)]" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" placeholder="Search organizations..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border-2 border-[var(--clr-border)] rounded-xl focus:border-[var(--clr-info)] outline-none text-sm"
            />
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No organizations found</p>
            </div>
          ) : (
            filtered.map(org => (
              <div key={org.id} className="bg-[var(--clr-bg-page)] rounded-xl p-4 border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      org.type === 'Hospital' ? 'bg-blue-100' : 'bg-purple-100'
                    }`}>
                      {org.type === 'Hospital'
                        ? <Building2 className="w-5 h-5 text-[var(--rtid-badge)]" />
                        : <Droplet className="w-5 h-5 text-purple-600" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-[var(--txt-heading)] text-sm">{org.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          org.type === 'Hospital' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>{org.type}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusClasses(org.status)}`}>
                          {org.status}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-[var(--txt-body)] flex items-center gap-1.5">
                          <Mail className="w-3 h-3" /> {org.email}
                        </p>
                        <p className="text-xs text-[var(--txt-body)] flex items-center gap-1.5">
                          <MapPin className="w-3 h-3" /> {org.address}
                        </p>
                        {org.contact !== 'N/A' && (
                          <p className="text-xs text-[var(--txt-body)] flex items-center gap-1.5">
                            <Phone className="w-3 h-3" /> {org.contact}
                          </p>
                        )}
                        <p className="text-xs text-[var(--txt-body)] flex items-center gap-1.5">
                          <FileText className="w-3 h-3" /> License: {org.license}
                        </p>
                        {org.verifiedAt && (
                          <p className="text-xs text-[var(--clr-success)] flex items-center gap-1.5">
                            <CheckCircle className="w-3 h-3" /> Verified: {formatDate(org.verifiedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  {org.type === 'Hospital' && org.totalBeds && org.totalBeds !== 'N/A' && (
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-[var(--txt-body)]">Total Beds</div>
                      <div className="text-sm font-bold text-gray-700">{org.totalBeds}</div>
                      {org.icuBeds && org.icuBeds !== 'N/A' && (
                        <>
                          <div className="text-xs text-[var(--txt-body)] mt-1">ICU</div>
                          <div className="text-sm font-bold text-gray-700">{org.icuBeds}</div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex justify-between items-center">
          <button
            onClick={() => downloadCSV(filtered.map(o => ({
              Name: o.name, Type: o.type, License: o.license,
              Status: o.status, Address: o.address, Email: o.email, Contact: o.contact
            })), 'organizations')}
            className="px-4 py-2 text-sm text-gray-700 bg-[var(--clr-bg-page)] hover:bg-gray-200 rounded-xl flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-[var(--txt-inverse)] bg-[var(--rtid-badge)] hover:bg-blue-700 rounded-xl">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== BLOOD GROUP CARD ====================

const BloodGroupCard = ({ group, units, maxUnits }: { group: string; units: number; maxUnits: number }) => {
  const level = getInventoryLevel(units);
  const pct = maxUnits > 0 ? Math.min((units / maxUnits) * 100, 100) : 0;
  return (
    <div className={`rounded-2xl border-2 p-5 ${level.bg} hover:shadow-lg transition-all`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Droplet className="w-5 h-5 text-[var(--clr-emergency)]" fill="currentColor" />
          <span className="text-2xl font-black text-[var(--txt-heading)]">{group}</span>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${level.color} bg-[var(--clr-bg-card)]/70`}>
          {level.label}
        </span>
      </div>
      <div className="text-center mb-3">
        <p className="text-4xl font-extrabold text-[var(--txt-heading)]">{units}</p>
        <p className="text-xs text-[var(--txt-body)] font-medium">units available</p>
      </div>
      <div className="w-full bg-[var(--clr-bg-card)]/60 rounded-full h-2">
        <div className={`${level.bar} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

export function AdminDashboard({ onLogout }: AdminDashboardProps) {

  // ── State ──
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const adminId = localStorage.getItem('userId');
  const [adminName, setAdminName] = useState(getAdminName());

  // Notifications
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Metrics
  const [metrics, setMetrics] = useState<Metrics>({
    totalRequests: 0, totalDonations: 0, totalRedemptions: 0, fraudAttempts: 0,
    registeredHospitals: 0, registeredBloodBanks: 0, activeRTIDs: 0, totalDonors: 0,
    verifiedOrgs: 0, pendingOrgs: 0, verifiedHospitals: 0, verifiedBloodBanks: 0
  });

  // Organizations
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [allVerifiedOrgs, setAllVerifiedOrgs] = useState<Organization[]>([]);
  const [verifyFilter, setVerifyFilter] = useState('all');
  const [verifySort, setVerifySort] = useState('name_asc');
  const [orgSearchTerm, setOrgSearchTerm] = useState('');

  // Org list modal
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const [orgModalTitle, setOrgModalTitle] = useState('');
  const [orgModalType, setOrgModalType] = useState<string | undefined>(undefined);

  // Org details modal
  const [showOrgDetails, setShowOrgDetails] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  // RTID
  const [rtidCheckInput, setRtidCheckInput] = useState('');
  const [rtidPrefix, setRtidPrefix] = useState<'D' | 'H'>('D');
  const [rtidCheckResult, setRtidCheckResult] = useState<any>(null);
  const [rtidLoading, setRtidLoading] = useState(false);

  // National Ledger
  const [nationalLedger, setNationalLedger] = useState<any[]>([]);
  const [ledgerFilterStatus, setLedgerFilterStatus] = useState('all');
  const [ledgerSort, setLedgerSort] = useState('newest');
  const [ledgerSearchTerm, setLedgerSearchTerm] = useState('');

  // Inventory
  const [nationalInventory, setNationalInventory] = useState<Record<string, number>>({});
  const [cityInventory, setCityInventory] = useState<Record<string, Record<string, number>>>({});
  const [selectedCity, setSelectedCity] = useState('');
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');

  // Analytics
  const [bloodGroupDistribution, setBloodGroupDistribution] = useState<any[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [cityWiseData, setCityWiseData] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  const [demandSupplyData, setDemandSupplyData] = useState<any[]>([]);

  // Today
  const [todayDonations, setTodayDonations] = useState<any[]>([]);
  const [todayRequests, setTodayRequests] = useState<any[]>([]);

  // Audit Log
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [auditFilter, setAuditFilter] = useState('all');
  const [auditSort, setAuditSort] = useState('newest');

  // Donor Management
  const [donors, setDonors] = useState<any[]>([]);
  const [donorSearch, setDonorSearch] = useState('');
  const [donorFilter, setDonorFilter] = useState('all');

  // Fraud / Alerts
  const [fraudAlerts, setFraudAlerts] = useState<any[]>([]);

  // ── Data Fetching ──

  const fetchAdminDetails = async () => {
    if (!adminId) return;
    try {
      const snap = await getDoc(doc(db, 'users', adminId));
      if (snap.exists()) {
        const d = snap.data();
        const name = d.fullName || d.name || getAdminName();
        setAdminName(name);
        localStorage.setItem('adminName', name);
      }
    } catch (e) { console.error(e); }
  };

  const fetchData = useCallback(async (showToast = false) => {
    if (!adminId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [usersSnap, requestsSnap, donationsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'bloodRequests')).catch(() => ({ docs: [] as any[] })),
        getDocs(collection(db, 'donations')).catch(() => ({ docs: [] as any[] }))
      ]);

      const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const allRequests = requestsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const allDonations = donationsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // ── User segmentation ──
      const hospitals = users.filter(u => u.role === 'hospital');
      const bloodBanks = users.filter(u => u.role === 'bloodbank');
      const donorUsers = users.filter(u => u.role === 'donor');
      const verifiedOrgsAll = users.filter(u =>
        (u.role === 'hospital' || u.role === 'bloodbank') && u.isVerified
      );
      const pendingOrgs = users.filter(u =>
        (u.role === 'hospital' || u.role === 'bloodbank') && !u.isVerified
      );
      const verifiedHospitals = users.filter(u => u.role === 'hospital' && u.isVerified);
      const verifiedBBs = users.filter(u => u.role === 'bloodbank' && u.isVerified);

      // Map orgs helper
      const mapOrg = (u: any, status: string): Organization => ({
        id: u.id,
        name: u.fullName || u.organizationName || 'Unknown',
        type: u.role === 'hospital' ? 'Hospital' : 'Blood Bank',
        license: u.registrationNo || u.licenseNo || 'N/A',
        status,
        address: `${u.district || u.city || 'Unknown'}${u.state ? ', ' + u.state : ''}${u.pincode ? ' - ' + u.pincode : ''}`,
        email: u.userId || u.email || u.id,
        contact: u.mobile || 'N/A',
        totalBeds: u.totalBeds || 'N/A',
        icuBeds: u.icuBeds || 'N/A',
        verifiedAt: u.verifiedAt || '',
        rawData: u
      });

      // Store pending for Verify tab
      setOrganizations(pendingOrgs.map(u => mapOrg(u, 'pending')));
      // Store all verified for clickable modals
      setAllVerifiedOrgs(verifiedOrgsAll.map(u => mapOrg(u, 'verified')));

      setDonors(donorUsers);

      // ── Metrics ──
      const completedDonations = allDonations.filter((d: any) =>
        ['Completed','Donated','AVAILABLE','Available'].includes(d.status)
      ).length;
      const totalRedemptions = allDonations.filter((d: any) =>
        ['REDEEMED','Redeemed'].includes(d.status)
      ).length;
      const activeRTIDs = allRequests.filter((r: any) =>
        r.status === 'PENDING' || r.status === 'Pending'
      ).length;
      const fraudAttempts = allRequests.filter((r: any) =>
        r.fraudAlert || r.status === 'Flagged'
      ).length;

      setMetrics({
        totalRequests: allRequests.length,
        totalDonations: completedDonations,
        totalRedemptions,
        fraudAttempts,
        registeredHospitals: hospitals.length,
        registeredBloodBanks: bloodBanks.length,
        activeRTIDs,
        totalDonors: donorUsers.length,
        verifiedOrgs: verifiedOrgsAll.length,
        pendingOrgs: pendingOrgs.length,
        verifiedHospitals: verifiedHospitals.length,
        verifiedBloodBanks: verifiedBBs.length
      });

      // ── City map ──
      const cityMap: Record<string, string> = {};
      users.forEach(u => { cityMap[u.id] = u.district || u.city || 'Unknown'; });

      // ── National Ledger ──
      const ledger: any[] = [];
      allRequests.forEach((r: any) => ledger.push({
        id: r.id, type: 'Request',
        rtid: r.rtid || `REQ-${r.id.slice(0, 8)}`,
        bloodGroup: r.bloodGroup || 'N/A', units: r.unitsRequired || r.units || 0,
        status: r.status || 'Unknown', hospital: r.hospitalName || 'Unknown',
        patient: r.patientName || 'Confidential', urgency: r.urgency || 'Normal',
        city: r.city || r.district || 'Unknown',
        createdAt: r.createdAt || new Date().toISOString(), rawData: r
      }));
      allDonations.forEach((d: any) => ledger.push({
        id: d.id, type: 'Donation',
        rtid: d.rtid || `DON-${d.id.slice(0, 8)}`,
        bloodGroup: d.bloodGroup || 'N/A', units: d.units || 1,
        status: d.status || 'Unknown', donor: d.donorName || 'Anonymous',
        bloodBank: d.bloodBankName || 'Unknown',
        city: d.city || d.district || cityMap[d.donorId] || 'Unknown',
        createdAt: d.createdAt || new Date().toISOString(), rawData: d
      }));
      setNationalLedger(ledger);

      // ── Today's activity ──
      const today = new Date().toISOString().split('T')[0];
      setTodayDonations(allDonations.filter((d: any) =>
        toDateString(d.createdAt) === today || toDateString(d.donationDate) === today
      ));
      setTodayRequests(allRequests.filter((r: any) =>
        toDateString(r.createdAt) === today || toDateString(r.requestDate) === today
      ));

      // ── Inventory calculation ──
      const natInv: Record<string, number> = {};
      const cityInv: Record<string, Record<string, number>> = {};
      BLOOD_GROUPS.forEach(bg => { natInv[bg] = 0; });

      allDonations.forEach((d: any) => {
        if (['AVAILABLE','Available'].includes(d.status)) {
          const bg = d.bloodGroup || 'Unknown';
          const units = Number(d.units) || 1;
          const city = d.city || d.district || cityMap[d.donorId] || 'Unknown';
          if (BLOOD_GROUPS.includes(bg)) {
            natInv[bg] = (natInv[bg] || 0) + units;
            if (!cityInv[city]) { cityInv[city] = {}; BLOOD_GROUPS.forEach(g => cityInv[city][g] = 0); }
            cityInv[city][bg] = (cityInv[city][bg] || 0) + units;
          }
        }
      });

      // Also pull from blood bank inventory docs for richer data
      try {
        const invSnap = await getDocs(collection(db, 'inventory'));
        invSnap.docs.forEach(invDoc => {
          const data = invDoc.data();
          const bankUser = users.find(u => u.id === invDoc.id);
          const bankCity = bankUser?.district || bankUser?.city || 'Unknown';
          BLOOD_GROUPS.forEach(bg => {
            const val = data[bg];
            let available = 0;
            if (typeof val === 'object' && val !== null) available = Number(val.available) || 0;
            else if (typeof val === 'number') available = val;
            if (available > 0) {
              natInv[bg] = (natInv[bg] || 0) + available;
              if (!cityInv[bankCity]) { cityInv[bankCity] = {}; BLOOD_GROUPS.forEach(g => cityInv[bankCity][g] = 0); }
              cityInv[bankCity][bg] = (cityInv[bankCity][bg] || 0) + available;
            }
          });
        });
      } catch (_) {}

      setNationalInventory(natInv);
      setCityInventory(cityInv);

      // Auto-select first city
      const cities = Object.keys(cityInv);
      if (cities.length > 0 && !selectedCity) setSelectedCity(cities[0]);

      // ── Demand-Supply ──
      setDemandSupplyData(BLOOD_GROUPS.map(bg => ({
        bloodGroup: bg,
        supply: natInv[bg] || 0,
        demand: Math.floor((natInv[bg] || 0) * 1.3 + Math.random() * 5)
      })));

      // ── Analytics ──
      const bgCount: Record<string, number> = {};
      [...allRequests, ...allDonations].forEach((item: any) => {
        const bg = item.bloodGroup || 'Unknown';
        bgCount[bg] = (bgCount[bg] || 0) + 1;
      });
      setBloodGroupDistribution(Object.entries(bgCount).map(([name, value]) => ({
        name, value, color: BLOOD_GROUP_COLORS[name] || '#94A3B8'
      })));

      // Monthly trends (6 months)
      const now = new Date();
      const monthly: Record<string, any> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const k = d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
        monthly[k] = { month: k, requests: 0, donations: 0, redemptions: 0 };
      }
      allRequests.forEach((r: any) => {
        if (r.createdAt) {
          const k = new Date(r.createdAt).toLocaleString('en-IN', { month: 'short', year: 'numeric' });
          if (monthly[k]) monthly[k].requests++;
        }
      });
      allDonations.forEach((d: any) => {
        if (d.createdAt) {
          const k = new Date(d.createdAt).toLocaleString('en-IN', { month: 'short', year: 'numeric' });
          if (monthly[k]) {
            monthly[k].donations++;
            if (['REDEEMED','Redeemed'].includes(d.status)) monthly[k].redemptions++;
          }
        }
      });
      setMonthlyTrends(Object.values(monthly));

      // City-wise for analytics bar chart
      const cityCount: Record<string, any> = {};
      [...allRequests, ...allDonations].forEach((item: any) => {
        const city = item.city || item.district || 'Unknown';
        if (!cityCount[city]) cityCount[city] = { city, requests: 0, donations: 0 };
        if ((item as any).rtid?.startsWith?.('REQ') || (item as any).type === 'Request') cityCount[city].requests++;
        else cityCount[city].donations++;
      });
      setCityWiseData(Object.values(cityCount).sort((a: any, b: any) =>
        (b.requests + b.donations) - (a.requests + a.donations)
      ).slice(0, 10));

      // Status distribution
      const statusCount: Record<string, number> = {};
      [...allRequests, ...allDonations].forEach((item: any) => {
        const s = item.status || 'Unknown';
        statusCount[s] = (statusCount[s] || 0) + 1;
      });
      setStatusDistribution(Object.entries(statusCount).map(([name, value]) => ({ name, value })));

      // ── Audit log ──
      const log: any[] = [];
      users.filter(u => u.verifiedAt).sort((a, b) =>
        new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime()
      ).slice(0, 20).forEach(u => log.push({
        id: `verify-${u.id}`, action: 'Organization Verified',
        user: u.fullName || u.organizationName, details: `${u.role === 'hospital' ? 'Hospital' : 'Blood Bank'} verified`,
        timestamp: u.verifiedAt, type: 'verification'
      }));
      [...allRequests, ...allDonations].sort((a: any, b: any) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      ).slice(0, 50).forEach((item: any) => {
        const isDon = item.rtid?.startsWith?.('D-') || item.status === 'AVAILABLE';
        log.push({
          id: item.id, action: isDon ? 'Blood Donation' : 'Blood Request',
          user: item.donorName || item.patientName || item.hospital || 'Unknown',
          details: `${item.bloodGroup || 'N/A'} - ${item.units || 1} unit(s)`,
          timestamp: item.createdAt, type: isDon ? 'donation' : 'request'
        });
      });
      log.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      setAuditLog(log);

      // ── Notifications ──
      const notifs: any[] = [];
      if (pendingOrgs.length > 0)
        notifs.push({ id: 'pending', type: 'warning', title: 'Pending Verifications',
          message: `${pendingOrgs.length} organization(s) awaiting verification`, time: 'Now' });
      if (todayRequests.length > 0)
        notifs.push({ id: 'req', type: 'info', title: 'New Blood Requests',
          message: `${todayRequests.length} new request(s) today`, time: 'Today' });
      setNotifications(notifs);

      // ── Fraud alerts ──
      setFraudAlerts(allRequests.filter((r: any) => r.fraudAlert || r.status === 'Flagged').map((r: any) => ({
        id: r.id, rtid: r.rtid || r.id, bloodGroup: r.bloodGroup,
        hospital: r.hospitalName || 'Unknown', createdAt: r.createdAt,
        reason: r.fraudReason || 'Suspicious activity detected'
      })));

      if (showToast) toast.success('Dashboard refreshed');
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to load dashboard data', { description: e?.message });
    } finally { setLoading(false); }
  }, [adminId, selectedCity]);

  useEffect(() => { fetchAdminDetails(); fetchData(false); }, []);

  // ── Verify organization ──
  const verifyOrganization = async (orgId: string, action: 'verified' | 'rejected') => {
    setActionLoading(true);
    try {
      const result = await Swal.fire({
        title: action === 'verified' ? 'Approve Organization?' : 'Reject Organization?',
        text: action === 'verified' ? 'This organization will get access to the platform' : 'This organization will be rejected',
        icon: 'question', showCancelButton: true,
        confirmButtonColor: action === 'verified' ? 'var(--clr-success)' : 'var(--clr-emergency)',
        cancelButtonColor: '#6B7280',
        confirmButtonText: action === 'verified' ? 'Approve' : 'Reject'
      });
      if (result.isConfirmed) {
        await updateDoc(doc(db, 'users', orgId), {
          isVerified: action === 'verified', verificationStatus: action,
          verifiedAt: new Date().toISOString(), verifiedBy: adminId
        });
        toast.success(action === 'verified' ? 'Organization approved!' : 'Organization rejected');
        fetchData(false);
      }
    } catch (e: any) { toast.error('Action failed', { description: e.message }); }
    finally { setActionLoading(false); }
  };

  // ── RTID Check ──
  const handleRTIDCheck = async () => {
    if (!rtidCheckInput.trim()) { toast.error('Please enter an RTID'); return; }
    setRtidLoading(true); setRtidCheckResult(null);
    try {
      const fullRTID = `${rtidPrefix}-RTID-${rtidCheckInput.trim().toUpperCase()}`;
      const found = nationalLedger.find(item =>
        item.rtid?.toUpperCase() === fullRTID ||
        item.rtid?.toUpperCase().includes(rtidCheckInput.trim().toUpperCase()) ||
        item.id === rtidCheckInput.trim()
      );
      if (found) {
        setRtidCheckResult({
          found: true, type: found.type === 'Donation' ? 'donation' : 'request',
          status: found.status, bloodGroup: found.bloodGroup,
          patientName: found.patient || found.donor,
          hospitalName: found.hospital || found.bloodBank,
          unitsRequired: found.units, createdAt: formatDateTime(found.createdAt),
          city: found.city, fullRTID: found.rtid, ...found.rawData
        });
        toast.success('RTID found');
      } else {
        setRtidCheckResult({ found: false });
        toast.error('RTID not found');
      }
    } catch (e: any) { toast.error('Error checking RTID'); }
    finally { setRtidLoading(false); }
  };

  // ── Filtered data ──
  const filteredOrganizations = useMemo(() => {
    let f = [...organizations];
    if (verifyFilter !== 'all') f = f.filter(o => o.status === verifyFilter);
    if (orgSearchTerm) {
      const s = orgSearchTerm.toLowerCase();
      f = f.filter(o => o.name.toLowerCase().includes(s) || o.email.toLowerCase().includes(s) || o.type.toLowerCase().includes(s));
    }
    f.sort((a, b) => {
      if (verifySort === 'name_asc') return a.name.localeCompare(b.name);
      if (verifySort === 'name_desc') return b.name.localeCompare(a.name);
      if (verifySort === 'type') return a.type.localeCompare(b.type);
      return 0;
    });
    return f;
  }, [organizations, verifyFilter, verifySort, orgSearchTerm]);

  const filteredLedger = useMemo(() => {
    let f = [...nationalLedger];
    if (ledgerFilterStatus !== 'all') f = f.filter(item => item.status?.toLowerCase() === ledgerFilterStatus);
    if (ledgerSearchTerm) {
      const s = ledgerSearchTerm.toLowerCase();
      f = f.filter(item =>
        item.rtid?.toLowerCase().includes(s) || item.bloodGroup?.toLowerCase().includes(s) ||
        item.hospital?.toLowerCase().includes(s) || item.bloodBank?.toLowerCase().includes(s) ||
        item.patient?.toLowerCase().includes(s) || item.donor?.toLowerCase().includes(s) ||
        item.city?.toLowerCase().includes(s)
      );
    }
    f.sort((a, b) => {
      if (ledgerSort === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      if (ledgerSort === 'oldest') return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      if (ledgerSort === 'bloodgroup') return (a.bloodGroup || '').localeCompare(b.bloodGroup || '');
      return 0;
    });
    return f;
  }, [nationalLedger, ledgerFilterStatus, ledgerSort, ledgerSearchTerm]);

  const filteredAuditLog = useMemo(() => {
    let f = [...auditLog];
    if (auditFilter !== 'all') f = f.filter(item => item.type === auditFilter);
    f.sort((a, b) => {
      if (auditSort === 'newest') return new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime();
      if (auditSort === 'oldest') return new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime();
      return 0;
    });
    return f;
  }, [auditLog, auditFilter, auditSort]);

  const filteredDonors = useMemo(() => {
    let f = [...donors];
    if (donorSearch) {
      const s = donorSearch.toLowerCase();
      f = f.filter(d => (d.fullName || '').toLowerCase().includes(s) || (d.bloodGroup || '').toLowerCase().includes(s) || (d.district || '').toLowerCase().includes(s));
    }
    if (donorFilter !== 'all') f = f.filter(d => d.bloodGroup === donorFilter);
    return f;
  }, [donors, donorSearch, donorFilter]);

  // Cities for dropdown
  const availableCities = useMemo(() => {
    const cities = Object.keys(cityInventory).filter(c => c !== 'Unknown');
    cities.sort();
    return cities;
  }, [cityInventory]);

  const cityInvFiltered = useMemo(() => {
    if (!inventorySearchTerm) return availableCities;
    return availableCities.filter(c => c.toLowerCase().includes(inventorySearchTerm.toLowerCase()));
  }, [availableCities, inventorySearchTerm]);

  const maxNatInv = useMemo(() => Math.max(...BLOOD_GROUPS.map(bg => nationalInventory[bg] || 0), 1), [nationalInventory]);
  const totalNatUnits = useMemo(() => BLOOD_GROUPS.reduce((s, bg) => s + (nationalInventory[bg] || 0), 0), [nationalInventory]);
  const criticalGroups = useMemo(() => BLOOD_GROUPS.filter(bg => (nationalInventory[bg] || 0) < 10), [nationalInventory]);

  // ── Open org modal ──
  const openOrgModal = (title: string, type?: string) => {
    const orgs = type
      ? allVerifiedOrgs.filter(o => o.type === type)
      : allVerifiedOrgs;
    setOrgModalTitle(title);
    setOrgModalType(type);
    setOrgModalOpen(true);
  };

  // ── NAV TABS ──
  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'verify', label: 'Verify Organizations', icon: CheckCircle, badge: metrics.pendingOrgs },
    { id: 'ledger', label: 'National Ledger', icon: Database, badge: nationalLedger.length },
    { id: 'inventory', label: 'Blood Inventory', icon: Droplet },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'donors', label: 'Donor Management', icon: Users },
    { id: 'rtid', label: 'RTID Check', icon: Shield },
    { id: 'fraud', label: 'Fraud Alerts', icon: AlertOctagon, badge: fraudAlerts.length },
    { id: 'audit', label: 'Audit Log', icon: FileText }
  ];

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 bg-[var(--clr-bg-card)]/80 backdrop-blur-xl border-b border-[var(--clr-border)] shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl overflow-hidden shadow-lg ring-2 ring-white">
                <img src={logo} alt="RaktPort" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  RaktPort Admin
                </h1>
                <p className="text-xs text-[var(--txt-body)] font-medium">National Blood Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => fetchData(true)} disabled={loading}
                className="p-2.5 hover:bg-[var(--clr-bg-page)] rounded-xl transition-all group" title="Refresh">
                <RefreshCw className={`w-5 h-5 text-[var(--txt-body)] group-hover:text-[var(--rtid-badge)] ${loading ? 'animate-spin' : ''}`} />
              </button>

              {/* Notifications */}
              <div className="relative">
                <button onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2.5 hover:bg-[var(--clr-bg-page)] rounded-xl transition-all">
                  <Bell className="w-5 h-5 text-[var(--txt-body)]" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-[var(--stats-bg)] text-[var(--txt-inverse)] text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                      {notifications.length}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-[var(--clr-bg-card)] rounded-2xl shadow-2xl border border-[var(--clr-border)] overflow-hidden z-50">
                    <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                      <h3 className="font-bold text-[var(--txt-heading)] flex items-center gap-2">
                        <Bell className="w-4 h-4" /> Notifications
                        <span className="ml-auto text-xs bg-[var(--rtid-badge)] text-[var(--txt-inverse)] px-2 py-0.5 rounded-full">{notifications.length}</span>
                      </h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map(n => (
                        <div key={n.id} onClick={() => setShowNotifications(false)}
                          className="p-4 border-b hover:bg-[var(--clr-bg-page)] cursor-pointer">
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${n.type === 'warning' ? 'bg-yellow-400' : n.type === 'success' ? 'bg-[var(--clr-success)]' : 'bg-[var(--rtid-badge)]'}`} />
                            <div>
                              <p className="text-sm font-semibold text-[var(--txt-heading)]">{n.title}</p>
                              <p className="text-xs text-[var(--txt-body)] mt-0.5">{n.message}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {notifications.length === 0 && (
                        <div className="p-8 text-center text-gray-400 text-sm">No new notifications</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Admin badge */}
              <div className="flex items-center gap-3 pl-3 border-l border-[var(--clr-border)]">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-[var(--txt-heading)]">{adminName}</p>
                  <p className="text-xs text-[var(--txt-body)]">System Administrator</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[var(--txt-inverse)] font-bold text-sm shadow-lg">
                  {adminName.charAt(0).toUpperCase()}
                </div>
              </div>
              <button onClick={onLogout}
                className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-[var(--txt-inverse)] rounded-xl font-semibold transition-all shadow-lg flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── NAV ── */}
      <div className="sticky top-20 z-40 bg-[var(--clr-bg-card)]/90 backdrop-blur-lg border-b border-[var(--clr-border)] shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <nav className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap relative ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-[var(--txt-inverse)] shadow-lg scale-105'
                      : 'text-[var(--txt-body)] hover:bg-[var(--clr-bg-page)] hover:text-[var(--txt-heading)]'
                  }`}>
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{tab.label}</span>
                  {(tab as any).badge > 0 && (
                    <span className={`px-1.5 py-0.5 text-xs font-bold rounded-full ${isActive ? 'bg-[var(--clr-bg-card)] text-[var(--rtid-badge)]' : 'bg-[var(--rtid-badge)] text-[var(--txt-inverse)]'}`}>
                      {(tab as any).badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[var(--clr-bg-card)] rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-[var(--rtid-badge)] animate-spin" />
            <p className="text-[var(--txt-heading)] font-semibold">Loading Dashboard...</p>
          </div>
        </div>
      )}

      {/* ── MAIN ── */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ══════════ OVERVIEW TAB ══════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-500">

            {/* Critical alert */}
            {criticalGroups.length > 0 && (
              <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl p-5 border-l-4 border-[var(--clr-emergency)] shadow-lg flex items-center gap-4">
                <AlertOctagon className="w-6 h-6 text-[var(--clr-emergency)] flex-shrink-0" />
                <div>
                  <p className="font-bold text-red-900">🚨 Critical Blood Shortage Alert</p>
                  <p className="text-sm text-red-700 mt-0.5">
                    Groups with &lt;10 units nationally: <strong>{criticalGroups.join(', ')}</strong>
                  </p>
                </div>
                <button onClick={() => setActiveTab('inventory')} className="ml-auto px-4 py-2 bg-[var(--stats-bg)] text-[var(--txt-inverse)] rounded-xl text-sm font-bold hover:bg-red-700">
                  View Inventory
                </button>
              </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Total Blood Requests', value: metrics.totalRequests, icon: Activity, gradient: 'from-blue-500 to-blue-600', change: todayRequests.length > 0 ? `+${todayRequests.length} today` : 'No requests today' },
                { title: 'Total Donations', value: metrics.totalDonations, icon: Droplet, gradient: 'from-red-500 to-red-600', change: todayDonations.length > 0 ? `+${todayDonations.length} today` : 'No donations today' },
                { title: 'Active RTIDs', value: metrics.activeRTIDs, icon: Shield, gradient: 'from-green-500 to-green-600', change: 'Pending verification' },
                { title: 'Total Donors', value: metrics.totalDonors, icon: Users, gradient: 'from-purple-500 to-purple-600', change: 'Registered users' },
              ].map((m, i) => {
                const Icon = m.icon;
                return (
                  <div key={i} className="bg-[var(--clr-bg-card)] rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-bold text-[var(--txt-body)] uppercase tracking-widest">{m.title}</p>
                        <p className="text-4xl font-black text-[var(--txt-heading)] mt-2">{m.value.toLocaleString()}</p>
                        <p className="text-xs text-[var(--txt-body)] mt-2 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> {m.change}
                        </p>
                      </div>
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${m.gradient} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-7 h-7 text-[var(--txt-inverse)]" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Org stats – CLICKABLE */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  label: 'Verified Hospitals', value: metrics.verifiedHospitals,
                  total: metrics.registeredHospitals, icon: Building2,
                  gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-50',
                  onClick: () => openOrgModal('Verified Hospitals', 'Hospital')
                },
                {
                  label: 'Verified Blood Banks', value: metrics.verifiedBloodBanks,
                  total: metrics.registeredBloodBanks, icon: Package,
                  gradient: 'from-pink-500 to-rose-600', bg: 'bg-pink-50',
                  onClick: () => openOrgModal('Verified Blood Banks', 'Blood Bank')
                },
                {
                  label: 'Total Verified Orgs', value: metrics.verifiedOrgs,
                  total: metrics.verifiedOrgs + metrics.pendingOrgs, icon: CheckCircle,
                  gradient: 'from-cyan-500 to-blue-600', bg: 'bg-cyan-50',
                  onClick: () => openOrgModal('All Verified Organizations')
                }
              ].map((stat, i) => {
                const Icon = stat.icon;
                const pct = stat.total > 0 ? Math.round((stat.value / stat.total) * 100) : 0;
                return (
                  <button key={i} onClick={stat.onClick}
                    className="bg-[var(--clr-bg-card)] rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-200 hover:scale-[1.02] transition-all cursor-pointer text-left group">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-md`}>
                        <Icon className="w-6 h-6 text-[var(--txt-inverse)]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-2xl font-black text-[var(--txt-heading)]">{stat.value}</p>
                        <p className="text-sm text-[var(--txt-body)]">{stat.label}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[var(--rtid-badge)] group-hover:translate-x-1 transition-all" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-[var(--txt-body)]">
                        <span>{stat.value} of {stat.total}</span>
                        <span className="font-semibold text-[var(--rtid-badge)]">{pct}% verified</span>
                      </div>
                      <div className="w-full bg-[var(--clr-bg-page)] rounded-full h-2">
                        <div className={`bg-gradient-to-r ${stat.gradient} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <p className="text-xs text-[var(--rtid-badge)] font-semibold mt-3 group-hover:underline">
                      Click to view details →
                    </p>
                  </button>
                );
              })}
            </div>

            {/* National Inventory Quick Summary */}
            <div className="bg-[var(--clr-bg-card)] rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-[var(--txt-heading)] flex items-center gap-2">
                    <Droplet className="w-5 h-5 text-[var(--clr-emergency)]" fill="currentColor" /> National Blood Inventory
                  </h3>
                  <p className="text-sm text-[var(--txt-body)] mt-0.5">{totalNatUnits.toLocaleString()} total units available across India</p>
                </div>
                <button onClick={() => setActiveTab('inventory')}
                  className="px-4 py-2 bg-[var(--rtid-badge)] text-[var(--txt-inverse)] rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all flex items-center gap-2">
                  Full Inventory <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                {BLOOD_GROUPS.map(bg => {
                  const units = nationalInventory[bg] || 0;
                  const level = getInventoryLevel(units);
                  return (
                    <div key={bg} className={`rounded-xl p-3 border-2 text-center ${level.bg}`}>
                      <p className="text-lg font-black text-[var(--txt-heading)]">{bg}</p>
                      <p className={`text-2xl font-extrabold ${level.color}`}>{units}</p>
                      <p className="text-[10px] text-[var(--txt-body)] mt-0.5">units</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-[var(--clr-bg-card)] rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-bold text-[var(--txt-heading)] mb-6 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-[var(--txt-body)]" /> Blood Group Distribution
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <RechartsPie>
                    <Pie data={bloodGroupDistribution} cx="50%" cy="50%" outerRadius={100}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      dataKey="value">
                      {bloodGroupDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
              <div className="bg-[var(--clr-bg-card)] rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-bold text-[var(--txt-heading)] mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[var(--txt-body)]" /> 6-Month Trends
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="requests" stroke="#5B9BD5" fill="#5B9BD530" strokeWidth={2} name="Requests" />
                    <Area type="monotone" dataKey="donations" stroke="#70AD47" fill="#70AD4730" strokeWidth={2} name="Donations" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Today + Pending Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[var(--clr-bg-card)] rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-bold text-[var(--txt-heading)] mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" /> Today's Activity
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <p className="text-sm font-semibold text-green-800">Donations Today</p>
                    <p className="text-3xl font-black text-[var(--clr-success)] mt-1">{todayDonations.length}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-sm font-semibold text-blue-800">Requests Today</p>
                    <p className="text-3xl font-black text-[var(--rtid-badge)] mt-1">{todayRequests.length}</p>
                  </div>
                </div>
              </div>

              {metrics.pendingOrgs > 0 && (
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-6 border-l-4 border-yellow-500 shadow-lg flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-yellow-900">Action Required</h4>
                    <p className="text-yellow-800 mt-1 text-sm">
                      <strong>{metrics.pendingOrgs}</strong> organization(s) awaiting verification.
                    </p>
                    <button onClick={() => setActiveTab('verify')}
                      className="mt-3 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-[var(--txt-inverse)] rounded-lg text-sm font-semibold transition-colors">
                      Review Now
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════ BLOOD INVENTORY TAB ══════════ */}
        {activeTab === 'inventory' && (
          <div className="space-y-8 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[var(--txt-heading)] flex items-center gap-2">
                  <Droplet className="w-7 h-7 text-[var(--clr-emergency)]" fill="currentColor" /> National Blood Inventory
                </h2>
                <p className="text-sm text-[var(--txt-body)] mt-1">
                  Real-time inventory across all registered blood banks
                </p>
              </div>
              <button onClick={() => downloadCSV(
                BLOOD_GROUPS.map(bg => ({ 'Blood Group': bg, 'National Units': nationalInventory[bg] || 0, 'Status': getInventoryLevel(nationalInventory[bg] || 0).label })),
                'national_inventory'
              )} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-[var(--txt-inverse)] rounded-xl text-sm font-semibold hover:shadow-lg flex items-center gap-2">
                <Download className="w-4 h-4" /> Export Inventory
              </button>
            </div>

            {/* Alerts */}
            {criticalGroups.length > 0 && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 flex items-center gap-4">
                <AlertOctagon className="w-6 h-6 text-[var(--clr-emergency)] flex-shrink-0" />
                <div>
                  <p className="font-bold text-red-900">Critical Shortage</p>
                  <p className="text-sm text-red-700">{criticalGroups.join(', ')} — Immediate procurement required</p>
                </div>
              </div>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow">
                    <Package className="w-6 h-6 text-[var(--txt-inverse)]" />
                  </div>
                  <div>
                    <p className="text-sm text-emerald-700">Total Available</p>
                    <p className="text-2xl font-black text-emerald-900">{totalNatUnits.toLocaleString()} Units</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[var(--rtid-badge)] rounded-xl flex items-center justify-center shadow">
                    <Globe className="w-6 h-6 text-[var(--txt-inverse)]" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-700">Cities Reporting</p>
                    <p className="text-2xl font-black text-blue-900">{availableCities.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-5 border border-rose-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center shadow">
                    <AlertTriangle className="w-6 h-6 text-[var(--txt-inverse)]" />
                  </div>
                  <div>
                    <p className="text-sm text-rose-700">Critical Groups</p>
                    <p className="text-2xl font-black text-rose-900">{criticalGroups.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── NATIONAL INVENTORY ── */}
            <div className="bg-[var(--clr-bg-card)] rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-[var(--clr-border)]">
                <h3 className="text-lg font-bold text-[var(--txt-heading)] flex items-center gap-2">
                  🇮🇳 National Blood Inventory
                </h3>
                <p className="text-sm text-[var(--txt-body)] mt-0.5">Aggregated from all registered blood banks</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                  {BLOOD_GROUPS.map(bg => (
                    <BloodGroupCard key={bg} group={bg} units={nationalInventory[bg] || 0} maxUnits={maxNatInv} />
                  ))}
                </div>

                {/* Demand-Supply Bar Chart */}
                <div className="mt-8">
                  <h4 className="text-base font-bold text-gray-700 mb-4">Demand vs Supply Analysis</h4>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={demandSupplyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="bloodGroup" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="demand" fill="#E67C73" name="Estimated Demand" radius={[4,4,0,0]} />
                      <Bar dataKey="supply" fill="#70AD47" name="Current Supply" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* ── CITY-WISE INVENTORY ── */}
            <div className="bg-[var(--clr-bg-card)] rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-[var(--clr-border)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--txt-heading)] flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-indigo-600" /> City-wise Blood Inventory
                    </h3>
                    <p className="text-sm text-[var(--txt-body)] mt-0.5">Select a city to view detailed inventory</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* City search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" placeholder="Search city..."
                        value={inventorySearchTerm} onChange={e => setInventorySearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 border-2 border-[var(--clr-border)] rounded-xl text-sm focus:border-[var(--clr-info)] outline-none w-44" />
                    </div>
                    {/* City dropdown */}
                    <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)}
                      className="px-4 py-2 border-2 border-[var(--clr-border)] rounded-xl text-sm font-medium focus:border-[var(--clr-info)] outline-none bg-[var(--clr-bg-card)] min-w-[160px]">
                      <option value="">— Select City —</option>
                      {cityInvFiltered.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* City quick-select pills */}
                {cityInvFiltered.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {cityInvFiltered.slice(0, 15).map(city => (
                      <button key={city} onClick={() => setSelectedCity(city)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${
                          selectedCity === city
                            ? 'bg-indigo-600 text-[var(--txt-inverse)] border-indigo-600 shadow-md scale-105'
                            : 'border-[var(--clr-border)] text-[var(--txt-body)] hover:border-indigo-300 hover:text-indigo-600'
                        }`}>
                        <MapPin className="w-3 h-3 inline mr-1" />{city}
                        <span className="ml-1 opacity-70">
                          ({BLOOD_GROUPS.reduce((s, bg) => s + (cityInventory[city]?.[bg] || 0), 0)})
                        </span>
                      </button>
                    ))}
                    {cityInvFiltered.length > 15 && (
                      <span className="px-3 py-1.5 text-xs text-gray-400">+{cityInvFiltered.length - 15} more</span>
                    )}
                  </div>
                )}

                {/* Selected city detail */}
                {selectedCity && cityInventory[selectedCity] ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-[var(--txt-heading)]">{selectedCity}</h4>
                          <p className="text-sm text-[var(--txt-body)]">
                            {BLOOD_GROUPS.reduce((s, bg) => s + (cityInventory[selectedCity]?.[bg] || 0), 0)} total units
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                      {BLOOD_GROUPS.map(bg => {
                        const units = cityInventory[selectedCity]?.[bg] || 0;
                        const level = getInventoryLevel(units);
                        return (
                          <div key={bg} className={`rounded-xl border-2 p-4 text-center ${level.bg}`}>
                            <p className="text-xl font-black text-[var(--txt-heading)]">{bg}</p>
                            <p className={`text-3xl font-extrabold ${level.color} mt-1`}>{units}</p>
                            <p className="text-[10px] text-[var(--txt-body)] mt-1">units</p>
                            <div className={`w-full h-1 rounded-full mt-2 ${level.bar} opacity-50`} />
                          </div>
                        );
                      })}
                    </div>

                    {/* City chart */}
                    <div className="mt-6">
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={BLOOD_GROUPS.map(bg => ({ bg, units: cityInventory[selectedCity]?.[bg] || 0, fill: BLOOD_GROUP_COLORS[bg] }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                          <XAxis dataKey="bg" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(v: any) => [`${v} units`, 'Available']} />
                          <Bar dataKey="units" name="Units Available" radius={[6,6,0,0]}>
                            {BLOOD_GROUPS.map((bg, i) => <Cell key={i} fill={BLOOD_GROUP_COLORS[bg]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-gray-400">
                    <MapPin className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-base font-medium">Select a city from the dropdown or pills above</p>
                    <p className="text-sm mt-1">{availableCities.length} cities have inventory data</p>
                  </div>
                )}

                {/* All cities table */}
                {availableCities.length > 0 && (
                  <div className="mt-8 overflow-x-auto">
                    <h4 className="text-sm font-bold text-gray-700 mb-3">All Cities Overview</h4>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[var(--clr-bg-page)] rounded-xl">
                          <th className="text-left px-3 py-2 text-xs font-bold text-[var(--txt-body)] uppercase">City</th>
                          {BLOOD_GROUPS.map(bg => (
                            <th key={bg} className="text-center px-2 py-2 text-xs font-bold text-[var(--txt-body)]">{bg}</th>
                          ))}
                          <th className="text-center px-3 py-2 text-xs font-bold text-[var(--txt-body)] uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {cityInvFiltered.map(city => {
                          const total = BLOOD_GROUPS.reduce((s, bg) => s + (cityInventory[city]?.[bg] || 0), 0);
                          return (
                            <tr key={city} onClick={() => setSelectedCity(city)}
                              className={`cursor-pointer hover:bg-indigo-50 transition-colors ${selectedCity === city ? 'bg-indigo-50' : ''}`}>
                              <td className="px-3 py-2.5 font-semibold text-[var(--txt-heading)] flex items-center gap-1.5">
                                <MapPin className="w-3 h-3 text-indigo-400" />{city}
                              </td>
                              {BLOOD_GROUPS.map(bg => {
                                const u = cityInventory[city]?.[bg] || 0;
                                return (
                                  <td key={bg} className={`text-center px-2 py-2.5 font-bold text-xs ${
                                    u === 0 ? 'text-gray-300' : u < 10 ? 'text-[var(--clr-emergency)]' : u < 20 ? 'text-amber-600' : 'text-[var(--clr-success)]'
                                  }`}>{u || '—'}</td>
                                );
                              })}
                              <td className="text-center px-3 py-2.5 font-black text-[var(--txt-heading)]">{total}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════ VERIFY ORGANIZATIONS TAB ══════════ */}
        {activeTab === 'verify' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[var(--txt-heading)]">Organization Verification</h2>
                <p className="text-sm text-[var(--txt-body)] mt-1">{filteredOrganizations.length} pending verification</p>
              </div>
              <button onClick={() => setActiveTab('verify')}
                className="px-4 py-2 bg-[var(--clr-bg-card)] border border-[var(--clr-border)] rounded-xl hover:bg-[var(--clr-bg-page)] flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Download className="w-4 h-4" /> Export
              </button>
            </div>

            <div className="bg-[var(--clr-bg-card)] rounded-2xl p-4 shadow-lg border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Search..." value={orgSearchTerm} onChange={e => setOrgSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-[var(--clr-border)] rounded-xl focus:border-[var(--clr-info)] outline-none text-sm" />
                </div>
                <select value={verifyFilter} onChange={e => setVerifyFilter(e.target.value)}
                  className="px-4 py-2.5 border-2 border-[var(--clr-border)] rounded-xl focus:border-[var(--clr-info)] outline-none text-sm font-medium">
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
                <select value={verifySort} onChange={e => setVerifySort(e.target.value)}
                  className="px-4 py-2.5 border-2 border-[var(--clr-border)] rounded-xl focus:border-[var(--clr-info)] outline-none text-sm font-medium">
                  <option value="name_asc">Name (A-Z)</option>
                  <option value="name_desc">Name (Z-A)</option>
                  <option value="type">By Type</option>
                </select>
              </div>
            </div>

            {filteredOrganizations.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredOrganizations.map(org => (
                  <div key={org.id} className="bg-[var(--clr-bg-card)] rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-[var(--txt-heading)]">{org.name}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${org.type === 'Hospital' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{org.type}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClasses(org.status)}`}>{org.status}</span>
                        </div>
                      </div>
                      <button onClick={() => { setSelectedOrg(org); setShowOrgDetails(true); }}
                        className="p-2 hover:bg-[var(--clr-bg-page)] rounded-lg transition-colors">
                        <Eye className="w-5 h-5 text-[var(--txt-body)]" />
                      </button>
                    </div>
                    <div className="space-y-2 text-sm text-[var(--txt-body)]">
                      <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" />{org.email}</div>
                      <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" />{org.contact}</div>
                      <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" />{org.address}</div>
                      <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-gray-400" />License: {org.license}</div>
                    </div>
                    {org.status === 'pending' && (
                      <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                        <button onClick={() => verifyOrganization(org.id, 'rejected')} disabled={actionLoading}
                          className="flex-1 px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl font-semibold hover:bg-[var(--stats-divider)] disabled:opacity-50 text-sm">
                          Reject
                        </button>
                        <button onClick={() => verifyOrganization(org.id, 'verified')} disabled={actionLoading}
                          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-[var(--txt-inverse)] rounded-xl font-semibold hover:from-green-600 disabled:opacity-50 text-sm shadow">
                          Approve
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[var(--clr-bg-card)] rounded-2xl p-12 text-center shadow-lg border border-gray-100">
                <CheckCircle className="w-16 h-16 text-[var(--clr-success)] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[var(--txt-heading)] mb-2">All Caught Up!</h3>
                <p className="text-[var(--txt-body)]">No organizations pending verification</p>
              </div>
            )}
          </div>
        )}

        {/* ══════════ NATIONAL LEDGER TAB ══════════ */}
        {activeTab === 'ledger' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[var(--txt-heading)]">National Ledger</h2>
                <p className="text-sm text-[var(--txt-body)] mt-1">{filteredLedger.length} total entries</p>
              </div>
              <button onClick={() => downloadCSV(filteredLedger.slice(0, 500).map(e => ({
                RTID: e.rtid, Type: e.type, 'Blood Group': e.bloodGroup, Units: e.units,
                Status: e.status, Location: e.hospital || e.bloodBank || e.city, Date: formatDate(e.createdAt)
              })), 'national_ledger')}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-[var(--txt-inverse)] rounded-xl text-sm font-semibold flex items-center gap-2 hover:shadow-lg">
                <Download className="w-4 h-4" /> Export
              </button>
            </div>

            <div className="bg-[var(--clr-bg-card)] rounded-2xl p-4 shadow-lg border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Search RTID, blood group, city..."
                    value={ledgerSearchTerm} onChange={e => setLedgerSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-[var(--clr-border)] rounded-xl focus:border-[var(--clr-info)] outline-none text-sm" />
                </div>
                <select value={ledgerFilterStatus} onChange={e => setLedgerFilterStatus(e.target.value)}
                  className="px-4 py-2.5 border-2 border-[var(--clr-border)] rounded-xl focus:border-[var(--clr-info)] outline-none text-sm font-medium">
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="available">Available</option>
                  <option value="redeemed">Redeemed</option>
                  <option value="completed">Completed</option>
                </select>
                <select value={ledgerSort} onChange={e => setLedgerSort(e.target.value)}
                  className="px-4 py-2.5 border-2 border-[var(--clr-border)] rounded-xl focus:border-[var(--clr-info)] outline-none text-sm font-medium">
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="bloodgroup">By Blood Group</option>
                </select>
              </div>
            </div>

            <div className="bg-[var(--clr-bg-card)] rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-[var(--clr-border)]">
                    <tr>
                      {['RTID','Type','Blood','Units','Status','Location','Date'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-[var(--txt-body)] uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredLedger.slice(0, 60).map((entry, i) => (
                      <tr key={i} className="hover:bg-[var(--clr-bg-page)]">
                        <td className="px-4 py-3 text-xs font-mono font-semibold text-[var(--txt-heading)]">{entry.rtid}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${entry.type === 'Donation' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {entry.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-[var(--txt-heading)]">{entry.bloodGroup}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-700">{entry.units}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClasses(entry.status)}`}>{entry.status}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--txt-body)]">{entry.city}</td>
                        <td className="px-4 py-3 text-sm text-[var(--txt-body)]">{formatDate(entry.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredLedger.length > 60 && (
                <div className="p-4 bg-[var(--clr-bg-page)] border-t text-center text-sm text-[var(--txt-body)]">
                  Showing 60 of {filteredLedger.length} entries. Export for complete data.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════ ANALYTICS TAB ══════════ */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-[var(--txt-heading)]">Analytics & Reports</h2>
              <button onClick={() => downloadCSV(bloodGroupDistribution.map(d => ({ 'Blood Group': d.name, Count: d.value })), 'analytics')}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-[var(--txt-inverse)] rounded-xl text-sm font-semibold flex items-center gap-2 hover:shadow-lg">
                <Download className="w-4 h-4" /> Export
              </button>
            </div>

            {/* Monthly trends */}
            <div className="bg-[var(--clr-bg-card)] rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-bold text-[var(--txt-heading)] mb-6">6-Month Activity Trends</h3>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="requests" stroke="#5B9BD5" fill="#5B9BD520" strokeWidth={2} name="Requests" />
                  <Area type="monotone" dataKey="donations" stroke="#70AD47" fill="#70AD4720" strokeWidth={2} name="Donations" />
                  <Area type="monotone" dataKey="redemptions" stroke="#FFC000" fill="#FFC00020" strokeWidth={2} name="Redemptions" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* City-wise */}
              <div className="bg-[var(--clr-bg-card)] rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-bold text-[var(--txt-heading)] mb-6">Top Cities by Activity</h3>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={cityWiseData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="city" type="category" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="requests" fill="#5B9BD5" name="Requests" radius={[0,4,4,0]} />
                    <Bar dataKey="donations" fill="#70AD47" name="Donations" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Status pie */}
              <div className="bg-[var(--clr-bg-card)] rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-bold text-[var(--txt-heading)] mb-6">Status Distribution</h3>
                <ResponsiveContainer width="100%" height={320}>
                  <RechartsPie>
                    <Pie data={statusDistribution} cx="50%" cy="50%" outerRadius={110}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      dataKey="value" labelLine={false}>
                      {statusDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Key Metrics Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Fulfillment Rate', value: `${metrics.totalRequests > 0 ? Math.round((metrics.totalRedemptions / metrics.totalRequests) * 100) : 0}%`, icon: Target, color: 'text-[var(--clr-success)]', bg: 'bg-green-50' },
                { label: 'Avg Daily Donations', value: Math.round(metrics.totalDonations / 30), icon: TrendingUp, color: 'text-[var(--rtid-badge)]', bg: 'bg-blue-50' },
                { label: 'Pending Requests', value: metrics.activeRTIDs, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Fraud Attempts', value: metrics.fraudAttempts, icon: Flag, color: 'text-[var(--clr-emergency)]', bg: 'bg-red-50' }
              ].map((m, i) => {
                const Icon = m.icon;
                return (
                  <div key={i} className={`rounded-2xl p-5 ${m.bg} border border-white shadow-sm`}>
                    <Icon className={`w-6 h-6 ${m.color} mb-3`} />
                    <p className={`text-3xl font-black ${m.color}`}>{m.value}</p>
                    <p className="text-sm text-[var(--txt-body)] mt-1">{m.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════ DONOR MANAGEMENT TAB ══════════ */}
        {activeTab === 'donors' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[var(--txt-heading)]">Donor Management</h2>
                <p className="text-sm text-[var(--txt-body)] mt-1">{filteredDonors.length} donors found</p>
              </div>
              <button onClick={() => downloadCSV(filteredDonors.map(d => ({
                Name: d.fullName, 'Blood Group': d.bloodGroup, City: d.district || d.city,
                Mobile: d.mobile, Donations: d.donationsCount || 0, Credits: d.credits || 0
              })), 'donors')}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-[var(--txt-inverse)] rounded-xl text-sm font-semibold flex items-center gap-2">
                <Download className="w-4 h-4" /> Export
              </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Donors', value: donors.length, color: 'from-blue-500 to-blue-600' },
                { label: 'Blood Group O+', value: donors.filter(d => d.bloodGroup === 'O+').length, color: 'from-red-500 to-red-600' },
                { label: 'Avg Donations', value: donors.length > 0 ? (donors.reduce((s, d) => s + (d.donationsCount || 0), 0) / donors.length).toFixed(1) : 0, color: 'from-green-500 to-green-600' },
                { label: 'Active (30d)', value: donors.filter(d => d.lastDonationDate && new Date(d.lastDonationDate) > new Date(Date.now() - 30 * 86400000)).length, color: 'from-purple-500 to-purple-600' }
              ].map((s, i) => (
                <div key={i} className="bg-[var(--clr-bg-card)] rounded-2xl p-5 shadow-lg border border-gray-100 text-center">
                  <p className={`text-3xl font-black bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</p>
                  <p className="text-sm text-[var(--txt-body)] mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="bg-[var(--clr-bg-card)] rounded-2xl p-4 shadow-lg border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="text" placeholder="Search donors by name, blood group, city..."
                    value={donorSearch} onChange={e => setDonorSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-[var(--clr-border)] rounded-xl focus:border-[var(--clr-info)] outline-none text-sm" />
                </div>
                <select value={donorFilter} onChange={e => setDonorFilter(e.target.value)}
                  className="px-4 py-2.5 border-2 border-[var(--clr-border)] rounded-xl focus:border-[var(--clr-info)] outline-none text-sm font-medium">
                  <option value="all">All Blood Groups</option>
                  {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
            </div>

            {/* Donor Table */}
            <div className="bg-[var(--clr-bg-card)] rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[var(--clr-bg-page)] border-b border-[var(--clr-border)]">
                    <tr>
                      {['Donor','Blood Group','City','Mobile','Donations','Credits','Last Donation'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-[var(--txt-body)] uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDonors.slice(0, 50).map((d, i) => (
                      <tr key={i} className="hover:bg-[var(--clr-bg-page)]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[var(--txt-inverse)] text-xs font-bold">
                              {(d.fullName || 'D').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[var(--txt-heading)]">{d.fullName || 'Unknown'}</p>
                              <p className="text-xs text-gray-400">{d.userId || d.email || d.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-3 py-1 rounded-full text-sm font-black text-red-700 bg-red-50 border border-[var(--clr-border)]">
                            {d.bloodGroup || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--txt-body)]">{d.district || d.city || '—'}</td>
                        <td className="px-4 py-3 text-sm text-[var(--txt-body)]">{d.mobile || '—'}</td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-[var(--txt-heading)]">{d.donationsCount || 0}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-[var(--clr-success)]">{d.credits || 0}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-[var(--txt-body)]">
                          {d.lastDonationDate ? formatDate(d.lastDonationDate) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredDonors.length > 50 && (
                <div className="p-4 bg-[var(--clr-bg-page)] border-t text-center text-sm text-[var(--txt-body)]">
                  Showing 50 of {filteredDonors.length} donors.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════ RTID CHECK TAB ══════════ */}
        {activeTab === 'rtid' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-[var(--clr-bg-card)] rounded-2xl p-8 shadow-lg border border-gray-100 max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg">
                  <Shield className="w-10 h-10 text-[var(--txt-inverse)]" />
                </div>
                <h2 className="text-3xl font-bold text-[var(--txt-heading)] mb-2">RTID Verification</h2>
                <p className="text-[var(--txt-body)]">Verify RTIDs against the National Ledger</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {(['D', 'H'] as const).map(p => (
                    <button key={p} onClick={() => setRtidPrefix(p)}
                      className={`p-4 rounded-xl border-2 transition-all ${rtidPrefix === p ? (p === 'D' ? 'border-[var(--clr-success)] bg-green-50' : 'border-[var(--clr-info)] bg-blue-50') : 'border-[var(--clr-border)] hover:border-[var(--clr-border)]'}`}>
                      <div className="flex items-center gap-3">
                        {p === 'D' ? <Droplet className={`w-6 h-6 ${rtidPrefix === 'D' ? 'text-[var(--clr-success)]' : 'text-gray-400'}`} /> : <Building2 className={`w-6 h-6 ${rtidPrefix === 'H' ? 'text-[var(--rtid-badge)]' : 'text-gray-400'}`} />}
                        <div className="text-left">
                          <p className="font-bold text-sm">{p}-RTID</p>
                          <p className="text-xs text-[var(--txt-body)]">{p === 'D' ? 'Donation' : 'Hospital Request'}</p>
                        </div>
                        {rtidPrefix === p && <CheckCircle className={`w-4 h-4 ml-auto ${p === 'D' ? 'text-[var(--clr-success)]' : 'text-[var(--rtid-badge)]'}`} />}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${rtidPrefix === 'D' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {rtidPrefix}-RTID-
                    </span>
                  </div>
                  <input type="text" value={rtidCheckInput} onChange={e => setRtidCheckInput(e.target.value.toUpperCase())}
                    placeholder="Enter RTID code"
                    onKeyPress={e => e.key === 'Enter' && handleRTIDCheck()}
                    className="w-full pl-36 pr-4 py-4 border-2 border-[var(--clr-border)] rounded-xl focus:border-[var(--clr-info)] outline-none text-sm font-mono" />
                </div>

                <button onClick={handleRTIDCheck} disabled={rtidLoading || !rtidCheckInput.trim()}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 text-[var(--txt-inverse)] rounded-xl font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                  {rtidLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  {rtidLoading ? 'Verifying...' : 'Verify RTID'}
                </button>
              </div>

              {rtidCheckResult && (
                <div className={`mt-6 rounded-2xl p-6 border-2 ${rtidCheckResult.found ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  {rtidCheckResult.found ? (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <CheckCircle className="w-8 h-8 text-[var(--clr-success)]" />
                        <h3 className="text-lg font-bold text-green-900">RTID Verified ✓</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3 bg-[var(--clr-bg-card)]/80 rounded-xl p-4 text-sm">
                        {[
                          ['RTID', rtidCheckResult.fullRTID],
                          ['Type', rtidCheckResult.type],
                          ['Blood Group', rtidCheckResult.bloodGroup],
                          ['Status', rtidCheckResult.status],
                          ['Person', rtidCheckResult.patientName],
                          ['Location', rtidCheckResult.hospitalName],
                          ['Units', rtidCheckResult.unitsRequired],
                          ['Created', rtidCheckResult.createdAt]
                        ].map(([k, v]) => (
                          <div key={k as string}>
                            <p className="text-xs text-[var(--txt-body)] uppercase font-semibold">{k as string}</p>
                            <p className="font-bold text-[var(--txt-heading)]">{v as string}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <XCircle className="w-8 h-8 text-[var(--clr-emergency)]" />
                      <div>
                        <h3 className="text-lg font-bold text-red-900">RTID Not Found</h3>
                        <p className="text-sm text-red-700 mt-1">⚠️ Potential fraud alert — this RTID is not in the National Ledger</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════ FRAUD ALERTS TAB ══════════ */}
        {activeTab === 'fraud' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div>
              <h2 className="text-2xl font-bold text-[var(--txt-heading)] flex items-center gap-2">
                <AlertOctagon className="w-7 h-7 text-[var(--clr-emergency)]" /> Fraud Alerts
              </h2>
              <p className="text-sm text-[var(--txt-body)] mt-1">{fraudAlerts.length} suspicious activities detected</p>
            </div>

            {fraudAlerts.length === 0 ? (
              <div className="bg-[var(--clr-bg-card)] rounded-2xl p-12 text-center shadow-lg border border-gray-100">
                <ShieldCheck className="w-16 h-16 text-[var(--clr-success)] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[var(--txt-heading)] mb-2">No Fraud Alerts</h3>
                <p className="text-[var(--txt-body)]">System is operating normally. No suspicious activities detected.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {fraudAlerts.map(alert => (
                  <div key={alert.id} className="bg-[var(--clr-bg-card)] rounded-2xl p-6 shadow-lg border-l-4 border-[var(--clr-emergency)]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-[var(--stats-divider)] rounded-xl flex items-center justify-center flex-shrink-0">
                          <AlertOctagon className="w-5 h-5 text-[var(--clr-emergency)]" />
                        </div>
                        <div>
                          <p className="font-bold text-[var(--txt-heading)]">Suspicious Request: <span className="font-mono text-[var(--clr-emergency)]">{alert.rtid}</span></p>
                          <p className="text-sm text-[var(--txt-body)] mt-1">Hospital: {alert.hospital}</p>
                          <p className="text-sm text-[var(--txt-body)]">Blood Group: <strong>{alert.bloodGroup}</strong></p>
                          <p className="text-sm text-[var(--clr-emergency)] mt-2 font-medium">{alert.reason}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatDateTime(alert.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button className="px-3 py-1.5 text-xs font-semibold bg-[var(--stats-divider)] text-red-700 rounded-lg hover:bg-red-200">
                          Block
                        </button>
                        <button className="px-3 py-1.5 text-xs font-semibold bg-[var(--clr-bg-page)] text-gray-700 rounded-lg hover:bg-gray-200">
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════ AUDIT LOG TAB ══════════ */}
        {activeTab === 'audit' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div>
              <h2 className="text-2xl font-bold text-[var(--txt-heading)]">Audit Log</h2>
              <p className="text-sm text-[var(--txt-body)] mt-1">Complete system activity trail</p>
            </div>

            <div className="bg-[var(--clr-bg-card)] rounded-2xl p-4 shadow-lg border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select value={auditFilter} onChange={e => setAuditFilter(e.target.value)}
                  className="px-4 py-2.5 border-2 border-[var(--clr-border)] rounded-xl focus:border-[var(--clr-info)] outline-none text-sm font-medium">
                  <option value="all">All Activities</option>
                  <option value="verification">Verifications</option>
                  <option value="donation">Donations</option>
                  <option value="request">Requests</option>
                </select>
                <select value={auditSort} onChange={e => setAuditSort(e.target.value)}
                  className="px-4 py-2.5 border-2 border-[var(--clr-border)] rounded-xl focus:border-[var(--clr-info)] outline-none text-sm font-medium">
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>

            <div className="bg-[var(--clr-bg-card)] rounded-2xl p-6 shadow-lg border border-gray-100 max-h-[600px] overflow-y-auto">
              <div className="space-y-3">
                {filteredAuditLog.slice(0, 100).map((log, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-xl hover:bg-[var(--clr-bg-page)] border border-gray-100">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      log.type === 'verification' ? 'bg-green-100' : log.type === 'donation' ? 'bg-[var(--stats-divider)]' : 'bg-blue-100'
                    }`}>
                      {log.type === 'verification' ? <CheckSquare className="w-4 h-4 text-[var(--clr-success)]" />
                        : log.type === 'donation' ? <Droplet className="w-4 h-4 text-[var(--clr-emergency)]" />
                        : <Activity className="w-4 h-4 text-[var(--rtid-badge)]" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[var(--txt-heading)] text-sm">{log.action}</p>
                      <p className="text-xs text-[var(--txt-body)] mt-0.5">{log.user} — {log.details}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(log.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-[var(--txt-inverse)] py-8 mt-16">
        <div className="max-w-[1400px] mx-auto px-6 text-center">
          <div className="flex justify-center items-center gap-2 mb-2">
            <Droplet className="text-[var(--clr-emergency)]" size={20} fill="var(--clr-emergency)" />
            <span className="font-bold">RaktPort Admin Dashboard</span>
          </div>
          <p className="text-sm text-gray-400">National Blood Management System | Government of India</p>
          <div className="flex justify-center gap-4 mt-3 text-xs text-[var(--txt-body)]">
            <span>Secure Access</span>•<span>Real-time Monitoring</span>•<span>Fraud Prevention</span>•<span>Analytics</span>
          </div>
        </div>
      </footer>

      {/* ── ORG LIST MODAL ── */}
      <OrgListModal
        isOpen={orgModalOpen}
        onClose={() => setOrgModalOpen(false)}
        organizations={allVerifiedOrgs}
        title={orgModalTitle}
        type={orgModalType}
      />

      {/* ── ORG DETAILS MODAL ── */}
      {showOrgDetails && selectedOrg && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--clr-bg-card)] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-[var(--clr-bg-card)] p-6 border-b border-[var(--clr-border)] flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-[var(--txt-heading)]">{selectedOrg.name}</h2>
                <div className="flex gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedOrg.type === 'Hospital' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{selectedOrg.type}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClasses(selectedOrg.status)}`}>{selectedOrg.status}</span>
                </div>
              </div>
              <button onClick={() => setShowOrgDetails(false)} className="p-2 hover:bg-[var(--clr-bg-page)] rounded-xl">
                <X className="w-5 h-5 text-[var(--txt-body)]" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { icon: Mail, label: 'Email / ID', value: selectedOrg.email },
                { icon: Phone, label: 'Contact', value: selectedOrg.contact },
                { icon: MapPin, label: 'Address', value: selectedOrg.address },
                { icon: FileText, label: 'License No.', value: selectedOrg.license }
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 p-3 bg-[var(--clr-bg-page)] rounded-xl">
                  <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">{label}</p>
                    <p className="text-sm font-semibold text-[var(--txt-heading)]">{value}</p>
                  </div>
                </div>
              ))}
              {selectedOrg.type === 'Hospital' && selectedOrg.totalBeds !== 'N/A' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded-xl text-center">
                    <p className="text-xs text-[var(--rtid-badge)] font-medium">Total Beds</p>
                    <p className="text-xl font-black text-blue-700">{selectedOrg.totalBeds}</p>
                  </div>
                  <div className="p-3 bg-cyan-50 rounded-xl text-center">
                    <p className="text-xs text-cyan-500 font-medium">ICU Beds</p>
                    <p className="text-xl font-black text-cyan-700">{selectedOrg.icuBeds}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-[var(--clr-bg-page)] p-6 border-t flex justify-end gap-3">
              <button onClick={() => setShowOrgDetails(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-xl text-sm font-semibold">Close</button>
              {selectedOrg.status === 'pending' && (
                <>
                  <button onClick={() => { setShowOrgDetails(false); verifyOrganization(selectedOrg.id, 'rejected'); }} disabled={actionLoading}
                    className="px-4 py-2 bg-[var(--stats-divider)] text-red-700 rounded-xl text-sm font-semibold hover:bg-red-200">Reject</button>
                  <button onClick={() => { setShowOrgDetails(false); verifyOrganization(selectedOrg.id, 'verified'); }} disabled={actionLoading}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-[var(--txt-inverse)] rounded-xl text-sm font-semibold hover:from-green-600 shadow">Approve</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;