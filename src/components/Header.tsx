// src/components/Header.tsx
import { useState, useEffect, useCallback } from 'react';
import { X, Menu, Globe } from 'lucide-react';
import raktportLogo from '../assets/raktport-logo.png';
import { ModeToggle } from './mode-toggle';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu';

interface HeaderProps {
  onLoginClick?: () => void;
  onSignupClick?: () => void;
}

export function Header({ onLoginClick, onSignupClick }: HeaderProps) {
  const [language, setLanguage]           = useState<'EN' | 'HI'>('EN');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile]           = useState(false);

  /* Responsive breakpoint via JS (avoids Tailwind purge issues) */
  useEffect(() => {
    const check = () => {
      const m = window.innerWidth < 768;
      setIsMobile(m);
      if (!m) setMobileMenuOpen(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const toggleLanguage = useCallback(() => setLanguage(p => (p === 'EN' ? 'HI' : 'EN')), []);

  const t = {
    tagline:     language === 'EN' ? 'Donate Blood Anywhere · Save Lives Everywhere' : 'कहीं भी रक्तदान करें · जीवन बचाएं',
    home:        language === 'EN' ? 'Home'              : 'होम',
    about:       language === 'EN' ? 'About'             : 'हमारे बारे में',
    donor:       language === 'EN' ? 'Become a Donor'    : 'दाता बनें',
    eligibility: language === 'EN' ? 'Eligibility Rules' : 'पात्रता नियम',
    camp:        language === 'EN' ? 'Find Donation Camp': 'शिविर खोजें',
    login:       language === 'EN' ? 'Login / Register'  : 'लॉगिन / रजिस्टर',
  };

  const marqueeItems = (
    <>
      <span style={{ display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap' }}>
        <span>⚠</span><strong>BETA:</strong>&nbsp;This website is currently under development. Experiences may vary.
      </span>
      <span style={{ whiteSpace:'nowrap', margin:'0 44px', opacity:0.28 }}>✦</span>
      <span style={{ display:'flex', alignItems:'center', gap:5, whiteSpace:'nowrap' }}>
        <span>🚧</span><strong>MAINTENANCE:</strong>&nbsp;Scheduled every Sunday 2:00–4:00 AM IST.
      </span>
      <span style={{ whiteSpace:'nowrap', margin:'0 44px', opacity:0.28 }}>✦</span>
    </>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

        .rph * { font-family:'Plus Jakarta Sans',sans-serif; box-sizing:border-box; }
        .rph-brand { font-family:'Sora',sans-serif; font-weight:800; letter-spacing:-0.04em; }

        /* ── Marquee ── */
        @keyframes rph-mq { from { transform:translateX(0); } to { transform:translateX(-50%); } }
        .rph-mtrack { display:flex; width:max-content; animation:rph-mq 42s linear infinite; align-items:center; }
        .rph-mwrap  { overflow:hidden; }
        .rph-mwrap:hover .rph-mtrack { animation-play-state:paused; }

        /* ── Language button ── */
        .rph-lang {
          display:inline-flex; align-items:center; gap:5px; padding:5px 13px;
          border-radius:999px; border:1.5px solid #e0d0ca; background:white;
          color:#5a4a42; font-size:11.5px; font-weight:600; cursor:pointer;
          transition:all 0.18s; font-family:'Plus Jakarta Sans',sans-serif; white-space:nowrap;
        }
        .rph-lang:hover { border-color:var(--header-cta); color:var(--header-cta); }

        /* ── Tagline — always visible, shrinks gracefully ── */
        .rph-tagline {
          font-size:10px; font-weight:500; color:#8a7070;
          margin-top:3px; letter-spacing:0.02em;
          overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
          max-width:min(340px, 44vw);
        }
        @media(max-width:400px) { .rph-tagline { max-width:140px; font-size:9px; } }
        @media(max-width:320px) { .rph-tagline { display:none; } }

        /* ── Desktop nav pills — override NavigationMenu defaults ── */
        .rph-nav-root { background:transparent !important; max-width:none !important; }
        .rph-nav-root ul { gap:0 !important; background:transparent !important; }
        /* Hide empty dropdown viewport */
        .rph-nav-root > div:last-child { display:none !important; }

        .rph-pill {
          color:rgba(255,255,255,0.82); font-size:0.75rem; font-weight:500;
          letter-spacing:0.05em; padding:10px 13px; border-radius:6px;
          transition:color 0.18s,background 0.18s; white-space:nowrap;
          cursor:pointer; border:none; background:transparent;
          font-family:'Plus Jakarta Sans',sans-serif; text-transform:uppercase;
          text-decoration:none; display:inline-flex; align-items:center;
          line-height:1;
        }
        .rph-pill:hover { color:#fff; background:rgba(255,255,255,0.13); }

        /* ── Login button ── */
        .rph-login {
          background:white; color:var(--header-cta); font-size:0.75rem; font-weight:700;
          padding:8px 20px; border-radius:999px; letter-spacing:0.03em;
          transition:all 0.2s; white-space:nowrap; border:none; cursor:pointer;
          box-shadow:0 2px 8px rgba(0,0,0,0.14); font-family:'Plus Jakarta Sans',sans-serif;
        }
        .rph-login:hover { background:#fff0ee; box-shadow:0 4px 14px rgba(0,0,0,0.18); }

        /* ── Mobile nav items ── */
        .rph-mob {
          display:block; width:100%; text-align:left; color:rgba(255,255,255,0.85);
          font-size:0.85rem; font-weight:500; padding:11px 16px; border-radius:8px;
          cursor:pointer; border:none; background:transparent;
          transition:color 0.15s,background 0.15s;
          font-family:'Plus Jakarta Sans',sans-serif; text-decoration:none;
        }
        .rph-mob:hover { color:white; background:rgba(255,255,255,0.1); }

        /* ══════ DARK MODE ══════ */
        .dark .rph-brand-bar { background:#1a1a1a !important; border-color:#2a2a2a !important; }
        .dark .rph-brand { color:#ff6b6b !important; }
        .dark .rph-tagline { color:#9a8a82 !important; }
        .dark .rph-lang { background:#2a2a2a !important; border-color:#3a3a3a !important; color:#c0a8a0 !important; }
        .dark .rph-lang:hover { border-color:var(--header-cta) !important; color:#ff6b6b !important; }
        .dark .rph-mwrap { background:#1c1a14 !important; border-color:#3a3520 !important; }
        .dark .rph-mtrack { color:#b89a30 !important; }
        .dark .rph-logo-wrap { border-color:#2a2a2a !important; background:#1a1a1a !important; }
        .dark .rph-hamburger { border-color:#3a3a3a !important; color:#c0392b !important; background:#1e1e1e !important; }
      `}</style>

      <header className="rph" style={{ position:'sticky', top:0, zIndex:50, boxShadow:'0 2px 12px rgba(0,0,0,0.1)' }}>

        {/* ─ Marquee ─ */}
        <div className="rph-mwrap" style={{ background:'#fffbeb', borderBottom:'1px solid #fde68a', padding:'5px 0' }}>
          <div className="rph-mtrack" style={{ fontSize:11, color:'#78350f', fontWeight:500 }}>{marqueeItems}{marqueeItems}</div>
        </div>

        {/* ─ Brand bar ─ */}
        <div className="rph-brand-bar" style={{ background:'white', borderBottom:'1px solid #ede5e0' }}>
          <div className="container mx-auto" style={{ padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>

            {/* Logo + Name */}
            <div 
              style={{ display:'flex', alignItems:'center', gap:12, minWidth:0, cursor:'pointer' }}
              onClick={() => window.location.href = '/'}
              title="Go to Home"
            >
              <div className="rph-logo-wrap" style={{ width:44, height:44, borderRadius:12, overflow:'hidden', border:'1.5px solid #f0e4e0', boxShadow:'0 2px 8px rgba(0,0,0,0.07)', background:'white', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <img src={raktportLogo} alt="RaktPort" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
              </div>
              <div style={{ minWidth:0 }}>
                <div className="rph-brand" style={{ fontSize:'1.5rem', color:'var(--header-cta)', lineHeight:1 }}>RaktPort</div>
                {/* Tagline — always rendered, hides only below 320px */}
                <p className="rph-tagline">{t.tagline}</p>
              </div>
            </div>

            {/* Language + Mode + Hamburger */}
            <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
              <button onClick={toggleLanguage} className="rph-lang" aria-label="Toggle language">
                <Globe size={12}/>{language === 'EN' ? 'हिंदी' : 'EN'}
              </button>
              <ModeToggle />
              {isMobile && (
                <button
                  className="rph-hamburger"
                  onClick={() => setMobileMenuOpen(v => !v)}
                  aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={mobileMenuOpen}
                  style={{ padding:8, borderRadius:8, border:'1.5px solid #e8ddd5', color:'var(--header-cta)', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
                >
                  {mobileMenuOpen ? <X size={20}/> : <Menu size={20}/>}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─ Nav bar ─ */}
        <nav style={{ background:'var(--header-bg)', borderLeft:'3px solid var(--header-accent)' }} aria-label="Main navigation">
          <div className="container mx-auto" style={{ padding:'0 16px' }}>

            {/* Desktop */}
            {!isMobile && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                {/* NavigationMenu for desktop links */}
                <NavigationMenu className="rph-nav-root">
                  <NavigationMenuList style={{ gap:0, padding:0, margin:0 }}>
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <button onClick={() => window.location.href='/'} className="rph-pill">{t.home}</button>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <NavigationMenuLink href="/about.html" className="rph-pill">{t.about}</NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <button onClick={onSignupClick} className="rph-pill">{t.donor}</button>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <NavigationMenuLink href="/Donation-eligibility-rules.html" className="rph-pill">{t.eligibility}</NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <NavigationMenuLink href="/bloodcenter.html" className="rph-pill">{t.camp}</NavigationMenuLink>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
                {onLoginClick && (
                  <button onClick={onLoginClick} className="rph-login" style={{ margin:'8px 0' }}>{t.login}</button>
                )}
              </div>
            )}

            {/* Mobile drawer */}
            {isMobile && mobileMenuOpen && (
              <div style={{ borderTop:'1px solid rgba(255,255,255,0.15)', padding:'8px 0' }}>
                <button onClick={() => { window.location.href='/'; setMobileMenuOpen(false); }} className="rph-mob">{t.home}</button>
                <a href="/about.html" className="rph-mob">{t.about}</a>
                <button onClick={() => { onSignupClick?.(); setMobileMenuOpen(false); }} className="rph-mob">{t.donor}</button>
                <a href="/Donation-eligibility-rules.html" className="rph-mob">{t.eligibility}</a>
                <a href="/bloodcenter.html" className="rph-mob">{t.camp}</a>
                {onLoginClick && (
                  <button
                    onClick={() => { onLoginClick(); setMobileMenuOpen(false); }}
                    style={{ width:'100%', marginTop:8, background:'white', color:'var(--header-cta)', fontSize:'0.85rem', fontWeight:700, padding:'11px 16px', borderRadius:10, border:'none', cursor:'pointer', fontFamily:"'Plus Jakarta Sans',sans-serif" }}
                  >
                    {t.login}
                  </button>
                )}
              </div>
            )}
          </div>
        </nav>
      </header>
    </>
  );
}