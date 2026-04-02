// hospital/auditLog.ts — Audit trail logging utility (Phase 2)
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../firebase";

export type AuditAction =
  | "REQUEST_CREATED"
  | "REQUEST_EDITED"
  | "REQUEST_DELETED"
  | "RECEIPT_CONFIRMED"
  | "BLOOD_ADMINISTERED"
  | "CSV_EXPORTED"
  | "PRINT_SLIP";

export interface AuditEntry {
  id?: string;
  hospitalId: string;
  hospitalName: string;
  action: AuditAction;
  details: string;
  affectedRtid?: string;
  timestamp: string;
}

/**
 * Log an action to the auditLog Firestore collection.
 * Fails silently to avoid blocking the main workflow.
 */
export const logAuditAction = async (
  hospitalId: string,
  hospitalName: string,
  action: AuditAction,
  details: string,
  affectedRtid?: string
): Promise<void> => {
  try {
    await addDoc(collection(db, "auditLog"), {
      hospitalId,
      hospitalName,
      action,
      details,
      affectedRtid: affectedRtid || "",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("[AuditLog] Failed to write:", err);
  }
};

/** Human-readable action labels */
export const AUDIT_ACTION_LABELS: Record<AuditAction, { label: string; emoji: string; color: string }> = {
  REQUEST_CREATED: { label: "Request Created", emoji: "📝", color: "#22c55e" },
  REQUEST_EDITED: { label: "Request Edited", emoji: "✏️", color: "#f59e0b" },
  REQUEST_DELETED: { label: "Request Deleted", emoji: "🗑️", color: "var(--clr-emergency)" },
  RECEIPT_CONFIRMED: { label: "Receipt Confirmed", emoji: "✅", color: "var(--clr-info)" },
  BLOOD_ADMINISTERED: { label: "Blood Administered", emoji: "💉", color: "#8b5cf6" },
  CSV_EXPORTED: { label: "CSV Exported", emoji: "📥", color: "#6b7280" },
  PRINT_SLIP: { label: "Slip Printed", emoji: "🖨️", color: "#6b7280" },
};
