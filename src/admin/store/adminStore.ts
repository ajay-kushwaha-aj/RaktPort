// src/admin/store/adminStore.ts
import { create } from 'zustand';

// ─── Shared Types ───────────────────────────────────────────────────────────

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';

export interface AdminMetrics {
  totalRequests: number;
  totalDonations: number;
  activeRTIDs: number;
  totalDonors: number;
  pendingOrgsCount: number;
  verifiedOrgsCount: number;
  fraudAlertsCount: number;
}

export interface Organization {
  id: string;
  name: string;
  type: 'hospital' | 'bloodbank';
  status: 'pending' | 'verified' | 'rejected';
  city: string;
  state: string;
  email: string;
  phone: string;
  registrationNumber: string;
  createdAt: string | Date;
  verifiedAt?: string | Date;
  address?: string;
  pincode?: string;
  district?: string;
  documentUrls?: string[];
}

export interface LedgerEntry {
  id: string;
  rtid: string;
  type: 'request' | 'donation';
  bloodGroup: BloodGroup;
  units: number;
  status: string;
  city: string;
  state: string;
  createdAt: string | Date;
  patientName?: string;
  donorName?: string;
  hospitalName?: string;
  bloodBankName?: string;
}

export interface InventoryEntry {
  bloodGroup: BloodGroup;
  units: number;
  city?: string;
}

export interface DonorRecord {
  id: string;
  name: string;
  bloodGroup: BloodGroup;
  phone: string;
  city: string;
  state: string;
  lastDonationDate?: string | Date;
  totalDonations: number;
  isEligible: boolean;
}

export interface FraudAlert {
  id: string;
  rtid: string;
  reason: string;
  riskScore: number;
  createdAt: string | Date;
  status: 'open' | 'flagged' | 'resolved';
  requestedBy?: string;
  city?: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  performedBy: string;
  targetId?: string;
  targetType?: string;
  timestamp: string | Date;
  details?: string;
}

// ─── Store Interface ─────────────────────────────────────────────────────────

interface AdminStore {
  // State
  metrics: AdminMetrics;
  organizations: Organization[];
  nationalLedger: LedgerEntry[];
  nationalInventory: InventoryEntry[];
  cityInventory: Record<string, InventoryEntry[]>;
  donors: DonorRecord[];
  fraudAlerts: FraudAlert[];
  auditLog: AuditLogEntry[];
  loading: boolean;
  lastRefreshed: Date | null;
  activeModule: string;
  sidebarCollapsed: boolean;

  // Actions
  setMetrics: (metrics: AdminMetrics) => void;
  setOrganizations: (orgs: Organization[]) => void;
  setNationalLedger: (ledger: LedgerEntry[]) => void;
  setNationalInventory: (inventory: InventoryEntry[]) => void;
  setCityInventory: (city: string, inventory: InventoryEntry[]) => void;
  setDonors: (donors: DonorRecord[]) => void;
  setFraudAlerts: (alerts: FraudAlert[]) => void;
  setAuditLog: (log: AuditLogEntry[]) => void;
  setLoading: (loading: boolean) => void;
  setLastRefreshed: (date: Date) => void;
  setActiveModule: (module: string) => void;
  toggleSidebar: () => void;
  updateOrganizationStatus: (id: string, status: Organization['status']) => void;
  updateFraudAlertStatus: (id: string, status: FraudAlert['status']) => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

const defaultMetrics: AdminMetrics = {
  totalRequests: 0,
  totalDonations: 0,
  activeRTIDs: 0,
  totalDonors: 0,
  pendingOrgsCount: 0,
  verifiedOrgsCount: 0,
  fraudAlertsCount: 0,
};

export const useAdminStore = create<AdminStore>((set) => ({
  metrics: defaultMetrics,
  organizations: [],
  nationalLedger: [],
  nationalInventory: [],
  cityInventory: {},
  donors: [],
  fraudAlerts: [],
  auditLog: [],
  loading: false,
  lastRefreshed: null,
  activeModule: 'overview',
  sidebarCollapsed: false,

  setMetrics: (metrics) => set({ metrics }),
  setOrganizations: (organizations) => set({ organizations }),
  setNationalLedger: (nationalLedger) => set({ nationalLedger }),
  setNationalInventory: (nationalInventory) => set({ nationalInventory }),
  setCityInventory: (city, inventory) =>
    set((state) => ({
      cityInventory: { ...state.cityInventory, [city]: inventory },
    })),
  setDonors: (donors) => set({ donors }),
  setFraudAlerts: (fraudAlerts) => set({ fraudAlerts }),
  setAuditLog: (auditLog) => set({ auditLog }),
  setLoading: (loading) => set({ loading }),
  setLastRefreshed: (lastRefreshed) => set({ lastRefreshed }),
  setActiveModule: (activeModule) => set({ activeModule }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  updateOrganizationStatus: (id, status) =>
    set((state) => ({
      organizations: state.organizations.map((org) =>
        org.id === id ? { ...org, status } : org
      ),
    })),
  updateFraudAlertStatus: (id, status) =>
    set((state) => ({
      fraudAlerts: state.fraudAlerts.map((a) =>
        a.id === id ? { ...a, status } : a
      ),
    })),
}));
