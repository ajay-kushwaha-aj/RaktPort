import { useState, useEffect } from 'react';
import { BloodGroup } from '@/types/bloodbank';
import { BLOOD_GROUPS, getTodayDateString } from '@/lib/bloodbank-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, CheckCircle, Phone, User, AlertCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { auth, db } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

// Fix for TypeScript window error
declare global {
  interface Window {
    recaptchaVerifierAppointment?: RecaptchaVerifier;
  }
}

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AppointmentFormData) => void;
}

export interface AppointmentFormData {
  donorName: string;
  mobile: string;
  gender: string;
  bloodGroup: BloodGroup;
  date: string;
  time: string;
}

export const AppointmentModal = ({
  isOpen,
  onClose,
  onSubmit,
}: AppointmentModalProps) => {
  const [formData, setFormData] = useState<AppointmentFormData>({
    donorName: '',
    mobile: '',
    gender: '',
    bloodGroup: 'O+',
    date: getTodayDateString(),
    time: '10:00',
  });

  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isNewDonor, setIsNewDonor] = useState(false);
  
  // OTP Verification States
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Initialize Recaptcha for OTP
  useEffect(() => {
    if (isOpen && !window.recaptchaVerifierAppointment) {
      try {
        window.recaptchaVerifierAppointment = new RecaptchaVerifier(auth, 'recaptcha-container-appointment', {
          'size': 'invisible',
          'callback': () => {
            console.log("Recaptcha verified for appointment");
          }
        });
      } catch (e) {
        console.error("Recaptcha Init Error:", e);
      }
    }
    return () => {
      // Cleanup on unmount
      if (window.recaptchaVerifierAppointment && !isOpen) {
        window.recaptchaVerifierAppointment.clear();
        delete window.recaptchaVerifierAppointment;
      }
    };
  }, [isOpen]);

  const handleSendOtp = async () => {
    if (!formData.mobile || formData.mobile.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    
    setIsVerifying(true);
    setOtpError('');
    setIsOtpSent(false);
    setIsPhoneVerified(false);
    setIsNewDonor(false);
    setIsVerified(false);

    try {
      const phoneNumber = `+91${formData.mobile}`;
      const appVerifier = window.recaptchaVerifierAppointment;

      if (!appVerifier) {
        throw new Error("Recaptcha not initialized. Please refresh the page.");
      }

      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(result);
      setIsOtpSent(true);
      toast.success("OTP Sent", { description: `OTP sent to ${phoneNumber}` });
    } catch (err: any) {
      console.error("OTP Send Error:", err);
      setOtpError(err.message || "Failed to send OTP. Try again.");
      toast.error("OTP Error", { description: err.message || "Failed to send OTP" });
      if (window.recaptchaVerifierAppointment) {
        window.recaptchaVerifierAppointment.clear();
        delete window.recaptchaVerifierAppointment;
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6 || !confirmationResult) {
      setOtpError("Please enter a valid 6-digit OTP.");
      return;
    }
    
    setVerifyingOtp(true);
    setOtpError('');

    try {
      await confirmationResult.confirm(otp);
      setIsPhoneVerified(true);
      setIsOtpSent(false);
      
      // After OTP verification, check donor in Firestore
      try {
        const mobileWithCode = `+91${formData.mobile}`;
        const q = query(
          collection(db, "users"),
          where("mobile", "==", mobileWithCode),
          where("role", "==", "donor")
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const donorData = snapshot.docs[0].data();
          // Donor Found: Auto-fill
          setFormData(prev => ({
            ...prev,
            donorName: donorData.fullName || '',
            bloodGroup: (donorData.bloodGroup as BloodGroup) || 'O+',
            gender: donorData.gender || ''
          }));
          setIsNewDonor(false);
          toast.success("Phone Verified & Donor Found!", { description: "Donor details auto-filled." });
        } else {
          // Not Found: Allow manual entry
          setIsNewDonor(true);
          toast.success("Phone Verified!", { description: "New donor. Please enter details manually." });
        }
        setIsVerified(true);
      } catch (err) {
        console.error("Database check error:", err);
        setIsNewDonor(true);
        setIsVerified(true);
        toast.success("Phone Verified!", { description: "Please enter donor details." });
      }
    } catch (err: any) {
      setOtpError("Invalid OTP. Please try again.");
      toast.error("OTP Verification Failed", { description: "Invalid OTP code." });
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPhoneVerified) {
      toast.error("Phone Verification Required", { description: "Please verify mobile number with OTP first." });
      return;
    }
    if (!isVerified) {
      toast.error("Verification Required", { description: "Please complete verification first." });
      return;
    }
    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      donorName: '',
      mobile: '',
      gender: '',
      bloodGroup: 'O+',
      date: getTodayDateString(),
      time: '10:00',
    });
    setIsVerified(false);
    setIsNewDonor(false);
    setIsOtpSent(false);
    setIsPhoneVerified(false);
    setOtp('');
    setOtpError('');
    setConfirmationResult(null);
    if (window.recaptchaVerifierAppointment) {
      window.recaptchaVerifierAppointment.clear();
      delete window.recaptchaVerifierAppointment;
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            📅 Register Verified Appointment
          </DialogTitle>
          <DialogDescription>
            Verify donor identity to prevent unauthorized bookings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          
          {/* Phone Verification Section */}
          <div className="space-y-3 bg-muted/30 p-4 rounded-lg border border-border">
            <Label className="text-primary font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4" /> Phone Verification (Required)
            </Label>
            
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label htmlFor="appMobile" className="text-xs text-muted-foreground">Mobile Number</Label>
                <div className="flex gap-2 mt-1">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="appMobile"
                      value={formData.mobile}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setFormData({ ...formData, mobile: value });
                        setIsVerified(false);
                        setIsPhoneVerified(false);
                        setIsOtpSent(false);
                        setIsNewDonor(false);
                        setOtp('');
                        setOtpError('');
                      }}
                      placeholder="9876543210"
                      className="pl-9"
                      maxLength={10}
                      disabled={isPhoneVerified}
                      required
                    />
                  </div>
                  {!isPhoneVerified && (
                    <Button 
                      type="button" 
                      onClick={handleSendOtp} 
                      disabled={isVerifying || formData.mobile.length !== 10}
                      variant="secondary"
                    >
                      {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send OTP"}
                    </Button>
                  )}
                  {isPhoneVerified && (
                    <Button 
                      type="button" 
                      disabled
                      variant="default"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Verified
                    </Button>
                  )}
                </div>
              </div>

              {/* OTP Input Section */}
              {isOtpSent && !isPhoneVerified && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 bg-blue-50/50 p-3 rounded-lg border border-blue-200">
                  <Label htmlFor="appOtp" className="text-xs text-muted-foreground flex items-center gap-2">
                    <Shield className="w-3 h-3" /> Enter 6-Digit OTP
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="appOtp"
                      value={otp}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOtp(value);
                        setOtpError('');
                      }}
                      placeholder="000000"
                      className="font-mono text-lg tracking-widest text-center"
                      maxLength={6}
                      required
                    />
                    <Button 
                      type="button" 
                      onClick={handleVerifyOtp}
                      disabled={verifyingOtp || otp.length !== 6}
                      variant="default"
                    >
                      {verifyingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify OTP"}
                    </Button>
                  </div>
                  {otpError && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {otpError}
                    </p>
                  )}
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={handleSendOtp}
                    className="text-xs"
                  >
                    Resend OTP
                  </Button>
                </div>
              )}

              {/* Donor Details Section - Show after phone verification */}
              {isPhoneVerified && (
                <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 pt-2 border-t border-border">
                  <div>
                    <Label htmlFor="appointmentDonorName" className="text-xs text-muted-foreground">Full Name</Label>
                    <Input
                      id="appointmentDonorName"
                      value={formData.donorName}
                      onChange={(e) => setFormData({ ...formData, donorName: e.target.value })}
                      placeholder="Donor Name"
                      required
                      readOnly={!isNewDonor}
                      className={!isNewDonor ? "bg-gray-100" : ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="appGender" className="text-xs text-muted-foreground">Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData({ ...formData, gender: value })}
                      required
                      disabled={!isNewDonor && !!formData.gender}
                    >
                      <SelectTrigger id="appGender" className="mt-1">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
            
            {/* Hidden Recaptcha Container */}
            <div id="recaptcha-container-appointment"></div>
          </div>

          {/* Rest of the form... */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="appointmentBloodGroup">Blood Group</Label>
              <Select
                value={formData.bloodGroup}
                onValueChange={(value) =>
                  setFormData({ ...formData, bloodGroup: value as BloodGroup })
                }
                disabled={isVerified && !isNewDonor && !!formData.bloodGroup}
              >
                <SelectTrigger id="appointmentBloodGroup">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_GROUPS.map((bg) => (
                    <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* ... */}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="appointmentDate">Date</Label>
              <Input
                id="appointmentDate"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="appointmentTime">Time</Label>
              <Input
                id="appointmentTime"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary-dark" disabled={!isPhoneVerified || !isVerified}>
              Confirm Booking
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};