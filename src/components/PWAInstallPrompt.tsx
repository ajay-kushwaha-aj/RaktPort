// ═══════════════════════════════════════════════════════════
// PWA Install Prompt — Works on Android, iOS, Desktop
// ═══════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react';
import { X, Download, Share, Plus, Smartphone, Monitor, ChevronUp } from 'lucide-react';

// ── Types ──
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Platform = 'android' | 'ios' | 'desktop' | 'unknown';

// ── Helpers ──
function getPlatform(): Platform {
  const ua = navigator.userAgent || '';
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  if (/Windows|Macintosh|Linux/.test(ua) && !('ontouchstart' in window)) return 'desktop';
  return 'unknown';
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

// ── Component ──
export function PWAInstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Don't show if already installed or dismissed recently
    if (isStandalone()) return;
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 86400000) return; // 7 days

    setPlatform(getPlatform());

    // Android/Desktop — capture beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 2000); // Show after 2s delay
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS — show after delay (no native API)
    const p = getPlatform();
    if (p === 'ios') {
      const t = setTimeout(() => setShow(true), 3000);
      return () => { clearTimeout(t); window.removeEventListener('beforeinstallprompt', handler); };
    }

    // If on desktop/android but prompt doesn't fire (might already be installable or unsupported),
    // show anyway after 5s  
    const fallbackTimer = setTimeout(() => {
      if (!deferredPrompt && (p === 'desktop' || p === 'android')) {
        setShow(true);
      }
    }, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (platform === 'ios') {
      setShowIOSGuide(true);
      return;
    }
    if (!deferredPrompt) return;

    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShow(false);
      }
    } catch (_) {}
    setInstalling(false);
    setDeferredPrompt(null);
  }, [deferredPrompt, platform]);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (!show) return null;

  const PlatformIcon = platform === 'ios' ? Smartphone : platform === 'android' ? Smartphone : Monitor;

  return (
    <>
      {/* ── Main Install Banner ── */}
      <div
        id="pwa-install-banner"
        className="fixed bottom-4 left-4 right-4 z-[9999] animate-in slide-in-from-bottom-6 duration-500"
        style={{ maxWidth: 420, margin: '0 auto' }}
      >
        <div className="relative bg-gradient-to-br from-[var(--clr-brand)] via-[#a01010] to-[#6a0000] text-[var(--txt-inverse)] rounded-2xl shadow-2xl overflow-hidden border border-white/10">
          {/* Shimmer accent */}
          <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_30%,rgba(255,255,255,0.08)_50%,transparent_70%)] pointer-events-none" />

          {/* Close */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 rounded-full bg-[var(--clr-bg-card)]/10 hover:bg-[var(--clr-bg-card)]/20 transition"
            aria-label="Dismiss install prompt"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-4 pr-10 flex items-center gap-3.5">
            {/* App icon */}
            <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg bg-[var(--clr-bg-card)]/10">
              <img src="/icon-192.png" alt="RaktPort" className="w-full h-full object-cover" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                Install RaktPort
                <PlatformIcon className="w-3.5 h-3.5 opacity-60" />
              </h3>
              <p className="text-[11px] text-red-100/80 mt-0.5 leading-snug">
                {platform === 'ios'
                  ? 'Add to Home Screen for the best experience'
                  : 'Get instant access, offline support & faster loading'}
              </p>
            </div>

            {/* Install button */}
            <button
              onClick={handleInstall}
              disabled={installing}
              className="flex-shrink-0 bg-[var(--clr-bg-card)] text-[var(--clr-brand)] font-bold text-xs px-4 py-2 rounded-xl hover:bg-red-50 active:scale-95 transition-all shadow-md disabled:opacity-60"
            >
              {installing ? (
                <span className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="62" strokeDashoffset="20" /></svg>
                  Installing…
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  Install
                </span>
              )}
            </button>
          </div>

          {/* Feature chips */}
          <div className="px-4 pb-3 flex gap-2 flex-wrap">
            {['⚡ Fast', '📴 Offline', '🔔 Notifications'].map((f) => (
              <span key={f} className="text-[10px] bg-[var(--clr-bg-card)]/10 px-2 py-0.5 rounded-full border border-white/5">
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── iOS Guide Modal ── */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-end justify-center p-4 animate-in fade-in duration-300" onClick={() => setShowIOSGuide(false)}>
          <div
            className="bg-[var(--clr-bg-card)] dark:bg-gray-900 rounded-t-2xl rounded-b-xl w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-400"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[var(--clr-brand)] to-[#a01010] text-[var(--txt-inverse)] px-5 py-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white/20 bg-[var(--clr-bg-card)]/10">
                <img src="/icon-192.png" alt="RaktPort" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-base">Install RaktPort</h3>
                <p className="text-xs text-red-100/80">Follow these steps on Safari</p>
              </div>
              <button onClick={() => setShowIOSGuide(false)} className="ml-auto p-1.5 rounded-full bg-[var(--clr-bg-card)]/10 hover:bg-[var(--clr-bg-card)]/20">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Steps */}
            <div className="p-5 space-y-4">
              {[
                { icon: <Share className="w-5 h-5" />, step: '1', text: 'Tap the', bold: 'Share', after: 'button in Safari toolbar' },
                { icon: <ChevronUp className="w-5 h-5" />, step: '2', text: 'Scroll down and tap', bold: '"Add to Home Screen"', after: '' },
                { icon: <Plus className="w-5 h-5" />, step: '3', text: 'Tap', bold: '"Add"', after: 'in the top-right corner' },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--clr-brand)]/10 flex items-center justify-center flex-shrink-0 text-[var(--clr-brand)]">
                    {s.icon}
                  </div>
                  <div className="pt-1">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {s.text} <strong className="text-[var(--clr-brand)]">{s.bold}</strong> {s.after}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* iOS Safari bar indicator */}
            <div className="px-5 pb-5">
              <div className="bg-[var(--clr-bg-page)] dark:bg-gray-800 rounded-xl p-3 text-center">
                <p className="text-[11px] text-[var(--txt-body)]">
                  💡 This works best in <strong>Safari</strong>. Chrome on iOS doesn't support Add to Home Screen.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
