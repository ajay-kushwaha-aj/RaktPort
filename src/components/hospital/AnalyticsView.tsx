// hospital/AnalyticsView.tsx — v5.0 (all original chart logic preserved, UI upgraded)
import { useMemo } from "react";
import { TrendingUp, BarChart3, PieChart, Activity, Syringe, Users, Stethoscope, Droplet, LineChart as LineChartIcon } from "lucide-react";
import { URGENCY_CONFIG } from "./constants";
import type { BloodRequest, UrgencyLevel, BloodComponentType } from "./types";
// @ts-ignore
import { BLOOD_GROUPS } from "@/lib/bloodbank-utils";

interface AnalyticsViewProps { requests: BloodRequest[]; }

/* ── SVG Donut (original logic, new visuals) ── */
function DonutChart({ data, size = 130 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = size / 2 - 14;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", margin: "0 auto" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--c-surface-3)" strokeWidth={13} />
      {data.filter(d => d.value > 0).map((d, i) => {
        const pct = d.value / total; const dash = c * pct; const gap = c - dash;
        const el = (
          <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={d.color} strokeWidth={13}
            strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset} strokeLinecap="round"
            style={{ transition: "all 0.7s cubic-bezier(0.4,0,0.2,1)" }}
          />
        );
        offset += dash; return el;
      })}
      <text x={size / 2} y={size / 2 - 5} textAnchor="middle" style={{
        fontSize: "20px", fontWeight: 800, fontFamily: "var(--f-display)", fill: "var(--c-text)",
      }}>{total}</text>
      <text x={size / 2} y={size / 2 + 11} textAnchor="middle" style={{
        fontSize: "8px", fontWeight: 700, fill: "var(--c-text-4)", letterSpacing: "0.08em", fontFamily: "var(--f-body)",
      }}>TOTAL</text>
    </svg>
  );
}

/* ── Legend pill ── */
function LegPill({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span style={{ fontSize: "0.67rem", color: "var(--c-text-3)", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--c-text)" }}>{value}</span>
    </div>
  );
}

/* ── Horizontal bar ── */
function HBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "4px 0" }}>
      <span style={{
        fontFamily: "var(--f-display)", fontWeight: 800, fontSize: "0.68rem",
        color: "var(--c-brand)", background: "var(--c-brand-soft)",
        border: "1px solid rgba(196,28,56,0.15)", borderRadius: "var(--r-sm)",
        padding: "2px 7px", width: "36px", textAlign: "center", flexShrink: 0,
      }}>{label}</span>
      <div style={{ flex: 1, height: "6px", background: "var(--c-surface-3)", borderRadius: "var(--r-pill)", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: "var(--r-pill)", background: color,
          width: `${pct}%`, transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
          transformOrigin: "left", animation: "hd-bar-grow 0.8s ease both",
        }} />
      </div>
      <span style={{ width: "24px", textAlign: "right", fontSize: "0.7rem", fontWeight: 700, color: "var(--c-text-2)", flexShrink: 0 }}>
        {value}
      </span>
    </div>
  );
}

/* ── Sparkline ── */
function Sparkline({ data, color, h = 44 }: { data: number[]; color: string; h?: number }) {
  if (data.length < 2) return (
    <div style={{ height: `${h}px`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.66rem", color: "var(--c-text-4)" }}>
      Not enough data
    </div>
  );
  const max = Math.max(...data, 1); const w = 200;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 6)}`).join(" ");
  const uid = color.replace(/[^a-z0-9]/gi, "");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: `${h}px` }}>
      <defs>
        <linearGradient id={`sg${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={`0,${h} ${points} ${w},${h}`} fill={`url(#sg${uid})`} stroke="none" />
      <polyline points={points} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Chart Card wrapper ── */
function ChartCard({ title, icon, children, delay }: { title: string; icon: React.ReactNode; children: React.ReactNode; delay?: string }) {
  return (
    <div className="hd-card hd-enter" style={{ padding: "20px", animationDelay: delay || "0s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
        {icon}
        <span className="hd-sec-title" style={{ fontSize: "0.86rem" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

export function AnalyticsView({ requests }: AnalyticsViewProps) {
  const activeReqs = useMemo(() => requests.filter(r => !["CANCELLED"].includes(r.status)), [requests]);

  /* ── All original data computations preserved ── */
  const urgencyData = useMemo(() => {
    const counts: Record<UrgencyLevel, number> = { Emergency: 0, Urgent: 0, Routine: 0 };
    activeReqs.forEach(r => { counts[r.urgency || "Routine"]++; });
    return [
      { label: "Emergency", value: counts.Emergency, color: "var(--clr-emergency)" },
      { label: "Urgent", value: counts.Urgent, color: "#F97316" },
      { label: "Routine", value: counts.Routine, color: "var(--clr-success)" },
    ];
  }, [activeReqs]);

  const bgData = useMemo(() => {
    const counts: Record<string, number> = {};
    BLOOD_GROUPS.forEach((bg: string) => { counts[bg] = 0; });
    activeReqs.forEach(r => { counts[r.bloodGroup] = (counts[r.bloodGroup] || 0) + 1; });
    const max = Math.max(...Object.values(counts), 1);
    const colors = ["var(--clr-emergency)", "#F97316", "#EAB308", "#22C55E", "#06B6D4", "var(--clr-info)", "#8B5CF6", "#EC4899"];
    return BLOOD_GROUPS.map((bg: string, i: number) => ({ label: bg, value: counts[bg], color: colors[i % colors.length], max }));
  }, [activeReqs]);

  const compData = useMemo(() => {
    const counts: Record<string, number> = {};
    activeReqs.forEach(r => { const ct = r.componentType || "Whole Blood"; counts[ct] = (counts[ct] || 0) + 1; });
    const cm: Record<string, string> = { "Whole Blood": "var(--clr-emergency)", PRBC: "#F97316", Platelets: "var(--clr-success)", FFP: "var(--clr-info)", Cryoprecipitate: "#8B5CF6" };
    return Object.entries(counts).map(([k, v]) => ({ label: k, value: v, color: cm[k] || "#6B7280" }));
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

  const statusData = useMemo(() => [
    { label: "Active", value: activeReqs.filter(r => ["CREATED", "PENDING", "PROCESSING", "PLEDGED", "PARTIAL"].includes(r.status)).length, color: "#F59E0B" },
    { label: "Fulfilled", value: activeReqs.filter(r => ["REDEEMED", "HOSPITAL VERIFIED", "PARTIAL REDEEMED"].includes(r.status)).length, color: "var(--clr-success)" },
    { label: "Administered", value: activeReqs.filter(r => ["ADMINISTERED", "PARTIALLY ADMINISTERED", "CLOSED"].includes(r.status)).length, color: "var(--clr-info)" },
    { label: "Expired", value: activeReqs.filter(r => r.status === "EXPIRED").length, color: "var(--clr-emergency)" },
  ], [activeReqs]);

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

  const maxBG = useMemo(() => Math.max(...bgData.map((d: { value: number }) => d.value), 1), [bgData]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="hd-enter">

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "12px" }}>
        <style>{`@media(min-width:640px){.an-kpi-grid{grid-template-columns:repeat(4,1fr)!important}}`}</style>
        <div className="an-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "12px", gridColumn: "1/-1" }}>
          {[
            { icon: <BarChart3 size={20} />, label: "Fulfillment Rate", val: `${stats.fulfillRate}%`, cls: "k-green" },
            { icon: <Syringe size={20} />, label: "Admin Rate", val: `${stats.adminRate}%`, cls: "k-blue" },
            { icon: <Users size={20} />, label: "Unique Patients", val: stats.uniquePatients, cls: "k-amber" },
            { icon: <Stethoscope size={20} />, label: "Doctors Involved", val: stats.uniqueDoctors, cls: "k-purple" },
          ].map((k, i) => (
            <div key={k.label} className={`hd-kpi ${k.cls} hd-enter hd-s${i + 1}`}>
              <span style={{ fontSize: "1.35rem", display: "block", marginBottom: "8px" }}>{k.icon}</span>
              <div className="hd-kpi-val">{k.val}</div>
              <div className="hd-kpi-lbl">{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Three donut charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "14px" }}>
        <ChartCard title="Urgency Distribution" delay="0.04s" icon={<PieChart size={15} style={{ color: "var(--c-brand)" }} />}>
          <DonutChart data={urgencyData} />
          <div style={{ display: "flex", justifyContent: "center", gap: "14px", marginTop: "14px", flexWrap: "wrap" }}>
            {urgencyData.map(d => <LegPill key={d.label} color={d.color} label={d.label} value={d.value} />)}
          </div>
        </ChartCard>

        <ChartCard title="Status Breakdown" delay="0.08s" icon={<Activity size={15} style={{ color: "var(--c-brand)" }} />}>
          <DonutChart data={statusData} />
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px", marginTop: "14px" }}>
            {statusData.map(d => <LegPill key={d.label} color={d.color} label={d.label} value={d.value} />)}
          </div>
        </ChartCard>

        <ChartCard title="Component Types" delay="0.12s" icon={<BarChart3 size={15} style={{ color: "var(--c-brand)" }} />}>
          <DonutChart data={compData} />
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px", marginTop: "14px" }}>
            {compData.map(d => <LegPill key={d.label} color={d.color} label={d.label} value={d.value} />)}
          </div>
        </ChartCard>
      </div>

      {/* Blood group + Monthly trend */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "14px" }}>
        <ChartCard title="Blood Group Demand" icon={<Droplet size={15} style={{ color: "var(--c-brand)" }} />}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {bgData.map((d: { label: string; value: number; color: string; max: number }) => <HBar key={d.label} label={d.label} value={d.value} max={maxBG} color={d.color} />)}
          </div>
        </ChartCard>

        <ChartCard title="Monthly Trend (6 months)" icon={<TrendingUp size={15} style={{ color: "var(--c-brand)" }} />}>
          <div style={{ marginBottom: "8px" }}>
            <div style={{ display: "flex", gap: "16px", marginBottom: "6px" }}>
              {[
                { color: "var(--c-brand)", label: "Created" },
                { color: "var(--clr-success)", label: "Fulfilled" },
              ].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <div style={{ width: "14px", height: "2px", background: l.color, borderRadius: "2px" }} />
                  <span style={{ fontSize: "0.65rem", color: "var(--c-text-3)", fontWeight: 500 }}>{l.label}</span>
                </div>
              ))}
            </div>
            <Sparkline data={monthlyTrend.map(m => m.created)} color="var(--c-brand)" />
            <div style={{ marginTop: "4px" }}>
              <Sparkline data={monthlyTrend.map(m => m.fulfilled)} color="var(--clr-success)" />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
            {monthlyTrend.map(m => (
              <span key={m.label} style={{ fontSize: "0.6rem", color: "var(--c-text-4)", fontWeight: 500 }}>{m.label}</span>
            ))}
          </div>
          <div style={{ paddingTop: "12px", borderTop: "1px solid var(--c-border)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.71rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--c-border)" }}>
                  {["Month", "Created", "Fulfilled"].map(h => (
                    <th key={h} style={{
                      padding: "4px 6px 6px", textAlign: h === "Month" ? "left" : "center",
                      fontWeight: 700, color: "var(--c-text-4)",
                      textTransform: "uppercase", fontSize: "0.58rem", letterSpacing: "0.07em",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyTrend.map(m => (
                  <tr key={m.label} style={{ borderBottom: "1px solid var(--c-border)" }}>
                    <td style={{ padding: "5px 6px", fontWeight: 500, color: "var(--c-text-2)" }}>{m.label}</td>
                    <td style={{ padding: "5px 6px", textAlign: "center", fontWeight: 700, color: "var(--c-brand)", fontFamily: "var(--f-display)" }}>{m.created}</td>
                    <td style={{ padding: "5px 6px", textAlign: "center", fontWeight: 700, color: "var(--clr-success)", fontFamily: "var(--f-display)" }}>{m.fulfilled}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>

      {/* Units summary */}
      <div className="hd-card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
          <LineChartIcon size={18} style={{ color: "var(--c-brand)" }} />
          <span className="hd-sec-title">Unit Flow Summary</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px", textAlign: "center" }}>
          {[
            { val: stats.totalUnits, label: "Total Required", color: "var(--c-brand)", pct: 100, barC: "var(--c-brand)" },
            { val: stats.fulfilledUnits, label: "Fulfilled", color: "var(--clr-success)", pct: stats.fulfillRate, barC: "var(--clr-success)" },
            { val: stats.administeredUnits, label: "Administered", color: "var(--clr-info)", pct: stats.adminRate, barC: "var(--clr-info)" },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: "var(--f-display)", fontSize: "2rem", fontWeight: 800, color: s.color, lineHeight: 1, letterSpacing: "-0.02em" }}>
                {s.val}
              </div>
              <div style={{ fontSize: "0.71rem", color: "var(--c-text-4)", fontWeight: 500, marginTop: "5px" }}>{s.label}</div>
              <div className="hd-prog" style={{ marginTop: "10px" }}>
                <div className="hd-prog-fill" style={{ width: `${s.pct}%`, background: s.barC }} />
              </div>
              <div style={{ fontSize: "0.64rem", color: "var(--c-text-4)", marginTop: "4px" }}>{s.pct}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}