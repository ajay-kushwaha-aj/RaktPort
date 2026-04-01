// hospital/RequestsView.tsx — All Requests Tab v5.0 (Production Redesign)
import { useState, useMemo } from "react";
import {
  Search, QrCode, Copy, Trash2, Printer, ChevronDown,
  HeartHandshake, Pencil, CopyPlus, ChevronLeft, ChevronRight,
  Calendar, SlidersHorizontal, Filter, X
} from "lucide-react";
// @ts-ignore
import { BLOOD_GROUPS } from "@/lib/bloodbank-utils";
import { URGENCY_CONFIG, getStatusMeta } from "./constants";
import {
  isRequestValid, getTimeRemaining, getValidityPct,
  formatDate, formatTime, timeAgo, canDeleteRequest, maskAadhaar,
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

/* ── Inline badge styles ── */
const URGENCY_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  Emergency: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
  Urgent: { bg: "#FFF7ED", color: "#EA580C", border: "#FED7AA" },
  Routine: { bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0" },
};

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

  const filtered = useMemo(() => {
    let f = [...requests];
    if (filterBG !== "All") f = f.filter(r => r.bloodGroup === filterBG);
    if (filterUrgency !== "All") f = f.filter(r => r.urgency === filterUrgency);
    if (filterStatus !== "All") {
      if (filterStatus === "VALID")
        f = f.filter(r => isRequestValid(r) && !["REDEEMED", "PARTIALLY ADMINISTERED", "ADMINISTERED", "CLOSED", "EXPIRED", "CANCELLED"].includes(r.status));
      else if (filterStatus === "EXPIRED")
        f = f.filter(r => !isRequestValid(r) || r.status === "EXPIRED");
      else
        f = f.filter(r => r.status === filterStatus);
    }
    if (dateFrom) { const from = new Date(dateFrom); f = f.filter(r => r.createdAt >= from); }
    if (dateTo) { const to = new Date(dateTo + "T23:59:59"); f = f.filter(r => r.createdAt <= to); }
    if (search) {
      const s = search.toLowerCase();
      f = f.filter(r =>
        r.patientName.toLowerCase().includes(s) ||
        r.rtid.toLowerCase().includes(s) ||
        (r.serialNumber || "").toLowerCase().includes(s) ||
        (r.doctorName || "").toLowerCase().includes(s)
      );
    }
    if (sortBy === "newest") f.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    if (sortBy === "urgency") f.sort((a, b) => ({ "Emergency": 0, "Urgent": 1, "Routine": 2 }[a.urgency || "Routine"] || 2) - ({ "Emergency": 0, "Urgent": 1, "Routine": 2 }[b.urgency || "Routine"] || 2));
    if (sortBy === "validity") f.sort((a, b) => getValidityPct(b) - getValidityPct(a));
    return f;
  }, [requests, filterBG, filterStatus, filterUrgency, search, sortBy, dateFrom, dateTo]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = useMemo(() => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [filtered, page]);

  const hasActiveFilters = filterBG !== "All" || filterStatus !== "All" || filterUrgency !== "All" || dateFrom || dateTo;

  const clearAll = () => {
    setFilterBG("All"); setFilterStatus("All"); setFilterUrgency("All");
    setDateFrom(""); setDateTo(""); setSearch(""); setPage(0);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* ── Search + Filter bar ── */}
      <div className="hd-card hd-enter" style={{ padding: "16px" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <Search
              size={15}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--c-text-4)",
              }}
            />
            <input
              className="hd-search"
              placeholder="Search patient, RTID, serial, doctor…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              fontSize: "0.78rem",
              border: "1.5px solid var(--c-border)",
              borderRadius: "var(--r-md)",
              padding: "0 12px",
              background: "var(--c-surface)",
              color: "var(--c-text-2)",
              fontWeight: 500,
              outline: "none",
              cursor: "pointer",
              fontFamily: "var(--f-body)",
              height: "38px",
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
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "0 14px",
              height: "38px",
              borderRadius: "var(--r-md)",
              border: `1.5px solid ${showFilters || hasActiveFilters ? "var(--c-brand)" : "var(--c-border)"}`,
              background: showFilters || hasActiveFilters ? "var(--c-brand-soft)" : "var(--c-surface)",
              color: showFilters || hasActiveFilters ? "var(--c-brand)" : "var(--c-text-2)",
              fontSize: "0.78rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all var(--t-fast)",
              fontFamily: "var(--f-body)",
            }}
          >
            <SlidersHorizontal size={14} />
            Filters
            {hasActiveFilters && (
              <span
                style={{
                  background: "var(--c-brand)",
                  color: "#fff",
                  borderRadius: "var(--r-pill)",
                  fontSize: "0.62rem",
                  fontWeight: 800,
                  padding: "1px 6px",
                }}
              >
                On
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearAll}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "0 12px",
                height: "38px",
                borderRadius: "var(--r-md)",
                border: "1.5px solid var(--c-danger-bdr)",
                background: "var(--c-danger-bg)",
                color: "var(--c-danger)",
                fontSize: "0.73rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--f-body)",
              }}
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div
            style={{
              marginTop: "12px",
              paddingTop: "12px",
              borderTop: "1px solid var(--c-border)",
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              alignItems: "center",
            }}
            className="hd-enter"
          >
            {/* Blood group */}
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {["All", ...BLOOD_GROUPS].map((bg: string) => (
                <button
                  key={bg}
                  onClick={() => { setFilterBG(bg); setPage(0); }}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "var(--r-pill)",
                    border: `1.5px solid ${filterBG === bg ? "var(--c-brand)" : "var(--c-border)"}`,
                    background: filterBG === bg ? "var(--c-brand)" : "var(--c-surface-2)",
                    color: filterBG === bg ? "#fff" : "var(--c-text-3)",
                    fontSize: "0.7rem",
                    fontWeight: filterBG === bg ? 700 : 500,
                    cursor: "pointer",
                    transition: "all var(--t-fast)",
                    fontFamily: "var(--f-body)",
                  }}
                >
                  {bg}
                </button>
              ))}
            </div>

            <div
              style={{
                width: "1px",
                height: "24px",
                background: "var(--c-border)",
                flexShrink: 0,
              }}
            />

            {/* Urgency */}
            <div style={{ display: "flex", gap: "4px" }}>
              {["All", "Emergency", "Urgent", "Routine"].map((u) => (
                <button
                  key={u}
                  onClick={() => { setFilterUrgency(u); setPage(0); }}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "var(--r-pill)",
                    border: `1.5px solid ${filterUrgency === u
                      ? u === "Emergency" ? "#EF4444" : u === "Urgent" ? "#F97316" : u === "Routine" ? "#22C55E" : "var(--c-brand)"
                      : "var(--c-border)"
                      }`,
                    background: filterUrgency === u
                      ? u === "Emergency" ? "#FEF2F2" : u === "Urgent" ? "#FFF7ED" : u === "Routine" ? "#F0FDF4" : "var(--c-brand-soft)"
                      : "var(--c-surface-2)",
                    color: filterUrgency === u
                      ? u === "Emergency" ? "#DC2626" : u === "Urgent" ? "#EA580C" : u === "Routine" ? "#15803D" : "var(--c-brand)"
                      : "var(--c-text-3)",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all var(--t-fast)",
                    fontFamily: "var(--f-body)",
                  }}
                >
                  {u === "All" ? "All Urgency" : u}
                </button>
              ))}
            </div>

            <div
              style={{
                width: "1px",
                height: "24px",
                background: "var(--c-border)",
                flexShrink: 0,
              }}
            />

            {/* Status */}
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
              style={{
                fontSize: "0.73rem",
                border: "1.5px solid var(--c-border)",
                borderRadius: "var(--r-md)",
                padding: "4px 10px",
                background: "var(--c-surface)",
                color: "var(--c-text-2)",
                fontWeight: 500,
                outline: "none",
                cursor: "pointer",
                fontFamily: "var(--f-body)",
              }}
            >
              {["All", "VALID", "PENDING", "PARTIAL", "PARTIAL REDEEMED", "REDEEMED", "PARTIALLY ADMINISTERED", "ADMINISTERED", "CLOSED", "EXPIRED"].map(o => (
                <option key={o}>{o}</option>
              ))}
            </select>

            {/* Date range */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Calendar size={13} style={{ color: "var(--c-text-4)", flexShrink: 0 }} />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                style={{
                  fontSize: "0.72rem",
                  border: "1.5px solid var(--c-border)",
                  borderRadius: "var(--r-md)",
                  padding: "4px 8px",
                  background: "var(--c-surface)",
                  color: "var(--c-text-2)",
                  outline: "none",
                  fontFamily: "var(--f-body)",
                }}
              />
              <span style={{ fontSize: "0.65rem", color: "var(--c-text-4)" }}>to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                style={{
                  fontSize: "0.72rem",
                  border: "1.5px solid var(--c-border)",
                  borderRadius: "var(--r-md)",
                  padding: "4px 8px",
                  background: "var(--c-surface)",
                  color: "var(--c-text-2)",
                  outline: "none",
                  fontFamily: "var(--f-body)",
                }}
              />
            </div>
          </div>
        )}

        {/* Result count */}
        <div
          style={{
            marginTop: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "0.72rem", color: "var(--c-text-4)" }}>
            {filtered.length} of {requests.length} requests
            {page > 0 && ` · Page ${page + 1} of ${totalPages}`}
          </span>
          {filtered.length === 0 && (
            <button
              onClick={clearAll}
              style={{
                fontSize: "0.72rem",
                color: "var(--c-brand)",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--f-body)",
                fontWeight: 600,
              }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ── Request List ── */}
      {filtered.length === 0 ? (
        <div className="hd-card">
          <div className="hd-empty">
            <div className="hd-empty-icon">🔍</div>
            <p className="hd-empty-title">No requests found</p>
            <p className="hd-empty-sub">Try adjusting your filters or search term</p>
            <button
              onClick={() => onNewRequest("Routine")}
              style={{
                marginTop: "14px",
                padding: "8px 18px",
                borderRadius: "var(--r-md)",
                background: "var(--c-brand)",
                color: "#fff",
                border: "none",
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "var(--f-body)",
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
            const rem = getTimeRemaining(r);
            const pct = getValidityPct(r);
            const isEM = r.urgency === "Emergency";
            const isExp = expanded === r.id;
            const fulfPct = r.unitsRequired > 0 ? ((r.unitsAdministered || 0) / r.unitsRequired) * 100 : 0;
            const barC = pct > 50 ? "#10B981" : pct > 20 ? "#F59E0B" : "#EF4444";
            const redeemedAvailable = Math.max(0, (r.unitsFulfilled || 0) - (r.unitsAdministered || 0));
            const canComplete = redeemedAvailable > 0 && ["REDEEMED", "PARTIAL REDEEMED", "HOSPITAL VERIFIED", "PARTIALLY ADMINISTERED"].includes(r.status);

            return (
              <div
                key={r.id}
                className={`hd-card hd-enter ${isEM ? "emergency-ring" : ""}`}
                style={{
                  overflow: "hidden",
                  animationDelay: `${i * 0.03}s`,
                  transition: "all var(--t-med)",
                  borderColor: isEM ? "rgba(220,38,38,0.3)" : undefined,
                }}
              >
                {/* Urgency strip */}
                <div
                  style={{
                    height: "2px",
                    background: isEM
                      ? "linear-gradient(90deg,#DC2626,#EF4444)"
                      : r.urgency === "Urgent"
                        ? "linear-gradient(90deg,#EA580C,#F97316)"
                        : "var(--c-border)",
                  }}
                />

                {/* Main row — clickable to expand */}
                <div
                  style={{ padding: "14px 16px", cursor: "pointer" }}
                  onClick={() => setExpanded(isExp ? null : r.id)}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    {/* Urgency avatar */}
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "10px",
                        background: uc2.bg,
                        border: `1.5px solid ${uc2.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.1rem",
                        flexShrink: 0,
                      }}
                    >
                      {isEM ? "🚨" : r.urgency === "Urgent" ? "⚡" : "📋"}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontFamily: "var(--f-display)",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                            color: "var(--c-text)",
                          }}
                        >
                          {r.patientName}
                        </span>
                        {r.age && (
                          <span style={{ fontSize: "0.68rem", color: "var(--c-text-4)" }}>
                            {r.age}y
                          </span>
                        )}
                        <span
                          style={{
                            fontFamily: "var(--f-display)",
                            fontWeight: 800,
                            fontSize: "0.68rem",
                            padding: "2px 8px",
                            borderRadius: "var(--r-pill)",
                            background: "var(--c-brand-soft)",
                            color: "var(--c-brand)",
                            border: "1px solid rgba(196,28,56,0.15)",
                          }}
                        >
                          {r.bloodGroup}
                        </span>
                        {isEM && (
                          <span
                            style={{
                              fontSize: "0.6rem",
                              fontWeight: 800,
                              background: "#DC2626",
                              color: "#fff",
                              padding: "2px 7px",
                              borderRadius: "var(--r-pill)",
                              animation: "hd-emergency-pulse 1.5s ease-in-out infinite",
                              letterSpacing: "0.04em",
                            }}
                          >
                            EMERGENCY
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginTop: "4px",
                          flexWrap: "wrap",
                        }}
                      >
                        <span className="hd-mono-pill">{r.rtid}</span>
                        <span style={{ fontSize: "0.68rem", color: "var(--c-text-4)" }}>
                          {r.componentType || "Whole Blood"} × {r.unitsRequired}u
                        </span>
                        {r.wardDepartment && (
                          <span style={{ fontSize: "0.68rem", color: "var(--c-text-4)" }}>
                            · {r.wardDepartment}
                          </span>
                        )}
                      </div>

                      {/* Validity bar */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                        <div className="hd-validity" style={{ flex: 1 }}>
                          <div
                            className="hd-validity-fill"
                            style={{ width: `${pct}%`, background: barC }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: "0.65rem",
                            fontWeight: 600,
                            color: isV ? barC : "#EF4444",
                            flexShrink: 0,
                          }}
                        >
                          {rem}
                        </span>
                      </div>

                      {r.unitsFulfilled > 0 && (
                        <div className="hd-prog" style={{ marginTop: "4px" }}>
                          <div
                            className="hd-prog-fill"
                            style={{
                              width: `${(r.unitsAdministered / r.unitsRequired) * 100}%`,
                              background: "linear-gradient(90deg,#2563EB,#60A5FA)",
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Right: Status + chevron */}
                    <div
                      style={{
                        flexShrink: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: "6px",
                      }}
                    >
                      <span
                        className="hd-status"
                        style={{ background: sm.bg, color: sm.text, border: `1px solid ${sm.border}` }}
                      >
                        {sm.label}
                      </span>
                      {r.unitsFulfilled > 0 && (
                        <span style={{ fontSize: "0.62rem", color: "var(--c-text-4)" }}>
                          {r.unitsFulfilled}/{r.unitsRequired} fulfilled
                        </span>
                      )}
                      <ChevronDown
                        size={16}
                        style={{
                          color: "var(--c-text-4)",
                          transform: isExp ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform var(--t-med)",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Expanded panel ── */}
                {isExp && (
                  <div
                    className="hd-expand-panel hd-enter"
                    style={{ padding: "16px" }}
                  >
                    {/* Detail grid */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "10px 20px",
                        marginBottom: "14px",
                      }}
                    >
                      {[
                        ["Serial", r.serialNumber || "—"],
                        ["Required By", `${formatDate(r.requiredBy)} ${formatTime(r.requiredBy)}`],
                        ["Created", timeAgo(r.createdAt)],
                        ["Indication", r.transfusionIndication || "—"],
                        ["Doctor", r.doctorName || "—"],
                        ["Reg. No.", r.doctorRegNo || "—"],
                        ["Bed", r.bedNumber || "—"],
                        ["Mobile", r.patientMobile ? maskAadhaar(r.patientMobile) : "—"],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <p
                            style={{
                              fontSize: "0.62rem",
                              color: "var(--c-text-4)",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                              marginBottom: "2px",
                            }}
                          >
                            {k}
                          </p>
                          <p
                            style={{
                              fontSize: "0.78rem",
                              color: "var(--c-text-2)",
                              fontWeight: 500,
                            }}
                          >
                            {v}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Status Timeline */}
                    <div
                      style={{
                        background: "var(--c-surface)",
                        borderRadius: "var(--r-lg)",
                        padding: "12px 14px",
                        border: "1px solid var(--c-border)",
                        marginBottom: "12px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "0.62rem",
                          fontWeight: 700,
                          color: "var(--c-text-4)",
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                          marginBottom: "4px",
                        }}
                      >
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
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "10px 14px",
                          background: "var(--c-info-bg)",
                          border: "1px solid var(--c-info-bdr)",
                          borderRadius: "var(--r-md)",
                          marginBottom: "12px",
                          fontSize: "0.75rem",
                          color: "var(--c-info)",
                        }}
                      >
                        <HeartHandshake size={14} style={{ flexShrink: 0 }} />
                        <span>
                          Blood administered on{" "}
                          <strong>
                            {formatDate(r.administeredAt)} {formatTime(r.administeredAt)}
                          </strong>
                        </span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px",
                        paddingTop: "12px",
                        borderTop: "1px solid var(--c-border)",
                      }}
                    >
                      {/* Standard actions */}
                      {[
                        { icon: <Printer size={12} />, label: "Print Slip", act: () => onPrint(r) },
                        { icon: <QrCode size={12} />, label: "View QR", act: () => onViewQR(r) },
                        { icon: <Copy size={12} />, label: "Copy RTID", act: () => onCopyRTID(r.rtid) },
                      ].map(({ icon, label, act }) => (
                        <button
                          key={label}
                          onClick={(e) => { e.stopPropagation(); act(); }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "6px 12px",
                            borderRadius: "var(--r-sm)",
                            border: "1px solid var(--c-border)",
                            background: "var(--c-surface)",
                            color: "var(--c-text-2)",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all var(--t-fast)",
                            fontFamily: "var(--f-body)",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "var(--c-surface-2)";
                            (e.currentTarget as HTMLElement).style.borderColor = "var(--c-border-med)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "var(--c-surface)";
                            (e.currentTarget as HTMLElement).style.borderColor = "var(--c-border)";
                          }}
                        >
                          {icon} {label}
                        </button>
                      ))}

                      {/* WhatsApp */}
                      <button
                        onClick={(e) => { e.stopPropagation(); onWhatsAppShare(r); }}
                        className="hd-share-wa"
                      >
                        💬 WhatsApp
                      </button>

                      {/* Edit */}
                      {["CREATED", "PENDING"].includes(r.status) && onEditRequest && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onEditRequest(r); }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "6px 12px",
                            borderRadius: "var(--r-sm)",
                            border: "1px solid var(--c-warn-bdr)",
                            background: "var(--c-warn-bg)",
                            color: "var(--c-warn)",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "var(--f-body)",
                            transition: "all var(--t-fast)",
                          }}
                        >
                          <Pencil size={12} /> Edit
                        </button>
                      )}

                      {/* Duplicate */}
                      {onDuplicate && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDuplicate(r); }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "6px 12px",
                            borderRadius: "var(--r-sm)",
                            border: "1px solid var(--c-info-bdr)",
                            background: "var(--c-info-bg)",
                            color: "var(--c-info)",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "var(--f-body)",
                            transition: "all var(--t-fast)",
                          }}
                        >
                          <CopyPlus size={12} /> Duplicate
                        </button>
                      )}

                      {/* Mark administered */}
                      {canComplete && r.status !== "ADMINISTERED" && r.status !== "CLOSED" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onMarkComplete(r); }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 14px",
                            borderRadius: "var(--r-sm)",
                            border: "none",
                            background: "var(--c-info)",
                            color: "#fff",
                            fontSize: "0.73rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "var(--f-body)",
                            boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
                            transition: "all var(--t-med)",
                          }}
                        >
                          <HeartHandshake size={13} />
                          {r.unitsAdministered > 0 && r.unitsAdministered < r.unitsRequired
                            ? `Record More (${r.unitsAdministered}/${r.unitsRequired})`
                            : "Mark Administered"}
                        </button>
                      )}

                      {/* Delete */}
                      {canDeleteRequest(r) && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(r.id); }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "6px 12px",
                            borderRadius: "var(--r-sm)",
                            border: "1px solid var(--c-danger-bdr)",
                            background: "var(--c-danger-bg)",
                            color: "var(--c-danger)",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "var(--f-body)",
                            transition: "all var(--t-fast)",
                            marginLeft: "auto",
                          }}
                        >
                          <Trash2 size={12} /> Delete
                        </button>
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
        <div
          className="hd-card hd-enter"
          style={{
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "7px 14px",
              borderRadius: "var(--r-md)",
              border: "1.5px solid var(--c-border)",
              background: "var(--c-surface)",
              color: page === 0 ? "var(--c-text-4)" : "var(--c-text-2)",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: page === 0 ? "not-allowed" : "pointer",
              opacity: page === 0 ? 0.5 : 1,
              fontFamily: "var(--f-body)",
              transition: "all var(--t-fast)",
            }}
          >
            <ChevronLeft size={14} /> Previous
          </button>

          <div style={{ display: "flex", gap: "4px" }}>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const pg =
                totalPages <= 7 ? i
                  : page <= 3 ? i
                    : page >= totalPages - 4 ? totalPages - 7 + i
                      : page - 3 + i;
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "var(--r-md)",
                    border: "1.5px solid",
                    borderColor: page === pg ? "var(--c-brand)" : "var(--c-border)",
                    background: page === pg ? "var(--c-brand)" : "var(--c-surface)",
                    color: page === pg ? "#fff" : "var(--c-text-3)",
                    fontSize: "0.73rem",
                    fontWeight: page === pg ? 700 : 500,
                    cursor: "pointer",
                    transition: "all var(--t-med)",
                    fontFamily: "var(--f-display)",
                    boxShadow: page === pg ? "var(--s-brand)" : "none",
                  }}
                >
                  {pg + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "7px 14px",
              borderRadius: "var(--r-md)",
              border: "1.5px solid var(--c-border)",
              background: "var(--c-surface)",
              color: page >= totalPages - 1 ? "var(--c-text-4)" : "var(--c-text-2)",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: page >= totalPages - 1 ? "not-allowed" : "pointer",
              opacity: page >= totalPages - 1 ? 0.5 : 1,
              fontFamily: "var(--f-body)",
              transition: "all var(--t-fast)",
            }}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}