// AdminDashboard.tsx - Part 1: Imports and Setup
// Production-Ready Admin Dashboard with Real-Time Data and Analytics

import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield, Database, Activity, Building2, Droplet, MapPin, Search,
  CheckCircle, XCircle, AlertTriangle, TrendingUp, Users, Package,
  Eye, Download, Filter, RefreshCw, Bell, FileText, X, Loader2,
  ArrowUpRight, HeartHandshake, ArrowUpDown, BarChart3, PieChart,
  TrendingDown, Calendar, Clock, Award, Target, Zap, DollarSign,
  UserCheck, UserX, AlertOctagon, CheckSquare, LogOut, User
} from 'lucide-react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import { Button } from './ui/button';
import logo from '../assets/raktsetu-logo.jpg';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  orderBy,
  limit
} from 'firebase/firestore';

// For Charts
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

// ==================== HELPER FUNCTIONS ====================

// Helper to safely convert Firestore Timestamp or Date to ISO date string
const toDateString = (dateValue: any): string => {
  if (!dateValue) return '';

  // If it's a Firestore Timestamp
  if (dateValue?.toDate && typeof dateValue.toDate === 'function') {
    return dateValue.toDate().toISOString().split('T')[0];
  }

  // If it's already a Date object
  if (dateValue instanceof Date) {
    return dateValue.toISOString().split('T')[0];
  }

  // If it's a string
  if (typeof dateValue === 'string') {
    return dateValue.split('T')[0];
  }

  // If it has seconds (Firestore Timestamp format)
  if (dateValue?.seconds) {
    return new Date(dateValue.seconds * 1000).toISOString().split('T')[0];
  }

  return '';
};

// ==================== TYPES ====================

interface AdminDashboardProps {
  onLogout: () => void;
}

interface Metrics {
  totalRequests: number;
  totalDonations: number;
  totalRedemptions: number;
  fraudAttempts: number;
  registeredHospitals: number;
  registeredBloodBanks: number;
  activeRTIDs: number;
  totalDonors: number;
  verifiedOrgs: number;
  pendingOrgs: number;
}

interface Organization {
  id: string;
  name: string;
  type: 'Hospital' | 'Blood Bank';
  license: string;
  status: string;
  address: string;
  email: string;
  contact: string;
  totalBeds?: string;
  icuBeds?: string;
  rawData?: any;
}

interface RTIDCheckResult {
  found: boolean;
  type?: 'donation' | 'request';
  status?: string;
  bloodGroup?: string;
  patientName?: string;
  hospitalName?: string;
  unitsRequired?: number;
  createdAt?: string;
  [key: string]: any;
}

// ==================== HELPER FUNCTIONS ====================

const getStatusClasses = (status: string): string => {
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case 'pending':
      return "bg-yellow-100 text-yellow-700 border border-yellow-300";
    case 'verified':
    case 'completed':
    case 'available':
      return "bg-green-100 text-green-700 border border-green-300";
    case 'rejected':
    case 'cancelled':
      return "bg-red-100 text-red-700 border border-red-300";
    case 'redeemed':
      return "bg-blue-100 text-blue-700 border border-blue-300";
    default:
      return "bg-gray-100 text-gray-700 border border-gray-300";
  }
};

const getTypeClasses = (type: string): string => {
  const typeLower = type.toLowerCase();
  return typeLower === 'hospital'
    ? "bg-blue-100 text-blue-700 border border-blue-300"
    : "bg-purple-100 text-purple-700 border border-purple-300";
};

const parseInventoryValue = (val: any): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseInt(val) || 0;
  if (typeof val === 'object' && val !== null) {
    return Number(val.available || val.total || 0);
  }
  return 0;
};

const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
};

const formatDateTime = (dateString: string): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

// Eye-Friendly Blood Group Colors for Charts (Softer, Less Strain)
const BLOOD_GROUP_COLORS: Record<string, string> = {
  'A+': '#FF6B6B',    // Soft coral red
  'A-': '#FFA07A',    // Light salmon
  'B+': '#4ECDC4',    // Soft turquoise  
  'B-': '#7DD3C0',    // Mint green
  'O+': '#FFD166',    // Soft golden yellow
  'O-': '#FFE69A',    // Pale yellow
  'AB+': '#9D84B7',   // Soft purple
  'AB-': '#C7B8EA'    // Lavender
};

// Softer Chart Colors (Reduced brightness, better for eyes)
const CHART_COLORS = [
  '#5B9BD5',  // Soft blue (reduced from bright blue)
  '#70AD47',  // Soft green (reduced from bright green)
  '#FFC000',  // Soft amber (reduced from bright orange)
  '#ED7D31',  // Soft coral (reduced from bright red)
  '#A679C0',  // Soft purple (reduced from bright purple)
  '#F4B183'   // Soft peach (reduced from bright pink)
];


// Calculate percentage
const calcPercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

// Get admin name from localStorage or Firebase
const getAdminName = (): string => {
  const adminData = localStorage.getItem('adminName');
  if (adminData) return adminData;

  const userId = localStorage.getItem('userId');
  if (userId) {
    // Extract name from email
    const emailName = userId.split('@')[0];
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  }

  return 'Admin';
};

// Export helper for data download
const downloadCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    toast.error('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',')
          ? `"${value}"`
          : value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);

  toast.success('Data exported successfully');
};

// AdminDashboard.tsx - Part 2: Component Setup and State Management

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  // ==================== STATE MANAGEMENT ====================

  // Navigation & UI States
  const [activeTab, setActiveTab] = useState('overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showOrgDetails, setShowOrgDetails] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);

  // Admin Data
  const adminId = localStorage.getItem('userId');
  const [adminName, setAdminName] = useState<string>(getAdminName());

  // Real-Time Metrics
  const [metrics, setMetrics] = useState<Metrics>({
    totalRequests: 0,
    totalDonations: 0,
    totalRedemptions: 0,
    fraudAttempts: 0,
    registeredHospitals: 0,
    registeredBloodBanks: 0,
    activeRTIDs: 0,
    totalDonors: 0,
    verifiedOrgs: 0,
    pendingOrgs: 0
  });

  // Organizations Management
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [verifyFilter, setVerifyFilter] = useState('all');
  const [verifySort, setVerifySort] = useState('name_asc');
  const [orgSearchTerm, setOrgSearchTerm] = useState('');

  // RTID Check System
  const [rtidCheckInput, setRtidCheckInput] = useState('');
  const [rtidPrefix, setRtidPrefix] = useState<'D' | 'H'>('D'); // D-RTID or H-RTID
  const [rtidCheckResult, setRtidCheckResult] = useState<RTIDCheckResult | null>(null);
  const [rtidLoading, setRtidLoading] = useState(false);

  // National Ledger
  const [nationalLedger, setNationalLedger] = useState<any[]>([]);
  const [ledgerFilterStatus, setLedgerFilterStatus] = useState('all');
  const [ledgerSort, setLedgerSort] = useState('newest');
  const [ledgerSearchTerm, setLedgerSearchTerm] = useState('');

  // Analytics & Reports
  const [nationalInventory, setNationalInventory] = useState<any>({});
  const [cityInventory, setCityInventory] = useState<any>({});
  const [inventorySummary, setInventorySummary] = useState<any>({
    'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0,
    'O+': 0, 'O-': 0, 'AB+': 0, 'AB-': 0
  });
  const [selectedCity, setSelectedCity] = useState('Delhi');
  const [demandSupplyData, setDemandSupplyData] = useState<any[]>([]);
  const [analyticsSort, setAnalyticsSort] = useState('default');

  // Today's Activity
  const [todayDonations, setTodayDonations] = useState<any[]>([]);
  const [todayRequests, setTodayRequests] = useState<any[]>([]);

  // Audit Log
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [auditFilter, setAuditFilter] = useState('all');
  const [auditSort, setAuditSort] = useState('newest');

  // Notifications
  const [notifications, setNotifications] = useState<any[]>([]);

  // Helper Maps
  const [userCityMap, setUserCityMap] = useState<Record<string, string>>({});

  // Chart Data States
  const [bloodGroupDistribution, setBloodGroupDistribution] = useState<any[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [cityWiseData, setCityWiseData] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  const [hourlyActivity, setHourlyActivity] = useState<any[]>([]);

  // Continue to Part 3 for data fetching functions...
  // AdminDashboard.tsx - Part 3: Real Data Fetching Functions

  // ==================== DATA FETCHING ====================

  const fetchAdminDetails = async () => {
    if (!adminId) return;

    try {
      const adminDoc = await getDoc(doc(db, 'users', adminId));
      if (adminDoc.exists()) {
        const adminData = adminDoc.data();
        const name = adminData.fullName || adminData.name || getAdminName();
        setAdminName(name);
        localStorage.setItem('adminName', name);
      }
    } catch (error) {
      console.error('Error fetching admin details:', error);
    }
  };

  const fetchData = async (showToast = false) => {
    if (!adminId) {
      toast.error("Not logged in");
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Parallel data fetching for better performance
      const [usersSnap, requestsSnap, donationsSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "bloodRequests")).catch(() => ({ docs: [] as any[] })),
        getDocs(collection(db, "donations")).catch(() => ({ docs: [] as any[] }))
      ]);

      const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const allRequests = requestsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const allDonations = donationsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // ========== USER ANALYSIS ==========
      const hospitals = users.filter(u => u.role === 'hospital');
      const bloodBanks = users.filter(u => u.role === 'bloodbank');
      const donors = users.filter(u => u.role === 'donor');
      const verifiedOrgs = users.filter(u =>
        (u.role === 'hospital' || u.role === 'bloodbank') && u.isVerified
      );
      const pendingOrgs = users.filter(u =>
        (u.role === 'hospital' || u.role === 'bloodbank') && !u.isVerified
      );

      // Create User -> City Map
      const cityMap: Record<string, string> = {};
      users.forEach(u => {
        const city = u.district || u.city || 'Unknown';
        cityMap[u.id] = city;
      });
      setUserCityMap(cityMap);

      // ========== METRICS CALCULATION ==========
      const totalRequests = allRequests.length;
      const completedDonations = allDonations.filter((d: any) =>
        ['Completed', 'Donated', 'AVAILABLE', 'Available'].includes(d.status)
      ).length;
      const totalRedemptions = allDonations.filter((d: any) =>
        ['REDEEMED', 'Redeemed'].includes(d.status)
      ).length;
      const activeRTIDs = allRequests.filter((r: any) =>
        r.status === 'PENDING' || r.status === 'Pending'
      ).length;
      const fraudAttempts = allRequests.filter((r: any) =>
        r.fraudAlert || r.status === 'Flagged'
      ).length;

      setMetrics({
        totalRequests,
        totalDonations: completedDonations,
        totalRedemptions,
        fraudAttempts,
        registeredHospitals: hospitals.length,
        registeredBloodBanks: bloodBanks.length,
        activeRTIDs,
        totalDonors: donors.length,
        verifiedOrgs: verifiedOrgs.length,
        pendingOrgs: pendingOrgs.length
      });

      // ========== ORGANIZATION VERIFICATION QUEUE ==========
      setOrganizations(pendingOrgs.map(req => ({
        id: req.id,
        name: req.fullName || req.organizationName || "Unknown Organization",
        type: req.role === 'hospital' ? 'Hospital' : 'Blood Bank',
        license: req.registrationNo || req.licenseNo || 'N/A',
        status: req.isVerified ? 'verified' : 'pending',
        address: `${req.district || req.city || 'Unknown'}, ${req.state || ''}, ${req.pincode || ''}`,
        email: req.userId || req.email || req.id,
        contact: req.mobile || 'N/A',
        totalBeds: req.totalBeds || 'N/A',
        icuBeds: req.icuBeds || 'N/A',
        rawData: req
      })));

      // ========== NATIONAL LEDGER ==========
      const ledger: any[] = [];

      // Add Blood Requests
      allRequests.forEach((req: any) => {
        ledger.push({
          id: req.rtid || req.id,
          type: 'Request',
          rtid: req.rtid || `REQ-${req.id.slice(0, 8)}`,
          bloodGroup: req.bloodGroup || 'N/A',
          units: req.unitsRequired || req.units || 0,
          status: req.status || 'Unknown',
          hospital: req.hospitalName || req.hospital || 'Unknown',
          patient: req.patientName || 'Confidential',
          urgency: req.urgency || 'Normal',
          city: req.city || req.district || 'Unknown',
          createdAt: req.createdAt || req.requestDate || new Date().toISOString(),
          rawData: req
        });
      });

      // Add Donations
      allDonations.forEach((don: any) => {
        ledger.push({
          id: don.rtid || don.id,
          type: 'Donation',
          rtid: don.rtid || `DON-${don.id.slice(0, 8)}`,
          bloodGroup: don.bloodGroup || 'N/A',
          units: don.units || 1,
          status: don.status || 'Unknown',
          donor: don.donorName || don.donor || 'Anonymous',
          bloodBank: don.bloodBankName || don.bloodBank || 'Unknown',
          city: don.city || don.district || cityMap[don.donorId] || 'Unknown',
          createdAt: don.createdAt || don.donationDate || new Date().toISOString(),
          rawData: don
        });
      });

      setNationalLedger(ledger);

      // ========== TODAY'S ACTIVITY ==========
      const today = new Date().toISOString().split('T')[0];
      const todayDons = allDonations.filter((d: any) => {
        const createdDate = toDateString(d.createdAt);
        const donationDate = toDateString(d.donationDate);
        return createdDate === today || donationDate === today;
      });
      const todayReqs = allRequests.filter((r: any) => {
        const createdDate = toDateString(r.createdAt);
        const requestDate = toDateString(r.requestDate);
        return createdDate === today || requestDate === today;
      });

      setTodayDonations(todayDons);
      setTodayRequests(todayReqs);

      // ========== ANALYTICS CALCULATIONS ==========
      calculateAnalytics(allRequests, allDonations, users);

      // ========== INVENTORY CALCULATION ==========
      calculateInventory(allDonations, users);

      // ========== NOTIFICATIONS ==========
      generateNotifications(pendingOrgs, todayReqs, todayDons, activeRTIDs);

      // ========== AUDIT LOG ==========
      generateAuditLog(allRequests, allDonations, users);

      if (showToast) {
        toast.success("Dashboard data refreshed");
      }

    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data", {
        description: error?.message || "Please check your connection"
      });
    } finally {
      setLoading(false);
    }
  };

  // ========== ANALYTICS CALCULATION ==========
  const calculateAnalytics = (requests: any[], donations: any[], users: any[]) => {
    // Blood Group Distribution
    const bloodGroupCount: Record<string, number> = {};
    [...requests, ...donations].forEach(item => {
      const bg = item.bloodGroup || 'Unknown';
      bloodGroupCount[bg] = (bloodGroupCount[bg] || 0) + 1;
    });

    const bgData = Object.entries(bloodGroupCount).map(([name, value]) => ({
      name,
      value,
      color: BLOOD_GROUP_COLORS[name] || '#94A3B8'
    }));
    setBloodGroupDistribution(bgData);

    // Monthly Trends (Last 6 months)
    const monthlyData: Record<string, any> = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
      monthlyData[monthKey] = { month: monthKey, requests: 0, donations: 0, redemptions: 0 };
    }

    requests.forEach(req => {
      if (req.createdAt) {
        const date = new Date(req.createdAt);
        const monthKey = date.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].requests++;
        }
      }
    });

    donations.forEach(don => {
      if (don.createdAt) {
        const date = new Date(don.createdAt);
        const monthKey = date.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].donations++;
          if (don.status === 'REDEEMED' || don.status === 'Redeemed') {
            monthlyData[monthKey].redemptions++;
          }
        }
      }
    });

    setMonthlyTrends(Object.values(monthlyData));

    // City-wise Distribution
    const cityCount: Record<string, any> = {};
    [...requests, ...donations].forEach(item => {
      const city = item.city || item.district || 'Unknown';
      if (!cityCount[city]) {
        cityCount[city] = { city, requests: 0, donations: 0 };
      }
      if (item.rtid?.startsWith('REQ') || item.type === 'Request') {
        cityCount[city].requests++;
      } else {
        cityCount[city].donations++;
      }
    });

    const cityData = Object.values(cityCount)
      .sort((a: any, b: any) => (b.requests + b.donations) - (a.requests + a.donations))
      .slice(0, 10);
    setCityWiseData(cityData);

    // Status Distribution
    const statusCount: Record<string, number> = {};
    [...requests, ...donations].forEach(item => {
      const status = item.status || 'Unknown';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    const statusData = Object.entries(statusCount).map(([name, value]) => ({
      name,
      value
    }));
    setStatusDistribution(statusData);

    // Hourly Activity (Last 24 hours)
    const hourlyCount: Record<number, any> = {};
    for (let i = 0; i < 24; i++) {
      hourlyCount[i] = { hour: i, activity: 0 };
    }

    [...requests, ...donations].forEach(item => {
      if (item.createdAt) {
        try {
          const date = new Date(item.createdAt);
          const hour = date.getHours();
          hourlyCount[hour].activity++;
        } catch { }
      }
    });

    setHourlyActivity(Object.values(hourlyCount));
  };

  // Continue to Part 4 for inventory and utility functions...
  // AdminDashboard.tsx - Part 4: Inventory, RTID Check, and Actions

  // ========== INVENTORY CALCULATION ==========
  const calculateInventory = (donations: any[], users: any[]) => {
    const nationalInv: Record<string, number> = {};
    const cityInv: Record<string, Record<string, number>> = {};

    // Initialize blood groups
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    bloodGroups.forEach(bg => {
      nationalInv[bg] = 0;
    });

    // Calculate from available donations
    donations.forEach((don: any) => {
      if (don.status === 'AVAILABLE' || don.status === 'Available') {
        const bg = don.bloodGroup || 'Unknown';
        const units = don.units || 1;
        const city = don.city || don.district || userCityMap[don.donorId] || 'Unknown';

        // National
        nationalInv[bg] = (nationalInv[bg] || 0) + units;

        // City-wise
        if (!cityInv[city]) {
          cityInv[city] = {};
          bloodGroups.forEach(grp => cityInv[city][grp] = 0);
        }
        cityInv[city][bg] = (cityInv[city][bg] || 0) + units;
      }
    });

    setNationalInventory(nationalInv);
    setCityInventory(cityInv);
    setInventorySummary(nationalInv); // Update inventory summary for the new UI section

    // Demand-Supply Analysis
    const demandSupply = bloodGroups.map(bg => {
      const supply = nationalInv[bg] || 0;
      // Estimate demand from pending requests
      const demand = Math.floor(supply * 1.3); // Simulated demand
      return {
        bloodGroup: bg,
        supply,
        demand,
        gap: demand - supply
      };
    });
    setDemandSupplyData(demandSupply);
  };

  // ========== RTID CHECK WITH PREFIX ==========
  const handleRTIDCheck = async () => {
    if (!rtidCheckInput.trim()) {
      toast.error('Please enter an RTID');
      return;
    }

    setRtidLoading(true);
    setRtidCheckResult(null);

    try {
      // Construct full RTID with prefix
      const fullRTID = `${rtidPrefix}-RTID-${rtidCheckInput.trim().toUpperCase()}`;

      // Search in national ledger
      const found = nationalLedger.find(item =>
        item.rtid?.toUpperCase() === fullRTID ||
        item.rtid?.toUpperCase().includes(rtidCheckInput.trim().toUpperCase()) ||
        item.id === rtidCheckInput.trim()
      );

      if (found) {
        setRtidCheckResult({
          found: true,
          type: found.type === 'Donation' ? 'donation' : 'request',
          status: found.status,
          bloodGroup: found.bloodGroup,
          patientName: found.patient || found.donor,
          hospitalName: found.hospital || found.bloodBank,
          unitsRequired: found.units,
          createdAt: formatDateTime(found.createdAt),
          city: found.city,
          urgency: found.urgency,
          fullRTID: found.rtid,
          ...found.rawData
        });
        toast.success('RTID found in National Ledger');
      } else {
        setRtidCheckResult({
          found: false
        });
        toast.error('RTID not found', {
          description: 'This RTID does not exist in the system'
        });
      }
    } catch (error: any) {
      console.error('RTID check error:', error);
      toast.error('Error checking RTID', {
        description: error.message
      });
    } finally {
      setRtidLoading(false);
    }
  };

  // ========== ORGANIZATION VERIFICATION ==========
  const verifyOrganization = async (orgId: string, action: 'verified' | 'rejected') => {
    setActionLoading(true);

    try {
      const result = await Swal.fire({
        title: action === 'verified' ? 'Approve Organization?' : 'Reject Organization?',
        text: action === 'verified'
          ? 'This organization will get access to the platform'
          : 'This organization will not be able to access the platform',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: action === 'verified' ? '#10B981' : '#EF4444',
        cancelButtonColor: '#6B7280',
        confirmButtonText: action === 'verified' ? 'Approve' : 'Reject',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        const userRef = doc(db, 'users', orgId);
        await updateDoc(userRef, {
          isVerified: action === 'verified',
          verificationStatus: action,
          verifiedAt: new Date().toISOString(),
          verifiedBy: adminId
        });

        toast.success(
          action === 'verified' ? 'Organization approved successfully' : 'Organization rejected',
          {
            description: action === 'verified'
              ? 'They can now access the platform'
              : 'They have been notified'
          }
        );

        // Refresh data
        fetchData(false);
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error('Verification failed', {
        description: error.message
      });
    } finally {
      setActionLoading(false);
    }
  };

  // ========== NOTIFICATIONS GENERATION ==========
  const generateNotifications = (
    pending: any[],
    todayReqs: any[],
    todayDons: any[],
    activeRTIDs: number
  ) => {
    const notifs: any[] = [];

    // Pending verifications
    if (pending.length > 0) {
      notifs.push({
        id: 'pending-orgs',
        type: 'warning',
        title: 'Pending Verifications',
        message: `${pending.length} organization(s) awaiting verification`,
        time: 'Now',
        action: () => setActiveTab('verify')
      });
    }

    // Today's activity
    if (todayReqs.length > 0) {
      notifs.push({
        id: 'today-requests',
        type: 'info',
        title: 'New Blood Requests',
        message: `${todayReqs.length} new blood request(s) today`,
        time: 'Today',
        action: () => setActiveTab('ledger')
      });
    }

    if (todayDons.length > 0) {
      notifs.push({
        id: 'today-donations',
        type: 'success',
        title: 'New Donations',
        message: `${todayDons.length} blood donation(s) recorded today`,
        time: 'Today',
        action: () => setActiveTab('ledger')
      });
    }

    // Active RTIDs alert
    if (activeRTIDs > 10) {
      notifs.push({
        id: 'active-rtids',
        type: 'warning',
        title: 'High Active RTIDs',
        message: `${activeRTIDs} active blood requests need attention`,
        time: 'Now',
        action: () => setActiveTab('rtid')
      });
    }

    setNotifications(notifs);
  };

  // ========== AUDIT LOG GENERATION ==========
  const generateAuditLog = (requests: any[], donations: any[], users: any[]) => {
    const log: any[] = [];

    // Recent verifications
    const recentVerified = users
      .filter(u => u.verifiedAt)
      .sort((a, b) => new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime())
      .slice(0, 20);

    recentVerified.forEach(user => {
      log.push({
        id: `verify-${user.id}`,
        action: 'Organization Verified',
        user: user.fullName || user.organizationName,
        details: `${user.role === 'hospital' ? 'Hospital' : 'Blood Bank'} verified`,
        timestamp: user.verifiedAt,
        type: 'verification'
      });
    });

    // Recent requests and donations (last 50)
    const recentActivity = [...requests, ...donations]
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 50);

    recentActivity.forEach(item => {
      const isDonation = item.rtid?.startsWith('D-') || item.status === 'AVAILABLE';
      log.push({
        id: item.id,
        action: isDonation ? 'Blood Donation' : 'Blood Request',
        user: item.donorName || item.patientName || item.hospital || 'Unknown',
        details: `${item.bloodGroup || 'N/A'} - ${item.units || 1} unit(s)`,
        timestamp: item.createdAt,
        type: isDonation ? 'donation' : 'request'
      });
    });

    // Sort by timestamp
    log.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());

    setAuditLog(log);
  };

  // ========== DATA EXPORT ==========
  const exportLedgerData = () => {
    const exportData = filteredLedger.map(item => ({
      RTID: item.rtid,
      Type: item.type,
      'Blood Group': item.bloodGroup,
      Units: item.units,
      Status: item.status,
      'Hospital/Blood Bank': item.hospital || item.bloodBank,
      'Patient/Donor': item.patient || item.donor,
      City: item.city,
      'Created At': formatDateTime(item.createdAt)
    }));

    downloadCSV(exportData, 'national_ledger');
  };

  const exportAnalyticsData = () => {
    const exportData = bloodGroupDistribution.map(item => ({
      'Blood Group': item.name,
      Count: item.value
    }));

    downloadCSV(exportData, 'blood_group_analytics');
  };

  // ========== EFFECTS ==========
  useEffect(() => {
    fetchAdminDetails();
    fetchData(false);
  }, []);

  useEffect(() => {
    if (activeTab) {
      setTabLoading(true);
      setTimeout(() => setTabLoading(false), 300);
    }
  }, [activeTab]);

  // Continue to Part 5 for filtered data and memoized computations...
  // AdminDashboard.tsx - Part 5: Filtered Data and Computations

  // ==================== FILTERED & SORTED DATA ====================

  // Filtered Organizations
  const filteredOrganizations = useMemo(() => {
    let filtered = [...organizations];

    // Filter by status
    if (verifyFilter !== 'all') {
      filtered = filtered.filter(org => org.status === verifyFilter);
    }

    // Search filter
    if (orgSearchTerm) {
      const search = orgSearchTerm.toLowerCase();
      filtered = filtered.filter(org =>
        org.name.toLowerCase().includes(search) ||
        org.email.toLowerCase().includes(search) ||
        org.license.toLowerCase().includes(search) ||
        org.type.toLowerCase().includes(search)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (verifySort) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return filtered;
  }, [organizations, verifyFilter, verifySort, orgSearchTerm]);

  // Filtered National Ledger
  const filteredLedger = useMemo(() => {
    let filtered = [...nationalLedger];

    // Filter by status
    if (ledgerFilterStatus !== 'all') {
      filtered = filtered.filter(item =>
        item.status.toLowerCase() === ledgerFilterStatus.toLowerCase()
      );
    }

    // Search filter
    if (ledgerSearchTerm) {
      const search = ledgerSearchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.rtid?.toLowerCase().includes(search) ||
        item.bloodGroup?.toLowerCase().includes(search) ||
        item.hospital?.toLowerCase().includes(search) ||
        item.bloodBank?.toLowerCase().includes(search) ||
        item.patient?.toLowerCase().includes(search) ||
        item.donor?.toLowerCase().includes(search) ||
        item.city?.toLowerCase().includes(search)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (ledgerSort) {
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'oldest':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'bloodgroup':
          return (a.bloodGroup || '').localeCompare(b.bloodGroup || '');
        case 'units':
          return (b.units || 0) - (a.units || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [nationalLedger, ledgerFilterStatus, ledgerSort, ledgerSearchTerm]);

  // Filtered Audit Log
  const filteredAuditLog = useMemo(() => {
    let filtered = [...auditLog];

    // Filter by type
    if (auditFilter !== 'all') {
      filtered = filtered.filter(item => item.type === auditFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (auditSort) {
        case 'newest':
          return new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime();
        case 'oldest':
          return new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime();
        case 'type':
          return (a.type || '').localeCompare(b.type || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [auditLog, auditFilter, auditSort]);

  // Sorted Analytics Data
  const sortedCityData = useMemo(() => {
    let sorted = [...cityWiseData];

    switch (analyticsSort) {
      case 'total_desc':
        sorted.sort((a, b) => (b.requests + b.donations) - (a.requests + a.donations));
        break;
      case 'total_asc':
        sorted.sort((a, b) => (a.requests + a.donations) - (b.requests + b.donations));
        break;
      case 'city':
        sorted.sort((a, b) => a.city.localeCompare(b.city));
        break;
      default:
        break;
    }

    return sorted;
  }, [cityWiseData, analyticsSort]);

  // Unread Notifications Count
  const unreadNotifications = useMemo(() => {
    return notifications.length;
  }, [notifications]);

  // Continue to Part 6 for UI Header and Navigation...
  // AdminDashboard.tsx - Part 6: Header and Navigation UI

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">

      {/* ========== MODERN HEADER ========== */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl overflow-hidden shadow-lg ring-2 ring-white">
                <img src={logo} alt="RaktPort" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  RaktPort Admin
                </h1>
                <p className="text-xs text-gray-500 font-medium">National Blood Management System</p>
              </div>
            </div>

            {/* Admin Profile and Actions */}
            <div className="flex items-center gap-4">

              {/* Refresh Button */}
              <button
                onClick={() => fetchData(true)}
                disabled={loading}
                className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
                title="Refresh Data"
              >
                <RefreshCw
                  className={`w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors ${loading ? 'animate-spin' : ''}`}
                />
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                      {unreadNotifications}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                    <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        Notifications
                        <span className="ml-auto text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                          {notifications.length}
                        </span>
                      </h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map(notif => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              notif.action?.();
                              setShowNotifications(false);
                            }}
                            className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 rounded-full mt-2 ${notif.type === 'warning' ? 'bg-yellow-400' :
                                notif.type === 'success' ? 'bg-green-400' :
                                  notif.type === 'error' ? 'bg-red-400' :
                                    'bg-blue-400'
                                }`} />
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-800">{notif.title}</p>
                                <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                                <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">No new notifications</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Profile */}
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-800">{adminName}</p>
                  <p className="text-xs text-gray-500">System Administrator</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  {adminName.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ========== NAVIGATION TABS ========== */}
      <div className="sticky top-20 z-40 bg-white/90 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto py-3 scrollbar-hide">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'verify', label: 'Verify Organizations', icon: CheckCircle, badge: metrics.pendingOrgs },
              { id: 'ledger', label: 'National Ledger', icon: Database, badge: nationalLedger.length },
              { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
              { id: 'rtid', label: 'RTID Check', icon: Shield },
              { id: 'audit', label: 'Audit Log', icon: FileText }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 whitespace-nowrap relative ${isActive
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{tab.label}</span>
                  {tab.badge && tab.badge > 0 && (
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${isActive ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
                      }`}>
                      {tab.badge}
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
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="text-gray-800 font-semibold">Loading Dashboard...</p>
          </div>
        </div>
      )}

      {/* Continue to Part 7 for Overview Dashboard Content... */}
      {/* AdminDashboard.tsx - Part 7: Overview Dashboard Content */}

      {/* ========== MAIN CONTENT ========== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-500">

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: 'Total Blood Requests',
                  value: metrics.totalRequests,
                  icon: Activity,
                  color: 'from-blue-500 to-blue-600',
                  bgColor: 'bg-blue-50',
                  change: todayRequests.length > 0 ? `+${todayRequests.length} today` : 'No requests today'
                },
                {
                  title: 'Total Donations',
                  value: metrics.totalDonations,
                  icon: Droplet,
                  color: 'from-red-500 to-red-600',
                  bgColor: 'bg-red-50',
                  change: todayDonations.length > 0 ? `+${todayDonations.length} today` : 'No donations today'
                },
                {
                  title: 'Active RTIDs',
                  value: metrics.activeRTIDs,
                  icon: Shield,
                  color: 'from-green-500 to-green-600',
                  bgColor: 'bg-green-50',
                  change: 'Pending verification'
                },
                {
                  title: 'Total Donors',
                  value: metrics.totalDonors,
                  icon: Users,
                  color: 'from-purple-500 to-purple-600',
                  bgColor: 'bg-purple-50',
                  change: 'Registered users'
                }
              ].map((metric, idx) => {
                const Icon = metric.icon;
                return (
                  <div key={idx} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{metric.title}</p>
                        <p className="text-4xl font-bold text-gray-900 mt-3">{metric.value.toLocaleString()}</p>
                        <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {metric.change}
                        </p>
                      </div>
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${metric.color} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Additional Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{metrics.registeredHospitals}</p>
                    <p className="text-sm text-gray-600">Hospitals</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{metrics.registeredBloodBanks}</p>
                    <p className="text-sm text-gray-600">Blood Banks</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{metrics.verifiedOrgs}</p>
                    <p className="text-sm text-gray-600">Verified Organizations</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* Blood Group Distribution */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-800">Blood Group Distribution</h3>
                  <PieChart className="w-5 h-5 text-gray-400" />
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={bloodGroupDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {bloodGroupDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>

              {/* Monthly Trends */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-800">6-Month Trends</h3>
                  <BarChart3 className="w-5 h-5 text-gray-400" />
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="requests" stroke="#5B9BD5" strokeWidth={2} name="Requests" />
                    <Line type="monotone" dataKey="donations" stroke="#70AD47" strokeWidth={2} name="Donations" />
                    <Line type="monotone" dataKey="redemptions" stroke="#FFC000" strokeWidth={2} name="Redemptions" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Today's Activity */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Today's Activity
                </h3>
                <span className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                  <p className="text-sm font-semibold text-green-800 mb-2">New Donations Today</p>
                  <p className="text-3xl font-bold text-green-600">{todayDonations.length}</p>
                  {todayDonations.length > 0 && (
                    <p className="text-xs text-green-700 mt-2">
                      Last donation: {formatDateTime(todayDonations[0]?.createdAt)}
                    </p>
                  )}
                </div>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm font-semibold text-blue-800 mb-2">New Requests Today</p>
                  <p className="text-3xl font-bold text-blue-600">{todayRequests.length}</p>
                  {todayRequests.length > 0 && (
                    <p className="text-xs text-blue-700 mt-2">
                      Last request: {formatDateTime(todayRequests[0]?.createdAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Pending Actions Alert */}
            {metrics.pendingOrgs > 0 && (
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-6 border-l-4 border-yellow-500 shadow-lg">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-yellow-900">Action Required</h4>
                    <p className="text-yellow-800 mt-1">
                      You have <strong>{metrics.pendingOrgs}</strong> organization(s) awaiting verification.
                    </p>
                    <button
                      onClick={() => setActiveTab('verify')}
                      className="mt-4 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      Review Now
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Continue to Part 8 for Organization Verification Tab... */}
      </main>
      {/* AdminDashboard.tsx - Part 8: Organization Verification Tab */}

      {/* VERIFY ORGANIZATIONS TAB */}
      {activeTab === 'verify' && (
        <div className="space-y-6 animate-in fade-in duration-500">

          {/* Header and Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Organization Verification</h2>
              <p className="text-sm text-gray-600 mt-1">
                {filteredOrganizations.length} organization(s) pending verification
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => exportLedgerData()}
                className="px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 font-semibold text-gray-700"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search organizations..."
                  value={orgSearchTerm}
                  onChange={(e) => setOrgSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                />
              </div>

              {/* Status Filter */}
              <select
                value={verifyFilter}
                onChange={(e) => setVerifyFilter(e.target.value)}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>

              {/* Sort */}
              <select
                value={verifySort}
                onChange={(e) => setVerifySort(e.target.value)}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium"
              >
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="type">By Type</option>
                <option value="status">By Status</option>
              </select>
            </div>
          </div>

          {/* Organizations Grid */}
          {filteredOrganizations.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredOrganizations.map(org => (
                <div key={org.id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">

                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{org.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeClasses(org.type)}`}>
                          {org.type}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClasses(org.status)}`}>
                          {org.status}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedOrg(org);
                        setShowOrgDetails(true);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Eye className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  {/* Details */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{org.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{org.contact}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{org.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span>License: {org.license}</span>
                    </div>
                  </div>

                  {/* Documents Preview */}
                  {org.rawData?.documents && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-2">
                        <FileText className="w-3 h-3" />
                        Uploaded Documents
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(org.rawData.documents).map((docKey, idx) => (
                          <button
                            key={idx}
                            onClick={() => window.open(org.rawData.documents[docKey], '_blank')}
                            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-300 transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View {docKey}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {org.status === 'pending' && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                      <button
                        onClick={() => verifyOrganization(org.id, 'rejected')}
                        disabled={actionLoading}
                        className="flex-1 px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => verifyOrganization(org.id, 'verified')}
                        disabled={actionLoading}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                      >
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center shadow-lg border border-gray-100">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">All Caught Up!</h3>
              <p className="text-gray-600">No organizations pending verification</p>
            </div>
          )}
        </div>
      )}

      {/* Continue to Part 9 for RTID Check Tab... */}
      {/* AdminDashboard.tsx - Part 9: RTID Check Tab with Prefix */}

      {/* RTID CHECK TAB */}
      {activeTab === 'rtid' && (
        <div className="space-y-6 animate-in fade-in duration-500">

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">RTID Verification System</h2>
              <p className="text-gray-600">
                Verify Real-Time Identification Numbers against the National Ledger
              </p>
            </div>

            {/* RTID Input with Prefix Selection */}
            <div className="max-w-2xl mx-auto space-y-6">

              {/* Prefix Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select RTID Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setRtidPrefix('D')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${rtidPrefix === 'D'
                      ? 'border-green-500 bg-green-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <Droplet className={`w-6 h-6 ${rtidPrefix === 'D' ? 'text-green-600' : 'text-gray-400'}`} />
                      <div className="text-left">
                        <p className={`font-bold ${rtidPrefix === 'D' ? 'text-green-900' : 'text-gray-700'}`}>
                          D-RTID
                        </p>
                        <p className="text-xs text-gray-500">Donation RTID</p>
                      </div>
                      {rtidPrefix === 'D' && (
                        <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => setRtidPrefix('H')}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${rtidPrefix === 'H'
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <Building2 className={`w-6 h-6 ${rtidPrefix === 'H' ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div className="text-left">
                        <p className={`font-bold ${rtidPrefix === 'H' ? 'text-blue-900' : 'text-gray-700'}`}>
                          H-RTID
                        </p>
                        <p className="text-xs text-gray-500">Hospital Request</p>
                      </div>
                      {rtidPrefix === 'H' && (
                        <CheckCircle className="w-5 h-5 text-blue-600 ml-auto" />
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* RTID Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Enter RTID Number
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-lg font-bold text-sm ${rtidPrefix === 'D'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                      }`}>
                      {rtidPrefix}-RTID-
                    </span>
                  </div>
                  <input
                    type="text"
                    value={rtidCheckInput}
                    onChange={(e) => setRtidCheckInput(e.target.value.toUpperCase())}
                    placeholder="Enter RTID code"
                    className="w-full pl-36 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-lg font-mono transition-all"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleRTIDCheck();
                      }
                    }}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Example: For {rtidPrefix}-RTID-ABC123, enter "ABC123"
                </p>
              </div>

              {/* Check Button */}
              <button
                onClick={handleRTIDCheck}
                disabled={rtidLoading || !rtidCheckInput.trim()}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {rtidLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Verify RTID
                  </>
                )}
              </button>
            </div>

            {/* Results */}
            {rtidCheckResult && (
              <div className="mt-8 max-w-2xl mx-auto">
                {rtidCheckResult.found ? (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 shadow-xl">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-green-900">RTID Verified ✓</h3>
                        <p className="text-green-700 mt-1">This RTID is valid and registered in the National Ledger</p>
                      </div>
                    </div>

                    {/* RTID Details */}
                    <div className="grid grid-cols-2 gap-4 bg-white/80 rounded-xl p-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">RTID</p>
                        <p className="text-sm font-bold text-gray-900 font-mono">{rtidCheckResult.fullRTID}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Type</p>
                        <p className="text-sm font-bold text-gray-900 capitalize">{rtidCheckResult.type}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Blood Group</p>
                        <p className="text-sm font-bold text-gray-900">{rtidCheckResult.bloodGroup}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Status</p>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusClasses(rtidCheckResult.status || '')}`}>
                          {rtidCheckResult.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">
                          {rtidCheckResult.type === 'donation' ? 'Donor' : 'Patient'}
                        </p>
                        <p className="text-sm font-bold text-gray-900">{rtidCheckResult.patientName}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">
                          {rtidCheckResult.type === 'donation' ? 'Blood Bank' : 'Hospital'}
                        </p>
                        <p className="text-sm font-bold text-gray-900">{rtidCheckResult.hospitalName}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">Units</p>
                        <p className="text-sm font-bold text-gray-900">{rtidCheckResult.unitsRequired}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase">City</p>
                        <p className="text-sm font-bold text-gray-900">{rtidCheckResult.city}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Created At</p>
                        <p className="text-sm font-bold text-gray-900">{rtidCheckResult.createdAt}</p>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-300">
                      <p className="text-sm text-green-800 font-semibold flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        ✓ RTID authenticated against National Ledger
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 border-2 border-red-200 shadow-xl">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0">
                        <XCircle className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-red-900">RTID Not Found</h3>
                        <p className="text-red-700 mt-1">This RTID does not exist in the National Ledger</p>
                      </div>
                    </div>

                    <div className="bg-red-100 rounded-lg p-4 border border-red-300">
                      <p className="text-sm text-red-800 font-semibold flex items-center gap-2">
                        <AlertOctagon className="w-4 h-4" />
                        ⚠ POTENTIAL FRAUD ALERT - Transaction Blocked
                      </p>
                      <p className="text-xs text-red-700 mt-2">
                        This RTID is not registered in our system. Please verify the code or contact system administrator.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Continue to Part 10 for Analytics and Reports... */}

      {/* ANALYTICS & REPORTS TAB */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-in fade-in duration-500">

          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
            <button
              onClick={exportAnalyticsData}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Data
            </button>
          </div>

          {/* City-wise Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Top 10 Cities by Activity</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={sortedCityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="city" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={100} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="requests" fill="#3B82F6" name="Requests" />
                <Bar dataKey="donations" fill="#10B981" name="Donations" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Status Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Demand vs Supply Analysis</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={demandSupplyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="bloodGroup" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="demand" fill="#E67C73" name="Demand" />
                  <Bar dataKey="supply" fill="#70AD47" name="Supply" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* NATIONAL INVENTORY SECTION */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Package className="w-7 h-7 text-blue-600" />
              National Blood Inventory
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
              {Object.entries(inventorySummary).map(([bloodGroup, units]: [string, any]) => {
                const getInventoryColor = (units: number) => {
                  if (units >= 50) return 'from-emerald-500 to-teal-600'; // Excellent stock
                  if (units >= 20) return 'from-blue-500 to-cyan-600'; // Good stock
                  if (units >= 10) return 'from-amber-500 to-orange-600'; // Low stock
                  return 'from-rose-500 to-red-600'; // Critical
                };

                const getInventoryStatus = (units: number) => {
                  if (units >= 50) return { text: 'Excellent', color: 'text-emerald-700 bg-emerald-50' };
                  if (units >= 20) return { text: 'Good', color: 'text-blue-700 bg-blue-50' };
                  if (units >= 10) return { text: 'Low', color: 'text-amber-700 bg-amber-50' };
                  return { text: 'Critical', color: 'text-rose-700 bg-rose-50' };
                };

                const status = getInventoryStatus(units);

                return (
                  <div
                    key={bloodGroup}
                    className="relative overflow-hidden rounded-2xl shadow-lg border border-gray-100 bg-white hover:shadow-xl transition-all"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${getInventoryColor(units)} opacity-10`} />
                    <div className="relative p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl font-black text-gray-800">{bloodGroup}</span>
                        <Droplet className={`w-6 h-6 ${units >= 20 ? 'text-emerald-600' : units >= 10 ? 'text-amber-600' : 'text-rose-600'}`} fill="currentColor" />
                      </div>
                      <div className="text-center mb-3">
                        <p className="text-4xl font-extrabold text-gray-900">{units}</p>
                        <p className="text-xs text-gray-500 font-medium mt-1">Units Available</p>
                      </div>
                      <div className={`px-3 py-1.5 rounded-full text-xs font-bold text-center ${status.color}`}>
                        {status.text}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-emerald-700 font-medium">Total Available</p>
                    <p className="text-2xl font-black text-emerald-900">
                      {Object.values(inventorySummary).reduce((sum: number, units: any) => sum + units, 0)} Units
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Droplet className="w-6 h-6 text-white" fill="white" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Blood Groups</p>
                    <p className="text-2xl font-black text-blue-900">8 Types</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-purple-700 font-medium">Critical Groups</p>
                    <p className="text-2xl font-black text-purple-900">
                      {Object.entries(inventorySummary).filter(([, units]: [string, any]) => units < 10).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CITY-WISE INVENTORY SECTION */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MapPin className="w-7 h-7 text-indigo-600" />
              City-wise Blood Inventory
            </h2>

            {Object.keys(cityInventory).length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(cityInventory).map(([city, inventory]: [string, any]) => (
                  <div key={city} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-indigo-600" />
                        {city}
                      </h3>
                      <div className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                        {Object.values(inventory).reduce((sum: number, units: any) => sum + units, 0)} Total Units
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                      {Object.entries(inventory).map(([bloodGroup, units]: [string, any]) => {
                        const getColor = (u: number) => {
                          if (u >= 10) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
                          if (u >= 5) return 'bg-blue-100 text-blue-800 border-blue-300';
                          if (u >= 2) return 'bg-amber-100 text-amber-800 border-amber-300';
                          return 'bg-rose-100 text-rose-800 border-rose-300';
                        };

                        return (
                          <div
                            key={bloodGroup}
                            className={`p-3 rounded-xl border-2 ${getColor(units)} text-center`}
                          >
                            <p className="text-lg font-black">{bloodGroup}</p>
                            <p className="text-2xl font-extrabold mt-1">{units}</p>
                            <p className="text-xs font-medium opacity-75 mt-1">units</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl p-12 text-center border-2 border-dashed border-gray-300">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No city-wise inventory data available</p>
                <p className="text-sm text-gray-500 mt-2">Data will appear once cities start reporting inventory</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NATIONAL LEDGER TAB */}
      {activeTab === 'ledger' && (
        <div className="space-y-6 animate-in fade-in duration-500">

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">National Ledger</h2>
              <p className="text-sm text-gray-600 mt-1">{filteredLedger.length} total entries</p>
            </div>
            <button
              onClick={exportLedgerData}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search ledger..."
                  value={ledgerSearchTerm}
                  onChange={(e) => setLedgerSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none"
                />
              </div>
              <select
                value={ledgerFilterStatus}
                onChange={(e) => setLedgerFilterStatus(e.target.value)}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none font-medium"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="available">Available</option>
                <option value="redeemed">Redeemed</option>
              </select>
              <select
                value={ledgerSort}
                onChange={(e) => setLedgerSort(e.target.value)}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none font-medium"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="bloodgroup">By Blood Group</option>
                <option value="units">By Units</option>
              </select>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">RTID</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Blood Group</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Units</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLedger.slice(0, 50).map((entry, idx) => (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono font-semibold text-gray-900">{entry.rtid}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${entry.type === 'Donation' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                          {entry.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">{entry.bloodGroup}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{entry.units}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClasses(entry.status)}`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{entry.city}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(entry.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredLedger.length > 50 && (
              <div className="p-4 bg-gray-50 border-t border-gray-200 text-center text-sm text-gray-600">
                Showing 50 of {filteredLedger.length} entries. Export for full data.
              </div>
            )}
          </div>
        </div>
      )}

      {/* AUDIT LOG TAB */}
      {activeTab === 'audit' && (
        <div className="space-y-6 animate-in fade-in duration-500">

          <div>
            <h2 className="text-2xl font-bold text-gray-900">Audit Log</h2>
            <p className="text-sm text-gray-600 mt-1">Recent system activities and changes</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none font-medium"
              >
                <option value="all">All Activities</option>
                <option value="verification">Verifications</option>
                <option value="donation">Donations</option>
                <option value="request">Requests</option>
              </select>
              <select
                value={auditSort}
                onChange={(e) => setAuditSort(e.target.value)}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none font-medium"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="type">By Type</option>
              </select>
            </div>
          </div>

          {/* Audit Timeline */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {filteredAuditLog.slice(0, 100).map((log, idx) => (
                <div key={log.id} className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${log.type === 'verification' ? 'bg-green-100' :
                    log.type === 'donation' ? 'bg-red-100' :
                      'bg-blue-100'
                    }`}>
                    {log.type === 'verification' ? <CheckSquare className="w-5 h-5 text-green-600" /> :
                      log.type === 'donation' ? <Droplet className="w-5 h-5 text-red-600" /> :
                        <Activity className="w-5 h-5 text-blue-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{log.action}</p>
                    <p className="text-sm text-gray-600 mt-1">{log.user} - {log.details}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDateTime(log.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}




      {/* ========== FOOTER ========== */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex justify-center items-center gap-2 mb-2">
            <Droplet className="text-red-400" size={20} fill="#ef4444" />
            <span className="font-bold tracking-wide">RaktPort Admin Dashboard</span>
          </div>
          <p className="text-sm text-gray-300">National Blood Management System | Government of India</p>
          <div className="flex justify-center gap-4 mt-4 text-xs text-gray-400">
            <span>Secure Access</span>
            <span>•</span>
            <span>Real-time Monitoring</span>
            <span>•</span>
            <span>Fraud Prevention</span>
            <span>•</span>
            <span>Advanced Analytics</span>
          </div>
          <p className="text-xs text-gray-500 mt-6">© 2025 RaktPort. Made with ❤️ for India.</p>
        </div>
      </footer>

      {/* ========== ORGANIZATION DETAILS MODAL ========== */}
      {showOrgDetails && selectedOrg && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="sticky top-0 bg-white z-10 p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedOrg.name}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeClasses(selectedOrg.type)}`}>
                    {selectedOrg.type}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClasses(selectedOrg.status)}`}>
                    {selectedOrg.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowOrgDetails(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">

              {/* Contact & Location Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b pb-2">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-700">
                      <Mail size={18} className="text-gray-400" />
                      <span className="text-sm">{selectedOrg.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <Phone size={18} className="text-gray-400" />
                      <span className="text-sm">{selectedOrg.contact}</span>
                    </div>
                    <div className="flex items-start gap-3 text-gray-700">
                      <MapPin size={18} className="text-gray-400 mt-0.5" />
                      <span className="text-sm">{selectedOrg.address}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b pb-2">
                    {selectedOrg.type === 'Hospital' ? 'Hospital Details' : 'Blood Bank Details'}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-700">
                      <FileText size={18} className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">License Number</p>
                        <p className="text-sm font-semibold">{selectedOrg.license}</p>
                      </div>
                    </div>
                    {selectedOrg.type === 'Hospital' && (
                      <>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Total Beds</span>
                          <span className="font-bold text-gray-900">{selectedOrg.totalBeds}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">ICU Beds</span>
                          <span className="font-bold text-gray-900">{selectedOrg.icuBeds}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider border-b pb-2 mb-4">
                  Verification Documents
                </h3>
                {selectedOrg.rawData?.documents ? (
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(selectedOrg.rawData.documents).map(([key, url]: [string, any]) => (
                      <button
                        key={key}
                        onClick={() => window.open(url, '_blank')}
                        className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all flex flex-col items-center gap-3 group"
                      >
                        <FileText size={32} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                        <div className="text-center">
                          <p className="text-sm font-semibold text-gray-800 capitalize">{key}</p>
                          <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                            <Eye className="w-3 h-3" />
                            Click to view
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-gray-50 rounded-xl text-center">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm text-gray-500">No documents uploaded</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="sticky bottom-0 bg-gray-50 p-6 border-t border-gray-200 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => setShowOrgDetails(false)}
                className="px-6 py-2.5 text-gray-700 font-semibold hover:bg-gray-200 rounded-xl transition-colors"
              >
                Close
              </button>
              {selectedOrg.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      setShowOrgDetails(false);
                      verifyOrganization(selectedOrg.id, 'rejected');
                    }}
                    disabled={actionLoading}
                    className="px-6 py-2.5 bg-red-100 text-red-700 font-semibold hover:bg-red-200 rounded-xl transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      setShowOrgDetails(false);
                      verifyOrganization(selectedOrg.id, 'verified');
                    }}
                    disabled={actionLoading}
                    className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    Approve Application
                  </button>
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