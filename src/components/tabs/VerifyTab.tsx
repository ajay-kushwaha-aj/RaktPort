import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowDown, ShieldCheck, User, FileText, KeyRound } from 'lucide-react';

interface VerifyTabProps {
  // Updated signature to include H-RTID
  onVerifyAndRedeem: (hRtid: string, dRtid: string, otp: string) => void;
}

export const VerifyTab = ({ onVerifyAndRedeem }: VerifyTabProps) => {
  const [hRtid, setHrtid] = useState('');
  const [dRtid, setDrtid] = useState('');
  const [otp, setOtp] = useState('');
  const [patientName, setPatientName] = useState(''); // New field for audit

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Assuming the parent handler checks H-RTID and D-RTID linking
    onVerifyAndRedeem(hRtid.trim().toUpperCase(), dRtid.trim().toUpperCase(), otp.trim());
  };

  const handleClear = () => {
    setHrtid('');
    setDrtid('');
    setOtp('');
    setPatientName('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-primary flex items-center justify-center gap-3">
          <ShieldCheck className="w-8 h-8" /> Verify & Redeem Credit
        </h2>
        <p className="text-muted-foreground mt-2">
          Securely transfer blood credits from donor to patient.
        </p>
      </div>

      <Card className="w-full max-w-xl shadow-xl border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle>Redemption Processing</CardTitle>
          <CardDescription>All fields are mandatory for audit trail.</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Section 1: Beneficiary Details */}
            <div className="space-y-4 bg-muted/30 p-4 rounded-lg border border-border/50">
              <div className="flex items-center gap-2 text-primary font-semibold border-b border-border/50 pb-2 mb-3">
                <FileText className="w-4 h-4" /> Beneficiary Request Details
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hRtid">Hospital Request ID (H-RTID)</Label>
                  <Input
                    id="hRtid"
                    value={hRtid}
                    onChange={(e) => setHrtid(e.target.value)}
                    placeholder="H-RTID-XXXX-XXXX"
                    className="font-mono bg-background"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientName">Patient Name</Label>
                  <Input
                    id="patientName"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g., Rajesh Kumar"
                    className="bg-background"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Visual Connector */}
            <div className="flex justify-center -my-3 relative z-10">
              <div className="bg-background border rounded-full p-1.5 shadow-sm text-muted-foreground">
                <ArrowDown className="w-5 h-5" />
              </div>
            </div>

            {/* Section 2: Donor Credit Details */}
            <div className="space-y-4 bg-info/10 p-4 rounded-lg border border-info/20">
              <div className="flex items-center gap-2 text-info font-semibold border-b border-info/20 pb-2 mb-3">
                <User className="w-4 h-4" /> Donor Credit Source
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dRtid">Donor RTID (D-RTID)</Label>
                  <Input
                    id="dRtid"
                    value={dRtid}
                    onChange={(e) => setDrtid(e.target.value)}
                    placeholder="D-RTID-XXXX-XXXX"
                    className="font-mono bg-background"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="otp" className="flex items-center justify-between">
                    <span>Validation OTP</span>
                    <span className="text-xs text-muted-foreground font-normal">Provided by Donor</span>
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="otp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="6-Digit Code"
                      maxLength={6}
                      pattern="\d{6}"
                      className="pl-9 bg-background font-mono text-lg tracking-widest"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClear}>
                Reset Form
              </Button>
              <Button type="submit" className="flex-[2] bg-success hover:bg-success/90 text-[var(--txt-inverse)] font-bold shadow-md hover:shadow-lg transition-all">
                ✅ Verify & Complete Transfer
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>

      <div className="mt-6 text-center max-w-lg text-xs text-muted-foreground">
        <p>⚠️ <strong>Security Note:</strong> Ensure the donor is physically present or has authorized this transaction via OTP. All redemptions are logged on the National Ledger.</p>
      </div>
    </div>
  );
};