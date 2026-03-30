// hospital/styles.ts — All Hospital Dashboard CSS styles
// Now includes dark mode support via .dark class

export const HD_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

:root {
  --hd-crimson: #8B0000;
  --hd-crimson-dark: #6b0000;
  --hd-crimson-light: #fff0f0;
  --hd-crimson-mid: #b30000;
  --hd-surface: #fafaf8;
  --hd-card: #ffffff;
  --hd-border: rgba(139,0,0,0.08);
  --hd-text: #111827;
  --hd-muted: #6b7280;
  --hd-shadow-sm: 0 1px 4px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.03);
  --hd-shadow-md: 0 4px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05);
  --hd-font-display: 'Outfit', sans-serif;
  --hd-font-body: 'DM Sans', sans-serif;
}

.dark {
  --hd-surface: #0f1117;
  --hd-card: #1a1d27;
  --hd-border: rgba(255,255,255,0.08);
  --hd-text: #e5e7eb;
  --hd-muted: #9ca3af;
  --hd-shadow-sm: 0 1px 4px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04);
  --hd-shadow-md: 0 4px 16px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.2);
}

.hd-root { font-family: var(--hd-font-body); background: var(--hd-surface); min-height: 100vh; color: var(--hd-text); }

/* ── Animations ── */
@keyframes hd-fade-up   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes hd-scale-in  { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
@keyframes hd-slide-r   { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
@keyframes hd-count-up  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes hd-pulse-ring{ 0%{box-shadow:0 0 0 0 rgba(139,0,0,0.35)} 70%{box-shadow:0 0 0 8px rgba(139,0,0,0)} 100%{box-shadow:0 0 0 0 rgba(139,0,0,0)} }
@keyframes hd-bounce-dot{ 0%,100%{transform:scale(1)} 50%{transform:scale(1.35)} }
@keyframes hd-float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
@keyframes hd-shimmer   { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }

.hd-enter    { animation: hd-fade-up  0.42s cubic-bezier(0.4,0,0.2,1) both; }
.hd-enter-sm { animation: hd-scale-in 0.32s cubic-bezier(0.4,0,0.2,1) both; }
.hd-s1{animation-delay:.04s} .hd-s2{animation-delay:.08s} .hd-s3{animation-delay:.12s}
.hd-s4{animation-delay:.16s} .hd-s5{animation-delay:.20s} .hd-s6{animation-delay:.24s}

/* ── Header ── */
.hd-header {
  background: linear-gradient(135deg, #6b0000 0%, #8B0000 50%, #9e0000 100%);
  position: sticky; top: 0; z-index: 50;
  box-shadow: 0 4px 20px rgba(139,0,0,0.28);
}
.hd-header::before {
  content:''; position:absolute; inset:0; pointer-events:none;
  background: radial-gradient(ellipse at 8% 50%, rgba(255,255,255,0.07) 0%, transparent 55%),
              radial-gradient(ellipse at 92% 30%, rgba(255,255,255,0.04) 0%, transparent 40%);
}
.hd-header::after {
  content:''; position:absolute; bottom:0; left:0; right:0; height:1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
}
.hd-logo-frame {
  background:#ffffff; border:2px solid rgba(255,255,255,0.5);
  border-radius:12px; padding:4px; flex-shrink:0; transition:all 0.3s;
  box-shadow:0 2px 8px rgba(0,0,0,0.2);
}
.hd-logo-frame:hover { transform:scale(1.04) rotate(-1deg); box-shadow:0 4px 14px rgba(0,0,0,0.25); }
.hd-brand { font-family:var(--hd-font-display); font-weight:800; color:#fff; letter-spacing:-0.03em; line-height:1; }
.hd-hosp-name { font-size:0.7rem; color:rgba(255,205,185,0.9); font-weight:500; margin-top:1px; display:flex; align-items:center; gap:3px; }
.hd-loc-chip {
  background:rgba(255,255,255,0.11); border:1px solid rgba(255,255,255,0.2); border-radius:999px;
  padding:3px 10px; font-size:0.68rem; color:rgba(255,255,255,0.75); font-weight:500;
  display:flex; align-items:center; gap:4px; white-space:nowrap; transition:background 0.2s; cursor:default;
}
.hd-hdr-btn {
  width:36px; height:36px; border-radius:10px; flex-shrink:0;
  background:rgba(255,255,255,0.12); border:1.5px solid rgba(255,255,255,0.22);
  display:flex; align-items:center; justify-content:center;
  color:#fff; cursor:pointer; transition:all 0.2s; position:relative;
}
.hd-hdr-btn:hover { background:rgba(255,255,255,0.22); transform:translateY(-1px); }
.hd-notif-badge {
  position:absolute; top:-4px; right:-4px; min-width:16px; height:16px;
  background:#ff3737; border:2px solid #8B0000; border-radius:999px;
  font-size:8px; font-weight:800; color:#fff; display:flex; align-items:center; justify-content:center; padding:0 3px;
  animation: hd-bounce-dot 1.4s ease-in-out infinite;
}
.hd-emg-btn {
  display:flex; align-items:center; gap:5px;
  background:#ffffff; border:2px solid rgba(255,255,255,0.7);
  border-radius:10px; padding:6px 12px;
  color:#8B0000; font-size:0.75rem; font-weight:800;
  font-family:var(--hd-font-body); cursor:pointer; transition:all 0.2s;
  box-shadow:0 2px 8px rgba(0,0,0,0.18); white-space:nowrap; flex-shrink:0;
}
.hd-emg-btn:hover { background:#fff5f5; transform:translateY(-1px); box-shadow:0 4px 14px rgba(0,0,0,0.22); }
.hd-logout-btn {
  background:rgba(255,255,255,0.12); border:1.5px solid rgba(255,255,255,0.28);
  border-radius:10px; padding:0; width:36px; height:36px; color:#fff;
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; transition:all 0.2s; font-family:var(--hd-font-body); flex-shrink:0;
}
.hd-logout-btn:hover { background:rgba(255,80,80,0.35); border-color:rgba(255,140,120,0.5); transform:translateY(-1px); }
@media(min-width:640px){
  .hd-logout-btn { width:auto; padding:6px 12px; gap:5px; font-size:0.78rem; font-weight:600; }
  .hd-logout-text { display:inline; }
}
.hd-logout-text { display:none; }
.hd-profile-btn {
  background:rgba(255,255,255,0.12); border:1.5px solid rgba(255,255,255,0.22);
  border-radius:10px; padding:5px 10px; color:#fff; font-size:0.72rem; font-weight:600;
  display:flex; align-items:center; gap:5px; cursor:pointer; transition:all 0.2s;
  font-family:var(--hd-font-body); flex-shrink:0;
}
.hd-profile-btn:hover { background:rgba(255,255,255,0.22); transform:translateY(-1px); }

/* ── Nav ── */
.hd-nav {
  background:var(--hd-card); border-bottom:1px solid var(--hd-border);
  box-shadow:var(--hd-shadow-sm); position:sticky; top:68px; z-index:40;
}
@media(max-width:639px){ .hd-nav { top:72px; } }
.hd-nav-inner { display:flex; gap:2px; overflow-x:auto; padding:8px 16px; scrollbar-width:none; }
.hd-nav-inner::-webkit-scrollbar{display:none;}
.hd-nav-tab {
  display:flex; align-items:center; gap:6px; padding:7px 14px;
  border-radius:10px; font-size:0.78rem; font-weight:500; cursor:pointer;
  border:none; white-space:nowrap; transition:all 0.22s cubic-bezier(0.4,0,0.2,1);
  background:transparent; color:var(--hd-muted); font-family:var(--hd-font-body); flex-shrink:0;
}
.hd-nav-tab:hover:not(.hd-nav-active){background:rgba(139,0,0,0.05);color:#8B0000;}
.dark .hd-nav-tab:hover:not(.hd-nav-active){background:rgba(200,60,60,0.12);color:#ff8a8a;}
.hd-nav-active{background:linear-gradient(135deg,#8B0000,#b30000);color:#fff !important;font-weight:600;box-shadow:0 3px 10px rgba(139,0,0,0.3);transform:translateY(-1px);}

/* ── KPI ── */
.hd-kpi-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;}
@media(min-width:640px){.hd-kpi-grid{grid-template-columns:repeat(3,1fr);}}
@media(min-width:1024px){.hd-kpi-grid{grid-template-columns:repeat(5,1fr);}}
.hd-kpi{background:var(--hd-card);border-radius:16px;padding:18px 16px 14px;border:1px solid var(--hd-border);box-shadow:var(--hd-shadow-sm);transition:all 0.28s cubic-bezier(0.4,0,0.2,1);position:relative;overflow:hidden;}
.hd-kpi::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;border-radius:16px 16px 0 0;}
.hd-kpi:hover{transform:translateY(-3px);box-shadow:var(--hd-shadow-md);border-color:rgba(139,0,0,0.15);}
.hd-kpi.k-red::before{background:linear-gradient(90deg,#8B0000,#c41e3a);}
.hd-kpi.k-green::before{background:linear-gradient(90deg,#059669,#10b981);}
.hd-kpi.k-blue::before{background:linear-gradient(90deg,#0284c7,#38bdf8);}
.hd-kpi.k-amber::before{background:linear-gradient(90deg,#d97706,#fbbf24);}
.hd-kpi.k-purple::before{background:linear-gradient(90deg,#7c3aed,#a78bfa);}
.hd-kpi-val{font-family:var(--hd-font-display);font-size:1.7rem;font-weight:800;color:var(--hd-text);line-height:1;animation:hd-count-up 0.5s ease both;}
.hd-kpi-lbl{font-size:0.7rem;color:var(--hd-muted);font-weight:500;margin-top:3px;letter-spacing:0.02em;}

/* ── Welcome Banner ── */
.hd-welcome{background:linear-gradient(135deg,#6b0000 0%,#8B0000 55%,#9e0000 100%);border-radius:20px;padding:24px 28px;position:relative;overflow:hidden;margin-bottom:20px;}
.hd-welcome::before{content:'';position:absolute;right:-50px;top:-50px;width:220px;height:220px;background:radial-gradient(circle,rgba(255,255,255,0.07) 0%,transparent 65%);border-radius:50%;}
.hd-welcome::after{content:'';position:absolute;left:-30px;bottom:-50px;width:160px;height:160px;background:radial-gradient(circle,rgba(255,255,255,0.04) 0%,transparent 60%);border-radius:50%;}
.hd-welcome-title{font-family:var(--hd-font-display);font-size:1.3rem;font-weight:800;color:#fff;}
.hd-welcome-emg-btn {
  display:flex; align-items:center; gap:6px;
  background:rgba(255,255,255,0.15); border:1.5px solid rgba(255,255,255,0.45);
  border-radius:11px; padding:7px 14px; color:#fff; font-size:0.78rem; font-weight:700;
  cursor:pointer; transition:all 0.22s; font-family:var(--hd-font-body); backdrop-filter:blur(4px);
}
.hd-welcome-emg-btn:hover{background:rgba(255,255,255,0.28);border-color:rgba(255,255,255,0.7);transform:translateY(-1px);}
.hd-welcome-new-btn{
  display:flex; align-items:center; gap:6px;
  background:#ffffff; border:1.5px solid rgba(255,255,255,0.8);
  border-radius:11px; padding:7px 14px; color:#8B0000; font-size:0.78rem; font-weight:800;
  cursor:pointer; transition:all 0.22s; font-family:var(--hd-font-body); box-shadow:0 2px 8px rgba(0,0,0,0.1);
}
.hd-welcome-new-btn:hover{background:#fff;transform:translateY(-1px);box-shadow:0 4px 14px rgba(0,0,0,0.18);}

/* ── Section ── */
.hd-sec-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
.hd-sec-title{font-family:var(--hd-font-display);font-size:0.95rem;font-weight:700;color:var(--hd-text);display:flex;align-items:center;gap:7px;}
.hd-card{background:var(--hd-card);border-radius:18px;border:1px solid var(--hd-border);box-shadow:var(--hd-shadow-sm);}

/* ── Urgency chips ── */
.hd-urg{border-radius:999px;padding:3px 10px;font-size:0.68rem;font-weight:700;letter-spacing:0.03em;display:inline-flex;align-items:center;gap:4px;}
.hd-status{border-radius:999px;padding:3px 10px;font-size:0.67rem;font-weight:700;display:inline-flex;align-items:center;gap:4px;}

/* ── Urgency selector ── */
.hd-urg-selector{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
.hd-urg-opt{border-radius:12px;padding:12px 10px;border:2px solid #e5e7eb;cursor:pointer;transition:all 0.2s;text-align:center;background:var(--hd-card);}
.dark .hd-urg-opt{border-color:#374151;}
.hd-urg-opt:hover{border-color:rgba(139,0,0,0.3);}
.hd-urg-opt.sel-emergency{border-color:#ef4444;background:#fef2f2;}
.hd-urg-opt.sel-urgent{border-color:#f97316;background:#fff7ed;}
.hd-urg-opt.sel-routine{border-color:#22c55e;background:#f0fdf4;}
.dark .hd-urg-opt.sel-emergency{background:#451a1a;}
.dark .hd-urg-opt.sel-urgent{background:#3b2508;}
.dark .hd-urg-opt.sel-routine{background:#0a2e14;}
.hd-urg-emoji{font-size:1.4rem;margin-bottom:4px;}
.hd-urg-name{font-size:0.72rem;font-weight:700;}
.hd-urg-time{font-size:0.62rem;color:var(--hd-muted);margin-top:1px;}

/* ── Prog bars ── */
.hd-validity{height:4px;border-radius:999px;background:#e5e7eb;position:relative;overflow:hidden;margin-top:4px;}
.dark .hd-validity{background:#374151;}
.hd-validity-fill{height:100%;border-radius:999px;transition:width 0.6s ease;}
.hd-prog{height:6px;background:#f3f4f6;border-radius:999px;overflow:hidden;margin-top:4px;}
.dark .hd-prog{background:#374151;}
.hd-prog-fill{height:100%;background:linear-gradient(90deg,#8B0000,#c41e3a);border-radius:999px;transition:width 0.6s ease;}

/* ── Search ── */
.hd-search{background:var(--hd-card);border:1.5px solid var(--hd-border);border-radius:10px;padding:8px 12px 8px 36px;font-size:0.8rem;color:var(--hd-text);transition:all 0.2s;outline:none;width:100%;font-family:var(--hd-font-body);}
.hd-search:focus{border-color:rgba(139,0,0,0.35);background:var(--hd-card);box-shadow:0 0 0 3px rgba(139,0,0,0.08);}

/* ── FAB ── */
.hd-fab{position:fixed;bottom:80px;right:16px;z-index:48;background:linear-gradient(135deg,#8B0000,#c41e3a);color:#fff;border:none;border-radius:50px;padding:11px 18px;font-size:0.82rem;font-weight:700;font-family:var(--hd-font-body);display:flex;align-items:center;gap:7px;cursor:pointer;box-shadow:0 6px 20px rgba(139,0,0,0.4),0 2px 6px rgba(0,0,0,0.15);transition:all 0.3s cubic-bezier(0.4,0,0.2,1);animation:hd-float 3s ease-in-out infinite;}
.hd-fab:hover{transform:scale(1.05) translateY(-2px);box-shadow:0 10px 28px rgba(139,0,0,0.5);animation:none;}
@media(min-width:640px){.hd-fab{bottom:24px;right:24px;padding:12px 20px;font-size:0.85rem;}}

/* ── Form ── */
.hd-input{width:100%;padding:10px 13px;border-radius:10px;border:1.5px solid var(--hd-border);font-size:0.83rem;font-family:var(--hd-font-body);color:var(--hd-text);background:var(--hd-card);outline:none;transition:all 0.2s;}
.hd-input:focus{border-color:rgba(139,0,0,0.45);box-shadow:0 0 0 3px rgba(139,0,0,0.08);}
.hd-label{font-size:0.75rem;font-weight:600;color:var(--hd-text);display:block;margin-bottom:5px;opacity:0.85;}
.hd-required{color:#ef4444;margin-left:2px;}

/* ── Analytics mini chart ── */
.hd-bar-chart { display:flex; align-items:flex-end; gap:3px; height:48px; }
.hd-bar { border-radius:3px 3px 0 0; transition:height 0.5s ease; min-width:10px; flex:1; }

/* ── Share / action pill ── */
.hd-share-wa {
  display:inline-flex; align-items:center; gap:5px;
  background:#dcfce7; border:1.5px solid #86efac; color:#166534;
  border-radius:8px; padding:4px 10px; font-size:0.68rem; font-weight:700;
  cursor:pointer; transition:all 0.2s;
}
.dark .hd-share-wa { background:#0a2e14; border-color:#166534; color:#86efac; }
.hd-share-wa:hover { background:#bbf7d0; transform:translateY(-1px); }

/* ── Transfusion History ── */
.hd-th-row { display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid var(--hd-border); }
.hd-th-row:last-child { border-bottom:none; }
.hd-th-icon { width:36px; height:36px; border-radius:10px; background:#dbeafe; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:1rem; }
.dark .hd-th-icon { background:#1e3a5f; }
.hd-th-badge { border-radius:999px; padding:2px 8px; font-size:0.65rem; font-weight:700; display:inline-flex; align-items:center; gap:3px; }

/* ── Print overlay ── */
.hd-print-overlay {
  position:fixed; inset:0; z-index:9999; background:#fff;
  overflow-y:auto; padding:0;
}
.hd-print-overlay-inner {
  max-width:210mm; margin:0 auto; padding:8mm 10mm;
  font-family:Arial,sans-serif; font-size:10.5pt; color:#111;
}
.hd-print-overlay-actions {
  position:sticky; top:0; z-index:10; background:#1e40af;
  padding:10px 16px; display:flex; align-items:center; justify-content:space-between;
  gap:10px; box-shadow:0 2px 8px rgba(0,0,0,0.2);
}
.hd-print-overlay-btn {
  padding:8px 20px; border-radius:8px; font-size:0.82rem; font-weight:700;
  cursor:pointer; border:none; transition:all 0.2s; font-family:inherit;
}
@media print {
  .hd-print-overlay-actions { display:none !important; }
  .hd-root { display:none !important; }
  .hd-print-overlay { position:static !important; padding:0 !important; }
}

/* ── Bottom mobile nav bar ── */
.hd-bottom-nav {
  position:fixed; bottom:0; left:0; right:0; z-index:45;
  background:var(--hd-card); border-top:1px solid var(--hd-border);
  display:flex; align-items:center; justify-content:space-around;
  padding:8px 4px 12px; box-shadow:0 -4px 20px rgba(0,0,0,0.08);
}
.dark .hd-bottom-nav { box-shadow:0 -4px 20px rgba(0,0,0,0.3); }
@media(min-width:640px){ .hd-bottom-nav { display:none; } }
.hd-bnav-btn {
  display:flex; flex-direction:column; align-items:center; gap:2px;
  padding:4px 12px; border-radius:10px; border:none; background:transparent;
  cursor:pointer; transition:all 0.2s; color:var(--hd-muted); font-family:var(--hd-font-body);
}
.hd-bnav-btn.active { color:#8B0000; }
.dark .hd-bnav-btn.active { color:#ff6b6b; }
.hd-bnav-btn .bnav-icon { font-size:1.2rem; }
.hd-bnav-lbl { font-size:0.6rem; font-weight:600; }
@media(max-width:639px){ main { padding-bottom:80px !important; } }

/* ── Print ── */
@media screen { .hd-print-only { display:none !important; } }
@media print {
  .hd-root, .hd-header, .hd-nav, .hd-fab, .hd-bottom-nav,
  .no-print, [data-sonner-toaster], [data-sonner-toast],
  .swal2-container, [role="dialog"], [role="alertdialog"],
  [aria-live], [data-radix-portal] { display:none !important; }
  .hd-print-only { display:block !important; }
  @page { size:A4 portrait; margin:0; }
  body { margin:0; padding:0; print-color-adjust:exact; -webkit-print-color-adjust:exact; }
  * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
}

/* ── Dark mode overrides for specific areas ── */
.dark .hd-card { background:var(--hd-card); }
.dark .hd-kpi { background:var(--hd-card); }

/* Expanded card area */
.dark .hd-expand-area { background:#111421 !important; border-color: rgba(255,255,255,0.06) !important; }

/* ── Responsive ── */
@media(max-width:640px){
  .hd-welcome{padding:16px 18px;}
  .hd-welcome-title{font-size:1rem;}
  .hd-kpi-val{font-size:1.35rem;}
  .hd-card{border-radius:14px;}
}
`;
