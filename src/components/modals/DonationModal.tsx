// DonationModal.tsx - PROFESSIONAL VERSION
// Replace your entire DonationModal.tsx with this:

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle2, AlertCircle, User, Droplet, Shield, Building2, Calendar } from 'lucide-react';
import { db } from '@/firebase';
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  checkInData?: any;
}

interface RRTIDData {
  patientName: string;
  bloodGroup: string;
  component?: string;
  unitsRequired: number;
  requiredBy?: string;
  hospitalName: string;
  hospitalId?: string;
  district?: string;
  state?: string;
  status?: string;
}

export const DonationModal = ({ isOpen, onClose, onSubmit, checkInData }: DonationModalProps) => {
  // Form State
  const [donorName, setDonorName] = useState('');
  const [mobile, setMobile] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [donationType, setDonationType] = useState('Regular');
  const [component, setComponent] = useState('Whole Blood');
  const [rRtid, setRRtid] = useState('');

  // Validation State
  const [rRtidData, setRRtidData] = useState<RRTIDData | null>(null);
  const [rRtidLoading, setRRtidLoading] = useState(false);
  const [rRtidError, setRRtidError] = useState('');
  const [rRtidValid, setRRtidValid] = useState(false);

  // Check if this is an appointment check-in (fields should be read-only)
  const isCheckIn = !!checkInData;

  // ====================================================================
  // EFFECT: Pre-fill data from appointment check-in
  // ====================================================================
  useEffect(() => {
    if (checkInData) {
      console.log("Check-in data received:", checkInData);

      setDonorName(checkInData.donorName || '');
      setMobile(checkInData.mobile || '');
      setBloodGroup(checkInData.bloodGroup || '');
      setComponent(checkInData.component || 'Whole Blood');

      setDonationType('Regular');
      setRRtid('');
      setRRtidData(null);
    } else {
      resetForm();
    }
  }, [checkInData, isOpen]);

  // ====================================================================
  // FUNCTION: Validate and Fetch R-RTID Data
  // ====================================================================
  const validateRRTID = async (rtid: string) => {
    if (!rtid || rtid.trim() === '') {
      setRRtidData(null);
      setRRtidError('');
      setRRtidValid(false);
      return;
    }

    setRRtidLoading(true);
    setRRtidError('');
    setRRtidValid(false);

    try {
      let requestData: any = null;

      const docRef = doc(db, "bloodRequests", rtid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        requestData = docSnap.data();
      } else {
        const queries = [
          query(collection(db, "bloodRequests"), where("linkedRTID", "==", rtid)),
          query(collection(db, "bloodRequests"), where("rtid", "==", rtid))
        ];

        for (const q of queries) {
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            requestData = qSnap.docs[0].data();
            break;
          }
        }
      }

      if (!requestData) {
        throw new Error("R-RTID not found in system");
      }

      let hospitalName = requestData.hospitalName || 'Hospital';
      let hospitalLocation = '';

      if (requestData.hospitalId) {
        try {
          const hospitalDoc = await getDoc(doc(db, "users", requestData.hospitalId));
          if (hospitalDoc.exists()) {
            const hospitalData = hospitalDoc.data();
            hospitalName = hospitalData.fullName || hospitalName;
            hospitalLocation = `${hospitalData.district || ''}, ${hospitalData.state || ''}`.trim();
          }
        } catch (err) {
          console.warn("Could not fetch hospital details:", err);
        }
      }

      let requiredByText = 'N/A';
      if (requestData.requiredBy) {
        try {
          const reqDate = requestData.requiredBy.toDate
            ? requestData.requiredBy.toDate()
            : new Date(requestData.requiredBy);

          requiredByText = reqDate.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch (e) {
          console.warn("Could not parse requiredBy date");
        }
      }

      const validatedData: RRTIDData = {
        patientName: requestData.patientName || 'Patient',
        bloodGroup: requestData.bloodGroup || 'Unknown',
        component: requestData.component || 'Whole Blood',
        unitsRequired: requestData.unitsRequired || requestData.units || 1,
        requiredBy: requiredByText,
        hospitalName: hospitalName,
        district: requestData.district || '',
        state: requestData.state || '',
        status: requestData.status || 'PENDING'
      };

      setRRtidData(validatedData);
      setRRtidValid(true);

    } catch (err: any) {
      setRRtidError(err.message || "Failed to validate R-RTID");
      setRRtidData(null);
      setRRtidValid(false);
    } finally {
      setRRtidLoading(false);
    }
  };

  useEffect(() => {
    if (donationType === 'R-RTID-Linked Donation' && rRtid.length >= 10) {
      const debounce = setTimeout(() => {
        validateRRTID(rRtid);
      }, 500);
      return () => clearTimeout(debounce);
    } else {
      setRRtidData(null);
      setRRtidError('');
      setRRtidValid(false);
    }
  }, [rRtid, donationType]);

  const resetForm = () => {
    setDonorName('');
    setMobile('');
    setBloodGroup('');
    setDonationType('Regular');
    setComponent('Whole Blood');
    setRRtid('');
    setRRtidData(null);
    setRRtidError('');
    setRRtidValid(false);
  };

  const handleSubmit = () => {
    if (!donorName.trim()) {
      alert('Please enter donor name');
      return;
    }

    if (!bloodGroup) {
      alert('Please select blood group');
      return;
    }

    if (donationType === 'R-RTID-Linked Donation') {
      if (!rRtid.trim()) {
        alert('Please enter R-RTID');
        return;
      }
      if (!rRtidValid) {
        alert('Please wait for R-RTID validation');
        return;
      }
    }

    const submissionData = {
      donorName: donorName.trim(),
      mobile: mobile.trim() || checkInData?.mobile || '',
      bloodGroup: bloodGroup,
      donationType: donationType,
      component: component,
      rRtid: donationType === 'R-RTID-Linked Donation' ? rRtid : null,
      rRtidData: donationType === 'R-RTID-Linked Donation' ? rRtidData : null,
    };

    onSubmit(submissionData);
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-red-50">

        {/* PROFESSIONAL HEADER */}
        <DialogHeader className="border-b border-red-100 pb-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
              <Droplet className="h-7 w-7 text-[var(--txt-inverse)] fill-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-[var(--text-primary)]">
                {isCheckIn ? 'Process Donation Check-In' : 'Record New Donation'}
              </DialogTitle>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {isCheckIn ? 'Complete the donation process for scheduled appointment' : 'Register a walk-in blood donation'}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">

          {/* DONOR INFORMATION CARD */}
          <div className="bg-[var(--bg-surface)] rounded-xl border-2 border-blue-100 shadow-sm">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-3 border-b border-blue-100">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-[var(--clr-info)]" />
                <h3 className="font-bold text-[var(--text-primary)]">Donor Information</h3>
                {isCheckIn && (
                  <Badge className="ml-auto bg-blue-100 text-blue-700 border-blue-200">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Donor Name */}
              <div>
                <Label htmlFor="donorName" className="text-sm font-semibold text-gray-700">
                  Donor Full Name {isCheckIn && <span className="text-xs text-[var(--clr-info)]">(Registered)</span>}
                </Label>
                <Input
                  id="donorName"
                  placeholder="e.g., Abhimanyu Kushwaha"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  disabled={isCheckIn}
                  className={`mt-1.5 ${isCheckIn ? 'bg-blue-50 border-blue-200 cursor-not-allowed font-semibold text-[var(--text-primary)]' : ''}`}
                />
              </div>

              {/* Blood Group */}
              <div>
                <Label htmlFor="bloodGroup" className="text-sm font-semibold text-gray-700">
                  Blood Group {isCheckIn && <span className="text-xs text-[var(--clr-info)]">(Registered)</span>}
                </Label>
                <Select value={bloodGroup} onValueChange={setBloodGroup} disabled={isCheckIn}>
                  <SelectTrigger className={`mt-1.5 ${isCheckIn ? 'bg-blue-50 border-blue-200 cursor-not-allowed' : ''}`}>
                    <SelectValue placeholder="Select Blood Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
                {isCheckIn && bloodGroup && (
                  <p className="text-xs text-[var(--clr-info)] mt-1 flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Verified from donor registration
                  </p>
                )}
              </div>

              {/* Mobile (Optional) */}
              <div>
                <Label htmlFor="mobile" className="text-sm font-semibold text-gray-700">
                  Mobile Number <span className="text-xs text-[var(--text-secondary)]">(Optional)</span>
                </Label>
                <Input
                  id="mobile"
                  placeholder="10-digit mobile"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  disabled={isCheckIn}
                  className={`mt-1.5 ${isCheckIn ? 'bg-[var(--bg-page)] border-[var(--border-color)] cursor-not-allowed' : ''}`}
                />
              </div>
            </div>
          </div>

          {/* DONATION DETAILS CARD */}
          <div className="bg-[var(--bg-surface)] rounded-xl border-2 border-red-100 shadow-sm">
            <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-3 border-b border-red-100">
              <div className="flex items-center gap-2">
                <Droplet className="h-5 w-5 text-[var(--clr-danger)]" />
                <h3 className="font-bold text-[var(--text-primary)]">Donation Details</h3>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Donation Type */}
              <div>
                <Label htmlFor="donationType" className="text-sm font-semibold text-gray-700">
                  Donation Type
                </Label>
                <Select value={donationType} onValueChange={setDonationType}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Regular">
                      <div className="flex items-center gap-2">
                        <span>🩸</span>
                        <span>Regular Donation</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="R-RTID-Linked Donation">
                      <div className="flex items-center gap-2">
                        <span>🏥</span>
                        <span>R-RTID-Linked Donation</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Emergency">
                      <div className="flex items-center gap-2">
                        <span>🚨</span>
                        <span>Emergency Donation</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Component Type */}
              <div>
                <Label htmlFor="component" className="text-sm font-semibold text-gray-700">
                  Component Type
                </Label>
                <Select value={component} onValueChange={setComponent}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Whole Blood">Whole Blood</SelectItem>
                    <SelectItem value="Platelets">Platelets</SelectItem>
                    <SelectItem value="Plasma">Plasma</SelectItem>
                    <SelectItem value="PRBC">Packed Red Blood Cells (PRBC)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* R-RTID VALIDATION CARD */}
          {donationType === 'R-RTID-Linked Donation' && (
            <div className="bg-[var(--bg-surface)] rounded-xl border-2 border-purple-200 shadow-lg">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-3 border-b border-purple-100">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-purple-600" />
                  <h3 className="font-bold text-[var(--text-primary)]">Patient Request Linking</h3>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <Label htmlFor="rRtid" className="text-sm font-semibold text-gray-700">
                    Patient R-RTID
                  </Label>
                  <div className="flex gap-2 mt-1.5">
                    <Input
                      id="rRtid"
                      placeholder="R-RTID-250126-Q1099"
                      value={rRtid}
                      onChange={(e) => setRRtid(e.target.value.toUpperCase())}
                      className={`flex-1 ${rRtidValid ? 'border-[var(--clr-success)] bg-green-50' :
                        rRtidError ? 'border-[var(--clr-emergency)] bg-red-50' :
                          'border-purple-200'
                        }`}
                    />
                    {rRtidLoading && <Loader2 className="w-6 h-6 animate-spin text-purple-600 mt-2" />}
                    {rRtidValid && <CheckCircle2 className="w-6 h-6 text-[var(--clr-success)] mt-2" />}
                    {rRtidError && <AlertCircle className="w-6 h-6 text-[var(--clr-danger)] mt-2" />}
                  </div>
                  {rRtidError && (
                    <p className="text-sm text-[var(--clr-danger)] mt-2 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {rRtidError}
                    </p>
                  )}
                </div>

                {/* R-RTID VALIDATION SUCCESS */}
                {rRtidValid && rRtidData && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="h-5 w-5 text-[var(--clr-success)]" />
                      <span className="font-bold text-green-800">Request Validated Successfully</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[var(--bg-surface)] rounded-lg p-3 border border-green-100">
                        <span className="text-xs text-[var(--text-secondary)] font-medium">Patient Name</span>
                        <p className="font-bold text-[var(--text-primary)] mt-1">{rRtidData.patientName}</p>
                      </div>

                      <div className="bg-[var(--bg-surface)] rounded-lg p-3 border border-green-100">
                        <span className="text-xs text-[var(--text-secondary)] font-medium">Blood Group</span>
                        <p className="font-bold text-[var(--clr-danger)] text-xl mt-1">{rRtidData.bloodGroup}</p>
                      </div>

                      <div className="bg-[var(--bg-surface)] rounded-lg p-3 border border-green-100">
                        <span className="text-xs text-[var(--text-secondary)] font-medium">Component</span>
                        <p className="font-bold text-[var(--text-primary)] mt-1">{rRtidData.component}</p>
                      </div>

                      <div className="bg-[var(--bg-surface)] rounded-lg p-3 border border-green-100">
                        <span className="text-xs text-[var(--text-secondary)] font-medium">Units Required</span>
                        <p className="font-bold text-[var(--text-primary)] mt-1">{rRtidData.unitsRequired}</p>
                      </div>

                      <div className="bg-[var(--bg-surface)] rounded-lg p-3 border border-green-100 col-span-2">
                        <span className="text-xs text-[var(--text-secondary)] font-medium">Hospital</span>
                        <p className="font-bold text-[var(--text-primary)] mt-1">{rRtidData.hospitalName}</p>
                      </div>

                      <div className="bg-[var(--bg-surface)] rounded-lg p-3 border border-green-100">
                        <span className="text-xs text-[var(--text-secondary)] font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Required By
                        </span>
                        <p className="font-bold text-[var(--clr-danger)] mt-1 text-sm">{rRtidData.requiredBy}</p>
                      </div>

                      {(rRtidData.district || rRtidData.state) && (
                        <div className="bg-[var(--bg-surface)] rounded-lg p-3 border border-green-100">
                          <span className="text-xs text-[var(--text-secondary)] font-medium">Location</span>
                          <p className="font-bold text-[var(--text-primary)] mt-1 text-sm">
                            {rRtidData.district}, {rRtidData.state}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 p-3 bg-[var(--bg-surface)] rounded-lg border border-green-200">
                      <p className="text-sm text-green-800 font-medium flex items-center gap-2">
                        <span>🎯</span>
                        <span>This donation will directly help <strong>{rRtidData.patientName}</strong></span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <DialogFooter className="border-t border-[var(--border-color)] pt-4">
          <Button variant="outline" onClick={handleClose} className="px-6">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-[var(--txt-inverse)] px-8 shadow-lg"
            disabled={donationType === 'R-RTID-Linked Donation' && !rRtidValid}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Confirm Check-In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};