// src/admin/components/NotificationPanel.tsx
import React from 'react';
import { X, Bell, CheckCheck, Trash2, Info, AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { useNotificationStore, type Notification, type NotificationSeverity } from '../store/notificationStore';

const severityConfig: Record<NotificationSeverity, { icon: React.ElementType; color: string; bg: string }> = {
  info: { icon: Info, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
  warning: { icon: AlertTriangle, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
  critical: { icon: AlertOctagon, color: '#E8294A', bg: 'rgba(232,41,74,0.1)' },
  success: { icon: CheckCircle2, color: '#4ade80', bg: 'rgba(74,222,128,0.1)' },
};

const formatTime = (date: Date): string => {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const NotificationItem: React.FC<{ n: Notification }> = ({ n }) => {
  const cfg = severityConfig[n.severity];
  const Icon = cfg.icon;
  const { markRead } = useNotificationStore();

  return (
    <div
      onClick={() => markRead(n.id)}
      style={{
        display: 'flex',
        gap: 12,
        padding: '12px 16px',
        background: n.read ? 'transparent' : 'rgba(255,255,255,0.025)',
        borderBottom: '1px solid #1a0e10',
        cursor: 'pointer',
        transition: 'background 0.12s',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = n.read ? 'transparent' : 'rgba(255,255,255,0.025)';
      }}
    >
      {!n.read && (
        <div style={{
          position: 'absolute',
          left: 6,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#C41E3A',
        }} />
      )}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: cfg.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={15} color={cfg.color} />
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 13,
          fontWeight: n.read ? 400 : 600,
          color: n.read ? '#8a7a7d' : '#d0c0c4',
          margin: '0 0 2px 0',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {n.title}
        </p>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 12,
          color: '#6a5a5d',
          margin: '0 0 4px 0',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {n.message}
        </p>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#4a3a3d' }}>
          {formatTime(n.timestamp)}
        </span>
      </div>
    </div>
  );
};

export const NotificationPanel: React.FC = () => {
  const { notifications, panelOpen, closePanel, markAllRead, clearAll } = useNotificationStore();

  return (
    <>
      {/* Backdrop */}
      {panelOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 59,
          }}
          onClick={closePanel}
        />
      )}

      {/* Slide-in panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 360,
          background: '#0e0809',
          borderLeft: '1px solid #1a0e10',
          zIndex: 60,
          display: 'flex',
          flexDirection: 'column',
          transform: panelOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: panelOpen ? '-8px 0 24px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        {/* Header */}
        <div style={{
          height: 60,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 16px',
          borderBottom: '1px solid #1a0e10',
          flexShrink: 0,
        }}>
          <Bell size={16} color="#C41E3A" />
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: '#e0d0d4', flex: 1 }}>
            Notifications
          </span>

          {notifications.length > 0 && (
            <>
              <button
                onClick={markAllRead}
                title="Mark all read"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 5, color: '#5a4a4d', transition: 'color 0.15s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#60a5fa'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#5a4a4d'; }}
              >
                <CheckCheck size={15} />
              </button>
              <button
                onClick={clearAll}
                title="Clear all"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 5, color: '#5a4a4d', transition: 'color 0.15s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#E8294A'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#5a4a4d'; }}
              >
                <Trash2 size={15} />
              </button>
            </>
          )}

          <button
            onClick={closePanel}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 5, borderRadius: 5, color: '#5a4a4d', transition: 'color 0.15s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#e0d0d4'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#5a4a4d'; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 12,
              color: '#4a3a3d',
            }}>
              <Bell size={36} />
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#5a4a4d', margin: 0 }}>
                No notifications yet
              </p>
            </div>
          ) : (
            notifications.map((n) => <NotificationItem key={n.id} n={n} />)
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div style={{
            padding: '10px 16px',
            borderTop: '1px solid #1a0e10',
            textAlign: 'center',
            flexShrink: 0,
          }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#4a3a3d', margin: 0 }}>
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationPanel;
