// ═══════════════════════════════════════════════════════════
// Cookie Consent Banner — GDPR/Privacy compliant
// ═══════════════════════════════════════════════════════════
import { useState, useEffect } from 'react';
import { Cookie, Shield, X, ChevronDown, ChevronUp } from 'lucide-react';

type ConsentLevel = 'all' | 'essential' | null;

const COOKIE_KEY = 'raktport-cookie-consent';
const COOKIE_EXPIRY_DAYS = 365;

function getCookieConsent(): ConsentLevel {
  try {
    const v = localStorage.getItem(COOKIE_KEY);
    if (v === 'all' || v === 'essential') return v;
  } catch (_) { }
  return null;
}

function setCookieConsent(level: ConsentLevel) {
  if (level) {
    localStorage.setItem(COOKIE_KEY, level);
    // Set actual cookie for server-side detection
    const expires = new Date(Date.now() + COOKIE_EXPIRY_DAYS * 86400000).toUTCString();
    document.cookie = `raktport_consent=${level}; expires=${expires}; path=/; SameSite=Lax`;
  }
}

export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);

  useEffect(() => {
    const consent = getCookieConsent();
    if (!consent) {
      const t = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const handleAccept = (level: ConsentLevel) => {
    setCookieConsent(level);
    setAnimateOut(true);
    setTimeout(() => setShow(false), 400);
  };

  if (!show) return null;

  return (
    <div
      id="cookie-consent-banner"
      className={`fixed bottom-0 left-0 right-0 z-[9998] transition-all duration-400 ${animateOut ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100 animate-in slide-in-from-bottom-8'
        }`}
    >
      <div className="max-w-2xl mx-auto p-4 pb-6 sm:pb-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Main bar */}
          <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Icon + Text */}
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-md">
                <Cookie className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                  🍪 We use cookies
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                  We use cookies to improve your experience, remember your preferences, and keep you logged in securely.
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
              <button
                onClick={() => handleAccept('essential')}
                className="flex-1 sm:flex-initial text-xs font-medium px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Essential Only
              </button>
              <button
                onClick={() => handleAccept('all')}
                className="flex-1 sm:flex-initial text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B0000] to-[#a01010] text-white hover:from-[#7a0000] hover:to-[#900e0e] shadow-md transition active:scale-95"
              >
                Accept All
              </button>
            </div>
          </div>

          {/* Expandable details */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-4 py-2 flex items-center justify-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition border-t border-gray-100 dark:border-gray-800"
          >
            {expanded ? 'Hide' : 'Show'} details
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {expanded && (
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-3 animate-in slide-in-from-top-2 duration-200">
              {[
                {
                  name: 'Essential',
                  required: true,
                  icon: <Shield className="w-4 h-4 text-green-600" />,
                  desc: 'Login sessions, security tokens, and user preferences. These cannot be disabled.',
                },
                {
                  name: 'Functional',
                  required: false,
                  icon: <Cookie className="w-4 h-4 text-amber-500" />,
                  desc: 'Remember your dashboard settings, theme preference, and last viewed page.',
                },
                {
                  name: 'Analytics',
                  required: false,
                  icon: <Cookie className="w-4 h-4 text-blue-500" />,
                  desc: 'Anonymous usage data to help us improve the platform. No personal data is shared.',
                },
              ].map((c) => (
                <div key={c.name} className="flex items-start gap-2.5 text-xs">
                  <div className="mt-0.5">{c.icon}</div>
                  <div>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {c.name}
                      {c.required && (
                        <span className="ml-1.5 text-[10px] bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                          Required
                        </span>
                      )}
                    </span>
                    <p className="text-gray-500 dark:text-gray-400 mt-0.5">{c.desc}</p>
                  </div>
                </div>
              ))}

              <p className="text-[10px] text-gray-400 pt-1">
                By continuing to use RaktPort, you agree to our{' '}
                <a href="/privacy.html" className="underline hover:text-[#8B0000]" target="_blank">Privacy Policy</a>{' '}
                and{' '}
                <a href="/terms.html" className="underline hover:text-[#8B0000]" target="_blank">Terms of Service</a>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Hook to check if a specific consent type is granted */
export function useCookieConsent(): { consent: ConsentLevel; hasAnalytics: boolean; hasFunctional: boolean } {
  const consent = getCookieConsent();
  return {
    consent,
    hasAnalytics: consent === 'all',
    hasFunctional: consent === 'all',
  };
}
