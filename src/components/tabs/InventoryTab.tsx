import { Inventory } from '@/types/bloodbank';
import {
  BLOOD_GROUPS,
  getInventoryStatus,
  getStatusEmoji,
  getStatusLabel,
} from '@/lib/bloodbank-utils';
import { Card } from '@/components/ui/card';

interface InventoryTabProps {
  inventory: Inventory;
}

export const InventoryTab = ({ inventory }: InventoryTabProps) => {

  // Helper to determine card background and border based on status
  const getCardStyles = (status: 'good' | 'low' | 'critical') => {
    switch (status) {
      case 'good':
        return 'bg-green-50 border-green-200 hover:border-green-300 shadow-sm hover:shadow-md';
      case 'low':
        return 'bg-orange-50 border-orange-200 hover:border-orange-300 shadow-sm hover:shadow-md';
      case 'critical':
        return 'bg-red-50 border-red-200 hover:border-red-300 shadow-md hover:shadow-lg';
      default:
        return 'bg-card border-border';
    }
  };

  // Helper for text colors inside the card
  const getTextColor = (status: 'good' | 'low' | 'critical') => {
    switch (status) {
      case 'good': return 'text-green-700';
      case 'low': return 'text-orange-700';
      case 'critical': return 'text-red-700';
      default: return 'text-foreground';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary">Blood Inventory Management</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {BLOOD_GROUPS.map((bg) => {
          const item = inventory[bg] || { total: 0, available: 0 }; // Fallback for missing groups
          const status = getInventoryStatus(item.available, item.total);
          const textColor = getTextColor(status);

          return (
            <Card
              key={bg}
              className={`p-6 card-hover border-2 transition-all duration-200 ${getCardStyles(status)}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-3xl font-bold text-primary mb-1">{bg}</div>
                  <div className="text-sm text-muted-foreground">Blood Group</div>
                </div>
                <div className={`px-2 py-1 rounded-md text-xs font-bold border flex items-center gap-1 bg-white/60 backdrop-blur-sm ${textColor} border-current`}>
                  <span>{getStatusEmoji(status)}</span>
                  <span>{getStatusLabel(status)}</span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Units:</span>
                  <span className="font-bold text-lg text-foreground">{item.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Available:</span>
                  <span className={`font-bold text-lg ${textColor}`}>{item.available}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Reserved:</span>
                  <span className="font-bold text-lg text-muted-foreground opacity-80">
                    {item.total - item.available}
                  </span>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full bg-black/5 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${status === 'good'
                    ? 'bg-[var(--clr-success)]'
                    : status === 'low'
                      ? 'bg-[var(--clr-emergency)]'
                      : 'bg-[var(--clr-emergency)]'
                    }`}
                  style={{
                    width: `${item.total > 0 ? (item.available / item.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Threshold Legend Footer - FIXED (Removed Emojis) */}
      <div className="mt-8 p-5 bg-muted/30 rounded-xl border border-border">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">Inventory Status Thresholds</h3>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-[var(--clr-emergency)] shadow-sm border border-[var(--clr-emergency)]"></div>
            <span className="text-sm text-foreground font-medium">Critical: &lt; 30 Units</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-[var(--clr-emergency)] shadow-sm border border-[var(--clr-emergency)]"></div>
            <span className="text-sm text-foreground font-medium">Low: 30 - 50 Units</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-[var(--clr-success)] shadow-sm border border-green-700"></div>
            <span className="text-sm text-foreground font-medium">Good: &gt; 50 Units</span>
          </div>
        </div>
      </div>
    </div>
  );
};