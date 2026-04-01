// hospital/PremiumDashboard.tsx — Overview Tab v5.0 (Production Redesign)
import { useMemo } from "react";
import {
  Plus, Clock, MapPin, Siren, BarChart2, TrendingUp, ClipboardList,
  Droplet, Zap, ArrowRight, HeartHandshake, Activity, AlertCircle,
  CheckCircle2, Timer, Flame
} from "lucide-react";
// @ts-ignore
import { BLOOD_GROUPS } from "@/lib/bloodbank-utils";
import { URGENCY_CONFIG, getStatusMeta } from "./constants";
import { isRequestValid, getTimeRemaining, getValidityPct, formatDate, formatTime, timeAgo } from "./utils";
import type { BloodRequest, UrgencyLevel } from "./types";

interface PremiumDashboardProps {
  requests: BloodRequest[];
  hospitalData: any;
  kpis: any;
  onNewRequest: (u: UrgencyLevel) => void;
  onViewQR: (r: BloodRequest) => void;
  onDelete: (id: string) => void;
  onPrint: (r: BloodRequest) => void;
  onMarkComplete: (r: BloodRequest) => void;
  onWhatsAppShare: (r: BloodRequest) => void;
  onExportCSV: () => void;
}

/* ── Urgency accent map ── */
const URGENCY_ACCENT = {
  Emergency: { bg: "#FEF2F2", border: "#FECACA", text: "#DC2626", dark: "rgba(220,38,38,0.12)", darkBorder: "rgba(220,38,38,0.3)", darkText: "#F87171" },
  Urgent: { bg: "#FFF7ED", border: "#FED7AA", text: "#EA580C", dark: "rgba(234,88,12,0.12)", darkBorder: "rgba(234,88,12,0.3)", darkText: "#FB923C" },
  Routine: { bg: "#F0FDF4", border: "#BBF7D0", text: "#15803D", dark: "rgba(21,128,61,0.12)", darkBorder: "rgba(21,128,61,0.3)", darkText: "#4ADE80" },
};

/* ── Active Request Mini Card ── */
function ActiveRequestCard({
  request,
  onMarkComplete,
  onWhatsAppShare,
  onPrint,
}: {
  request: BloodRequest;
  onMarkComplete: (r: BloodRequest) => void;
  onWhatsAppShare: (r: BloodRequest) => void;
  onPrint: (r: BloodRequest) => void;
}) {
  const pct = getValidityPct(request);
  const rem = getTimeRemaining(request);
  const isV = isRequestValid(request);
  const sm = getStatusMeta(isV ? request.status : "EXPIRED");
  const urg = request.urgency || "Routine";
  const uc = URGENCY_CONFIG[urg];
  const isEM = urg === "Emergency";

  const redeemedAvailable = Math.max(0, (request.unitsFulfilled || 0) - (request.unitsAdministered || 0));
  const canAdmin = redeemedAvailable > 0 && ["REDEEMED", "PARTIAL REDEEMED", "HOSPITAL VERIFIED", "PARTIALLY ADMINISTERED"].includes(request.status);

  const barColor = pct > 50 ? "#10B981" : pct > 20 ? "#F59E0B" : "#EF4444";

  return (
    <div
      className={`hd-active-req-card ${isEM ? "emergency-ring" : ""}`}
      style={{ animationDelay: "var(--delay, 0s)" }}
    >
      {/* Urgency accent strip */}
      <div
        style={{
          height: "3px",
          background: isEM
            ? "linear-gradient(90deg, #DC2626, #EF4444)"
            : urg === "Urgent"
              ? "linear-gradient(90deg, #EA580C, #F97316)"
              : "linear-gradient(90deg, #059669, #10B981)",
        }}
      />

      <div style={{ padding: "14px 16px" }}>
        {/* Row 1: Name + Blood Group + Status */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
          {/* Avatar / urgency icon */}
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: uc.bg,
              border: `1.5px solid ${uc.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.1rem",
              flexShrink: 0,
            }}
          >
            {isEM ? "🚨" : urg === "Urgent" ? "⚡" : "📋"}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span
                style={{
                  fontFamily: "var(--f-display)",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  color: "var(--c-text)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "140px",
                }}
              >
                {request.patientName}
              </span>
              {request.age && (
                <span style={{ fontSize: "0.68rem", color: "var(--c-text-4)" }}>
                  {request.age}y
                </span>
              )}
              {/* Blood group pill */}
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
                {request.bloodGroup}
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

            {/* Sub info */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "4px",
                flexWrap: "wrap",
              }}
            >
              <span className="hd-mono-pill">{request.rtid}</span>
              <span style={{ fontSize: "0.68rem", color: "var(--c-text-4)" }}>
                {request.componentType || "Whole Blood"} × {request.unitsRequired}u
              </span>
              {request.wardDepartment && (
                <span style={{ fontSize: "0.68rem", color: "var(--c-text-4)" }}>
                  • {request.wardDepartment}
                </span>
              )}
            </div>
          </div>

          {/* Status badge */}
          <div style={{ flexShrink: 0, textAlign: "right" }}>
            <span
              className="hd-status"
              style={{ background: sm.bg, color: sm.text, border: `1px solid ${sm.border}` }}
            >
              {sm.label}
            </span>
            {request.unitsFulfilled > 0 && (
              <div
                style={{
                  fontSize: "0.62rem",
                  color: "var(--c-text-4)",
                  marginTop: "4px",
                  textAlign: "right",
                }}
              >
                {request.unitsFulfilled}/{request.unitsRequired} fulfilled
              </div>
            )}
          </div>
        </div>

        {/* Validity bar */}
        <div style={{ marginTop: "10px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "4px",
            }}
          >
            <span style={{ fontSize: "0.62rem", color: "var(--c-text-4)" }}>
              Validity
            </span>
            <span
              style={{
                fontSize: "0.62rem",
                fontWeight: 600,
                color: isV ? barColor : "#EF4444",
              }}
            >
              {rem}
            </span>
          </div>
          <div className="hd-validity">
            <div
              className="hd-validity-fill"
              style={{ width: `${pct}%`, background: barColor }}
            />
          </div>
        </div>

        {/* Fulfillment progress if units partially fulfilled */}
        {request.unitsRequired > 1 && request.unitsAdministered > 0 && (
          <div style={{ marginTop: "6px" }}>
            <div className="hd-prog">
              <div
                className="hd-prog-fill"
                style={{
                  width: `${(request.unitsAdministered / request.unitsRequired) * 100}%`,
                  background: "linear-gradient(90deg, #2563EB, #60A5FA)",
                }}
              />
            </div>
          </div>
        )}

        {/* Actions row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginTop: "10px",
            paddingTop: "10px",
            borderTop: "1px solid var(--c-border)",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => onWhatsAppShare(request)}
            className="hd-share-wa"
          >
            💬 Share
          </button>
          <button
            onClick={() => onPrint(request)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              borderRadius: "var(--r-sm)",
              background: "var(--c-surface-2)",
              border: "1px solid var(--c-border)",
              color: "var(--c-text-3)",
              fontSize: "0.67rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all var(--t-fast)",
              fontFamily: "var(--f-body)",
            }}
          >
            🖨️ Print
          </button>
          {canAdmin && (
            <button
              onClick={() => onMarkComplete(request)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 12px",
                borderRadius: "var(--r-sm)",
                background: "var(--c-info-bg)",
                border: `1px solid var(--c-info-bdr)`,
                color: "var(--c-info)",
                fontSize: "0.7rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all var(--t-fast)",
                fontFamily: "var(--f-body)",
                marginLeft: "auto",
              }}
            >
              <HeartHandshake size={12} />
              {request.unitsAdministered > 0 ? "Record More" : "Mark Administered"}
            </button>
          )}
          {/* Created time */}
          <span
            style={{
              fontSize: "0.62rem",
              color: "var(--c-text-4)",
              marginLeft: canAdmin ? "0" : "auto",
            }}
          >
            {timeAgo(request.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
export function PremiumDashboard({
  requests,
  hospitalData,
  kpis,
  onNewRequest,
  onViewQR,
  onDelete,
  onPrint,
  onMarkComplete,
  onWhatsAppShare,
  onExportCSV,
}: PremiumDashboardProps) {
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  /* ── Active requests: all non-CLOSED, non-CANCELLED, non-EXPIRED ── */
  const activeRequests = useMemo(
    () =>
      requests
        .filter(
          (r) =>
            !["CLOSED", "CANCELLED", "EXPIRED", "ADMINISTERED"].includes(r.status) &&
            isRequestValid(r)
        )
        .sort((a, b) => {
          // Emergency first, then by created date
          const urgScore = { Emergency: 0, Urgent: 1, Routine: 2 };
          const as = urgScore[a.urgency || "Routine"] ?? 2;
          const bs = urgScore[b.urgency || "Routine"] ?? 2;
          if (as !== bs) return as - bs;
          return b.createdAt.getTime() - a.createdAt.getTime();
        }),
    [requests]
  );

  const emergencyCount = activeRequests.filter(
    (r) => r.urgency === "Emergency"
  ).length;

  /* ── Recent 5 for overview ── */
  const recentReqs = useMemo(
    () =>
      [...requests]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5),
    [requests]
  );

  /* ── Blood group distribution ── */
  const bg_dist = useMemo(
    () =>
      BLOOD_GROUPS.reduce((acc: Record<string, number>, bg: string) => {
        acc[bg] = requests.filter(
          (r) => r.bloodGroup === bg && !["CANCELLED", "EXPIRED"].includes(r.status)
        ).length;
        return acc;
      }, {}),
    [requests]
  );
  const maxBgCount = Math.max(...(Object.values(bg_dist) as number[]), 1);

  /* ── KPIs ── */
  const kpiCards = [
    { label: "Total Requests", val: kpis.totalRequests, cls: "k-red", icon: "📋" },
    { label: "Active", val: kpis.activeRequests, cls: "k-amber", icon: "⏳" },
    { label: "Units Required", val: kpis.totalUnits, cls: "k-blue", icon: "🩸" },
    { label: "Fulfilled", val: kpis.requestsRedeemed, cls: "k-green", icon: "✅" },
    { label: "Administered", val: kpis.administered, cls: "k-purple", icon: "💉" },
  ];

  const fulfillRate =
    kpis.totalRequests > 0
      ? Math.round((kpis.requestsRedeemed / kpis.totalRequests) * 100)
      : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* ── Emergency Banner ── */}
      {emergencyCount > 0 && (
        <div
          className="hd-alert danger hd-enter"
          style={{ gap: "14px", padding: "14px 18px", borderRadius: "var(--r-xl)", border: "1px solid" }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "var(--r-lg)",
              background: "rgba(220,38,38,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.3rem",
              flexShrink: 0,
              animation: "hd-emergency-pulse 1.5s ease-in-out infinite",
            }}
          >
            🚨
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, color: "var(--c-danger)", fontSize: "0.85rem", fontFamily: "var(--f-display)" }}>
              Emergency Blood Request Active
            </p>
            <p style={{ fontSize: "0.73rem", color: "#DC2626", marginTop: "2px", opacity: 0.8 }}>
              {emergencyCount} emergency request{emergencyCount > 1 ? "s" : ""} require
              immediate action
            </p>
          </div>
          <button
            onClick={() => onNewRequest("Emergency")}
            style={{
              padding: "7px 14px",
              borderRadius: "var(--r-md)",
              background: "#DC2626",
              color: "#fff",
              border: "none",
              fontSize: "0.73rem",
              fontWeight: 700,
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontFamily: "var(--f-body)",
            }}
          >
            + Emergency
          </button>
        </div>
      )}

      {/* ── Welcome Banner ── */}
      <div className="hd-welcome hd-enter">
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.55)", fontWeight: 500 }}>
                {greeting} 👋
              </p>
              <h2 className="hd-welcome-title" style={{ marginTop: "4px" }}>
                {(hospitalData?.fullName || "Hospital").toUpperCase()}
              </h2>
              <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", marginTop: "4px" }}>
                {dateStr}
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginTop: "14px",
                }}
              >
                {activeRequests.length > 0 && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "rgba(255,255,255,0.15)",
                      color: "rgba(255,255,255,0.9)",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      padding: "5px 12px",
                      borderRadius: "var(--r-pill)",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  >
                    <Clock size={11} />
                    {activeRequests.length} active request
                    {activeRequests.length > 1 ? "s" : ""}
                  </span>
                )}
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "0.72rem",
                    padding: "5px 12px",
                    borderRadius: "var(--r-pill)",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  <MapPin size={11} />
                  {hospitalData?.district || "…"}, {hospitalData?.pincode || "…"}
                </span>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                alignItems: "flex-start",
                position: "relative",
                zIndex: 10,
              }}
            >
              <button
                onClick={() => onNewRequest("Emergency")}
                className="hd-welcome-emg-btn"
              >
                <Siren size={14} /> Emergency
              </button>
              <button
                onClick={() => onNewRequest("Routine")}
                className="hd-welcome-new-btn"
              >
                <Plus size={14} /> New Request
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div>
        <div className="hd-sec-hdr">
          <span className="hd-sec-title">
            <BarChart2 size={16} style={{ color: "var(--c-brand)" }} />
            Overview
          </span>
          <span style={{ fontSize: "0.72rem", color: "var(--c-text-4)" }}>
            {requests.length} total records
          </span>
        </div>
        <div className="hd-kpi-grid">
          {kpiCards.map((k, i) => (
            <div
              key={k.label}
              className={`hd-kpi ${k.cls} hd-enter hd-s${i + 1}`}
            >
              <span className="hd-kpi-icon">{k.icon}</span>
              <div className="hd-kpi-val">{k.val.toLocaleString()}</div>
              <div className="hd-kpi-lbl">{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ACTIVE REQUESTS SECTION ── */}
      <div>
        <div className="hd-sec-hdr">
          <span className="hd-sec-title">
            <Activity size={16} style={{ color: "var(--c-brand)" }} />
            Active Requests
            {activeRequests.length > 0 && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: "20px",
                  height: "20px",
                  borderRadius: "var(--r-pill)",
                  background: "var(--c-brand)",
                  color: "#fff",
                  fontSize: "0.65rem",
                  fontWeight: 800,
                  padding: "0 6px",
                }}
              >
                {activeRequests.length}
              </span>
            )}
          </span>
          {emergencyCount > 0 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "#DC2626",
                background: "var(--c-danger-bg)",
                padding: "4px 10px",
                borderRadius: "var(--r-pill)",
                border: "1px solid var(--c-danger-bdr)",
                animation: "hd-emergency-pulse 1.5s ease-in-out infinite",
              }}
            >
              <Flame size={11} /> {emergencyCount} Emergency
            </span>
          )}
        </div>

        {activeRequests.length === 0 ? (
          <div className="hd-card">
            <div className="hd-empty">
              <div className="hd-empty-icon">✅</div>
              <p className="hd-empty-title">No active requests</p>
              <p className="hd-empty-sub">All requests are fulfilled or closed</p>
              <button
                onClick={() => onNewRequest("Routine")}
                style={{
                  marginTop: "16px",
                  padding: "8px 18px",
                  borderRadius: "var(--r-md)",
                  background: "var(--c-brand)",
                  color: "#fff",
                  border: "none",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "var(--f-body)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Plus size={14} /> Create Request
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "12px",
            }}
          >
            {activeRequests.map((r, i) => (
              <div
                key={r.id}
                className="hd-enter"
                style={{ "--delay": `${i * 0.05}s` } as any}
              >
                <ActiveRequestCard
                  request={r}
                  onMarkComplete={onMarkComplete}
                  onWhatsAppShare={onWhatsAppShare}
                  onPrint={onPrint}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 3-col layout: Fulfillment + Recent + Sidebar ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "20px",
        }}
        className="lg-grid-3"
      >
        {/* Left 2 cols */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Fulfillment Chart Card */}
          <div className="hd-card hd-enter hd-s2" style={{ padding: "20px" }}>
            <div className="hd-sec-hdr" style={{ marginBottom: "18px" }}>
              <span className="hd-sec-title">
                <TrendingUp size={15} style={{ color: "#059669" }} />
                Request Fulfillment
              </span>
              <span
                style={{
                  fontFamily: "var(--f-display)",
                  fontWeight: 800,
                  fontSize: "1.1rem",
                  color: "var(--c-brand)",
                }}
              >
                {fulfillRate}%
              </span>
            </div>

            {/* Arc progress */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "24px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "80px",
                  height: "80px",
                  flexShrink: 0,
                }}
              >
                <svg viewBox="0 0 36 36" style={{ width: "80px", height: "80px", transform: "rotate(-90deg)" }}>
                  <circle
                    cx="18" cy="18" r="15.9"
                    fill="none"
                    stroke="var(--c-surface-3)"
                    strokeWidth="3.5"
                  />
                  <circle
                    cx="18" cy="18" r="15.9"
                    fill="none"
                    stroke="var(--c-brand)"
                    strokeWidth="3.5"
                    strokeDasharray={`${fulfillRate} 100`}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dasharray 0.8s ease" }}
                  />
                </svg>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--f-display)",
                      fontWeight: 800,
                      fontSize: "0.9rem",
                      color: "var(--c-brand)",
                    }}
                  >
                    {fulfillRate}%
                  </span>
                </div>
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { label: "Administered", val: kpis.administered, color: "#2563EB" },
                  { label: "Redeemed", val: kpis.requestsRedeemed, color: "#059669" },
                  { label: "Active", val: kpis.activeRequests, color: "#D97706" },
                ].map((s) => (
                  <div key={s.label}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.72rem",
                        marginBottom: "4px",
                      }}
                    >
                      <span style={{ color: "var(--c-text-3)", fontWeight: 500 }}>
                        {s.label}
                      </span>
                      <span style={{ fontWeight: 700, color: "var(--c-text)" }}>
                        {s.val}
                      </span>
                    </div>
                    <div className="hd-prog">
                      <div
                        className="hd-prog-fill"
                        style={{
                          width: `${kpis.totalRequests > 0 ? (s.val / kpis.totalRequests) * 100 : 0}%`,
                          background: s.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Requests */}
          <div className="hd-card hd-enter hd-s3" style={{ overflow: "hidden" }}>
            <div
              style={{
                padding: "16px 18px",
                borderBottom: "1px solid var(--c-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span className="hd-sec-title">
                <ClipboardList size={15} style={{ color: "var(--c-brand)" }} />
                Recent Requests
              </span>
              <span style={{ fontSize: "0.7rem", color: "var(--c-text-4)" }}>
                {requests.length} total
              </span>
            </div>

            {recentReqs.length === 0 ? (
              <div className="hd-empty">
                <div className="hd-empty-icon">📋</div>
                <p className="hd-empty-title">No requests yet</p>
                <p className="hd-empty-sub">
                  <button
                    onClick={() => onNewRequest("Routine")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--c-brand)",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      fontFamily: "var(--f-body)",
                    }}
                  >
                    Create first request →
                  </button>
                </p>
              </div>
            ) : (
              <div>
                {recentReqs.map((r, i) => {
                  const sm = getStatusMeta(isRequestValid(r) ? r.status : "EXPIRED");
                  const uc2 = URGENCY_CONFIG[r.urgency || "Routine"];
                  const rem = getTimeRemaining(r);
                  const pct = getValidityPct(r);
                  const barC = pct > 50 ? "#10B981" : pct > 20 ? "#F59E0B" : "#EF4444";

                  return (
                    <div
                      key={r.id}
                      className="hd-act-item"
                      style={{
                        borderBottom: i < recentReqs.length - 1 ? "1px solid var(--c-border)" : "none",
                        animationDelay: `${i * 0.06}s`,
                      }}
                    >
                      <div
                        style={{
                          width: "34px",
                          height: "34px",
                          borderRadius: "10px",
                          background: uc2.bg,
                          border: `1.5px solid ${uc2.border}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1rem",
                          flexShrink: 0,
                        }}
                      >
                        {r.urgency === "Emergency" ? "🚨" : r.urgency === "Urgent" ? "⚡" : "📋"}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: "0.82rem",
                              fontWeight: 650,
                              color: "var(--c-text)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "120px",
                            }}
                          >
                            {r.patientName}
                          </span>
                          <span
                            style={{
                              fontFamily: "var(--f-display)",
                              fontWeight: 800,
                              fontSize: "0.65rem",
                              padding: "1px 7px",
                              borderRadius: "var(--r-pill)",
                              background: "var(--c-brand-soft)",
                              color: "var(--c-brand)",
                            }}
                          >
                            {r.bloodGroup}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            marginTop: "3px",
                          }}
                        >
                          <div className="hd-validity" style={{ flex: 1 }}>
                            <div
                              className="hd-validity-fill"
                              style={{ width: `${pct}%`, background: barC }}
                            />
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          flexShrink: 0,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: "4px",
                        }}
                      >
                        <span
                          className="hd-status"
                          style={{
                            background: sm.bg,
                            color: sm.text,
                            border: `1px solid ${sm.border}`,
                          }}
                        >
                          {sm.label}
                        </span>
                        <span style={{ fontSize: "0.62rem", color: "var(--c-text-4)" }}>
                          {rem}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Blood Group Demand */}
          <div className="hd-card hd-enter hd-s2" style={{ padding: "20px" }}>
            <div className="hd-sec-hdr" style={{ marginBottom: "16px" }}>
              <span className="hd-sec-title">
                <Droplet size={15} style={{ color: "var(--c-brand)", fill: "var(--c-brand)" }} />
                Blood Group Demand
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {BLOOD_GROUPS.filter((bg: string) => bg_dist[bg] > 0)
                .sort((a: string, b: string) => (bg_dist[b] || 0) - (bg_dist[a] || 0))
                .map((bg: string) => (
                  <div
                    key={bg}
                    style={{ display: "flex", alignItems: "center", gap: "8px" }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--f-display)",
                        fontWeight: 800,
                        fontSize: "0.7rem",
                        color: "var(--c-brand)",
                        background: "var(--c-brand-soft)",
                        border: "1px solid rgba(196,28,56,0.15)",
                        borderRadius: "var(--r-sm)",
                        padding: "2px 8px",
                        width: "38px",
                        textAlign: "center",
                      }}
                    >
                      {bg}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: "6px",
                        background: "var(--c-surface-3)",
                        borderRadius: "var(--r-pill)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${(bg_dist[bg] / maxBgCount) * 100}%`,
                          height: "100%",
                          background: "linear-gradient(90deg, var(--c-brand-deep), var(--c-brand))",
                          borderRadius: "var(--r-pill)",
                          transition: "width 0.7s ease",
                          transformOrigin: "left",
                          animation: "hd-bar-grow 0.7s ease both",
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: "var(--c-text-2)",
                        width: "16px",
                        textAlign: "right",
                      }}
                    >
                      {bg_dist[bg]}
                    </span>
                  </div>
                ))}
              {Object.values(bg_dist).every((v) => v === 0) && (
                <p style={{ fontSize: "0.75rem", color: "var(--c-text-4)", textAlign: "center", padding: "16px 0" }}>
                  No requests yet
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="hd-card hd-enter hd-s3" style={{ padding: "20px" }}>
            <div className="hd-sec-hdr" style={{ marginBottom: "14px" }}>
              <span className="hd-sec-title">
                <Zap size={15} style={{ color: "#D97706" }} />
                Quick Actions
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {[
                {
                  icon: "🚨", label: "Emergency Request",
                  sub: "Life-threatening / Critical",
                  act: () => onNewRequest("Emergency"),
                  accent: "rgba(220,38,38,0.06)",
                  hover: "rgba(220,38,38,0.1)",
                  accentDark: "rgba(220,38,38,0.12)",
                },
                {
                  icon: "⚡", label: "Urgent Request",
                  sub: "Needed within 2–4 hours",
                  act: () => onNewRequest("Urgent"),
                  accent: "rgba(234,88,12,0.06)",
                  hover: "rgba(234,88,12,0.1)",
                  accentDark: "rgba(234,88,12,0.12)",
                },
                {
                  icon: "📋", label: "Routine Request",
                  sub: "Elective / Planned",
                  act: () => onNewRequest("Routine"),
                  accent: "rgba(21,128,61,0.06)",
                  hover: "rgba(21,128,61,0.1)",
                  accentDark: "rgba(21,128,61,0.12)",
                },
                {
                  icon: "📥", label: "Export CSV",
                  sub: "Download all request data",
                  act: onExportCSV,
                  accent: "rgba(37,99,235,0.06)",
                  hover: "rgba(37,99,235,0.1)",
                  accentDark: "rgba(37,99,235,0.12)",
                },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={a.act}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 12px",
                    borderRadius: "var(--r-md)",
                    border: "1px solid var(--c-border)",
                    background: "transparent",
                    cursor: "pointer",
                    transition: "all var(--t-med)",
                    textAlign: "left",
                    fontFamily: "var(--f-body)",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = a.accent;
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--c-border-med)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "var(--s-sm)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--c-border)";
                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "var(--r-sm)",
                      background: "var(--c-surface-2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1rem",
                      flexShrink: 0,
                    }}
                  >
                    {a.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--c-text)" }}>
                      {a.label}
                    </div>
                    <div style={{ fontSize: "0.67rem", color: "var(--c-text-4)", marginTop: "1px" }}>
                      {a.sub}
                    </div>
                  </div>
                  <ArrowRight size={14} style={{ color: "var(--c-text-4)", flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}