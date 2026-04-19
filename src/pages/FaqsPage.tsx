import React, { useState, useMemo } from 'react';
import { FAQS } from '../components/Faqs';

// Helper to extract text from simple JSX nodes the FAQS use (like <><strong>...</strong>...</>)
const extractTextFromReactNode = (node: any): string => {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractTextFromReactNode).join(' ');
  if (node && node.props && node.props.children) {
    return extractTextFromReactNode(node.props.children);
  }
  return '';
};

export function FaqsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Scroll to top when this page opens
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return FAQS;
    const query = searchQuery.toLowerCase();
    return FAQS.filter(faq => {
      const qMatch = faq.q.toLowerCase().includes(query);
      const aText = extractTextFromReactNode(faq.a).toLowerCase();
      return qMatch || aText.includes(query);
    });
  }, [searchQuery]);

  return (
    <div className="w-full bg-[#020617] min-h-[80vh] text-white font-['DM_Sans',sans-serif]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4" style={{ fontFamily: "'Sora', serif", color: '#fff', letterSpacing: '-0.03em' }}>
            <span style={{ color: 'var(--rp-primary, #C41E3A)' }}>?</span> Frequently Asked Questions
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)' }} className="text-lg">Find answers to common questions about RaktPort.</p>
        </div>
        
        {/* Search Box */}
        <div className="mb-12 relative w-full max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-4 border border-[rgba(255,255,255,0.1)] rounded-2xl leading-5 bg-[rgba(255,255,255,0.03)] text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[var(--rp-primary)] focus:border-[var(--rp-primary)] sm:text-[16px] transition duration-150 ease-in-out shadow-lg"
            placeholder="Search questions or answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* FAQs List */}
        <div className="space-y-4">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px', transition: 'all 0.2s' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.92)', fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Sora', serif", textAlign: 'left', padding: 0 }}
                >
                  {faq.q}
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s', color: openFaq === i ? 'var(--rp-primary, #C41E3A)' : 'rgba(255,255,255,0.4)', flexShrink: 0, marginLeft: '16px' }}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <div style={{ height: openFaq === i ? 'auto' : 0, overflow: 'hidden', opacity: openFaq === i ? 1 : 0, transition: 'all 0.3s' }}>
                  <p style={{ margin: 0, paddingTop: '16px', color: 'rgba(255,255,255,0.6)', fontSize: '15px', lineHeight: 1.8, fontFamily: "'DM Sans', sans-serif" }}>{faq.a}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 text-gray-400">
              <svg className="mx-auto h-12 w-12 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-300">No results found</h3>
              <p className="mt-1">We couldn't find any FAQs matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
