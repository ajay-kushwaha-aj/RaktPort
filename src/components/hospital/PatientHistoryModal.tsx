// hospital/PatientHistoryModal.tsx — Patient History Lookup (Phase 2)
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, User, Droplet, Clock, Activity } from "lucide-react";
import { getStatusMeta, URGENCY_CONFIG } from "./constants";
import { formatDate, formatTime, isRequestValid, getTimeRemaining } from "./utils";
import type { BloodRequest } from "./types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  requests: BloodRequest[];
}

export function PatientHistoryModal({ isOpen, onClose, requests }: Props) {
  const [search, setSearch] = useState("");

  // Group requests by patient (name + mobile as key)
  const patients = useMemo(() => {
    const map = new Map<string, { name: string; mobile: string; requests: BloodRequest[] }>();
    requests.forEach(r => {
      const key = `${r.patientName.toLowerCase().trim()}|${r.patientMobile || ""}`;
      if (!map.has(key)) {
        map.set(key, { name: r.patientName, mobile: r.patientMobile || "", requests: [] });
      }
      map.get(key)!.requests.push(r);
    });
    // Sort each patient's requests by date
    map.forEach(p => p.requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    return Array.from(map.values()).sort((a, b) => b.requests.length - a.requests.length);
  }, [requests]);

  const filtered = useMemo(() => {
    if (!search.trim()) return patients;
    const s = search.toLowerCase().trim();
    return patients.filter(p =>
      p.name.toLowerCase().includes(s) ||
      p.mobile.includes(s) ||
      p.requests.some(r => r.rtid.toLowerCase().includes(s))
    );
  }, [patients, search]);

  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const activePatient = filtered.find(p => `${p.name}|${p.mobile}` === selectedPatient);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl p-0">
        <DialogHeader className="p-5 pb-0">
          <DialogTitle className="flex items-center gap-2 text-[var(--clr-brand)]" style={{ fontFamily: "Outfit,sans-serif" }}>
            <User className="w-5 h-5" /> Patient History Lookup
          </DialogTitle>
          <DialogDescription>View all blood requests for a specific patient</DialogDescription>
        </DialogHeader>

        <div className="px-5 pt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="hd-search"
              placeholder="Search by patient name, mobile, or RTID…"
              value={search}
              onChange={e => { setSearch(e.target.value); setSelectedPatient(null); }}
              autoFocus
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">{filtered.length} patient{filtered.length !== 1 ? "s" : ""} found</p>
        </div>

        <div className="p-5 pt-3 space-y-3 max-h-[60vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl opacity-20 mb-2">🔍</div>
              <p className="text-sm text-gray-400">No patients found</p>
            </div>
          ) : !activePatient ? (
            /* Patient list */
            filtered.slice(0, 20).map(p => {
              const totalUnits = p.requests.reduce((s, r) => s + r.unitsRequired, 0);
              const administeredUnits = p.requests.reduce((s, r) => s + (r.unitsAdministered || 0), 0);
              const lastReq = p.requests[0];
              const bloodGroups = [...new Set(p.requests.map(r => r.bloodGroup))];
              return (
                <button
                  key={`${p.name}|${p.mobile}`}
                  onClick={() => setSelectedPatient(`${p.name}|${p.mobile}`)}
                  className="w-full hd-card p-4 text-left hover:border-[var(--clr-brand)]/20 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-lg flex-shrink-0 border border-red-100 dark:border-red-800">
                      {p.name[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[var(--txt-heading)] dark:text-gray-200 text-sm">{p.name}</span>
                        {bloodGroups.map(bg => (
                          <span key={bg} className="text-[10px] font-black px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-[var(--clr-emergency)] border border-red-100 dark:border-red-800">{bg}</span>
                        ))}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {p.requests.length} request{p.requests.length > 1 ? "s" : ""} · {totalUnits}u required · {administeredUnits}u administered · Last: {formatDate(lastReq.createdAt)}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 group-hover:text-[var(--clr-brand)] transition-colors">→</span>
                  </div>
                </button>
              );
            })
          ) : (
            /* Patient detail view */
            <div className="space-y-4">
              <button onClick={() => setSelectedPatient(null)} className="text-xs text-[var(--clr-brand)] dark:text-[var(--clr-emergency)] font-semibold hover:underline">← Back to list</button>

              {/* Patient summary card */}
              <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-4 border border-red-100 dark:border-red-900/40">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-[var(--clr-brand)] flex items-center justify-center text-[var(--txt-inverse)] text-xl font-black" style={{ fontFamily: "Outfit,sans-serif" }}>
                    {activePatient.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-[var(--txt-heading)] dark:text-gray-100">{activePatient.name}</p>
                    <p className="text-xs text-[var(--txt-body)] dark:text-gray-400">{activePatient.mobile || "No mobile"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Total Requests", val: activePatient.requests.length, icon: "📋" },
                    { label: "Units Required", val: activePatient.requests.reduce((s, r) => s + r.unitsRequired, 0), icon: "🩸" },
                    { label: "Units Given", val: activePatient.requests.reduce((s, r) => s + (r.unitsAdministered || 0), 0), icon: "💉" },
                    { label: "Blood Groups", val: [...new Set(activePatient.requests.map(r => r.bloodGroup))].join(", "), icon: "🔬" },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <div className="text-lg">{s.icon}</div>
                      <div className="text-sm font-black text-[var(--txt-heading)] dark:text-gray-200" style={{ fontFamily: "Outfit,sans-serif" }}>{s.val}</div>
                      <div className="text-[9px] text-gray-400 font-medium">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Request timeline */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-[var(--txt-body)] dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[var(--clr-brand)]" /> Request History
                </p>
                {activePatient.requests.map((r, i) => {
                  const sm = getStatusMeta(isRequestValid(r) ? r.status : "EXPIRED");
                  const uc = URGENCY_CONFIG[r.urgency || "Routine"];
                  return (
                    <div key={r.id} className="hd-card p-3 hd-enter" style={{ animationDelay: `${i * 0.04}s` }}>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 border" style={{ background: uc.bg, borderColor: uc.border }}>
                          {uc.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-[var(--clr-emergency)] border border-red-100 dark:border-red-800">{r.bloodGroup}</span>
                            <span className="text-xs text-[var(--txt-body)] dark:text-gray-400">{r.componentType || "Whole Blood"} × {r.unitsRequired}u</span>
                            <span className="hd-status border text-[10px]" style={{ background: sm.bg, color: sm.text, borderColor: sm.border }}>{sm.label}</span>
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-2">
                            <span className="font-mono">{r.rtid}</span>
                            <span>·</span>
                            <span>{formatDate(r.createdAt)} {formatTime(r.createdAt)}</span>
                          </div>
                          {r.unitsAdministered > 0 && (
                            <div className="text-[11px] text-[var(--clr-info)] dark:text-[var(--clr-info)] font-semibold mt-0.5">
                              💉 {r.unitsAdministered}/{r.unitsRequired} units administered
                              {r.administeredAt && ` · ${formatDate(r.administeredAt)}`}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
