// src/components/Faqs.tsx
import { useState } from 'react';

const FAQS = [
  { q: "What is RaktPort?", a: <><strong>RaktPort</strong> is a digital infrastructure that enables <strong>location-independent blood donation and utilization</strong> through a unique <strong>RTID</strong> (RaktPort Transfusion ID) system.<br /><br />It allows a donor to donate at one place while the benefit can be utilized for a patient elsewhere.</> },
  { q: "How is RaktPort different from e-RaktKosh?", a: <><strong>e-RaktKosh</strong> → Manages blood inventory locally<br /><strong>RaktPort</strong> → Enables interoperable donation value transfer<br /><br />👉 <strong>Key difference:</strong><br />e-RaktKosh = <strong>Storage system</strong><br />RaktPort = <strong>Transfer system</strong></> },
  { q: "What is the RTID system?", a: <><strong>RTID</strong> (RaktPort Transfusion ID) is a unique, trackable digital ID assigned to each donation.<br /><br />It enables:<br />• Linking <strong>donor → donation → patient</strong><br />• Tracking usage across locations<br />• Creating a portable <strong>donation credit</strong></> },
  { q: "What does “eliminating geographical separation” mean?", a: <>It means: A donor <strong>does not need to be physically near</strong> the patient to help them.<br /><br />Example:<br />Donor donates in <strong>Delhi</strong><br />Patient needs blood in <strong>Lucknow</strong><br />👉 Through the RTID system, the contribution is <strong>digitally mapped and utilized</strong>.</> },
  { q: "Does RaktPort replace blood banks?", a: <><strong>No.</strong><br />Blood banks still <strong>collect, test, store, and transfuse</strong>.<br /><br />RaktPort only adds a <strong>coordination and tracking layer</strong> across locations.</> },
  { q: "Is this legally compliant?", a: <><strong>Yes</strong>, because:<br />• <strong>No physical transfer</strong> without hospital control<br />• <strong>No commercialization</strong><br />• Works within the <strong>voluntary donation framework</strong><br /><br />RaktPort manages tracking and allocation logic, <strong>not</strong> medical procedures.</> },
  { q: "How is transparency ensured?", a: <>Through RTID:<br />• Every donation is <strong>traceable</strong><br />• Every usage is <strong>recorded</strong><br />• There is <strong>no ambiguity</strong> in donor contribution.</> },
  { q: "What impact can this create?", a: <>• Removes dependency on <strong>donor location</strong><br />• Improves <strong>fairness in access</strong><br />• Enables <strong>national-level coordination</strong></> },
  { q: "What is the long-term vision?", a: <>To build a nationwide <strong>interoperable blood network</strong> where donations are <strong>not restricted by geography</strong>, but enabled through a <strong>unified digital tracking system</strong>.</> }
];

export function Faqs() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ marginBottom: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', padding: '24px 28px', border: '1px solid rgba(255,255,255,0.06)' }}>
      <h3 style={{ color: 'white', fontSize: '1.25rem', fontFamily: "'Sora', sans-serif", fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: 'var(--rp-primary)' }}>?</span> Frequently Asked Questions
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {FAQS.map((faq, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', transition: 'all 0.2s' }}>
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", textAlign: 'left', padding: 0 }}
            >
              {faq.q}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s', color: openFaq === i ? 'var(--rp-primary)' : 'rgba(255,255,255,0.4)', flexShrink: 0, marginLeft: '12px' }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div style={{ height: openFaq === i ? 'auto' : 0, overflow: 'hidden', opacity: openFaq === i ? 1 : 0, transition: 'all 0.3s' }}>
              <p style={{ margin: 0, paddingTop: '12px', color: 'rgba(255,255,255,0.5)', fontSize: '13px', lineHeight: 1.6 }}>{faq.a}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
