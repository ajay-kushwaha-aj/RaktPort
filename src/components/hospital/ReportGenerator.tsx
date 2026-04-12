import { useState, useRef, useEffect } from "react";
import { FileText, Download, Printer as PrinterIcon, ChevronDown, FileDown } from "lucide-react";
import { formatDate, formatTime, maskAadhaar } from "./utils";
import { getStatusMeta, URGENCY_CONFIG } from "./constants";
import type { BloodRequest } from "./types";

interface Props {
  requests: BloodRequest[];
  hospitalName: string;
  hospitalLocation: string;
  onExportCSV?: () => void;
}

function buildReportHTML(requests: BloodRequest[], hospitalName: string, hospitalLocation: string): string {
  const now = new Date();
  const activeReqs = requests.filter(r => !["CANCELLED"].includes(r.status));
  const totalUnits = activeReqs.reduce((s, r) => s + r.unitsRequired, 0);
  const fulfilledUnits = activeReqs.reduce((s, r) => s + r.unitsFulfilled, 0);
  const administeredUnits = activeReqs.reduce((s, r) => s + r.unitsAdministered, 0);
  const fulfillRate = totalUnits > 0 ? Math.round((fulfilledUnits / totalUnits) * 100) : 0;

  // Blood group summary
  const bgMap: Record<string, { req: number; ful: number; adm: number }> = {};
  activeReqs.forEach(r => {
    if (!bgMap[r.bloodGroup]) bgMap[r.bloodGroup] = { req: 0, ful: 0, adm: 0 };
    bgMap[r.bloodGroup].req += r.unitsRequired;
    bgMap[r.bloodGroup].ful += r.unitsFulfilled;
    bgMap[r.bloodGroup].adm += r.unitsAdministered;
  });

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>RaktPort Hospital Report</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',Tahoma,sans-serif;color:#1a1a1a;font-size:11px;line-height:1.5}
  .page{padding:40px;max-width:800px;margin:0 auto}
  .hdr{text-align:center;border-bottom:3px solid var(--clr-brand);padding-bottom:16px;margin-bottom:20px}
  .hdr h1{font-size:22px;color:var(--clr-brand);margin:4px 0}
  .hdr .sub{font-size:10px;color: var(--rp-text-muted)}
  .section{margin:16px 0}
  .section h2{font-size:13px;color:var(--clr-brand);border-bottom:1px solid #ddd;padding-bottom:4px;margin-bottom:8px}
  table{width:100%;border-collapse:collapse;font-size:10px}
  th{background:#f5f5f5;text-align:left;padding:6px 8px;font-weight:700;color:#555;border-bottom:2px solid #ddd;text-transform:uppercase;font-size:9px}
  td{padding:5px 8px;border-bottom:1px solid #eee}
  tr:nth-child(even){background:#fafafa}
  .kpi-row{display:flex;gap:16px;margin:12px 0}
  .kpi{flex:1;text-align:center;padding:12px;background:#fef2f2;border-radius:8px;border:1px solid #fecaca}
  .kpi .val{font-size:24px;font-weight:900;color:var(--clr-brand)}
  .kpi .lbl{font-size:9px;color: var(--rp-text-muted);text-transform:uppercase;letter-spacing:0.5px}
  .foot{text-align:center;margin-top:24px;padding-top:12px;border-top:2px solid var(--clr-brand);font-size:9px;color:#999}
  .stamp{display:inline-block;padding:4px 12px;border:2px solid var(--clr-brand);border-radius:4px;color:var(--clr-brand);font-weight:700;font-size:10px;margin-top:8px}
  @media print{.no-print{display:none!important} body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="page">
  <div class="hdr">
    <div style="font-size:10px;color:var(--clr-brand);font-weight:700;letter-spacing:2px">RAKTPORT</div>
    <h1>${hospitalName}</h1>
    <div class="sub">${hospitalLocation} · Generated: ${now.toLocaleString("en-IN")} · ${activeReqs.length} Request(s)</div>
  </div>

  <div class="section">
    <h2>📊 Summary</h2>
    <div class="kpi-row">
      <div class="kpi"><div class="val">${activeReqs.length}</div><div class="lbl">Total Requests</div></div>
      <div class="kpi"><div class="val">${totalUnits}</div><div class="lbl">Units Required</div></div>
      <div class="kpi"><div class="val">${fulfilledUnits}</div><div class="lbl">Units Fulfilled</div></div>
      <div class="kpi"><div class="val">${fulfillRate}%</div><div class="lbl">Fulfillment Rate</div></div>
    </div>
  </div>

  <div class="section">
    <h2>🩸 Blood Group Breakdown</h2>
    <table>
      <thead><tr><th>Blood Group</th><th>Required</th><th>Fulfilled</th><th>Administered</th><th>Pending</th></tr></thead>
      <tbody>
        ${Object.entries(bgMap).map(([bg, d]) => `<tr><td><strong>${bg}</strong></td><td>${d.req}u</td><td>${d.ful}u</td><td>${d.adm}u</td><td>${Math.max(0, d.req - d.ful)}u</td></tr>`).join("")}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>📋 Request Details</h2>
    <table>
      <thead><tr><th>RTID</th><th>Patient</th><th>Blood</th><th>Units</th><th>Urgency</th><th>Status</th><th>Created</th><th>Doctor</th></tr></thead>
      <tbody>
        ${activeReqs.map(r => `<tr><td style="font-family:monospace;font-size:9px">${r.rtid}</td><td>${r.patientName}${r.age ? `, ${r.age}y` : ""}</td><td><strong>${r.bloodGroup}</strong> ${r.componentType || "WB"}</td><td>${r.unitsFulfilled}/${r.unitsRequired}</td><td>${r.urgency || "Routine"}</td><td>${r.status}</td><td>${formatDate(r.createdAt)}</td><td>${r.doctorName || "—"}</td></tr>`).join("")}
      </tbody>
    </table>
  </div>

  <div class="foot">
    <div>This report is auto-generated by <strong>RaktPort Hospital Dashboard</strong></div>
    <div class="stamp">CONFIDENTIAL — FOR INTERNAL USE ONLY</div>
    <div style="margin-top:6px">© ${now.getFullYear()} RaktPort · Donate Blood Anywhere, Save Everywhere</div>
  </div>
</div></body></html>`;
}

export function ReportGenerator({ requests, hospitalName, hospitalLocation, onExportCSV }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGenerate = () => {
    const html = buildReportHTML(requests, hospitalName, hospitalLocation);
    const win = window.open("", "_blank", "width=850,height=1000");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 800);
    }
    setIsOpen(false);
  };

  const handleDownloadHTML = () => {
    const html = buildReportHTML(requests, hospitalName, hospitalLocation);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RaktPort_Report_${new Date().toLocaleDateString("en-IN").replace(/\//g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };
  
  const handleCSV = () => {
    if (onExportCSV) onExportCSV();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef} style={{ marginLeft: "auto" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hd-nav-tab"
        style={{ padding: "6px 12px", border: "1px solid var(--c-border)", borderRadius: "var(--r-md)", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", background: "var(--c-surface)", color: "var(--c-text-2)", fontSize: "0.77rem", fontWeight: 600, fontFamily: "var(--f-body)", transition: "all 0.2s" }}
      >
        <FileDown size={14} /> Export Menu
        <ChevronDown size={12} style={{ opacity: 0.6, marginLeft: "2px" }} />
      </button>

      {isOpen && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", width: "170px", background: "var(--c-surface)", border: "1px solid var(--c-border)", borderRadius: "var(--r-md)", boxShadow: "var(--s-md)", zIndex: 60, padding: "4px" }}>
          <button
            onClick={handleGenerate}
            style={{ width: "100%", textAlign: "left", padding: "8px 10px", display: "flex", alignItems: "center", gap: "8px", background: "transparent", border: "none", color: "var(--c-text-2)", fontSize: "0.75rem", cursor: "pointer", borderRadius: "var(--r-sm)", fontFamily: "var(--f-body)" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--c-surface-2)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <PrinterIcon size={14} /> Print HTML
          </button>
          
          <button
            onClick={handleDownloadHTML}
            style={{ width: "100%", textAlign: "left", padding: "8px 10px", display: "flex", alignItems: "center", gap: "8px", background: "transparent", border: "none", color: "var(--c-text-2)", fontSize: "0.75rem", cursor: "pointer", borderRadius: "var(--r-sm)", fontFamily: "var(--f-body)" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--c-surface-2)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <Download size={14} /> Download HTML
          </button>
          
          {onExportCSV && (
            <button
              onClick={handleCSV}
              style={{ width: "100%", textAlign: "left", padding: "8px 10px", display: "flex", alignItems: "center", gap: "8px", background: "transparent", border: "none", color: "var(--c-success)", fontWeight: 600, fontSize: "0.75rem", cursor: "pointer", borderRadius: "var(--r-sm)", fontFamily: "var(--f-body)", borderTop: "1px solid var(--c-border)", marginTop: "2px", paddingTop: "6px" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--c-success-bg)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <FileDown size={14} /> Export CSV
            </button>
          )}
        </div>
      )}
    </div>
  );
}
