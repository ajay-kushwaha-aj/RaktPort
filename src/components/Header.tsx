// src/components/Header.tsx
//
// Structure (top → bottom):
//   1. Amber maintenance marquee   (restored, pauses on hover)
//   2. White brand bar             (logo · tagline · lang · dark-mode · hamburger)
//   3. Crimson nav bar             (white-text links · dropdowns · SOS · auth)
//   4. Mobile slide-drawer         (overlay + panel from right)
//
// Fixes applied vs v1:
//   • Amber BETA/MAINTENANCE marquee fully restored
//   • Nav links are white on crimson — visible on any screen
//   • dark:rph-xxx invalid syntax removed — dark mode via .dark class only
//   • All hrefs point to real project pages only
//   • Register dropdown calls onSignupClick() / onLoginClick()
//   • ModeToggle rendered without wrapper interference
//   • Mobile drawer with proper close-on-overlay-click
//   • Brand bar glass effect on scroll (not the nav bar)
//   • Staggered entrance animation
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Globe, X, ChevronDown, Zap, Home, Info, Lightbulb, Droplets, CheckSquare, MapPin, ClipboardList, Microscope, Hospital, TestTubes, UserCircle } from 'lucide-react';
import raktportLogo from '../assets/raktport-logo.png';
import { ModeToggle } from './mode-toggle';
import { useNavigate } from 'react-router-dom';

/* ─── Props ─────────────────────────────────────────────── */
interface HeaderProps {
  onLoginClick?: (role?: string) => void;
  onSignupClick?: (role: string) => void;
}

/* ─── i18n copy ─────────────────────────────────────────── */
const COPY = {
  EN: {
    tagline: 'Donate Blood Anywhere. Save Lives Everywhere.',
    home: 'Home',
    about: 'About',
    impact: 'Impact',
    donor: 'Donate',
    needBlood: 'Need Blood',
    eligibility: 'Eligibility Rules',
    camp: 'Locate Donation Site',
    login: 'Login',
    register: 'Register',
    sos: 'Want to Donate',
    ddDonor: 'Register as Donor',
    ddDonorDesc: 'Create your donor profile',
    ddEli: 'Check Eligibility',
    ddEliDesc: 'Donation health criteria & rules',
    ddCamp: 'Locate Donation Site',
    ddCampDesc: 'Find blood banks & camps near you',
    ddPrep: 'Preparation & Aftercare',
    ddPrepDesc: 'What to do before & after donation',
    ddHospital: 'For Hospitals',
    ddHospDesc: 'Blood request & coordination',
    ddBloodBank: 'For Blood Banks',
    ddBBDesc: 'Inventory & donor management',
    ddAdmin: 'Admin Login',
    ddAdminDesc: 'Internal platform access only',
    ddRoleLabel: 'Choose your role',
  },
  HI: {
    tagline: 'कहीं भी रक्तदान करें. जीवन बचाएं.',
    home: 'होम',
    about: 'हमारे बारे में',
    impact: 'प्रभाव',
    donor: 'रक्तदान',
    needBlood: 'रक्त चाहिए',
    eligibility: 'पात्रता नियम',
    camp: 'डोनेशन साइट खोजें',
    login: 'लॉगिन',
    register: 'रजिस्टर',
    sos: 'रक्तदान करें',
    ddDonor: 'दाता के रूप में पंजीकरण',
    ddDonorDesc: 'अपनी प्रोफाइल बनाएं',
    ddEli: 'पात्रता जांचें',
    ddEliDesc: 'स्वास्थ्य मानदंड और नियम',
    ddCamp: 'डोनेशन साइट खोजें',
    ddCampDesc: 'नजदीकी ब्लड बैंक और शिविर',
    ddPrep: 'तैयारी और देखभाल',
    ddPrepDesc: 'दान से पहले और बाद में',
    ddHospital: 'अस्पतालों के लिए',
    ddHospDesc: 'रक्त अनुरोध और समन्वय',
    ddBloodBank: 'ब्लड बैंकों के लिए',
    ddBBDesc: 'इन्वेंट्री और दाता प्रबंधन',
    ddAdmin: 'एडमिन लॉगिन',
    ddAdminDesc: 'केवल आंतरिक पहुंच',
    ddRoleLabel: 'अपनी भूमिका चुनें',
  },
} as const;
type Lang = keyof typeof COPY;

/* ─── Maintenance + live-stats items ────────────────────── */
const MARQUEE = [
  { icon: '⚠️', bold: 'BETA', body: 'This website is currently under development. Experiences may vary.' },
  { icon: '🚧', bold: 'MAINTENANCE', body: 'Scheduled every Sunday 2:00–4:00 AM IST.' },
  { icon: '🩸', bold: 'LIVE', body: '101 Donations Today · 2,542 Lives Saved This Month · 851 Blood Banks Connected' },
  { icon: '📍', bold: 'NEXT CAMP', body: 'AIIMS New Delhi — April 6, 2026. Register as Donor Now.' },
];

/* ═══════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════ */
export function Header({ onLoginClick, onSignupClick }: HeaderProps) {
  const [lang, setLang] = useState<Lang>('EN');
  const [scrolled, setScroll] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [openDD, setOpenDD] = useState<string | null>(null);
  const ddTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  const t = COPY[lang];

  /* scroll glass ──────────────────────────────────────── */
  useEffect(() => {
    const fn = () => setScroll(window.scrollY > 6);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  /* body lock ─────────────────────────────────────────── */
  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawer]);

  /* close drawer on resize to desktop ─────────────────── */
  useEffect(() => {
    const fn = () => { if (window.innerWidth >= 768) setDrawer(false); };
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  /* dropdown hover helpers ────────────────────────────── */
  const openDD_ = useCallback((id: string) => {
    if (ddTimer.current) clearTimeout(ddTimer.current);
    setOpenDD(id);
  }, []);
  const closeDD_ = useCallback(() => {
    ddTimer.current = setTimeout(() => setOpenDD(null), 150);
  }, []);
  const keepDD_ = useCallback(() => {
    if (ddTimer.current) clearTimeout(ddTimer.current);
  }, []);

  const toggleLang = () => setLang(l => l === 'EN' ? 'HI' : 'EN');

  const closeAll = () => { setDrawer(false); setOpenDD(null); };

  /* ─── render ─────────────────────────────────────────── */
  return (
    <>
      <RphStyles />

      {/* ══ STICKY WRAPPER ══════════════════════════════════ */}
      <header className="rph">

        {/* ═ 1. AMBER MAINTENANCE MARQUEE ════════════════════ */}
        <div className="rph-mbar" role="marquee" aria-label="Site notices and live statistics">
          <div className="rph-mwrap">
            <div className="rph-mtrack">
              {[...MARQUEE, ...MARQUEE].map((m, i) => (
                <span key={i} className="rph-mitem">
                  <span aria-hidden="true">{m.icon}</span>
                  <strong>{m.bold}:</strong>&nbsp;{m.body}
                  <span className="rph-msep" aria-hidden="true">✦</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ═ 2. WHITE BRAND BAR ══════════════════════════════ */}
        <div
          className="rph-brand"
          style={{
            boxShadow: scrolled
              ? '0 1px 0 rgba(196,30,58,0.10), 0 6px 24px rgba(26,12,14,0.09)'
              : '0 1px 0 rgba(196,30,58,0.06)',
            backdropFilter: scrolled ? 'blur(16px) saturate(1.6)' : undefined,
            WebkitBackdropFilter: scrolled ? 'blur(16px) saturate(1.6)' : undefined,
          }}
        >
          <div className="rph-brand-row">
            {/* Logo */}
            <a
              href="/"
              className="rph-logo"
              aria-label="RaktPort home"
              onClick={e => { e.preventDefault(); window.location.href = '/'; }}
            >
              <div className="rph-logo-box">
                <img src={raktportLogo} alt="" className="rph-logo-img" />
              </div>
              <div>
                <div className="rph-logo-name">RaktPort</div>
                <div className="rph-logo-tag">{t.tagline}</div>
              </div>
            </a>

            {/* Controls */}
            <div className="rph-brand-ctrl">
              <button onClick={toggleLang} className="rph-lang" aria-label="Toggle language">
                <Globe size={12} aria-hidden="true" />{lang === 'EN' ? 'हिंदी' : 'EN'}
              </button>

              {/* ModeToggle — no wrapper div, renders directly */}
              <ModeToggle />

              {/* Hamburger — hidden on ≥768px via CSS */}
              <button
                className={`rph-ham${drawer ? ' rph-ham-open' : ''}`}
                onClick={() => setDrawer(v => !v)}
                aria-label={drawer ? 'Close menu' : 'Open menu'}
                aria-expanded={drawer}
                aria-controls="rph-drawer"
              >
                <span className="rph-hline" />
                <span className="rph-hline" />
                <span className="rph-hline" />
              </button>
            </div>
          </div>
        </div>

        {/* ═ 3. CRIMSON NAV BAR ══════════════════════════════ */}
        <nav className="rph-nav" aria-label="Main navigation">
          <div className="rph-nav-row">

            {/* Nav links — simplified: Home, Donate (dropdown), Need Blood, Impact */}
            <ul className="rph-links" role="list">

              <li>
                <a
                  href="/"
                  className="rph-pill"
                  onClick={e => { e.preventDefault(); navigate('/'); }}
                >
                  {t.home}
                </a>
              </li>

              {/* Donate dropdown — includes eligibility & locate center */}
              <li
                className="rph-ddp"
                onMouseEnter={() => openDD_('donor')}
                onMouseLeave={closeDD_}
              >
                <button
                  className={`rph-pill${openDD === 'donor' ? ' rph-pill-open' : ''}`}
                  aria-haspopup="true"
                  aria-expanded={openDD === 'donor'}
                  onClick={() => setOpenDD(p => p === 'donor' ? null : 'donor')}
                >
                  {t.donor}
                  <ChevronDown
                    size={11}
                    aria-hidden="true"
                    style={{ transition: 'transform .22s', transform: openDD === 'donor' ? 'rotate(180deg)' : 'none' }}
                  />
                </button>
                <Dropdown
                  open={openDD === 'donor'}
                  onMouseEnter={keepDD_}
                  onMouseLeave={closeDD_}
                >
                  <DDRow icon={<UserCircle size={16} />} title={t.ddDonor} desc={t.ddDonorDesc}
                    onClick={() => { onSignupClick?.('donor'); closeAll(); }} />
                  <DDRow icon={<CheckSquare size={16} />} title={t.ddEli} desc={t.ddEliDesc}
                    href="/Donation-eligibility-rules.html" onClick={closeAll} />
                  <DDRow icon={<MapPin size={16} />} title={t.ddCamp} desc={t.ddCampDesc}
                    href="/locate-site" onClick={closeAll} />
                  <DDRow icon={<ClipboardList size={16} />} title={t.ddPrep} desc={t.ddPrepDesc}
                    href="/Donation-Preparation&Aftercare.html" onClick={closeAll} />
                </Dropdown>
              </li>

              <li>
                <button className="rph-pill" onClick={() => { onSignupClick?.('donor'); }}>
                  {t.needBlood}
                </button>
              </li>

              <li>
                <a href="/impact" className="rph-pill" onClick={(e) => { e.preventDefault(); window.location.href = '/impact'; }}>{t.impact}</a>
              </li>

            </ul>

            {/* Right: SOS + auth */}
            <div className="rph-nav-right">

              <button className="rph-sos" onClick={() => isLoggedIn ? navigate('/dashboard') : onLoginClick?.('donor')} aria-label="Want to donate blood">
                <span className="rph-sos-ring" aria-hidden="true" />
                <Droplets size={12} aria-hidden="true" style={{ position: 'relative', zIndex: 1, flexShrink: 0 }} />
                <span style={{ position: 'relative', zIndex: 1, whiteSpace: 'nowrap' }}>{isLoggedIn ? 'Donate Now' : t.sos}</span>
              </button>

              {isLoggedIn ? (
                <button onClick={() => navigate('/dashboard')} className="rph-btn-solid shadow-[0_4px_16px_rgba(196,30,58,0.25)] hover:-translate-y-0.5 active:translate-y-0 transition-all ml-1 flex items-center pr-4 pl-3.5">
                  <UserCircle size={15} style={{ marginRight: 6 }}/> Dashboard
                </button>
              ) : (
                <>
                  {onLoginClick && (
                    <button onClick={() => onLoginClick?.('donor')} className="rph-btn-outline">{t.login}</button>
                  )}

                  {onSignupClick && (
                    <div
                      className="rph-ddp"
                      style={{ position: 'relative' }}
                      onMouseEnter={() => openDD_('reg')}
                      onMouseLeave={closeDD_}
                    >
                      <button
                        className="rph-btn-solid"
                        aria-haspopup="true"
                        aria-expanded={openDD === 'reg'}
                        onClick={() => setOpenDD(p => p === 'reg' ? null : 'reg')}
                      >
                        {t.register}&nbsp;
                        <ChevronDown
                          size={11}
                          aria-hidden="true"
                          style={{ transition: 'transform .2s', transform: openDD === 'reg' ? 'rotate(180deg)' : 'none' }}
                        />
                      </button>
                      <Dropdown
                        open={openDD === 'reg'}
                        align="right"
                        minWidth={248}
                        onMouseEnter={keepDD_}
                        onMouseLeave={closeDD_}
                      >
                        <p className="rph-dd-label">{t.ddRoleLabel}</p>
                        <RoleRow icon={<Droplets size={16} />} title={t.ddDonor} desc={t.ddDonorDesc}
                          onClick={() => { onSignupClick?.('donor'); closeAll(); }} />
                        <RoleRow icon={<Hospital size={16} />} title={t.ddHospital} desc={t.ddHospDesc}
                          onClick={() => { onSignupClick?.('hospital'); closeAll(); }} />
                        <RoleRow icon={<TestTubes size={16} />} title={t.ddBloodBank} desc={t.ddBBDesc}
                          onClick={() => { onSignupClick?.('bloodbank'); closeAll(); }} />
                      </Dropdown>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </nav>

      </header>

      {/* ═ 4. MOBILE DRAWER ════════════════════════════════════ */}
      <div
        className={`rph-overlay${drawer ? ' rph-overlay-on' : ''}`}
        onClick={() => setDrawer(false)}
        aria-hidden="true"
      />

      <aside
        id="rph-drawer"
        className={`rph-drawer${drawer ? ' rph-drawer-on' : ''}`}
        role="dialog"
        aria-label="Mobile navigation"
        aria-modal="true"
      >
        {/* Drawer header */}
        <div className="rph-dhead">
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
              <img src={raktportLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span className="rph-dlogo">RaktPort</span>
          </div>
          <button
            className="rph-dclose"
            onClick={() => setDrawer(false)}
            aria-label="Close menu"
          >
            <X size={15} aria-hidden="true" />
          </button>
        </div>

        {/* Emergency CTA */}
        <button
          className="rph-d-sos"
          onClick={() => { onSignupClick?.('donor'); setDrawer(false); }}
        >
          <Zap size={16} aria-hidden="true" />{t.sos}
        </button>

        {/* Auth row */}
        <div className="rph-d-auth">
          <button className="rph-d-login" onClick={() => { onLoginClick?.(); setDrawer(false); }}>{t.login}</button>
          <button className="rph-d-register" onClick={() => { onSignupClick?.('donor'); setDrawer(false); }}>{t.register}</button>
        </div>

        <div className="rph-d-sep" />

        <nav className="rph-d-nav" aria-label="Mobile navigation links">
          <span className="rph-d-section">Navigate</span>
          <DLink href="/" icon={<Home size={16} />} label={t.home} active onClick={() => setDrawer(false)} />
          <DLink href="/about.html" icon={<Info size={16} />} label={t.about} onClick={() => setDrawer(false)} />
          <DLink href="/impact" icon={<Lightbulb size={16} />} label={t.impact} onClick={() => setDrawer(false)} />
          <DLink icon={<Droplets size={16} />} label={t.donor}
            onClick={() => { onSignupClick?.('donor'); setDrawer(false); }} />
          <DLink href="/Donation-eligibility-rules.html" icon={<CheckSquare size={16} />} label={t.eligibility} onClick={() => setDrawer(false)} />
          <DLink href="/locate-site" icon={<MapPin size={16} />} label={t.camp} onClick={() => setDrawer(false)} />
          <DLink href="/Donation-Preparation&Aftercare.html" icon={<ClipboardList size={16} />} label="Preparation & Aftercare" onClick={() => setDrawer(false)} />
          <DLink href="/compatibility.html" icon={<Microscope size={16} />} label="Blood Compatibility Chart" onClick={() => setDrawer(false)} />
        </nav>

        <div className="rph-d-sep" />

        <nav className="rph-d-nav" aria-label="Partner and admin links">
          <span className="rph-d-section">Partners &amp; Access</span>
          <DLink icon={<Hospital size={16} />} label="For Hospitals" onClick={() => { onSignupClick?.('hospital'); setDrawer(false); }} />
          <DLink icon={<TestTubes size={16} />} label="For Blood Banks" onClick={() => { onSignupClick?.('bloodbank'); setDrawer(false); }} />
        </nav>

        <div className="rph-d-sep" />

        <div className="rph-d-util">
          <button onClick={toggleLang} className="rph-lang rph-d-lang" style={{ fontSize: 12 }}>
            <Globe size={13} aria-hidden="true" />
            {lang === 'EN' ? 'Switch to हिंदी' : 'Switch to English'}
          </button>
          <ModeToggle />
        </div>

        <p className="rph-d-footer">Made with ♥ for India · RaktPort 2025</p>
      </aside>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════════ */

/** Dropdown panel */
interface DDProps {
  open: boolean;
  children: React.ReactNode;
  align?: 'left' | 'right';
  minWidth?: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}
function Dropdown({ open, children, align = 'left', minWidth = 220, onMouseEnter, onMouseLeave }: DDProps) {
  return (
    <div
      className={`rph-dd${open ? ' rph-dd-open' : ''}`}
      style={{ [align]: 0, minWidth }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="menu"
    >
      <span className="rph-dd-arrow" style={{ [align === 'left' ? 'left' : 'right']: 14 }} aria-hidden="true" />
      {children}
    </div>
  );
}

/** Dropdown item (link or button) */
function DDRow({ icon, title, desc, href, onClick }:
  { icon: React.ReactNode; title: string; desc: string; href?: string; onClick?: () => void }) {
  const body = (
    <>
      <span className="rph-dd-icon" aria-hidden="true" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{icon}</span>
      <span className="rph-dd-text">
        <span className="rph-dd-title">{title}</span>
        <span className="rph-dd-desc">{desc}</span>
      </span>
    </>
  );
  if (href) return <a href={href} className="rph-ddi" role="menuitem" onClick={onClick}>{body}</a>;
  return <button className="rph-ddi" role="menuitem" onClick={onClick}>{body}</button>;
}

/** Role item (register dropdown) */
function RoleRow({ icon, title, desc, onClick, muted }:
  { icon: ReactNode; title: string; desc: string; onClick: () => void; muted?: boolean }) {
  return (
    <button
      className="rph-ddi rph-role"
      style={{ opacity: muted ? 0.55 : 1 }}
      role="menuitem"
      onClick={onClick}
    >
      <span className="rph-role-em" aria-hidden="true" style={{ fontSize: 0, display: 'flex', alignItems: 'center' }}>{icon}</span>
      <span className="rph-dd-text">
        <span className="rph-dd-title">{title}</span>
        <span className="rph-dd-desc">{desc}</span>
      </span>
    </button>
  );
}

/** Drawer nav link */
function DLink({ icon, label, href, onClick, active }:
  { icon: React.ReactNode; label: string; href?: string; onClick?: () => void; active?: boolean }) {
  const cls = `rph-dlink${active ? ' rph-dlink-active' : ''}`;
  if (href) return <a href={href} className={cls} onClick={onClick}><span className="rph-di" aria-hidden="true">{icon}</span>{label}</a>;
  return <button className={cls} onClick={onClick}><span className="rph-di" aria-hidden="true">{icon}</span>{label}</button>;
}

/* ═══════════════════════════════════════════════════════════
   ALL STYLES  (single injected <style>, rph- scoped)
═══════════════════════════════════════════════════════════ */
function RphStyles() {
  return (
    <style>{`
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

/* ── Tokens ─────────────────────────────────────── */
:root {
  --rph-p:      #C41E3A;
  --rph-ph:     #9B1528;
  --rph-pd:     #7A0E1E;
  --rph-pl:     #FFF1F3;
  --rph-ps:     #FFD7DC;
  --rph-em:     #DC2626;
  --rph-t:      #130A0C;
  --rph-tm:     #6E6268;
  --rph-b:      #E0D6D8;
  --rph-surf:   #FFFFFF;
  --rph-bg:     #FAF8F8;
  /* legacy compat — used by LandingPage, Footer */
  --header-cta:     #C41E3A;
  --header-accent:  #7A0E1E;
  --brand-primary:  #C41E3A;
  --clr-brand:      #8B0000;
  --rp-primary:     #C41E3A;
  --rp-primary-dark:#7A0E1E;
  --rp-bg-dark:     #130A0C;
  --rp-text:        #130A0C;
  --footer-accent:  #8B0000;
  --footer-bg:      #180404;
}
.dark {
  --rph-t:    #F5F0F1;
  --rph-tm:   #A09090;
  --rph-b:    #2D1218;
  --rph-surf: #1E1014;
  --rph-bg:   #130A0C;
  --rph-pl:   #2D0F16;
  --rph-ps:   #3D1520;
  --rph-p:    #E8294A;
  --rp-text:  #F5F0F1;
}

/* ── Base ───────────────────────────────────────── */
.rph, .rph * { font-family:'Plus Jakarta Sans',system-ui,sans-serif; box-sizing:border-box; }
.rph { position:sticky; top:0; z-index:50; }

/* ── Entrance ───────────────────────────────────── */
@keyframes rph-in  { from{transform:translateY(-100%);opacity:0} to{transform:none;opacity:1} }
@keyframes rph-fup { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:none} }
.rph-mbar   { animation:rph-in .5s cubic-bezier(.22,1,.36,1) both; }
.rph-brand  { animation:rph-in .5s .04s cubic-bezier(.22,1,.36,1) both; }
.rph-nav    { animation:rph-in .5s .08s cubic-bezier(.22,1,.36,1) both; }
.rph-links li:nth-child(1){animation:rph-fup .38s .14s both}
.rph-links li:nth-child(2){animation:rph-fup .38s .18s both}
.rph-links li:nth-child(3){animation:rph-fup .38s .22s both}
.rph-links li:nth-child(4){animation:rph-fup .38s .26s both}
.rph-links li:nth-child(5){animation:rph-fup .38s .30s both}
.rph-nav-right{animation:rph-fup .38s .34s both}

/* ════════════════════════════════════════════════
   1. AMBER MAINTENANCE MARQUEE
════════════════════════════════════════════════ */
.rph-mbar {
  background:#fffbeb;
  border-bottom:1px solid #fde68a;
  height:30px;
  overflow:hidden;
  display:flex;
  align-items:center;
}
.dark .rph-mbar { background:#1c1a14; border-color:#3a3520; }

.rph-mwrap { overflow:hidden; width:100%; height:100%; display:flex; align-items:center; }
@keyframes rph-mq { from{transform:translateX(0)} to{transform:translateX(-50%)} }
.rph-mtrack {
  display:flex;
  white-space:nowrap;
  animation:rph-mq 50s linear infinite;
  align-items:center;
}
.rph-mtrack:hover { animation-play-state:paused; }

.rph-mitem {
  display:inline-flex;
  align-items:center;
  gap:6px;
  padding:0 32px;
  font-size:11px;
  font-weight:500;
  color:#78350f;
}
.dark .rph-mitem { color:#b89a30; }
.rph-mitem strong { font-weight:700; }
.rph-msep { opacity:.25; margin:0 4px; }

/* ════════════════════════════════════════════════
   2. WHITE BRAND BAR
════════════════════════════════════════════════ */
.rph-brand {
  background:rgba(255,252,252,.97);
  border-bottom:1px solid var(--rph-b);
  transition:box-shadow .3s cubic-bezier(.22,1,.36,1), backdrop-filter .3s;
}
.dark .rph-brand { background:rgba(26,10,14,.97); }

.rph-brand-row {
  max-width:1280px;
  margin:0 auto;
  padding:10px 16px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
}

/* Logo */
.rph-logo {
  display:flex;
  align-items:center;
  gap:11px;
  text-decoration:none;
  cursor:pointer;
  min-width:0;
  transition:opacity .18s;
}
.rph-logo:hover { opacity:.88; }
.rph-logo-box {
  width:42px; height:42px;
  display:flex; align-items:center; justify-content:center;
  flex-shrink:0;
  transition:transform .22s cubic-bezier(.22,1,.36,1);
}
.rph-logo:hover .rph-logo-box { transform:translateY(-1px) scale(1.05); }
.rph-logo-img { width:100%; height:100%; object-fit:contain; display:block; }
.rph-logo-name {
  font-family:'Sora',Georgia,serif;
  font-weight:800;
  font-size:1.4rem;
  letter-spacing:-.04em;
  color:var(--rph-p);
  white-space:nowrap;
  display:block;
  line-height:1;
}
.rph-logo-tag {
  font-size:9.5px;
  font-weight:500;
  letter-spacing:.05em;
  color:var(--rph-tm);
  margin-top:3px;
  white-space:normal;
  display:block;
  line-height:1.2;
}

/* Brand controls */
.rph-brand-ctrl {
  display:flex;
  align-items:center;
  gap:9px;
  flex-shrink:0;
}

/* Language button */
.rph-lang {
  display:inline-flex;
  align-items:center;
  gap:5px;
  padding:5px 12px;
  border-radius:999px;
  border:1.5px solid var(--rph-b);
  background:#fff;
  color:#5a4a42;
  font-size:11.5px;
  font-weight:600;
  cursor:pointer;
  font-family:'Plus Jakarta Sans',sans-serif;
  transition:border-color .18s, color .18s, background .18s;
  white-space:nowrap;
}
.rph-lang:hover { border-color:var(--rph-p); color:var(--rph-p); }
.dark .rph-lang { background:#2a2a2a; border-color:#3a3a3a; color:#c0a8a0; }
.dark .rph-lang:hover { border-color:var(--rph-p); color:#ff6b6b; }

/* Hamburger */
.rph-ham {
  display:none; /* shown via media query below */
  width:36px; height:36px;
  border-radius:9px;
  border:1.5px solid var(--rph-b);
  background:#fff;
  cursor:pointer;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:5px;
  padding:0;
  flex-shrink:0;
  transition:border-color .18s, background .18s;
}
.rph-ham:hover { border-color:var(--rph-ps); background:var(--rph-pl); }
.dark .rph-ham { background:#1e1e1e; border-color:#3a3a3a; }
.rph-hline {
  display:block;
  width:17px; height:1.5px;
  background:var(--rph-t);
  border-radius:2px;
  transition:transform .26s cubic-bezier(.22,1,.36,1), opacity .2s;
  transform-origin:center;
}
.dark .rph-hline { background:#f5f0f1; }
.rph-ham-open .rph-hline:nth-child(1) { transform:translateY(6.5px) rotate(45deg); }
.rph-ham-open .rph-hline:nth-child(2) { opacity:0; transform:scaleX(0); }
.rph-ham-open .rph-hline:nth-child(3) { transform:translateY(-6.5px) rotate(-45deg); }

/* ════════════════════════════════════════════════
   3. CRIMSON NAV BAR
════════════════════════════════════════════════ */
.rph-nav {
  background:var(--brand-primary, #C41E3A);
  border-left:3px solid var(--header-accent, #7A0E1E);
}
.rph-nav-row {
  max-width:1280px;
  margin:0 auto;
  padding:0 16px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
  min-height:44px;
}

/* Links list */
.rph-links { display:flex; align-items:center; gap:1px; list-style:none; margin:0; padding:0; flex:1; }

/* Nav pill — white text on crimson */
.rph-pill {
  display:inline-flex;
  align-items:center;
  gap:4px;
  padding:10px 12px;
  font-size:.73rem;
  font-weight:500;
  letter-spacing:.05em;
  text-transform:uppercase;
  color:rgba(255,255,255,.82);
  border-radius:6px;
  border:none;
  background:transparent;
  cursor:pointer;
  font-family:'Plus Jakarta Sans',sans-serif;
  text-decoration:none;
  transition:color .18s, background .18s;
  white-space:nowrap;
  position:relative;
  line-height:1;
}
.rph-pill:hover, .rph-pill-open { color:#fff; background:rgba(255,255,255,.13); }
.rph-active { color:#fff !important; font-weight:700 !important; }
.rph-active::after {
  content:'';
  position:absolute;
  bottom:4px; left:12px; right:12px;
  height:1.5px;
  background:rgba(255,255,255,.75);
  border-radius:2px;
}

/* Nav right */
.rph-nav-right {
  display:flex;
  align-items:center;
  gap:8px;
  flex-shrink:0;
  margin:7px 0;
}

/* SOS button */
.rph-sos {
  position:relative;
  display:inline-flex;
  align-items:center;
  gap:6px;
  padding:7px 12px;
  border-radius:7px;
  border:1.5px solid rgba(255,255,255,.55);
  background:transparent;
  color:#fff;
  font-size:.73rem;
  font-weight:700;
  font-family:'Plus Jakarta Sans',sans-serif;
  cursor:pointer;
  overflow:hidden;
  transition:background .18s, box-shadow .18s;
  letter-spacing:.03em;
}
.rph-sos::before {
  content:'';
  position:absolute; inset:0;
  background:rgba(220,38,38,.9);
  opacity:0;
  transition:opacity .18s;
}
.rph-sos:hover::before { opacity:1; }
.rph-sos:hover { box-shadow:0 3px 12px rgba(220,38,38,.5); border-color:#fff; }
.rph-sos-ring {
  position:absolute; inset:-6px;
  border-radius:11px;
  border:1px solid rgba(255,255,255,.4);
  opacity:0;
  animation:rph-ring 2.4s ease-out infinite;
  pointer-events:none;
}
@keyframes rph-ring { 0%{opacity:.5;transform:scale(.95)} 100%{opacity:0;transform:scale(1.2)} }

/* Login outline */
.rph-btn-outline {
  background:transparent;
  color:#fff;
  font-size:.73rem; font-weight:700;
  padding:7px 16px;
  border-radius:999px;
  border:1.5px solid rgba(255,255,255,.68);
  cursor:pointer;
  font-family:'Plus Jakarta Sans',sans-serif;
  letter-spacing:.04em;
  text-transform:uppercase;
  transition:background .18s, border-color .18s;
  white-space:nowrap;
}
.rph-btn-outline:hover { background:rgba(255,255,255,.14); border-color:#fff; }

/* Register solid */
.rph-btn-solid {
  display:inline-flex;
  align-items:center;
  gap:4px;
  background:#fff;
  color:var(--rph-p);
  font-size:.73rem; font-weight:800;
  padding:7px 18px;
  border-radius:999px;
  border:none;
  cursor:pointer;
  font-family:'Plus Jakarta Sans',sans-serif;
  box-shadow:0 2px 8px rgba(0,0,0,.14);
  letter-spacing:.03em;
  text-transform:uppercase;
  transition:background .18s, box-shadow .18s;
  white-space:nowrap;
}
.rph-btn-solid:hover { background:#fff0ee; box-shadow:0 4px 14px rgba(0,0,0,.18); }

/* ════════════════════════════════════════════════
   DROPDOWNS
════════════════════════════════════════════════ */
.rph-ddp { position:relative; }
.rph-dd {
  position:absolute;
  top:calc(100% + 10px);
  background:var(--rph-surf);
  border:1px solid var(--rph-b);
  border-radius:14px;
  box-shadow:0 4px 6px -2px rgba(26,12,14,.05), 0 16px 44px rgba(26,12,14,.13);
  padding:8px;
  opacity:0;
  pointer-events:none;
  transform:translateY(-6px);
  transition:opacity .22s cubic-bezier(.22,1,.36,1), transform .22s cubic-bezier(.22,1,.36,1);
  z-index:100;
}
.dark .rph-dd { box-shadow:0 4px 6px -2px rgba(0,0,0,.2), 0 16px 44px rgba(0,0,0,.38); }
.rph-dd-open { opacity:1; pointer-events:all; transform:translateY(0); }

.rph-dd-arrow {
  position:absolute;
  top:-5px;
  width:10px; height:10px;
  background:var(--rph-surf);
  border-left:1px solid var(--rph-b);
  border-top:1px solid var(--rph-b);
  transform:rotate(45deg);
  border-radius:2px 0 0 0;
}

.rph-dd-label {
  font-size:10px; font-weight:700;
  letter-spacing:.09em;
  text-transform:uppercase;
  color:var(--rph-tm);
  padding:5px 10px 4px;
  margin:0; display:block;
}
.rph-dd-sep { height:1px; background:var(--rph-b); margin:5px 0; }

.rph-ddi {
  display:flex;
  align-items:center;
  gap:10px;
  padding:8px 10px;
  border-radius:8px;
  border:none; background:none;
  cursor:pointer;
  text-decoration:none;
  color:var(--rph-t);
  font-family:'Plus Jakarta Sans',sans-serif;
  font-size:13px; font-weight:400;
  width:100%; text-align:left;
  transition:background .14s;
}
.rph-ddi:hover { background:var(--rph-pl); }
.rph-ddi:hover .rph-dd-title { color:var(--rph-p); }

.rph-dd-icon {
  width:30px; height:30px;
  border-radius:7px;
  background:var(--rph-bg);
  display:flex; align-items:center; justify-content:center;
  font-size:14px; flex-shrink:0;
}
.rph-dd-text { display:flex; flex-direction:column; }
.rph-dd-title { font-size:12.5px; font-weight:600; color:var(--rph-t); line-height:1.3; transition:color .14s; }
.rph-dd-desc  { font-size:10.5px; color:var(--rph-tm); margin-top:1px; line-height:1.4; }

/* Role item */
.rph-role .rph-role-em {
  width:32px; height:32px;
  border-radius:8px;
  border:1px solid var(--rph-b);
  background:var(--rph-bg);
  display:flex; align-items:center; justify-content:center;
  font-size:15px; flex-shrink:0;
}

/* ════════════════════════════════════════════════
   4. MOBILE DRAWER
════════════════════════════════════════════════ */
.rph-overlay {
  position:fixed; inset:0;
  background:rgba(19,10,12,.45);
  z-index:90;
  opacity:0; pointer-events:none;
  backdrop-filter:blur(3px);
  transition:opacity .3s;
}
.rph-overlay-on { opacity:1; pointer-events:all; }

.rph-drawer {
  position:fixed;
  top:0; right:0; bottom:0;
  width:min(320px,88vw);
  background:var(--rph-surf);
  border-left:1px solid var(--rph-b);
  z-index:100;
  transform:translateX(100%);
  transition:transform .34s cubic-bezier(.22,1,.36,1);
  overflow-y:auto;
  overscroll-behavior:contain;
  -webkit-overflow-scrolling:touch;
  display:flex; flex-direction:column;
}
.rph-drawer-on { transform:translateX(0); }

.rph-dhead {
  display:flex; align-items:center; justify-content:space-between;
  padding:16px 18px;
  border-bottom:1px solid var(--rph-b);
  position:sticky; top:0;
  background:var(--rph-surf);
  z-index:2;
  flex-shrink:0;
}
.rph-dlogo {
  font-family:'Sora',Georgia,serif;
  font-weight:800; font-size:1.05rem;
  letter-spacing:-.04em;
  color:var(--rph-p);
}
.rph-dclose {
  width:32px; height:32px;
  border-radius:8px;
  border:1px solid var(--rph-b);
  background:transparent;
  cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  color:var(--rph-tm);
  transition:background .15s, color .15s;
}
.rph-dclose:hover { background:var(--rph-pl); color:var(--rph-p); }

.rph-d-sos {
  margin:14px 16px 0;
  display:flex; align-items:center; justify-content:center;
  gap:8px;
  padding:12px;
  border-radius:12px;
  background:linear-gradient(135deg, #EF4444, #DC2626);
  color:#fff;
  font-size:14px; font-weight:700;
  font-family:'Plus Jakarta Sans',sans-serif;
  border:none;
  box-shadow: 0 4px 14px rgba(220,38,38,0.25);
  cursor:pointer;
  width:calc(100% - 32px);
  transition:transform .2s, box-shadow .2s;
  flex-shrink:0;
}
.rph-d-sos:hover { transform:translateY(-1px); box-shadow: 0 6px 20px rgba(220,38,38,0.35); }

.rph-d-auth { display:flex; gap:10px; padding:12px 16px 0; }
.rph-d-auth button {
  flex:1; padding:11px; border-radius:12px;
  font-size:14px; font-weight:600;
  font-family:'Plus Jakarta Sans',sans-serif;
  cursor:pointer; transition:all .2s;
}
.rph-d-login {
  background:transparent;
  border:1.5px solid var(--rph-b);
  color:var(--rph-t);
}
.rph-d-login:hover { border-color:var(--rph-tm); }
.rph-d-register { background:var(--rph-t); border:1.5px solid transparent; color:var(--rph-surf); }
.rph-d-register:hover { opacity:0.9; }

.rph-d-sep { height:1px; background:var(--rph-b); margin:12px 16px; }
.rph-d-nav { padding:0 12px; }
.rph-d-section {
  display:block;
  font-size:10px; font-weight:700;
  letter-spacing:.1em; text-transform:uppercase;
  color:var(--rph-tm);
  padding:4px 6px 7px;
  margin:0;
}
.rph-dlink {
  display:flex; align-items:center; gap:10px;
  padding:10px;
  border-radius:9px;
  text-decoration:none;
  color:var(--rph-t);
  font-size:13.5px; font-weight:500;
  font-family:'Plus Jakarta Sans',sans-serif;
  transition:background .15s, color .15s;
  margin-bottom:2px;
  background:none; border:none; cursor:pointer;
  width:100%; text-align:left;
}
.rph-dlink:hover, .rph-dlink-active {
  background:var(--rph-pl) !important;
  color:var(--rph-p) !important;
}
.rph-di { display:flex; align-items:center; justify-content:center; color:var(--rph-tm); flex-shrink:0; width:24px; text-align:center; }
.rph-dlink:hover .rph-di, .rph-dlink-active .rph-di { color:var(--rph-p); }

.rph-d-util {
  display:flex; align-items:center; justify-content:space-between;
  padding:8px 16px;
}
.rph-d-lang { font-size:12px !important; padding:5px 12px !important; }
.rph-d-footer {
  text-align:center;
  font-size:11px; color:var(--rph-tm);
  padding:12px 16px 20px; margin:0;
}

/* ════════════════════════════════════════════════
   RESPONSIVE
════════════════════════════════════════════════ */
@media (max-width:767px) {
  .rph-nav      { display:none; }
  .rph-ham      { display:flex; }
  .rph-logo-name { font-size: 1.15rem; }
  .rph-logo-tag { font-size: 7px; white-space: nowrap; }
}
@media (max-width:400px) {
  .rph-mbar     { height:26px; }
  .rph-mitem    { font-size:10.5px; padding:0 20px; }
  .rph-logo-name { font-size: 1.05rem; }
  .rph-logo-tag { font-size: 6.5px; white-space: normal; line-height: 1.1; margin-top:2px; max-width: 140px; }
}
@media (min-width:768px) { .rph-ham { display:none !important; } }

/* Compress at mid-sizes */
@media (max-width:1100px) {
  .rph-pill         { padding:10px 9px; font-size:.69rem; }
  .rph-nav-right    { gap:6px; }
  .rph-sos          { padding:7px 9px; }
  .rph-btn-outline  { padding:7px 11px; }
  .rph-btn-solid    { padding:7px 13px; }
}
@media (max-width:940px) {
  .rph-sos { display:none; }
}
    `}</style>
  );
}