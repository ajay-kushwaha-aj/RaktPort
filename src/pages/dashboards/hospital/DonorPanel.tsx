// hospital/DonorPanel.tsx — v5.0
// All original logic preserved. Visual upgrade only.
import { Users, Heart, CheckCircle2, Clock } from "lucide-react";
import { formatDate } from "./utils";
import type { BloodRequest, DonorInfo } from "./types";

interface DonorPanelProps {
  request: BloodRequest;
}

export function DonorPanel({ request }: DonorPanelProps) {
  const donors = request.donors || [];
  const totalDonated = donors.reduce((s, d) => s + (d.units || 1), 0);
  const redeemedCount = donors.filter(d => d.redeemed || d.administered).length;
  const administeredCount = donors.filter(d => d.administered).length;

  if (donors.length === 0) {
    return (
      <div
        style={{
          padding: "20px",
          background: "var(--c-surface-2)",
          borderRadius: "var(--r-lg)",
          border: "1px solid var(--c-border)",
          textAlign: "center",
        }}
      >
        <Users
          size={26}
          style={{ color: "var(--c-text-4)", margin: "0 auto 8px", display: "block" }}
        />
        <p
          style={{ fontSize: "0.77rem", fontWeight: 600, color: "var(--c-text-3)" }}
        >
          No linked donors yet
        </p>
        <p
          style={{ fontSize: "0.66rem", color: "var(--c-text-4)", marginTop: "3px" }}
        >
          Donors appear here once they pledge via the RaktPort app
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--c-surface)",
        borderRadius: "var(--r-lg)",
        border: "1px solid var(--c-border)",
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: "10px 14px",
          background: "var(--c-brand-soft)",
          borderBottom: "1px solid var(--c-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <Heart size={14} style={{ color: "var(--c-brand)" }} />
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--c-text)",
              fontFamily: "var(--f-display)",
            }}
          >
            Linked Donors
          </span>
          <span
            style={{
              fontSize: "0.62rem", fontWeight: 800,
              background: "var(--c-brand)", color: "#fff",
              padding: "1px 7px", borderRadius: "var(--r-pill)",
            }}
          >
            {donors.length}
          </span>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--c-success)" }}>
            {redeemedCount} redeemed
          </span>
          <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--c-info)" }}>
            {administeredCount} administered
          </span>
        </div>
      </div>

      {/* ── Donor list ── */}
      <div style={{ maxHeight: "200px", overflowY: "auto" }}>
        {donors.map((donor, i) => (
          <div
            key={donor.dRtid + i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "9px 14px",
              borderBottom:
                i < donors.length - 1
                  ? "1px solid var(--c-border)"
                  : "none",
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
            {/* Status icon */}
            <div
              style={{
                width: "28px", height: "28px",
                borderRadius: "var(--r-sm)", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: donor.administered
                  ? "var(--c-info-bg)"
                  : donor.redeemed
                    ? "var(--c-success-bg)"
                    : "var(--c-surface-2)",
                border: `1px solid ${donor.administered
                  ? "var(--c-info-bdr)"
                  : donor.redeemed
                    ? "var(--c-success-bdr)"
                    : "var(--c-border)"
                  }`,
              }}
            >
              {donor.administered ? (
                <CheckCircle2 size={13} style={{ color: "var(--c-info)" }} />
              ) : donor.redeemed ? (
                <CheckCircle2 size={13} style={{ color: "var(--c-success)" }} />
              ) : (
                <Clock size={13} style={{ color: "var(--c-text-4)" }} />
              )}
            </div>

            {/* Donor info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <span
                  style={{
                    fontSize: "0.75rem", fontWeight: 600,
                    color: "var(--c-text)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}
                >
                  {donor.name}
                </span>
                <span className="hd-mono-pill">{donor.dRtid}</span>
              </div>
              <div
                style={{
                  fontSize: "0.62rem", color: "var(--c-text-4)",
                  marginTop: "2px", display: "flex", alignItems: "center", gap: "5px",
                }}
              >
                <span>
                  {donor.units || 1} unit{(donor.units || 1) > 1 ? "s" : ""}
                </span>
                <span>·</span>
                <span>{formatDate(new Date(donor.date))}</span>
                {donor.administeredAt && (
                  <>
                    <span>·</span>
                    <span style={{ color: "var(--c-info)" }}>
                      Admin: {formatDate(new Date(donor.administeredAt))}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Status badge */}
            <span
              style={{
                fontSize: "0.6rem", fontWeight: 800,
                padding: "2px 8px", borderRadius: "var(--r-pill)",
                border: "1px solid",
                flexShrink: 0,
                background: donor.administered
                  ? "var(--c-info-bg)"
                  : donor.redeemed
                    ? "var(--c-success-bg)"
                    : "var(--c-surface-2)",
                borderColor: donor.administered
                  ? "var(--c-info-bdr)"
                  : donor.redeemed
                    ? "var(--c-success-bdr)"
                    : "var(--c-border)",
                color: donor.administered
                  ? "var(--c-info)"
                  : donor.redeemed
                    ? "var(--c-success)"
                    : "var(--c-text-4)",
              }}
            >
              {donor.administered
                ? "ADMINISTERED"
                : donor.redeemed
                  ? "REDEEMED"
                  : "PLEDGED"}
            </span>
          </div>
        ))}
      </div>

      {/* ── Summary footer ── */}
      <div
        style={{
          padding: "8px 14px",
          background: "var(--c-surface-2)",
          borderTop: "1px solid var(--c-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: "0.65rem", color: "var(--c-text-4)" }}>
          Total donated:{" "}
          <strong style={{ color: "var(--c-text-2)" }}>{totalDonated} units</strong>
        </span>
        <span style={{ fontSize: "0.65rem", color: "var(--c-text-4)" }}>
          Fulfillment:{" "}
          <strong style={{ color: "var(--c-brand)" }}>
            {totalDonated}/{request.unitsRequired}
          </strong>
        </span>
      </div>
    </div>
  );
}