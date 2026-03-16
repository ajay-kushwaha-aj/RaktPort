import { Bell, LogOut, Droplet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';

interface BloodBankHeaderProps {
  onNotificationClick: () => void;
  notificationCount: number;
  bloodRequestsCount: number;
  onLogout: () => void;
  location: string;
}

export const BloodBankHeader = ({
  onNotificationClick,
  notificationCount,
  bloodRequestsCount,
  onLogout,
  location,
}: BloodBankHeaderProps) => {
  return (
    <header className="bg-primary text-primary-foreground py-4 shadow-xl relative z-50">
      <div className="container mx-auto px-4 flex justify-between items-center max-w-7xl">
        <div className="flex items-center space-x-3">
          {/* Fixed Logo with proper icon */}
          <div className="w-12 h-12 bg-primary-foreground rounded-full flex items-center justify-center shadow-lg">
            <Droplet className="w-7 h-7 text-primary fill-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">RaktPort Blood Bank Dashboard</h1>
            <p className="text-sm opacity-90 flex items-center gap-1">
              <span>📍</span>
              <span>{location || 'Loading location...'}</span>
            </p>
          </div>
        </div>
        <div className="flex space-x-3 items-center">
          <ModeToggle />

          <Button
            onClick={onNotificationClick}
            variant="ghost"
            size="icon"
            className="relative bg-primary hover:bg-primary/80 text-primary-foreground rounded-full"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-primary-foreground text-xs font-bold flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </Button>

          {bloodRequestsCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-full font-semibold text-sm border border-red-200">
              <span className="text-xs">🩸 Requests:</span>
              <span className="font-bold">{bloodRequestsCount}</span>
            </div>
          )}

          <Button
            onClick={onLogout}
            variant="secondary"
            className="flex items-center font-semibold"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};