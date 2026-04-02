// hospital/EditRequestModal.tsx — Edit existing blood request (Phase 2)
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import {
  X, Pencil, User, Droplet, Stethoscope, Info, AlertTriangle, Save, MapPin
} from "lucide-react";
// @ts-ignore
import { BLOOD_GROUPS } from "@/lib/bloodbank-utils";
import { URGENCY_CONFIG, BLOOD_COMPONENT_TYPES, TRANSFUSION_INDICATIONS } from "./constants";
import type { BloodRequest, UrgencyLevel, BloodGroup, BloodComponentType, TransfusionIndication } from "./types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: Record<string, any>) => Promise<void>;
  request: BloodRequest | null;
}

export const EditRequestModal = ({ isOpen, onClose, onSave, request }: Props) => {
  const [patientName, setPatientName] = useState("");
  const [age, setAge] = useState("");
  const [mobile, setMobile] = useState("");
  const [wardDepartment, setWardDepartment] = useState("");
  const [bedNumber, setBedNumber] = useState("");
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | "">("");
  const [componentType, setComponentType] = useState<BloodComponentType>("Whole Blood");
  const [transfusionIndication, setTransfusionIndication] = useState<TransfusionIndication>("Anemia");
  const [unitsRequired, setUnitsRequired] = useState(1);
  const [doctorName, setDoctorName] = useState("");
  const [doctorRegNo, setDoctorRegNo] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [urgency, setUrgency] = useState<UrgencyLevel>("Routine");
  const [saving, setSaving] = useState(false);

  // Pre-fill from request
  useEffect(() => {
    if (isOpen && request) {
      setPatientName(request.patientName || "");
      setAge(request.age ? String(request.age) : "");
      setMobile(request.patientMobile || "");
      setWardDepartment(request.wardDepartment || "");
      setBedNumber(request.bedNumber || "");
      setBloodGroup(request.bloodGroup || "");
      setComponentType((request.componentType || "Whole Blood") as BloodComponentType);
      setTransfusionIndication((request.transfusionIndication || "Anemia") as TransfusionIndication);
      setUnitsRequired(request.unitsRequired || 1);
      setDoctorName(request.doctorName || "");
      setDoctorRegNo(request.doctorRegNo || "");
      setCity(request.city || "");
      setPincode(request.pincode || "");
      setUrgency(request.urgency || "Routine");
    }
  }, [isOpen, request]);

  const numOnly = (setter: (v: string) => void, max: number) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setter(e.target.value.replace(/\D/g, "").slice(0, max));

  const handleSave = async () => {
    if (!request || saving) return;
    if (!patientName.trim()) { toast.error("Patient name is required"); return; }
    if (!bloodGroup) { toast.error("Blood group is required"); return; }
    if (!city.trim()) { toast.error("City is required"); return; }

    setSaving(true);
    try {
      const updates: Record<string, any> = {
        patientName: patientName.trim(),
        age: age ? String(age) : "",
        patientMobile: mobile,
        wardDepartment: wardDepartment.trim() || "",
        bedNumber: bedNumber.trim() || "",
        bloodGroup,
        componentType,
        transfusionIndication,
        units: String(unitsRequired),
        doctorName: doctorName.trim() || "",
        doctorRegNo: doctorRegNo.trim() || "",
        city: city.trim(),
        pincode,
        urgency,
        validityHours: URGENCY_CONFIG[urgency].validityHours,
        lastEditedAt: new Date().toISOString(),
      };
      await onSave(request.id, updates);
      toast.success("Request updated successfully");
      onClose();
    } catch (err: any) {
      toast.error("Failed to update request", { description: err?.message });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !request) return null;

  const canEdit = ["CREATED", "PENDING"].includes(request.status);
  const uc = URGENCY_CONFIG[urgency];

  return (
    <Dialog open={isOpen} onOpenChange={o => { if (!o && !saving) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--clr-bg-card)] dark:bg-gray-900 rounded-t-2xl border-b border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-xl flex-shrink-0">✏️</div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-[var(--txt-heading)] dark:text-gray-100" style={{ fontFamily: "Outfit,sans-serif" }}>Edit Blood Request</h2>
              <p className="text-xs text-[var(--txt-body)] dark:text-gray-400">RTID: {request.rtid} · {request.status}</p>
            </div>
            <button type="button" onClick={() => { if (!saving) onClose(); }} className="w-8 h-8 rounded-lg bg-[var(--clr-bg-page)] dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center">
              <X className="w-4 h-4 text-[var(--txt-body)] dark:text-gray-400" />
            </button>
          </div>
        </div>

        {!canEdit ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-[var(--txt-heading)] dark:text-gray-100 mb-2">Cannot Edit Request</h3>
            <p className="text-sm text-[var(--txt-body)] dark:text-gray-400">
              Requests with status <strong>{request.status}</strong> cannot be edited.
              Only requests in CREATED or PENDING status can be modified.
            </p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Urgency */}
            <div className="bg-gradient-to-r from-gray-50 dark:from-gray-800/50 to-white dark:to-gray-900 rounded-xl p-4 border border-[var(--clr-border)] dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-bold text-[var(--txt-heading)] dark:text-gray-200">Urgency Level</span>
              </div>
              <div className="hd-urg-selector">
                {(["Emergency", "Urgent", "Routine"] as UrgencyLevel[]).map(lvl => {
                  const u = URGENCY_CONFIG[lvl];
                  return (
                    <button key={lvl} type="button" onClick={() => setUrgency(lvl)} className={`hd-urg-opt ${urgency === lvl ? u.selClass : ""}`}>
                      <div className="hd-urg-emoji">{u.emoji}</div>
                      <div className="hd-urg-name" style={{ color: urgency === lvl ? u.color : undefined }}>{lvl}</div>
                      <div className="hd-urg-time">{u.timeNeeded}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Patient Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2"><User className="w-4 h-4 text-[var(--clr-info)]" /><span className="text-sm font-bold text-[var(--txt-heading)] dark:text-gray-200">Patient Information</span></div>
              <div><label className="hd-label">Patient Name <span className="hd-required">*</span></label><input className="hd-input" value={patientName} onChange={e => setPatientName(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="hd-label">Age</label><input className="hd-input" type="number" min="1" max="120" value={age} onChange={e => setAge(e.target.value)} /></div>
                <div><label className="hd-label">Mobile</label><input className="hd-input" value={mobile} onChange={numOnly(setMobile, 10)} maxLength={10} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="hd-label">Ward / Department</label><input className="hd-input" value={wardDepartment} onChange={e => setWardDepartment(e.target.value)} /></div>
                <div><label className="hd-label">Bed Number</label><input className="hd-input" value={bedNumber} onChange={e => setBedNumber(e.target.value)} /></div>
              </div>
            </div>

            {/* Blood Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2"><Droplet className="w-4 h-4 text-[var(--clr-emergency)]" /><span className="text-sm font-bold text-[var(--txt-heading)] dark:text-gray-200">Blood Details</span></div>
              <div>
                <label className="hd-label">Blood Group <span className="hd-required">*</span></label>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {BLOOD_GROUPS.map((bg: string) => (
                    <button key={bg} type="button" onClick={() => setBloodGroup(bg as BloodGroup)}
                      className={`py-2 rounded-xl text-sm font-black border-2 transition-all ${bloodGroup === bg ? "bg-[var(--clr-brand)] text-[var(--txt-inverse)] border-[var(--clr-brand)] scale-105 shadow-md" : "bg-[var(--clr-bg-page)] dark:bg-gray-800 text-[var(--txt-body)] dark:text-gray-400 border-[var(--clr-border)] dark:border-gray-700"}`}>
                      {bg}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="hd-label">Component</label><select className="hd-input" value={componentType} onChange={e => setComponentType(e.target.value as BloodComponentType)}>{BLOOD_COMPONENT_TYPES.map(c => <option key={c}>{c}</option>)}</select></div>
                <div>
                  <label className="hd-label">Units <span className="hd-required">*</span></label>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setUnitsRequired(u => Math.max(1, u - 1))} className="w-9 h-9 rounded-lg border-2 border-[var(--clr-border)] dark:border-gray-700 font-bold text-[var(--txt-body)] dark:text-gray-400 flex items-center justify-center">−</button>
                    <input className="hd-input text-center font-bold" type="number" min="1" max="20" value={unitsRequired} onChange={e => setUnitsRequired(+e.target.value || 1)} />
                    <button type="button" onClick={() => setUnitsRequired(u => Math.min(20, u + 1))} className="w-9 h-9 rounded-lg border-2 border-[var(--clr-border)] dark:border-gray-700 font-bold text-[var(--txt-body)] dark:text-gray-400 flex items-center justify-center">+</button>
                  </div>
                </div>
              </div>
              <div>
                <label className="hd-label">Indication</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {TRANSFUSION_INDICATIONS.map(ind => (
                    <button key={ind} type="button" onClick={() => setTransfusionIndication(ind)}
                      className={`py-2 rounded-xl text-[11px] font-semibold border-2 transition-all ${transfusionIndication === ind ? "bg-[var(--clr-info)] text-[var(--txt-inverse)] border-[var(--clr-info)]" : "bg-[var(--clr-bg-page)] dark:bg-gray-800 text-[var(--txt-body)] dark:text-gray-400 border-[var(--clr-border)] dark:border-gray-700"}`}>
                      {ind}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Doctor & Location */}
            <div className="space-y-3">
              <div className="flex items-center gap-2"><Stethoscope className="w-4 h-4 text-[var(--clr-success)]" /><span className="text-sm font-bold text-[var(--txt-heading)] dark:text-gray-200">Doctor & Location</span></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="hd-label">Doctor Name</label><input className="hd-input" value={doctorName} onChange={e => setDoctorName(e.target.value)} /></div>
                <div><label className="hd-label">MCI Reg.</label><input className="hd-input" value={doctorRegNo} onChange={e => setDoctorRegNo(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="hd-label">City <span className="hd-required">*</span></label><input className="hd-input" value={city} onChange={e => setCity(e.target.value)} /></div>
                <div><label className="hd-label">Pincode</label><input className="hd-input" value={pincode} onChange={numOnly(setPincode, 6)} maxLength={6} /></div>
              </div>
            </div>

            {/* Info box */}
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div><strong>Note:</strong> Editing will update the request in the database. The RTID and creation timestamp remain unchanged. An audit record will be logged.</div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button type="button" onClick={onClose} disabled={saving} className="flex-1 py-2.5 border-2 border-[var(--clr-border)] dark:border-gray-700 rounded-xl text-sm font-semibold text-[var(--txt-body)] dark:text-gray-400 hover:bg-[var(--clr-bg-page)] dark:hover:bg-gray-800 transition-all">Cancel</button>
              <button type="button" onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-[var(--txt-inverse)] transition-all flex items-center justify-center gap-2" style={{ background: saving ? "#d1d5db" : "linear-gradient(135deg,var(--clr-brand),#b30000)" }}>
                {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Changes</>}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
