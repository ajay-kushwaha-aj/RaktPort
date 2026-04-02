// hospital/buildSlipHTML.ts — Blood requisition print slip HTML builder

import { URGENCY_CONFIG, SYSTEM_VERSION } from "./constants";
import { formatDate, formatTime, getTimeRemaining, isRequestValid, getQRPayload } from "./utils";
import type { BloodRequest } from "./types";

/**
 * Builds the full HTML string for a blood requisition print slip.
 * This is opened in a new window for printing.
 */
export const buildSlipHTML = (request: BloodRequest, hospital: any, logoDataUrl: string): string => {
  const uc = URGENCY_CONFIG[request.urgency || "Routine"];
  const rem = getTimeRemaining(request);
  const isV = isRequestValid(request);
  const genTime = new Date(request.createdAt).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
  });
  const rows = (pairs: [string, string][]) =>
    pairs.map(([k, v]) => `<tr><td style="color:#6b7280;width:36%;font-weight:600;padding-right:3pt;vertical-align:top">${k}:</td><td style="font-weight:700;color:#111;vertical-align:top">${v || "—"}</td></tr>`).join("");

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>RaktPort — Blood Requisition ${request.rtid}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
body{font-family:Arial,sans-serif;font-size:10.5pt;color:#111;background:#fff;}
@page{size:A4 portrait;margin:10mm 12mm;}
.page{max-width:190mm;margin:0 auto;padding:0;}.outer{border:2px solid #1a1a1a;border-radius:3px;padding:6mm 7mm;}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2.5px solid var(--clr-brand);padding-bottom:7pt;margin-bottom:8pt;gap:8pt;}
.logo-area{display:flex;align-items:center;gap:8pt;}.logo-img{width:40pt;height:40pt;object-fit:contain;border-radius:6pt;border:1pt solid #e5e7eb;}
.brand-name{font-size:17pt;font-weight:900;color:var(--clr-brand);letter-spacing:-0.5pt;line-height:1;}
.brand-sub{font-size:6.5pt;font-weight:700;text-transform:uppercase;color:#374151;letter-spacing:0.5pt;margin-top:1pt;}
.brand-gov{font-size:6pt;color:#6b7280;margin-top:1pt;}.brand-tag{font-size:6.5pt;color:var(--clr-brand);font-style:italic;margin-top:2pt;font-weight:600;}
.serial-box{text-align:right;flex-shrink:0;}.serial-lbl{font-size:6pt;color:#9ca3af;text-transform:uppercase;letter-spacing:0.8pt;}
.serial-val{font-family:monospace;font-size:9.5pt;font-weight:900;color:#111;margin-top:1pt;}.serial-dt{font-size:6pt;color:#6b7280;margin-top:1pt;}
.title{text-align:center;margin-bottom:7pt;}.title h1{font-size:13pt;font-weight:900;text-transform:uppercase;text-decoration:underline;letter-spacing:1.5pt;}
.title p{font-size:7pt;color:#6b7280;margin-top:2pt;}
.chips{display:flex;justify-content:center;gap:10pt;margin-bottom:8pt;}
.chip{padding:4pt 13pt;border-radius:4pt;font-size:9pt;font-weight:900;text-transform:uppercase;letter-spacing:0.3pt;border-width:1.5pt;border-style:solid;}
.chip-urg{background:${uc.bg};border-color:${uc.border};color:${uc.color};}
.chip-val{background:${isV ? "#f0fdf4" : "#fef2f2"};border-color:${isV ? "#86efac" : "#fca5a5"};color:${isV ? "#15803d" : "#b91c1c"};}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:12pt;margin-bottom:8pt;}
.sec-head{font-weight:800;font-size:9.5pt;text-transform:uppercase;border-left:3pt solid #ccc;padding-left:5pt;margin-bottom:4pt;color:#111;}
.sec-head.red{border-left-color:var(--clr-brand);}.sec-head.gray{border-left-color:#374151;}
table.info{width:100%;border-collapse:collapse;font-size:9pt;line-height:1.6;}
.rtid-wrap{text-align:center;margin:7pt 0;}.rtid-box{display:inline-block;border:1.5pt dashed #9ca3af;border-radius:5pt;padding:6pt 24pt;background:#f9fafb;}
.rtid-lbl{font-size:6.5pt;color:#9ca3af;text-transform:uppercase;letter-spacing:1.2pt;margin-bottom:3pt;}.rtid-code{font-family:monospace;font-size:15pt;font-weight:900;color:var(--clr-brand);letter-spacing:2pt;}
.blood-box{border:1.5pt solid #111;border-radius:5pt;background:#fafafa;margin-bottom:7pt;}.blood-grid{display:grid;grid-template-columns:repeat(4,1fr);text-align:center;}
.blood-cell{padding:5pt 3pt;border-right:1pt solid #e5e7eb;}.blood-cell:last-child{border-right:none;}
.blbl{font-size:6.5pt;text-transform:uppercase;color:#6b7280;font-weight:700;margin-bottom:2pt;letter-spacing:0.3pt;}.bval-lg{font-size:25pt;font-weight:900;color:var(--clr-brand);line-height:1;}
.bval-md{font-size:10.5pt;font-weight:800;margin-top:4pt;color:#111;}.bval-sm{font-size:8.5pt;color:#374151;margin-top:1pt;}
.naco-box{background:#fef2f2;border:1.5pt solid #fca5a5;border-radius:4pt;padding:6pt 8pt;margin-bottom:8pt;}.naco-head{font-weight:800;font-size:7.5pt;text-transform:uppercase;color:#7f1d1d;margin-bottom:3pt;}
.naco-box ul{padding-left:12pt;}.naco-box li{font-size:7.5pt;color:#991b1b;line-height:1.65;}
.footer{border-top:2pt solid #1a1a1a;padding-top:7pt;display:flex;gap:10pt;align-items:flex-start;}
.qr-col{flex-shrink:0;text-align:center;width:95pt;}.qr-lbl{font-size:6.5pt;font-weight:700;margin-top:3pt;color:#374151;}
.meta-col{flex:1;font-size:7pt;color:#374151;line-height:1.6;}.meta-head{font-weight:800;text-transform:uppercase;font-size:7.5pt;margin-bottom:2pt;color:#111;}
.sig-col{flex-shrink:0;width:115pt;text-align:center;}.sig-line{height:32pt;border-bottom:1pt solid #374151;margin-bottom:3pt;}
.sig-lbl{font-size:7.5pt;font-weight:800;text-transform:uppercase;}.sig-sub{font-size:6.5pt;color:#6b7280;}.sig-date{font-size:6pt;color:#9ca3af;margin-top:4pt;}
.indic-box{background:#eff6ff;border:1pt solid #bfdbfe;border-radius:4pt;padding:4pt 8pt;margin-bottom:6pt;font-size:9pt;}.indic-box b{color:#1e40af;}.indic-box span{color:#1d4ed8;font-weight:600;}
</style></head><body>
<div class="page"><div class="outer">
<div class="hdr"><div class="logo-area">${logoDataUrl ? `<img src="${logoDataUrl}" class="logo-img" alt="RaktPort">` : ""}<div><div class="brand-name">RaktPort</div><div class="brand-sub">National Digital Blood Donation &amp; Management System</div><div class="brand-gov">Ministry of Health &amp; Family Welfare, Government of India</div><div class="brand-tag">"Donate Blood Anywhere, Save Life Everywhere"</div></div></div><div class="serial-box"><div class="serial-lbl">Serial No.</div><div class="serial-val">${request.serialNumber || "—"}</div><div class="serial-dt">Gen: ${genTime} IST</div></div></div>
<div class="title"><h1>Blood Requisition Form</h1><p>Generated On: ${genTime} &nbsp;|&nbsp; NACO / MoHFW Compliant &nbsp;|&nbsp; ${hospital?.fullName || "Hospital"}</p></div>
<div class="chips"><div class="chip chip-urg">${uc.emoji} Urgency: ${request.urgency || "Routine"} &middot; Valid ${uc.validityHours}h</div><div class="chip chip-val">&#x23F1; Validity: ${rem}</div></div>
<div class="info-grid"><div><div class="sec-head red">Patient Information</div><table class="info"><tbody>${rows([["Name", request.patientName || "—"], ["Age", `${request.age || "N/A"} Years`], ["Mobile", request.patientMobile || "—"], ["Ward / Dept", request.wardDepartment || "—"], ["Bed No.", request.bedNumber || "—"]])}</tbody></table></div><div><div class="sec-head gray">Requesting Hospital</div><table class="info"><tbody>${rows([["Name", hospital?.fullName || "—"], ["Location", `${hospital?.district || "—"}, ${hospital?.pincode || ""}`], ["Contact", hospital?.mobile || "—"], ["Doctor", request.doctorName || "—"], ["Reg. No.", request.doctorRegNo || "—"]])}</tbody></table></div></div>
<div class="rtid-wrap"><div class="rtid-box"><div class="rtid-lbl">RTID Code &mdash; RaktPort Transfusion ID</div><div class="rtid-code">${request.rtid}</div></div></div>
<div class="blood-box"><div class="blood-grid"><div class="blood-cell"><div class="blbl">Blood Group</div><div class="bval-lg">${request.bloodGroup}</div></div><div class="blood-cell"><div class="blbl">Component Type</div><div class="bval-md">${request.componentType || "Whole Blood"}</div></div><div class="blood-cell"><div class="blbl">Units Required</div><div class="bval-lg">${request.unitsRequired}</div></div><div class="blood-cell"><div class="blbl">Required By</div><div class="bval-md">${formatDate(request.requiredBy)}</div><div class="bval-sm">${formatTime(request.requiredBy)}</div></div></div></div>
${request.transfusionIndication ? `<div class="indic-box"><b>Indication for Transfusion (NACO):</b> <span>${request.transfusionIndication}</span></div>` : ""}
<div class="naco-box"><div class="naco-head">&#x26A0; Compatibility &amp; Safety Requirements (MoHFW / NACO)</div><ul><li>Mandatory ABO-Rh typing, antibody screening &amp; cross-matching before transfusion</li><li>Emergency uncross-matched blood only if immediately life-threatening &mdash; document justification</li><li>Verify patient identity (name, age, blood group) before administration</li><li>Monitor patient for 15 min post-transfusion; report adverse reactions to regional blood bank</li><li>Informed consent mandatory for all planned transfusions (National Blood Policy 2020)</li></ul></div>
<div class="footer"><div class="qr-col"><canvas id="slip-qr" width="88" height="88"></canvas><div class="qr-lbl">Scan to Verify</div></div><div class="meta-col"><div class="meta-head">Digital Signature &amp; Metadata</div><div>Generated by: ${request.generatedBy || hospital?.fullName || "Hospital"}</div><div>System: RaktPort ${request.systemVersion || SYSTEM_VERSION}</div><div>Timestamp: ${genTime} IST</div><div style="margin-top:4pt;" class="meta-head">Disclaimer</div><div>This document is electronically generated by RaktPort. Blood must be cross-matched before transfusion. Validation subject to QR code authenticity. Requisition becomes invalid after redemption or expiry.</div></div><div class="sig-col"><div class="sig-line"></div><div class="sig-lbl">Authorized Signatory</div><div class="sig-sub">(Medical Officer / In-Charge)</div><div class="sig-date">Date: ${formatDate(new Date())}</div></div></div>
</div></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js"></script>
<script>(function(){try{new QRious({element:document.getElementById('slip-qr'),value:${JSON.stringify(getQRPayload(request))},size:88,foreground:'var(--clr-brand)',level:'H'});}catch(e){}window.addEventListener('load',function(){setTimeout(function(){window.print();setTimeout(function(){window.close();},800);},400);});})();</script>
</body></html>`;
};
