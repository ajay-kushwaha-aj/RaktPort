// hospital/RequestsView.tsx — All Requests tab (Phase 3-4)
import { useState, useMemo } from "react";
import {
  Search, QrCode, Copy, Trash2, Printer, ChevronDown,
  CheckCircle2, HeartHandshake, Pencil, CopyPlus, ChevronLeft, ChevronRight, Calendar
} from "lucide-react";
// @ts-ignore
import { BLOOD_GROUPS } from "@/lib/bloodbank-utils";
import { URGENCY_CONFIG, getStatusMeta } from "./constants";
import { isRequestValid, getTimeRemaining, getValidityPct, formatDate, formatTime, timeAgo, canDeleteRequest, maskAadhaar } from "./utils";
import { StatusTimeline } from "./StatusTimeline";
import { DonorPanel } from "./DonorPanel";
import type { BloodRequest, UrgencyLevel } from "./types";

const PAGE_SIZE = 15;

interface RequestsViewProps {
  requests: BloodRequest[];
  onViewQR: (r: BloodRequest) => void;
  onCopyRTID: (rtid: string) => void;
  onDelete: (id: string) => void;
  onPrint: (r: BloodRequest) => void;
  onConfirmReceipt: (id: string, r: BloodRequest) => void;
  onNewRequest: (u: UrgencyLevel) => void;
  onMarkComplete: (r: BloodRequest) => void;
  onWhatsAppShare: (r: BloodRequest) => void;
  onEditRequest?: (r: BloodRequest) => void;
  onDuplicate?: (r: BloodRequest) => void;
}

export function RequestsView({
  requests, onViewQR, onCopyRTID, onDelete, onPrint,
  onConfirmReceipt, onNewRequest, onMarkComplete, onWhatsAppShare, onEditRequest, onDuplicate,
}: RequestsViewProps) {
  const [search, setSearch] = useState("");
  const [filterBG, setFilterBG] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterUrgency, setFilterUrgency] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    let f = [...requests];
    if (filterBG !== "All") f = f.filter(r => r.bloodGroup === filterBG);
    if (filterUrgency !== "All") f = f.filter(r => r.urgency === filterUrgency);
    if (filterStatus !== "All") {
      if (filterStatus === "VALID") f = f.filter(r => isRequestValid(r) && !["REDEEMED", "PARTIALLY ADMINISTERED", "ADMINISTERED", "CLOSED", "EXPIRED", "CANCELLED"].includes(r.status));
      else if (filterStatus === "EXPIRED") f = f.filter(r => !isRequestValid(r) || r.status === "EXPIRED");
      else f = f.filter(r => r.status === filterStatus);
    }
    if (dateFrom) { const from = new Date(dateFrom); f = f.filter(r => r.createdAt >= from); }
    if (dateTo) { const to = new Date(dateTo + "T23:59:59"); f = f.filter(r => r.createdAt <= to); }
    if (search) { const s = search.toLowerCase(); f = f.filter(r => r.patientName.toLowerCase().includes(s) || r.rtid.toLowerCase().includes(s) || (r.serialNumber || "").toLowerCase().includes(s) || (r.doctorName || "").toLowerCase().includes(s)); }
    if (sortBy === "newest") f.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    if (sortBy === "urgency") f.sort((a, b) => ({ Emergency: 0, Urgent: 1, Routine: 2 }[a.urgency || "Routine"] || 2) - ({ Emergency: 0, Urgent: 1, Routine: 2 }[b.urgency || "Routine"] || 2));
    if (sortBy === "validity") f.sort((a, b) => getValidityPct(b) - getValidityPct(a));
    return f;
  }, [requests, filterBG, filterStatus, filterUrgency, search, sortBy, dateFrom, dateTo]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = useMemo(() => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [filtered, page]);

  return (
    <div className="space-y-5">
      <div className="hd-card p-4 hd-enter">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="hd-search" placeholder="Search patient name, RTID…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { val: filterBG, set: setFilterBG, opts: ["All", ...BLOOD_GROUPS] },
              { val: filterUrgency, set: setFilterUrgency, opts: ["All", "Emergency", "Urgent", "Routine"] },
              { val: filterStatus, set: setFilterStatus, opts: ["All", "VALID", "PENDING", "PARTIAL", "PARTIAL REDEEMED", "REDEEMED", "PARTIALLY ADMINISTERED", "ADMINISTERED", "CLOSED", "EXPIRED"] },
              { val: sortBy, set: setSortBy, opts: ["newest", "urgency", "validity"] },
            ].map((f, fi) => (
              <select key={fi} value={f.val} onChange={e => f.set(e.target.value)}
                className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium outline-none cursor-pointer">
                {f.opts.map((o: string) => <option key={o}>{o}</option>)}
              </select>
            ))}
          </div>
        </div>
        {/* Date range filters */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span className="text-[10px] text-gray-400 font-semibold">Date Range:</span>
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(0); }} className="text-[11px] border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none" />
          <span className="text-[10px] text-gray-400">to</span>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(0); }} className="text-[11px] border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(""); setDateTo(""); setPage(0); }} className="text-[10px] text-[#8B0000] font-semibold hover:underline">Clear</button>
          )}
          <span className="ml-auto text-xs text-gray-400">{filtered.length} of {requests.length} · Page {page + 1}/{totalPages || 1}</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="hd-card p-12 text-center">
          <div className="text-5xl opacity-20 mb-3">🔍</div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">No requests found</p>
          <button onClick={() => onNewRequest("Routine")} className="mt-4 text-sm text-[#8B0000] dark:text-red-400 font-semibold hover:underline">Create new request →</button>
        </div>
      ) : (
        <div className="space-y-3">
          {paged.map((r, i) => {
            const isV = isRequestValid(r); const sm = getStatusMeta(isV ? r.status : "EXPIRED");
            const uc2 = URGENCY_CONFIG[r.urgency || "Routine"]; const rem = getTimeRemaining(r);
            const pct = getValidityPct(r); const isExp = expanded === r.id;
            const fulfPct = r.unitsRequired > 0 ? ((r.unitsAdministered || 0) / r.unitsRequired) * 100 : 0;
            const canVerify = ["REDEEMED", "PARTIAL REDEEMED"].includes(r.status);
            const pendingAdmin = (r.unitsFulfilled || 0) - (r.unitsAdministered || 0);
            const canComplete = pendingAdmin > 0 || ["REDEEMED", "PARTIAL REDEEMED", "HOSPITAL VERIFIED", "PARTIALLY ADMINISTERED"].includes(r.status);

            return (
              <div key={r.id} className="hd-card overflow-hidden" style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="p-4 cursor-pointer" onClick={() => setExpanded(isExp ? null : r.id)}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 border" style={{ background: uc2.bg, borderColor: uc2.border }}>
                      {r.urgency === "Emergency" ? "🚨" : r.urgency === "Urgent" ? "⚡" : "📋"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{r.patientName}</span>
                        {r.age && <span className="text-xs text-gray-400">{r.age}y</span>}
                        <span className="text-xs font-black px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800">{r.bloodGroup}</span>
                        {r.urgency === "Emergency" && <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">EMERGENCY</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap text-[11px] text-gray-400">
                        <span className="font-mono">{r.rtid}</span>
                        <span>{r.componentType || "Whole Blood"} × {r.unitsRequired}</span>
                        {r.wardDepartment && <span>{r.wardDepartment}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="hd-validity flex-1"><div className="hd-validity-fill" style={{ width: `${pct}%`, background: pct > 50 ? "#22c55e" : pct > 20 ? "#f59e0b" : "#ef4444" }} /></div>
                        <span className={`text-[10px] font-semibold ${isV ? "text-gray-500 dark:text-gray-400" : "text-red-500"}`}>{rem}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className="hd-status border text-[11px]" style={{ background: sm.bg, color: sm.text, borderColor: sm.border }}>{sm.label}</span>
                      {r.unitsFulfilled > 0 && <span className="text-[10px] text-gray-500 dark:text-gray-400">{r.unitsFulfilled}/{r.unitsRequired} fulfilled</span>}
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExp ? "rotate-180" : ""}`} />
                    </div>
                  </div>
                  {r.unitsFulfilled > 0 && <div className="hd-prog mt-2"><div className="hd-prog-fill" style={{ width: `${fulfPct}%` }} /></div>}
                </div>

                {isExp && (
                  <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 p-4 space-y-4 hd-enter">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {[
                        ["Serial", r.serialNumber || "—"],
                        ["Required By", `${formatDate(r.requiredBy)} ${formatTime(r.requiredBy)}`],
                        ["Created", timeAgo(r.createdAt)],
                        ["Indication", r.transfusionIndication || "—"],
                        ["Doctor", r.doctorName || "—"],
                        ["Reg. No", r.doctorRegNo || "—"],
                        ["Bed", r.bedNumber || "—"],
                        ["Mobile", r.patientMobile ? maskAadhaar(r.patientMobile) : "—"],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase">{k}</p>
                          <p className="text-gray-800 dark:text-gray-300 font-medium mt-0.5">{v}</p>
                        </div>
                      ))}
                    </div>
                    {/* Status Timeline */}
                    <div className="bg-white dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                      <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Status Timeline</p>
                      <StatusTimeline request={r} />
                    </div>
                    {/* Linked Donors */}
                    {r.donors && r.donors.length > 0 && <DonorPanel request={r} />}
                    {r.administeredAt && (
                      <div className="flex items-center gap-2 p-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl text-xs text-blue-800 dark:text-blue-300">
                        <HeartHandshake className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <span>Blood administered on <strong>{formatDate(r.administeredAt)} {formatTime(r.administeredAt)}</strong></span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button onClick={e => { e.stopPropagation(); onPrint(r); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all"><Printer className="w-3.5 h-3.5" />Print Slip</button>
                      <button onClick={e => { e.stopPropagation(); onViewQR(r); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all"><QrCode className="w-3.5 h-3.5" />View QR</button>
                      <button onClick={e => { e.stopPropagation(); onCopyRTID(r.rtid); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-all"><Copy className="w-3.5 h-3.5" />Copy RTID</button>
                      <button onClick={e => { e.stopPropagation(); onWhatsAppShare(r); }} className="hd-share-wa"><span style={{ fontSize: "0.75rem" }}>💬</span> WhatsApp</button>
                      {["CREATED", "PENDING"].includes(r.status) && onEditRequest && (
                        <button onClick={e => { e.stopPropagation(); onEditRequest(r); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-700 dark:text-amber-400 transition-all"><Pencil className="w-3.5 h-3.5" />Edit</button>
                      )}
                      {onDuplicate && (
                        <button onClick={e => { e.stopPropagation(); onDuplicate(r); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-gray-800 border border-violet-200 dark:border-violet-800 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-950/30 text-violet-700 dark:text-violet-400 transition-all"><CopyPlus className="w-3.5 h-3.5" />Duplicate</button>
                      )}
                      {canVerify && (
                        <button onClick={e => { e.stopPropagation(); onConfirmReceipt(r.id, r); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"><CheckCircle2 className="w-3.5 h-3.5" />Confirm Receipt</button>
                      )}
                      {canComplete && r.status !== "ADMINISTERED" && r.status !== "CLOSED" && (
                        <button onClick={e => { e.stopPropagation(); onMarkComplete(r); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
                          <HeartHandshake className="w-3.5 h-3.5" />
                          {r.unitsAdministered > 0 && r.unitsAdministered < r.unitsRequired
                            ? `Record More (${r.unitsAdministered}/${r.unitsRequired})`
                            : "Mark Administered"}
                        </button>
                      )}
                      {canDeleteRequest(r) && (
                        <button onClick={e => { e.stopPropagation(); onDelete(r.id); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 transition-all ml-auto"><Trash2 className="w-3.5 h-3.5" />Delete</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="hd-card p-3 flex items-center justify-between hd-enter">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
            <ChevronLeft className="w-3.5 h-3.5" /> Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const pg = totalPages <= 7 ? i : page <= 3 ? i : page >= totalPages - 4 ? totalPages - 7 + i : page - 3 + i;
              return (
                <button key={pg} onClick={() => setPage(pg)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    page === pg
                      ? "bg-[#8B0000] text-white shadow-md"
                      : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}>{pg + 1}</button>
              );
            })}
          </div>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
