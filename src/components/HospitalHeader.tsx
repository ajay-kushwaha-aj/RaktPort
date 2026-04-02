import { Bell, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HospitalHeaderProps {
    onNotificationClick: () => void;
    notificationCount: number;
    onLogout: () => void;
    hospitalName: string;
}

export const HospitalHeader = ({
    onNotificationClick,
    notificationCount,
    onLogout,
    hospitalName,
}: HospitalHeaderProps) => {
    return (
        <header className="bg-primary text-primary-foreground py-4 shadow-xl relative z-50">
            <div className="container mx-auto px-4 flex justify-between items-center max-w-7xl">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary-foreground rounded-full flex items-center justify-center font-bold text-xl text-primary">
                        RS
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">RaktPort Hospital Dashboard</h1>
                        <p className="text-sm opacity-90">
                            {hospitalName || 'Loading Hospital...'} 🏥
                        </p>
                    </div>
                </div>
                <div className="flex space-x-3 items-center">
                    <Button
                        onClick={onNotificationClick}
                        variant="ghost"
                        size="icon"
                        className="relative bg-primary hover:bg-primary-dark text-primary-foreground rounded-full"
                        aria-label="Notifications"
                    >
                        <Bell className="w-5 h-5" />
                        {notificationCount > 0 && (
                            <span className="absolute top-1 right-1 w-3 h-3 bg-[var(--clr-emergency)] rounded-full border-2 border-white"></span>
                        )}
                    </Button>

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
