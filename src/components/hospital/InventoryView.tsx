// hospital/InventoryView.tsx — Blood Inventory tab v5.0 (all original logic preserved)
import { useState, useMemo } from "react";
import { Droplet, Package, Filter } from "lucide-react";
// @ts-ignore
import { BLOOD_GROUPS } from "@/lib/bloodbank-utils";
import { BLOOD_COMPONENT_TYPES } from "./constants";
import type { BloodRequest, BloodComponentType } from "./types";

interface InventoryViewProps { requests: BloodRequest[]; }
interface InventoryItem {
  bloodGroup: string;
  totalRequired: number; totalFulfilled: number; totalAdministered: number;
  available: number; pending: number; activeRequests: number;
}

// Original stock level meta — refreshed colors
const STOCK_META = {
  sufficient: { bg: "var(--c-success-bg)", text: "var(--c-success)", border: "var(--c-success-bdr)", label: "Sufficient", strip: "linear-gradient(90deg,var(--clr-success),var(--clr-success))" },
  low: { bg: "var(--c-warn-bg)", text: "var(--c-warn)", border: "var(--c-warn-bdr)", label: "Low Stock", strip: "linear-gradient(90deg,#D97706,#F59E0B)" },
  critical: { bg: "var(--c-danger-bg)", text: "var(--c-danger)", border: "var(--c-danger-bdr)", label: "Critical", strip: "linear-gradient(90deg,var(--clr-emergency),var(--clr-emergency))" },
  none: { bg: "var(--c-surface-2)", text: "var(--c-text-4)", border: "var(--c-border)", label: "No Demand", strip: "var(--c-border)" },
};

export function InventoryView({ requests }: InventoryViewProps) {
  const [componentFilter, setComponentFilter] = useState<string>("All");

  const activeRequests = useMemo(() => requests.filter(r => !["CANCELLED", "EXPIRED"].includes(r.status)), [requests]);
  const filtered = useMemo(() =>
    componentFilter === "All" ? activeRequests : activeRequests.filter(r => (r.componentType || "Whole Blood") === componentFilter),
    [activeRequests, componentFilter]
  );

  // All original inventory calculation logic preserved
  const inventory: InventoryItem[] = useMemo(() => BLOOD_GROUPS.map((bg: string) => {
    const bgReqs = filtered.filter(r => r.bloodGroup === bg);
    const totalRequired = bgReqs.reduce((s, r) => s + r.unitsRequired, 0);
    const totalFulfilled = bgReqs.reduce((s, r) => s + (r.unitsFulfilled || 0), 0);
    const totalAdministered = bgReqs.reduce((s, r) => s + (r.unitsAdministered || 0), 0);
    const available = Math.max(0, totalFulfilled - totalAdministered);
    const pending = Math.max(0, totalRequired - totalFulfilled);
    const activeCount = bgReqs.filter(r => !["CLOSED", "ADMINISTERED"].includes(r.status)).length;
    return { bloodGroup: bg, totalRequired, totalFulfilled, totalAdministered, available, pending, activeRequests: activeCount };
  }), [filtered]);

  const totals = useMemo(() => ({
    required: inventory.reduce((s, i) => s + i.totalRequired, 0),
    fulfilled: inventory.reduce((s, i) => s + i.totalFulfilled, 0),
    administered: inventory.reduce((s, i) => s + i.totalAdministered, 0),
    available: inventory.reduce((s, i) => s + i.available, 0),
    pending: inventory.reduce((s, i) => s + i.pending, 0),
  }), [inventory]);

  const getLevel = (item: InventoryItem) => {
    if (item.pending === 0 && item.activeRequests === 0) return "none";
    if (item.available >= item.pending && item.pending > 0) return "sufficient";
    if (item.available > 0) return "low";
    if (item.pending > 0) return "critical";
    return "none";
  };

  const criticalCount = inventory.filter(i => getLevel(i) === "critical").length;
  const lowCount = inventory.filter(i => getLevel(i) === "low").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }} className="hd-enter">

      {/* Critical banner */}
      {criticalCount > 0 && (
        <div className="hd-enter" style={{
          display: "flex", alignItems: "center", gap: "14px",
          padding: "14px 18px", borderRadius: "var(--r-xl)",
          background: "var(--c-danger-bg)", border: "1px solid var(--c-danger-bdr)",
        }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "var(--r-lg)",
            background: "rgba(220,38,38,0.1)", display: "flex",
            alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0,
          }}>⚠️</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, color: "var(--c-danger)", fontSize: "0.85rem", fontFamily: "var(--f-display)" }}>Critical Blood Shortage</p>
            <p style={{ fontSize: "0.72rem", color: "var(--clr-emergency)", marginTop: "2px", opacity: 0.8 }}>
              {criticalCount} blood group{criticalCount > 1 ? "s" : ""} with unfulfilled demand and zero available units
            </p>
          </div>
          <span style={{
            fontSize: "0.7rem", fontWeight: 800, background: "var(--clr-emergency)", color: "#fff",
            padding: "5px 12px", borderRadius: "var(--r-pill)",
            animation: "hd-pulse-em 1.5s ease-in-out infinite",
          }}>
            {criticalCount} CRITICAL
          </span>
        </div>
      )}

      {/* KPI row */}
      <div className="hd-kpi-grid">
        {[
          { icon: "🩸", label: "Total Required", val: totals.required, cls: "k-red" },
          { icon: "✅", label: "Fulfilled", val: totals.fulfilled, cls: "k-green" },
          { icon: "💉", label: "Administered", val: totals.administered, cls: "k-blue" },
          { icon: "📦", label: "Available Stock", val: totals.available, cls: "k-amber" },
          { icon: "⏳", label: "Pending Demand", val: totals.pending, cls: "k-purple" },
        ].map((k, i) => (
          <div key={k.label} className={`hd-kpi ${k.cls} hd-enter hd-s${i + 1}`}>
            <span style={{ fontSize: "1.35rem", display: "block", marginBottom: "8px" }}>{k.icon}</span>
            <div className="hd-kpi-val">{k.val}</div>
            <div className="hd-kpi-lbl">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="hd-card" style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Filter size={14} style={{ color: "var(--c-brand)" }} />
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--c-text-2)" }}>Component:</span>
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {["All", ...BLOOD_COMPONENT_TYPES].map((ct: string) => (
              <button
                key={ct} onClick={() => setComponentFilter(ct)}
                style={{
                  padding: "5px 12px", borderRadius: "var(--r-pill)",
                  border: `1.5px solid ${componentFilter === ct ? "var(--c-brand)" : "var(--c-border)"}`,
                  background: componentFilter === ct ? "var(--c-brand)" : "var(--c-surface-2)",
                  color: componentFilter === ct ? "#fff" : "var(--c-text-3)",
                  fontSize: "0.7rem", fontWeight: componentFilter === ct ? 700 : 500,
                  cursor: "pointer", transition: "all var(--t-fast)", fontFamily: "var(--f-body)",
                }}
              >
                {ct}
              </button>
            ))}
          </div>
          {lowCount > 0 && (
            <span style={{
              marginLeft: "auto", fontSize: "0.7rem", fontWeight: 700,
              color: "var(--c-warn)", background: "var(--c-warn-bg)",
              padding: "4px 10px", borderRadius: "var(--r-pill)", border: "1px solid var(--c-warn-bdr)",
            }}>
              ⚡ {lowCount} Low Stock
            </span>
          )}
        </div>
      </div>

      {/* Inventory grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "12px" }}>
        {inventory.map((item, i) => {
          const level = getLevel(item);
          const sc = STOCK_META[level];
          const maxBar = Math.max(item.totalRequired, 1);
          return (
            <div
              key={item.bloodGroup}
              className="hd-card hd-enter"
              style={{ overflow: "hidden", animationDelay: `${i * 0.04}s` }}
            >
              {/* Top strip */}
              <div style={{ height: "3px", background: sc.strip }} />
              <div style={{ padding: "16px" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{
                    fontFamily: "var(--f-display)", fontWeight: 800, fontSize: "1.5rem",
                    color: "var(--c-brand)", lineHeight: 1, letterSpacing: "-0.02em",
                  }}>
                    {item.bloodGroup}
                  </span>
                  <span style={{
                    fontSize: "0.6rem", fontWeight: 700, padding: "3px 8px", borderRadius: "var(--r-pill)",
                    background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                  }}>
                    {sc.label}
                  </span>
                </div>

                {/* Progress bars */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    { label: "Required", val: item.totalRequired, color: "var(--c-brand)" },
                    { label: "Fulfilled", val: item.totalFulfilled, color: "var(--clr-success)" },
                    { label: "Administered", val: item.totalAdministered, color: "var(--clr-info)" },
                  ].map(b => (
                    <div key={b.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                        <span style={{ fontSize: "0.6rem", color: "var(--c-text-4)", fontWeight: 500 }}>{b.label}</span>
                        <span style={{ fontSize: "0.63rem", fontWeight: 700, color: "var(--c-text-2)", fontFamily: "var(--f-display)" }}>
                          {b.val}u
                        </span>
                      </div>
                      <div style={{ height: "5px", background: "var(--c-surface-3)", borderRadius: "var(--r-pill)", overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: "var(--r-pill)", background: b.color,
                          width: `${(b.val / maxBar) * 100}%`, transition: "width 0.6s ease",
                        }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary stats */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginTop: "12px", paddingTop: "10px", borderTop: "1px solid var(--c-border)",
                }}>
                  {[
                    { label: "Available", val: item.available, color: "#D97706" },
                    { label: "Pending", val: item.pending, color: "var(--clr-emergency)" },
                    { label: "Active", val: item.activeRequests, color: "var(--c-text-3)" },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: "center" }}>
                      <div style={{ fontFamily: "var(--f-display)", fontSize: "0.9rem", fontWeight: 800, color: s.color, lineHeight: 1 }}>
                        {s.val}
                      </div>
                      <div style={{ fontSize: "0.57rem", color: "var(--c-text-4)", marginTop: "3px" }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Component breakdown table */}
      <div className="hd-card" style={{ overflow: "hidden" }}>
        <div style={{
          padding: "16px 18px", borderBottom: "1px solid var(--c-border)",
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          <Package size={15} style={{ color: "var(--c-brand)" }} />
          <span className="hd-sec-title">Component Breakdown</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
            <thead>
              <tr style={{ background: "var(--c-surface-2)" }}>
                {["Component", "Requests", "Required", "Fulfilled", "Administered"].map(h => (
                  <th key={h} style={{
                    padding: "10px 14px",
                    textAlign: h === "Component" ? "left" : "center",
                    fontWeight: 700, color: "var(--c-text-4)",
                    fontSize: "0.62rem", textTransform: "uppercase",
                    letterSpacing: "0.07em", borderBottom: "1px solid var(--c-border)",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BLOOD_COMPONENT_TYPES.map((ct: string) => {
                const ctReqs = activeRequests.filter(r => (r.componentType || "Whole Blood") === ct);
                if (ctReqs.length === 0) return null;
                const req = ctReqs.reduce((s, r) => s + r.unitsRequired, 0);
                const ful = ctReqs.reduce((s, r) => s + (r.unitsFulfilled || 0), 0);
                const adm = ctReqs.reduce((s, r) => s + (r.unitsAdministered || 0), 0);
                return (
                  <tr
                    key={ct}
                    style={{ borderBottom: "1px solid var(--c-border)", transition: "background var(--t-fast)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--c-surface-2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "")}
                  >
                    <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--c-text)" }}>{ct}</td>
                    <td style={{ padding: "10px 14px", textAlign: "center", color: "var(--c-text-3)" }}>{ctReqs.length}</td>
                    <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: "var(--c-brand)", fontFamily: "var(--f-display)" }}>{req}u</td>
                    <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: "var(--clr-success)", fontFamily: "var(--f-display)" }}>{ful}u</td>
                    <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: "var(--clr-info)", fontFamily: "var(--f-display)" }}>{adm}u</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}