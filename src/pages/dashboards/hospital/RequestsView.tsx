// hospital/RequestsView.tsx — All Requests tab v5.0
import React, { useState, useMemo } from "react";
import {
  Search, QrCode, Copy, Trash2, Printer, ChevronDown,
  HeartHandshake, Pencil, CopyPlus, ChevronLeft, ChevronRight,
  Calendar, SlidersHorizontal, X, Siren, Zap, ClipboardList, MessageSquare
} from "lucide-react";
// @ts-ignore
import { BLOOD_GROUPS } from "@/lib/bloodbank-utils";
import { URGENCY_CONFIG, getStatusMeta } from "./constants";
import {
  isRequestValid, getTimeRemaining, getValidityPct,
  formatDate, formatTime, timeAgo, canDeleteRequest, maskAadhaar, maskMobile,
} from "./utils";
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
  onNewRequest: (u: UrgencyLevel) => void;
  onMarkComplete: (r: BloodRequest) => void;
  onWhatsAppShare: (r: BloodRequest) => void;
  onEditRequest?: (r: BloodRequest) => void;
  onDuplicate?: (r: BloodRequest) => void;
}

/* Reusable action button */
function ActionBtn({
  icon, label, onClick, variant = "default",
}: {
  icon: React.ReactNode; label: string; onClick: (e: React.MouseEvent) => void;
  variant?: "default" | "warn" | "info" | "danger" | "violet" | "primary";
}) {
  const variantStyles: Record<string, React.CSSProperties> = {
    default: { background: "var(--c-surface)", border: "1px solid var(--c-border)", color: "var(--c-text-2)" },
    warn: { background: "var(--c-warn-bg)", border: "1px solid var(--c-warn-bdr)", color: "var(--c-warn)" },
    info: { background: "var(--c-info-bg)", border: "1px solid var(--c-info-bdr)", color: "var(--c-info)" },
    danger: { background: "var(--c-danger-bg)", border: "1px solid var(--c-danger-bdr)", color: "var(--c-danger)" },
    violet: { background: "rgba(124,58,237,0.06)", border: "1px solid rgba(167,139,250,0.4)", color: "#7C3AED" },
    primary: { background: "var(--c-info)", border: "none", color: "#fff", boxShadow: "0 2px 8px rgba(37,99,235,0.25)" },
  };
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: "5px",
        padding: "6px 12px", borderRadius: "var(--r-sm)",
        fontSize: "0.71rem", fontWeight: 600, cursor: "pointer",
        transition: "all var(--t-fast)", fontFamily: "var(--f-body)",
        ...variantStyles[variant],
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--s-xs)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = variantStyles[variant].boxShadow || "none"; }}
    >
      {icon} {label}
    </button>
  );
}

export function RequestsView({
  requests, onViewQR, onCopyRTID, onDelete, onPrint,
  onNewRequest, onMarkComplete, onWhatsAppShare, onEditRequest, onDuplicate,
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
  const [showFilters, setShowFilters] = useState(false);

  // All original filter logic preserved
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
    if (search) {
      const s = search.toLowerCase();
      f = f.filter(r =>
        r.patientName.toLowerCase().includes(s) || r.rtid.toLowerCase().includes(s) ||
        (r.serialNumber || "").toLowerCase().includes(s) || (r.doctorName || "").toLowerCase().includes(s)
      );
    }
    if (sortBy === "newest") f.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    if (sortBy === "urgency") f.sort((a, b) => ({ "Emergency": 0, "Urgent": 1, "Routine": 2 }[a.urgency || "Routine"] || 2) - ({ "Emergency": 0, "Urgent": 1, "Routine": 2 }[b.urgency || "Routine"] || 2));
    if (sortBy === "validity") f.sort((a, b) => getValidityPct(b) - getValidityPct(a));
    return f;
  }, [requests, filterBG, filterStatus, filterUrgency, search, sortBy, dateFrom, dateTo]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = useMemo(() => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [filtered, page]);

  const hasActive = filterBG !== "All" || filterStatus !== "All" || filterUrgency !== "All" || dateFrom || dateTo;
  const clearAll = () => { setFilterBG("All"); setFilterStatus("All"); setFilterUrgency("All"); setDateFrom(""); setDateTo(""); setSearch(""); setPage(0); };

  const selBtnStyle = (active: boolean, activeColor?: string): React.CSSProperties => ({
    padding: "4px 10px", borderRadius: "var(--r-pill)", cursor: "pointer",
    fontFamily: "var(--f-body)", fontSize: "0.7rem", fontWeight: active ? 700 : 500,
    transition: "all var(--t-fast)",
    border: `1.5px solid ${active ? (activeColor || "var(--c-brand)") : "var(--c-border)"}`,
    background: active ? (activeColor ? `${activeColor}15` : "var(--c-brand)") : "var(--c-surface-2)",
    color: active ? (activeColor || "#fff") : "var(--c-text-3)",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

      {/* ── Filter Bar ── */}
      <div className="hd-card hd-enter" style={{ padding: "16px" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <Search size={15} style={{
              position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
              color: "var(--c-text-4)",
            }} />
            <input
              className="hd-search"
              placeholder="Search patient, RTID, serial, doctor…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{
              fontSize: "0.77rem", border: "1.5px solid var(--c-border)",
              borderRadius: "var(--r-md)", padding: "0 12px", height: "38px",
              background: "var(--c-surface)", color: "var(--c-text-2)",
              fontWeight: 500, outline: "none", cursor: "pointer", fontFamily: "var(--f-body)",
            }}
          >
            <option value="newest">Newest first</option>
            <option value="urgency">By urgency</option>
            <option value="validity">By validity</option>
          </select>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px", padding: "0 14px",
              height: "38px", borderRadius: "var(--r-md)", cursor: "pointer",
              fontFamily: "var(--f-body)", fontSize: "0.77rem", fontWeight: 600,
              transition: "all var(--t-fast)",
              border: `1.5px solid ${showFilters || hasActive ? "var(--c-brand)" : "var(--c-border)"}`,
              background: showFilters || hasActive ? "var(--c-brand-soft)" : "var(--c-surface)",
              color: showFilters || hasActive ? "var(--c-brand)" : "var(--c-text-2)",
            }}
          >
            <SlidersHorizontal size={14} /> Filters
            {hasActive && (
              <span style={{
                background: "var(--c-brand)", color: "#fff",
                borderRadius: "var(--r-pill)", fontSize: "0.6rem", fontWeight: 800, padding: "1px 6px",
              }}>On</span>
            )}
          </button>

          {hasActive && (
            <button
              onClick={clearAll}
              style={{
                display: "inline-flex", alignItems: "center", gap: "4px", padding: "0 12px",
                height: "38px", borderRadius: "var(--r-md)", cursor: "pointer",
                fontFamily: "var(--f-body)", fontSize: "0.72rem", fontWeight: 600,
                border: "1.5px solid var(--c-danger-bdr)", background: "var(--c-danger-bg)", color: "var(--c-danger)",
              }}
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="hd-enter" style={{
            marginTop: "12px", paddingTop: "12px",
            borderTop: "1px solid var(--c-border)",
            display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center",
          }}>
            {/* Blood group chips */}
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {["All", ...BLOOD_GROUPS].map((bg: string) => (
                <button key={bg} onClick={() => { setFilterBG(bg); setPage(0); }} style={selBtnStyle(filterBG === bg)}>
                  {bg}
                </button>
              ))}
            </div>

            <div style={{ width: "1px", height: "24px", background: "var(--c-border)", flexShrink: 0 }} />

            {/* Urgency */}
            {[
              { val: "All", label: "All", color: undefined },
              { val: "Emergency", label: "Emergency", color: "var(--clr-emergency)" },
              { val: "Urgent", label: "Urgent", color: "#EA580C" },
              { val: "Routine", label: "Routine", color: "#15803D" },
            ].map(u => (
              <button
                key={u.val}
                onClick={() => { setFilterUrgency(u.val); setPage(0); }}
                style={selBtnStyle(filterUrgency === u.val, u.color)}
              >
                {u.label}
              </button>
            ))}

            <div style={{ width: "1px", height: "24px", background: "var(--c-border)", flexShrink: 0 }} />

            {/* Status select */}
            <select
              value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(0); }}
              style={{
                fontSize: "0.72rem", border: "1.5px solid var(--c-border)",
                borderRadius: "var(--r-md)", padding: "5px 10px",
                background: "var(--c-surface)", color: "var(--c-text-2)",
                fontWeight: 500, outline: "none", cursor: "pointer", fontFamily: "var(--f-body)",
              }}
            >
              {["All", "VALID", "PENDING", "PARTIAL", "PARTIAL REDEEMED", "REDEEMED", "PARTIALLY ADMINISTERED", "ADMINISTERED", "CLOSED", "EXPIRED"].map(o => (
                <option key={o}>{o}</option>
              ))}
            </select>

            {/* Date range */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Calendar size={13} style={{ color: "var(--c-text-4)", flexShrink: 0 }} />
              {[
                { val: dateFrom, set: setDateFrom, label: "From" },
                { val: dateTo, set: setDateTo, label: "To" },
              ].map((d, di) => (
                <React.Fragment key={d.label}>
                  {di > 0 && <span style={{ fontSize: "0.65rem", color: "var(--c-text-4)" }}>to</span>}
                  <input
                    type="date" value={d.val}
                    onChange={e => { d.set(e.target.value); setPage(0); }}
                    style={{
                      fontSize: "0.71rem", border: "1.5px solid var(--c-border)",
                      borderRadius: "var(--r-md)", padding: "4px 8px",
                      background: "var(--c-surface)", color: "var(--c-text-2)",
                      outline: "none", fontFamily: "var(--f-body)",
                    }}
                  />
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Result count */}
        <div style={{ marginTop: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "0.71rem", color: "var(--c-text-4)" }}>
            {filtered.length} of {requests.length} requests
            {totalPages > 1 && ` · Page ${page + 1}/${totalPages}`}
          </span>
        </div>
      </div>

      {/* ── Request List ── */}
      {filtered.length === 0 ? (
        <div className="hd-card">
          <div className="hd-empty">
            <div className="hd-empty-icon"><Search size={40} style={{ color: "var(--c-text-4)" }} /></div>
            <p className="hd-empty-title">No requests found</p>
            <p className="hd-empty-sub">Try adjusting your filters or search term</p>
            <button
              onClick={() => onNewRequest("Routine")}
              style={{
                marginTop: "14px", padding: "8px 18px", borderRadius: "var(--r-md)",
                background: "var(--c-brand)", color: "#fff", border: "none",
                fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", fontFamily: "var(--f-body)",
              }}
            >
              + New Request
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {paged.map((r, i) => {
            const isV = isRequestValid(r);
            const sm = getStatusMeta(isV ? r.status : "EXPIRED");
            const uc2 = URGENCY_CONFIG[r.urgency || "Routine"];
            const pct = getValidityPct(r);
            const isEM = r.urgency === "Emergency";
            const isExp = expanded === r.id;
            const barC = pct > 50 ? "var(--clr-success)" : pct > 20 ? "#F59E0B" : "var(--clr-emergency)";
            const redeemedAvail = Math.max(0, (r.unitsFulfilled || 0) - (r.unitsAdministered || 0));
            const canComplete = redeemedAvail > 0 && ["REDEEMED", "PARTIAL REDEEMED", "HOSPITAL VERIFIED", "PARTIALLY ADMINISTERED"].includes(r.status);
            const fulfPct = r.unitsRequired > 0 ? ((r.unitsAdministered || 0) / r.unitsRequired) * 100 : 0;

            return (
              <div
                key={r.id}
                className={`hd-card hd-enter ${isEM ? "emergency-glow" : ""}`}
                style={{ overflow: "hidden", animationDelay: `${i * 0.03}s`, transition: "all var(--t-med)" }}
              >
                {/* Urgency accent strip */}
                <div style={{
                  height: "2px",
                  background: isEM
                    ? "linear-gradient(90deg,var(--clr-emergency),var(--clr-emergency))"
                    : r.urgency === "Urgent"
                      ? "linear-gradient(90deg,#EA580C,#F97316)"
                      : "var(--c-border)",
                }} />

                {/* Main row */}
                <div
                  style={{ padding: "14px 16px", cursor: "pointer" }}
                  onClick={() => setExpanded(isExp ? null : r.id)}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    {/* Icon */}
                    <div style={{
                      width: "38px", height: "38px", borderRadius: "10px",
                      background: uc2.bg, border: `1.5px solid ${uc2.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: uc2.color, flexShrink: 0,
                    }}>
                      {isEM ? <Siren size={18} /> : r.urgency === "Urgent" ? <Zap size={18} /> : <ClipboardList size={18} />}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "var(--f-display)", fontWeight: 700, fontSize: "0.85rem", color: "var(--c-text)" }}>
                          {r.patientName}
                        </span>
                        {r.age && <span style={{ fontSize: "0.67rem", color: "var(--c-text-4)" }}>{r.age}y</span>}
                        <span style={{
                          fontFamily: "var(--f-display)", fontWeight: 800, fontSize: "0.66rem",
                          padding: "2px 8px", borderRadius: "var(--r-pill)",
                          background: "var(--c-brand-soft)", color: "var(--c-brand)",
                          border: "1px solid rgba(196,28,56,0.15)",
                        }}>
                          {r.bloodGroup}
                        </span>
                        {isEM && (
                          <span style={{
                            fontSize: "0.58rem", fontWeight: 800, background: "var(--clr-emergency)",
                            color: "#fff", padding: "2px 7px", borderRadius: "var(--r-pill)",
                            animation: "hd-pulse-em 1.5s ease-in-out infinite", letterSpacing: "0.04em",
                          }}>EMERGENCY</span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "7px", marginTop: "3px", flexWrap: "wrap" }}>
                        <span className="hd-mono-pill">{r.rtid}</span>
                        <span style={{ fontSize: "0.67rem", color: "var(--c-text-4)" }}>
                          {r.componentType || "Whole Blood"} × {r.unitsRequired}
                        </span>
                        {r.wardDepartment && <span style={{ fontSize: "0.67rem", color: "var(--c-text-4)" }}>· {r.wardDepartment}</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "7px" }}>
                        <div className="hd-validity" style={{ flex: 1 }}>
                          <div className="hd-validity-fill" style={{ width: `${pct}%`, background: barC }} />
                        </div>
                        <span style={{ fontSize: "0.64rem", fontWeight: 600, color: isV ? barC : "var(--clr-emergency)", flexShrink: 0 }}>
                          {getTimeRemaining(r)}
                        </span>
                      </div>
                      {r.unitsFulfilled > 0 && (
                        <div className="hd-prog" style={{ marginTop: "4px" }}>
                          <div className="hd-prog-fill" style={{
                            width: `${fulfPct}%`, background: "linear-gradient(90deg,var(--clr-info),#60A5FA)",
                          }} />
                        </div>
                      )}
                    </div>

                    {/* Right status */}
                    <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                      <span className="hd-status" style={{ background: sm.bg, color: sm.text, border: `1px solid ${sm.border}` }}>
                        {sm.label}
                      </span>
                      {r.unitsFulfilled > 0 && (
                        <span style={{ fontSize: "0.61rem", color: "var(--c-text-4)" }}>
                          {r.unitsFulfilled}/{r.unitsRequired} fulfilled
                        </span>
                      )}
                      <ChevronDown size={16} style={{
                        color: "var(--c-text-4)",
                        transform: isExp ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform var(--t-med)",
                      }} />
                    </div>
                  </div>
                </div>

                {/* ── Expanded panel ── */}
                {isExp && (
                  <div className="hd-expand-panel hd-enter" style={{ padding: "16px" }}>
                    {/* Detail grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "10px 20px", marginBottom: "14px" }}>
                      {[
                        ["Serial", r.serialNumber || "—"],
                        ["Required By", `${formatDate(r.requiredBy)} ${formatTime(r.requiredBy)}`],
                        ["Created", timeAgo(r.createdAt)],
                        ["Indication", r.transfusionIndication || "—"],
                        ["Doctor", r.doctorName || "—"],
                        ["Reg. No.", r.doctorRegNo || "—"],
                        ["Bed", r.bedNumber || "—"],
                        ["Mobile", r.patientMobile ? maskMobile(r.patientMobile) : "—"],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <p style={{ fontSize: "0.6rem", color: "var(--c-text-4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>{k}</p>
                          <p style={{ fontSize: "0.77rem", color: "var(--c-text-2)", fontWeight: 500 }}>{v}</p>
                        </div>
                      ))}
                    </div>

                    {/* Status Timeline */}
                    <div style={{
                      background: "var(--c-surface)", borderRadius: "var(--r-lg)",
                      padding: "12px 14px", border: "1px solid var(--c-border)", marginBottom: "12px",
                    }}>
                      <p style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--c-text-4)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px" }}>
                        Status Timeline
                      </p>
                      <StatusTimeline request={r} />
                    </div>

                    {/* Donors */}
                    {r.donors && r.donors.length > 0 && (
                      <div style={{ marginBottom: "12px" }}>
                        <DonorPanel request={r} />
                      </div>
                    )}

                    {/* Administered note */}
                    {r.administeredAt && (
                      <div style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "10px 14px", background: "var(--c-info-bg)",
                        border: "1px solid var(--c-info-bdr)", borderRadius: "var(--r-md)",
                        marginBottom: "12px", fontSize: "0.75rem", color: "var(--c-info)",
                      }}>
                        <HeartHandshake size={14} style={{ flexShrink: 0 }} />
                        <span>Blood administered on <strong>{formatDate(r.administeredAt)} {formatTime(r.administeredAt)}</strong></span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div style={{
                      display: "flex", flexWrap: "wrap", gap: "6px",
                      paddingTop: "12px", borderTop: "1px solid var(--c-border)",
                    }}>
                      <ActionBtn icon={<Printer size={12} />} label="Print Slip" onClick={e => { e.stopPropagation(); onPrint(r); }} />
                      <ActionBtn icon={<QrCode size={12} />} label="View QR" onClick={e => { e.stopPropagation(); onViewQR(r); }} />
                      <ActionBtn icon={<Copy size={12} />} label="Copy RTID" onClick={e => { e.stopPropagation(); onCopyRTID(r.rtid); }} />
                      <button onClick={e => { e.stopPropagation(); onWhatsAppShare(r); }} className="hd-share-wa" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MessageSquare size={12} /> WhatsApp</button>

                      {["CREATED", "PENDING"].includes(r.status) && onEditRequest && (
                        <ActionBtn icon={<Pencil size={12} />} label="Edit" variant="warn"
                          onClick={e => { e.stopPropagation(); onEditRequest(r); }} />
                      )}
                      {onDuplicate && (
                        <ActionBtn icon={<CopyPlus size={12} />} label="Duplicate" variant="violet"
                          onClick={e => { e.stopPropagation(); onDuplicate(r); }} />
                      )}
                      {canComplete && r.status !== "ADMINISTERED" && r.status !== "CLOSED" && (
                        <ActionBtn
                          icon={<HeartHandshake size={12} />}
                          label={r.unitsAdministered > 0 && r.unitsAdministered < r.unitsRequired
                            ? `Record More (${r.unitsAdministered}/${r.unitsRequired})`
                            : "Mark Administered"}
                          variant="primary"
                          onClick={e => { e.stopPropagation(); onMarkComplete(r); }}
                        />
                      )}
                      {canDeleteRequest(r) && (
                        <div style={{ marginLeft: "auto" }}>
                          <ActionBtn icon={<Trash2 size={12} />} label="Delete" variant="danger"
                            onClick={e => { e.stopPropagation(); onDelete(r.id); }} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="hd-card hd-enter" style={{
          padding: "10px 16px", display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: "12px",
        }}>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            style={{
              display: "inline-flex", alignItems: "center", gap: "5px",
              padding: "7px 14px", borderRadius: "var(--r-md)",
              border: "1.5px solid var(--c-border)", background: "var(--c-surface)",
              color: page === 0 ? "var(--c-text-4)" : "var(--c-text-2)",
              fontSize: "0.74rem", fontWeight: 600, cursor: page === 0 ? "not-allowed" : "pointer",
              opacity: page === 0 ? 0.5 : 1, fontFamily: "var(--f-body)", transition: "all var(--t-fast)",
            }}
          >
            <ChevronLeft size={14} /> Previous
          </button>

          <div style={{ display: "flex", gap: "4px" }}>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const pg = totalPages <= 7 ? i : page <= 3 ? i : page >= totalPages - 4 ? totalPages - 7 + i : page - 3 + i;
              return (
                <button
                  key={pg} onClick={() => setPage(pg)}
                  style={{
                    width: "32px", height: "32px", borderRadius: "var(--r-md)",
                    border: "1.5px solid", fontSize: "0.72rem", fontWeight: pg === page ? 700 : 500,
                    cursor: "pointer", transition: "all var(--t-med)", fontFamily: "var(--f-display)",
                    borderColor: pg === page ? "var(--c-brand)" : "var(--c-border)",
                    background: pg === page ? "var(--c-brand)" : "var(--c-surface)",
                    color: pg === page ? "#fff" : "var(--c-text-3)",
                    boxShadow: pg === page ? "var(--s-brand)" : "none",
                  }}
                >
                  {pg + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            style={{
              display: "inline-flex", alignItems: "center", gap: "5px",
              padding: "7px 14px", borderRadius: "var(--r-md)",
              border: "1.5px solid var(--c-border)", background: "var(--c-surface)",
              color: page >= totalPages - 1 ? "var(--c-text-4)" : "var(--c-text-2)",
              fontSize: "0.74rem", fontWeight: 600,
              cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
              opacity: page >= totalPages - 1 ? 0.5 : 1, fontFamily: "var(--f-body)", transition: "all var(--t-fast)",
            }}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}