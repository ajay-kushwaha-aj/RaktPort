// DonationsTab.tsx - WITHOUT OTP DISPLAY (Security)
// Replace your entire DonationsTab.tsx with this:

import { Donation } from '@/types/bloodbank';
import { formatDate, formatTime } from '@/lib/bloodbank-utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, FileText, User, Clock, Heart, Building2, PhoneCall, Shield } from 'lucide-react';

interface DonationsTabProps {
  donations: Donation[];
}

export const DonationsTab = ({ donations }: DonationsTabProps) => {

  // Enhanced status styling
  const getStatusStyle = (status: string) => {
    const s = status.toUpperCase();

    if (s === 'SCHEDULED') {
      return 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200';
    }

    if (s === 'AVAILABLE' || s === 'DONATED') {
      return 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200';
    }

    if (s === 'REDEEMED' || s.includes('REDEEMED')) {
      return 'bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-200';
    }

    if (s === 'COMPLETED') {
      return 'bg-[var(--bg-page)] text-gray-700 border-[var(--border-color)] hover:bg-gray-200';
    }

    if (s === 'EXPIRED') {
      return 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200';
    }

    if (s === 'PLEDGED') {
      return 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200';
    }

    return 'bg-[var(--bg-page)] text-[var(--text-secondary)] border-[var(--border-color)]';
  };

  const getStatusText = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'AVAILABLE') return 'DONATED';
    return status;
  };

  const getStatusIcon = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'SCHEDULED') return '📅';
    if (s === 'DONATED' || s === 'AVAILABLE') return '✅';
    if (s === 'REDEEMED' || s.includes('REDEEMED')) return '🏥';
    if (s === 'COMPLETED') return '🎉';
    if (s === 'EXPIRED') return '⏰';
    if (s === 'PLEDGED') return '🤝';
    return '📋';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-primary">Donation History</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Complete lifecycle: Scheduled → Donated → Redeemed → Completed
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Total: {donations.length}
        </Badge>
      </div>

      {donations.length === 0 ? (
        <Card className="p-8 text-center bg-muted/20 border-dashed">
          <p className="text-muted-foreground">No donations recorded yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {donations.map((donation) => (
            <Card key={donation.dRtid} className="p-6 card-hover transition-all hover:shadow-lg border-l-4"
              style={{
                borderLeftColor:
                  donation.status === 'REDEEMED' ? '#9333ea' :
                    donation.status === 'AVAILABLE' || donation.status === 'Donated' ? '#16a34a' :
                      donation.status === 'SCHEDULED' ? 'var(--clr-info)' :
                        donation.status === 'COMPLETED' ? '#6b7280' : '#d1d5db'
              }}
            >

              {/* HEADER */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground leading-none">
                      {donation.donorName}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1.5 font-mono flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      D-RTID: {donation.dRtid}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-start sm:items-end gap-2">
                  <Badge className={`px-3 py-1.5 text-sm font-bold border-2 ${getStatusStyle(donation.status)}`}>
                    {getStatusIcon(donation.status)} {getStatusText(donation.status)}
                  </Badge>

                  {/* OTP REMOVED - Security measure */}
                  {(donation.status === 'AVAILABLE' || donation.status === 'Donated') && (
                    <Badge variant="outline" className="text-xs bg-[var(--bg-page)] border-[var(--border-color)] text-[var(--text-secondary)]">
                      <Shield className="h-3 w-3 mr-1" />
                      OTP: Sent to Donor
                    </Badge>
                  )}
                </div>
              </div>

              {/* DONATION DETAILS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">

                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                    💉 Blood Group
                  </span>
                  <span className="font-extrabold text-2xl text-primary">{donation.bloodGroup}</span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                    <FileText className="h-3 w-3" /> Component
                  </span>
                  <span className="font-semibold text-sm">{donation.component || 'Whole Blood'}</span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                    <Heart className="h-3 w-3" /> Type
                  </span>
                  <span className="font-medium text-sm">{donation.donationType}</span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Location
                  </span>
                  <span className="font-medium text-sm truncate" title={donation.donationLocation}>
                    {donation.donationLocation || donation.city || 'N/A'}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Date & Time
                  </span>
                  <span className="font-semibold text-sm">
                    {formatDate(donation.date)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(donation.date)}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> Blood Bank
                  </span>
                  <span className="font-medium text-sm truncate" title={donation.bloodBankName}>
                    {donation.bloodBankName || 'Blood Bank'}
                  </span>
                </div>

                {donation.donorMobile && (
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                      <PhoneCall className="h-3 w-3" /> Contact
                    </span>
                    <span className="font-medium text-sm">{donation.donorMobile}</span>
                  </div>
                )}

                {donation.createdAt && (
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Recorded At
                    </span>
                    <span className="font-medium text-sm">
                      {formatDate(donation.createdAt)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(donation.createdAt)}
                    </span>
                  </div>
                )}
              </div>

              {/* PATIENT DETAILS (If Redeemed/Linked) */}
              {(donation.status === 'REDEEMED' || donation.rRtid || donation.linkedRrtid) &&
                (donation.rRtid || donation.linkedRrtid || donation.patientName) && (
                  <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Heart className="h-4 w-4 text-purple-600 fill-purple-600" />
                      <h4 className="font-bold text-purple-900 text-sm">Patient Impact Details</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      {(donation.rRtid || donation.linkedRrtid) && (
                        <div>
                          <span className="text-xs text-purple-600 font-medium">RH/RU-RTID (Request ID)</span>
                          <p className="font-mono font-bold text-purple-900 text-xs mt-0.5">
                            {donation.rRtid || donation.linkedRrtid}
                          </p>
                        </div>
                      )}

                      {donation.patientName && (
                        <div>
                          <span className="text-xs text-purple-600 font-medium">Patient Name</span>
                          <p className="font-semibold text-purple-900 mt-0.5">{donation.patientName}</p>
                        </div>
                      )}

                      {donation.hospitalName && (
                        <div>
                          <span className="text-xs text-purple-600 font-medium">Hospital</span>
                          <p className="font-semibold text-purple-900 mt-0.5 truncate" title={donation.hospitalName}>
                            {donation.hospitalName}
                          </p>
                        </div>
                      )}

                      {donation.redemptionDate && (
                        <div>
                          <span className="text-xs text-purple-600 font-medium">Redeemed On</span>
                          <p className="font-semibold text-purple-900 mt-0.5">
                            {formatDate(donation.redemptionDate)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 p-2 bg-[var(--bg-surface)] rounded border border-purple-100">
                      <p className="text-xs text-purple-800 font-medium flex items-center gap-2">
                        <span>🎉</span>
                        <span>This donation directly saved <strong>{donation.patientName || 'a patient'}</strong>'s life!</span>
                      </p>
                    </div>
                  </div>
                )}

              {/* APPOINTMENT LINK */}
              {donation.appointmentRtid && donation.status === 'SCHEDULED' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800 flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span className="font-medium">Linked Appointment:</span>
                    <code className="font-mono font-bold bg-[var(--bg-surface)] px-2 py-0.5 rounded border border-blue-100">
                      {donation.appointmentRtid}
                    </code>
                  </p>
                </div>
              )}

            </Card>
          ))}
        </div>
      )}
    </div>
  );
};