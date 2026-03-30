// hospital/DonorPanel.tsx — Linked Donor details panel (Phase 3)
import { useMemo } from "react";
import { Users, Heart, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { formatDate, formatTime } from "./utils";
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
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
        <Users className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">No linked donors yet</p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Donors will appear here once they pledge via the RaktPort app</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-3 bg-gradient-to-r from-red-50 dark:from-red-950/30 to-white dark:to-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-[#8B0000]" />
          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Linked Donors</span>
          <span className="text-[10px] bg-[#8B0000] text-white px-1.5 py-0.5 rounded-full font-bold">{donors.length}</span>
        </div>
        <div className="flex gap-3 text-[10px] font-semibold">
          <span className="text-green-600 dark:text-green-400">{redeemedCount} redeemed</span>
          <span className="text-blue-600 dark:text-blue-400">{administeredCount} administered</span>
        </div>
      </div>

      {/* Donor list */}
      <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-[200px] overflow-y-auto">
        {donors.map((donor, i) => (
          <div key={donor.dRtid + i} className="px-3 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
            {/* Status icon */}
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${
              donor.administered
                ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                : donor.redeemed
                  ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                  : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            }`}>
              {donor.administered ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              ) : donor.redeemed ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-gray-400" />
              )}
            </div>

            {/* Donor info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{donor.name}</span>
                <span className="text-[10px] font-mono bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">{donor.dRtid}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                <span>{donor.units || 1} unit{(donor.units || 1) > 1 ? "s" : ""}</span>
                <span>·</span>
                <span>{formatDate(new Date(donor.date))}</span>
                {donor.administeredAt && (
                  <>
                    <span>·</span>
                    <span className="text-blue-500">Admin: {formatDate(new Date(donor.administeredAt))}</span>
                  </>
                )}
              </div>
            </div>

            {/* Status badge */}
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
              donor.administered
                ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                : donor.redeemed
                  ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                  : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700"
            }`}>
              {donor.administered ? "ADMINISTERED" : donor.redeemed ? "REDEEMED" : "PLEDGED"}
            </span>
          </div>
        ))}
      </div>

      {/* Summary footer */}
      <div className="p-2.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <span className="text-[10px] text-gray-400">Total donated: <strong className="text-gray-700 dark:text-gray-300">{totalDonated} units</strong></span>
        <span className="text-[10px] text-gray-400">Fulfillment: <strong className="text-[#8B0000]">{totalDonated}/{request.unitsRequired}</strong></span>
      </div>
    </div>
  );
}
