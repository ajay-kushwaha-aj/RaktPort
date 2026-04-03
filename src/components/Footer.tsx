// src/components/Footer.tsx
import { Faqs } from './Faqs';

export function Footer() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');

        .rp-footer { font-family: 'Plus Jakarta Sans', sans-serif; }
        .rp-footer *, .rp-footer *::before, .rp-footer *::after { box-sizing: border-box; }
        .rp-footer-brand { font-family: 'Sora', sans-serif; font-weight: 800; letter-spacing: -0.04em; }

        .rp-flink {
          color: rgba(255,255,255,0.52); text-decoration: none; font-size: 13px;
          line-height: 1.5; transition: color 0.18s; display: inline-block;
          position: relative; padding-bottom: 1px;
        }
        .rp-flink::after {
          content:''; position:absolute; bottom:0; left:0;
          width:0; height:1px; background:rgba(220,160,150,0.7); transition:width 0.22s;
        }
        .rp-flink:hover { color: rgba(255,255,255,0.95); }
        .rp-flink:hover::after { width: 100%; }

        .rp-fcol-title {
          font-size: 10.5px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
          color: rgba(255,255,255,0.88); margin-bottom: 16px; padding-bottom: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .rp-social {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 5px 13px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.18);
          color: rgba(255,255,255,0.62); font-size: 12px; font-weight: 500;
          transition: all 0.2s; text-decoration: none;
          background: rgba(255,255,255,0.04); font-family:'Plus Jakarta Sans',sans-serif;
        }
        .rp-social:hover { border-color: rgba(255,180,160,0.5); color: white; background: rgba(255,255,255,0.1); }

        .rp-helpline {
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px; padding: 18px 20px;
          display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px;
          margin-bottom: 36px;
        }

        /* Responsive grid */
        .rp-footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1.6fr 1fr;
          gap: 32px 24px;
        }
        @media (max-width: 900px) {
          .rp-footer-grid { grid-template-columns: 1fr 1fr; gap: 28px 20px; }
        }
        @media (max-width: 480px) {
          .rp-footer-grid { grid-template-columns: 1fr; gap: 24px; }
        }

        .rp-bottom-bar {
          display: flex; flex-wrap: wrap; align-items: center;
          justify-content: space-between; gap: 10px;
        }
      `}</style>

      <footer className="rp-footer" style={{ borderTop: '3px solid var(--footer-accent)', background: 'var(--footer-bg)' }}>

        <div className="container mx-auto px-4" style={{ paddingTop:50, paddingBottom:32 }}>

          {/* FAQ Section Extracted */}
          <Faqs />

          {/* Emergency helpline strip */}
          <div className="rp-helpline">
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:'50%', background:'rgba(192,57,43,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:'1.1rem' }}>📞</span>
              </div>
              <div>
                <p style={{ color:'white', fontWeight:700, fontSize:'0.85rem', lineHeight:1, margin:0 }}>24/7 Blood Emergency Helpline</p>
                <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'11.5px', marginTop:4, margin:0 }}>Connect instantly to the nearest blood bank anywhere in India</p>
              </div>
            </div>
            <a href="tel:1800-180-1104"
              style={{ color:'white', fontWeight:800, fontSize:'1rem', textDecoration:'none', background:'linear-gradient(135deg,var(--footer-accent),var(--rp-primary))', padding:'9px 20px', borderRadius:999, boxShadow:'0 3px 12px rgba(139,0,0,0.45)', whiteSpace:'nowrap', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              1800-180-1104
            </a>
          </div>

          {/* Main grid */}
          <div className="rp-footer-grid">

            {/* Brand */}
            <div>
              <div className="rp-footer-brand" style={{ fontSize:'2rem', color:'white', marginBottom:10 }}>
                Rakt<span style={{ color:'var(--rp-primary)' }}>Port</span>
              </div>
              <p style={{ fontSize:'12.5px', color:'rgba(255,255,255,0.4)', lineHeight:1.75, maxWidth:280, marginBottom:20 }}>
                India's National Digital Blood Donation & Management System — connecting donors, blood banks, and hospitals to save lives.
              </p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                <a href="#" className="rp-social" aria-label="Facebook">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Facebook
                </a>
                <a href="#" className="rp-social" aria-label="Twitter">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  Twitter
                </a>
                <a href="#" className="rp-social" aria-label="Instagram">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  Instagram
                </a>
              </div>
            </div>

            {/* About */}
            <div>
              <div className="rp-fcol-title">About Us</div>
              <ul style={{ listStyle:'none', margin:0, padding:0, display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  { label:'About RaktPort', href:'/about.html' },
                  { label:'Our Mission', href:'/our-mission.html' },
                  { label:'Contact Us', href:'/contact.html' },
                ].map(item => (
                  <li key={item.label}><a href={item.href} className="rp-flink">{item.label}</a></li>
                ))}
              </ul>
            </div>

            {/* Important Links */}
            <div>
              <div className="rp-fcol-title">Important Links</div>
              <ul style={{ listStyle:'none', margin:0, padding:0, display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  { label:'Ayushman Bharat Digital Mission', href:'https://abdm.gov.in/' },
                  { label:'E-Raktkosh', href:'https://eraktkosh.mohfw.gov.in/eraktkoshPortal/' },
                  { label:'National AIDS Control Org.', href:'https://naco.gov.in/' },
                  { label:'World Health Organisation', href:'https://www.who.int/' },
                  { label:'Ministry of Health & FW', href:'https://mohfw.gov.in/' },
                  { label:'National Health Authority', href:'https://nha.gov.in/' },
                ].map(item => (
                  <li key={item.label}><a href={item.href} className="rp-flink" target="_blank" rel="noopener noreferrer">{item.label}</a></li>
                ))}
              </ul>
            </div>

            {/* Policies + Explore */}
            <div>
              <div className="rp-fcol-title">Policies</div>
              <ul style={{ listStyle:'none', margin:0, padding:0, display:'flex', flexDirection:'column', gap:10, marginBottom:22 }}>
                {[
                  { label:'Terms & Conditions', href:'/terms.html' },
                  { label:'Privacy Policy', href:'/privacy.html' },
                  { label:'Blood Donation Guidelines', href:'/blood-guidelines.html' },
                ].map(item => (
                  <li key={item.label}><a href={item.href} className="rp-flink">{item.label}</a></li>
                ))}
              </ul>

              <div className="rp-fcol-title">Explore</div>
              <ul style={{ listStyle:'none', margin:0, padding:0, display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  { label:'Donate Blood', href:'#' },
                  { label:'Find Blood Bank', href:'/bloodcenter.html' },
                ].map(item => (
                  <li key={item.label}><a href={item.href} className="rp-flink">{item.label}</a></li>
                ))}
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height:1, background:'rgba(255,255,255,0.08)', margin:'32px 0' }} />

          {/* Bottom bar */}
          <div className="rp-bottom-bar">
            <p style={{ fontSize:'11.5px', color:'rgba(255,255,255,0.28)', margin:0 }}>
              © 2025 RaktPort — National Digital Blood Donation & Management System
            </p>
            <p style={{ fontSize:'11.5px', color:'rgba(255,255,255,0.28)', margin:0 }}>
              Website Content Managed by RaktPort Team
            </p>
            <p style={{ fontSize:'11.5px', color:'rgba(255,255,255,0.28)', margin:0, display:'flex', alignItems:'center', gap:5 }}>
              Made with <span style={{ color:'var(--rp-primary)', fontSize:'1rem' }}>♥</span> for India
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}