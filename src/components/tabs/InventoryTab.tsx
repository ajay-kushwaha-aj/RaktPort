import { Inventory } from '@/types/bloodbank';
import {
  BLOOD_GROUPS,
  getInventoryStatus,
  getStatusLabel,
} from '@/lib/bloodbank-utils';
import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, TrendingDown, Droplet, Package, ShieldAlert } from 'lucide-react';

interface InventoryTabProps {
  inventory: Inventory;
}

/* ─── Blood Bag SVG Card ─────────────────────────────── */
function BloodBagCard({
  bg,
  available,
  total,
  status,
  index,
}: {
  bg: string;
  available: number;
  total: number;
  status: 'good' | 'low' | 'critical';
  index: number;
}) {
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), index * 90);
    return () => clearTimeout(t);
  }, [index]);

  const reserved = total - available;
  const fillPct = total > 0 ? Math.min((available / total) * 100, 100) : 0;

  const palette = {
    good: {
      primary: '#16a34a',
      glow: 'rgba(22,163,74,0.25)',
      bagFill: '#dcfce7',
      liquidGrad1: '#22c55e',
      liquidGrad2: '#16a34a',
      bubbleColor: 'rgba(255,255,255,0.5)',
      badge: 'bg-green-100 text-green-700 border-green-200',
      ring: 'rgba(22,163,74,0.12)',
    },
    low: {
      primary: '#d97706',
      glow: 'rgba(217,119,6,0.25)',
      bagFill: '#fef9c3',
      liquidGrad1: '#fbbf24',
      liquidGrad2: '#d97706',
      bubbleColor: 'rgba(255,255,255,0.4)',
      badge: 'bg-amber-100 text-amber-700 border-amber-200',
      ring: 'rgba(217,119,6,0.12)',
    },
    critical: {
      primary: '#dc2626',
      glow: 'rgba(220,38,38,0.3)',
      bagFill: '#fef2f2',
      liquidGrad1: '#f87171',
      liquidGrad2: '#dc2626',
      bubbleColor: 'rgba(255,255,255,0.35)',
      badge: 'bg-red-100 text-red-700 border-red-200',
      ring: 'rgba(220,38,38,0.15)',
    },
  };

  const p = palette[status];
  const uniqId = `bb-${bg.replace('+', 'p').replace('-', 'n')}-${index}`;

  return (
    <div
      className="inv-bag-wrapper"
      style={{
        opacity: animate ? 1 : 0,
        transform: animate ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.92)',
        transitionDelay: `${index * 0.08}s`,
      }}
    >
      {/* Glow ring */}
      <div
        className="inv-glow-ring"
        style={{
          boxShadow: `0 0 28px ${p.glow}, 0 6px 20px rgba(0,0,0,0.06)`,
          borderColor: p.ring,
        }}
      />

      {/* Blood Bag SVG */}
      <svg
        viewBox="0 0 160 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="inv-bag-svg"
      >
        <defs>
          {/* Liquid gradient */}
          <linearGradient id={`liquid-${uniqId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.liquidGrad1} stopOpacity="0.85" />
            <stop offset="100%" stopColor={p.liquidGrad2} stopOpacity="0.95" />
          </linearGradient>
          {/* Bag body gradient */}
          <linearGradient id={`bag-${uniqId}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="100%" stopColor={p.bagFill} stopOpacity="0.9" />
          </linearGradient>
          {/* Clip for the liquid fill */}
          <clipPath id={`clip-${uniqId}`}>
            <rect x="30" y="52" width="100" height="120" rx="14" />
          </clipPath>
          {/* Wave filter */}
          <filter id={`wave-${uniqId}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.02 0.06" numOctaves="3" seed={index * 7}>
              <animate
                attributeName="baseFrequency"
                dur="8s"
                values="0.02 0.06;0.03 0.08;0.02 0.06"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" scale="4" />
          </filter>
        </defs>

        {/* Tube connector on top */}
        <rect x="70" y="7" width="20" height="18" rx="4" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1" />
        <rect x="76" y="0" width="8" height="10" rx="3" fill="#d1d5db" />

        {/* Bag body (outer) */}
        <rect
          x="28" y="28" width="104" height="148" rx="18"
          fill={`url(#bag-${uniqId})`}
          stroke={p.primary}
          strokeWidth="2.2"
          strokeOpacity="0.35"
        />

        {/* Inner bag area */}
        <rect x="30" y="52" width="100" height="120" rx="14" fill="#f8fafc" fillOpacity="0.5" />

        {/* Liquid fill (clipped) */}
        <g clipPath={`url(#clip-${uniqId})`}>
          {/* Filled portion based on available */}
          <rect
            x="30"
            y={52 + 120 * (1 - fillPct / 100)}
            width="100"
            height={120 * (fillPct / 100)}
            fill={`url(#liquid-${uniqId})`}
            style={{ transition: 'y 1.2s cubic-bezier(0.4,0,0.2,1), height 1.2s cubic-bezier(0.4,0,0.2,1)' }}
          />
          {/* Wave surface */}
          <ellipse
            cx="80"
            cy={52 + 120 * (1 - fillPct / 100)}
            rx="52"
            ry="5"
            fill={p.liquidGrad1}
            fillOpacity="0.35"
            filter={`url(#wave-${uniqId})`}
            style={{ transition: 'cy 1.2s cubic-bezier(0.4,0,0.2,1)' }}
          />
          {/* Bubbles */}
          {fillPct > 10 && (
            <>
              <circle cx="55" cy={140} r="3" fill={p.bubbleColor}>
                <animate attributeName="cy" values={`${155};${80};${155}`} dur="4.5s" repeatCount="indefinite" />
                <animate attributeName="r" values="3;2;3" dur="4.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0.2;0.6" dur="4.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="95" cy={130} r="2.5" fill={p.bubbleColor}>
                <animate attributeName="cy" values={`${150};${90};${150}`} dur="5.5s" repeatCount="indefinite" />
                <animate attributeName="r" values="2.5;1.5;2.5" dur="5.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0.15;0.5" dur="5.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="75" cy={145} r="2" fill={p.bubbleColor}>
                <animate attributeName="cy" values={`${160};${85};${160}`} dur="6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0.1;0.4" dur="6s" repeatCount="indefinite" />
              </circle>
            </>
          )}
        </g>

        {/* Cross on bag (+) */}
        <rect x="74" y="33" width="12" height="4" rx="2" fill={p.primary} fillOpacity="0.35" />
        <rect x="78" y="29" width="4" height="12" rx="2" fill={p.primary} fillOpacity="0.35" />

        {/* Drip tube at bottom */}
        <path
          d={`M80 176 Q80 195 70 205`}
          stroke={p.primary}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeOpacity="0.3"
        />
        {/* Drip drop */}
        <path
          d="M70 205 C70 205 66 211 66 214 A4 4 0 0 0 74 214 C74 211 70 205 70 205Z"
          fill={p.primary}
          fillOpacity="0.4"
        >
          <animate attributeName="opacity" values="0.4;0.15;0.4" dur="2.5s" repeatCount="indefinite" />
        </path>

        {/* Blood group label on bag */}
        <text
          x="80"
          y="106"
          textAnchor="middle"
          fontFamily="'Outfit', 'Sora', sans-serif"
          fontSize="28"
          fontWeight="900"
          fill={p.primary}
          opacity="0.9"
        >
          {bg}
        </text>
      </svg>

      {/* Data overlay below bag */}
      <div className="inv-bag-data">
        <div className="inv-bag-units" style={{ color: p.primary }}>
          {available}
          <span className="inv-bag-units-label">units</span>
        </div>
        <div className="inv-bag-meta">
          <span>Total: {total}</span>
          <span className="inv-bag-sep">·</span>
          <span>Reserved: {reserved}</span>
        </div>
        <div className={`inv-bag-badge ${p.badge}`}>
          {status === 'good' && <CheckCircle2 size={11} />}
          {status === 'low' && <TrendingDown size={11} />}
          {status === 'critical' && <AlertTriangle size={11} />}
          {getStatusLabel(status)}
        </div>
        {/* Fill bar */}
        <div className="inv-bag-bar">
          <div
            className="inv-bag-bar-fill"
            style={{
              width: `${fillPct}%`,
              background: `linear-gradient(90deg, ${p.liquidGrad1}, ${p.liquidGrad2})`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Main Tab ─────────────────────────────────────── */
export const InventoryTab = ({ inventory }: InventoryTabProps) => {
  const totalUnits = BLOOD_GROUPS.reduce((s, bg) => s + (inventory[bg]?.total || 0), 0);
  const availableUnits = BLOOD_GROUPS.reduce((s, bg) => s + (inventory[bg]?.available || 0), 0);
  const criticalCount = BLOOD_GROUPS.filter(bg => getInventoryStatus(inventory[bg]?.available || 0, inventory[bg]?.total || 0) === 'critical').length;

  return (
    <>
      <style>{inventoryStyles}</style>
      <div className="inv-root">
        {/* Header */}
        <div className="inv-header">
          <div className="inv-header-left">
            <div className="inv-header-icon">
              <Droplet size={22} />
            </div>
            <div>
              <h2 className="inv-title">Blood Inventory</h2>
              <p className="inv-subtitle">Real-time blood stock management</p>
            </div>
          </div>
          {/* Summary pills */}
          <div className="inv-summary-pills">
            <div className="inv-pill">
              <Package size={14} />
              <span className="inv-pill-val">{totalUnits}</span>
              <span className="inv-pill-label">Total</span>
            </div>
            <div className="inv-pill inv-pill-green">
              <CheckCircle2 size={14} />
              <span className="inv-pill-val">{availableUnits}</span>
              <span className="inv-pill-label">Available</span>
            </div>
            {criticalCount > 0 && (
              <div className="inv-pill inv-pill-red">
                <ShieldAlert size={14} />
                <span className="inv-pill-val">{criticalCount}</span>
                <span className="inv-pill-label">Critical</span>
              </div>
            )}
          </div>
        </div>

        {/* Blood Bag Grid */}
        <div className="inv-bag-grid">
          {BLOOD_GROUPS.map((bg, i) => {
            const item = inventory[bg] || { total: 0, available: 0 };
            const status = getInventoryStatus(item.available, item.total);
            return (
              <BloodBagCard
                key={bg}
                bg={bg}
                available={item.available}
                total={item.total}
                status={status}
                index={i}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="inv-legend">
          <h3 className="inv-legend-title">Stock Level Thresholds</h3>
          <div className="inv-legend-items">
            <div className="inv-legend-item">
              <div className="inv-legend-dot" style={{ background: '#dc2626' }} />
              <span>Critical: &lt; 30 units</span>
            </div>
            <div className="inv-legend-item">
              <div className="inv-legend-dot" style={{ background: '#d97706' }} />
              <span>Low: 30–50 units</span>
            </div>
            <div className="inv-legend-item">
              <div className="inv-legend-dot" style={{ background: '#16a34a' }} />
              <span>Good: &gt; 50 units</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/* ═══ STYLES ═══ */
const inventoryStyles = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');

.inv-root {
  padding: 4px 0;
}

/* Header */
.inv-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 28px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #fff 0%, #fdfcfa 100%);
  border-radius: 20px;
  border: 1px solid rgba(139,0,0,0.08);
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}
.dark .inv-header {
  background: linear-gradient(135deg, #111827 0%, #0f172a 100%);
  border-color: rgba(255,255,255,0.07);
}
.inv-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.inv-header-icon {
  width: 46px; height: 46px;
  border-radius: 14px;
  background: linear-gradient(135deg, #fee2e2, #fecaca);
  display: flex; align-items: center; justify-content: center;
  color: #b91c1c;
  box-shadow: 0 2px 10px rgba(185,28,28,0.15);
}
.dark .inv-header-icon {
  background: linear-gradient(135deg, #7f1d1d, #991b1b);
  color: #fca5a5;
}
.inv-title {
  font-family: 'Outfit', 'Sora', sans-serif;
  font-size: 1.5rem;
  font-weight: 800;
  color: #1a0a0a;
  letter-spacing: -0.02em;
}
.dark .inv-title { color: #fff5f5; }
.inv-subtitle {
  font-size: 0.78rem;
  color: #9ca3af;
  margin-top: 2px;
}

/* Summary pills */
.inv-summary-pills {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.inv-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 12px;
  background: #f8f5f5;
  border: 1px solid rgba(0,0,0,0.06);
  font-family: 'Outfit', sans-serif;
  color: #374151;
  transition: all 0.2s;
}
.inv-pill:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.dark .inv-pill {
  background: rgba(255,255,255,0.05);
  border-color: rgba(255,255,255,0.08);
  color: #d1d5db;
}
.inv-pill-green { background: #f0fdf4; border-color: rgba(22,163,74,0.15); color: #166534; }
.dark .inv-pill-green { background: rgba(22,163,74,0.1); color: #86efac; }
.inv-pill-red { background: #fef2f2; border-color: rgba(220,38,38,0.15); color: #991b1b; }
.dark .inv-pill-red { background: rgba(220,38,38,0.1); color: #fca5a5; }
.inv-pill-val {
  font-weight: 800;
  font-size: 1rem;
}
.inv-pill-label {
  font-size: 0.72rem;
  font-weight: 500;
  opacity: 0.7;
}

/* Blood Bag Grid */
.inv-bag-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
@media (max-width: 1024px) { .inv-bag-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px)  { .inv-bag-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; } }

/* Blood Bag Wrapper */
.inv-bag-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 12px 16px;
  border-radius: 24px;
  background: #ffffff;
  border: 1.5px solid rgba(0,0,0,0.06);
  box-shadow: 0 4px 16px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.06);
  transition: all 0.45s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  overflow: hidden;
}
.dark .inv-bag-wrapper {
  background: #111827;
  border-color: rgba(255,255,255,0.07);
}
.inv-bag-wrapper:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 16px 40px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.06);
}
.inv-bag-wrapper:hover .inv-bag-svg {
  transform: scale(1.04);
}

/* Glow ring */
.inv-glow-ring {
  position: absolute;
  inset: -1px;
  border-radius: 24px;
  border: 2px solid;
  opacity: 0;
  transition: opacity 0.35s;
  pointer-events: none;
}
.inv-bag-wrapper:hover .inv-glow-ring {
  opacity: 1;
}

/* SVG */
.inv-bag-svg {
  width: 130px;
  height: 180px;
  transition: transform 0.4s cubic-bezier(0.4,0,0.2,1);
  margin-bottom: 8px;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.08));
}
@media (max-width: 480px) {
  .inv-bag-svg { width: 100px; height: 140px; }
}

/* Data section below bag */
.inv-bag-data {
  text-align: center;
  width: 100%;
  padding: 0 4px;
}
.inv-bag-units {
  font-family: 'Outfit', sans-serif;
  font-size: 2rem;
  font-weight: 900;
  line-height: 1;
  margin-bottom: 4px;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 5px;
}
.inv-bag-units-label {
  font-size: 0.7rem;
  font-weight: 600;
  opacity: 0.6;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.inv-bag-meta {
  font-size: 0.68rem;
  color: #9ca3af;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}
.inv-bag-sep { opacity: 0.4; }
.inv-bag-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  border: 1px solid;
  margin-bottom: 8px;
}

/* Fill bar */
.inv-bag-bar {
  width: 100%;
  height: 4px;
  background: rgba(0,0,0,0.06);
  border-radius: 10px;
  overflow: hidden;
}
.dark .inv-bag-bar { background: rgba(255,255,255,0.08); }
.inv-bag-bar-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 1.2s cubic-bezier(0.4,0,0.2,1);
}

/* Legend */
.inv-legend {
  margin-top: 28px;
  padding: 18px 22px;
  background: #fafaf8;
  border-radius: 16px;
  border: 1px solid rgba(0,0,0,0.06);
}
.dark .inv-legend {
  background: rgba(255,255,255,0.03);
  border-color: rgba(255,255,255,0.06);
}
.inv-legend-title {
  font-size: 0.72rem;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 12px;
}
.inv-legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}
.inv-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: #374151;
  font-weight: 500;
}
.dark .inv-legend-item { color: #d1d5db; }
.inv-legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
}

/* Critical pulsing */
@keyframes inv-pulse-critical {
  0%, 100% { box-shadow: 0 4px 16px rgba(220,38,38,0.08); }
  50% { box-shadow: 0 4px 24px rgba(220,38,38,0.2), 0 0 0 4px rgba(220,38,38,0.06); }
}
`;