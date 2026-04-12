// hospital/styles.ts — Production Design System v5.0
// Aesthetic: Clinical Precision — airy, minimal, trustworthy, medical-grade

export const HD_STYLES = `
/* ════════════════════════════════════════
   DESIGN TOKENS
════════════════════════════════════════ */
:root {
  --c-brand:         var(--rp-primary);
  --c-brand-dark:    var(--rp-primary-dark);
  --c-brand-mid:     var(--rp-primary-dark);
  --c-brand-soft:    var(--rp-primary-soft);
  --c-brand-glow:    rgba(196,28,56,0.12);

  --c-bg:            var(--rp-bg);
  --c-surface:       var(--rp-surface);
  --c-surface-2:     var(--rp-surface);
  --c-surface-3:     var(--rp-bg);

  --c-border:        var(--border-color);
  --c-border-med:    rgba(15,23,42,0.12);
  --c-border-strong: rgba(15,23,42,0.2);

  --c-text:          var(--rp-text);
  --c-text-2:        var(--rp-text);
  --c-text-3:        var(--rp-text-muted);
  --c-text-4:        #94A3B8;
  --c-text-inv:      var(--txt-inverse);

  --c-success:       var(--clr-success);
  --c-success-bg:    #ECFDF5;
  --c-success-bdr:   #A7F3D0;
  --c-warn:          var(--clr-warning);
  --c-warn-bg:       #FFFBEB;
  --c-warn-bdr:      #FDE68A;
  --c-info:          var(--rp-info);
  --c-info-bg:       #EFF6FF;
  --c-info-bdr:      #BFDBFE;
  --c-danger:        var(--rp-emergency);
  --c-danger-bg:     #FEF2F2;
  --c-danger-bdr:    #FECACA;

  --s-xs:    0 1px 2px rgba(0,0,0,0.04);
  --s-sm:    0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03);
  --s-md:    0 4px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
  --s-lg:    0 12px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06);
  --s-brand: 0 4px 16px rgba(196,28,56,0.28);
  --s-brand-lg: 0 8px 28px rgba(196,28,56,0.38);

  --r-sm:   8px;
  --r-md:   12px;
  --r-lg:   16px;
  --r-xl:   20px;
  --r-2xl:  24px;
  --r-pill: 999px;

  --f-display: 'Inter', sans-serif;
  --f-body:    'Inter', sans-serif;
  --f-mono:    'JetBrains Mono', monospace;

  --t-fast:   140ms cubic-bezier(0.4,0,0.2,1);
  --t-med:    240ms cubic-bezier(0.4,0,0.2,1);
  --t-slow:   380ms cubic-bezier(0.4,0,0.2,1);
  --t-spring: 320ms cubic-bezier(0.34,1.56,0.64,1);
}

/* ── Dark Mode ── */
.dark {
  --c-bg:            var(--rp-bg);
  --c-surface:       var(--rp-surface);
  --c-surface-2:     var(--rp-surface);
  --c-surface-3:     var(--rp-surface);
  --c-border:        var(--border-color);
  --c-border-med:    rgba(255,255,255,0.1);
  --c-border-strong: rgba(255,255,255,0.18);
  --c-text:          var(--rp-text);
  --c-text-2:        var(--rp-text);
  --c-text-3:        var(--rp-text-muted);
  --c-text-4:        #475569;
  --c-brand-soft:    rgba(196,28,56,0.14);
  --c-success-bg:    rgba(5,150,105,0.1);
  --c-warn-bg:       rgba(217,119,6,0.1);
  --c-info-bg:       rgba(37,99,235,0.1);
  --c-danger-bg:     rgba(220,38,38,0.1);
  --s-sm: 0 2px 8px rgba(0,0,0,0.35),0 0 0 1px rgba(255,255,255,0.04);
  --s-md: 0 4px 20px rgba(0,0,0,0.45),0 1px 4px rgba(0,0,0,0.25);
  --s-lg: 0 12px 40px rgba(0,0,0,0.6),0 4px 12px rgba(0,0,0,0.35);
}

/* ════════════════════════════════════════
   BASE
════════════════════════════════════════ */
*, *::before, *::after { box-sizing: border-box; }

.hd-root {
  font-family: var(--f-body);
  background: var(--c-bg);
  min-height: 100vh;
  color: var(--c-text);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ════════════════════════════════════════
   KEYFRAMES
════════════════════════════════════════ */
@keyframes hd-fade-up   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
@keyframes hd-fade-in   { from{opacity:0} to{opacity:1} }
@keyframes hd-scale-in  { from{opacity:0;transform:scale(0.94) translateY(6px)} to{opacity:1;transform:scale(1) translateY(0)} }
@keyframes hd-slide-r   { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
@keyframes hd-count-up  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes hd-ping       { 75%,100%{transform:scale(1.9);opacity:0} }
@keyframes hd-spin       { to{transform:rotate(360deg)} }
@keyframes hd-float      { 0%,100%{transform:translateY(0) translateX(-50%)} 50%{transform:translateY(-5px) translateX(-50%)} }
@keyframes hd-bar-grow   { from{transform:scaleX(0)} to{transform:scaleX(1)} }
@keyframes hd-pulse-em   { 0%,100%{opacity:1} 50%{opacity:0.55} }
@keyframes hd-badge-pop  { 0%{transform:scale(0)} 60%{transform:scale(1.25)} 100%{transform:scale(1)} }
@keyframes hd-shimmer    { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

/* Animation utilities */
.hd-enter    { animation: hd-fade-up 0.44s cubic-bezier(0.4,0,0.2,1) both; }
.hd-enter-sm { animation: hd-scale-in 0.3s cubic-bezier(0.4,0,0.2,1) both; }
.hd-s1 { animation-delay:.04s } .hd-s2 { animation-delay:.08s }
.hd-s3 { animation-delay:.12s } .hd-s4 { animation-delay:.16s }
.hd-s5 { animation-delay:.20s } .hd-s6 { animation-delay:.24s }

/* ════════════════════════════════════════
   HEADER  (clean frosted glass — white/dark)
════════════════════════════════════════ */
.hd-header {
  background: #A31628;
  border-bottom: 1px solid rgba(0,0,0,0.15);
  position: sticky; top: 0; z-index: 50;
  box-shadow: 0 4px 24px rgba(0,0,0,0.1);
  transition: background var(--t-med);
}
.dark .hd-header {
  background: #7F0E1E;
  border-bottom-color: rgba(255,255,255,0.1);
  box-shadow: 0 4px 24px rgba(0,0,0,0.4);
}

.hd-header-inner {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 20px; max-width: 1400px; margin: 0 auto;
}

/* Logo */
.hd-logo-frame {
  width: 36px; height: 36px; border-radius: 10px;
  background: #fff; display: flex; align-items: center;
  justify-content: center; flex-shrink: 0; overflow: hidden;
  box-shadow: var(--s-brand); transition: transform var(--t-spring), box-shadow var(--t-med);
}
.hd-logo-frame:hover { transform: scale(1.06) rotate(-2deg); box-shadow: var(--s-brand-lg); }
.hd-logo-frame img { width:80%; height:80%; object-fit:contain; border-radius:10px; }

/* Brand text */
.hd-brand {
  font-family: var(--f-display); font-weight: 800;
  font-size: 1.12rem; color: #fff; letter-spacing: -0.03em;
}
.dark .hd-brand { color: #fff; }

.hd-hosp-name {
  font-size: 0.67rem; color: rgba(255,255,255,0.8); font-weight: 500;
  margin-top: 2px; display: flex; align-items: center; gap: 4px; line-height: 1;
}

/* Live dot */
.hd-live-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--clr-success); flex-shrink: 0; position: relative;
}
.hd-live-dot::after {
  content:''; position:absolute; inset:-2px; border-radius:50%;
  background:var(--clr-success); animation:hd-ping 1.5s ease-in-out infinite; opacity:0.4;
}

/* Location chip */
.hd-loc-chip {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 12px; background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.15); border-radius: var(--r-pill);
  font-size: 0.7rem; color: rgba(255,255,255,0.9); font-weight: 500;
  white-space: nowrap; transition: all var(--t-fast);
}
.hd-loc-chip:hover { background: rgba(255,255,255,0.15); color: #fff; }

/* Header icon buttons */
.hd-hdr-btn {
  width: 34px; height: 34px; border-radius: var(--r-sm);
  background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15);
  display: flex; align-items: center; justify-content: center;
  color: #fff; cursor: pointer;
  transition: all var(--t-fast); position: relative; flex-shrink: 0;
}
.hd-hdr-btn:hover {
  background: rgba(255,255,255,0.2); color: #fff;
  border-color: rgba(255,255,255,0.25); transform: translateY(-1px); box-shadow: var(--s-sm);
}

/* Notification badge */
.hd-notif-badge {
  position: absolute; top: -4px; right: -4px;
  min-width: 17px; height: 17px;
  background: var(--c-brand); border: 2px solid var(--c-surface);
  border-radius: var(--r-pill); font-size: 9px; font-weight: 700;
  color: #fff; display: flex; align-items: center;
  justify-content: center; padding: 0 3px;
  animation: hd-badge-pop 0.3s var(--t-spring) both;
  font-family: var(--f-display);
}
.dark .hd-notif-badge { border-color: var(--c-surface); }

/* Emergency button */
.hd-emg-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px; background: #fff;
  border: none; border-radius: var(--r-md); color: #C41C38;
  font-size: 0.74rem; font-weight: 800; font-family: var(--f-body);
  cursor: pointer; transition: all var(--t-med);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15); white-space: nowrap; flex-shrink: 0;
}
.hd-emg-btn:hover {
  background: #fdf2f2; transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.2);
}
.hd-emg-btn:active { transform: translateY(0); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

/* Logout */
.hd-logout-btn {
  width: 34px; height: 34px; border-radius: var(--r-sm);
  background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15);
  display: flex; align-items: center; justify-content: center;
  color: #fff; cursor: pointer;
  transition: all var(--t-fast); flex-shrink: 0; font-family: var(--f-body);
}
.hd-logout-btn:hover {
  background: rgba(220,38,38,0.8); color: #fff;
  border-color: rgba(220,38,38,1); transform: translateY(-1px);
}
@media(min-width:640px) {
  .hd-logout-btn { width:auto; padding:7px 12px; gap:5px; font-size:0.74rem; font-weight:600; }
  .hd-logout-text { display:inline; }
}
.hd-logout-text { display:none; }

/* Profile button */
.hd-profile-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px; background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.15); border-radius: var(--r-sm);
  color: #fff; font-size: 0.72rem; font-weight: 600;
  font-family: var(--f-body); cursor: pointer; transition: all var(--t-fast); flex-shrink: 0;
}
.hd-profile-btn:hover {
  background: rgba(255,255,255,0.2); border-color: rgba(255,255,255,0.25);
  color: #fff; transform: translateY(-1px);
}

/* ════════════════════════════════════════
   NAV
════════════════════════════════════════ */
.hd-nav {
  background: var(--c-surface); border-bottom: 1px solid var(--c-border);
  position: sticky; top: 57px; z-index: 40; box-shadow: var(--s-xs);
}
@media(max-width:639px) { .hd-nav { top:72px; } }

.hd-nav-inner {
  display: flex; align-items: center; gap: 2px;
  padding: 6px 20px; overflow-x: auto; scrollbar-width: none;
  max-width: 1400px; margin: 0 auto;
}
@media(min-width: 768px) {
  .hd-nav-inner { overflow: visible; }
}
.hd-nav-inner::-webkit-scrollbar { display:none; }

.hd-nav-tab {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: var(--r-md);
  font-size: 0.77rem; font-weight: 500; font-family: var(--f-body);
  cursor: pointer; border: none; white-space: nowrap;
  flex-shrink: 0; transition: all var(--t-med);
  background: transparent; color: var(--c-text-3);
}
.hd-nav-tab:hover:not(.hd-nav-active) {
  background: var(--c-brand-soft); color: var(--c-brand);
}
.dark .hd-nav-tab:hover:not(.hd-nav-active) {
  background: rgba(196,28,56,0.1); color: #F87171;
}
.hd-nav-active {
  background: var(--c-brand); color: #fff !important;
  font-weight: 650; box-shadow: var(--s-brand); transform: translateY(-1px);
}

/* ════════════════════════════════════════
   KPI CARDS
════════════════════════════════════════ */
.hd-kpi-grid {
  display: grid; grid-template-columns: repeat(2,1fr); gap:12px;
}
@media(min-width:640px)  { .hd-kpi-grid { grid-template-columns:repeat(3,1fr); } }
@media(min-width:1024px) { .hd-kpi-grid { grid-template-columns:repeat(5,1fr); } }

.hd-kpi {
  background: var(--c-surface); border-radius: var(--r-xl);
  padding: 20px 18px 16px; border: 1px solid var(--c-border);
  box-shadow: var(--s-sm); transition: all var(--t-med);
  position: relative; overflow: hidden; cursor: default;
}
.hd-kpi::after {
  content:''; position:absolute; top:0; left:0; right:0;
  height: 2.5px; border-radius: var(--r-xl) var(--r-xl) 0 0;
}
.hd-kpi:hover { transform:translateY(-3px); box-shadow:var(--s-md); border-color:var(--c-border-med); }

.hd-kpi.k-red::after    { background: linear-gradient(90deg, var(--c-brand-dark), var(--c-brand)); }
.hd-kpi.k-green::after  { background: linear-gradient(90deg, var(--clr-success), var(--clr-success)); }
.hd-kpi.k-blue::after   { background: linear-gradient(90deg, var(--clr-info), #60A5FA); }
.hd-kpi.k-amber::after  { background: linear-gradient(90deg, #D97706, #F59E0B); }
.hd-kpi.k-purple::after { background: linear-gradient(90deg, #7C3AED, #A78BFA); }

.hd-kpi-val {
  font-family: var(--f-display); font-size: 1.8rem; font-weight: 800;
  color: var(--c-text); line-height: 1;
  animation: hd-count-up 0.5s ease both; letter-spacing: -0.02em;
}
.hd-kpi-lbl { font-size:0.7rem; color:var(--c-text-4); font-weight:500; margin-top:4px; letter-spacing:0.01em; }

/* ════════════════════════════════════════
   WELCOME BANNER
════════════════════════════════════════ */
.hd-welcome {
  border-radius: var(--r-2xl); padding: 28px 32px;
  position: relative; overflow: hidden;
  background: linear-gradient(135deg, #7F0E1E 0%, #C41C38 60%, #E11D48 100%);
}
.dark .hd-welcome {
  background: linear-gradient(135deg, #0A192F 0%, #112240 100%);
}
.hd-welcome::before {
  content:''; position:absolute; inset:0;
  background:
    radial-gradient(ellipse at 10% 50%, rgba(255,255,255,0.08) 0%, transparent 55%),
    radial-gradient(ellipse at 90% 20%, rgba(255,255,255,0.05) 0%, transparent 45%);
  pointer-events:none;
}
.hd-welcome-title {
  font-family: var(--f-display); font-size: 1.35rem;
  font-weight: 800; color: #fff; letter-spacing: -0.02em;
}
.hd-welcome-emg-btn {
  display:flex; align-items:center; gap:6px;
  padding:7px 14px; background:rgba(255,255,255,0.14);
  border:1.5px solid rgba(255,255,255,0.3); border-radius:var(--r-md);
  color:#fff; font-size:0.77rem; font-weight:700; font-family:var(--f-body);
  cursor:pointer; transition:all var(--t-med); backdrop-filter:blur(8px);
}
.hd-welcome-emg-btn:hover {
  background:rgba(255,255,255,0.26); border-color:rgba(255,255,255,0.55); transform:translateY(-1px);
}
.hd-welcome-new-btn {
  display:flex; align-items:center; gap:6px;
  padding:7px 18px; background:#fff;
  border:1.5px solid rgba(255,255,255,0.9); border-radius:var(--r-md);
  color:var(--c-brand); font-size:0.77rem; font-weight:800; font-family:var(--f-body);
  cursor:pointer; transition:all var(--t-med); box-shadow:0 2px 12px rgba(0,0,0,0.15);
}
.hd-welcome-new-btn:hover {
  background:#FFF5F5; transform:translateY(-1px); box-shadow:0 6px 20px rgba(0,0,0,0.2);
}

/* ════════════════════════════════════════
   SECTION HEADERS & CARDS
════════════════════════════════════════ */
.hd-sec-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
.hd-sec-title {
  font-family: var(--f-display); font-size: 0.9rem; font-weight: 700;
  color: var(--c-text); display: flex; align-items: center; gap: 8px; letter-spacing:-0.01em;
}
.hd-card {
  background: var(--c-surface); border-radius: var(--r-xl);
  border: 1px solid var(--c-border); box-shadow: var(--s-sm);
  transition: border-color var(--t-fast), box-shadow var(--t-med);
}
.hd-card:hover { border-color: var(--c-border-med); }

/* ════════════════════════════════════════
   STATUS & URGENCY BADGES
════════════════════════════════════════ */
.hd-urg {
  border-radius:var(--r-pill); padding:3px 10px; font-size:0.67rem;
  font-weight:700; letter-spacing:0.02em;
  display:inline-flex; align-items:center; gap:4px; font-family:var(--f-body);
}
.hd-status {
  border-radius:var(--r-pill); padding:3px 10px; font-size:0.65rem; font-weight:700;
  display:inline-flex; align-items:center; gap:4px;
  font-family:var(--f-body); white-space:nowrap;
}

/* ── Urgency selector ── */
.hd-urg-selector { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
.hd-urg-opt {
  border-radius:var(--r-lg); padding:14px 10px;
  border:1.5px solid var(--c-border); cursor:pointer;
  transition:all var(--t-med); text-align:center; background:var(--c-surface);
}
.hd-urg-opt:hover { border-color:var(--c-border-med); transform:translateY(-1px); box-shadow:var(--s-sm); }
.hd-urg-opt.sel-emergency { border-color:var(--clr-emergency); background:rgba(239,68,68,0.06); }
.hd-urg-opt.sel-urgent    { border-color:#F97316; background:rgba(249,115,22,0.06); }
.hd-urg-opt.sel-routine   { border-color:#22C55E; background:rgba(34,197,94,0.06); }
.dark .hd-urg-opt.sel-emergency { background:rgba(239,68,68,0.12); }
.dark .hd-urg-opt.sel-urgent    { background:rgba(249,115,22,0.12); }
.dark .hd-urg-opt.sel-routine   { background:rgba(34,197,94,0.12); }
.hd-urg-emoji { font-size:1.4rem; margin-bottom:6px; display:block; }
.hd-urg-name  { font-size:0.73rem; font-weight:700; font-family:var(--f-display); }
.hd-urg-time  { font-size:0.62rem; color:var(--c-text-4); margin-top:2px; }

/* ════════════════════════════════════════
   PROGRESS BARS
════════════════════════════════════════ */
.hd-validity {
  height:4px; border-radius:var(--r-pill);
  background:var(--c-surface-3); overflow:hidden;
}
.hd-validity-fill {
  height:100%; border-radius:var(--r-pill); transition:width 0.6s ease;
}
.hd-prog { height:6px; background:var(--c-surface-3); border-radius:var(--r-pill); overflow:hidden; }
.hd-prog-fill {
  height:100%; background:linear-gradient(90deg,var(--c-brand-dark),var(--c-brand));
  border-radius:var(--r-pill); transition:width 0.7s cubic-bezier(0.4,0,0.2,1);
}

/* ════════════════════════════════════════
   SEARCH
════════════════════════════════════════ */
.hd-search {
  background:var(--c-surface-2); border:1.5px solid var(--c-border);
  border-radius:var(--r-md); padding:9px 12px 9px 38px;
  font-size:0.82rem; color:var(--c-text); transition:all var(--t-med);
  outline:none; width:100%; font-family:var(--f-body);
}
.hd-search::placeholder { color:var(--c-text-4); }
.hd-search:focus {
  border-color:var(--c-brand); background:var(--c-surface);
  box-shadow:0 0 0 3px var(--c-brand-glow);
}

/* ════════════════════════════════════════
   FORM INPUTS
════════════════════════════════════════ */
.hd-input {
  width:100%; padding:10px 13px; border-radius:var(--r-md);
  border:1.5px solid var(--c-border); font-size:0.83rem;
  font-family:var(--f-body); color:var(--c-text);
  background:var(--c-surface); outline:none; transition:all var(--t-med);
}
.hd-input:focus { border-color:var(--c-brand); box-shadow:0 0 0 3px var(--c-brand-glow); }
.hd-input:disabled { opacity:0.5; cursor:not-allowed; }
.hd-label { font-size:0.75rem; font-weight:600; color:var(--c-text-2); display:block; margin-bottom:6px; }
.hd-required { color:var(--c-danger); margin-left:2px; }

/* ════════════════════════════════════════
   WHATSAPP SHARE
════════════════════════════════════════ */
.hd-share-wa {
  display:inline-flex; align-items:center; gap:5px;
  background:var(--c-success-bg); border:1px solid var(--c-success-bdr);
  color:var(--c-success); border-radius:var(--r-sm);
  padding:4px 10px; font-size:0.68rem; font-weight:700;
  cursor:pointer; transition:all var(--t-fast); font-family:var(--f-body);
}
.hd-share-wa:hover { background:#D1FAE5; transform:translateY(-1px); box-shadow:var(--s-xs); }
.dark .hd-share-wa {
  background:rgba(5,150,105,0.12); border-color:rgba(5,150,105,0.3); color:#34D399;
}

/* ════════════════════════════════════════
   ACTIVE REQUEST CARDS (new section)
════════════════════════════════════════ */
.hd-active-card {
  background:var(--c-surface); border-radius:var(--r-xl);
  border:1px solid var(--c-border); box-shadow:var(--s-sm);
  overflow:hidden; transition:all var(--t-med); cursor:default;
}
.hd-active-card:hover {
  border-color:var(--c-border-med); box-shadow:var(--s-md); transform:translateY(-2px);
}
.hd-active-card.emergency-glow {
  border-color:rgba(220,38,38,0.35);
  box-shadow:var(--s-sm), 0 0 0 2px rgba(220,38,38,0.08);
}
.hd-active-card.emergency-glow:hover {
  border-color:rgba(220,38,38,0.55);
  box-shadow:var(--s-md), 0 0 0 3px rgba(220,38,38,0.1);
}

/* Mono pill for RTIDs */
.hd-mono-pill {
  font-family:var(--f-mono); font-size:0.68rem; padding:2px 7px;
  border-radius:var(--r-sm); background:var(--c-surface-2);
  border:1px solid var(--c-border); color:var(--c-text-3); letter-spacing:0.03em;
}

/* Skeleton */
.hd-skeleton {
  background:linear-gradient(90deg, var(--c-surface-2) 25%, var(--c-surface-3) 50%, var(--c-surface-2) 75%);
  background-size:200% 100%; animation:hd-shimmer 1.6s ease infinite; border-radius:var(--r-sm);
}

/* Empty state */
.hd-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px 20px; text-align:center; }
.hd-empty-icon {
  width:56px; height:56px; border-radius:var(--r-xl);
  background:var(--c-surface-2); border:1px solid var(--c-border);
  display:flex; align-items:center; justify-content:center;
  font-size:1.6rem; margin-bottom:16px;
}
.hd-empty-title { font-weight:600; color:var(--c-text-2); font-size:0.9rem; }
.hd-empty-sub   { font-size:0.75rem; color:var(--c-text-4); margin-top:4px; }

/* ════════════════════════════════════════
   ACT ITEM ROW
════════════════════════════════════════ */
.hd-act-item {
  display:flex; align-items:center; gap:12px; padding:14px 16px;
  transition:background var(--t-fast); animation:hd-slide-r 0.35s ease both;
}
.hd-act-item:hover { background:var(--c-surface-2); }

/* ════════════════════════════════════════
   FAB
════════════════════════════════════════ */
.hd-fab {
  position:fixed; bottom:88px; left:50%; transform:translateX(-50%); z-index:48;
  background:var(--c-brand); color:#fff; border:none; border-radius:var(--r-pill);
  padding:12px 22px; font-size:0.83rem; font-weight:700; font-family:var(--f-body);
  display:flex; align-items:center; gap:8px; cursor:pointer;
  box-shadow:var(--s-brand-lg); transition:all var(--t-med);
  animation:hd-float 3s ease-in-out infinite; white-space:nowrap;
}
.hd-fab:hover {
  transform:scale(1.04) translateX(-48.5%);
  box-shadow:0 12px 36px rgba(196,28,56,0.45); animation:none;
}
@media(min-width:640px) { .hd-fab { bottom:28px; } }

/* ════════════════════════════════════════
   MOBILE BOTTOM NAV
════════════════════════════════════════ */
.hd-bottom-nav {
  position:fixed; bottom:0; left:0; right:0; z-index:45;
  background:var(--c-surface); border-top:1px solid var(--c-border);
  display:flex; align-items:center; justify-content:space-around;
  padding:8px 4px 14px; box-shadow:0 -4px 24px rgba(0,0,0,0.08);
}
.dark .hd-bottom-nav { box-shadow:0 -4px 24px rgba(0,0,0,0.4); }
@media(min-width:640px) { .hd-bottom-nav { display:none; } }

.hd-bnav-btn {
  display:flex; flex-direction:column; align-items:center; gap:3px;
  padding:4px 12px; border-radius:var(--r-md); border:none;
  background:transparent; cursor:pointer; transition:all var(--t-med);
  color:var(--c-text-3); font-family:var(--f-body);
}
.hd-bnav-btn.active { color:var(--c-brand); }
.dark .hd-bnav-btn.active { color:#F87171; }
.hd-bnav-btn .bnav-icon { font-size:1.2rem; }
.hd-bnav-lbl { font-size:0.58rem; font-weight:600; }
@media(max-width:639px) { main { padding-bottom:88px !important; } }

/* Divider */
.hd-divider { height:1px; background:var(--c-border); margin:0; }

/* Expand panel */
.hd-expand-panel { background:var(--c-surface-2); border-top:1px solid var(--c-border); }
.dark .hd-expand-panel { background:var(--c-surface-2); }

/* ════════════════════════════════════════
   PRINT
════════════════════════════════════════ */
@media screen { .hd-print-only { display:none !important; } }
@media print {
  .hd-root,.hd-header,.hd-nav,.hd-fab,.hd-bottom-nav,
  .no-print,[data-sonner-toaster],[data-sonner-toast],
  .swal2-container,[role="dialog"],[role="alertdialog"],
  [aria-live],[data-radix-portal] { display:none !important; }
  .hd-print-only { display:block !important; }
  @page { size:A4 portrait; margin:0; }
  body { margin:0; padding:0; print-color-adjust:exact; -webkit-print-color-adjust:exact; }
  * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
}

/* ════════════════════════════════════════
   RESPONSIVE
════════════════════════════════════════ */
@media(max-width:640px) {
  .hd-welcome { padding:18px 20px; }
  .hd-welcome-title { font-size:1.05rem; }
  .hd-kpi-val { font-size:1.45rem; }
  .hd-card { border-radius:var(--r-lg); }
  .hd-kpi  { border-radius:var(--r-lg); padding:16px 14px 12px; }
}
`;