// hospital/InventoryView.tsx — Blood Inventory tab (Phase 2)
import { useState, useMemo } from "react";
import { Droplet, Package, AlertTriangle, TrendingUp, Filter } from "lucide-react";
// @ts-ignore
import { BLOOD_GROUPS } from "@/lib/bloodbank-utils";
import { BLOOD_COMPONENT_TYPES } from "./constants";
import type { BloodRequest, BloodComponentType } from "./types";

interface InventoryViewProps {
  requests: BloodRequest[];
}

interface InventoryItem {
  bloodGroup: string;
  totalRequired: number;
  totalFulfilled: number;
  totalAdministered: number;
  available: number; // fulfilled - administered
  pending: number;   // required - fulfilled (outstanding demand)
  activeRequests: number;
}

export function InventoryView({ requests }: InventoryViewProps) {
  const [componentFilter, setComponentFilter] = useState<string>("All");

  const activeRequests = useMemo(() =>
    requests.filter(r => !["CANCELLED", "EXPIRED"].includes(r.status)),
    [requests]
  );

  const filtered = useMemo(() =>
    componentFilter === "All"
      ? activeRequests
      : activeRequests.filter(r => (r.componentType || "Whole Blood") === componentFilter),
    [activeRequests, componentFilter]
  );

  const inventory: InventoryItem[] = useMemo(() => {
    return BLOOD_GROUPS.map((bg: string) => {
      const bgReqs = filtered.filter(r => r.bloodGroup === bg);
      const totalRequired = bgReqs.reduce((s, r) => s + r.unitsRequired, 0);
      const totalFulfilled = bgReqs.reduce((s, r) => s + (r.unitsFulfilled || 0), 0);
      const totalAdministered = bgReqs.reduce((s, r) => s + (r.unitsAdministered || 0), 0);
      const available = Math.max(0, totalFulfilled - totalAdministered);
      const pending = Math.max(0, totalRequired - totalFulfilled);
      const activeCount = bgReqs.filter(r => !["CLOSED", "ADMINISTERED"].includes(r.status)).length;
      return { bloodGroup: bg, totalRequired, totalFulfilled, totalAdministered, available, pending, activeRequests: activeCount };
    });
  }, [filtered]);

  const totals = useMemo(() => ({
    required: inventory.reduce((s, i) => s + i.totalRequired, 0),
    fulfilled: inventory.reduce((s, i) => s + i.totalFulfilled, 0),
    administered: inventory.reduce((s, i) => s + i.totalAdministered, 0),
    available: inventory.reduce((s, i) => s + i.available, 0),
    pending: inventory.reduce((s, i) => s + i.pending, 0),
  }), [inventory]);

  const getStockLevel = (item: InventoryItem) => {
    if (item.pending === 0 && item.activeRequests === 0) return "none";
    if (item.available >= item.pending && item.pending > 0) return "sufficient";
    if (item.available > 0) return "low";
    if (item.pending > 0) return "critical";
    return "none";
  };

  const stockColors: Record<string, { bg: string; text: string; border: string; label: string }> = {
    sufficient: { bg: "#f0fdf4", text: "#15803d", border: "#86efac", label: "Sufficient" },
    low: { bg: "#fff7ed", text: "#c2410c", border: "#fdba74", label: "Low Stock" },
    critical: { bg: "#fef2f2", text: "#b91c1c", border: "#fca5a5", label: "Critical" },
    none: { bg: "#f9fafb", text: "#6b7280", border: "#d1d5db", label: "No Demand" },
  };

  const criticalCount = inventory.filter(i => getStockLevel(i) === "critical").length;
  const lowCount = inventory.filter(i => getStockLevel(i) === "low").length;

  return (
    <div className="space-y-5 hd-enter">
      {/* Alert banner if critical */}
      {criticalCount > 0 && (
        <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3 hd-enter">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-xl flex-shrink-0">⚠️</div>
          <div className="flex-1">
            <p className="font-bold text-red-800 dark:text-red-300 text-sm">Critical Blood Shortage</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{criticalCount} blood group{criticalCount > 1 ? "s" : ""} have unfulfilled demand with zero available units</p>
          </div>
          <span className="text-xs font-bold bg-red-600 text-white px-3 py-1.5 rounded-lg animate-pulse">{criticalCount} CRITICAL</span>
        </div>
      )}

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { icon: "🩸", label: "Total Required", val: totals.required, cls: "k-red" },
          { icon: "✅", label: "Fulfilled", val: totals.fulfilled, cls: "k-green" },
          { icon: "💉", label: "Administered", val: totals.administered, cls: "k-blue" },
          { icon: "📦", label: "Available Stock", val: totals.available, cls: "k-amber" },
          { icon: "⏳", label: "Pending Demand", val: totals.pending, cls: "k-purple" },
        ].map(k => (
          <div key={k.label} className={`hd-kpi ${k.cls}`}>
            <div className="text-2xl mb-1">{k.icon}</div>
            <div className="hd-kpi-val">{k.val}</div>
            <div className="hd-kpi-lbl">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="hd-card p-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <Filter className="w-4 h-4 text-[#8B0000]" />
          <span>Component Type:</span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["All", ...BLOOD_COMPONENT_TYPES].map((ct: string) => (
            <button
              key={ct}
              onClick={() => setComponentFilter(ct)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${
                componentFilter === ct
                  ? "bg-[#8B0000] text-white border-[#8B0000] shadow"
                  : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-[#8B0000]/40"
              }`}
            >
              {ct}
            </button>
          ))}
        </div>
        {lowCount > 0 && (
          <span className="ml-auto text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
            ⚡ {lowCount} Low Stock
          </span>
        )}
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {inventory.map((item, i) => {
          const level = getStockLevel(item);
          const sc = stockColors[level];
          const maxBar = Math.max(item.totalRequired, 1);
          return (
            <div
              key={item.bloodGroup}
              className="hd-card overflow-hidden hd-enter"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              {/* Top color strip */}
              <div className="h-1.5" style={{ background: level === "critical" ? "linear-gradient(90deg,#ef4444,#b91c1c)" : level === "low" ? "linear-gradient(90deg,#f59e0b,#d97706)" : level === "sufficient" ? "linear-gradient(90deg,#22c55e,#16a34a)" : "#d1d5db" }} />
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-black text-[#8B0000] dark:text-red-400" style={{ fontFamily: "Outfit,sans-serif" }}>
                    {item.bloodGroup}
                  </span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                    style={{ background: sc.bg, color: sc.text, borderColor: sc.border }}
                  >
                    {sc.label}
                  </span>
                </div>

                {/* Mini progress bars */}
                <div className="space-y-2">
                  {[
                    { label: "Required", val: item.totalRequired, color: "#8B0000" },
                    { label: "Fulfilled", val: item.totalFulfilled, color: "#22c55e" },
                    { label: "Administered", val: item.totalAdministered, color: "#3b82f6" },
                  ].map(b => (
                    <div key={b.label}>
                      <div className="flex justify-between text-[10px] mb-0.5">
                        <span className="text-gray-500 dark:text-gray-400 font-medium">{b.label}</span>
                        <span className="font-bold text-gray-700 dark:text-gray-300">{b.val}u</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(b.val / maxBar) * 100}%`, background: b.color }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary stats */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="text-center">
                    <div className="text-xs font-black text-amber-600 dark:text-amber-400" style={{ fontFamily: "Outfit,sans-serif" }}>{item.available}</div>
                    <div className="text-[9px] text-gray-400 font-medium">Available</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-black text-red-600 dark:text-red-400" style={{ fontFamily: "Outfit,sans-serif" }}>{item.pending}</div>
                    <div className="text-[9px] text-gray-400 font-medium">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-black text-gray-600 dark:text-gray-300" style={{ fontFamily: "Outfit,sans-serif" }}>{item.activeRequests}</div>
                    <div className="text-[9px] text-gray-400 font-medium">Requests</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Component breakdown table */}
      <div className="hd-card overflow-hidden hd-enter hd-s3">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <Package className="w-4 h-4 text-[#8B0000]" />
          <span className="hd-sec-title">Component Breakdown</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left px-4 py-2.5 font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide text-[10px]">Component</th>
                <th className="text-center px-3 py-2.5 font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide text-[10px]">Requests</th>
                <th className="text-center px-3 py-2.5 font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide text-[10px]">Required</th>
                <th className="text-center px-3 py-2.5 font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide text-[10px]">Fulfilled</th>
                <th className="text-center px-3 py-2.5 font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide text-[10px]">Administered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {BLOOD_COMPONENT_TYPES.map((ct: string) => {
                const ctReqs = activeRequests.filter(r => (r.componentType || "Whole Blood") === ct);
                if (ctReqs.length === 0) return null;
                const req = ctReqs.reduce((s, r) => s + r.unitsRequired, 0);
                const ful = ctReqs.reduce((s, r) => s + (r.unitsFulfilled || 0), 0);
                const adm = ctReqs.reduce((s, r) => s + (r.unitsAdministered || 0), 0);
                return (
                  <tr key={ct} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-2.5 font-semibold text-gray-800 dark:text-gray-200">{ct}</td>
                    <td className="text-center px-3 py-2.5 text-gray-500 dark:text-gray-400">{ctReqs.length}</td>
                    <td className="text-center px-3 py-2.5 font-bold text-red-700 dark:text-red-400">{req}u</td>
                    <td className="text-center px-3 py-2.5 font-bold text-green-700 dark:text-green-400">{ful}u</td>
                    <td className="text-center px-3 py-2.5 font-bold text-blue-700 dark:text-blue-400">{adm}u</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
