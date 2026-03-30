// hospital/StatusTimeline.tsx — Visual status timeline for blood requests (Phase 2)
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { formatDate, formatTime } from "./utils";
import type { BloodRequest } from "./types";

const TIMELINE_STEPS = [
  { status: "CREATED", label: "Created", emoji: "📝" },
  { status: "PENDING", label: "Pending", emoji: "⏳" },
  { status: "PLEDGED", label: "Pledged", emoji: "🤝" },
  { status: "PARTIAL", label: "Partial Donated", emoji: "🩸" },
  { status: "REDEEMED", label: "Redeemed", emoji: "✅" },
  { status: "HOSPITAL VERIFIED", label: "Verified", emoji: "🏥" },
  { status: "ADMINISTERED", label: "Administered", emoji: "💉" },
  { status: "CLOSED", label: "Closed", emoji: "🎉" },
];

const STATUS_ORDER: Record<string, number> = {
  CREATED: 0, PENDING: 1, PROCESSING: 1, PLEDGED: 2,
  PARTIAL: 3, "PARTIAL REDEEMED": 4, REDEEMED: 4,
  "HOSPITAL VERIFIED": 5, "PARTIALLY ADMINISTERED": 6,
  ADMINISTERED: 6, CLOSED: 7, EXPIRED: -1, CANCELLED: -2,
};

export function StatusTimeline({ request }: { request: BloodRequest }) {
  const currentOrder = STATUS_ORDER[request.status] ?? -1;
  const isTerminal = request.status === "EXPIRED" || request.status === "CANCELLED";

  const getTimestamp = (step: string): string | null => {
    switch (step) {
      case "CREATED": return request.createdAt ? `${formatDate(request.createdAt)} ${formatTime(request.createdAt)}` : null;
      case "REDEEMED":
      case "HOSPITAL VERIFIED": return request.redeemedAt ? `${formatDate(request.redeemedAt)} ${formatTime(request.redeemedAt)}` : null;
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

      <div className="relative">
        {TIMELINE_STEPS.map((step, i) => {
          const stepOrder = STATUS_ORDER[step.status] ?? i;
          const isCompleted = !isTerminal && currentOrder >= stepOrder;
          const isCurrent = !isTerminal && currentOrder === stepOrder;
          const timestamp = isCompleted ? getTimestamp(step.status) : null;

          return (
            <div key={step.status} className="flex items-start gap-3 relative" style={{ minHeight: "36px" }}>
              {/* Line connector */}
              {i < TIMELINE_STEPS.length - 1 && (
                <div
                  className="absolute left-[11px] top-[22px] w-0.5 transition-colors duration-300"
                  style={{
                    height: "calc(100% - 10px)",
                    background: isCompleted && !isCurrent ? "#22c55e" : "var(--hd-border)",
                  }}
                />
              )}
              {/* Circle / Check */}
              <div className="relative z-10 flex-shrink-0 mt-0.5">
                {isCompleted && !isCurrent ? (
                  <CheckCircle2 className="w-[22px] h-[22px] text-green-500" />
                ) : isCurrent ? (
                  <div className="w-[22px] h-[22px] rounded-full bg-[#8B0000] flex items-center justify-center shadow-md" style={{ boxShadow: "0 0 0 3px rgba(139,0,0,0.15)" }}>
                    <Clock className="w-3 h-3 text-white" />
                  </div>
                ) : (
                  <Circle className="w-[22px] h-[22px] text-gray-300 dark:text-gray-600" />
                )}
              </div>
              {/* Label */}
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${
                    isCurrent ? "text-[#8B0000] dark:text-red-400" :
                    isCompleted ? "text-gray-800 dark:text-gray-200" :
                    "text-gray-400 dark:text-gray-600"
                  }`}>
                    {step.emoji} {step.label}
                  </span>
                  {isCurrent && (
                    <span className="text-[9px] font-bold bg-[#8B0000] text-white px-1.5 py-0.5 rounded-full">CURRENT</span>
                  )}
                </div>
                {timestamp && (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{timestamp}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
