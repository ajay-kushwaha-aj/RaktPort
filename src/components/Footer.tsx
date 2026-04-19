// src/components/Footer.tsx
// ─────────────────────────────────────────────────────────────
// RaktPort — Production Footer v1
//
// Aesthetic: Deep refined darkness — near-black crimson substrate,
//   layered transparency, animated heartbeat line, scroll-reveal
//   sections, micro blood-drop SVG texture, glowing helpline strip.
//
// Features:
//   • Scroll-triggered reveal (IntersectionObserver)
//   • Animated heartbeat SVG across top
//   • Pulse dots on emergency strip
//   • Hover underline animations on all links
//   • Responsive: 4-col → 2-col → 1-col
//   • Built by Ajay Kushwaha credit with glow hover
//   • Fully dark — inherits from parent dark-mode class
//   • Preserves Faqs import and all existing real hrefs
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';

/* ─── Scroll-reveal hook ───────────────────────────────── */
function useScrollReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('rpf-visible');
          obs.unobserve(el);
        }
      },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return ref;
}

/* ─── Data ─────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About RaktPort', href: '/about.html' },
  { label: 'Our Mission', href: '/our-mission.html' },
  { label: 'Become a Donor', href: '#' },
  { label: 'Eligibility Rules', href: '/Donation-eligibility-rules.html' },
  { label: 'Locate Donation Site', href: '/locate-site' },
  { label: 'Preparation & Aftercare', href: '/Donation-Preparation&Aftercare.html' },
  { label: 'Blood Compatibility', href: '/compatibility.html' },
];

const RESOURCE_LINKS = [
  { label: 'Ayushman Bharat Digital Mission', href: 'https://abdm.gov.in/' },
  { label: 'E-Raktkosh (MoHFW)', href: 'https://eraktkosh.mohfw.gov.in/eraktkoshPortal/' },
  { label: 'National AIDS Control Org.', href: 'https://naco.gov.in/' },
  { label: 'World Health Organisation', href: 'https://www.who.int/' },
  { label: 'Ministry of Health & FW', href: 'https://mohfw.gov.in/' },
  { label: 'National Health Authority', href: 'https://nha.gov.in/' },
];

const POLICY_LINKS = [
  { label: 'Terms & Conditions', href: '/terms.html' },
  { label: 'Privacy Policy', href: '/privacy.html' },
  { label: 'Blood Donation Guidelines', href: '/blood-guidelines.html' },
  { label: 'Contact Us', href: '/contact.html' },
];

const PARTNER_LINKS = [
  { label: 'For Donors', href: '#' },
  { label: 'For Hospitals', href: '#' },
  { label: 'For Blood Banks', href: '#' },
  { label: 'Admin Access', href: '#' },
  { label: 'Locate Donation Site', href: '/locate-site' },
  { label: 'MyGov Pledge', href: 'https://pledge.mygov.in/voluntary-blood-donation/' },
];

// Stats removed per user request

const SOCIALS = [
  {
    label: 'Facebook', href: '#',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>,
  },
  {
    label: 'X (Twitter)', href: '#',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
  },
  {
    label: 'Instagram', href: '#',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>,
  },
  {
    label: 'LinkedIn', href: '#',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>,
  },
];

/* ─── Heartbeat SVG path ─────────────────────────────── */
const HEARTBEAT_PATH = "M0,30 L60,30 L75,10 L90,50 L105,5 L120,50 L135,10 L150,30 L300,30 L315,10 L330,50 L345,5 L360,50 L375,10 L390,30 L600,30 L615,10 L630,50 L645,5 L660,50 L675,10 L690,30 L900,30";

/* ═══════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════ */
export function Footer() {
  const statsRef = useScrollReveal(0.1);
  const helpRef = useScrollReveal(0.1);
  const gridRef = useScrollReveal(0.05);
  const bottomRef = useScrollReveal(0.1);

  return (
    <>
      <FooterStyles />

      <footer className="rpf">

        {/* ═ ANIMATED HEARTBEAT DIVIDER ════════════════════ */}
        <div className="rpf-heartbeat-wrap" aria-hidden="true">
          <svg
            viewBox="0 0 900 60"
            preserveAspectRatio="none"
            className="rpf-heartbeat-svg"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="rpf-hbg" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7A0E1E" stopOpacity="0" />
                <stop offset="20%" stopColor="#C41E3A" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#E8294A" stopOpacity="1" />
                <stop offset="80%" stopColor="#C41E3A" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#7A0E1E" stopOpacity="0" />
              </linearGradient>
              <filter id="rpf-hb-glow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {/* Background flat line */}
            <path d="M0,30 L900,30" stroke="rgba(196,30,58,0.12)" strokeWidth="1" fill="none" />
            {/* Animated heartbeat trace */}
            <path
              d={HEARTBEAT_PATH}
              stroke="url(#rpf-hbg)"
              strokeWidth="2"
              fill="none"
              filter="url(#rpf-hb-glow)"
              className="rpf-hb-path"
            />
            {/* Travelling pulse dot */}
            <circle r="4" fill="#E8294A" filter="url(#rpf-hb-glow)" className="rpf-hb-dot">
              <animateMotion
                dur="4s"
                repeatCount="indefinite"
                path={HEARTBEAT_PATH}
              />
            </circle>
          </svg>
        </div>

        {/* Live stats strip removed */}

        {/* ═ MAIN CONTENT ══════════════════════════════════ */}
        <div className="rpf-container rpf-main">

          {/* ─ HELPLINE STRIP ──────────────────────────── */}
          <div className="rpf-helpline rpf-reveal" ref={helpRef}>
            <div className="rpf-helpline-left">
              <div className="rpf-helpline-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 11.4 19.79 19.79 0 0 1 1.64 2.88 2 2 0 0 1 3.62.69h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.35a16 16 0 0 0 6 6l1.06-1.06a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 15.92z" />
                </svg>
              </div>
              <div className="rpf-helpline-text">
                <p className="rpf-helpline-title">24/7 Blood Emergency Helpline</p>
                <p className="rpf-helpline-sub">Connect instantly to the nearest blood bank anywhere in India</p>
              </div>
            </div>
            <a href="tel:1800-180-1104" className="rpf-helpline-btn" aria-label="Call 1800 180 1104">
              <span className="rpf-helpline-btn-pulse" aria-hidden="true" />
              <span className="rpf-helpline-btn-text">1800-180-1104</span>
            </a>
          </div>

          {/* ─ MAIN LINK GRID ──────────────────────────── */}
          <div className="rpf-grid rpf-reveal" ref={gridRef}>

            {/* Col 1: Brand */}
            <div className="rpf-col rpf-col-brand">
              {/* Logo text */}
              <div className="rpf-brand-logo">
                Rakt<span className="rpf-brand-accent">Port</span>
              </div>
              <p className="rpf-brand-desc">
                India's National Digital Blood Donation &amp; Management System — connecting donors, blood banks, and hospitals in real time.
              </p>

              {/* Socials */}
              <div className="rpf-socials">
                {SOCIALS.map(s => (
                  <a key={s.label} href={s.href} className="rpf-social" aria-label={s.label} target="_blank" rel="noopener noreferrer">
                    {s.icon}
                  </a>
                ))}
              </div>

              {/* Compliance badges */}
              <div className="rpf-badges">
                {['NACO Compliant', 'MoHFW Verified', 'NDHM Integrated'].map(b => (
                  <span key={b} className="rpf-badge">
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden="true"><circle cx="5" cy="5" r="5" fill="#4ade80" /><path d="M3 5l1.5 1.5L7 3.5" stroke="#014012" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {b}
                  </span>
                ))}
              </div>
            </div>

            {/* Col 2: Navigate */}
            <div className="rpf-col">
              <h3 className="rpf-col-title">Navigate</h3>
              <ul className="rpf-link-list">
                {NAV_LINKS.map(l => (
                  <li key={l.label}>
                    <a href={l.href} className="rpf-link">
                      <span className="rpf-link-arrow" aria-hidden="true">›</span>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3: Resources */}
            <div className="rpf-col">
              <h3 className="rpf-col-title">Official Resources</h3>
              <ul className="rpf-link-list">
                {RESOURCE_LINKS.map(l => (
                  <li key={l.label}>
                    <a href={l.href} className="rpf-link rpf-link-ext" target="_blank" rel="noopener noreferrer">
                      <span className="rpf-link-arrow" aria-hidden="true">↗</span>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4: Policies + Partner */}
            <div className="rpf-col">
              <h3 className="rpf-col-title">Policies</h3>
              <ul className="rpf-link-list" style={{ marginBottom: 28 }}>
                {POLICY_LINKS.map(l => (
                  <li key={l.label}>
                    <a href={l.href} className="rpf-link">
                      <span className="rpf-link-arrow" aria-hidden="true">›</span>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>

              <h3 className="rpf-col-title">Partner Access</h3>
              <ul className="rpf-link-list">
                {PARTNER_LINKS.map(l => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="rpf-link"
                      target={l.href.startsWith('http') ? '_blank' : '_self'}
                      rel={l.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                      <span className="rpf-link-arrow" aria-hidden="true">›</span>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ─ DIVIDER ─────────────────────────────────── */}
          <div className="rpf-divider" />

          {/* ─ BOTTOM BAR ──────────────────────────────── */}
          <div className="rpf-bottom rpf-reveal" ref={bottomRef}>
            <div className="rpf-bottom-left">
              <p className="rpf-copy">
                © {new Date().getFullYear()} RaktPort — National Digital Blood Donation &amp; Management System
              </p>
              <p className="rpf-copy rpf-copy-dim">
                Website Content Managed by RaktPort Team
              </p>
            </div>

            <div className="rpf-bottom-center">
              <p className="rpf-made-with">
                Made with{' '}
                <span className="rpf-heart" aria-label="love">
                  <svg width="14" height="12" viewBox="0 0 24 21" fill="currentColor" aria-hidden="true">
                    <path d="M12 21C12 21 1 13.5 1 6.5C1 3.42 3.42 1 6.5 1C8.24 1 9.91 1.81 11 3.09C12.09 1.81 13.76 1 15.5 1C18.58 1 21 3.42 21 6.5C21 13.5 12 21 12 21Z" />
                  </svg>
                </span>
                {' '}for India
              </p>
              <div className="rpf-metrics-box" style={{ marginTop: '14px', display: 'flex', justifyContent: 'center' }}>
                <span style={{
                  background: 'rgba(196,30,58,0.1)',
                  border: '1px solid rgba(196,30,58,0.2)',
                  color: '#ff8fa3',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: '600',
                  letterSpacing: '0.04em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
                  <VisitorCounterText />
                </span>
              </div>
            </div>

            <div className="rpf-bottom-right">
              <p className="rpf-built-by">
                Built by{' '}
                <a
                  href="https://portfolio.raktport.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rpf-built-link"
                  aria-label="Ajay Kushwaha's portfolio"
                >
                  <span className="rpf-built-name">Ajay Kushwaha</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                </a>
              </p>
            </div>
          </div>

        </div>
      </footer>
    </>
  );
}

function VisitorCounterText() {
  const [count, setCount] = useState<number | null>(null);
  
  useEffect(() => {
    // We use a counter API that tracks visits to raktport.in
    fetch('https://api.counterapi.dev/v1/raktport_in/visitors/up')
      .then(res => {
        if (!res.ok) throw new Error('API down');
        return res.json();
      })
      .then(data => setCount(data.count))
      .catch((err) => {
        console.error('Visitor counter error:', err);
        // Do not put fake data. Just leave it null or try to read from local storage
      });
  }, []);
  
  if (count === null) return <span>Live Views: Computing...</span>;
  return <span>Live Views: {count.toLocaleString()}</span>;
}

/* ═══════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════ */
function FooterStyles() {
  return (
    <style>{`
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

/* ── Tokens (inherit from Header; redeclare only footer-specific) ── */
:root {
  --rpf-bg0:    #020617;
  --rpf-bg1:    #0f172a;
  --rpf-bg2:    #1e293b;
  --rpf-accent: #C41E3A;
  --rpf-acl:    #E8294A;
  --rpf-acd:    #7A0E1E;
  --rpf-text:   rgba(255,255,255,0.50);
  --rpf-texth:  rgba(255,255,255,0.92);
  --rpf-border: rgba(255,255,255,0.07);
  --rpf-sep:    rgba(255,255,255,0.06);
  /* compat */
  --footer-bg:     #020617;
  --footer-accent: #7A0E1E;
  --rp-primary:    #C41E3A;
}

/* ── Base ── */
.rpf, .rpf * { font-family:'Plus Jakarta Sans',system-ui,sans-serif; box-sizing:border-box; }
.rpf {
  background: var(--rpf-bg0);
  border-top: 3px solid var(--rpf-acd);
  position: relative;
  overflow: hidden;
}

/* Subtle glow (texture removed per request) */
.rpf::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(ellipse 80% 50% at 50% 0%, rgba(196,30,58,0.08) 0%, transparent 60%);
  pointer-events: none;
  z-index: 0;
}
.rpf > * { position: relative; z-index: 1; }

/* ── Container ── */
.rpf-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 20px;
}
.rpf-main { padding-top: 0; padding-bottom: 40px; }

/* ── Scroll reveal ── */
.rpf-reveal {
  opacity: 0;
  transform: translateY(22px);
  transition: opacity 0.62s cubic-bezier(0.22,1,0.36,1), transform 0.62s cubic-bezier(0.22,1,0.36,1);
}
.rpf-reveal.rpf-visible {
  opacity: 1;
  transform: translateY(0);
}

/* ══════════════════════════════════════════════════
   HEARTBEAT DIVIDER
══════════════════════════════════════════════════ */
.rpf-heartbeat-wrap {
  width: 100%;
  height: 60px;
  overflow: hidden;
  display: block;
}
.rpf-heartbeat-svg {
  width: 100%;
  height: 100%;
  display: block;
}
@keyframes rpf-hb-trace {
  from { stroke-dashoffset: 2400; }
  to   { stroke-dashoffset: 0; }
}
.rpf-hb-path {
  stroke-dasharray: 2400;
  stroke-dashoffset: 2400;
  animation: rpf-hb-trace 5s ease-in-out infinite;
}
.rpf-hb-dot {
  opacity: 0;
  animation: rpf-hb-dot-fade 4s ease-in-out infinite;
}
@keyframes rpf-hb-dot-fade {
  0%,5%   { opacity: 0; }
  15%,85% { opacity: 1; }
  95%,100%{ opacity: 0; }
}

/* ══════════════════════════════════════════════════
   STATS STRIP
══════════════════════════════════════════════════ */
.rpf-stats-strip {
  background: linear-gradient(90deg, rgba(122,14,30,0.4) 0%, rgba(196,30,58,0.18) 50%, rgba(122,14,30,0.4) 100%);
  border-top: 1px solid rgba(196,30,58,0.2);
  border-bottom: 1px solid rgba(196,30,58,0.2);
  padding: 20px 0;
  margin-bottom: 0;
  opacity: 0;
  transform: translateY(14px);
  transition: opacity 0.6s, transform 0.6s;
}
.rpf-stats-strip.rpf-visible { opacity: 1; transform: translateY(0); }

.rpf-stats-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  flex-wrap: wrap;
  position: relative;
}
.rpf-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 8px 28px;
  border-right: 1px solid rgba(255,255,255,0.08);
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.5s, transform 0.5s;
  transition-delay: var(--d, 0s);
}
.rpf-stats-strip.rpf-visible .rpf-stat { opacity: 1; transform: none; }
.rpf-stat:last-of-type { border-right: none; }
.rpf-stat-icon { font-size: 1.2rem; line-height: 1; }
.rpf-stat-val {
  font-family: 'Sora', serif;
  font-weight: 800;
  font-size: 1.35rem;
  color: #fff;
  letter-spacing: -0.03em;
  line-height: 1;
}
.rpf-stat-label {
  font-size: 10px;
  font-weight: 600;
  color: rgba(255,255,255,0.42);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.rpf-live-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(74,222,128,0.1);
  border: 1px solid rgba(74,222,128,0.25);
  font-size: 10px;
  font-weight: 700;
  color: #4ade80;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-left: 16px;
}
.rpf-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4ade80;
  animation: rpf-live-pulse 1.6s ease-in-out infinite;
  flex-shrink: 0;
}
@keyframes rpf-live-pulse {
  0%,100%{ opacity:1; transform:scale(1); }
  50%{ opacity:0.55; transform:scale(1.4); }
}

/* ══════════════════════════════════════════════════
   HELPLINE STRIP
══════════════════════════════════════════════════ */
.rpf-helpline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
  margin: 44px 0 40px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(122,14,30,0.35) 0%, rgba(196,30,58,0.18) 100%);
  border: 1px solid rgba(196,30,58,0.28);
  backdrop-filter: blur(8px);
  position: relative;
  overflow: hidden;
}
.rpf-helpline::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(232,41,74,0.6), transparent);
}
.rpf-helpline-left { display: flex; align-items: center; gap: 14px; min-width: 0; }
.rpf-helpline-icon {
  width: 44px; height: 44px;
  border-radius: 12px;
  background: rgba(196,30,58,0.25);
  border: 1px solid rgba(196,30,58,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff8fa3;
  flex-shrink: 0;
}
.rpf-helpline-title {
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.3;
}
.rpf-helpline-sub {
  color: rgba(255,255,255,0.45);
  font-size: 11.5px;
  margin: 3px 0 0;
  line-height: 1.4;
}
.rpf-helpline-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 24px;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--rpf-acd), var(--rpf-accent));
  color: #fff;
  font-weight: 800;
  font-size: 1rem;
  text-decoration: none;
  white-space: nowrap;
  font-family: 'Plus Jakarta Sans', sans-serif;
  box-shadow: 0 4px 20px rgba(139,0,0,0.5), 0 0 0 0 rgba(196,30,58,0.4);
  transition: transform 0.2s, box-shadow 0.2s;
  overflow: hidden;
}
.rpf-helpline-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0);
  transition: background 0.2s;
  border-radius: 999px;
}
.rpf-helpline-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(139,0,0,0.6); }
.rpf-helpline-btn:hover::before { background: rgba(255,255,255,0.08); }
.rpf-helpline-btn-pulse {
  position: absolute;
  inset: -3px;
  border-radius: 999px;
  border: 2px solid rgba(196,30,58,0.5);
  animation: rpf-btn-pulse 2s ease-out infinite;
  pointer-events: none;
}
@keyframes rpf-btn-pulse {
  0%   { opacity: 0.8; transform: scale(1); }
  100% { opacity: 0;   transform: scale(1.15); }
}
.rpf-helpline-btn-text { position: relative; z-index: 1; }

/* ══════════════════════════════════════════════════
   LINK GRID
══════════════════════════════════════════════════ */
.rpf-grid {
  display: grid;
  grid-template-columns: 1.8fr 1fr 1.4fr 1fr;
  gap: 40px 32px;
}
@media (max-width: 1024px) { .rpf-grid { grid-template-columns: 1.4fr 1fr 1.2fr 1fr; gap: 32px 24px; } }
@media (max-width: 820px)  { .rpf-grid { grid-template-columns: 1fr 1fr; gap: 28px 20px; } }
@media (max-width: 520px)  { .rpf-grid { grid-template-columns: 1fr; gap: 28px; } }

.rpf-col {}

/* Brand column */
.rpf-brand-logo {
  font-family: 'Sora', Georgia, serif;
  font-weight: 800;
  font-size: 2rem;
  letter-spacing: -0.04em;
  color: rgba(255,255,255,0.92);
  margin-bottom: 12px;
  line-height: 1;
}
.rpf-brand-accent { color: var(--rpf-accent); }
.rpf-brand-desc {
  font-size: 12.5px;
  color: var(--rpf-text);
  line-height: 1.8;
  max-width: 290px;
  margin-bottom: 20px;
}

/* Blood type strip */
.rpf-blood-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 20px;
}
.rpf-blood-chip {
  font-size: 10px;
  font-weight: 700;
  font-family: 'Sora', serif;
  padding: 3px 9px;
  border-radius: 6px;
  background: rgba(196,30,58,0.15);
  border: 1px solid rgba(196,30,58,0.28);
  color: #ff8fa3;
  letter-spacing: 0.03em;
  transition: background 0.18s, border-color 0.18s;
  cursor: default;
}
.rpf-blood-chip:hover { background: rgba(196,30,58,0.28); border-color: rgba(196,30,58,0.5); color: #ffb3c4; }

/* Socials */
.rpf-socials { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
.rpf-social {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  border: 1px solid rgba(255,255,255,0.10);
  background: rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.48);
  text-decoration: none;
  transition: all 0.2s;
}
.rpf-social:hover {
  border-color: rgba(196,30,58,0.5);
  background: rgba(196,30,58,0.15);
  color: #ff8fa3;
  transform: translateY(-2px);
}

/* Compliance badges */
.rpf-badges { display: flex; flex-wrap: wrap; gap: 6px; }
.rpf-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 9.5px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 4px;
  background: rgba(74,222,128,0.08);
  border: 1px solid rgba(74,222,128,0.18);
  color: rgba(74,222,128,0.8);
  letter-spacing: 0.04em;
}

/* Column header */
.rpf-col-title {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.82);
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--rpf-border);
}

/* Link list */
.rpf-link-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 11px;
}
.rpf-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--rpf-text);
  text-decoration: none;
  font-size: 12.5px;
  font-weight: 400;
  line-height: 1.4;
  transition: color 0.18s, gap 0.18s;
  position: relative;
}
.rpf-link::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 0;
  height: 1px;
  background: rgba(220,160,150,0.6);
  transition: width 0.22s cubic-bezier(0.22,1,0.36,1);
}
.rpf-link:hover { color: var(--rpf-texth); gap: 9px; }
.rpf-link:hover::after { width: 100%; }
.rpf-link-arrow {
  font-size: 13px;
  color: rgba(196,30,58,0.6);
  flex-shrink: 0;
  transition: color 0.18s;
  line-height: 1;
}
.rpf-link:hover .rpf-link-arrow { color: var(--rpf-accent); }

/* ══════════════════════════════════════════════════
   BOTTOM BAR
══════════════════════════════════════════════════ */
.rpf-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.08) 80%, transparent);
  margin: 36px 0;
}
.rpf-bottom {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.rpf-bottom-left { display: flex; flex-direction: column; gap: 3px; }
.rpf-copy {
  font-size: 11px;
  color: rgba(255,255,255,0.24);
  margin: 0;
  line-height: 1.5;
}
.rpf-copy-dim { color: rgba(255,255,255,0.16); }

.rpf-bottom-center { text-align: center; }
.rpf-made-with {
  font-size: 12px;
  color: rgba(255,255,255,0.28);
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0;
}
.rpf-heart {
  color: var(--rpf-accent);
  display: inline-flex;
  align-items: center;
  animation: rpf-heartbeat 1.4s ease-in-out infinite;
}
@keyframes rpf-heartbeat {
  0%,100%{ transform:scale(1); }
  14%    { transform:scale(1.22); }
  28%    { transform:scale(1); }
  42%    { transform:scale(1.16); }
  70%    { transform:scale(1); }
}

/* Built by Ajay Kushwaha */
.rpf-bottom-right { text-align: right; }
.rpf-built-by {
  font-size: 11.5px;
  color: rgba(255,255,255,0.28);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  justify-content: flex-end;
}
.rpf-built-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  text-decoration: none;
  color: rgba(255,255,255,0.5);
  border-bottom: 1px solid transparent;
  transition: color 0.2s, border-color 0.2s, text-shadow 0.2s;
  padding-bottom: 1px;
}
.rpf-built-link:hover {
  color: var(--rpf-acl);
  border-color: rgba(232,41,74,0.5);
  text-shadow: 0 0 12px rgba(232,41,74,0.6);
}
.rpf-built-name {
  font-weight: 700;
  font-size: 12px;
  font-family: 'Sora', serif;
  letter-spacing: -0.01em;
}
.rpf-built-link svg {
  opacity: 0.55;
  transition: opacity 0.2s, transform 0.2s;
}
.rpf-built-link:hover svg { opacity: 1; transform: translate(1px,-1px); }

/* ══════════════════════════════════════════════════
   RESPONSIVE
══════════════════════════════════════════════════ */
@media (max-width: 820px) {
  .rpf-helpline { flex-direction: column; align-items: flex-start; }
  .rpf-helpline-btn { width: 100%; justify-content: center; }
  .rpf-stats-inner { gap: 0; }
  .rpf-stat { padding: 8px 16px; }
  .rpf-stat-val { font-size: 1.15rem; }
  .rpf-bottom { flex-direction: column; align-items: flex-start; gap: 10px; }
  .rpf-bottom-right { text-align: left; }
  .rpf-built-by { justify-content: flex-start; }
  .rpf-bottom-center { text-align: left; }
}
@media (max-width: 520px) {
  .rpf-stats-inner { justify-content: flex-start; overflow-x: auto; flex-wrap: nowrap; padding-bottom: 4px; scrollbar-width: none; }
  .rpf-stats-inner::-webkit-scrollbar { display: none; }
  .rpf-stat { min-width: 90px; }
  .rpf-live-badge { flex-shrink: 0; }
  .rpf-brand-logo { font-size: 1.6rem; }
  .rpf-helpline { padding: 16px; }
  .rpf-main { padding-bottom: 28px; }
}
@media (max-width: 380px) {
  .rpf-container { padding: 0 14px; }
  .rpf-col-title { font-size: 9px; }
  .rpf-link { font-size: 12px; }
}
    `}</style>
  );
}