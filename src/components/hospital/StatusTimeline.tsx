// hospital/StatusTimeline.tsx — v5.0
// All original status/order logic preserved. Visual upgrade only.
import { formatDate, formatTime } from "./utils";
import type { BloodRequest } from "./types";

const TIMELINE_STEPS = [
  { status: "CREATED", label: "Created" },
  { status: "PENDING", label: "Pending" },
  { status: "PLEDGED", label: "Pledged" },
  { status: "PARTIAL", label: "Donated" },
  { status: "REDEEMED", label: "Redeemed" },
  { status: "ADMINISTERED", label: "Administered" },
  { status: "CLOSED", label: "Closed" },
];

// Original STATUS_ORDER preserved exactly
const STATUS_ORDER: Record<string, number> = {
  CREATED: 0, PENDING: 1, PROCESSING: 1, PLEDGED: 2,
  PARTIAL: 3, "PARTIAL REDEEMED": 4, REDEEMED: 4,
  "HOSPITAL VERIFIED": 5, "PARTIALLY ADMINISTERED": 5,
  ADMINISTERED: 5, CLOSED: 6, EXPIRED: -1, CANCELLED: -2,
};

export function StatusTimeline({ request }: { request: BloodRequest }) {
  const currentOrder = STATUS_ORDER[request.status] ?? -1;
  const isTerminal = request.status === "EXPIRED" || request.status === "CANCELLED";

  // Original timestamp logic preserved
  const getTimestamp = (step: string): string | null => {
    switch (step) {
      case "CREATED":
        return request.createdAt
          ? `${formatDate(request.createdAt)} ${formatTime(request.createdAt)}`
          : null;
      case "REDEEMED":
        return request.redeemedAt
          ? `${formatDate(request.redeemedAt)} ${formatTime(request.redeemedAt)}`
          : null;
      case "ADMINISTERED":
      case "CLOSED":
        return request.administeredAt
          ? `${formatDate(request.administeredAt)} ${formatTime(request.administeredAt)}`
          : null;
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: "4px 0" }}>

      {/* Terminal badge */}
      {isTerminal && (
        <div
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "6px 12px", borderRadius: "var(--r-sm)", marginBottom: "10px",
            fontSize: "0.71rem", fontWeight: 700,
            background:
              request.status === "EXPIRED"
                ? "var(--c-danger-bg)"
                : "var(--c-surface-2)",
            border: `1px solid ${request.status === "EXPIRED"
              ? "var(--c-danger-bdr)"
              : "var(--c-border)"
              }`,
            color:
              request.status === "EXPIRED"
                ? "var(--c-danger)"
                : "var(--c-text-3)",
          }}
        >
          {request.status === "EXPIRED" ? "⏰" : "🚫"} Request{" "}
          {request.status.toLowerCase()}
        </div>
      )}

      {/* Scrollable timeline */}
      <div style={{ overflowX: "auto", paddingBottom: "4px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", minWidth: "520px" }}>
          {TIMELINE_STEPS.map((step, i) => {
            const stepOrder = STATUS_ORDER[step.status] ?? i;
            const isCompleted = !isTerminal && currentOrder >= stepOrder;
            const isCurrent = !isTerminal && currentOrder === stepOrder;
            const isPast = isCompleted && !isCurrent;
            const timestamp = isCompleted ? getTimestamp(step.status) : null;

            return (
              <div
                key={step.status}
                style={{
                  display: "flex", alignItems: "flex-start",
                  flex: 1, minWidth: 0, position: "relative",
                }}
              >
                {/* Connector line between nodes */}
                {i > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "13px",
                      left: "-50%",
                      width: "100%",
                      height: "2px",
                      zIndex: 0,
                      background:
                        isPast || isCurrent
                          ? "linear-gradient(90deg,#10B981,#059669)"
                          : "var(--c-surface-3)",
                      transition: "background 0.4s ease",
                    }}
                  />
                )}

                {/* Node + label */}
                <div
                  style={{
                    display: "flex", flexDirection: "column",
                    alignItems: "center", width: "100%",
                    position: "relative", zIndex: 1,
                  }}
                >
                  {/* Circle node */}
                  <div
                    style={{
                      width: "26px", height: "26px",
                      borderRadius: "50%", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "0.64rem", fontWeight: 700,
                      transition: "all 0.3s ease",
                      background: isCurrent
                        ? "var(--c-brand)"
                        : isPast
                          ? "#10B981"
                          : "var(--c-surface-3)",
                      color: isCurrent || isPast ? "#fff" : "var(--c-text-4)",
                      border: isCurrent
                        ? "2px solid var(--c-brand)"
                        : "2px solid transparent",
                      boxShadow: isCurrent
                        ? "0 0 0 3px var(--c-brand-glow)"
                        : "none",
                      transform: isCurrent ? "scale(1.12)" : "scale(1)",
                    }}
                  >
                    {isPast ? "✓" : isCurrent ? "●" : i + 1}
                  </div>

                  {/* Label */}
                  <p
                    style={{
                      fontSize: "0.6rem", fontWeight: 600,
                      marginTop: "5px", textAlign: "center",
                      whiteSpace: "nowrap", lineHeight: 1.2,
                      color: isCurrent
                        ? "var(--c-brand)"
                        : isPast
                          ? "#059669"
                          : "var(--c-text-4)",
                    }}
                  >
                    {step.label}
                  </p>

                  {/* NOW badge */}
                  {isCurrent && (
                    <span
                      style={{
                        fontSize: "0.52rem", fontWeight: 800,
                        background: "var(--c-brand)", color: "#fff",
                        padding: "1px 5px", borderRadius: "var(--r-pill)",
                        marginTop: "3px", letterSpacing: "0.06em",
                        animation: "hd-pulse-em 1.5s ease-in-out infinite",
                      }}
                    >
                      NOW
                    </span>
                  )}

                  {/* Timestamp below node */}
                  {timestamp && (
                    <p
                      style={{
                        fontSize: "0.54rem", color: "var(--c-text-4)",
                        marginTop: "3px", textAlign: "center",
                        whiteSpace: "nowrap", lineHeight: 1.3,
                      }}
                    >
                      {timestamp}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}