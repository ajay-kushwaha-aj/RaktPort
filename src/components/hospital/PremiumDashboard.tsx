// hospital/PremiumDashboard.tsx — Overview tab
import { useMemo } from "react";
import {
  Plus, Clock, MapPin, Siren, BarChart2, TrendingUp, ClipboardList,
  Droplet, Zap, ArrowRight, HeartHandshake
} from "lucide-react";
// @ts-ignore
import { BLOOD_GROUPS } from "@/lib/bloodbank-utils";
import { URGENCY_CONFIG, getStatusMeta } from "./constants";
import { isRequestValid, getTimeRemaining, getValidityPct } from "./utils";
import type { BloodRequest, UrgencyLevel } from "./types";

interface PremiumDashboardProps {
  requests: BloodRequest[];
  hospitalData: any;
  kpis: any;
  onNewRequest: (u: UrgencyLevel) => void;
  onViewQR: (r: BloodRequest) => void;
  onDelete: (id: string) => void;
  onPrint: (r: BloodRequest) => void;
  onConfirmReceipt: (id: string, r: BloodRequest) => void;
  onMarkComplete: (r: BloodRequest) => void;
  onWhatsAppShare: (r: BloodRequest) => void;
  onExportCSV: () => void;
}

export function PremiumDashboard({
  requests, hospitalData, kpis, onNewRequest, onViewQR, onDelete, onPrint,
  onConfirmReceipt, onMarkComplete, onWhatsAppShare, onExportCSV,
}: PremiumDashboardProps) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const pending = requests.filter(r => isRequestValid(r) && !["REDEEMED", "HOSPITAL VERIFIED", "ADMINISTERED", "CLOSED", "EXPIRED", "CANCELLED"].includes(r.status));
  const critical = requests.filter(r => r.urgency === "Emergency" && isRequestValid(r) && !["REDEEMED", "ADMINISTERED", "CLOSED"].includes(r.status));
  const recentReqs = [...requests].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5);
  const bg_dist = BLOOD_GROUPS.reduce((acc: Record<string, number>, bg: string) => {
    acc[bg] = requests.filter(r => r.bloodGroup === bg && !["CANCELLED", "EXPIRED"].includes(r.status)).length;
    return acc;
  }, {});
  const maxBgCount = Math.max(...Object.values(bg_dist) as number[], 1);
  const kpiCards = [
    { label: "Total Requests", val: kpis.totalRequests, cls: "k-red", icon: "📋" },
    { label: "Active Requests", val: kpis.activeRequests, cls: "k-amber", icon: "⏳" },
    { label: "Units Required", val: kpis.totalUnits, cls: "k-blue", icon: "🩸" },
    { label: "Donations Rcvd", val: kpis.donationsReceived, cls: "k-green", icon: "✅" },
    { label: "Administered", val: kpis.administered, cls: "k-purple", icon: "💉" },
  ];

  return (
    <div className="space-y-6">
      {critical.length > 0 && (
        <div className="hd-enter bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-xl flex-shrink-0">🚨</div>
          <div className="flex-1">
            <p className="font-bold text-red-800 dark:text-red-300 text-sm">Emergency Blood Request Active</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{critical.length} emergency request{critical.length > 1 ? "s" : ""} pending — immediate action required</p>
          </div>
          <span className="text-xs font-bold bg-red-600 text-white px-3 py-1.5 rounded-lg animate-pulse">{critical.length} URGENT</span>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="hd-welcome hd-enter">
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-white/55">{greeting} 👋</p>
              <h2 className="hd-welcome-title mt-1">{(hospitalData?.fullName || "Hospital").toUpperCase()}</h2>
              <p className="text-xs text-white/40 mt-1">{dateStr}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {pending.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 bg-white/15 text-white/90 text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20">
                    <Clock className="w-3 h-3" />{pending.length} active request{pending.length > 1 ? "s" : ""}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 bg-white/10 text-white/70 text-xs px-3 py-1.5 rounded-full border border-white/15">
                  <MapPin className="w-3 h-3" />{hospitalData?.district || "…"}, {hospitalData?.pincode || "…"}
                </span>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap relative z-10">
              <button onClick={() => onNewRequest("Emergency")} className="hd-welcome-emg-btn">
                <Siren className="w-3.5 h-3.5" /> Emergency Request
              </button>
              <button onClick={() => onNewRequest("Routine")} className="hd-welcome-new-btn">
                <Plus className="w-3.5 h-3.5" /> New Request
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div>
        <div className="hd-sec-hdr"><span className="hd-sec-title"><BarChart2 className="w-4 h-4 text-[#8B0000]" /> Overview</span></div>
        <div className="hd-kpi-grid">
          {kpiCards.map((m, i) => (
            <div key={m.label} className={`hd-kpi ${m.cls} hd-enter hd-s${i + 1}`}>
              <div className="mb-2 text-2xl">{m.icon}</div>
              <div className="hd-kpi-val">{m.val.toLocaleString()}</div>
              <div className="hd-kpi-lbl">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Fulfillment */}
          <div className="hd-card p-5 hd-enter hd-s2">
            <div className="hd-sec-hdr mb-4"><span className="hd-sec-title"><TrendingUp className="w-4 h-4 text-green-600" /> Request Fulfillment</span></div>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="4" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#8B0000" strokeWidth="4"
                    strokeDasharray={`${kpis.totalRequests > 0 ? (kpis.requestsRedeemed / kpis.totalRequests) * 100 : 0} 100`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-black text-[#8B0000] dark:text-red-400" style={{ fontFamily: "Outfit,sans-serif" }}>
                    {kpis.totalRequests > 0 ? Math.round((kpis.requestsRedeemed / kpis.totalRequests) * 100) : 0}%
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {[
                  { label: "Administered", val: kpis.administered, color: "#3b82f6" },
                  { label: "Redeemed", val: kpis.requestsRedeemed, color: "#22c55e" },
                  { label: "Active", val: kpis.activeRequests, color: "#f59e0b" },
                ].map(s => (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">{s.label}</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{s.val}</span>
                    </div>
                    <div className="hd-prog">
                      <div className="hd-prog-fill" style={{ width: `${kpis.totalRequests > 0 ? (s.val / kpis.totalRequests) * 100 : 0}%`, background: s.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Requests */}
          <div className="hd-card overflow-hidden hd-enter hd-s3">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <span className="hd-sec-title"><ClipboardList className="w-4 h-4 text-[#8B0000]" /> Recent Requests</span>
              <span className="text-xs text-gray-400">{requests.length} total</span>
            </div>
            {recentReqs.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-4xl opacity-20 mb-2">📋</div>
                <p className="text-sm text-gray-400">No requests yet</p>
                <button onClick={() => onNewRequest("Routine")} className="mt-3 text-xs text-[#8B0000] dark:text-red-400 font-semibold hover:underline">Create first request →</button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {recentReqs.map((r, i) => {
                  const sm = getStatusMeta(isRequestValid(r) ? r.status : "EXPIRED");
                  const uc2 = URGENCY_CONFIG[r.urgency || "Routine"];
                  const rem = getTimeRemaining(r);
                  const pct = getValidityPct(r);
                  return (
                    <div key={r.id} className="hd-act-item px-4" style={{ animationDelay: `${i * 0.06}s` }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 border" style={{ background: uc2.bg, color: uc2.color, borderColor: uc2.border }}>
                        {r.urgency === "Emergency" ? "🚨" : r.urgency === "Urgent" ? "⚡" : "📋"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{r.patientName}</span>
                          <span className="text-xs font-black text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded border border-red-100 dark:border-red-800">{r.bloodGroup}</span>
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5"><span className="font-mono">{r.rtid}</span> · {r.unitsRequired}u</div>
                        <div className="hd-validity mt-1 w-24"><div className="hd-validity-fill" style={{ width: `${pct}%`, background: pct > 50 ? "#22c55e" : pct > 20 ? "#f59e0b" : "#ef4444" }} /></div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className="hd-status border" style={{ background: sm.bg, color: sm.text, borderColor: sm.border }}>{sm.label}</span>
                        <span className="text-[10px] text-gray-400">{rem}</span>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => onWhatsAppShare(r)} className="hd-share-wa" title="Share via WhatsApp">💬</button>
                          {(["REDEEMED", "PARTIAL REDEEMED", "HOSPITAL VERIFIED", "PARTIALLY ADMINISTERED"].includes(r.status) &&
                            r.status !== "CLOSED" &&
                            (r.unitsFulfilled || 0) > (r.unitsAdministered || 0)) && (
                              <button onClick={() => onMarkComplete(r)}
                                className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-0.5">
                                <HeartHandshake className="w-3 h-3" />
                                {(r.unitsAdministered || 0) > 0 ? `+More` : `Admin`}
                              </button>
                            )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-5">
          <div className="hd-card p-5 hd-enter hd-s2">
            <div className="hd-sec-hdr"><span className="hd-sec-title"><Droplet className="w-4 h-4 text-red-600 fill-red-500" /> Blood Group Demand</span></div>
            <div className="space-y-2">
              {BLOOD_GROUPS.filter((bg: string) => bg_dist[bg] > 0).sort((a: string, b: string) => (bg_dist[b] || 0) - (bg_dist[a] || 0)).map((bg: string) => (
                <div key={bg} className="flex items-center gap-2">
                  <span className="text-xs font-black text-red-700 dark:text-red-400 w-8 text-center bg-red-50 dark:bg-red-950/40 rounded-lg py-0.5 border border-red-100 dark:border-red-800">{bg}</span>
                  <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(bg_dist[bg] / maxBgCount) * 100}%`, background: "linear-gradient(90deg,#8B0000,#c41e3a)" }} /></div>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 w-4 text-right">{bg_dist[bg]}</span>
                </div>
              ))}
              {Object.values(bg_dist).every(v => v === 0) && <p className="text-xs text-gray-400 text-center py-4">No requests yet</p>}
            </div>
          </div>
          <div className="hd-card p-5 hd-enter hd-s3">
            <div className="hd-sec-hdr"><span className="hd-sec-title"><Zap className="w-4 h-4 text-amber-500" /> Quick Actions</span></div>
            <div className="space-y-2">
              {[
                { icon: "🚨", label: "Emergency Request", sub: "Life-threatening / Critical", color: "#fef2f2", darkColor: "#451a1a", act: () => onNewRequest("Emergency") },
                { icon: "⚡", label: "Urgent Request", sub: "Needed in 2–4 hours", color: "#fff7ed", darkColor: "#3b2508", act: () => onNewRequest("Urgent") },
                { icon: "📋", label: "Routine Request", sub: "Elective / Planned", color: "#f0fdf4", darkColor: "#0a2e14", act: () => onNewRequest("Routine") },
                { icon: "📥", label: "Export CSV", sub: "Download all request data", color: "#eff6ff", darkColor: "#1e2d4a", act: onExportCSV },
              ].map(a => (
                <button key={a.label} onClick={a.act}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-all text-left group"
                  onMouseEnter={e => (e.currentTarget.style.background = document.documentElement.classList.contains('dark') ? a.darkColor : a.color)}
                  onMouseLeave={e => (e.currentTarget.style.background = "")}>
                  <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-base flex-shrink-0">{a.icon}</div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{a.label}</div>
                    <div className="text-[11px] text-gray-400">{a.sub}</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 ml-auto transition-transform group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
