// hospital/HospitalDashboard.tsx — Production UI v5.0
// All original Firebase logic, handlers, and state preserved exactly.
// Only the JSX/UI layer has been redesigned.

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import {
  Bell, LogOut, Plus, QrCode, Siren, FileDown, MapPin,
  Building2, RefreshCw, Droplet, UserCircle, Search, Users, Shield,
  Moon, Sun, Keyboard, FileText, Activity
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import logo from '../../assets/raktport-logo.png';
import { db } from '../../firebase';
import {
  collection, query, where, getDocs, addDoc, deleteDoc,
  doc, getDoc, updateDoc, onSnapshot
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
// @ts-ignore
import { BLOOD_GROUPS, generateRtid } from "@/lib/bloodbank-utils";

import {
  HD_STYLES, SYSTEM_VERSION, URGENCY_CONFIG, getStatusMeta, LOCKED_STATUSES,
  formatDate, formatTime, timeAgo, generateSerial, isRequestValid,
  getTimeRemaining, getValidityPct, canDeleteRequest, getQRPayload, parseTimestamp,
  ErrorBoundary, QRModal, ProfileModal, NotifDrawer, CompleteModal, NewRequestModal,
  PremiumDashboard, RequestsView, TransfusionHistoryView,
  openPrintWindow,
  InventoryView, PatientHistoryModal, GlobalSearch, EditRequestModal, AuditTrailView,
  logAuditAction,
  AnalyticsView, KeyboardShortcuts, ReportGenerator,
} from "./index";
import type {
  BloodRequest, BloodGroup, UrgencyLevel, RequestStatus,
  DonorInfo, TransfusionRecord, Notification, BloodComponentType,
} from "./types";

type TabId = "overview" | "requests" | "history" | "inventory" | "audit" | "analytics";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "overview", label: "Dashboard", icon: "🏥" },
  { id: "requests", label: "All Requests", icon: "📋" },
  { id: "inventory", label: "Blood Inventory", icon: "🩸" },
  { id: "analytics", label: "Analytics", icon: "📊" },
  { id: "history", label: "Transfusion History", icon: "💉" },
  { id: "audit", label: "Audit Trail", icon: "🛡️" },
];

/* ═══════════════════════════════════════════
   MAIN DASHBOARD CONTROLLER
═══════════════════════════════════════════ */
const HospitalDashboard = ({ onLogout }: { onLogout: () => void }) => {
  // ── All original state preserved ──
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isPatientHistoryOpen, setIsPatientHistoryOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BloodRequest | null>(null);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [duplicateSource, setDuplicateSource] = useState<BloodRequest | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [hospitalId, setHospitalId] = useState<string | null>(
    () => localStorage.getItem("userId") || localStorage.getItem("userUid") || null
  );

  // ── All original handlers preserved exactly ──

  const handleExportCSV = useCallback(() => {
    if (!requests.length) { toast.error("No requests to export"); return; }
    const headers = ["RTID", "Serial No", "Patient", "Age", "Blood Group", "Component", "Units", "Urgency", "Status", "Required By", "Created At", "Doctor", "Ward", "Bed"];
    const csvRows = requests.map((r: BloodRequest) => [
      r.rtid, r.serialNumber || "", r.patientName, r.age || "", r.bloodGroup,
      r.componentType || "Whole Blood", r.unitsRequired, r.urgency || "Routine", r.status,
      `${formatDate(r.requiredBy)} ${formatTime(r.requiredBy)}`,
      `${formatDate(r.createdAt)} ${formatTime(r.createdAt)}`,
      r.doctorName || "", r.wardDepartment || "", r.bedNumber || ""
    ]);
    const csv = [headers, ...csvRows].map((r: any[]) => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RaktPort_Requests_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
    if (hospitalId) logAuditAction(hospitalId, hospitalData?.fullName || "Hospital", "CSV_EXPORTED", `Exported ${requests.length} requests to CSV`);
  }, [requests, hospitalId, hospitalData]);

  const handleWhatsAppShare = useCallback((r: BloodRequest) => {
    const uc = URGENCY_CONFIG[r.urgency || "Routine"];
    const msg = `🩸 *RaktPort Blood Request*\n\n${uc.emoji} *Urgency:* ${r.urgency || "Routine"}\n*Patient:* ${r.patientName}\n*Blood Group:* ${r.bloodGroup}\n*Component:* ${r.componentType || "Whole Blood"} × ${r.unitsRequired} unit(s)\n*Required By:* ${formatDate(r.requiredBy)} ${formatTime(r.requiredBy)}\n*Hospital:* ${hospitalData?.fullName || "Hospital"}\n*Location:* ${hospitalData?.district || ""}, ${hospitalData?.pincode || ""}\n*RTID:* \`${r.rtid}\`\n\n_Please contact the hospital immediately if you can help._`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  }, [hospitalData]);

  const handleRefresh = useCallback(() => {
    setRefreshKey((k: number) => k + 1);
    toast.info("Refreshing data...");
  }, []);

  const handlePrint = useCallback((r: BloodRequest) => {
    openPrintWindow(r, hospitalData, logo);
    if (hospitalId) logAuditAction(hospitalId, hospitalData?.fullName || "Hospital", "PRINT_SLIP", `Printed slip for ${r.patientName} (${r.bloodGroup})`, r.rtid);
  }, [hospitalData, hospitalId]);

  const toggleDark = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("hd-dark", next ? "1" : "0");
  }, [isDark]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const inInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setIsSearchOpen(true); return; }
      if (inInput) return;
      const TIDS: TabId[] = ["overview", "requests", "inventory", "analytics", "history", "audit"];
      if (e.key >= "1" && e.key <= "6") { e.preventDefault(); handleTabChange(TIDS[parseInt(e.key) - 1]); return; }
      if (e.key === "n" || e.key === "N") { e.preventDefault(); openNewRequest("Routine"); return; }
      if (e.key === "e" || e.key === "E") { e.preventDefault(); openNewRequest("Emergency"); return; }
      if (e.key === "r" || e.key === "R") { e.preventDefault(); handleRefresh(); return; }
      if (e.key === "?") { e.preventDefault(); setIsShortcutsOpen(true); return; }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Real-time Firestore listener (original logic preserved) ──
  useEffect(() => {
    const auth = getAuth();
    let unsubDocs = () => { };
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      unsubDocs();
      const resolvedId = user?.uid || hospitalId || localStorage.getItem("userId") || localStorage.getItem("userUid");
      if (resolvedId && resolvedId !== hospitalId) setHospitalId(resolvedId);
      if (!resolvedId) { toast.error("Not logged in."); setLoading(false); return; }
      getDoc(doc(db, "users", resolvedId)).then(snap => { if (snap.exists()) setHospitalData(snap.data()); });
      const q = query(collection(db, "bloodRequests"), where("hospitalId", "==", resolvedId));
      unsubDocs = onSnapshot(q, async (snap) => {
        try {
          const rtids = snap.docs.map(d => d.data().rtid || d.data().linkedRTID).filter(Boolean);
          let allLinkedDonations: any[] = [];
          if (rtids.length > 0) {
            const uniqueRtids = Array.from(new Set(rtids));
            for (let i = 0; i < uniqueRtids.length; i += 10) {
              try {
                const batch = uniqueRtids.slice(i, i + 10);
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
              .map((ld: any) => ({
                dRtid: ld.rtidCode || ld.rtid || "N/A", name: ld.donorName || "Anonymous",
                date: parseTimestamp(ld.date).toISOString(), units: parseInt(ld.units) || 1,
                redeemed: ld.rtidStatus === "REDEEMED" || ld.status === "REDEEMED" || ld.redeemed || false,
                administered: ld.rtidStatus === "ADMINISTERED" || ld.status === "ADMINISTERED" || ld.administered || false,
                administeredAt: ld.administeredAt || undefined
              }));
            const raw = data.urgency as string;
            const u: UrgencyLevel = raw === "Critical" || raw === "Emergency" ? "Emergency" : raw === "High" || raw === "Urgent" ? "Urgent" : "Routine";
            const fulfilledFromDoc = (data.fulfilled != null && data.fulfilled !== "" && data.fulfilled !== "0") ? parseInt(data.fulfilled) : 0;
            const fulfilledFromDonors = linkedDonors.reduce((s: number, ld: DonorInfo) => s + (ld.redeemed || ld.administered ? ld.units || 1 : 0), 0);
            const unitsFulfilledFromReqField = data.unitsFulfilled ? parseInt(data.unitsFulfilled) : 0;
            const unitsFulfilled = Math.max(fulfilledFromDoc, fulfilledFromDonors, unitsFulfilledFromReqField);
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
              patientName: data.patientName, bloodGroup: data.bloodGroup, componentType: data.componentType,
              transfusionIndication: data.transfusionIndication, unitsRequired: required,
              unitsFulfilled, unitsAdministered, requiredBy: parseTimestamp(data.requiredBy),
              status, city: data.city, createdAt: parseTimestamp(data.createdAt),
              patientMobile: data.patientMobile, patientAadhaar: data.patientAadhaar, pincode: data.pincode,
              age: data.age ? parseInt(data.age) : undefined, urgency: u, donors: linkedDonors,
              doctorName: data.doctorName, doctorRegNo: data.doctorRegNo,
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
        } catch (err: any) {
          toast.error("Real-time sync error", { description: err?.message });
        } finally { setLoading(false); }
      }, () => { toast.error("Failed to connect to database"); setLoading(false); });
    });
    return () => { unsubAuth(); unsubDocs(); };
  }, [hospitalId, refreshKey]);

  // ── KPIs (original) ──
  const kpis = useMemo(() => ({
    totalRequests: requests.length,
    activeRequests: requests.filter((r: BloodRequest) => ["PENDING", "PARTIAL", "PARTIAL REDEEMED", "PLEDGED", "PROCESSING"].includes(r.status) && isRequestValid(r)).length,
    totalUnits: requests.reduce((s: number, r: BloodRequest) => s + r.unitsRequired, 0),
    donationsReceived: requests.filter((r: BloodRequest) => ["REDEEMED", "HOSPITAL VERIFIED", "ADMINISTERED", "PARTIALLY ADMINISTERED", "CLOSED"].includes(r.status)).length,
    requestsRedeemed: requests.filter((r: BloodRequest) => ["REDEEMED", "HOSPITAL VERIFIED", "ADMINISTERED", "PARTIALLY ADMINISTERED", "CLOSED"].includes(r.status)).length,
    administered: requests.filter((r: BloodRequest) => ["ADMINISTERED", "PARTIALLY ADMINISTERED", "CLOSED"].includes(r.status)).length,
  }), [requests]);

  const handleNewRequest = async (data: any) => {
    if (!hospitalId) { toast.error("Hospital ID not found."); return; }
    const reqDateTime = new Date(`${data.requiredByDate}T${data.requiredByTime}:00`);
    if (isNaN(reqDateTime.getTime())) throw new Error("Invalid date/time");
    const newHrtid = generateRtid("H");
    const serial = generateSerial();
    const validityH = URGENCY_CONFIG[data.urgency as UrgencyLevel]?.validityHours || 48;
    const now = new Date();
    await addDoc(collection(db, "bloodRequests"), {
      hospitalId, bloodBankId: "", patientName: data.patientName, patientMobile: data.mobile,
      patientAadhaar: data.aadhaar, bloodGroup: data.bloodGroup, componentType: data.componentType || "Whole Blood",
      transfusionIndication: data.transfusionIndication || "Anemia",
      units: String(data.unitsRequired), fulfilled: "0", unitsAdministered: 0, transfusionHistory: [],
      age: String(data.age), city: data.city, pincode: data.pincode,
      requiredBy: reqDateTime.toISOString(), urgency: data.urgency || "Routine",
      status: "CREATED", linkedRTID: newHrtid, rtid: newHrtid, serialNumber: serial,
      validityHours: validityH, createdAt: now.toISOString(),
      doctorName: data.doctorName || "", doctorRegNo: data.doctorRegNo || "",
      wardDepartment: data.wardDepartment || "", bedNumber: data.bedNumber || "",
      generatedBy: hospitalData?.fullName || "Hospital", systemVersion: SYSTEM_VERSION,
    });
    const newReq: BloodRequest = {
      id: "", rtid: newHrtid, serialNumber: serial, patientName: data.patientName,
      bloodGroup: data.bloodGroup as BloodGroup, componentType: data.componentType as BloodComponentType,
      transfusionIndication: data.transfusionIndication, unitsRequired: data.unitsRequired,
      unitsFulfilled: 0, unitsAdministered: 0, requiredBy: reqDateTime,
      status: "CREATED", city: data.city, createdAt: now, patientMobile: data.mobile,
      patientAadhaar: data.aadhaar, pincode: data.pincode, age: data.age,
      urgency: data.urgency as UrgencyLevel, donors: [], doctorName: data.doctorName,
      doctorRegNo: data.doctorRegNo, wardDepartment: data.wardDepartment,
      bedNumber: data.bedNumber, validityHours: validityH,
      generatedBy: hospitalData?.fullName, systemVersion: SYSTEM_VERSION, transfusionHistory: [],
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
    const newRecord: TransfusionRecord = {
      recordedAt: now.toISOString(), unitsAdministered: unitsNow, notes: notes || "",
      administeredBy: hospitalData?.fullName || "Hospital",
      donorRtids: (r.donors || []).slice(0, unitsNow).map((d: DonorInfo) => d.dRtid)
    };
    const updatedHistory = [...(r.transfusionHistory || []), newRecord];
    await updateDoc(doc(db, "bloodRequests", reqId), {
      status: newStatus, unitsAdministered: newTotal, administeredAt: now.toISOString(),
      administrationNotes: notes || "", administeredBy: hospitalData?.fullName || "Hospital",
      transfusionHistory: updatedHistory.map(h => ({ ...h })),
      redeemedAt: r.redeemedAt || now.toISOString(),
      scannedLocation: hospitalData?.fullName || "Hospital",
      hospitalVerified: true, hospitalVerifiedAt: now.toISOString(),
    });
    const donorUpdatePayload = {
      administeredAt: now.toISOString(),
      rtidStatus: allDone ? "ADMINISTERED" : "PARTIALLY ADMINISTERED",
      patientAdministered: r.patientName, hospitalAdministered: hospitalData?.fullName || "Hospital"
    };
    if (r.donors && r.donors.length > 0) {
      await Promise.all(r.donors.map(async (donor: DonorInfo) => {
        try {
          const donQ = await getDocs(query(collection(db, "donations"), where("rtidCode", "==", donor.dRtid)));
          donQ.forEach(async donDoc => { await updateDoc(donDoc.ref, donorUpdatePayload); });
        } catch (_) { }
      }));
    }
    try {
      const byHrtid = await getDocs(query(collection(db, "donations"), where("linkedHrtid", "==", r.rtid)));
      byHrtid.forEach(async d => { await updateDoc(d.ref, donorUpdatePayload); });
    } catch (_) { }
    const label = allDone ? "✅ All units administered — request CLOSED" : `💉 ${unitsNow} unit(s) verified & administered (${newTotal}/${r.unitsRequired} total)`;
    toast.success(label, { description: "Status, Donor & Blood Bank dashboards updated" });
    addNotif(`${newTotal}/${r.unitsRequired} units verified & administered for ${r.patientName} · RTID ${r.rtid}`, "update");
    if (hospitalId) logAuditAction(hospitalId, hospitalData?.fullName || "Hospital", "BLOOD_ADMINISTERED", `Verified & administered ${unitsNow}u to ${r.patientName} (${newTotal}/${r.unitsRequired} total)`, r.rtid);
  };

  const handleDelete = (id: string) => {
    const r = requests.find((x: BloodRequest) => x.id === id);
    if (!r || !canDeleteRequest(r)) { Swal.fire("Cannot Delete", "Requests with donations/administrations cannot be deleted.", "warning"); return; }
    Swal.fire({ title: "Delete Request?", text: "This cannot be undone.", icon: "warning", showCancelButton: true, confirmButtonColor: "#C41C38", confirmButtonText: "Yes, delete" })
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

  const handleEditRequest = (r: BloodRequest) => { setEditTarget(r); setIsEditOpen(true); };
  const handleSaveEdit = async (id: string, updates: Record<string, any>) => {
    await updateDoc(doc(db, "bloodRequests", id), updates);
    if (hospitalId) logAuditAction(hospitalId, hospitalData?.fullName || "Hospital", "REQUEST_EDITED", `Edited request ${editTarget?.rtid}: fields updated`, editTarget?.rtid);
  };

  const handleSearchSelect = useCallback((r: BloodRequest) => {
    setActiveTab("requests"); setTabKey((k: number) => k + 1);
  }, []);

  const handleDuplicate = useCallback((r: BloodRequest) => {
    setDuplicateSource(r); setModalUrgency(r.urgency || "Routine");
    setIsRequestModalOpen(true);
    toast.info(`Duplicating request for ${r.patientName}`, { description: "Pre-filled form opened" });
  }, []);

  const handleLogout = () => {
    Swal.fire({ title: "Logout?", icon: "question", showCancelButton: true, confirmButtonColor: "#C41C38", confirmButtonText: "Yes, logout" })
      .then(res => { if (res.isConfirmed) onLogout(); });
  };

  const addNotif = (message: string, type: Notification["type"]) => setNotifications((prev: Notification[]) => [{ id: Date.now().toString(), message, time: "Just now", type, read: false }, ...prev]);
  const markRead = (id: string) => setNotifications((prev: Notification[]) => prev.map((n: Notification) => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifications((prev: Notification[]) => prev.map((n: Notification) => ({ ...n, read: true })));
  const clearNotifs = () => setNotifications([]);
  const openNewRequest = (urg: UrgencyLevel) => { setModalUrgency(urg); setIsRequestModalOpen(true); };

  const openComplete = async (r: BloodRequest) => {
    Swal.fire({ title: 'Verifying Credits...', text: 'Checking if redeemed credits are available...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
    try {
      const linkedRtids = [r.rtid];
      if (r.linkedRTID && r.linkedRTID !== r.rtid) linkedRtids.push(r.linkedRTID);
      const donQ = await getDocs(query(collection(db, "donations"), where("linkedHrtid", "in", linkedRtids)));
      let liveRedeemedCredit = 0;
      donQ.forEach(docSnap => {
        const d = docSnap.data();
        const st = (d.status || "").toUpperCase(); const rst = (d.rtidStatus || "").toUpperCase();
        if (st === "REDEEMED" || st === "ADMINISTERED" || st === "PARTIALLY ADMINISTERED" ||
          rst === "REDEEMED" || rst === "ADMINISTERED" || rst === "PARTIALLY ADMINISTERED" ||
          d.redeemed === true || d.administered === true) {
          liveRedeemedCredit += (parseInt(d.units) || 1);
        }
      });
      const requestFulfilled = r.unitsFulfilled || 0;
      if (["REDEEMED", "HOSPITAL VERIFIED", "PARTIALLY ADMINISTERED", "PARTIAL"].includes(r.status) && requestFulfilled > liveRedeemedCredit) {
        liveRedeemedCredit = requestFulfilled;
      }
      const alreadyAdministered = r.unitsAdministered || 0;
      if (liveRedeemedCredit <= alreadyAdministered) {
        Swal.fire({ icon: 'error', title: 'Verification Failed', text: 'No redeemed credit available for this patient. Please wait for Blood Bank to process donations first.', confirmButtonColor: "#C41C38" });
        return;
      }
      const updatedReq = { ...r, unitsFulfilled: Math.max(r.unitsFulfilled || 0, liveRedeemedCredit) };
      Swal.close();
      setCompleteTarget(updatedReq); setIsCompleteOpen(true);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to verify credits. Please try again.', confirmButtonColor: "#C41C38" });
    }
  };

  const handleTabChange = (tab: TabId) => { setActiveTab(tab); setTabKey((k: number) => k + 1); };
  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

  // ── Emergency count for badge ──
  const emergencyCount = useMemo(() =>
    requests.filter(r => r.urgency === "Emergency" && isRequestValid(r) && !["CLOSED", "ADMINISTERED", "CANCELLED", "EXPIRED"].includes(r.status)).length,
    [requests]
  );

  /* ════════════════════════
     RENDER — Production UI
  ════════════════════════ */
  return (
    <ErrorBoundary fallbackTitle="Hospital Dashboard Error">
      <style>{HD_STYLES}</style>
      <div className="hd-root no-print">

        {/* ── HEADER ── */}
        <header className="hd-header no-print">
          <div className="hd-header-inner">
            {/* Logo + Brand */}
            <div className="hd-logo-frame">
              <img src={logo} alt="RaktPort" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="hd-brand">RaktPort</span>
                {!loading && <span className="hd-live-dot" title="Live sync" />}
              </div>
              {hospitalData?.fullName && (
                <div className="hd-hosp-name">
                  <Building2 size={10} style={{ flexShrink: 0, opacity: 0.7 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px" }}>
                    {hospitalData.fullName}
                  </span>
                </div>
              )}
            </div>

            {/* Location chip (desktop) */}
            <div className="hd-loc-chip" style={{ display: "none" }} id="loc-chip-desktop">
              <MapPin size={11} />
              {hospitalData?.district || "…"}, {hospitalData?.pincode || "…"}
            </div>
            <style>{`@media(min-width:1024px){#loc-chip-desktop{display:flex!important}}`}</style>

            {/* Search (desktop) */}
            <button onClick={() => setIsSearchOpen(true)} className="hd-hdr-btn" title="Search (Ctrl+K)" style={{ display: "none" }} id="search-btn-desktop">
              <Search size={15} />
            </button>
            <style>{`@media(min-width:640px){#search-btn-desktop{display:flex!important}}`}</style>

            {/* Emergency (desktop) */}
            <button onClick={() => openNewRequest("Emergency")} className="hd-emg-btn" style={{ display: "none" }} id="emg-btn-desktop">
              <Siren size={14} /> Emergency
            </button>
            <style>{`@media(min-width:640px){#emg-btn-desktop{display:flex!important}}`}</style>

            {/* Right action cluster */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
              {/* Profile (desktop) */}
              <button onClick={() => setIsProfileOpen(true)} className="hd-profile-btn" style={{ display: "none" }} id="profile-btn-desktop">
                <UserCircle size={14} />
                <span style={{ display: "none" }} id="profile-label-md">Profile</span>
              </button>
              <style>{`@media(min-width:640px){#profile-btn-desktop{display:flex!important}} @media(min-width:768px){#profile-label-md{display:inline!important}}`}</style>

              {/* Patient history (desktop) */}
              <button onClick={() => setIsPatientHistoryOpen(true)} className="hd-hdr-btn" title="Patient History" style={{ display: "none" }} id="hist-btn-desktop">
                <Users size={15} />
              </button>
              <style>{`@media(min-width:640px){#hist-btn-desktop{display:flex!important}}`}</style>

              {/* Dark mode */}
              <button onClick={toggleDark} className="hd-hdr-btn" title={isDark ? "Light Mode" : "Dark Mode"}>
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </button>

              {/* Shortcuts (desktop) */}
              <button onClick={() => setIsShortcutsOpen(true)} className="hd-hdr-btn" title="Keyboard Shortcuts (?)" style={{ display: "none" }} id="kbd-btn-desktop">
                <Keyboard size={15} />
              </button>
              <style>{`@media(min-width:640px){#kbd-btn-desktop{display:flex!important}}`}</style>

              {/* Refresh */}
              <button onClick={handleRefresh} className="hd-hdr-btn" title="Refresh">
                <RefreshCw size={15} style={{ animation: loading ? "hd-spin 0.8s linear infinite" : "none" }} />
              </button>

              {/* Notifications */}
              <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="hd-hdr-btn" aria-label="Notifications">
                <Bell size={15} />
                {unreadCount > 0 && (
                  <span className="hd-notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
                )}
              </button>

              {/* Logout */}
              <button onClick={handleLogout} className="hd-logout-btn" aria-label="Logout">
                <LogOut size={15} />
                <span className="hd-logout-text">Logout</span>
              </button>
            </div>
          </div>

          {/* Mobile sub-row */}
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "0 20px 8px", maxWidth: "1400px", margin: "0 auto",
          }} id="hdr-mobile-sub">
            <MapPin size={11} style={{ color: "var(--c-text-4)", flexShrink: 0 }} />
            <span style={{ fontSize: "0.68rem", color: "var(--c-text-4)" }}>
              {hospitalData?.district || "…"}, {hospitalData?.pincode || "…"}
            </span>
            <button onClick={() => setIsSearchOpen(true)} style={{
              marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px",
              fontSize: "0.68rem", fontWeight: 600, color: "var(--c-text-4)",
              background: "none", border: "none", cursor: "pointer", fontFamily: "var(--f-body)",
            }}>
              <Search size={12} /> Search
            </button>
            <button onClick={handleExportCSV} style={{
              display: "flex", alignItems: "center", gap: "4px",
              fontSize: "0.68rem", fontWeight: 600, color: "var(--c-text-4)",
              background: "none", border: "none", cursor: "pointer", fontFamily: "var(--f-body)",
            }}>
              <FileDown size={12} /> CSV
            </button>
          </div>
          <style>{`@media(min-width:640px){#hdr-mobile-sub{display:none!important}}`}</style>
        </header>

        {/* ── NAV ── */}
        <nav className="hd-nav no-print">
          <div className="hd-nav-inner">
            {TABS.map(t => {
              const badge = t.id === "requests" ? requests.length
                : t.id === "history" ? requests.filter((r: BloodRequest) => r.unitsAdministered > 0).length
                  : 0;
              return (
                <button
                  key={t.id}
                  onClick={() => handleTabChange(t.id)}
                  className={`hd-nav-tab ${activeTab === t.id ? "hd-nav-active" : ""}`}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                  {badge > 0 && (
                    <span style={{
                      padding: "1px 7px", fontSize: "0.62rem", fontWeight: 800,
                      borderRadius: "var(--r-pill)",
                      background: activeTab === t.id ? "rgba(255,255,255,0.2)" : "var(--c-brand)",
                      color: "#fff",
                    }}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Report generator */}
            <ReportGenerator
              requests={requests}
              hospitalName={hospitalData?.fullName || "Hospital"}
              hospitalLocation={`${hospitalData?.district || ""}, ${hospitalData?.pincode || ""}`}
            />

            {/* CSV (desktop) */}
            <button
              onClick={handleExportCSV}
              className="hd-nav-tab"
              style={{ color: "var(--c-success)", display: "none" }}
              id="csv-nav-desktop"
            >
              <FileDown size={14} /> CSV
            </button>
            <style>{`@media(min-width:640px){#csv-nav-desktop{display:flex!important}}`}</style>

            {/* New Request (desktop) */}
            <div style={{ marginLeft: "auto" }}>
              <button
                onClick={() => openNewRequest("Routine")}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "7px 16px", borderRadius: "var(--r-md)",
                  background: "var(--c-brand)", border: "none", color: "#fff",
                  fontSize: "0.77rem", fontWeight: 700, cursor: "pointer",
                  fontFamily: "var(--f-body)", boxShadow: "var(--s-brand)",
                  transition: "all var(--t-med)",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--s-brand-lg)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "var(--s-brand)"; }}
              >
                <Plus size={14} /> New Request
              </button>
            </div>
          </div>
        </nav>

        {/* ── MODALS & DRAWERS ── */}
        <NotifDrawer isOpen={isNotifOpen} notifs={notifications} onClose={() => setIsNotifOpen(false)} onMarkRead={markRead} onMarkAllRead={markAllRead} onClear={clearNotifs} />
        <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} hospital={hospitalData} />
        <CompleteModal isOpen={isCompleteOpen} onClose={() => setIsCompleteOpen(false)} request={completeTarget} onConfirm={(id: string, unitsNow: number, notes: string) => handleMarkComplete(id, unitsNow, notes)} />
        <PatientHistoryModal isOpen={isPatientHistoryOpen} onClose={() => setIsPatientHistoryOpen(false)} requests={requests} />
        <EditRequestModal isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); setEditTarget(null); }} onSave={handleSaveEdit} request={editTarget} />
        <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} requests={requests} onSelectRequest={handleSearchSelect} />
        <KeyboardShortcuts isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />

        {/* ── MAIN CONTENT ── */}
        <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px 20px" }}>
          {loading ? (
            /* Loading state */
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", minHeight: "50vh", gap: "16px",
            }}>
              <div style={{ position: "relative", width: "52px", height: "52px" }}>
                <div style={{
                  width: "52px", height: "52px", borderRadius: "50%",
                  border: "3px solid var(--c-surface-3)",
                  borderTopColor: "var(--c-brand)",
                  animation: "hd-spin 0.75s linear infinite",
                }} />
                <Droplet
                  size={20}
                  style={{
                    position: "absolute", inset: 0, margin: "auto",
                    color: "var(--c-brand)", fill: "var(--c-brand)",
                  }}
                />
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--c-text-3)", fontWeight: 500 }}>
                Loading dashboard…
              </p>
              <p style={{ fontSize: "0.72rem", color: "var(--c-text-4)" }}>Live sync enabled</p>
            </div>
          ) : (
            <ErrorBoundary fallbackTitle="Content Error">
              <div key={tabKey}>
                {activeTab === "overview" && (
                  <PremiumDashboard
                    requests={requests} hospitalData={hospitalData} kpis={kpis}
                    onNewRequest={openNewRequest}
                    onViewQR={(r: BloodRequest) => { setSelectedRequest(r); setIsQRModalOpen(true); }}
                    onDelete={handleDelete} onPrint={handlePrint}
                    onMarkComplete={openComplete}
                    onWhatsAppShare={handleWhatsAppShare} onExportCSV={handleExportCSV}
                  />
                )}
                {activeTab === "requests" && (
                  <RequestsView
                    requests={requests}
                    onViewQR={(r: BloodRequest) => { setSelectedRequest(r); setIsQRModalOpen(true); }}
                    onCopyRTID={(rtid: string) => { navigator.clipboard.writeText(rtid).catch(() => { }); toast.success("RTID copied!"); }}
                    onDelete={handleDelete} onPrint={handlePrint}
                    onNewRequest={openNewRequest}
                    onMarkComplete={openComplete} onWhatsAppShare={handleWhatsAppShare}
                    onEditRequest={handleEditRequest} onDuplicate={handleDuplicate}
                  />
                )}
                {activeTab === "inventory" && <InventoryView requests={requests} />}
                {activeTab === "analytics" && <AnalyticsView requests={requests} />}
                {activeTab === "history" && <TransfusionHistoryView requests={requests} />}
                {activeTab === "audit" && hospitalId && <AuditTrailView hospitalId={hospitalId} />}
              </div>
            </ErrorBoundary>
          )}
        </main>

        {/* ── FAB ── */}
        <button className="hd-fab no-print" onClick={() => openNewRequest("Routine")}>
          <Plus size={16} /> New Request
        </button>
        <style>{`@media(max-width:639px){.hd-fab{display:flex!important}}`}</style>

        {/* ── MOBILE BOTTOM NAV ── */}
        <nav className="hd-bottom-nav no-print">
          {[
            { id: "overview", icon: "🏥", label: "Home" },
            { id: "requests", icon: "📋", label: "Requests", badge: requests.length },
            { id: "_emg", icon: "🚨", label: "Emergency", emergency: true },
            { id: "analytics", icon: "📊", label: "Analytics" },
            { id: "_profile", icon: "👤", label: "Profile" },
          ].map(item => {
            if (item.emergency) return (
              <button key="emg" className="hd-bnav-btn" onClick={() => openNewRequest("Emergency")} style={{ color: "var(--clr-emergency)" }}>
                <span className="bnav-icon">{item.icon}</span>
                <span className="hd-bnav-lbl">{item.label}</span>
              </button>
            );
            if (item.id === "_profile") return (
              <button key="profile" className="hd-bnav-btn" onClick={() => setIsProfileOpen(true)}>
                <span className="bnav-icon">{item.icon}</span>
                <span className="hd-bnav-lbl">{item.label}</span>
              </button>
            );
            return (
              <button
                key={item.id}
                className={`hd-bnav-btn ${activeTab === item.id ? "active" : ""}`}
                onClick={() => handleTabChange(item.id as TabId)}
                style={{ position: "relative" }}
              >
                <span className="bnav-icon">{item.icon}</span>
                <span className="hd-bnav-lbl">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span style={{
                    position: "absolute", top: 0, right: "2px",
                    background: "var(--c-brand)", color: "#fff", borderRadius: "var(--r-pill)",
                    fontSize: "0.55rem", fontWeight: 800, padding: "1px 5px", lineHeight: 1.4,
                  }}>
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ── NEW REQUEST MODAL ── */}
        <NewRequestModal
          isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)}
          onSubmit={handleNewRequest}
          defaultCity={hospitalData?.district || ""} defaultPincode={hospitalData?.pincode || ""}
          defaultUrgency={modalUrgency} hospitalName={hospitalData?.fullName || "Hospital"}
        />
        <QRModal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} request={selectedRequest} />
      </div>
    </ErrorBoundary>
  );
};

export default HospitalDashboard;