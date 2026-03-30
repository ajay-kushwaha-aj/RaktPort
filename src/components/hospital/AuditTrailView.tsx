// hospital/AuditTrailView.tsx — Audit log viewer (Phase 2)
import { useState, useEffect, useMemo } from "react";
import { Shield, Search, RefreshCw, Filter } from "lucide-react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { AUDIT_ACTION_LABELS } from "./auditLog";
import type { AuditAction, AuditEntry } from "./auditLog";

export function AuditTrailView({ hospitalId }: { hospitalId: string }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState<string>("All");

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

  const actionTypes = useMemo(() =>
    ["All", ...new Set(entries.map(e => e.action))],
    [entries]
  );

  const formatTs = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
    } catch { return ts; }
  };

  const timeAgo = (ts: string) => {
    try {
      const diff = Date.now() - new Date(ts).getTime();
      const m = Math.floor(diff / 60000);
      const h = Math.floor(diff / 3600000);
      const dy = Math.floor(diff / 86400000);
      return dy > 0 ? `${dy}d ago` : h > 0 ? `${h}h ago` : `${m}m ago`;
    } catch { return ""; }
  };

  return (
    <div className="space-y-5 hd-enter">
      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: "📋", label: "Total Actions", val: entries.length, cls: "k-blue" },
          { icon: "📝", label: "Requests Created", val: entries.filter(e => e.action === "REQUEST_CREATED").length, cls: "k-green" },
          { icon: "✏️", label: "Edits Made", val: entries.filter(e => e.action === "REQUEST_EDITED").length, cls: "k-amber" },
          { icon: "💉", label: "Administrations", val: entries.filter(e => e.action === "BLOOD_ADMINISTERED").length, cls: "k-purple" },
        ].map(k => (
          <div key={k.label} className={`hd-kpi ${k.cls}`}>
            <div className="text-2xl mb-1">{k.icon}</div>
            <div className="hd-kpi-val">{k.val}</div>
            <div className="hd-kpi-lbl">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="hd-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="hd-search" placeholder="Search audit logs…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2 items-center">
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium outline-none cursor-pointer"
            >
              {actionTypes.map(a => (
                <option key={a} value={a}>
                  {a === "All" ? "All Actions" : AUDIT_ACTION_LABELS[a as AuditAction]?.label || a}
                </option>
              ))}
            </select>
            <button onClick={fetchLogs} className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" title="Refresh">
              <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">{filtered.length} of {entries.length} entries</p>
      </div>

      {/* Log entries */}
      {loading ? (
        <div className="hd-card p-12 text-center">
          <div className="w-8 h-8 border-3 border-gray-200 dark:border-gray-700 border-t-[#8B0000] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading audit logs…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="hd-card p-12 text-center">
          <div className="text-5xl opacity-20 mb-3">🛡️</div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">No audit entries found</p>
          <p className="text-xs text-gray-400 mt-1">Actions will be logged here as you use the dashboard</p>
        </div>
      ) : (
        <div className="hd-card overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#8B0000]" />
            <span className="hd-sec-title">Activity Log</span>
            <span className="text-xs text-gray-400 ml-auto">{filtered.length} entries</span>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-[55vh] overflow-y-auto">
            {filtered.map((entry, i) => {
              const meta = AUDIT_ACTION_LABELS[entry.action as AuditAction] || { label: entry.action, emoji: "📄", color: "#6b7280" };
              return (
                <div key={entry.id || i} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors hd-enter" style={{ animationDelay: `${Math.min(i, 15) * 0.03}s` }}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: `${meta.color}15`, border: `1px solid ${meta.color}30` }}>
                      {meta.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold" style={{ color: meta.color }}>{meta.label}</span>
                        {entry.affectedRtid && (
                          <span className="text-[10px] font-mono bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded">{entry.affectedRtid}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">{entry.details}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{formatTs(entry.timestamp)} · {timeAgo(entry.timestamp)}</p>
                    </div>
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
