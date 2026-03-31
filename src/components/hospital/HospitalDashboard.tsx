// hospital/HospitalDashboard.tsx
// Main dashboard controller — all sub-components imported from sibling modules

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import {
  Bell, LogOut, Plus, QrCode, Siren, FileDown, MapPin,
  Building2, RefreshCw, Droplet, UserCircle, Search, Users, Shield,
  Moon, Sun, Keyboard, FileText
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import logo from '../../assets/raktport-logo.png';
import { db } from '../../firebase';
import {
  collection, query, where, getDocs, addDoc, deleteDoc,
  doc, getDoc, updateDoc, onSnapshot
} from 'firebase/firestore';
// @ts-ignore
import { BLOOD_GROUPS, generateRtid } from "@/lib/bloodbank-utils";

// ── Modular imports ──
import {
  HD_STYLES, SYSTEM_VERSION, URGENCY_CONFIG, getStatusMeta, LOCKED_STATUSES,
  formatDate, formatTime, timeAgo, generateSerial, isRequestValid,
  getTimeRemaining, getValidityPct, canDeleteRequest, getQRPayload, parseTimestamp,
  ErrorBoundary, QRModal, ProfileModal, NotifDrawer, CompleteModal, NewRequestModal,
  PremiumDashboard, RequestsView, TransfusionHistoryView,
  openPrintWindow,
  // Phase 2
  InventoryView, PatientHistoryModal, GlobalSearch, EditRequestModal, AuditTrailView,
  logAuditAction,
  // Phase 3-4
  AnalyticsView, KeyboardShortcuts, ReportGenerator,
} from "./index";
import type {
  BloodRequest, BloodGroup, UrgencyLevel, RequestStatus,
  DonorInfo, TransfusionRecord, Notification, BloodComponentType,
} from "./types";

type TabId = "overview" | "requests" | "history" | "inventory" | "audit" | "analytics";

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD CONTROLLER
═══════════════════════════════════════════════════════════════ */
const HospitalDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [hospitalData, setHospitalData] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null);
  const [completeTarget, setCompleteTarget] = useState<BloodRequest | null>(null);
  const [modalUrgency, setModalUrgency] = useState<UrgencyLevel>("Routine");
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [tabKey, setTabKey] = useState(0);
  const [loading, setLoading] = useState(true);
  // Phase 2 state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isPatientHistoryOpen, setIsPatientHistoryOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BloodRequest | null>(null);
  // Phase 3-4 state
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [duplicateSource, setDuplicateSource] = useState<BloodRequest | null>(null);

  const hospitalId = localStorage.getItem("userId");

  /* CSV export */
  const handleExportCSV = useCallback(() => {
    if (!requests.length) { toast.error("No requests to export"); return; }
    const headers = ["RTID", "Serial No", "Patient", "Age", "Blood Group", "Component", "Units", "Urgency", "Status", "Required By", "Created At", "Doctor", "Ward", "Bed"];
    const csvRows = requests.map((r: BloodRequest) => [r.rtid, r.serialNumber || "", r.patientName, r.age || "", r.bloodGroup, r.componentType || "Whole Blood", r.unitsRequired, r.urgency || "Routine", r.status, `${formatDate(r.requiredBy)} ${formatTime(r.requiredBy)}`, `${formatDate(r.createdAt)} ${formatTime(r.createdAt)}`, r.doctorName || "", r.wardDepartment || "", r.bedNumber || ""]);
    const csv = [headers, ...csvRows].map((r: any[]) => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `RaktPort_Requests_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.csv`; a.click(); URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
    if (hospitalId) logAuditAction(hospitalId, hospitalData?.fullName || "Hospital", "CSV_EXPORTED", `Exported ${requests.length} requests to CSV`);
  }, [requests, hospitalId, hospitalData]);

  /* WhatsApp share */
  const handleWhatsAppShare = useCallback((r: BloodRequest) => {
    const uc = URGENCY_CONFIG[r.urgency || "Routine"];
    const msg = `🩸 *RaktPort Blood Request*\n\n${uc.emoji} *Urgency:* ${r.urgency || "Routine"}\n*Patient:* ${r.patientName}\n*Blood Group:* ${r.bloodGroup}\n*Component:* ${r.componentType || "Whole Blood"} × ${r.unitsRequired} unit(s)\n*Required By:* ${formatDate(r.requiredBy)} ${formatTime(r.requiredBy)}\n*Hospital:* ${hospitalData?.fullName || "Hospital"}\n*Location:* ${hospitalData?.district || ""}, ${hospitalData?.pincode || ""}\n*RTID:* \`${r.rtid}\`\n\n_Please contact the hospital immediately if you can help._`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  }, [hospitalData]);

  /* Refresh — no full page reload */
  const handleRefresh = useCallback(() => {
    setLoading(true);
    setRequests([]);
    setTabKey((k: number) => k + 1);
    setTimeout(() => setLoading(false), 1000);
  }, []);

  /* Print helper */
  const handlePrint = useCallback((r: BloodRequest) => {
    openPrintWindow(r, hospitalData, logo);
    if (hospitalId) logAuditAction(hospitalId, hospitalData?.fullName || "Hospital", "PRINT_SLIP", `Printed slip for ${r.patientName} (${r.bloodGroup})`, r.rtid);
  }, [hospitalData, hospitalId]);

  /* Dark mode toggle */
  const toggleDark = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("hd-dark", next ? "1" : "0");
  }, [isDark]);

  /* Keyboard shortcuts: Ctrl+K, numbers 1-6, N, E, R, ? */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const inInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setIsSearchOpen(true); return; }
      if (inInput) return; // Don't intercept when typing
      const TABS: TabId[] = ["overview", "requests", "inventory", "analytics", "history", "audit"];
      if (e.key >= "1" && e.key <= "6") { e.preventDefault(); handleTabChange(TABS[parseInt(e.key) - 1]); return; }
      if (e.key === "n" || e.key === "N") { e.preventDefault(); openNewRequest("Routine"); return; }
      if (e.key === "e" || e.key === "E") { e.preventDefault(); openNewRequest("Emergency"); return; }
      if (e.key === "r" || e.key === "R") { e.preventDefault(); handleRefresh(); return; }
      if (e.key === "?") { e.preventDefault(); setIsShortcutsOpen(true); return; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* Real-time listener */
  useEffect(() => {
    if (!hospitalId) { toast.error("Not logged in."); return; }
    getDoc(doc(db, "users", hospitalId)).then(snap => { if (snap.exists()) setHospitalData(snap.data()); });
    setLoading(true);
    const q = query(collection(db, "bloodRequests"), where("hospitalId", "==", hospitalId));
    const unsub = onSnapshot(q, async (snap) => {
      try {
        const rtids = snap.docs.map(d => d.data().rtid || d.data().linkedRTID).filter(Boolean);
        let allLinkedDonations: any[] = [];
        if (rtids.length > 0) {
          for (let i = 0; i < rtids.length; i += 10) {
            try {
              const batch = rtids.slice(i, i + 10);
              const ds = await getDocs(query(collection(db, "donations"), where("linkedHrtid", "in", batch)));
              allLinkedDonations.push(...ds.docs.map(d => ({ ...d.data(), _docId: d.id })));
            } catch (_) { }
          }
        }
        const fetched: BloodRequest[] = [];
        snap.forEach(d => {
          const data = d.data();
          const linkedDonors: DonorInfo[] = allLinkedDonations
            .filter((ld: any) => ld.linkedHrtid === data.linkedRTID || ld.linkedHrtid === data.rtid)
            .map((ld: any) => ({ dRtid: ld.rtidCode || ld.rtid || "N/A", name: ld.donorName || "Anonymous", date: parseTimestamp(ld.date).toISOString(), units: parseInt(ld.units) || 1, redeemed: ld.rtidStatus === "REDEEMED" || ld.redeemed || false, administered: ld.rtidStatus === "ADMINISTERED" || ld.administered || false, administeredAt: ld.administeredAt || undefined }));
          const raw = data.urgency as string;
          const u: UrgencyLevel = raw === "Critical" || raw === "Emergency" ? "Emergency" : raw === "High" || raw === "Urgent" ? "Urgent" : "Routine";
          const unitsFulfilled = data.fulfilled ? parseInt(data.fulfilled) : linkedDonors.reduce((s: number, ld: DonorInfo) => s + (ld.redeemed || ld.administered ? ld.units || 1 : 0), 0);
          const unitsAdministered = data.unitsAdministered ? parseInt(data.unitsAdministered) : linkedDonors.reduce((s: number, ld: DonorInfo) => s + (ld.administered ? ld.units || 1 : 0), 0);
          let status = data.status as RequestStatus;
          const required = parseInt(data.units) || 0;
          if (!["EXPIRED", "CANCELLED", "CREATED", "PENDING", "CLOSED"].includes(status)) {
            if (unitsAdministered >= required && required > 0) status = "CLOSED";
            else if (unitsAdministered > 0 && unitsAdministered < required) status = "PARTIALLY ADMINISTERED";
            else if (unitsFulfilled >= required && required > 0 && unitsAdministered === 0) status = "REDEEMED";
            else if (unitsFulfilled > 0 && unitsFulfilled < required) status = "PARTIAL";
          }
          fetched.push({
            id: d.id, rtid: data.linkedRTID || data.rtid, serialNumber: data.serialNumber,
            patientName: data.patientName, bloodGroup: data.bloodGroup,
            componentType: data.componentType, transfusionIndication: data.transfusionIndication,
            unitsRequired: required, unitsFulfilled, unitsAdministered,
            requiredBy: parseTimestamp(data.requiredBy), status,
            city: data.city, createdAt: parseTimestamp(data.createdAt),
            patientMobile: data.patientMobile, patientAadhaar: data.patientAadhaar, pincode: data.pincode,
            age: data.age ? parseInt(data.age) : undefined, urgency: u,
            donors: linkedDonors, doctorName: data.doctorName, doctorRegNo: data.doctorRegNo,
            wardDepartment: data.wardDepartment, bedNumber: data.bedNumber,
            validityHours: data.validityHours || URGENCY_CONFIG[u].validityHours,
            scannedAt: data.scannedAt, scannedLocation: data.scannedLocation,
            redeemedAt: data.redeemedAt ? parseTimestamp(data.redeemedAt) : undefined,
            administeredAt: data.administeredAt ? parseTimestamp(data.administeredAt) : undefined,
            generatedBy: data.generatedBy, systemVersion: data.systemVersion,
            transfusionHistory: (data.transfusionHistory || []) as TransfusionRecord[],
          });
        });
        fetched.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        // Auto-expire
        const toExpire: string[] = [];
        fetched.forEach(r => {
          if (r.validityHours && r.createdAt) {
            const valid = new Date(r.createdAt.getTime() + r.validityHours * 3600000);
            if (new Date() > valid && !["REDEEMED", "HOSPITAL VERIFIED", "ADMINISTERED", "PARTIALLY ADMINISTERED", "CLOSED", "EXPIRED", "CANCELLED"].includes(r.status)) {
              toExpire.push(r.id); r.status = "EXPIRED";
            }
          }
        });
        if (toExpire.length > 0) await Promise.all(toExpire.map(id => updateDoc(doc(db, "bloodRequests", id), { status: "EXPIRED" }).catch(() => { })));
        setRequests(fetched);
      } catch (err: any) { toast.error("Real-time sync error", { description: err?.message }); }
      finally { setLoading(false); }
    }, () => { toast.error("Failed to connect to database"); setLoading(false); });
    return () => unsub();
  }, [hospitalId]);

  const kpis = useMemo(() => ({
    totalRequests: requests.length,
    activeRequests: requests.filter((r: BloodRequest) => ["PENDING", "PARTIAL", "PARTIAL REDEEMED", "PLEDGED", "PROCESSING"].includes(r.status) && isRequestValid(r)).length,
    totalUnits: requests.reduce((s: number, r: BloodRequest) => s + r.unitsRequired, 0),
    donationsReceived: requests.filter((r: BloodRequest) => ["REDEEMED", "HOSPITAL VERIFIED", "ADMINISTERED", "PARTIALLY ADMINISTERED", "CLOSED"].includes(r.status)).length,
    requestsRedeemed: requests.filter((r: BloodRequest) => ["REDEEMED", "HOSPITAL VERIFIED", "ADMINISTERED", "PARTIALLY ADMINISTERED", "CLOSED"].includes(r.status)).length,
    administered: requests.filter((r: BloodRequest) => ["ADMINISTERED", "PARTIALLY ADMINISTERED", "CLOSED"].includes(r.status)).length,
  }), [requests]);

  /* ── Handlers ── */
  const handleNewRequest = async (data: any) => {
    if (!hospitalId) { toast.error("Hospital ID not found."); return; }
    const reqDateTime = new Date(`${data.requiredByDate}T${data.requiredByTime}:00`);
    if (isNaN(reqDateTime.getTime())) throw new Error("Invalid date/time");
    const newHrtid = generateRtid("H");
    const serial = generateSerial();
    const validityH = URGENCY_CONFIG[data.urgency as UrgencyLevel]?.validityHours || 48;
    const now = new Date();
    await addDoc(collection(db, "bloodRequests"), {
      hospitalId, bloodBankId: "", patientName: data.patientName, patientMobile: data.mobile, patientAadhaar: data.aadhaar,
      bloodGroup: data.bloodGroup, componentType: data.componentType || "Whole Blood",
      transfusionIndication: data.transfusionIndication || "Anemia",
      units: String(data.unitsRequired), fulfilled: "0", unitsAdministered: 0, transfusionHistory: [],
      age: String(data.age), city: data.city, pincode: data.pincode,
      requiredBy: reqDateTime.toISOString(), urgency: data.urgency || "Routine",
      status: "CREATED", linkedRTID: newHrtid, rtid: newHrtid,
      serialNumber: serial, validityHours: validityH, createdAt: now.toISOString(),
      doctorName: data.doctorName || "", doctorRegNo: data.doctorRegNo || "",
      wardDepartment: data.wardDepartment || "", bedNumber: data.bedNumber || "",
      generatedBy: hospitalData?.fullName || "Hospital", systemVersion: SYSTEM_VERSION,
    });
    const newReq: BloodRequest = {
      id: "", rtid: newHrtid, serialNumber: serial,
      patientName: data.patientName, bloodGroup: data.bloodGroup as BloodGroup,
      componentType: data.componentType as BloodComponentType, transfusionIndication: data.transfusionIndication,
      unitsRequired: data.unitsRequired, unitsFulfilled: 0, unitsAdministered: 0,
      requiredBy: reqDateTime, status: "CREATED", city: data.city, createdAt: now,
      patientMobile: data.mobile, patientAadhaar: data.aadhaar, pincode: data.pincode,
      age: data.age, urgency: data.urgency as UrgencyLevel,
      donors: [], doctorName: data.doctorName, doctorRegNo: data.doctorRegNo,
      wardDepartment: data.wardDepartment, bedNumber: data.bedNumber,
      validityHours: validityH, generatedBy: hospitalData?.fullName, systemVersion: SYSTEM_VERSION, transfusionHistory: [],
    };
    toast.success(`Request Created · RTID: ${newHrtid}`, { description: `Valid for ${validityH} hours` });
    addNotif(`New ${data.urgency} request for ${data.patientName} (${data.bloodGroup})`, "new");
    openPrintWindow(newReq, hospitalData, logo);
    logAuditAction(hospitalId, hospitalData?.fullName || "Hospital", "REQUEST_CREATED", `Created ${data.urgency} request for ${data.patientName} (${data.bloodGroup}, ${data.unitsRequired}u)`, newHrtid);
  };

  const handleMarkComplete = async (reqId: string, unitsNow: number, notes: string) => {
    const r = requests.find((x: BloodRequest) => x.id === reqId);
    if (!r) return;
    const now = new Date();
    const already = r.unitsAdministered ?? 0;
    const newTotal = already + unitsNow;
    const allDone = newTotal >= r.unitsRequired;
    const newStatus: RequestStatus = allDone ? "CLOSED" : "PARTIALLY ADMINISTERED";
    const newRecord: TransfusionRecord = { recordedAt: now.toISOString(), unitsAdministered: unitsNow, notes: notes || "", administeredBy: hospitalData?.fullName || "Hospital", donorRtids: (r.donors || []).slice(0, unitsNow).map((d: DonorInfo) => d.dRtid) };
    const updatedHistory = [...(r.transfusionHistory || []), newRecord];
    // Single Firestore write: Verify + Administer in one shot
    await updateDoc(doc(db, "bloodRequests", reqId), {
      status: newStatus,
      unitsAdministered: newTotal,
      administeredAt: now.toISOString(),
      administrationNotes: notes || "",
      administeredBy: hospitalData?.fullName || "Hospital",
      transfusionHistory: updatedHistory.map(h => ({ ...h })),
      // Hospital Verified fields (combined into same write)
      redeemedAt: r.redeemedAt || now.toISOString(),
      scannedLocation: hospitalData?.fullName || "Hospital",
      hospitalVerified: true,
      hospitalVerifiedAt: now.toISOString(),
    });
    // Update all linked donor/donation records
    const donorUpdatePayload = { administeredAt: now.toISOString(), rtidStatus: allDone ? "ADMINISTERED" : "PARTIALLY ADMINISTERED", patientAdministered: r.patientName, hospitalAdministered: hospitalData?.fullName || "Hospital" };
    if (r.donors && r.donors.length > 0) { await Promise.all(r.donors.map(async (donor: DonorInfo) => { try { const donQ = await getDocs(query(collection(db, "donations"), where("rtidCode", "==", donor.dRtid))); donQ.forEach(async donDoc => { await updateDoc(donDoc.ref, donorUpdatePayload); }); } catch (_) { } })); }
    try { const byHrtid = await getDocs(query(collection(db, "donations"), where("linkedHrtid", "==", r.rtid))); byHrtid.forEach(async d => { await updateDoc(d.ref, donorUpdatePayload); }); } catch (_) { }
    const label = allDone ? "✅ All units administered — request CLOSED" : `💉 ${unitsNow} unit(s) verified & administered (${newTotal}/${r.unitsRequired} total)`;
    toast.success(label, { description: "Status, Donor & Blood Bank dashboards updated" });
    addNotif(`${newTotal}/${r.unitsRequired} units verified & administered for ${r.patientName} · RTID ${r.rtid}`, "update");
    if (hospitalId) logAuditAction(hospitalId, hospitalData?.fullName || "Hospital", "BLOOD_ADMINISTERED", `Verified & administered ${unitsNow}u to ${r.patientName} (${newTotal}/${r.unitsRequired} total)`, r.rtid);
  };

  const handleDelete = (id: string) => {
    const r = requests.find((x: BloodRequest) => x.id === id);
    if (!r || !canDeleteRequest(r)) { Swal.fire("Cannot Delete", "Requests with donations/administrations cannot be deleted.", "warning"); return; }
    Swal.fire({ title: "Delete Request?", text: "This cannot be undone.", icon: "warning", showCancelButton: true, confirmButtonColor: "#8B0000", confirmButtonText: "Yes, delete" })
      .then(async res => {
        if (res.isConfirmed) {
          try {
            await deleteDoc(doc(db, "bloodRequests", id));
            toast.success("Deleted");
            if (hospitalId) logAuditAction(hospitalId, hospitalData?.fullName || "Hospital", "REQUEST_DELETED", `Deleted request for ${r.patientName} (${r.bloodGroup})`, r.rtid);
          } catch { toast.error("Failed"); }
        }
      });
  };

  /* Edit request handler */
  const handleEditRequest = (r: BloodRequest) => { setEditTarget(r); setIsEditOpen(true); };
  const handleSaveEdit = async (id: string, updates: Record<string, any>) => {
    await updateDoc(doc(db, "bloodRequests", id), updates);
    if (hospitalId) logAuditAction(hospitalId, hospitalData?.fullName || "Hospital", "REQUEST_EDITED", `Edited request ${editTarget?.rtid}: fields updated`, editTarget?.rtid);
  };

  /* Search result selection — jump to requests tab & highlight */
  const handleSearchSelect = useCallback((r: BloodRequest) => {
    setActiveTab("requests");
    setTabKey((k: number) => k + 1);
  }, []);

  /* Duplicate request — open new request modal pre-filled */
  const handleDuplicate = useCallback((r: BloodRequest) => {
    setDuplicateSource(r);
    setModalUrgency(r.urgency || "Routine");
    setIsRequestModalOpen(true);
    toast.info(`Duplicating request for ${r.patientName}`, { description: "Pre-filled form opened" });
  }, []);

  const handleLogout = () => {
    Swal.fire({ title: "Logout?", icon: "question", showCancelButton: true, confirmButtonColor: "#8B0000", confirmButtonText: "Yes, logout" })
      .then(res => { if (res.isConfirmed) onLogout(); });
  };

  const addNotif = (message: string, type: Notification["type"]) => setNotifications((prev: Notification[]) => [{ id: Date.now().toString(), message, time: "Just now", type, read: false }, ...prev]);
  const markRead = (id: string) => setNotifications((prev: Notification[]) => prev.map((n: Notification) => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifications((prev: Notification[]) => prev.map((n: Notification) => ({ ...n, read: true })));
  const clearNotifs = () => setNotifications([]);
  const openNewRequest = (urg: UrgencyLevel) => { setModalUrgency(urg); setIsRequestModalOpen(true); };
  const openComplete = async (r: BloodRequest) => { 
    Swal.fire({
      title: 'Verifying Credits...',
      text: 'Checking if redeemed credits are available...',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    try {
      const linkedRtids = [r.rtid];
      if (r.linkedRTID && r.linkedRTID !== r.rtid) linkedRtids.push(r.linkedRTID);
      
      const donQ = await getDocs(query(collection(db, "donations"), where("linkedHrtid", "in", linkedRtids)));
      let liveRedeemedCredit = 0;
      donQ.forEach(docSnap => {
        const d = docSnap.data();
        if (d.rtidStatus === "REDEEMED" || d.redeemed === true || d.rtidStatus === "ADMINISTERED" || d.administered === true || d.rtidStatus === "PARTIALLY ADMINISTERED") {
          liveRedeemedCredit += (parseInt(d.units) || 1);
        }
      });
      
      const alreadyAdministered = r.unitsAdministered || 0;
      
      if (liveRedeemedCredit <= alreadyAdministered) {
         Swal.fire({
           icon: 'error',
           title: 'Verification Failed',
           text: 'No redeemed credit available for this patient. Please wait for Blood Bank to process donations first.',
           confirmButtonColor: "#8B0000"
         });
         return;
      }
      
      const updatedReq = { ...r, unitsFulfilled: Math.max(r.unitsFulfilled || 0, liveRedeemedCredit) };
      Swal.close();
      setCompleteTarget(updatedReq); 
      setIsCompleteOpen(true); 
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to verify credits. Please try again.',
        confirmButtonColor: "#8B0000"
      });
    }
  };
  const handleTabChange = (tab: TabId) => { setActiveTab(tab); setTabKey((k: number) => k + 1); };
  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

  return (
    <ErrorBoundary fallbackTitle="Hospital Dashboard Error">
      <style>{HD_STYLES}</style>
      <div className="hd-root no-print">
        {/* HEADER */}
        <header className="hd-header no-print">
          <div className="container mx-auto px-3 sm:px-5 max-w-7xl relative z-10">
            <div className="flex items-center gap-2 py-2.5">
              <div className="hd-logo-frame"><img src={logo} alt="RaktPort" className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-lg block" /></div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="hd-brand text-[1.1rem] sm:text-[1.25rem]">RaktPort</span>
                  <span className="text-[9px] text-red-200/40 uppercase tracking-widest font-semibold hidden sm:inline">Hospital Portal</span>
                  {!loading && (<span className="flex items-center gap-1 text-[9px] text-green-300/70 hidden sm:flex" title="Real-time sync active"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />Live</span>)}
                </div>
                {hospitalData?.fullName && (<div className="hd-hosp-name"><Building2 className="w-2.5 h-2.5 flex-shrink-0 opacity-70" /><span className="truncate max-w-[150px] sm:max-w-xs">{hospitalData.fullName}</span></div>)}
              </div>
              <div className="hd-loc-chip hidden lg:flex"><MapPin className="w-2.5 h-2.5" />{hospitalData?.district || "…"}, {hospitalData?.pincode || "…"}</div>
              {/* Global search button */}
              <button onClick={() => setIsSearchOpen(true)} className="hd-hdr-btn hidden sm:flex" title="Search (Ctrl+K)" aria-label="Search"><Search className="w-3.5 h-3.5" /></button>
              <button onClick={() => openNewRequest("Emergency")} className="hd-emg-btn hidden sm:flex"><Siren className="w-3.5 h-3.5" /><span>Emergency</span></button>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => setIsProfileOpen(true)} className="hd-profile-btn hidden sm:flex" title="Hospital Profile"><UserCircle className="w-3.5 h-3.5" /><span className="hidden md:inline">Profile</span></button>
                <button onClick={() => setIsPatientHistoryOpen(true)} className="hd-hdr-btn hidden sm:flex" title="Patient History"><Users className="w-3.5 h-3.5" /></button>
                {/* Dark mode toggle */}
                <button onClick={toggleDark} className="hd-hdr-btn" title={isDark ? "Light Mode" : "Dark Mode"} aria-label="Toggle Theme">{isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}</button>
                <button onClick={() => setIsShortcutsOpen(true)} className="hd-hdr-btn hidden sm:flex" title="Keyboard Shortcuts (?)"><Keyboard className="w-3.5 h-3.5" /></button>
                <button onClick={handleRefresh} className="hd-hdr-btn" title="Refresh" aria-label="Refresh"><RefreshCw className="w-3.5 h-3.5" /></button>
                <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="hd-hdr-btn" aria-label="Notifications"><Bell className="w-4 h-4" />{unreadCount > 0 && <span className="hd-notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}</button>
                <button onClick={handleLogout} className="hd-logout-btn" aria-label="Logout"><LogOut className="w-3.5 h-3.5" /><span className="hd-logout-text">Logout</span></button>
              </div>
            </div>
            <div className="flex items-center gap-2 pb-2 sm:hidden">
              <MapPin className="w-2.5 h-2.5 text-red-200/40 flex-shrink-0" />
              <span className="text-[10px] text-red-200/40">{hospitalData?.district || "…"}, {hospitalData?.pincode || "…"}</span>
              <button onClick={() => setIsSearchOpen(true)} className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-red-200/60 hover:text-white transition-colors"><Search className="w-3 h-3" />Search</button>
              <button onClick={handleExportCSV} className="flex items-center gap-1 text-[10px] font-semibold text-red-200/60 hover:text-white transition-colors"><FileDown className="w-3 h-3" />CSV</button>
            </div>
          </div>
        </header>

        {/* NAV */}
        <nav className="hd-nav no-print">
          <div className="container mx-auto max-w-7xl">
            <div className="hd-nav-inner">
              {([
                { id: "overview", label: "Dashboard", icon: "🏥" },
                { id: "requests", label: "All Requests", icon: "📋", badge: requests.length },
                { id: "inventory", label: "Blood Inventory", icon: "🩸" },
                { id: "analytics", label: "Analytics", icon: "📊" },
                { id: "history", label: "Transfusion History", icon: "💉", badge: requests.filter((r: BloodRequest) => r.unitsAdministered > 0).length || undefined },
                { id: "audit", label: "Audit Trail", icon: "🛡️" },
              ] as any[]).map(t => (
                <button key={t.id} onClick={() => handleTabChange(t.id)} className={`hd-nav-tab ${activeTab === t.id ? "hd-nav-active" : ""}`}>
                  <span>{t.icon}</span><span>{t.label}</span>
                  {t.badge > 0 && (<span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${activeTab === t.id ? "bg-white/20 text-white" : "bg-[#8B0000] text-white"}`}>{t.badge}</span>)}
                </button>
              ))}
              <ReportGenerator requests={requests} hospitalName={hospitalData?.fullName || "Hospital"} hospitalLocation={`${hospitalData?.district || ""}, ${hospitalData?.pincode || ""}`} />
              <button onClick={handleExportCSV} className="hd-nav-tab hidden sm:flex items-center gap-1.5 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"><FileDown className="w-3.5 h-3.5" /> CSV</button>
              <div className="ml-auto flex items-center gap-2">
                <button onClick={() => openNewRequest("Routine")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white" style={{ background: "linear-gradient(135deg,#8B0000,#b30000)" }}><Plus className="w-3.5 h-3.5" />New Request</button>
              </div>
            </div>
          </div>
        </nav>

        <NotifDrawer isOpen={isNotifOpen} notifs={notifications} onClose={() => setIsNotifOpen(false)} onMarkRead={markRead} onMarkAllRead={markAllRead} onClear={clearNotifs} />
        <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} hospital={hospitalData} />
        <CompleteModal isOpen={isCompleteOpen} onClose={() => setIsCompleteOpen(false)} request={completeTarget} onConfirm={(id: string, unitsNow: number, notes: string) => handleMarkComplete(id, unitsNow, notes)} />
        <PatientHistoryModal isOpen={isPatientHistoryOpen} onClose={() => setIsPatientHistoryOpen(false)} requests={requests} />
        <EditRequestModal isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); setEditTarget(null); }} onSave={handleSaveEdit} request={editTarget} />
        <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} requests={requests} onSelectRequest={handleSearchSelect} />
        <KeyboardShortcuts isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />

        {/* MAIN CONTENT */}
        <main className="container mx-auto px-3 sm:px-5 py-5 sm:py-7 max-w-7xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="relative w-14 h-14"><div className="w-14 h-14 rounded-full border-4 border-red-100 dark:border-red-900/40 border-t-[#8B0000] animate-spin" /><Droplet className="absolute inset-0 m-auto w-5 h-5 text-[#8B0000] fill-[#8B0000]" /></div>
              <p className="text-sm text-gray-400 font-medium animate-pulse">Loading dashboard…</p>
              <p className="text-xs text-gray-300 dark:text-gray-600">Live sync enabled</p>
            </div>
          ) : (
            <ErrorBoundary fallbackTitle="Content Error">
              <div key={tabKey}>
                {activeTab === "overview" && (
                  <PremiumDashboard requests={requests} hospitalData={hospitalData} kpis={kpis}
                    onNewRequest={openNewRequest} onViewQR={(r: BloodRequest) => { setSelectedRequest(r); setIsQRModalOpen(true); }}
                    onDelete={handleDelete} onPrint={handlePrint}
                    onMarkComplete={openComplete}
                    onWhatsAppShare={handleWhatsAppShare} onExportCSV={handleExportCSV} />
                )}
                {activeTab === "requests" && (
                  <RequestsView requests={requests}
                    onViewQR={(r: BloodRequest) => { setSelectedRequest(r); setIsQRModalOpen(true); }}
                    onCopyRTID={(rtid: string) => { navigator.clipboard.writeText(rtid).catch(() => { }); toast.success("RTID copied!"); }}
                    onDelete={handleDelete} onPrint={handlePrint}
                    onNewRequest={openNewRequest}
                    onMarkComplete={openComplete} onWhatsAppShare={handleWhatsAppShare}
                    onEditRequest={handleEditRequest} onDuplicate={handleDuplicate} />
                )}
                {activeTab === "inventory" && <InventoryView requests={requests} />}
                {activeTab === "analytics" && <AnalyticsView requests={requests} />}
                {activeTab === "history" && <TransfusionHistoryView requests={requests} />}
                {activeTab === "audit" && hospitalId && <AuditTrailView hospitalId={hospitalId} />}
              </div>
            </ErrorBoundary>
          )}
        </main>

        {/* FAB */}
        <button className="hd-fab no-print hidden sm:flex" onClick={() => openNewRequest("Routine")}><Plus className="w-5 h-5" /><span>New Request</span></button>

        {/* Mobile Bottom Nav */}
        <nav className="hd-bottom-nav no-print sm:hidden">
          <button className={`hd-bnav-btn ${activeTab === "overview" ? "active" : ""}`} onClick={() => handleTabChange("overview")}><span className="bnav-icon">🏥</span><span className="hd-bnav-lbl">Home</span></button>
          <button className={`hd-bnav-btn ${activeTab === "requests" ? "active" : ""} relative`} onClick={() => handleTabChange("requests")}><span className="bnav-icon">📋</span><span className="hd-bnav-lbl">Requests</span>{requests.length > 0 && <span className="absolute -top-1 right-1 bg-[#8B0000] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">{requests.length > 9 ? "9+" : requests.length}</span>}</button>
          <button className="hd-bnav-btn" onClick={() => openNewRequest("Emergency")} style={{ color: "#b91c1c" }}><span className="bnav-icon">🚨</span><span className="hd-bnav-lbl">Emergency</span></button>
          <button className={`hd-bnav-btn ${activeTab === "analytics" ? "active" : ""}`} onClick={() => handleTabChange("analytics")}><span className="bnav-icon">📊</span><span className="hd-bnav-lbl">Analytics</span></button>
          <button className="hd-bnav-btn" onClick={() => setIsProfileOpen(true)}><span className="bnav-icon">👤</span><span className="hd-bnav-lbl">Profile</span></button>
        </nav>

        <NewRequestModal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} onSubmit={handleNewRequest} defaultCity={hospitalData?.district || ""} defaultPincode={hospitalData?.pincode || ""} defaultUrgency={modalUrgency} hospitalName={hospitalData?.fullName || "Hospital"} />
        <QRModal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} request={selectedRequest} />
      </div>
    </ErrorBoundary>
  );
};

export default HospitalDashboard;
