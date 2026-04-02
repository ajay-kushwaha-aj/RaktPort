import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, QrCode } from 'lucide-react';
import { toast } from 'sonner';

interface RtidVerifyTabProps {
  onVerifyRtid: (rtid: string) => void;
}

export const RtidVerifyTab = ({ onVerifyRtid }: RtidVerifyTabProps) => {
  const [rtidType, setRtidType] = useState<'D-RTID' | 'H-RTID'>('H-RTID');
  const [rtidValue, setRtidValue] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const handleVerify = () => {
    if (!rtidValue.trim()) {
      toast.error("Please enter an RTID");
      return;
    }

    const fullRtid = rtidValue.toUpperCase();
    onVerifyRtid(fullRtid);
  };

  const handleQRScan = () => {
    setIsScanning(true);
    toast.info("QR Scanner opening...", {
      description: "Position the QR code in front of camera"
    });

    // Simulated QR scan - in production, integrate with actual QR scanner library
    setTimeout(() => {
      setIsScanning(false);
      toast.success("QR Code scanned successfully");
      // Example: setRtidValue("H-RTID-26012026-A1234");
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-primary mb-2">RTID Verification</h2>
        <p className="text-muted-foreground">
          Scan QR code or manually enter RTID to verify blood requests and donations
        </p>
      </div>

      <Card className="p-8 shadow-lg border-t-4 border-t-primary">
        <div className="space-y-6">
          {/* Type Selector */}
          <div className="space-y-2">
            <Label htmlFor="rtidType" className="text-base font-semibold">
              Select RTID Type
            </Label>
            <Select value={rtidType} onValueChange={(val) => setRtidType(val as 'D-RTID' | 'H-RTID')}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="H-RTID">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🏥</span>
                    <div>
                      <div className="font-semibold">H-RTID</div>
                      <div className="text-xs text-muted-foreground">Hospital Blood Request</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="D-RTID">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🩸</span>
                    <div>
                      <div className="font-semibold">D-RTID</div>
                      <div className="text-xs text-muted-foreground">Donor Blood Credit</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* RTID Input with QR Button */}
          <div className="space-y-2">
            <Label htmlFor="rtidInput" className="text-base font-semibold">
              Enter RTID
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="rtidInput"
                  type="text"
                  value={rtidValue}
                  onChange={(e) => setRtidValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`e.g., ${rtidType}-26012026-A1234`}
                  className="pr-12 font-mono text-sm h-12"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1 h-10 w-10 text-primary hover:text-primary/80 hover:bg-primary/10"
                  onClick={handleQRScan}
                  disabled={isScanning}
                  title="Scan QR Code"
                >
                  <QrCode className={`h-5 w-5 ${isScanning ? 'animate-pulse' : ''}`} />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Click the QR icon to scan, or manually type the {rtidType}
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
              <span>ℹ️</span>
              <span>Verification Info</span>
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• <strong>H-RTID:</strong> Verifies hospital blood requests and shows patient details</li>
              <li>• <strong>D-RTID:</strong> Verifies donor credits and shows donation status</li>
              <li>• System will validate RTID and display complete details</li>
            </ul>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleVerify}
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 gap-2"
            disabled={!rtidValue.trim() || isScanning}
          >
            <Search className="h-5 w-5" />
            Verify {rtidType}
          </Button>
        </div>
      </Card>

      {isScanning && (
        <Card className="p-8 bg-black/90 text-[var(--txt-inverse)] text-center animate-pulse">
          <QrCode className="h-16 w-16 mx-auto mb-4 animate-spin" />
          <p className="text-lg font-semibold">Scanning QR Code...</p>
          <p className="text-sm opacity-75 mt-2">Position the code within the frame</p>
        </Card>
      )}
    </div>
  );
};