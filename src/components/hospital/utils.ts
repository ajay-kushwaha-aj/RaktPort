// hospital/utils.ts — Utility functions

import type { BloodRequest, RequestStatus } from "./types";
import { LOCKED_STATUSES } from "./constants";

/* ── Formatting ── */
export const formatDate = (d: Date) =>
  !d || isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export const formatTime = (d: Date) =>
  !d || isNaN(d.getTime()) ? "" : d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

export const timeAgo = (d: Date) => {
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const dy = Math.floor(diff / 86400000);
  return dy > 0 ? `${dy}d ago` : h > 0 ? `${h}h ago` : `${m}m ago`;
};

/* ── Serial / RTID ── */
export const generateSerial = () => {
  const n = new Date();
  return `REQ/${n.getFullYear()}/${String(n.getMonth() + 1).padStart(2, "0")}/${Math.floor(Math.random() * 999999).toString().padStart(6, "0")}`;
};

/* ── Validity ── */
export const isRequestValid = (r: BloodRequest) => {
  if (!r.validityHours || !r.createdAt) return true;
  return new Date() < new Date(r.createdAt.getTime() + r.validityHours * 3600000);
};

export const getTimeRemaining = (r: BloodRequest) => {
  if (!r.validityHours || !r.createdAt) return "N/A";
  const diff = new Date(r.createdAt.getTime() + r.validityHours * 3600000).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const getValidityPct = (r: BloodRequest) => {
  if (!r.validityHours || !r.createdAt) return 100;
  return Math.max(0, Math.min(100, 100 - ((Date.now() - r.createdAt.getTime()) / (r.validityHours * 3600000)) * 100));
};

/* ── Access control ── */
export const canDeleteRequest = (r: BloodRequest) =>
  !LOCKED_STATUSES.includes(r.status) && r.status !== "EXPIRED";

/* ── QR ── */
export const getQRPayload = (r: BloodRequest) =>
  JSON.stringify({
    rtid: r.rtid,
    serial: r.serialNumber || "",
    name: r.patientName,
    city: r.city,
    bloodGroup: r.bloodGroup,
    component: r.componentType || "Whole Blood",
    units: r.unitsRequired,
    urgency: r.urgency || "Routine",
    requiredBy: r.requiredBy?.toISOString?.() || "",
    createdAt: r.createdAt?.toISOString?.() || "",
  });

/* ── Aadhaar masking (security fix — handles encrypted values) ── */
export const maskAadhaar = (aadhaar: string) => {
  if (!aadhaar || aadhaar.startsWith('enc:')) return "XXXX XXXX XXXX";
  if (aadhaar.length < 4) return "XXXX XXXX XXXX";
  return `XXXX XXXX ${aadhaar.slice(-4)}`;
};

/* ── Mobile masking ── */
export const maskMobile = (mobile: string) => {
  if (!mobile || mobile.startsWith('enc:')) return "+91 XXXXX XXXXX";
  const digits = mobile.replace(/\D/g, '');
  if (digits.length < 4) return "+91 XXXXX XXXXX";
  return `+91 XXXXX X${digits.slice(-4)}`;
};

/* ── Parse Firestore timestamps ── */
export const parseTimestamp = (t: any): Date => {
  if (t?.toDate) return t.toDate();
  if (typeof t === "string") return new Date(t);
  return new Date();
};
