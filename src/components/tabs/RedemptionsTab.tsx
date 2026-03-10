import { Redemption } from '@/types/bloodbank';
import { formatDate, formatTime } from '@/lib/bloodbank-utils';
import { Card } from '@/components/ui/card';

interface RedemptionsTabProps {
  redemptions: Redemption[];
}

export const RedemptionsTab = ({ redemptions }: RedemptionsTabProps) => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-primary mb-6">Redemption History</h2>

      {redemptions.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No redemptions recorded yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {redemptions.map((redemption, index) => (
            <Card key={`${redemption.dRtid}-${index}`} className="p-5 card-hover">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">D-RTID:</span>
                  <span className="ml-2 font-mono font-semibold">{redemption.dRtid}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Blood Group:</span>
                  <span className="ml-2 font-semibold text-primary">
                    {redemption.bloodGroup}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Donation Location:</span>
                  <span className="ml-2 font-semibold">
                    {redemption.donationLocation}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Redemption Location:</span>
                  <span className="ml-2 font-semibold">
                    {redemption.redemptionLocation}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <span className="ml-2 font-semibold">
                    {formatDate(redemption.date)} at {formatTime(redemption.date)}
                  </span>
                </div>
                {redemption.linkedHRTID && (
                  <div>
                    <span className="text-muted-foreground">Linked H-RTID:</span>
                    <span className="ml-2 font-mono font-semibold text-warning">
                      {redemption.linkedHRTID}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
