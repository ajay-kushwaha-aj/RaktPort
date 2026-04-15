// ════════════════════════════════════════════════════════
// hospital/TransfusionHistoryView.tsx — v5.0
// ════════════════════════════════════════════════════════
import { useState, useMemo } from "react";
import { Search, HeartHandshake, Syringe, Droplet, CheckCircle } from "lucide-react";
import { getStatusMeta } from "./constants";
import { formatDate, formatTime } from "./utils";
import type { BloodRequest } from "./types";

export function TransfusionHistoryView({ requests }: { requests: BloodRequest[] }) {
  const [search, setSearch] = useState("");

  const administered = useMemo(() =>
    requests
      .filter(r =>
        ["ADMINISTERED", "PARTIALLY ADMINISTERED", "CLOSED"].includes(r.status) ||
        r.unitsAdministered > 0
      )
      .filter(r =>
        !search ||
        r.patientName.toLowerCase().includes(search.toLowerCase()) ||
        r.rtid.toLowerCase().includes(search.toLowerCase())
      )
      .sort(
        (a, b) =>
          (b.administeredAt?.getTime() || b.createdAt.getTime()) -
          (a.administeredAt?.getTime() || a.createdAt.getTime())
      ),
    [requests, search]
  );

  const totalUnitsAdmin = administered.reduce(
    (s, r) => s + (r.unitsAdministered || 0),
    0
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }} className="hd-enter">

      {/* ── KPI row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>
        {[
          { icon: <Syringe size={22} style={{ color: "var(--c-brand)" }} />, label: "Transfusions Done", val: administered.length, cls: "k-blue" },
          { icon: <Droplet size={22} style={{ color: "var(--clr-emergency)" }} />, label: "Total Units Given", val: totalUnitsAdmin, cls: "k-red" },
          { icon: <CheckCircle size={22} style={{ color: "var(--clr-success)" }} />, label: "Fully Closed", val: administered.filter(r => r.status === "CLOSED").length, cls: "k-green" },
        ].map((k, i) => (
          <div key={k.label} className={`hd-kpi ${k.cls} hd-enter hd-s${i + 1}`}>
            <span style={{ display: "block", marginBottom: "8px" }}>{k.icon}</span>
            <div className="hd-kpi-val">{k.val}</div>
            <div className="hd-kpi-lbl">{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="hd-card" style={{ padding: "14px 16px" }}>
        <div style={{ position: "relative" }}>
          <Search
            size={14}
            style={{
              position: "absolute", left: "12px",
              top: "50%", transform: "translateY(-50%)",
              color: "var(--c-text-4)",
            }}
          />
          <input
            className="hd-search"
            placeholder="Search patient name or RTID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Empty state ── */}
      {administered.length === 0 ? (
        <div className="hd-card">
          <div className="hd-empty">
            <div className="hd-empty-icon"><Syringe size={28} style={{ color: "var(--c-text-4)" }} /></div>
            <p className="hd-empty-title">No transfusion records yet</p>
            <p className="hd-empty-sub">
              Records appear here after blood is administered to a patient
            </p>
          </div>
        </div>
      ) : (
        <div className="hd-card" style={{ overflow: "hidden" }}>
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid var(--c-border)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <HeartHandshake size={15} style={{ color: "var(--c-info)" }} />
            <span className="hd-sec-title">All Transfusion Records</span>
            <span style={{ fontSize: "0.7rem", color: "var(--c-text-4)", marginLeft: "auto" }}>
              {administered.length} records
            </span>
          </div>

          <div>
            {administered.map((r, i) => {
              const sm = getStatusMeta(r.status);
              const history = r.transfusionHistory || [];
              const adminPct =
                r.unitsRequired > 0
                  ? ((r.unitsAdministered || 0) / r.unitsRequired) * 100
                  : 0;

              return (
                <div
                  key={r.id}
                  className="hd-enter"
                  style={{
                    padding: "16px 18px",
                    borderBottom:
                      i < administered.length - 1
                        ? "1px solid var(--c-border)"
                        : "none",
                    animationDelay: `${i * 0.04}s`,
                    transition: "background var(--t-fast)",
                  }}
                  onMouseEnter={e =>
                  ((e.currentTarget as HTMLElement).style.background =
                    "var(--c-surface-2)")
                  }
                  onMouseLeave={e =>
                    ((e.currentTarget as HTMLElement).style.background = "")
                  }
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    {/* Icon */}
                    <div
                      style={{
                        width: "38px", height: "38px", borderRadius: "10px",
                        background: "var(--c-info-bg)", border: "1px solid var(--c-info-bdr)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "1.1rem", flexShrink: 0,
                      }}
                    >
                      <Syringe size={18} style={{ color: "var(--c-info)" }} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontFamily: "var(--f-display)", fontWeight: 700,
                            fontSize: "0.85rem", color: "var(--c-text)",
                          }}
                        >
                          {r.patientName}
                        </span>
                        {r.age && (
                          <span style={{ fontSize: "0.67rem", color: "var(--c-text-4)" }}>
                            {r.age}y
                          </span>
                        )}
                        <span
                          style={{
                            fontFamily: "var(--f-display)", fontWeight: 800,
                            fontSize: "0.66rem", padding: "2px 7px",
                            borderRadius: "var(--r-pill)", background: "var(--c-brand-soft)",
                            color: "var(--c-brand)", border: "1px solid rgba(196,28,56,0.15)",
                          }}
                        >
                          {r.bloodGroup}
                        </span>
                        <span
                          className="hd-status"
                          style={{
                            background: sm.bg, color: sm.text,
                            border: `1px solid ${sm.border}`,
                          }}
                        >
                          {sm.label}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex", alignItems: "center", gap: "8px",
                          marginTop: "4px", flexWrap: "wrap",
                        }}
                      >
                        <span className="hd-mono-pill">{r.rtid}</span>
                        <span style={{ fontSize: "0.67rem", color: "var(--c-text-4)" }}>
                          {r.componentType || "Whole Blood"}
                        </span>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--c-info)" }}>
                          {r.unitsAdministered || 0}/{r.unitsRequired} units
                        </span>
                        {r.wardDepartment && (
                          <span style={{ fontSize: "0.67rem", color: "var(--c-text-4)" }}>
                            · {r.wardDepartment}
                          </span>
                        )}
                      </div>

                      {/* Admin progress */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                        <div className="hd-prog" style={{ flex: 1 }}>
                          <div
                            className="hd-prog-fill"
                            style={{
                              width: `${adminPct}%`,
                              background: "linear-gradient(90deg,var(--clr-info),#60A5FA)",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: "0.63rem", color: "var(--c-text-4)", flexShrink: 0 }}>
                          {Math.round(adminPct)}%
                        </span>
                      </div>

                      {/* Transfusion history records */}
                      {history.length > 0 && (
                        <div
                          style={{
                            marginTop: "8px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                          }}
                        >
                          {history.map((h, hi) => (
                            <div
                              key={hi}
                              style={{
                                display: "flex", alignItems: "center", gap: "8px",
                                padding: "6px 10px", background: "var(--c-info-bg)",
                                border: "1px solid var(--c-info-bdr)",
                                borderRadius: "var(--r-sm)", fontSize: "0.67rem",
                              }}
                            >
                              <span style={{ fontWeight: 700, color: "var(--c-info)", flexShrink: 0 }}>
                                {h.unitsAdministered}u
                              </span>
                              <span style={{ color: "var(--c-text-4)" }}>·</span>
                              <span style={{ color: "var(--c-text-3)" }}>
                                {new Date(h.recordedAt).toLocaleString("en-IN", {
                                  day: "2-digit", month: "short",
                                  hour: "2-digit", minute: "2-digit", hour12: true,
                                })}
                              </span>
                              {h.notes && (
                                <>
                                  <span style={{ color: "var(--c-text-4)" }}>·</span>
                                  <span
                                    style={{
                                      color: "var(--c-text-3)", overflow: "hidden",
                                      textOverflow: "ellipsis", whiteSpace: "nowrap",
                                    }}
                                  >
                                    {h.notes}
                                  </span>
                                </>
                              )}
                              <span style={{ color: "var(--c-text-4)", marginLeft: "auto", flexShrink: 0 }}>
                                {h.administeredBy}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Date */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--c-text-2)" }}>
                        {r.administeredAt ? formatDate(r.administeredAt) : "—"}
                      </div>
                      <div style={{ fontSize: "0.64rem", color: "var(--c-text-4)", marginTop: "2px" }}>
                        {r.administeredAt ? formatTime(r.administeredAt) : ""}
                      </div>
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