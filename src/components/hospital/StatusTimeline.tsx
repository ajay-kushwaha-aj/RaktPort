// hospital/StatusTimeline.tsx — Horizontal status timeline with modern animation
import { formatDate, formatTime } from "./utils";
import type { BloodRequest } from "./types";

const TIMELINE_STEPS = [
  { status: "CREATED", label: "Created", emoji: "📝" },
  { status: "PENDING", label: "Pending", emoji: "⏳" },
  { status: "PLEDGED", label: "Pledged", emoji: "🤝" },
  { status: "PARTIAL", label: "Donated", emoji: "🩸" },
  { status: "REDEEMED", label: "Redeemed", emoji: "✅" },
  { status: "ADMINISTERED", label: "Administered", emoji: "💉" },
  { status: "CLOSED", label: "Closed", emoji: "🎉" },
];

const STATUS_ORDER: Record<string, number> = {
  CREATED: 0, PENDING: 1, PROCESSING: 1, PLEDGED: 2,
  PARTIAL: 3, "PARTIAL REDEEMED": 4, REDEEMED: 4,
  "HOSPITAL VERIFIED": 5, "PARTIALLY ADMINISTERED": 5,
  ADMINISTERED: 5, CLOSED: 6, EXPIRED: -1, CANCELLED: -2,
};

export function StatusTimeline({ request }: { request: BloodRequest }) {
  const currentOrder = STATUS_ORDER[request.status] ?? -1;
  const isTerminal = request.status === "EXPIRED" || request.status === "CANCELLED";

  const getTimestamp = (step: string): string | null => {
    switch (step) {
      case "CREATED": return request.createdAt ? `${formatDate(request.createdAt)} ${formatTime(request.createdAt)}` : null;
      case "REDEEMED": return request.redeemedAt ? `${formatDate(request.redeemedAt)} ${formatTime(request.redeemedAt)}` : null;
      case "ADMINISTERED":
      case "CLOSED": return request.administeredAt ? `${formatDate(request.administeredAt)} ${formatTime(request.administeredAt)}` : null;
      default: return null;
    }
  };

  return (
    <div className="py-2">
      {isTerminal && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold mb-3 ${
          request.status === "EXPIRED"
            ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
        }`}>
          {request.status === "EXPIRED" ? "⏰" : "🚫"} Request {request.status.toLowerCase()}
        </div>
      )}

      {/* Horizontal Timeline */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        <div className="flex items-start min-w-0" style={{ minWidth: "520px" }}>
          {TIMELINE_STEPS.map((step, i) => {
            const stepOrder = STATUS_ORDER[step.status] ?? i;
            const isCompleted = !isTerminal && currentOrder >= stepOrder;
            const isCurrent = !isTerminal && currentOrder === stepOrder;
            const isPast = isCompleted && !isCurrent;
            const timestamp = isCompleted ? getTimestamp(step.status) : null;

            return (
              <div key={step.status} className="flex items-start flex-1 min-w-0 relative group">
                {/* Connector line BEFORE the node (not on first) */}
                {i > 0 && (
                  <div className="absolute top-[13px] right-1/2 h-[3px] w-full -translate-x-0"
                    style={{ left: "-50%", width: "100%" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        background: isPast || isCurrent
                          ? "linear-gradient(90deg, #22c55e, #16a34a)"
                          : "var(--hd-border, #e5e7eb)",
                        width: isPast || isCurrent ? "100%" : "100%",
                        opacity: isPast || isCurrent ? 1 : 0.4,
                      }}
                    />
                  </div>
                )}
                {/* Node + Label column */}
                <div className="flex flex-col items-center w-full relative z-10">
                  {/* Circle node */}
                  <div
                    className={`w-[28px] h-[28px] rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-400 flex-shrink-0 ${
                      isCurrent
                        ? "bg-[#8B0000] text-white shadow-lg ring-[3px] ring-[#8B0000]/20 scale-110"
                        : isPast
                        ? "bg-green-500 text-white shadow-sm"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-2 border-gray-200 dark:border-gray-700"
                    }`}
                    style={isCurrent ? { animation: "pulse 2s ease-in-out infinite" } : {}}
                  >
                    {isPast ? "✓" : isCurrent ? "●" : (i + 1)}
                  </div>
                  {/* Label */}
                  <p className={`text-[10px] font-semibold mt-1.5 text-center leading-tight whitespace-nowrap ${
                    isCurrent ? "text-[#8B0000] dark:text-red-400"
                    : isPast ? "text-green-700 dark:text-green-400"
                    : "text-gray-400 dark:text-gray-600"
                  }`}>
                    {step.label}
                  </p>
                  {/* Current badge */}
                  {isCurrent && (
                    <span className="text-[8px] font-extrabold bg-[#8B0000] text-white px-1.5 py-0.5 rounded-full mt-0.5 tracking-wide animate-pulse">
                      NOW
                    </span>
                  )}
                  {/* Timestamp */}
                  {timestamp && (
                    <p className="text-[8px] text-gray-400 dark:text-gray-500 mt-0.5 text-center leading-tight whitespace-nowrap">
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
