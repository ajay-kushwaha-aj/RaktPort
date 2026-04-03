import { Bell, LogOut, Droplet, MapPin } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import logo from '../assets/raktport-logo.png';

interface BloodBankHeaderProps {
  onNotificationClick: () => void;
  notificationCount: number;
  bloodRequestsCount: number;
  onLogout: () => void;
  location: string;
  bloodBankName?: string;
}

export const BloodBankHeader = ({
  onNotificationClick,
  notificationCount,
  bloodRequestsCount,
  onLogout,
  location,
  bloodBankName,
}: BloodBankHeaderProps) => {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap');
        .bbh-wrap { font-family:'DM Sans',sans-serif; background:linear-gradient(135deg,var(--rp-primary-dark) 0%,var(--header-cta) 55%,#9e0000 100%); position:relative; overflow:hidden; }
        .bbh-wrap::before { content:''; position:absolute; inset:0; background-image:radial-gradient(circle at 20% 50%, rgba(255,255,255,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.04) 0%, transparent 40%); pointer-events:none; }
        .bbh-wrap::after  { content:''; position:absolute; bottom:0; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent); }
        .bbh-brand { font-family:'Outfit',sans-serif; font-weight:800; font-size:1.3rem; color:#fff; letter-spacing:-0.025em; line-height:1; }
        @media(max-width:640px){ .bbh-brand{font-size:1.1rem;} }
        .bbh-logo-wrap { background:rgba(255,255,255,0.12); border:1.5px solid rgba(255,255,255,0.22); border-radius:13px; padding:5px; transition:all 0.3s; flex-shrink:0; }
        .bbh-logo-wrap:hover { background:rgba(255,255,255,0.2); transform:scale(1.04) rotate(-1deg); }
        .bbh-bank-pill { display:flex; align-items:center; gap:4px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.18); border-radius:999px; padding:2px 10px; font-size:0.72rem; color:rgba(255,210,190,0.92); font-weight:500; white-space:nowrap; max-width:220px; }
        .bbh-loc   { display:flex; align-items:center; gap:4px; font-size:0.7rem; color:rgba(255,255,255,0.55); font-weight:500; letter-spacing:0.05em; }
        .bbh-icon-btn { width:38px; height:38px; border-radius:10px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.18); display:flex; align-items:center; justify-content:center; cursor:pointer; color:#fff; transition:all 0.2s; position:relative; flex-shrink:0; }
        .bbh-icon-btn:hover { background:rgba(255,255,255,0.2); transform:translateY(-1px); }
        .bbh-notif-dot { position:absolute; top:-5px; right:-5px; min-width:17px; height:17px; padding:0 3px; background:#ff3737; border:2px solid var(--header-cta); border-radius:999px; font-size:8px; font-weight:800; color:#fff; display:flex; align-items:center; justify-content:center; animation:bbhb 1.4s ease-in-out infinite; }
        @keyframes bbhb { 0%,100%{transform:scale(1);} 50%{transform:scale(1.2);} }
        .bbh-req-pill { display:flex; align-items:center; gap:5px; background:rgba(255,60,60,0.2); border:1px solid rgba(255,130,100,0.3); border-radius:999px; padding:3px 10px 3px 5px; font-size:0.7rem; color:#ffc4b4; font-weight:600; animation:bbhglow 2s ease-in-out infinite; }
        @keyframes bbhglow { 0%,100%{box-shadow:0 0 0 0 rgba(255,80,60,0);} 50%{box-shadow:0 0 0 3px rgba(255,80,60,0.15);} }
        .bbh-logout { background:rgba(255,255,255,0.1); border:1.5px solid rgba(255,255,255,0.22); border-radius:9px; padding:6px 14px; color:#fff; font-size:0.78rem; font-weight:600; display:flex; align-items:center; gap:5px; cursor:pointer; transition:all 0.2s; font-family:'DM Sans',sans-serif; white-space:nowrap; }
        .bbh-logout:hover { background:rgba(255,70,70,0.3); border-color:rgba(255,130,120,0.4); transform:translateY(-1px); }
        .bbh-divider { width:1px; height:32px; background:rgba(255,255,255,0.15); flex-shrink:0; }
      `}</style>
      <header className="bbh-wrap sticky top-0 z-50 shadow-2xl">
        <div className="container mx-auto px-3 sm:px-5 max-w-7xl">
          <div className="flex items-center gap-2 sm:gap-3 py-3">

            {/* Logo + Brand */}
            <div className="bbh-logo-wrap">
              <img src={logo} alt="RaktPort" className="w-9 h-9 sm:w-11 sm:h-11 object-contain rounded-lg" />
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bbh-brand">RaktPort</span>
                <span className="text-[10px] font-semibold text-red-200/50 uppercase tracking-widest hidden sm:inline">Blood Bank</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {bloodBankName && (
                  <span className="bbh-bank-pill">
                    <Droplet className="w-2.5 h-2.5 fill-red-300 text-red-300 flex-shrink-0" />
                    <span className="truncate">{bloodBankName}</span>
                  </span>
                )}
                <span className="bbh-loc hidden sm:flex">
                  <MapPin className="w-2.5 h-2.5" />
                  {location || '…'}
                </span>
              </div>
            </div>

            <div className="bbh-divider hidden md:block" />

            {/* Pending requests */}
            {bloodRequestsCount > 0 && (
              <div className="bbh-req-pill hidden sm:flex">
                <span className="w-5 h-5 bg-[var(--clr-danger)] rounded-full flex items-center justify-center text-[9px] font-black text-[var(--txt-inverse)] flex-shrink-0">
                  {bloodRequestsCount > 9 ? '9+' : bloodRequestsCount}
                </span>
                Blood Requests
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-auto">
              <div className="hidden sm:block"><ModeToggle /></div>
              <button onClick={onNotificationClick} className="bbh-icon-btn" aria-label="Notifications">
                <Bell className="w-4 h-4" />
                {notificationCount > 0 && (
                  <span className="bbh-notif-dot">{notificationCount > 9 ? '9+' : notificationCount}</span>
                )}
              </button>
              <button onClick={onLogout} className="bbh-logout">
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Mobile location bar */}
          <div className="flex items-center gap-2 pb-2 sm:hidden">
            <MapPin className="w-3 h-3 text-red-200/40" />
            <span className="text-[11px] text-red-200/50">{location || '…'}</span>
            {bloodRequestsCount > 0 && (
              <span className="ml-auto text-[10px] font-bold bg-[var(--clr-danger)]/25 text-red-200 px-2 py-0.5 rounded-full">
                {bloodRequestsCount} Requests
              </span>
            )}
          </div>
        </div>
      </header>
    </>
  );
};