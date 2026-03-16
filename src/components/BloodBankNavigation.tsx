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
}

const tabs: { id: TabType; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'inventory', label: 'Inventory', icon: '🩸' },
  { id: 'appointments', label: 'Appointments', icon: '📅' },
  { id: 'donations', label: 'Donations', icon: '📜' },
  { id: 'redemptions', label: 'Redemptions', icon: '🔄' },
  { id: 'verify', label: 'Verify', icon: '✅' },
  { id: 'rtidVerify', label: 'RTID', icon: '🔍' },
  { id: 'camps', label: 'Camps', icon: '⛺' },
  { id: 'reports', label: 'Reports', icon: '📄' },
];

export const BloodBankNavigation = ({
  activeTab,
  onTabChange,
}: BloodBankNavigationProps) => {
  return (
    <div className="bg-card shadow-md border-b border-border sticky top-0 z-40">
      <div className="container mx-auto px-4 max-w-7xl">
        <nav
          className="flex justify-between items-center py-2"
          aria-label="Main Navigation"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex-1 px-2 py-2 font-semibold border-b-3 rounded-t-lg inline-flex gap-1 items-center justify-center transition-all hover:bg-muted/50 text-xs sm:text-sm',
                activeTab === tab.id
                  ? 'border-b-primary text-primary bg-primary/5'
                  : 'border-b-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <span className="hidden sm:inline">{tab.icon}</span>
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};