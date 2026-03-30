// hospital/TransfusionHistoryView.tsx — History tab
import { useState, useMemo } from "react";
import { Search, HeartHandshake } from "lucide-react";
import { getStatusMeta } from "./constants";
import { formatDate, formatTime } from "./utils";
import type { BloodRequest } from "./types";

export function TransfusionHistoryView({ requests }: { requests: BloodRequest[] }) {
  const [search, setSearch] = useState("");
  const administered = useMemo(() =>
    requests
      .filter(r => ["ADMINISTERED", "PARTIALLY ADMINISTERED", "CLOSED"].includes(r.status) || r.unitsAdministered > 0)
      .filter(r => !search || r.patientName.toLowerCase().includes(search.toLowerCase()) || r.rtid.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (b.administeredAt?.getTime() || b.createdAt.getTime()) - (a.administeredAt?.getTime() || a.createdAt.getTime()))
    , [requests, search]);

  const totalUnitsAdmin = administered.reduce((s, r) => s + (r.unitsAdministered || 0), 0);

  return (
    <div className="space-y-5 hd-enter">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: "💉", label: "Transfusions Done", val: administered.length, cls: "k-blue" },
          { icon: "🩸", label: "Total Units Given", val: totalUnitsAdmin, cls: "k-red" },
          { icon: "✅", label: "Fully Closed", val: administered.filter(r => r.status === "CLOSED").length, cls: "k-green" },
        ].map(k => (
          <div key={k.label} className={`hd-kpi ${k.cls}`}>
            <div className="text-2xl mb-1">{k.icon}</div>
            <div className="hd-kpi-val">{k.val}</div>
            <div className="hd-kpi-lbl">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="hd-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="hd-search" placeholder="Search patient, RTID…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {administered.length === 0 ? (
        <div className="hd-card p-12 text-center">
          <div className="text-5xl opacity-20 mb-3">💉</div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">No transfusion records yet</p>
          <p className="text-xs text-gray-400 mt-1">Records appear here after blood is administered to a patient</p>
        </div>
      ) : (
        <div className="hd-card overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="hd-sec-title">All Transfusion Records</span>
            <span className="text-xs text-gray-400 ml-auto">{administered.length} records</span>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {administered.map((r, i) => {
              const sm = getStatusMeta(r.status);
              const history = r.transfusionHistory || [];
              return (
                <div key={r.id} className="p-4 hd-enter" style={{ animationDelay: `${i * 0.04}s` }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-lg flex-shrink-0">💉</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{r.patientName}</span>
                        {r.age && <span className="text-xs text-gray-400">{r.age}y</span>}
                        <span className="text-xs font-black px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800">{r.bloodGroup}</span>
                        <span className="hd-status border text-[11px]" style={{ background: sm.bg, color: sm.text, borderColor: sm.border }}>{sm.label}</span>
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span className="font-mono">{r.rtid}</span>
                        <span>{r.componentType || "Whole Blood"}</span>
                        <span className="text-blue-600 dark:text-blue-400 font-semibold">{r.unitsAdministered || 0}/{r.unitsRequired} units administered</span>
                        {r.wardDepartment && <span>· {r.wardDepartment}</span>}
                        {r.bedNumber && <span>· Bed {r.bedNumber}</span>}
                      </div>
                      {/* Unit progress bar */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="hd-validity flex-1 h-2">
                          <div className="hd-validity-fill" style={{ width: `${r.unitsRequired > 0 ? ((r.unitsAdministered || 0) / r.unitsRequired) * 100 : 0}%`, background: "#3b82f6" }} />
                        </div>
                        <span className="text-[10px] text-gray-400">{Math.round(r.unitsRequired > 0 ? ((r.unitsAdministered || 0) / r.unitsRequired) * 100 : 0)}%</span>
                      </div>
                      {/* Transfusion history records */}
                      {history.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {history.map((h, hi) => (
                            <div key={hi} className="flex items-center gap-2 text-[11px] bg-blue-50 dark:bg-blue-950/30 rounded-lg px-3 py-1.5 border border-blue-100 dark:border-blue-800">
                              <span className="text-blue-600 dark:text-blue-400 font-bold">{h.unitsAdministered}u</span>
                              <span className="text-gray-500 dark:text-gray-400">·</span>
                              <span className="text-gray-600 dark:text-gray-400">{new Date(h.recordedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                              {h.notes && <><span className="text-gray-400">·</span><span className="text-gray-500 dark:text-gray-400 truncate">{h.notes}</span></>}
                              <span className="text-gray-400 ml-auto">{h.administeredBy}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[10px] text-gray-400">{r.administeredAt ? formatDate(r.administeredAt) : "—"}</div>
                      <div className="text-[10px] text-gray-400">{r.administeredAt ? formatTime(r.administeredAt) : ""}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
