// hospital/NewRequestModal.tsx — 3-step blood requisition form
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import {
  X, Siren, User, Droplet, Stethoscope, Info, CheckCircle2,
  Clock, FileText, BookOpen, AlertTriangle, MapPin
} from "lucide-react";
// @ts-ignore
import { BLOOD_GROUPS } from "@/lib/bloodbank-utils";
import { URGENCY_CONFIG, BLOOD_COMPONENT_TYPES, TRANSFUSION_INDICATIONS } from "./constants";
import type { UrgencyLevel, BloodGroup, BloodComponentType, TransfusionIndication } from "./types";

interface Props {
  isOpen: boolean; onClose: () => void;
  onSubmit: (d: any) => Promise<void>;
  defaultCity: string; defaultPincode: string;
  defaultUrgency: UrgencyLevel; hospitalName: string;
}

export const NewRequestModal = ({
  isOpen, onClose, onSubmit, defaultCity, defaultPincode, defaultUrgency, hospitalName,
}: Props) => {
  const [patientName, setPatientName] = useState("");
  const [age, setAge] = useState("");
  const [mobile, setMobile] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [wardDepartment, setWardDepartment] = useState("");
  const [bedNumber, setBedNumber] = useState("");
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | "">("");
  const [componentType, setComponentType] = useState<BloodComponentType>("Whole Blood");
  const [transfusionIndication, setTransfusionIndication] = useState<TransfusionIndication>("Anemia");
  const [unitsRequired, setUnitsRequired] = useState(1);
  const [requiredByDate, setRequiredByDate] = useState(new Date().toISOString().split("T")[0]);
  const [requiredByTime, setRequiredByTime] = useState("12:00");
  const [doctorName, setDoctorName] = useState("");
  const [doctorRegNo, setDoctorRegNo] = useState("");
  const [city, setCity] = useState(defaultCity);
  const [pincode, setPincode] = useState(defaultPincode);
  const [urgency, setUrgency] = useState<UrgencyLevel>(defaultUrgency);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const TOTAL = 3;

  useEffect(() => {
    if (isOpen) {
      setUrgency(defaultUrgency); setCity(defaultCity); setPincode(defaultPincode);
      setStep(1); setIsSubmitting(false); setSubmitError("");
      setPatientName(""); setAge(""); setMobile(""); setAadhaar("");
      setWardDepartment(""); setBedNumber(""); setBloodGroup("");
      setComponentType("Whole Blood"); setTransfusionIndication("Anemia");
      setUnitsRequired(1); setDoctorName(""); setDoctorRegNo("");
      setRequiredByDate(new Date().toISOString().split("T")[0]); setRequiredByTime("12:00");
    }
  }, [isOpen, defaultUrgency, defaultCity, defaultPincode]);

  const numOnly = (setter: (v: string) => void, max: number) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setter(e.target.value.replace(/\D/g, "").slice(0, max));

  const validateStep1 = (): string => {
    if (!patientName.trim()) return "Patient name is required";
    if (!age || +age <= 0 || +age > 120) return "Enter a valid age (1–120)";
    if (mobile.length !== 10) return "Mobile must be 10 digits";
    if (aadhaar.length !== 12) return "Aadhaar must be 12 digits";
    return "";
  };
  const validateStep2 = (): string => {
    if (!bloodGroup) return "Select a blood group";
    if (!requiredByDate) return "Required date is mandatory";
    if (!requiredByTime) return "Required time is mandatory";
    const dt = new Date(`${requiredByDate}T${requiredByTime}`);
    if (isNaN(dt.getTime())) return "Invalid date or time";
    return "";
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation(); setSubmitError("");
    if (step === 1) { const err = validateStep1(); if (err) { setSubmitError(err); toast.error(err); return; } }
    if (step === 2) { const err = validateStep2(); if (err) { setSubmitError(err); toast.error(err); return; } }
    setStep(s => s + 1);
  };
  const handleBack = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setSubmitError(""); setStep(s => s - 1); };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== TOTAL || isSubmitting) return;
    if (!city.trim()) { toast.error("City is required"); return; }
    if (pincode.length !== 6) { toast.error("Valid 6-digit pincode required"); return; }
    setIsSubmitting(true); setSubmitError("");
    try {
      await onSubmit({
        patientName: patientName.trim(), age: +age, mobile, aadhaar,
        wardDepartment: wardDepartment.trim() || null, bedNumber: bedNumber.trim() || null,
        bloodGroup, componentType, transfusionIndication,
        unitsRequired, requiredByDate, requiredByTime,
        doctorName: doctorName.trim() || null, doctorRegNo: doctorRegNo.trim() || null,
        city: city.trim(), pincode, urgency,
      });
      onClose();
    } catch (err: any) { setSubmitError(err?.message || "Failed to submit"); toast.error("Submission failed"); }
    finally { setIsSubmitting(false); }
  };

  const uc = URGENCY_CONFIG[urgency];
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={o => { if (!o && !isSubmitting) { onClose(); } }}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl p-0">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 rounded-t-2xl border-b border-gray-100 dark:border-gray-800 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: uc.bg }}>{uc.emoji}</div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100" style={{ fontFamily: "Outfit,sans-serif" }}>New Blood Requisition</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">NACO/MoHFW Compliant · {hospitalName}</p>
            </div>
            <button type="button" onClick={() => { if (!isSubmitting) onClose(); }} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center">
              <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 mt-4">
            {["Patient Info", "Blood Details", "Doctor & Location"].map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-all ${step === i + 1 ? "bg-[#8B0000] text-white shadow" : step > i + 1 ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-gray-100 dark:bg-gray-800 text-gray-400"}`}>
                  {step > i + 1 ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-3.5 h-3.5 rounded-full border-2 border-current flex items-center justify-center text-[9px]">{i + 1}</span>}
                  <span className="hidden sm:inline">{s}</span>
                </div>
                {i < 2 && <div className={`flex-1 h-0.5 rounded-full ${step > i + 1 ? "bg-green-400" : "bg-gray-200 dark:bg-gray-700"}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <form onSubmit={handleFinalSubmit} className="p-5 space-y-5">
          {/* Urgency */}
          <div className="bg-gradient-to-r from-gray-50 dark:from-gray-800/50 to-white dark:to-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Siren className="w-4 h-4 text-red-600" />
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Urgency Level</span>
              <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 font-semibold">NACO Guideline</span>
            </div>
            <div className="hd-urg-selector">
              {(["Emergency", "Urgent", "Routine"] as UrgencyLevel[]).map(lvl => {
                const u = URGENCY_CONFIG[lvl];
                return (
                  <button key={lvl} type="button" onClick={() => setUrgency(lvl)} className={`hd-urg-opt ${urgency === lvl ? u.selClass : ""}`}>
                    <div className="hd-urg-emoji">{u.emoji}</div>
                    <div className="hd-urg-name" style={{ color: urgency === lvl ? u.color : undefined }}>{lvl}</div>
                    <div className="hd-urg-time">{u.timeNeeded}</div>
                    <div className="text-[10px] font-bold mt-1" style={{ color: urgency === lvl ? u.color : undefined }}>Valid {u.validityHours}h</div>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 p-3 rounded-xl border text-xs flex items-start gap-2" style={{ background: uc.bg, borderColor: uc.border, color: uc.color }}>
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <div><strong>{uc.description}</strong><div className="opacity-75 mt-0.5">NACO: {uc.nacoNote}</div></div>
            </div>
          </div>

          {submitError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />{submitError}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 hd-enter">
              <div className="flex items-center gap-2"><User className="w-4 h-4 text-blue-600" /><span className="text-sm font-bold text-gray-800 dark:text-gray-200">Patient Information</span></div>
              <div><label className="hd-label">Patient Full Name <span className="hd-required">*</span></label><input className="hd-input" value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="As per ID proof" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="hd-label">Age (Years) <span className="hd-required">*</span></label><input className="hd-input" type="number" min="1" max="120" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 35" /></div>
                <div><label className="hd-label">Mobile No. <span className="hd-required">*</span></label><input className="hd-input" value={mobile} onChange={numOnly(setMobile, 10)} maxLength={10} placeholder="10-digit" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="hd-label">Aadhaar No. <span className="hd-required">*</span></label><input className="hd-input" value={aadhaar} onChange={numOnly(setAadhaar, 12)} maxLength={12} placeholder="12-digit" />
                  {aadhaar.length > 0 && (<div className="flex gap-0.5 mt-1.5">{Array.from({ length: 12 }).map((_, i) => (<div key={i} className={`flex-1 h-1 rounded-full transition-all ${i < aadhaar.length ? "bg-[#8B0000]" : "bg-gray-200 dark:bg-gray-700"}`} />))}</div>)}
                </div>
                <div><label className="hd-label">Bed Number</label><input className="hd-input" value={bedNumber} onChange={e => setBedNumber(e.target.value)} placeholder="e.g. ICU-12" /></div>
              </div>
              <div><label className="hd-label">Ward / Department</label><input className="hd-input" value={wardDepartment} onChange={e => setWardDepartment(e.target.value)} placeholder="e.g. ICU, OT, Emergency" /></div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 hd-enter">
              <div className="flex items-center gap-2"><Droplet className="w-4 h-4 text-red-600" /><span className="text-sm font-bold text-gray-800 dark:text-gray-200">Blood Component Details</span></div>
              <div><label className="hd-label">Blood Group <span className="hd-required">*</span></label>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {BLOOD_GROUPS.map((bg: string) => (
                    <button key={bg} type="button" onClick={() => setBloodGroup(bg as BloodGroup)}
                      className={`py-2.5 rounded-xl text-sm font-black border-2 transition-all ${bloodGroup === bg ? "bg-[#8B0000] text-white border-[#8B0000] scale-105 shadow-md" : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-[#8B0000]/40"}`}>
                      {bg}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="hd-label">Component Type</label><select className="hd-input" value={componentType} onChange={e => setComponentType(e.target.value as BloodComponentType)}>{BLOOD_COMPONENT_TYPES.map(c => <option key={c}>{c}</option>)}</select></div>
                <div><label className="hd-label">Units Required <span className="hd-required">*</span></label>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setUnitsRequired(u => Math.max(1, u - 1))} className="w-9 h-9 rounded-lg border-2 border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-400 hover:border-[#8B0000] transition-colors flex items-center justify-center">−</button>
                    <input className="hd-input text-center font-bold text-base" type="number" min="1" max="20" value={unitsRequired} onChange={e => setUnitsRequired(+e.target.value || 1)} />
                    <button type="button" onClick={() => setUnitsRequired(u => Math.min(20, u + 1))} className="w-9 h-9 rounded-lg border-2 border-gray-200 dark:border-gray-700 font-bold text-gray-600 dark:text-gray-400 hover:border-[#8B0000] transition-colors flex items-center justify-center">+</button>
                  </div>
                </div>
              </div>
              <div><label className="hd-label">Indication for Transfusion <span className="hd-required">*</span></label>
                <div className="grid grid-cols-4 gap-1.5">
                  {TRANSFUSION_INDICATIONS.map(ind => (
                    <button key={ind} type="button" onClick={() => setTransfusionIndication(ind)}
                      className={`py-2 rounded-xl text-[11px] font-semibold border-2 transition-all ${transfusionIndication === ind ? "bg-blue-600 text-white border-blue-600" : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-300"}`}>
                      {ind}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="hd-label">Required By — Date <span className="hd-required">*</span></label><input className="hd-input" type="date" value={requiredByDate} min={new Date().toISOString().split("T")[0]} onChange={e => setRequiredByDate(e.target.value)} /></div>
                <div><label className="hd-label">Required By — Time <span className="hd-required">*</span></label><input className="hd-input" type="time" value={requiredByTime} onChange={e => setRequiredByTime(e.target.value)} /></div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 hd-enter">
              <div className="flex items-center gap-2"><Stethoscope className="w-4 h-4 text-green-600" /><span className="text-sm font-bold text-gray-800 dark:text-gray-200">Doctor & Location Details</span></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="hd-label">Doctor Name</label><input className="hd-input" value={doctorName} onChange={e => setDoctorName(e.target.value)} placeholder="Dr. Full Name" /></div>
                <div><label className="hd-label">MCI Registration No.</label><input className="hd-input" value={doctorRegNo} onChange={e => setDoctorRegNo(e.target.value)} placeholder="MCI/SMC Reg. No." /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="hd-label">City <span className="hd-required">*</span></label><input className="hd-input" value={city} onChange={e => setCity(e.target.value)} /></div>
                <div><label className="hd-label">Pincode <span className="hd-required">*</span></label><input className="hd-input" value={pincode} onChange={numOnly(setPincode, 6)} maxLength={6} /></div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Request Summary</p>
                <div className="grid grid-cols-2 gap-3">
                  {[["Patient", patientName || "—"], ["Age", age ? `${age} yrs` : "—"], ["Blood Group", bloodGroup || "—"], ["Component", componentType], ["Units", String(unitsRequired)], ["Urgency", urgency], ["Valid for", `${uc.validityHours} hours`], ["Indication", transfusionIndication]].map(([k, v]) => (
                    <div key={k}><p className="text-[10px] text-gray-400 font-semibold uppercase">{k}</p><p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{v}</p></div>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-800 dark:text-blue-300">
                <BookOpen className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                <div><strong>MoHFW / NACO Compliance:</strong> By submitting, you confirm the transfusion is clinically justified, informed consent obtained, and all pre-transfusion checks will be performed.</div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            {step > 1 ? (
              <button type="button" onClick={handleBack} className="flex-1 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">← Back</button>
            ) : (
              <button type="button" onClick={() => onClose()} className="flex-1 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">Cancel</button>
            )}
            {step < TOTAL ? (
              <button type="button" onClick={handleNext} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all" style={{ background: "linear-gradient(135deg,#8B0000,#b30000)" }}>Continue →</button>
            ) : (
              <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2" style={{ background: isSubmitting ? "#d1d5db" : `linear-gradient(135deg,${uc.color},#8B0000)` }}>
                {isSubmitting ? <><Clock className="w-4 h-4 animate-spin" /> Creating…</> : <><FileText className="w-4 h-4" /> Generate RTID & Print</>}
              </button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
