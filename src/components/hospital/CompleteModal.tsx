// hospital/CompleteModal.tsx — Administration confirmation (z-index safe)
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { HeartHandshake, CheckCircle2, CheckSquare, BadgeCheck, Clock, Info, AlertTriangle, ArrowLeft } from "lucide-react";
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
  const [showConfirmation, setShowConfirmation] = useState(false);

  const already = request?.unitsAdministered ?? 0;
  const redeemed = request?.unitsFulfilled ?? 0;
  const required = request?.unitsRequired ?? 1;
  // STRICT: can only administer units that have been redeemed/donated
  const maxNow = Math.max(0, redeemed - already);
  const pendingRequired = Math.max(0, required - already);

  useEffect(() => {
    if (isOpen) {
      setNotes(""); setAdministered(false); setNoReaction(false); setConsentDone(false);
      setUnitsNow(maxNow > 0 ? Math.min(maxNow, pendingRequired || maxNow) : 0);
      setShowConfirmation(false);
    }
  }, [isOpen, maxNow, pendingRequired]);

  if (!request) return null;

  const isPartial = required > 1;
  const willComplete = (already + unitsNow) >= required;
  const canSubmit = administered && noReaction && unitsNow >= 1 && unitsNow <= maxNow;

  const handleConfirm = async () => {
    if (!canSubmit || isLoading) return;
    setIsLoading(true);
    try { await onConfirm(request.id, unitsNow, notes); onClose(); }
    catch { toast.error("Failed to record administration"); }
    finally { setIsLoading(false); }
  };

  return (
    <Dialog open={isOpen} onOpenChange={o => { if (!o && !isLoading) { setShowConfirmation(false); onClose(); } }}>
      <DialogContent className="sm:max-w-lg rounded-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-300" style={{ fontFamily: "Outfit,sans-serif" }}>
            <HeartHandshake className="w-5 h-5 text-[var(--clr-info)] dark:text-[var(--clr-info)]" /> Record Blood Administration
          </DialogTitle>
          <DialogDescription>MoHFW post-transfusion confirmation — updates all dashboards in real time</DialogDescription>
        </DialogHeader>

        {/* ── CONFIRMATION VIEW ── */}
        {showConfirmation ? (
          <div className="space-y-4 py-2">
            <div className={`rounded-2xl p-5 text-center border-2 ${
              willComplete
                ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
            }`}>
              <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center text-2xl mb-3 ${
                willComplete ? "bg-green-100 dark:bg-green-900/50" : "bg-blue-100 dark:bg-blue-900/50"
              }`}>
                {willComplete ? "✅" : "⚡"}
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "Outfit,sans-serif" }}>
                {willComplete ? "Confirm Full Administration" : `Confirm Partial Administration`}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {willComplete
                  ? "All units will be administered — request will CLOSE"
                  : `${unitsNow} of ${required} units — ${required - (already + unitsNow)} remaining`}
              </p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Patient</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{request.patientName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Blood Group</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{request.bloodGroup} · {request.componentType || "Whole Blood"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Units now</span>
                <span className="font-bold text-blue-700 dark:text-blue-300 text-base">{unitsNow}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500 dark:text-gray-400">Total after this</span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{already + unitsNow} / {required}</span>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>This action is <strong>irreversible</strong> and will update Blood Bank & Donor dashboards.</span>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowConfirmation(false)} disabled={isLoading}
                className="flex-1 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button type="button" onClick={handleConfirm} disabled={isLoading}
                className={`flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 ${
                  isLoading ? "bg-gray-400 cursor-not-allowed" : willComplete ? "bg-[var(--clr-success)] hover:bg-green-700 active:scale-[0.98]" : "bg-[var(--clr-info)] hover:bg-blue-700 active:scale-[0.98]"
                }`}>
                {isLoading
                  ? <><Clock className="w-4 h-4 animate-spin" />Saving…</>
                  : willComplete
                    ? <><CheckCircle2 className="w-4 h-4" />Confirm & Close</>
                    : <><BadgeCheck className="w-4 h-4" />Confirm Partial</>}
              </button>
            </div>
          </div>
        ) : (
          /* ── MAIN FORM VIEW ── */
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
                  <span className="text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="text-blue-700 dark:text-blue-300">{already} / {required} administered</span>
                </div>
                <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                  <div className="h-full bg-[var(--clr-info)] rounded-full transition-all" style={{ width: `${(already / required) * 100}%` }} title="Administered" />
                  <div className="h-full bg-amber-400 transition-all" style={{ width: `${(Math.max(0, redeemed - already) / required) * 100}%` }} title="Redeemed, pending" />
                </div>
                <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-[var(--clr-info)] rounded-full inline-block" />Administered</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded-full inline-block" />Redeemed</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-gray-200 dark:bg-gray-600 rounded-full inline-block" />Pending</span>
                </div>
              </div>
            </div>

            {/* Unit selector */}
            {isPartial && maxNow > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-2">
                  🩸 Units to administer now
                  <span className="ml-1 font-normal text-amber-600 dark:text-amber-400">({maxNow} available)</span>
                </p>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setUnitsNow(u => Math.max(1, u - 1))}
                    className="w-9 h-9 rounded-lg border-2 border-amber-300 dark:border-amber-600 font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 flex items-center justify-center transition-colors">−</button>
                  <div className="flex-1 text-center">
                    <div className="text-3xl font-black text-amber-800 dark:text-amber-200" style={{ fontFamily: "Outfit,sans-serif" }}>{unitsNow}</div>
                    <div className="text-[10px] text-amber-600 dark:text-amber-400">of {required} total</div>
                  </div>
                  <button type="button" onClick={() => setUnitsNow(u => Math.min(maxNow, u + 1))}
                    className="w-9 h-9 rounded-lg border-2 border-amber-300 dark:border-amber-600 font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 flex items-center justify-center transition-colors">+</button>
                </div>
              </div>
            )}

            {/* MoHFW checklist */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-[var(--clr-info)] dark:text-[var(--clr-info)]" /> Post-Transfusion Checklist
              </p>
              {[
                { id: "admin", label: `Blood (${unitsNow} unit${unitsNow > 1 ? "s" : ""}) administered`, checked: administered, set: setAdministered, required: true },
                { id: "react", label: "No adverse reaction observed", checked: noReaction, set: setNoReaction, required: true },
                { id: "consent", label: "Patient / guardian informed", checked: consentDone, set: setConsentDone, required: false },
              ].map(item => (
                <label key={item.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${item.checked ? "border-[var(--clr-success)] dark:border-[var(--clr-success)] bg-green-50 dark:bg-green-950/30" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                  <input type="checkbox" className="w-4 h-4 accent-green-600 flex-shrink-0 rounded" checked={item.checked} onChange={e => item.set(e.target.checked)} />
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{item.label}{item.required && <span className="text-[var(--clr-emergency)] ml-0.5">*</span>}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="hd-label">Clinical Notes (optional)</label>
              <textarea className="hd-input" rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Transfusion completed, Hb improved…" style={{ resize: "none" }} />
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={onClose} disabled={isLoading}
                className="flex-1 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                Cancel
              </button>
              <button type="button" onClick={() => setShowConfirmation(true)} disabled={!canSubmit || isLoading}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 ${canSubmit && !isLoading ? (willComplete ? "bg-[var(--clr-success)] hover:bg-green-700 active:scale-[0.98]" : "bg-[var(--clr-info)] hover:bg-blue-700 active:scale-[0.98]") : "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"}`}>
                {willComplete
                  ? <><CheckCircle2 className="w-4 h-4" />Confirm & Close Request</>
                  : <><BadgeCheck className="w-4 h-4" />Record Partial Administration</>}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
