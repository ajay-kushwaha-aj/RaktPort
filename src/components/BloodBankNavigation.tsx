import { cn } from '@/lib/utils';

export type TabType =
  | 'overview'
  | 'inventory'
  | 'appointments'
  | 'donations'
  | 'redemptions'
  | 'verify'
  | 'rtidVerify'
  | 'camps'
  | 'reports';

interface BloodBankNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  appointmentCount?: number;
  requestCount?: number;
}

const tabs: { id: TabType; label: string; icon: string; shortLabel?: string }[] = [
  { id: 'overview',     label: 'Overview',      icon: '📊' },
  { id: 'inventory',    label: 'Inventory',     icon: '🩸' },
  { id: 'appointments', label: 'Appointments',  icon: '📅', shortLabel: 'Appts' },
  { id: 'donations',    label: 'Donations',     icon: '📋' },
  { id: 'redemptions',  label: 'Redemptions',   icon: '🔄', shortLabel: 'Redeem' },
  { id: 'verify',       label: 'Verify',        icon: '✅' },
  { id: 'rtidVerify',   label: 'RTID',          icon: '🔍' },
  { id: 'camps',        label: 'Camps',         icon: '⛺' },
  { id: 'reports',      label: 'Reports',       icon: '📈' },
];

export const BloodBankNavigation = ({
  activeTab,
  onTabChange,
  appointmentCount = 0,
  requestCount = 0,
}: BloodBankNavigationProps) => {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
        .bbn-root {
          font-family:'DM Sans',sans-serif;
          background:#fff;
          border-bottom:1px solid rgba(139,0,0,0.08);
          box-shadow:0 2px 8px rgba(139,0,0,0.06);
          position:sticky; top:0; z-index:40;
        }
        .dark .bbn-root { background:#1a0505; border-bottom-color:rgba(255,255,255,0.08); }

        .bbn-scroll { display:flex; gap:2px; overflow-x:auto; padding:8px 12px; scrollbar-width:none; -ms-overflow-style:none; align-items:center; }
        .bbn-scroll::-webkit-scrollbar { display:none; }

        .bbn-tab {
          display:flex; align-items:center; gap:5px;
          padding:7px 14px;
          border-radius:10px;
          font-size:0.8rem; font-weight:500;
          cursor:pointer; border:none;
          white-space:nowrap;
          transition:all 0.22s cubic-bezier(0.4,0,0.2,1);
          position:relative;
          background:transparent;
          color:#6b7280;
          font-family:'DM Sans',sans-serif;
          flex-shrink:0;
        }
        .bbn-tab:hover:not(.bbn-active) {
          background:rgba(139,0,0,0.06);
          color:#8B0000;
          transform:translateY(-1px);
        }
        .bbn-active {
          background:linear-gradient(135deg,#8B0000,#b30000);
          color:#fff !important;
          font-weight:600;
          box-shadow:0 4px 12px rgba(139,0,0,0.3), 0 1px 3px rgba(139,0,0,0.2);
          transform:translateY(-1px);
        }
        .bbn-active .bbn-icon { filter:none; opacity:1; }
        .bbn-icon { font-size:0.9rem; line-height:1; opacity:0.7; transition:opacity 0.2s; }
        .bbn-tab:hover .bbn-icon { opacity:1; }

        .bbn-badge {
          min-width:17px; height:17px; padding:0 4px;
          background:#ef4444; border-radius:999px;
          font-size:9px; font-weight:800; color:#fff;
          display:flex; align-items:center; justify-content:center;
          animation:bbn-pop 0.3s cubic-bezier(0.68,-0.55,0.27,1.55);
        }
        .bbn-active .bbn-badge { background:rgba(255,255,255,0.25); }
        @keyframes bbn-pop { 0%{transform:scale(0);} 100%{transform:scale(1);} }

        @media(max-width:640px) {
          .bbn-tab { padding:6px 10px; font-size:0.73rem; }
          .bbn-label { display:none; }
          .bbn-label-short { display:inline !important; }
          .bbn-scroll { padding:6px 10px; gap:1px; }
        }
        .bbn-label-short { display:none; }
      `}</style>
      <nav className="bbn-root" aria-label="Blood Bank Navigation">
        <div className="container mx-auto max-w-7xl">
          <div className="bbn-scroll" role="tablist">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const badge =
                tab.id === 'appointments' ? appointmentCount :
                tab.id === 'donations'    ? requestCount     : 0;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onTabChange(tab.id)}
                  className={cn('bbn-tab', isActive && 'bbn-active')}
                >
                  <span className="bbn-icon">{tab.icon}</span>
                  <span className="bbn-label">{tab.label}</span>
                  {tab.shortLabel && <span className="bbn-label-short">{tab.shortLabel}</span>}
                  {badge > 0 && (
                    <span className="bbn-badge">{badge > 9 ? '9+' : badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
};