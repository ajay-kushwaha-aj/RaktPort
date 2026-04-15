// hospital/constants.ts — All constants and configuration

import type { UrgencyLevel, UrgencyConfig, BloodComponentType, TransfusionIndication, RequestStatus } from "./types";

export const SYSTEM_VERSION = "v4.0.0";

export const BLOOD_COMPONENT_TYPES: BloodComponentType[] = [
  "Whole Blood", "PRBC", "Platelets", "FFP", "Cryoprecipitate",
];

export const TRANSFUSION_INDICATIONS: TransfusionIndication[] = [
  "Anemia", "Surgery", "Trauma", "Oncology", "Obstetric", "Hemorrhage", "Thalassemia", "Other",
];

export const URGENCY_CONFIG: Record<UrgencyLevel, UrgencyConfig> = {
  Emergency: {
    validityHours: 6,
    color: "#b91c1c", bg: "#fef2f2", border: "#fca5a5",
    emoji: "🚨", timeNeeded: "< 30 min",
    description: "Life-threatening — immediate transfusion required.",
    nacoNote: "Massive hemorrhage, trauma, obstetric emergency, surgical crisis",
    selClass: "sel-emergency",
  },
  Urgent: {
    validityHours: 12,
    color: "#c2410c", bg: "#fff7ed", border: "#fdba74",
    emoji: "⚡", timeNeeded: "2–4 hours",
    description: "Semi-urgent — blood required within a few hours.",
    nacoNote: "Significant anemia, pre-operative preparation, post-surgical bleeding",
    selClass: "sel-urgent",
  },
  Routine: {
    validityHours: 48,
    color: "#15803d", bg: "#f0fdf4", border: "#86efac",
    emoji: "📋", timeNeeded: "> 4 hours",
    description: "Elective / planned — sufficient advance notice.",
    nacoNote: "Elective surgery, chronic anemia, thalassemia, oncology",
    selClass: "sel-routine",
  },
};

/** Status → visual meta for badges */
export const getStatusMeta = (s: string) => {
  const map: Record<string, { bg: string; text: string; border: string; label: string }> = {
    CREATED:                  { bg: "#f9fafb", text: "#374151", border: "#d1d5db", label: "Created" },
    PENDING:                  { bg: "#fefce8", text: "#854d0e", border: "#fde047", label: "Pending" },
    PROCESSING:               { bg: "#eff6ff", text: "#1d4ed8", border: "#93c5fd", label: "Processing" },
    PLEDGED:                  { bg: "#eff6ff", text: "#1d4ed8", border: "#93c5fd", label: "Pledged" },
    PARTIAL:                  { bg: "#fff7ed", text: "#c2410c", border: "#fdba74", label: "Partial Donated" },
    "PARTIAL REDEEMED":       { bg: "#fef9c3", text: "#92400e", border: "#fde68a", label: "Partial Redeemed" },
    REDEEMED:                 { bg: "#f0fdf4", text: "#15803d", border: "#86efac", label: "Redeemed" },
    "HOSPITAL VERIFIED":      { bg: "#dcfce7", text: "#166534", border: "#4ade80", label: "Verified" },
    "PARTIALLY ADMINISTERED": { bg: "#e0f2fe", text: "#0369a1", border: "#7dd3fc", label: "Partially Administered" },
    ADMINISTERED:             { bg: "#dbeafe", text: "#1e40af", border: "#93c5fd", label: "Fully Administered ✓" },
    CLOSED:                   { bg: "#f0fdf4", text: "#14532d", border: "#86efac", label: "Closed ✓" },
    EXPIRED:                  { bg: "#fef2f2", text: "#b91c1c", border: "#fca5a5", label: "Expired" },
    CANCELLED:                { bg: "#fef2f2", text: "#b91c1c", border: "#fca5a5", label: "Cancelled" },
  };
  return map[s?.toUpperCase?.()?.replace(/ /g, "_")] || map[s] || { bg: "#f9fafb", text: "#6b7280", border: "#d1d5db", label: s || "—" };
};

/** Statuses that prevent deletion */
export const LOCKED_STATUSES: RequestStatus[] = [
  "PARTIAL", "PARTIAL REDEEMED", "PLEDGED", "PROCESSING",
  "REDEEMED", "HOSPITAL VERIFIED", "ADMINISTERED", "PARTIALLY ADMINISTERED", "CLOSED",
];
