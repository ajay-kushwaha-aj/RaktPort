// hospital/AnalyticsView.tsx — Analytics Dashboard with pure CSS/SVG charts (Phase 3)
import { useMemo } from "react";
import { TrendingUp, BarChart3, PieChart, Activity, Calendar } from "lucide-react";
import { URGENCY_CONFIG } from "./constants";
import { formatDate } from "./utils";
import type { BloodRequest, UrgencyLevel, BloodGroup, BloodComponentType } from "./types";
// @ts-ignore
import { BLOOD_GROUPS } from "@/lib/bloodbank-utils";

interface AnalyticsViewProps { requests: BloodRequest[]; }

/* ── Pure SVG donut chart ── */
function DonutChart({ data, size = 120 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {data.filter(d => d.value > 0).map((d, i) => {
        const pct = d.value / total;
        const dash = c * pct;
        const gap = c - dash;
        const el = <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={d.color} strokeWidth={16} strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset} strokeLinecap="round" style={{ transition: "all 0.6s ease" }} />;
        offset += dash;
        return el;
      })}
      <text x={size / 2} y={size / 2 - 5} textAnchor="middle" className="fill-gray-800 dark:fill-gray-200" style={{ fontSize: "22px", fontWeight: 900, fontFamily: "Outfit,sans-serif" }}>{total}</text>
      <text x={size / 2} y={size / 2 + 12} textAnchor="middle" className="fill-gray-400" style={{ fontSize: "9px", fontWeight: 600 }}>TOTAL</text>
    </svg>
  );
}

/* ── Horizontal bar ── */
function HBar({ label, value, max, color, emoji }: { label: string; value: number; max: number; color: string; emoji: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-base w-6 text-center">{emoji}</span>
      <span className="w-20 text-xs font-semibold text-gray-600 dark:text-gray-400 truncate">{label}</span>
      <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-8 text-right text-xs font-bold text-gray-700 dark:text-gray-300">{value}</span>
    </div>
  );
}

/* ── Sparkline mini chart ── */
function Sparkline({ data, color, h = 40 }: { data: number[]; color: string; h?: number }) {
  if (data.length < 2) return <div className="h-10 flex items-center justify-center text-[10px] text-gray-400">Not enough data</div>;
  const max = Math.max(...data, 1);
  const w = 200;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 4)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: h }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`0,${h} ${points} ${w},${h}`} fill={`${color}15`} stroke="none" />
    </svg>
  );
}

export function AnalyticsView({ requests }: AnalyticsViewProps) {
  const activeReqs = useMemo(() => requests.filter(r => !["CANCELLED"].includes(r.status)), [requests]);

  /* ── Urgency distribution ── */
  const urgencyData = useMemo(() => {
    const counts: Record<UrgencyLevel, number> = { Emergency: 0, Urgent: 0, Routine: 0 };
    activeReqs.forEach(r => { counts[r.urgency || "Routine"]++; });
    return [
      { label: "Emergency", value: counts.Emergency, color: "#ef4444" },
      { label: "Urgent", value: counts.Urgent, color: "#f59e0b" },
      { label: "Routine", value: counts.Routine, color: "#22c55e" },
    ];
  }, [activeReqs]);

  /* ── Blood group distribution ── */
  const bgData = useMemo(() => {
    const counts: Record<string, number> = {};
    BLOOD_GROUPS.forEach((bg: string) => { counts[bg] = 0; });
    activeReqs.forEach(r => { counts[r.bloodGroup] = (counts[r.bloodGroup] || 0) + 1; });
    const max = Math.max(...Object.values(counts), 1);
    const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"];
    return BLOOD_GROUPS.map((bg: string, i: number) => ({ label: bg, value: counts[bg], color: colors[i % colors.length], max }));
  }, [activeReqs]);

  /* ── Component type distribution ── */
  const compData = useMemo(() => {
    const counts: Record<string, number> = {};
    activeReqs.forEach(r => { const ct = r.componentType || "Whole Blood"; counts[ct] = (counts[ct] || 0) + 1; });
    const colorMap: Record<string, string> = { "Whole Blood": "#ef4444", PRBC: "#f59e0b", Platelets: "#22c55e", FFP: "#3b82f6", Cryoprecipitate: "#8b5cf6" };
    return Object.entries(counts).map(([k, v]) => ({ label: k, value: v, color: colorMap[k] || "#6b7280" }));
  }, [activeReqs]);

  /* ── Monthly trend (last 6 months) ── */
  const monthlyTrend = useMemo(() => {
    const months: { label: string; created: number; fulfilled: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const m = d.getMonth(); const y = d.getFullYear();
      const label = d.toLocaleString("en-IN", { month: "short" });
      const created = activeReqs.filter(r => r.createdAt.getMonth() === m && r.createdAt.getFullYear() === y).length;
      const fulfilled = activeReqs.filter(r => r.createdAt.getMonth() === m && r.createdAt.getFullYear() === y && r.unitsFulfilled > 0).length;
      months.push({ label, created, fulfilled });
    }
    return months;
  }, [activeReqs]);

  /* ── KPIs ── */
  const stats = useMemo(() => {
    const totalUnits = activeReqs.reduce((s, r) => s + r.unitsRequired, 0);
    const fulfilledUnits = activeReqs.reduce((s, r) => s + (r.unitsFulfilled || 0), 0);
    const administeredUnits = activeReqs.reduce((s, r) => s + (r.unitsAdministered || 0), 0);
    const fulfillRate = totalUnits > 0 ? Math.round((fulfilledUnits / totalUnits) * 100) : 0;
    const adminRate = totalUnits > 0 ? Math.round((administeredUnits / totalUnits) * 100) : 0;
    const avgAge = activeReqs.filter(r => r.age).reduce((s, r) => s + (r.age || 0), 0) / (activeReqs.filter(r => r.age).length || 1);
    const uniquePatients = new Set(activeReqs.map(r => `${r.patientName.toLowerCase()}|${r.patientMobile}`)).size;
    const uniqueDoctors = new Set(activeReqs.filter(r => r.doctorName).map(r => r.doctorName!.toLowerCase())).size;
    return { totalUnits, fulfilledUnits, administeredUnits, fulfillRate, adminRate, avgAge: Math.round(avgAge), uniquePatients, uniqueDoctors };
  }, [activeReqs]);

  /* ── Status breakdown ── */
  const statusData = useMemo(() => {
    const map: Record<string, { count: number; color: string }> = {
      Active: { count: activeReqs.filter(r => ["CREATED", "PENDING", "PROCESSING", "PLEDGED", "PARTIAL"].includes(r.status)).length, color: "#f59e0b" },
      Fulfilled: { count: activeReqs.filter(r => ["REDEEMED", "HOSPITAL VERIFIED", "PARTIAL REDEEMED"].includes(r.status)).length, color: "#22c55e" },
      Administered: { count: activeReqs.filter(r => ["ADMINISTERED", "PARTIALLY ADMINISTERED", "CLOSED"].includes(r.status)).length, color: "#3b82f6" },
      Expired: { count: activeReqs.filter(r => r.status === "EXPIRED").length, color: "#ef4444" },
    };
    return Object.entries(map).map(([label, { count, color }]) => ({ label, value: count, color }));
  }, [activeReqs]);

  const maxBG = useMemo(() => Math.max(...bgData.map(d => d.value), 1), [bgData]);

  return (
    <div className="space-y-5 hd-enter">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: "📊", label: "Fulfillment Rate", val: `${stats.fulfillRate}%`, cls: "k-green" },
          { icon: "💉", label: "Admin Rate", val: `${stats.adminRate}%`, cls: "k-blue" },
          { icon: "👤", label: "Unique Patients", val: stats.uniquePatients, cls: "k-amber" },
          { icon: "🩺", label: "Doctors Involved", val: stats.uniqueDoctors, cls: "k-purple" },
        ].map(k => (
          <div key={k.label} className={`hd-kpi ${k.cls}`}>
            <div className="text-2xl mb-1">{k.icon}</div>
            <div className="hd-kpi-val">{k.val}</div>
            <div className="hd-kpi-lbl">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Urgency Donut */}
        <div className="hd-card p-4 hd-enter">
          <div className="flex items-center gap-2 mb-3"><PieChart className="w-4 h-4 text-[#8B0000]" /><span className="hd-sec-title">Urgency Distribution</span></div>
          <DonutChart data={urgencyData} />
          <div className="flex justify-center gap-4 mt-3">
            {urgencyData.map(d => (
              <div key={d.label} className="flex items-center gap-1.5 text-[10px]">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-gray-500 dark:text-gray-400 font-medium">{d.label}</span>
                <span className="font-bold text-gray-700 dark:text-gray-300">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Donut */}
        <div className="hd-card p-4 hd-enter hd-s2">
          <div className="flex items-center gap-2 mb-3"><Activity className="w-4 h-4 text-[#8B0000]" /><span className="hd-sec-title">Status Breakdown</span></div>
          <DonutChart data={statusData} />
          <div className="flex flex-wrap justify-center gap-3 mt-3">
            {statusData.map(d => (
              <div key={d.label} className="flex items-center gap-1.5 text-[10px]">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-gray-500 dark:text-gray-400 font-medium">{d.label}</span>
                <span className="font-bold text-gray-700 dark:text-gray-300">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Component Donut */}
        <div className="hd-card p-4 hd-enter hd-s3">
          <div className="flex items-center gap-2 mb-3"><BarChart3 className="w-4 h-4 text-[#8B0000]" /><span className="hd-sec-title">Component Types</span></div>
          <DonutChart data={compData} />
          <div className="flex flex-wrap justify-center gap-3 mt-3">
            {compData.map(d => (
              <div key={d.label} className="flex items-center gap-1.5 text-[10px]">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-gray-500 dark:text-gray-400 font-medium">{d.label}</span>
                <span className="font-bold text-gray-700 dark:text-gray-300">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Blood Group Bars + Monthly Trend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="hd-card p-4 hd-enter">
          <div className="flex items-center gap-2 mb-3"><span className="text-lg">🩸</span><span className="hd-sec-title">Blood Group Demand</span></div>
          <div className="space-y-0.5">
            {bgData.map(d => <HBar key={d.label} label={d.label} value={d.value} max={maxBG} color={d.color} emoji="🔴" />)}
          </div>
        </div>
        <div className="hd-card p-4 hd-enter hd-s2">
          <div className="flex items-center gap-2 mb-3"><TrendingUp className="w-4 h-4 text-[#8B0000]" /><span className="hd-sec-title">Monthly Trend (6 mo)</span></div>
          <div className="mb-2">
            <div className="flex items-center gap-4 text-[10px] mb-1">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#8B0000] rounded" />Created</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-500 rounded" />Fulfilled</span>
            </div>
            <Sparkline data={monthlyTrend.map(m => m.created)} color="#8B0000" />
            <div className="mt-1"><Sparkline data={monthlyTrend.map(m => m.fulfilled)} color="#22c55e" /></div>
          </div>
          <div className="flex justify-between text-[9px] text-gray-400 font-medium mt-1">
            {monthlyTrend.map(m => <span key={m.label}>{m.label}</span>)}
          </div>
          {/* Monthly table */}
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <table className="w-full text-[10px]">
              <thead><tr className="text-gray-400 font-semibold uppercase"><th className="text-left pb-1">Month</th><th className="text-center pb-1">Created</th><th className="text-center pb-1">Fulfilled</th></tr></thead>
              <tbody>{monthlyTrend.map(m => (<tr key={m.label}><td className="py-0.5 font-medium text-gray-600 dark:text-gray-400">{m.label}</td><td className="text-center font-bold text-[#8B0000]">{m.created}</td><td className="text-center font-bold text-green-600">{m.fulfilled}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Units summary */}
      <div className="hd-card p-5 hd-enter hd-s3">
        <div className="flex items-center gap-2 mb-4"><span className="text-lg">📈</span><span className="hd-sec-title">Unit Flow Summary</span></div>
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-black text-[#8B0000] dark:text-red-400" style={{ fontFamily: "Outfit,sans-serif" }}>{stats.totalUnits}</div>
            <div className="text-xs text-gray-400 font-medium mt-1">Total Required</div>
            <div className="mt-2 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-[#8B0000] rounded-full transition-all" style={{ width: "100%" }} /></div>
          </div>
          <div>
            <div className="text-3xl font-black text-green-600 dark:text-green-400" style={{ fontFamily: "Outfit,sans-serif" }}>{stats.fulfilledUnits}</div>
            <div className="text-xs text-gray-400 font-medium mt-1">Fulfilled</div>
            <div className="mt-2 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${stats.fulfillRate}%` }} /></div>
          </div>
          <div>
            <div className="text-3xl font-black text-blue-600 dark:text-blue-400" style={{ fontFamily: "Outfit,sans-serif" }}>{stats.administeredUnits}</div>
            <div className="text-xs text-gray-400 font-medium mt-1">Administered</div>
            <div className="mt-2 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${stats.adminRate}%` }} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
