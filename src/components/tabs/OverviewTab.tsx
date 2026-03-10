import { KPIData } from '@/types/bloodbank';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface OverviewTabProps {
  kpi: KPIData;
  // onRegisterDonor prop removed
  onCheckInAppointment: () => void;
}

export const OverviewTab = ({ kpi, onCheckInAppointment }: OverviewTabProps) => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-primary mb-6">Blood Bank Overview</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 mb-8">
        <Card className="p-5 border-l-4 border-l-muted-foreground card-hover">
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Total Inventory
          </div>
          <div className="text-3xl font-bold text-foreground">{kpi.totalInventory}</div>
        </Card>

        <Card className="p-5 border-l-4 border-l-success card-hover">
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Available Units
          </div>
          <div className="text-3xl font-bold text-success">{kpi.availableUnits}</div>
        </Card>

        <Card className="p-5 border-l-4 border-l-info card-hover">
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Today's Appointments
          </div>
          <div className="text-3xl font-bold text-info">{kpi.todayAppointments}</div>
        </Card>

        <Card className="p-5 border-l-4 border-l-primary card-hover">
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Total Donations
          </div>
          <div className="text-3xl font-bold text-primary">{kpi.totalDonations}</div>
        </Card>

        <Card className="p-5 border-l-4 border-l-warning card-hover">
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Total Redemptions
          </div>
          <div className="text-3xl font-bold text-warning">{kpi.totalRedemptions}</div>
        </Card>

        <Card className="p-5 border-l-4 border-l-destructive card-hover">
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Blood Requests
          </div>
          <div className="text-3xl font-bold text-destructive">{kpi.totalBloodRequests}</div>
        </Card>
      </div>

      {/* Process Donor Check-In */}
      <Card className="p-6 border-t-4 border-t-primary">
        {/* Updated layout to center the single button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-primary">Process Donor Check-In</h2>
            <p className="text-muted-foreground text-sm mt-1">Check-in a donor who has a pre-booked appointment.</p>
          </div>
          <div className="flex space-x-3">
            {/* Removed the "Register New Donor" button */}
            <Button
              onClick={onCheckInAppointment}
              size="lg"
              variant="default" // Changed to default variant
              className="font-semibold"
            >
              ⏱️ Check-In Appointment
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};