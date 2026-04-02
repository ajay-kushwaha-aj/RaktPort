// PART 6: AppointmentsTab.tsx - Shows only Upcoming appointments
// Make sure your AppointmentsTab filters correctly:

import { Appointment } from '@/types/bloodbank';
import { formatDate, formatTime } from '@/lib/bloodbank-utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Phone, MapPin, Heart } from 'lucide-react';

interface AppointmentsTabProps {
  appointments: Appointment[];
  onCheckIn: (appointment: Appointment) => void;
}

export const AppointmentsTab = ({ appointments, onCheckIn }: AppointmentsTabProps) => {

  // Filter for ONLY upcoming appointments
  const upcomingAppointments = appointments.filter(
    apt => apt.status === 'Upcoming'
  );

  // Filter for completed appointments (for history section)
  const completedAppointments = appointments.filter(
    apt => apt.status === 'Completed'
  );

  return (
    <div className="space-y-8">

      {/* PENDING CHECK-INS SECTION */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Pending Check-Ins ({upcomingAppointments.length})
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Donors scheduled for donation. Click "Check In" to record donation.
            </p>
          </div>
        </div>

        {upcomingAppointments.length === 0 ? (
          <Card className="p-8 text-center bg-muted/20 border-dashed">
            <p className="text-muted-foreground">No pending appointments</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingAppointments.map((appointment) => (
              <Card
                key={appointment.rtid || appointment.appointmentRtid}
                className="p-5 card-hover hover:shadow-xl transition-all border-l-4 border-l-blue-500"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-[var(--clr-info)]">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground leading-tight">
                        {appointment.donorName}
                      </h3>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {appointment.rtid || appointment.appointmentRtid}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200">
                    Upcoming
                  </Badge>
                </div>

                {/* Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Heart className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="font-bold text-xl text-primary">{appointment.bloodGroup}</span>
                    <span className="text-muted-foreground text-xs ml-auto">
                      {appointment.gender}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-semibold">{formatDate(appointment.date)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium">{appointment.time}</span>
                  </div>

                  {appointment.mobile && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium">{appointment.mobile}</span>
                    </div>
                  )}

                  {(appointment.district || appointment.pincode) && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-muted-foreground text-xs">
                        {appointment.district}, {appointment.pincode}
                      </span>
                    </div>
                  )}
                </div>

                {/* Check In Button */}
                <Button
                  onClick={() => onCheckIn(appointment)}
                  className="w-full bg-primary hover:bg-primary/90 font-semibold"
                >
                  ✓ Check In & Record Donation
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* COMPLETED APPOINTMENTS SECTION */}
      {completedAppointments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-700 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Completed Appointments ({completedAppointments.length})
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Appointments that have been checked in and donations recorded.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedAppointments.map((appointment) => (
              <Card
                key={appointment.rtid || appointment.appointmentRtid}
                className="p-5 border-l-4 border-l-green-500 opacity-75"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-[var(--clr-success)]">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">{appointment.donorName}</h4>
                      <p className="text-xs text-muted-foreground font-mono">
                        {appointment.rtid || appointment.appointmentRtid}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-green-300">
                    ✓ Completed
                  </Badge>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Heart className="h-3 w-3" />
                    <span className="font-bold text-primary text-lg">{appointment.bloodGroup}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(appointment.date)} at {appointment.time}</span>
                  </div>
                  {appointment.dRtid && (
                    <div className="mt-2 p-2 bg-green-50 rounded border border-green-100">
                      <p className="text-xs text-green-800 font-medium">
                        Donation ID: <code className="font-mono">{appointment.dRtid}</code>
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};