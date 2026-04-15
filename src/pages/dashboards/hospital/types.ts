// hospital/types.ts — All Hospital Dashboard types

export type UrgencyLevel = "Emergency" | "Urgent" | "Routine";
export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-";
export type BloodComponentType = "Whole Blood" | "PRBC" | "Platelets" | "FFP" | "Cryoprecipitate";
export type TransfusionIndication = "Anemia" | "Surgery" | "Trauma" | "Oncology" | "Obstetric" | "Hemorrhage" | "Thalassemia" | "Other";
export type RequestStatus =
  | "CREATED" | "PENDING" | "PROCESSING" | "PLEDGED"
  | "PARTIAL" | "PARTIAL REDEEMED" | "REDEEMED" | "HOSPITAL VERIFIED"
  | "ADMINISTERED" | "PARTIALLY ADMINISTERED" | "CLOSED" | "EXPIRED" | "CANCELLED";

export interface DonorInfo {
  dRtid: string;
  name: string;
  date: string;
  units?: number;
  redeemed?: boolean;
  administered?: boolean;
  administeredAt?: string;
}

export interface TransfusionRecord {
  recordedAt: string;
  unitsAdministered: number;
  notes: string;
  administeredBy: string;
  donorRtids: string[];
}

export interface BloodRequest {
  id: string;
  rtid: string;
  serialNumber?: string;
  patientName: string;
  bloodGroup: BloodGroup;
  componentType?: BloodComponentType;
  transfusionIndication?: TransfusionIndication;
  unitsRequired: number;
  unitsFulfilled: number;
  unitsAdministered: number;
  requiredBy: Date;
  status: RequestStatus;
  city: string;
  createdAt: Date;
  patientMobile: string;
  patientAadhaar: string;
  pincode: string;
  age?: number;
  urgency?: UrgencyLevel;
  donors?: DonorInfo[];
  doctorName?: string;
  doctorRegNo?: string;
  wardDepartment?: string;
  bedNumber?: string;
  validityHours?: number;
  scannedAt?: string;
  scannedLocation?: string;
  redeemedAt?: Date;
  administeredAt?: Date;
  generatedBy?: string;
  systemVersion?: string;
  transfusionHistory?: TransfusionRecord[];
  linkedRTID?: string;
}

export interface Notification {
  id: string;
  message: string;
  time: string;
  type: "new" | "update" | "alert" | "system";
  read: boolean;
}

export interface UrgencyConfig {
  validityHours: number;
  color: string;
  bg: string;
  border: string;
  emoji: string;
  timeNeeded: string;
  description: string;
  nacoNote: string;
  selClass: string;
}
