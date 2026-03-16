import { Notification } from '@/types/bloodbank';
import { cn } from '@/lib/utils';
import { formatDate, formatTime } from '@/lib/bloodbank-utils';

interface NotificationDrawerProps {
  isOpen: boolean;
  notifications: Notification[];
  onClose: () => void;
}

export const NotificationDrawer = ({
  isOpen,
  notifications,
  onClose,
}: NotificationDrawerProps) => {
  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-success/10 border-l-success';
      case 'warning':
        return 'bg-warning/10 border-l-warning';
      case 'error':
        return 'bg-destructive/10 border-l-destructive';
      default:
        return 'bg-info/10 border-l-info';
    }
  };

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        className={cn(
          'fixed top-[72px] right-3 w-80 max-h-[78vh] bg-card rounded-xl shadow-2xl z-50 overflow-auto transition-all duration-300',
          isOpen
            ? 'translate-x-0 opacity-100'
            : 'translate-x-[110%] opacity-0 pointer-events-none'
        )}
        role="region"
        aria-label="Notifications Drawer"
      >
        <div className="p-4 border-b border-border">
          <h3 className="text-xl font-bold text-foreground flex items-center">
            🔔 Notifications
          </h3>
        </div>
        {notifications.length > 0 ? (
          <ul className="divide-y divide-border">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={cn(
                  'p-4 border-l-4 hover:bg-accent/50 transition-colors',
                  getTypeColor(notification.type)
                )}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">{getTypeIcon(notification.type)}</span>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(notification.timestamp)} at{' '}
                      {formatTime(notification.timestamp)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No new notifications.
          </div>
        )}
      </div>
    </>
  );
};
