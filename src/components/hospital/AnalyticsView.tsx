// hospital/AnalyticsView.tsx — Analytics Dashboard v5.0 (Production Redesign)
import { useMemo } from "react";
import { TrendingUp, BarChart3, PieChart, Activity } from "lucide-react";
import { URGENCY_CONFIG } from "./constants";
import { formatDate } from "./utils";
import type { BloodRequest, UrgencyLevel, BloodGroup, BloodComponentType } from "./types";
// @ts-ignore
import { BLOOD_GROUPS } from "@/lib/bloodbank-utils";

interface AnalyticsViewProps { requests: BloodRequest[]; }

/* ── Donut Chart ── */
function DonutChart({ data, size = 130 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = size / 2 - 14;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ margin: "0 auto", display: "block" }}>
      {/* Background circle */}
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--c-surface-3)" strokeWidth={14} />
      {data.filter(d => d.value > 0).map((d, i) => {
        const pct = d.value / total;
        const dash = c * pct;
        const gap = c - dash;
        const el = (
          <circle
            key={i}
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={14}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            style={{ transition: "all 0.7s cubic-bezier(0.4,0,0.2,1)" }}
          />
        );
        offset += dash;
        return el;
      })}
      <text
        x={size / 2} y={size / 2 - 6}
        textAnchor="middle"
        style={{ fontSize: "20px", fontWeight: 800, fontFamily: "var(--f-display)", fill: "var(--c-text)" }}
      >
        {total}
      </text>
      <text
        x={size / 2} y={size / 2 + 10}
        textAnchor="middle"
        style={{ fontSize: "8px", fontWeight: 700, fill: "var(--c-text-4)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--f-body)" }}
      >
        TOTAL
      </text>
    </svg>
  );
}

/* ── Horizontal Bar ── */
function HBar({ label, value, max, color, emoji }: { label: string; value: number; max: number; color: string; emoji: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "5px 0" }}>
      <span style={{ fontSize: "0.8rem", width: "18px", textAlign: "center", flexShrink: 0 }}>{emoji}</span>
      <span style={{
        width: "32px", fontSize: "0.7rem", fontWeight: 700, color: "var(--c-brand)",
        fontFamily: "var(--f-display)", flexShrink: 0,
      }}>{label}</span>
      <div style={{
        flex: 1, height: "6px", background: "var(--c-surface-3)",
        borderRadius: "var(--r-pill)", overflow: "hidden",
      }}>
        <div style={{
          height: "100%", borderRadius: "var(--r-pill)",
          background: color, width: `${pct}%`,
          transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
          transformOrigin: "left",
          animation: "hd-bar-grow 0.8s ease both",
        }} />
      </div>
      <span style={{ width: "24px", textAlign: "right", fontSize: "0.72rem", fontWeight: 700, color: "var(--c-text-2)", flexShrink: 0 }}>
        {value}
      </span>
    </div>
  );
}

/* ── Sparkline ── */
function Sparkline({ data, color, h = 44 }: { data: number[]; color: string; h?: number }) {
  if (data.length < 2) {
    return (
      <div style={{ height: `${h}px`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", color: "var(--c-text-4)" }}>
        Not enough data
      </div>
    );
  }
  const max = Math.max(...data, 1);
  const w = 200;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 6)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: `${h}px` }}>
      <defs>
        <linearGradient id={`sg-${color.replace(/[^a-z]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={`0,${h} ${points} ${w},${h}`}
        fill={`url(#sg-${color.replace(/[^a-z]/gi, "")})`}
        stroke="none"
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      {data.length > 0 && (() => {
        const last = data[data.length - 1];
        const lx = w;
        const ly = h - (last / max) * (h - 6);
        return <circle cx={lx} cy={ly} r={3.5} fill={color} />;
      })()}
    </svg>
  );
}

/* ── Legend Item ── */
function LegendItem({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ fontSize: "0.68rem", color: "var(--c-text-3)", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--c-text)" }}>{value}</span>
    </div>
  );
}

/* ── Chart Card Wrapper ── */
function ChartCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="hd-card" style={{ padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
        {icon}
        <span className="hd-sec-title" style={{ fontSize: "0.85rem" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export function AnalyticsView({ requests }: AnalyticsViewProps) {
  const activeReqs = useMemo(() => requests.filter(r => !["CANCELLED"].includes(r.status)), [requests]);

  const urgencyData = useMemo(() => {
    const counts: Record<UrgencyLevel, number> = { Emergency: 0, Urgent: 0, Routine: 0 };
    activeReqs.forEach(r => { counts[r.urgency || "Routine"]++; });
    return [
      { label: "Emergency", value: counts.Emergency, color: "#EF4444" },
      { label: "Urgent", value: counts.Urgent, color: "#F97316" },
      { label: "Routine", value: counts.Routine, color: "#10B981" },
    ];
  }, [activeReqs]);

  const bgData = useMemo(() => {
    const counts: Record<string, number> = {};
    BLOOD_GROUPS.forEach((bg: string) => { counts[bg] = 0; });
    activeReqs.forEach(r => { counts[r.bloodGroup] = (counts[r.bloodGroup] || 0) + 1; });
    const max = Math.max(...Object.values(counts), 1);
    const colors = ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#06B6D4", "#3B82F6", "#8B5CF6", "#EC4899"];
    return BLOOD_GROUPS.map((bg: string, i: number) => ({ label: bg, value: counts[bg], color: colors[i % colors.length], max }));
  }, [activeReqs]);

  const compData = useMemo(() => {
    const counts: Record<string, number> = {};
    activeReqs.forEach(r => { const ct = r.componentType || "Whole Blood"; counts[ct] = (counts[ct] || 0) + 1; });
    const colorMap: Record<string, string> = {
      "Whole Blood": "#EF4444", PRBC: "#F97316", Platelets: "#10B981", FFP: "#3B82F6", Cryoprecipitate: "#8B5CF6",
    };
    return Object.entries(counts).map(([k, v]) => ({ label: k, value: v, color: colorMap[k] || "#6B7280" }));
  }, [activeReqs]);

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

  const statusData = useMemo(() => ({
    Active: activeReqs.filter(r => ["CREATED", "PENDING", "PROCESSING", "PLEDGED", "PARTIAL"].includes(r.status)).length,
    Fulfilled: activeReqs.filter(r => ["REDEEMED", "HOSPITAL VERIFIED", "PARTIAL REDEEMED"].includes(r.status)).length,
    Administered: activeReqs.filter(r => ["ADMINISTERED", "PARTIALLY ADMINISTERED", "CLOSED"].includes(r.status)).length,
    Expired: activeReqs.filter(r => r.status === "EXPIRED").length,
  }), [activeReqs]);

  const statusChartData = [
    { label: "Active", value: statusData.Active, color: "#F59E0B" },
    { label: "Fulfilled", value: statusData.Fulfilled, color: "#10B981" },
    { label: "Administered", value: statusData.Administered, color: "#3B82F6" },
    { label: "Expired", value: statusData.Expired, color: "#EF4444" },
  ];

  const stats = useMemo(() => {
    const totalUnits = activeReqs.reduce((s, r) => s + r.unitsRequired, 0);
    const fulfilledUnits = activeReqs.reduce((s, r) => s + (r.unitsFulfilled || 0), 0);
    const administeredUnits = activeReqs.reduce((s, r) => s + (r.unitsAdministered || 0), 0);
    const fulfillRate = totalUnits > 0 ? Math.round((fulfilledUnits / totalUnits) * 100) : 0;
    const adminRate = totalUnits > 0 ? Math.round((administeredUnits / totalUnits) * 100) : 0;
    const uniquePatients = new Set(activeReqs.map(r => `${r.patientName.toLowerCase()}|${r.patientMobile}`)).size;
    const uniqueDoctors = new Set(activeReqs.filter(r => r.doctorName).map(r => r.doctorName!.toLowerCase())).size;
    return { totalUnits, fulfilledUnits, administeredUnits, fulfillRate, adminRate, uniquePatients, uniqueDoctors };
  }, [activeReqs]);

  const maxBG = useMemo(() => Math.max(...bgData.map(d => d.value), 1), [bgData]);

  const kpiCards = [
    { icon: "📊", label: "Fulfillment Rate", val: `${stats.fulfillRate}%`, cls: "k-green" },
    { icon: "💉", label: "Admin Rate", val: `${stats.adminRate}%`, cls: "k-blue" },
    { icon: "👤", label: "Unique Patients", val: stats.uniquePatients, cls: "k-amber" },
    { icon: "🩺", label: "Doctors Involved", val: stats.uniqueDoctors, cls: "k-purple" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="hd-enter">

      {/* KPIs */}
      <div className="hd-kpi-grid">
        {kpiCards.map((k, i) => (
          <div key={k.label} className={`hd-kpi ${k.cls} hd-enter hd-s${i + 1}`}>
            <span className="hd-kpi-icon">{k.icon}</span>
            <div className="hd-kpi-val">{k.val}</div>
            <div className="hd-kpi-lbl">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Donut Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
        <ChartCard
          title="Urgency Distribution"
          icon={<PieChart size={15} style={{ color: "var(--c-brand)" }} />}
        >
          <DonutChart data={urgencyData} />
          <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "14px", flexWrap: "wrap" }}>
            {urgencyData.map(d => <LegendItem key={d.label} color={d.color} label={d.label} value={d.value} />)}
          </div>
        </ChartCard>

        <ChartCard
          title="Status Breakdown"
          icon={<Activity size={15} style={{ color: "var(--c-brand)" }} />}
        >
          <DonutChart data={statusChartData} />
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px", marginTop: "14px" }}>
            {statusChartData.map(d => <LegendItem key={d.label} color={d.color} label={d.label} value={d.value} />)}
          </div>
        </ChartCard>

        <ChartCard
          title="Component Types"
          icon={<BarChart3 size={15} style={{ color: "var(--c-brand)" }} />}
        >
          <DonutChart data={compData} />
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px", marginTop: "14px" }}>
            {compData.map(d => <LegendItem key={d.label} color={d.color} label={d.label} value={d.value} />)}
          </div>
        </ChartCard>
      </div>

      {/* Blood Group + Monthly Trend */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
        {/* Blood group bars */}
        <ChartCard
          title="Blood Group Demand"
          icon={<span style={{ fontSize: "1rem" }}>🩸</span>}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {bgData.map(d => (
              <HBar key={d.label} label={d.label} value={d.value} max={maxBG} color={d.color} emoji="🔴" />
            ))}
          </div>
        </ChartCard>

        {/* Monthly trend */}
        <ChartCard
          title="Monthly Trend (6 months)"
          icon={<TrendingUp size={15} style={{ color: "var(--c-brand)" }} />}
        >
          <div style={{ marginBottom: "8px" }}>
            <div style={{ display: "flex", gap: "16px", marginBottom: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "14px", height: "2px", background: "var(--c-brand)", borderRadius: "2px" }} />
                <span style={{ fontSize: "0.65rem", color: "var(--c-text-3)", fontWeight: 500 }}>Created</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <div style={{ width: "14px", height: "2px", background: "#10B981", borderRadius: "2px" }} />
                <span style={{ fontSize: "0.65rem", color: "var(--c-text-3)", fontWeight: 500 }}>Fulfilled</span>
              </div>
            </div>
            <Sparkline data={monthlyTrend.map(m => m.created)} color="var(--c-brand)" />
            <div style={{ marginTop: "4px" }}>
              <Sparkline data={monthlyTrend.map(m => m.fulfilled)} color="#10B981" />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {monthlyTrend.map(m => (
              <span key={m.label} style={{ fontSize: "0.62rem", color: "var(--c-text-4)", fontWeight: 500 }}>
                {m.label}
              </span>
            ))}
          </div>

          {/* Monthly table */}
          <div style={{
            marginTop: "14px",
            paddingTop: "14px",
            borderTop: "1px solid var(--c-border)",
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.72rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--c-border)" }}>
                  {["Month", "Created", "Fulfilled"].map(h => (
                    <th key={h} style={{
                      padding: "4px 8px 6px",
                      textAlign: h === "Month" ? "left" : "center",
                      fontWeight: 700,
                      color: "var(--c-text-4)",
                      textTransform: "uppercase",
                      fontSize: "0.6rem",
                      letterSpacing: "0.06em",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyTrend.map(m => (
                  <tr key={m.label} style={{ borderBottom: "1px solid var(--c-border)" }}>
                    <td style={{ padding: "5px 8px", fontWeight: 500, color: "var(--c-text-2)" }}>{m.label}</td>
                    <td style={{ padding: "5px 8px", textAlign: "center", fontWeight: 700, color: "var(--c-brand)", fontFamily: "var(--f-display)" }}>{m.created}</td>
                    <td style={{ padding: "5px 8px", textAlign: "center", fontWeight: 700, color: "#059669", fontFamily: "var(--f-display)" }}>{m.fulfilled}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>

      {/* Unit Flow Summary */}
      <div className="hd-card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
          <span style={{ fontSize: "1rem" }}>📈</span>
          <span className="hd-sec-title">Unit Flow Summary</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", textAlign: "center" }}>
          {[
            { val: stats.totalUnits, label: "Total Required", color: "var(--c-brand)", pct: 100, barColor: "var(--c-brand)" },
            { val: stats.fulfilledUnits, label: "Fulfilled", color: "#059669", pct: stats.fulfillRate, barColor: "#10B981" },
            { val: stats.administeredUnits, label: "Administered", color: "#2563EB", pct: stats.adminRate, barColor: "#3B82F6" },
          ].map(s => (
            <div key={s.label}>
              <div style={{
                fontFamily: "var(--f-display)",
                fontSize: "2rem",
                fontWeight: 800,
                color: s.color,
                lineHeight: 1,
                letterSpacing: "-0.02em",
              }}>
                {s.val}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--c-text-4)", fontWeight: 500, marginTop: "5px" }}>
                {s.label}
              </div>
              <div className="hd-prog" style={{ marginTop: "10px" }}>
                <div className="hd-prog-fill" style={{ width: `${s.pct}%`, background: s.barColor }} />
              </div>
              <div style={{ fontSize: "0.65rem", color: "var(--c-text-4)", marginTop: "4px" }}>
                {s.pct}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}