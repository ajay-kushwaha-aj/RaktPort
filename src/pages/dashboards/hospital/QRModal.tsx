// hospital/QRModal.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";
import { QRCanvas } from "./QRCanvas";
import { URGENCY_CONFIG, getStatusMeta } from "./constants";
import { isRequestValid, getTimeRemaining, getValidityPct, getQRPayload } from "./utils";
import type { BloodRequest } from "./types";

export const QRModal = ({ isOpen, onClose, request }: { isOpen: boolean; onClose: () => void; request: BloodRequest | null }) => {
  if (!request) return null;
  const isV = isRequestValid(request);
  const rem = getTimeRemaining(request);
  const pct = getValidityPct(request);
  const sm = getStatusMeta(isV ? request.status : "EXPIRED");
  const uc = URGENCY_CONFIG[request.urgency || "Routine"];
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[95vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--clr-brand)]" style={{ fontFamily: "Outfit,sans-serif" }}>
            <QrCode className="w-5 h-5" /> QR Code · {request.rtid}
          </DialogTitle>
          <DialogDescription>Scan at any blood bank to verify this requisition</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          <div className={`p-3 rounded-xl border-2 bg-[var(--bg-surface)] ${!isV ? "opacity-50" : ""}`} style={{ borderColor: isV ? "#e5e7eb" : "#fca5a5" }}>
            <QRCanvas data={getQRPayload(request)} size={200} />
          </div>
          <div className="w-full space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-secondary)] dark:text-gray-400 font-medium">Validity remaining</span>
              <span className={`font-bold ${isV ? "text-[var(--clr-success)]" : "text-[var(--clr-danger)]"}`}>{rem}</span>
            </div>
            <div className="hd-validity">
              <div className="hd-validity-fill" style={{ width: `${pct}%`, background: pct > 50 ? "#22c55e" : pct > 20 ? "#f59e0b" : "var(--clr-emergency)" }} />
            </div>
          </div>
          <div className="w-full bg-[var(--bg-page)] dark:bg-gray-800/50 rounded-xl p-3 border dark:border-gray-700 text-sm space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {[["Patient", request.patientName], ["Blood Group", request.bloodGroup], ["Component", request.componentType || "Whole Blood"], ["Units", String(request.unitsRequired)]].map(([k, v]) => (
                <div key={k}><p className="text-[10px] text-gray-400 uppercase font-semibold">{k}</p><p className="font-semibold text-[var(--text-primary)] dark:text-gray-200">{v}</p></div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="hd-urg" style={{ background: uc.bg, color: uc.color, border: `1px solid ${uc.border}` }}>{uc.emoji} {request.urgency || "Routine"}</span>
              <span className="hd-status border" style={{ background: sm.bg, color: sm.text, borderColor: sm.border }}>{sm.label}</span>
            </div>
          </div>
        </div>
        <Button onClick={onClose} className="w-full bg-rp-primary hover:bg-rp-primary-dark">Close</Button>
      </DialogContent>
    </Dialog>
  );
};
