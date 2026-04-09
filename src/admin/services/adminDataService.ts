// src/admin/services/adminDataService.ts
// Centralizes ALL Firebase fetching logic migrated from AdminDashboard.tsx.
// Populates the Zustand adminStore and notificationStore.

import { db } from '../../firebase';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  type Unsubscribe,
} from 'firebase/firestore';

import { useAdminStore } from '../store/adminStore';
import { useNotificationStore } from '../store/notificationStore';
import type {
  AdminMetrics,
  Organization,
  LedgerEntry,
  InventoryEntry,
  DonorRecord,
  FraudAlert,
  AuditLogEntry,
  BloodGroup,
} from '../store/adminStore';
import { buildRTIDFromRequest, buildRTIDFromDonation } from './rtidService';
import { toDate, toDateString } from './exportService';

// ─── Constants ────────────────────────────────────────────────────────────────

const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

// ─── Admin Details ────────────────────────────────────────────────────────────

export async function fetchAdminDetails(): Promise<string | null> {
  const adminId = localStorage.getItem('userId');
  if (!adminId) return null;
  try {
    const snap = await getDoc(doc(db, 'users', adminId));
    if (snap.exists()) {
      const d = snap.data() as Record<string, unknown>;
      const name = (d.fullName as string) || (d.name as string) || null;
      if (name) {
        localStorage.setItem('adminName', name);
        return name;
      }
    }
  } catch (e) {
    console.error('[adminDataService] fetchAdminDetails:', e);
  }
  return null;
}

// ─── Main Fetch ───────────────────────────────────────────────────────────────

/**
 * Fetch all admin dashboard data from Firestore and populate the Zustand store.
 * Call on mount and on manual refresh.
 */
export async function fetchAllAdminData(): Promise<void> {
  const adminId = localStorage.getItem('userId');
  const store = useAdminStore.getState();
  const notifStore = useNotificationStore.getState();

  if (!adminId) {
    store.setLoading(false);
    return;
  }

  store.setLoading(true);

  try {
    // ── 1. Parallel top-level fetches ────────────────────────────────────────
    const [usersSnap, requestsSnap, donationsSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'bloodRequests')).catch(() => ({ docs: [] as any[] })),
      getDocs(collection(db, 'donations')).catch(() => ({ docs: [] as any[] })),
    ]);

    const users = usersSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));
    const allRequests = requestsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));
    const allDonations = donationsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }));

    // ── 2. User segmentation ─────────────────────────────────────────────────
    const hospitals = users.filter((u: any) => u.role === 'hospital');
    const bloodBanks = users.filter((u: any) => u.role === 'bloodbank');
    const donorUsers = users.filter((u: any) => u.role === 'donor');
    const verifiedOrgsAll = users.filter((u: any) =>
      (u.role === 'hospital' || u.role === 'bloodbank') && u.isVerified
    );
    const pendingOrgs = users.filter((u: any) =>
      (u.role === 'hospital' || u.role === 'bloodbank') && !u.isVerified
    );
    const verifiedHospitals = users.filter((u: any) => u.role === 'hospital' && u.isVerified);
    const verifiedBBs = users.filter((u: any) => u.role === 'bloodbank' && u.isVerified);

    // ── 3. City map (userId → city) ──────────────────────────────────────────
    const cityMap: Record<string, string> = {};
    users.forEach((u: any) => {
      cityMap[u.id] = u.district || u.city || 'Unknown';
    });

    // ── 4. Map orgs to store type ─────────────────────────────────────────────
    const mapOrg = (u: any, status: Organization['status']): Organization => ({
      id: u.id,
      name: u.fullName || u.organizationName || 'Unknown',
      type: u.role === 'hospital' ? 'hospital' : 'bloodbank',
      status,
      city: u.district || u.city || 'Unknown',
      state: u.state || '',
      email: u.userId || u.email || u.id,
      phone: u.mobile || '',
      registrationNumber: u.registrationNo || u.licenseNo || 'N/A',
      createdAt: toDate(u.createdAt) || new Date(0),
      verifiedAt: u.verifiedAt || undefined,
      address: u.address || `${u.district || u.city || ''}${u.state ? ', ' + u.state : ''}`,
      pincode: u.pincode || '',
      district: u.district || '',
      documentUrls: u.documentUrls || (u.registrationFileUrl ? [u.registrationFileUrl] : undefined),
    });

    const allOrgs: Organization[] = [
      ...pendingOrgs.map((u: any) => mapOrg(u, 'pending')),
      ...verifiedOrgsAll.map((u: any) => mapOrg(u, 'verified')),
    ];
    store.setOrganizations(allOrgs);

    // ── 5. Donors ─────────────────────────────────────────────────────────────
    const donorRecords: DonorRecord[] = donorUsers.map((u: any): DonorRecord => {
      const lastDon = toDate(u.lastDonationDate);
      const isEligible = lastDon
        ? (Date.now() - lastDon.getTime()) / (1000 * 60 * 60 * 24) >= 90
        : true;
      const bg: BloodGroup = BLOOD_GROUPS.includes(u.bloodGroup as BloodGroup)
        ? (u.bloodGroup as BloodGroup)
        : 'O+';
        
      const actualDonations = allDonations.filter((d: any) => 
        (d.donorId === u.id || d.userId === u.id) && 
        ['Completed', 'Donated', 'AVAILABLE', 'Available'].includes(d.status)
      ).length;

      return {
        id: u.id,
        name: u.fullName || u.name || 'Anonymous',
        bloodGroup: bg,
        phone: u.mobile || '',
        city: u.district || u.city || 'Unknown',
        state: u.state || '',
        lastDonationDate: lastDon?.toISOString(),
        totalDonations: actualDonations || Number(u.totalDonations) || 0,
        isEligible,
      };
    });
    store.setDonors(donorRecords);

    // ── 6. Metrics ────────────────────────────────────────────────────────────
    const completedDonations = allDonations.filter((d: any) =>
      ['Completed', 'Donated', 'AVAILABLE', 'Available'].includes(d.status)
    ).length;
    const activeRTIDs = allRequests.filter((r: any) =>
      ['PENDING', 'Pending'].includes(r.status)
    ).length;
    const fraudCount = allRequests.filter((r: any) => r.fraudAlert || r.status === 'Flagged').length;

    const metrics: AdminMetrics = {
      totalRequests: allRequests.length,
      totalDonations: completedDonations,
      activeRTIDs,
      totalDonors: donorUsers.length,
      pendingOrgsCount: pendingOrgs.length,
      verifiedOrgsCount: verifiedOrgsAll.length,
      fraudAlertsCount: fraudCount,
    };
    store.setMetrics(metrics);

    // ── 7. National Ledger ────────────────────────────────────────────────────
    const ledger: LedgerEntry[] = [];

    allRequests.forEach((r: any) => {
      const bg: BloodGroup = BLOOD_GROUPS.includes(r.bloodGroup) ? r.bloodGroup : 'O+';
      const rtidRec = buildRTIDFromRequest(r, r.id);
      ledger.push({
        id: r.id,
        rtid: rtidRec.rtid,
        type: 'request',
        bloodGroup: bg,
        units: Number(r.unitsRequired || r.units) || 1,
        status: r.status || 'Unknown',
        city: r.city || r.district || 'Unknown',
        state: r.state || '',
        createdAt: toDate(r.createdAt) || new Date(),
        patientName: r.patientName || 'Confidential',
        hospitalName: r.hospitalName || 'Unknown',
      });
    });

    allDonations.forEach((d: any) => {
      const bg: BloodGroup = BLOOD_GROUPS.includes(d.bloodGroup) ? d.bloodGroup : 'O+';
      const rtidRec = buildRTIDFromDonation(d, d.id, cityMap);
      ledger.push({
        id: d.id,
        rtid: rtidRec.rtid,
        type: 'donation',
        bloodGroup: bg,
        units: Number(d.units) || 1,
        status: d.status || 'Unknown',
        city: d.city || d.district || cityMap[d.donorId] || 'Unknown',
        state: d.state || '',
        createdAt: toDate(d.createdAt) || new Date(),
        donorName: d.donorName || 'Anonymous',
        bloodBankName: d.bloodBankName || 'Unknown',
      });
    });

    ledger.sort((a, b) =>
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    store.setNationalLedger(ledger);

    // ── 8. Inventory ──────────────────────────────────────────────────────────
    const natInv: Record<string, number> = {};
    const cityInv: Record<string, Record<string, number>> = {};
    BLOOD_GROUPS.forEach((bg) => { natInv[bg] = 0; });

    // From available donations
    allDonations.forEach((d: any) => {
      if (['AVAILABLE', 'Available'].includes(d.status)) {
        const bg: BloodGroup = BLOOD_GROUPS.includes(d.bloodGroup) ? d.bloodGroup : null as any;
        if (!bg) return;
        const units = Number(d.units) || 1;
        const city = d.city || d.district || cityMap[d.donorId] || 'Unknown';
        natInv[bg] = (natInv[bg] || 0) + units;
        if (!cityInv[city]) { cityInv[city] = {}; BLOOD_GROUPS.forEach((g) => { cityInv[city][g] = 0; }); }
        cityInv[city][bg] = (cityInv[city][bg] || 0) + units;
      }
    });

    // Also pull from blood-bank inventory documents
    try {
      const invSnap = await getDocs(collection(db, 'inventory'));
      invSnap.docs.forEach((invDoc) => {
        const data = invDoc.data() as Record<string, unknown>;
        const bankUser: any = users.find((u: any) => u.id === invDoc.id);
        const bankCity = bankUser?.district || bankUser?.city || 'Unknown';
        BLOOD_GROUPS.forEach((bg) => {
          const val = data[bg];
          let available = 0;
          if (typeof val === 'object' && val !== null) available = Number((val as any).available) || 0;
          else if (typeof val === 'number') available = val;
          if (available > 0) {
            natInv[bg] = (natInv[bg] || 0) + available;
            if (!cityInv[bankCity]) { cityInv[bankCity] = {}; BLOOD_GROUPS.forEach((g) => { cityInv[bankCity][g] = 0; }); }
            cityInv[bankCity][bg] = (cityInv[bankCity][bg] || 0) + available;
          }
        });
      });
    } catch (_) { /* inventory collection may not exist */ }

    // Convert to store shape
    const natInventoryEntries: InventoryEntry[] = BLOOD_GROUPS.map((bg) => ({
      bloodGroup: bg,
      units: natInv[bg] || 0,
    }));
    store.setNationalInventory(natInventoryEntries);

    Object.entries(cityInv).forEach(([city, inv]) => {
      const cityEntries: InventoryEntry[] = BLOOD_GROUPS.map((bg) => ({
        bloodGroup: bg,
        units: inv[bg] || 0,
        city,
      }));
      store.setCityInventory(city, cityEntries);
    });

    // ── 9. Fraud Alerts ───────────────────────────────────────────────────────
    const fraudAlerts: FraudAlert[] = allRequests
      .filter((r: any) => r.fraudAlert || r.status === 'Flagged')
      .map((r: any): FraudAlert => ({
        id: r.id,
        rtid: r.rtid || r.id,
        reason: r.fraudReason || 'Suspicious activity detected',
        riskScore: r.riskScore || 75,
        createdAt: toDate(r.createdAt) || new Date(),
        status: 'open',
        requestedBy: r.patientName || r.hospitalName || 'Unknown',
        city: r.city || r.district || 'Unknown',
      }));
    store.setFraudAlerts(fraudAlerts);

    // ── 10. Audit Log ─────────────────────────────────────────────────────────
    const log: AuditLogEntry[] = [];

    // Org verifications
    [...verifiedOrgsAll]
      .filter((u: any) => u.verifiedAt)
      .sort((a: any, b: any) =>
        new Date(b.verifiedAt).getTime() - new Date(a.verifiedAt).getTime()
      )
      .slice(0, 20)
      .forEach((u: any) => {
        log.push({
          id: `verify-${u.id}`,
          action: 'Organization Verified',
          performedBy: u.verifiedBy || 'Admin',
          targetId: u.id,
          targetType: u.role === 'hospital' ? 'Hospital' : 'Blood Bank',
          timestamp: toDate(u.verifiedAt) || new Date(),
          details: `${u.fullName || u.organizationName} — ${u.role === 'hospital' ? 'Hospital' : 'Blood Bank'} verified`,
        });
      });

    // Recent request & donation activity
    [...allRequests, ...allDonations]
      .sort((a: any, b: any) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      )
      .slice(0, 50)
      .forEach((item: any) => {
        const isDon =
          (item.rtid as string)?.startsWith?.('D-') ||
          item.status === 'AVAILABLE';
        log.push({
          id: item.id,
          action: isDon ? 'Blood Donation' : 'Blood Request',
          performedBy: item.donorName || item.patientName || item.hospitalName || 'Unknown',
          targetId: item.rtid || item.id,
          targetType: isDon ? 'Donation' : 'Request',
          timestamp: toDate(item.createdAt) || new Date(),
          details: `${item.bloodGroup || 'N/A'} — ${item.units || 1} unit(s) — ${item.status || 'Unknown'}`,
        });
      });

    log.sort((a, b) =>
      new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
    );
    store.setAuditLog(log);

    // ── 11. Auto-notifications (clear old auto-notifs first, only add real ones) ─
    // Clear all existing notifications to avoid duplicate stacking on every fetch
    notifStore.clearAll();

    if (pendingOrgs.length > 0) {
      notifStore.addNotification({
        title: 'Pending Verifications',
        message: `${pendingOrgs.length} organization(s) awaiting verification`,
        severity: 'warning',
        link: 'verify-organizations',
      });
    }
    if (fraudAlerts.length > 0) {
      notifStore.addNotification({
        title: 'Fraud Alerts Detected',
        message: `${fraudAlerts.length} suspicious request(s) flagged`,
        severity: 'critical',
        link: 'fraud-alerts',
      });
    }

    // Today's requests
    const today = new Date().toISOString().split('T')[0];
    const todayRequests = allRequests.filter(
      (r: any) => toDateString(r.createdAt) === today || toDateString(r.requestDate) === today
    );
    if (todayRequests.length > 0) {
      notifStore.addNotification({
        title: 'New Blood Requests Today',
        message: `${todayRequests.length} new request(s) came in today`,
        severity: 'info',
        link: 'national-ledger',
      });
    }

    // Critical inventory shortages
    const criticalBGs = BLOOD_GROUPS.filter((bg) => (natInv[bg] || 0) < 5);
    if (criticalBGs.length > 0) {
      notifStore.addNotification({
        title: 'Critical Blood Shortage',
        message: `${criticalBGs.join(', ')} at critically low levels`,
        severity: 'critical',
        link: 'national-inventory',
      });
    }

    store.setLastRefreshed(new Date());
  } catch (e: any) {
    console.error('[adminDataService] fetchAllAdminData fatal:', e);
    throw e;
  } finally {
    store.setLoading(false);
  }
}

// ─── Organization Actions ─────────────────────────────────────────────────────

/**
 * Approve or reject an organization in Firestore and update the Zustand store.
 */
export async function verifyOrganization(
  orgId: string,
  action: 'verified' | 'rejected'
): Promise<void> {
  const adminId = localStorage.getItem('userId');
  await updateDoc(doc(db, 'users', orgId), {
    isVerified: action === 'verified',
    verificationStatus: action,
    status: action === 'verified' ? 'active' : 'rejected',
    verifiedAt: new Date().toISOString(),
    verifiedBy: adminId,
  });
  useAdminStore.getState().updateOrganizationStatus(orgId, action);

  // Append to audit log
  const existing = useAdminStore.getState().auditLog;
  useAdminStore.getState().setAuditLog([
    {
      id: `action-${orgId}-${Date.now()}`,
      action: action === 'verified' ? 'Organization Approved' : 'Organization Rejected',
      performedBy: adminId || 'Admin',
      targetId: orgId,
      targetType: 'Organization',
      timestamp: new Date(),
      details: `Organization ${action}`,
    },
    ...existing,
  ]);
}

// ─── Real-time Listeners ─────────────────────────────────────────────────────

// Internal flag to skip the initial snapshot (which fires for all existing docs)
let _initialSnapshotDone = false;

/**
 * Subscribe to the top recent blood requests via onSnapshot for real-time notifications.
 * Returns the unsubscribe function.
 */
export function subscribeToRealtimeAlerts(): Unsubscribe {
  _initialSnapshotDone = false;
  try {
    const q = query(
      collection(db, 'bloodRequests'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    return onSnapshot(q, (snap) => {
      if (!_initialSnapshotDone) {
        _initialSnapshotDone = true;
        return; // Skip the initial snapshot to avoid false notification
      }
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data() as Record<string, unknown>;
          const urgency = (data.urgency as string || '').toLowerCase();
          if (urgency === 'critical' || urgency === 'emergency') {
            useNotificationStore.getState().addNotification({
              title: '🚨 Emergency Blood Request',
              message: `${data.bloodGroup || 'Unknown'} blood needed — ${data.hospitalName || 'Unknown Hospital'}`,
              severity: 'critical',
              link: 'emergency-alerts',
            });
          }
        }
      });
    });
  } catch (_) {
    return () => {};
  }
}

/**
 * Subscribe to all major Firestore collections for real-time dashboard updates.
 * When any document in users / bloodRequests / donations changes, re-fetches all data.
 * Returns a single cleanup function that unsubscribes all listeners.
 */
export function subscribeToRealtimeData(): Unsubscribe {
  // Debounce: avoid rapid re-fetches when multiple docs change at once
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let initialUsersSnap = true;
  let initialRequestsSnap = true;
  let initialDonationsSnap = true;

  const debouncedRefresh = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      fetchAllAdminData().catch((e) =>
        console.error('[adminDataService] realtime refresh failed:', e)
      );
    }, 1500); // 1.5s debounce
  };

  const unsubUsers = onSnapshot(collection(db, 'users'), () => {
    if (initialUsersSnap) { initialUsersSnap = false; return; }
    debouncedRefresh();
  });

  const unsubRequests = onSnapshot(collection(db, 'bloodRequests'), () => {
    if (initialRequestsSnap) { initialRequestsSnap = false; return; }
    debouncedRefresh();
  });

  const unsubDonations = onSnapshot(collection(db, 'donations'), () => {
    if (initialDonationsSnap) { initialDonationsSnap = false; return; }
    debouncedRefresh();
  });

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    unsubUsers();
    unsubRequests();
    unsubDonations();
  };
}
