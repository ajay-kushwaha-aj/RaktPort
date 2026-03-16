// src/types/bloodbank.ts

// (Other types... BloodGroup, Inventory, etc. are here)

export type Appointment = {
  appointmentRtid: string;
  donorName: string;
  bloodGroup: BloodGroup;
  date: Date;
  time: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled' | 'Pledged'; // <-- FIX: 'Pledged' is added
};

// (Other types... Donation, Redemption, etc. are here)

export type Donation = {
  dRtid: string;
  otp: string;
  bloodGroup: BloodGroup;
  donorName: string;
  donationType: string;
  hRtid: string | null;
  status: 'AVAILABLE' | 'REDEEMED' | 'EXPIRED';
  donationLocation: string;
  date: Date;
};

export type Redemption = {
  dRtid: string;
  bloodGroup: BloodGroup;
  donationLocation: string;
  redemptionLocation: string;
  linkedHRTID: string | null;
  date: Date;
  bloodBankId: string;
};

export type BloodRequest = {
  rtid: string;
  patientName: string;
  bloodGroup: BloodGroup;
  units: number;
  city: string;
  hospitalName: string;
  status: string;
  createdAt: Date;
};

export type Notification = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: Date;
  read: boolean;
};

export type KPIData = {
  totalInventory: number;
  availableUnits: number;
  todayAppointments: number;
  totalDonations: number;
  totalRedemptions: number;
  totalBloodRequests: number;
};

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type Inventory = {
  [key in BloodGroup]: { total: number; available: number };
};

// PART 7: Update your types/bloodbank.ts file
// Add these fields to existing types:

export interface Appointment {
  rtid: string;
  appointmentRtid?: string;
  donorName: string;
  mobile: string;
  gender: string;
  bloodGroup: string;
  date: any; // Firestore Timestamp or Date
  time: string;
  bloodBankId: string;
  bloodBankName: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
  createdAt: any;
  completedAt?: any;
  district?: string;
  pincode?: string;
  component?: string;
  donorId?: string;
  dRtid?: string; // Link to actual donation after check-in
}

export interface Donation {
  rtid: string;
  dRtid: string;
  appointmentRtid?: string; // NEW: Link to original appointment
  donorId?: string; // NEW: Link to donor user
  donorName: string;
  donorMobile?: string;
  bloodGroup: string;
  bloodBankId: string;
  bloodBankName: string;
  donationType: string;
  component?: string; // NEW: Whole Blood, Platelets, Plasma, PRBC
  otp?: string;
  status: 'Scheduled' | 'AVAILABLE' | 'Donated' | 'REDEEMED' | 'COMPLETED' | 'EXPIRED' | 'Pledged';
  date: any; // Firestore Timestamp or Date
  time?: string; // NEW: Time of donation
  createdAt: any;
  actualDonationDate?: any; // NEW: When actually donated (vs scheduled)
  donationLocation?: string;
  city?: string;

  // Patient/Hospital Details (filled when redeemed)
  hRtid?: string | null;
  linkedHrtid?: string | null;
  patientName?: string | null;
  hospitalName?: string | null;
  redemptionDate?: any;
  redeemedAt?: any;

  // Impact Timeline
  linkedDate?: any; // When linked to patient request
  usedDate?: any; // When used by patient
  creditIssuedDate?: any; // When credit given to donor
}

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface InventoryData {
  [key: string]: {
    total: number;
    available: number;
  };
}

export interface BloodRequest {
  rtid: string;
  linkedRTID?: string;
  patientName: string;
  bloodGroup: string;
  units: number;
  unitsRequired: number;
  unitsFulfilled?: number;
  status: 'PENDING' | 'PARTIAL' | 'REDEEMED' | 'CLOSED';
  hospitalId?: string;
  hospitalName?: string;
  validityHours?: number;
  createdAt: any;
  redeemedAt?: any;
  scannedLocation?: string;
  fulfilledBy?: string;
  component?: string;
}

export interface Notification {
  id: string;
  message: string;
  read: boolean;
  timestamp: any;
  type?: 'info' | 'warning' | 'success' | 'error';
}

export interface KPI {
  totalDonations: number;
  totalRedemptions: number;
  totalDonors: number;
  availableUnits: number;
}