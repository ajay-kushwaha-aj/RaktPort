/**
 * RtidVerifyTab.tsx — RaktPort v5
 * Auto-detects RTID type from prefix: D-RTID → Donor, RH-RTID / RU-RTID → Hospital/User request
 * No dropdown — just type or scan and the system figures it out.
 */

import { useState, useEffect } from 'react';
import { Search, QrCode, Droplet, Hospital, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface RtidVerifyTabProps {
  onVerifyRtid: (rtid: string) => void;
}

type DetectedType = 'D-RTID' | 'RH-RTID' | 'RU-RTID' | null;

function detectRtidType(value: string): DetectedType {
  const v = value.trim().toUpperCase();
  if (v.startsWith('D-RTID') || v.startsWith('D-')) return 'D-RTID';
  if (v.startsWith('RH-RTID') || v.startsWith('RH-')) return 'RH-RTID';
  if (v.startsWith('RU-RTID') || v.startsWith('RU-')) return 'RU-RTID';
  return null;
}

const TYPE_META: Record<string, { label: string; desc: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  'D-RTID': {
    label: 'Donor RTID',
    desc: 'Verifies donor blood credit & donation status',
    color: '#C41E3A',
    bg: '#fff5f5',
    border: '#fca5a5',
    icon: <Droplet size={16} />,
  },
  'RH-RTID': {
    label: 'Hospital Request RTID',
    desc: 'Verifies hospital blood request & patient info',
    color: '#1d4ed8',
    bg: '#eff6ff',
    border: '#93c5fd',
    icon: <Hospital size={16} />,
  },
  'RU-RTID': {
    label: 'User Request RTID',
    desc: 'Verifies user blood request linked to a patient',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#c4b5fd',
    icon: <User size={16} />,
  },
};

export const RtidVerifyTab = ({ onVerifyRtid }: RtidVerifyTabProps) => {
  const [rtidValue, setRtidValue] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [detected, setDetected] = useState<DetectedType>(null);

  useEffect(() => {
    setDetected(detectRtidType(rtidValue));
  }, [rtidValue]);

  const handleVerify = () => {
    const trimmed = rtidValue.trim();
    if (!trimmed) {
      toast.error('Please enter an RTID');
      return;
    }
    if (!detected) {
      toast.warning('Unrecognized RTID format', {
        description: 'RTID should start with D-RTID, RH-RTID, or RU-RTID',
      });
    }
    onVerifyRtid(trimmed.toUpperCase());
  };

  const handleQRScan = () => {
    setIsScanning(true);
    toast.info('QR Scanner opening…', { description: 'Position QR code in front of camera' });
    setTimeout(() => {
      setIsScanning(false);
      toast.success('QR Code scanned successfully');
    }, 2000);
  };

  const meta = detected ? TYPE_META[detected] : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Oxanium:wght@700;800&display=swap');

        .rtv-root {
          max-width: 680px;
          margin: 0 auto;
          font-family: 'Sora', sans-serif;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* ── Page title ── */
        .rtv-title {
          text-align: center;
          padding: 8px 0 4px;
        }
        .rtv-title h2 {
          font-family: 'Oxanium', monospace;
          font-size: 1.7rem;
          font-weight: 800;
          color: #111827;
          margin: 0 0 6px;
        }
        .dark .rtv-title h2 { color: #f0f4ff; }
        .rtv-title p {
          font-size: 0.82rem;
          color: #6b7280;
          margin: 0;
        }
        .dark .rtv-title p { color: #94a3b8; }

        /* ── Card ── */
        .rtv-card {
          background: #ffffff;
          border: 1.5px solid #f0e0e0;
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04);
          border-top: 4px solid #C41E3A;
        }
        .dark .rtv-card {
          background: #1e293b;
          border-color: rgba(255,255,255,0.08);
        }

        /* ── Input section ── */
        .rtv-input-label {
          display: block;
          font-size: 0.82rem;
          font-weight: 700;
          color: #374151;
          margin-bottom: 8px;
          letter-spacing: 0.01em;
        }
        .dark .rtv-input-label { color: #e2e8f0; }

        .rtv-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .rtv-input {
          width: 100%;
          height: 52px;
          border-radius: 14px;
          border: 2px solid #e5e7eb;
          padding: 0 52px 0 16px;
          font-family: 'Oxanium', monospace;
          font-size: 0.95rem;
          font-weight: 600;
          color: #111827;
          background: #fafafa;
          outline: none;
          transition: all 0.2s;
          letter-spacing: 0.02em;
        }
        .rtv-input::placeholder {
          font-family: 'Sora', sans-serif;
          font-weight: 400;
          color: #c4cdd6;
          font-size: 0.82rem;
          letter-spacing: 0;
        }
        .rtv-input:focus {
          border-color: #C41E3A;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(196,30,58,0.08);
        }
        .dark .rtv-input {
          background: #0f172a;
          border-color: rgba(255,255,255,0.12);
          color: #f0f4ff;
        }
        .dark .rtv-input:focus {
          border-color: #f87171;
          box-shadow: 0 0 0 4px rgba(248,113,113,0.1);
        }

        .rtv-qr-btn {
          position: absolute;
          right: 8px;
          width: 36px; height: 36px;
          border-radius: 10px;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          color: #6b7280;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .rtv-qr-btn:hover {
          background: #fff0f1;
          border-color: rgba(196,30,58,0.3);
          color: #C41E3A;
        }
        .dark .rtv-qr-btn {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.1);
          color: #94a3b8;
        }

        /* ── Auto-detected type pill ── */
        .rtv-detected {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1.5px solid;
          transition: all 0.3s ease;
          animation: rtv-pop 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes rtv-pop {
          from { transform: scale(0.95); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
        .rtv-detected-icon {
          width: 34px; height: 34px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .rtv-detected-label {
          flex: 1;
          min-width: 0;
        }
        .rtv-detected-label strong {
          display: block;
          font-size: 0.88rem;
          font-weight: 700;
        }
        .rtv-detected-label span {
          font-size: 0.72rem;
          opacity: 0.8;
        }
        .rtv-detected-chip {
          font-size: 0.62rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 999px;
          letter-spacing: 0.04em;
          font-family: 'Oxanium', monospace;
          flex-shrink: 0;
        }

        /* ── Unknown format warning ── */
        .rtv-unknown {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: #fffbeb;
          border: 1px solid #fcd34d;
          border-radius: 12px;
          font-size: 0.78rem;
          color: #92400e;
          animation: rtv-pop 0.3s ease;
        }
        .dark .rtv-unknown {
          background: rgba(251,191,36,0.08);
          border-color: rgba(251,191,36,0.25);
          color: #fbbf24;
        }

        /* ── Info box ── */
        .rtv-info-box {
          background: #f8fbff;
          border: 1px solid #dbeafe;
          border-radius: 14px;
          padding: 16px 18px;
        }
        .dark .rtv-info-box {
          background: rgba(59,130,246,0.05);
          border-color: rgba(59,130,246,0.15);
        }
        .rtv-info-box h4 {
          font-size: 0.82rem;
          font-weight: 700;
          color: #1e40af;
          margin: 0 0 10px;
          display: flex; align-items: center; gap: 7px;
        }
        .dark .rtv-info-box h4 { color: #60a5fa; }
        .rtv-info-types {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }
        .rtv-info-type-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          font-size: 0.78rem;
        }
        .rtv-info-type-item .rtv-type-tag {
          font-family: 'Oxanium', monospace;
          font-size: 0.72rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 6px;
          flex-shrink: 0;
          min-width: 80px;
          text-align: center;
        }
        .rtv-info-type-item .rtv-type-desc {
          color: #4b5563;
          font-size: 0.75rem;
        }
        .dark .rtv-info-type-item .rtv-type-desc { color: #94a3b8; }

        /* ── Verify button ── */
        .rtv-verify-btn {
          width: 100%;
          height: 52px;
          border-radius: 14px;
          background: linear-gradient(135deg, #C41E3A, #8b0000);
          border: none;
          color: #fff;
          font-family: 'Sora', sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 9px;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(196,30,58,0.3);
          letter-spacing: 0.01em;
        }
        .rtv-verify-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #a0142e, #6b0000);
          box-shadow: 0 8px 22px rgba(196,30,58,0.4);
          transform: translateY(-2px);
        }
        .rtv-verify-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          transform: none;
        }

        /* ── Scanning state ── */
        .rtv-scanning-card {
          background: #0f172a;
          border-radius: 18px;
          padding: 32px;
          text-align: center;
          color: #fff;
          animation: rtv-pulse 1.5s ease-in-out infinite;
        }
        @keyframes rtv-pulse { 0%,100%{opacity:1} 50%{opacity:0.75} }
      `}</style>

      <div className="rtv-root">

        {/* Title */}
        <div className="rtv-title">
          <h2>RTID Verification</h2>
          <p>Enter or scan an RTID — the system auto-detects the type</p>
        </div>

        {/* Main card */}
        <div className="rtv-card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Input */}
            <div>
              <label className="rtv-input-label" htmlFor="rtidInput">
                Enter or Scan RTID
              </label>
              <div className="rtv-input-wrap">
                <input
                  id="rtidInput"
                  type="text"
                  className="rtv-input"
                  value={rtidValue}
                  onChange={e => setRtidValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleVerify()}
                  placeholder="e.g. D-RTID-15042026-A1234, RH-RTID-…, RU-RTID-…"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  className="rtv-qr-btn"
                  onClick={handleQRScan}
                  disabled={isScanning}
                  title="Scan QR Code"
                >
                  <QrCode size={16} className={isScanning ? 'animate-pulse' : ''} />
                </button>
              </div>
              <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 6 }}>
                Supports D-RTID (donors), RH-RTID (hospital requests), RU-RTID (user requests)
              </p>
            </div>

            {/* Auto-detected type */}
            {rtidValue.trim().length > 3 && (
              meta ? (
                <div
                  className="rtv-detected"
                  style={{ background: meta.bg, borderColor: meta.border, color: meta.color }}
                >
                  <div
                    className="rtv-detected-icon"
                    style={{ background: meta.color + '1a', color: meta.color }}
                  >
                    {meta.icon}
                  </div>
                  <div className="rtv-detected-label" style={{ color: meta.color }}>
                    <strong>{meta.label}</strong>
                    <span>{meta.desc}</span>
                  </div>
                  <span
                    className="rtv-detected-chip"
                    style={{ background: meta.color + '18', color: meta.color, border: `1px solid ${meta.border}` }}
                  >
                    {detected}
                  </span>
                  <CheckCircle2 size={18} style={{ color: meta.color, flexShrink: 0 }} />
                </div>
              ) : (
                <div className="rtv-unknown">
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>Unrecognized format. Start with <strong>D-RTID</strong>, <strong>RH-RTID</strong>, or <strong>RU-RTID</strong></span>
                </div>
              )
            )}

            {/* Verify button */}
            <button
              className="rtv-verify-btn"
              onClick={handleVerify}
              disabled={!rtidValue.trim() || isScanning}
            >
              <Search size={18} />
              {detected ? `Verify ${detected}` : 'Verify RTID'}
            </button>
          </div>
        </div>

        {/* Info box */}
        <div className="rtv-info-box">
          <h4>
            <span>ℹ️</span> RTID Types — Auto-detected from prefix
          </h4>
          <div className="rtv-info-types">
            {Object.entries(TYPE_META).map(([key, m]) => (
              <div
                key={key}
                className="rtv-info-type-item"
                style={{ background: m.bg, border: `1px solid ${m.border}` }}
              >
                <span className="rtv-type-tag" style={{ background: m.color + '18', color: m.color, border: `1px solid ${m.border}` }}>
                  {key}
                </span>
                <span className="rtv-type-desc">{m.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scanning overlay */}
        {isScanning && (
          <div className="rtv-scanning-card">
            <QrCode size={56} style={{ margin: '0 auto 14px', color: '#C41E3A' }} className="animate-spin" />
            <p style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 4px' }}>Scanning QR Code…</p>
            <p style={{ fontSize: '0.8rem', opacity: 0.6, margin: 0 }}>Position the code within frame</p>
          </div>
        )}
      </div>
    </>
  );
};