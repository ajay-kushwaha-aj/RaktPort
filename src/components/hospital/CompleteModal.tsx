// hospital/CompleteModal.tsx — Administration confirmation
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { HeartHandshake, CheckCircle2, CheckSquare, BadgeCheck, Clock, Info } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import type { BloodRequest } from "./types";

export const CompleteModal = ({
  isOpen, onClose, request, onConfirm,
}: {
  isOpen: boolean; onClose: () => void; request: BloodRequest | null;
  onConfirm: (id: string, unitsNow: number, notes: string) => Promise<void>;
}) => {
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [administered, setAdministered] = useState(false);
  const [noReaction, setNoReaction] = useState(false);
  const [consentDone, setConsentDone] = useState(false);
  const [unitsNow, setUnitsNow] = useState(1);

  const already = request?.unitsAdministered ?? 0;
  const redeemed = request?.unitsFulfilled ?? 0;
  const required = request?.unitsRequired ?? 1;
  const pendingRedeemed = Math.max(0, redeemed - already);
  const pendingRequired = Math.max(0, required - already);
  const maxNow = Math.max(pendingRedeemed, pendingRequired);

  useEffect(() => {
    if (isOpen) {
      setNotes(""); setAdministered(false); setNoReaction(false); setConsentDone(false);
      setUnitsNow(Math.max(1, Math.min(pendingRequired, maxNow)));
    }
  }, [isOpen, maxNow, pendingRequired]);

  if (!request) return null;

  const isPartial = required > 1;
  const willComplete = (already + unitsNow) >= required;
  const canSubmit = administered && noReaction && unitsNow >= 1 && unitsNow <= maxNow;

  const handleConfirm = async () => {
    if (!canSubmit || isLoading) return;
    const result = await Swal.fire({
      title: willComplete
        ? "Confirm Full Administration"
        : `Confirm Partial Administration (${unitsNow} of ${required} units)`,
      html: `<div style="text-align:left;font-size:13px;line-height:1.7">
        <p><b>Patient:</b> ${request.patientName}</p>
        <p><b>Blood Group:</b> ${request.bloodGroup} · ${request.componentType || "Whole Blood"}</p>
        <p><b>Units administering now:</b> <strong style="color:#1e40af">${unitsNow}</strong></p>
        <p><b>Total after this:</b> ${already + unitsNow} / ${required}</p>
        ${willComplete
          ? `<p style="color:#15803d;font-weight:700;margin-top:8px">✅ This will CLOSE the request (all units administered)</p>`
          : `<p style="color:#c2410c;font-weight:700;margin-top:8px">⚡ ${required - (already + unitsNow)} unit(s) still pending after this</p>`}
        <p style="margin-top:8px;color:#6b7280;font-size:12px">This action is irreversible and will update Blood Bank & Donor dashboards.</p>
      </div>`,
      icon: willComplete ? "success" : "info",
      showCancelButton: true,
      confirmButtonColor: willComplete ? "#16a34a" : "#2563eb",
      cancelButtonColor: "#6b7280",
      confirmButtonText: willComplete ? "✅ Confirm & Close Request" : "⚡ Confirm Partial",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;
    setIsLoading(true);
    try { await onConfirm(request.id, unitsNow, notes); onClose(); }
    catch { toast.error("Failed to record administration"); }
    finally { setIsLoading(false); }
  };

  return (
    <Dialog open={isOpen} onOpenChange={o => { if (!o && !isLoading) onClose(); }}>
      <DialogContent className="sm:max-w-lg rounded-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-300" style={{ fontFamily: "Outfit,sans-serif" }}>
            <HeartHandshake className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Record Blood Administration
          </DialogTitle>
          <DialogDescription>MoHFW post-transfusion confirmation — updates all dashboards in real time</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Patient info card */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-xl flex-shrink-0">🩸</div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">{request.patientName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{request.bloodGroup} · {request.componentType || "Whole Blood"} · RTID: {request.rtid}</p>
              </div>
            </div>
            {/* Unit progress bar */}
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-gray-600 dark:text-gray-400">Units Progress</span>
                <span className="text-blue-700 dark:text-blue-300">{already} administered · {redeemed} redeemed · {required} required</span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                <div className="h-full bg-blue-500 transition-all" style={{ width: `${(already / required) * 100}%` }} title="Administered" />
                <div className="h-full bg-amber-400 transition-all" style={{ width: `${(Math.max(0, redeemed - already) / required) * 100}%` }} title="Redeemed, pending" />
              </div>
              <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full inline-block" />Administered</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded-full inline-block" />Redeemed / Pending</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 bg-gray-200 dark:bg-gray-600 rounded-full inline-block" />Outstanding</span>
              </div>
            </div>
          </div>

          {/* Unit selector */}
          {isPartial && maxNow > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-2">
                🩸 How many units are you administering now?
                <span className="ml-1 font-normal text-amber-600 dark:text-amber-400">({maxNow} unit{maxNow > 1 ? "s" : ""} available)</span>
              </p>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setUnitsNow(u => Math.max(1, u - 1))}
                  className="w-9 h-9 rounded-lg border-2 border-amber-300 dark:border-amber-600 font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 flex items-center justify-center transition-colors">−</button>
                <div className="flex-1 text-center">
                  <div className="text-3xl font-black text-amber-800 dark:text-amber-200" style={{ fontFamily: "Outfit,sans-serif" }}>{unitsNow}</div>
                  <div className="text-[10px] text-amber-600 dark:text-amber-400">of {required} total units</div>
                </div>
                <button type="button" onClick={() => setUnitsNow(u => Math.min(maxNow, u + 1))}
                  className="w-9 h-9 rounded-lg border-2 border-amber-300 dark:border-amber-600 font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 flex items-center justify-center transition-colors">+</button>
              </div>
              {willComplete
                ? <p className="mt-2 text-xs text-green-700 dark:text-green-400 font-semibold text-center">✅ All units will be administered — request will close</p>
                : <p className="mt-2 text-xs text-orange-700 dark:text-orange-400 font-semibold text-center">⚡ {required - (already + unitsNow)} unit(s) will remain pending after this</p>}
            </div>
          )}

          {/* MoHFW checklist */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> MoHFW Post-Transfusion Checklist
            </p>
            {[
              { id: "admin", label: `Blood (${unitsNow} unit${unitsNow > 1 ? "s" : ""}) has been administered to the patient`, checked: administered, set: setAdministered, required: true },
              { id: "react", label: "No immediate adverse transfusion reaction observed", checked: noReaction, set: setNoReaction, required: true },
              { id: "consent", label: "Patient / guardian informed of transfusion", checked: consentDone, set: setConsentDone, required: false },
            ].map(item => (
              <label key={item.id} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${item.checked ? "border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-950/30" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                <input type="checkbox" className="mt-0.5 w-4 h-4 accent-green-600 flex-shrink-0" checked={item.checked} onChange={e => item.set(e.target.checked)} />
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{item.label}{item.required && <span className="text-red-500 ml-0.5">*</span>}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="hd-label">Clinical Notes (optional)</label>
            <textarea className="hd-input" rows={2} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Transfusion completed without complications, Hb improved…" style={{ resize: "none" }} />
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              {willComplete
                ? <><strong>All units administered:</strong> Request will be marked CLOSED and all linked donor/blood bank dashboards updated in real time.</>
                : <><strong>Partial administration:</strong> Status will update to PARTIALLY ADMINISTERED. Remaining units can be recorded later.</>}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-2">
          <button type="button" onClick={onClose} disabled={isLoading}
            className="flex-1 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} disabled={!canSubmit || isLoading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 ${canSubmit && !isLoading ? (willComplete ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700") : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"}`}>
            {isLoading
              ? <><Clock className="w-4 h-4 animate-spin" />Saving…</>
              : willComplete
                ? <><CheckCircle2 className="w-4 h-4" />Confirm & Close Request</>
                : <><BadgeCheck className="w-4 h-4" />Record Partial Administration</>}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
