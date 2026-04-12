// hospital/AuditTrailView.tsx — v5.0
// All original Firebase/logic preserved. UI upgraded.
import { useState, useEffect, useMemo } from "react";
import { Shield, Search, RefreshCw, ClipboardList, PenTool, FileText, Syringe, FileEdit } from "lucide-react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { AUDIT_ACTION_LABELS } from "./auditLog";
import type { AuditAction, AuditEntry } from "./auditLog";

export function AuditTrailView({ hospitalId }: { hospitalId: string }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState<string>("All");

  // ── Original fetch logic ──
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "auditLog"),
        where("hospitalId", "==", hospitalId),
        orderBy("timestamp", "desc"),
        limit(200)
      );
      const snap = await getDocs(q);
      const logs: AuditEntry[] = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as AuditEntry[];
      setEntries(logs);
    } catch (err) {
      console.warn("[AuditTrail] Fetch error:", err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hospitalId) fetchLogs();
  }, [hospitalId]);

  const filtered = useMemo(() => {
    let f = [...entries];
    if (filterAction !== "All") f = f.filter(e => e.action === filterAction);
    if (search) {
      const s = search.toLowerCase();
      f = f.filter(e =>
        e.details.toLowerCase().includes(s) ||
        (e.affectedRtid || "").toLowerCase().includes(s) ||
        e.action.toLowerCase().includes(s)
      );
    }
    return f;
  }, [entries, filterAction, search]);

  const actionTypes = useMemo(
    () => ["All", ...new Set(entries.map(e => e.action))],
    [entries]
  );

  const formatTs = (ts: string) => {
    try {
      return new Date(ts).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true,
      });
    } catch { return ts; }
  };

  const tsAgo = (ts: string) => {
    try {
      const diff = Date.now() - new Date(ts).getTime();
      const m = Math.floor(diff / 60000);
      const h = Math.floor(diff / 3600000);
      const dy = Math.floor(diff / 86400000);
      return dy > 0 ? `${dy}d ago` : h > 0 ? `${h}h ago` : `${m}m ago`;
    } catch { return ""; }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }} className="hd-enter">

      {/* ── KPI row ── */}
      <div className="hd-kpi-grid">
        {[
          { icon: <ClipboardList size={22} style={{ color: "var(--c-brand)" }} />, label: "Total Actions", val: entries.length, cls: "k-blue" },
          { icon: <FileText size={22} style={{ color: "var(--clr-success)" }} />, label: "Requests Created", val: entries.filter(e => e.action === "REQUEST_CREATED").length, cls: "k-green" },
          { icon: <FileEdit size={22} style={{ color: "var(--clr-warning)" }} />, label: "Edits Made", val: entries.filter(e => e.action === "REQUEST_EDITED").length, cls: "k-amber" },
          { icon: <Syringe size={22} style={{ color: "var(--clr-info)" }} />, label: "Administrations", val: entries.filter(e => e.action === "BLOOD_ADMINISTERED").length, cls: "k-purple" },
        ].map((k, i) => (
          <div key={k.label} className={`hd-kpi ${k.cls} hd-enter hd-s${i + 1}`}>
            <span style={{ display: "block", marginBottom: "8px" }}>{k.icon}</span>
            <div className="hd-kpi-val">{k.val}</div>
            <div className="hd-kpi-lbl">{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div className="hd-card" style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
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
              placeholder="Search audit logs…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Action filter */}
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            style={{
              fontSize: "0.74rem",
              border: "1.5px solid var(--c-border)",
              borderRadius: "var(--r-md)",
              padding: "0 12px",
              height: "38px",
              background: "var(--c-surface)",
              color: "var(--c-text-2)",
              fontWeight: 500,
              outline: "none",
              cursor: "pointer",
              fontFamily: "var(--f-body)",
            }}
          >
            {actionTypes.map(a => (
              <option key={a} value={a}>
                {a === "All" ? "All Actions" : AUDIT_ACTION_LABELS[a as AuditAction]?.label || a}
              </option>
            ))}
          </select>

          {/* Refresh */}
          <button
            onClick={fetchLogs}
            style={{
              width: "38px", height: "38px", borderRadius: "var(--r-md)",
              border: "1.5px solid var(--c-border)", background: "var(--c-surface)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "var(--c-text-3)",
              transition: "all var(--t-fast)", flexShrink: 0,
            }}
            title="Refresh"
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "var(--c-surface-2)")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "var(--c-surface)")}
          >
            <RefreshCw
              size={14}
              style={{ animation: loading ? "hd-spin 0.8s linear infinite" : "none" }}
            />
          </button>
        </div>

        <p style={{ fontSize: "0.7rem", color: "var(--c-text-4)", marginTop: "8px" }}>
          {filtered.length} of {entries.length} entries
        </p>
      </div>

      {/* ── Log entries ── */}
      {loading ? (
        <div className="hd-card">
          <div className="hd-empty">
            <div
              style={{
                width: "36px", height: "36px",
                border: "3px solid var(--c-surface-3)",
                borderTopColor: "var(--c-brand)",
                borderRadius: "50%",
                animation: "hd-spin 0.7s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            <p className="hd-empty-title">Loading audit logs…</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="hd-card">
          <div className="hd-empty">
            <div className="hd-empty-icon"><Shield size={28} style={{ color: "var(--c-text-4)" }} /></div>
            <p className="hd-empty-title">No audit entries found</p>
            <p className="hd-empty-sub">Actions will be logged here as you use the dashboard</p>
          </div>
        </div>
      ) : (
        <div className="hd-card" style={{ overflow: "hidden" }}>
          {/* Header */}
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid var(--c-border)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Shield size={15} style={{ color: "var(--c-brand)" }} />
            <span className="hd-sec-title">Activity Log</span>
            <span style={{ fontSize: "0.7rem", color: "var(--c-text-4)", marginLeft: "auto" }}>
              {filtered.length} entries
            </span>
          </div>

          {/* Entries */}
          <div style={{ maxHeight: "55vh", overflowY: "auto" }}>
            {filtered.map((entry, i) => {
              const meta =
                AUDIT_ACTION_LABELS[entry.action as AuditAction] || {
                  label: entry.action,
                  icon: <FileText size={18} style={{ color: "#6B7280" }} />,
                  color: "#6B7280",
                };

              return (
                <div
                  key={entry.id || i}
                  className="hd-enter"
                  style={{
                    padding: "12px 18px",
                    borderBottom:
                      i < filtered.length - 1
                        ? "1px solid var(--c-border)"
                        : "none",
                    animationDelay: `${Math.min(i, 15) * 0.03}s`,
                    transition: "background var(--t-fast)",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                  }}
                  onMouseEnter={e =>
                  ((e.currentTarget as HTMLElement).style.background =
                    "var(--c-surface-2)")
                  }
                  onMouseLeave={e =>
                    ((e.currentTarget as HTMLElement).style.background = "")
                  }
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: "34px", height: "34px",
                      borderRadius: "var(--r-sm)", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1rem",
                      background: `${meta.color}12`,
                      border: `1px solid ${meta.color}28`,
                    }}
                  >
                    <FileText size={18} style={{ color: meta.color }} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex", alignItems: "center",
                        gap: "8px", flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.75rem", fontWeight: 700,
                          color: meta.color, fontFamily: "var(--f-display)",
                        }}
                      >
                        {meta.label}
                      </span>
                      {entry.affectedRtid && (
                        <span className="hd-mono-pill">{entry.affectedRtid}</span>
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: "0.71rem", color: "var(--c-text-3)",
                        marginTop: "3px", lineHeight: 1.5,
                      }}
                    >
                      {entry.details}
                    </p>
                    <p style={{ fontSize: "0.61rem", color: "var(--c-text-4)", marginTop: "3px" }}>
                      {formatTs(entry.timestamp)} · {tsAgo(entry.timestamp)}
                    </p>
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