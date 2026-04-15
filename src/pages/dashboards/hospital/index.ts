// hospital/index.ts — Barrel export (Phase 3-4)
export * from "./types";
export * from "./constants";
export * from "./utils";
export { HD_STYLES } from "./styles";
export { QRCanvas } from "./QRCanvas";
export { QRModal } from "./QRModal";
export { ProfileModal } from "./ProfileModal";
export { NotifDrawer } from "./NotifDrawer";
export { NewRequestModal } from "./NewRequestModal";
export { CompleteModal } from "./CompleteModal";
export { buildSlipHTML } from "./buildSlipHTML";
export { openPrintWindow } from "./PrintOverlay";
export { PremiumDashboard } from "./PremiumDashboard";
export { RequestsView } from "./RequestsView";
export { TransfusionHistoryView } from "./TransfusionHistoryView";
export { ErrorBoundary } from "./ErrorBoundary";
// Phase 2
export { InventoryView } from "./InventoryView";
export { StatusTimeline } from "./StatusTimeline";
export { PatientHistoryModal } from "./PatientHistoryModal";
export { PatientHistoryView } from "./PatientHistoryView";
export { GlobalSearch } from "./GlobalSearch";
export { EditRequestModal } from "./EditRequestModal";
export { AuditTrailView } from "./AuditTrailView";
export { logAuditAction, AUDIT_ACTION_LABELS } from "./auditLog";
export type { AuditAction, AuditEntry } from "./auditLog";
// Phase 3-4
export { AnalyticsView } from "./AnalyticsView";
export { DonorPanel } from "./DonorPanel";
export { KeyboardShortcuts } from "./KeyboardShortcuts";
export { ReportGenerator } from "./ReportGenerator";
