// hospital/GlobalSearch.tsx — Cross-tab search overlay (Phase 2)
import { useState, useMemo, useRef, useEffect } from "react";
import { Search, X, QrCode, User, Stethoscope, ArrowRight } from "lucide-react";
import { getStatusMeta, URGENCY_CONFIG } from "./constants";
import { isRequestValid, formatDate } from "./utils";
import type { BloodRequest } from "./types";

interface GlobalSearchProps {
  requests: BloodRequest[];
  onSelectRequest: (r: BloodRequest) => void;
  onClose: () => void;
  isOpen: boolean;
}

interface SearchResult {
  request: BloodRequest;
  matchField: string;
  matchValue: string;
}

export function GlobalSearch({ requests, onSelectRequest, onClose, isOpen }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const results: SearchResult[] = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase().trim();
    const found: SearchResult[] = [];

    requests.forEach(r => {
      // Patient name
      if (r.patientName.toLowerCase().includes(q)) {
        found.push({ request: r, matchField: "Patient", matchValue: r.patientName });
      }
      // RTID
      else if (r.rtid.toLowerCase().includes(q)) {
        found.push({ request: r, matchField: "RTID", matchValue: r.rtid });
      }
      // Serial number
      else if (r.serialNumber && r.serialNumber.toLowerCase().includes(q)) {
        found.push({ request: r, matchField: "Serial", matchValue: r.serialNumber });
      }
      // Doctor name
      else if (r.doctorName && r.doctorName.toLowerCase().includes(q)) {
        found.push({ request: r, matchField: "Doctor", matchValue: r.doctorName });
      }
      // Donor RTIDs
      else if (r.donors?.some(d => d.dRtid.toLowerCase().includes(q))) {
        const donor = r.donors!.find(d => d.dRtid.toLowerCase().includes(q))!;
        found.push({ request: r, matchField: "Donor RTID", matchValue: donor.dRtid });
      }
      // Mobile
      else if (r.patientMobile && r.patientMobile.includes(q)) {
        found.push({ request: r, matchField: "Mobile", matchValue: `***${r.patientMobile.slice(-4)}` });
      }
      // Blood group exact match
      else if (r.bloodGroup.toLowerCase() === q) {
        found.push({ request: r, matchField: "Blood Group", matchValue: r.bloodGroup });
      }
    });

    return found.slice(0, 15);
  }, [requests, query]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 dark:bg-black/50 z-50 backdrop-blur-sm" onClick={onClose} />

      {/* Search panel */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-[10vh]">
        <div className="w-full max-w-xl mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hd-enter-sm" style={{ maxHeight: "70vh" }}>
          {/* Search input */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800">
            <Search className="w-5 h-5 text-[var(--clr-brand)] flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              className="flex-1 bg-transparent outline-none text-sm text-gray-800 dark:text-gray-200 font-medium placeholder:text-gray-400"
              placeholder="Search patients, RTIDs, serial numbers, doctors…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button onClick={onClose} className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center">
              <X className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Results */}
          <div className="overflow-y-auto" style={{ maxHeight: "55vh" }}>
            {query.length < 2 ? (
              <div className="p-8 text-center">
                <Search className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-400 dark:text-gray-500">Type at least 2 characters to search</p>
                <p className="text-[11px] text-gray-300 dark:text-gray-600 mt-1">Search across patients, RTIDs, serial numbers, doctors, and donors</p>
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl opacity-20 mb-2">🔍</div>
                <p className="text-sm text-gray-400 dark:text-gray-500">No results for "{query}"</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {results.map((result, i) => {
                  const r = result.request;
                  const sm = getStatusMeta(isRequestValid(r) ? r.status : "EXPIRED");
                  const uc = URGENCY_CONFIG[r.urgency || "Routine"];
                  return (
                    <button
                      key={`${r.id}-${i}`}
                      className="w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-start gap-3 text-left group"
                      onClick={() => { onSelectRequest(r); onClose(); }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 border" style={{ background: uc.bg, borderColor: uc.border }}>
                        {uc.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{r.patientName}</span>
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-[var(--clr-emergency)] border border-red-100 dark:border-red-800">{r.bloodGroup}</span>
                          <span className="hd-status border text-[10px]" style={{ background: sm.bg, color: sm.text, borderColor: sm.border }}>{sm.label}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                          <span className="font-mono">{r.rtid}</span>
                          <span>·</span>
                          <span className="font-semibold text-[var(--clr-brand)] dark:text-[var(--clr-emergency)]">Matched: {result.matchField}</span>
                          <span className="text-gray-500 truncate">({result.matchValue})</span>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 mt-1.5 transition-transform group-hover:translate-x-1 flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">Press Esc to close · Click result to view in Requests tab</p>
          </div>
        </div>
      </div>
    </>
  );
}
