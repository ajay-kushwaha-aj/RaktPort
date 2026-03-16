import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { Loader2, PlusCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Appointment, BloodGroup } from '@/types/bloodbank';
import { BloodBankHeader } from '@/components/BloodBankHeader';
import { BloodBankNavigation, TabType } from '@/components/BloodBankNavigation';
import { NotificationDrawer } from '@/components/NotificationDrawer';
import { OverviewTab } from '@/components/tabs/OverviewTab';
import { InventoryTab } from '@/components/tabs/InventoryTab';
import { AppointmentsTab } from '@/components/tabs/AppointmentsTab';
import { DonationsTab } from '@/components/tabs/DonationsTab';
import { RedemptionsTab } from '@/components/tabs/RedemptionsTab';
import { VerifyTab } from '@/components/tabs/VerifyTab';
import { RtidVerifyTab } from '@/components/tabs/RtidVerifyTab';
import { ReportsTab } from '@/components/tabs/ReportsTab';
import { Button } from '@/components/ui/button';
import { generateRtid } from '@/lib/bloodbank-utils';
import { BloodRequestModal } from '@/components/modals/BloodRequestModal';
import { DonationModal } from '@/components/modals/DonationModal';
import { AppointmentModal } from '@/components/modals/AppointmentModal';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { useBloodBankData } from '@/hooks/useBloodBankData';

export const BloodBankDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const {
    loading,
    bloodBankData,
    inventory,
    appointments,
    donations,
    redemptions,
    bloodRequests,
    notifications,
    bloodBankId,
    kpi,
    criticalGroups
  } = useBloodBankData();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [actionLoading, setActionLoading] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [bloodRequestModalOpen, setBloodRequestModalOpen] = useState(false);
  const [donationModalOpen, setDonationModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [checkInData, setCheckInData] = useState<Appointment | undefined>(undefined);

  const handleLogoutConfirm = () => {
    Swal.fire({
      title: 'Logout?',
      text: "Are you sure you want to logout?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, logout!'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        onLogout();
      }
    });
  };

  const handleCheckIn = (appointment: Appointment) => {
    console.log("Check-in initiated for:", appointment);
    setCheckInData(appointment);
    setDonationModalOpen(true);
  };

  // FIXED: Appointment registration with proper data structure
  const handleRegisterAppointment = async (data: any) => {
    if (!bloodBankId) {
      toast.error("Blood Bank ID not found");
      return;
    }

    setActionLoading(true);
    try {
      // Generate RTID first
      const appRtid = generateRtid('A');

      console.log("Creating appointment with data:", data);
      console.log("Blood Bank ID:", bloodBankId);
      console.log("Generated RTID:", appRtid);

      // FIXED: Ensure date is properly converted to Timestamp
      let appointmentDate: Timestamp;
      if (data.date instanceof Date) {
        appointmentDate = Timestamp.fromDate(data.date);
      } else if (typeof data.date === 'string') {
        appointmentDate = Timestamp.fromDate(new Date(data.date));
      } else {
        // Fallback to current date
        appointmentDate = Timestamp.fromDate(new Date());
      }

      // FIXED: Complete appointment data with all required fields
      const appointmentData = {
        rtid: appRtid,
        donorName: data.donorName || '',
        mobile: data.mobile || '',
        gender: data.gender || 'Male',
        bloodGroup: data.bloodGroup || 'O+',
        date: appointmentDate,
        time: data.time || '10:00',
        bloodBankId: bloodBankId,
        bloodBankName: bloodBankData?.fullName || 'Blood Bank',
        status: 'Upcoming', // CRITICAL: This must match the filter in AppointmentsTab
        createdAt: Timestamp.now(),
        // Additional fields for better tracking
        district: bloodBankData?.district || '',
        pincode: bloodBankData?.pincode || '',
      };

      console.log("Appointment data to be saved:", appointmentData);

      // Save to Firestore
      const docRef = await addDoc(collection(db, "appointments"), appointmentData);

      console.log("Appointment saved successfully with ID:", docRef.id);

      toast.success("Appointment Scheduled Successfully", {
        description: `${data.donorName} - ${appRtid}`,
        duration: 4000,
      });

      // Close modal
      setAppointmentModalOpen(false);

      // FIXED: Auto-switch to appointments tab to show the new appointment
      setTimeout(() => {
        setActiveTab('appointments');
      }, 500);

    } catch (err: any) {
      console.error("Appointment creation error:", err);
      toast.error("Failed to schedule appointment", {
        description: err.message || "Please try again"
      });
    } finally {
      setActionLoading(false);
    }
  };


  // BloodBankDashboard.tsx - FIXED handleDonation Function
  // Replace your existing handleDonation function with this updated version

  const handleDonation = async (data: any) => {
    if (!bloodBankId) {
      toast.error("Blood Bank ID not found");
      return;
    }

    setActionLoading(true);
    try {
      const finalDonorName = data.donorName || checkInData?.donorName || 'Unknown Donor';
      const finalBloodGroup = data.bloodGroup || checkInData?.bloodGroup || 'O+';
      const finalMobile = data.mobile || checkInData?.mobile || '';

      console.log("Processing donation with data:", data);

      // ====================================================================
      // STEP 1: Use EXISTING D-RTID from appointment
      // ====================================================================
      let dRtid: string;

      if (checkInData && checkInData.appointmentRtid) {
        dRtid = checkInData.appointmentRtid;
        console.log("✅ Using existing D-RTID from appointment:", dRtid);
      } else {
        dRtid = generateRtid('D');
        console.log("✅ Created new D-RTID for walk-in donation:", dRtid);
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // ====================================================================
      // STEP 2: Determine H-RTID Linking
      // ====================================================================
      let linkedHRTID = null;
      let patientName = null;
      let hospitalName = null;

      if (data.donationType === 'H-RTID-Linked Donation' && data.hRtid && data.hRtidData) {
        linkedHRTID = data.hRtid;
        patientName = data.hRtidData.patientName;
        hospitalName = data.hRtidData.hospitalName;
        console.log(`Linking donation to H-RTID: ${linkedHRTID} for patient: ${patientName}`);
      }

      // ====================================================================
      // STEP 3: Update EXISTING donation record (CRITICAL FIX)
      // ====================================================================
      const donationRef = doc(db, "donations", dRtid);
      const existingDonation = await getDoc(donationRef);

      if (existingDonation.exists()) {
        // UPDATE existing record - Change status from "Scheduled" to "AVAILABLE"
        await updateDoc(donationRef, {
          // Keep original fields
          status: 'AVAILABLE', // ✅ Now available for redemption
          donationType: data.donationType || 'Regular',
          component: data.component || 'Whole Blood',
          otp: otp,
          actualDonationDate: Timestamp.now(),

          // H-RTID linking
          hRtid: linkedHRTID,
          linkedHrtid: linkedHRTID,
          patientName: patientName,
          hospitalName: hospitalName,
          linkedDate: linkedHRTID ? Timestamp.now() : null,

          // Impact Timeline
          impactTimeline: {
            donated: Timestamp.now(),
            linkedToRequest: linkedHRTID ? Timestamp.now() : null,
            usedByPatient: null,
            creditIssued: null
          },

          // Update metadata
          updatedAt: Timestamp.now()
        });

        console.log("✅ Updated existing donation record to AVAILABLE status");
      } else {
        // CREATE new record (walk-in donation, no appointment)
        const newDonationData: any = {
          rtid: dRtid,
          dRtid: dRtid,
          bloodBankId: bloodBankId,
          bloodBankName: bloodBankData?.fullName || 'Blood Bank',
          donorName: finalDonorName,
          donorMobile: finalMobile,
          bloodGroup: finalBloodGroup,
          donationType: data.donationType || 'Regular',
          component: data.component || 'Whole Blood',
          otp: otp,
          status: 'AVAILABLE',
          date: Timestamp.now(),
          createdAt: Timestamp.now(),
          donationLocation: bloodBankData?.district || 'Blood Bank',
          city: bloodBankData?.district || 'Unknown',

          // H-RTID linking
          hRtid: linkedHRTID,
          linkedHrtid: linkedHRTID,
          patientName: patientName,
          hospitalName: hospitalName,
          linkedDate: linkedHRTID ? Timestamp.now() : null,

          // Impact Timeline
          impactTimeline: {
            donated: Timestamp.now(),
            linkedToRequest: linkedHRTID ? Timestamp.now() : null,
            usedByPatient: null,
            creditIssued: null
          },

          // Appointment linking (if from check-in)
          appointmentRtid: checkInData?.appointmentRtid || null,
          donorId: checkInData?.donorId || null
        };

        await setDoc(donationRef, newDonationData);
        console.log("✅ Created new donation record");
      }

      // ====================================================================
      // STEP 4: Update Inventory
      // ====================================================================
      const bg = finalBloodGroup as BloodGroup;
      const invRef = doc(db, "inventory", bloodBankId);
      const currentBgInv = inventory && inventory[bg] ? inventory[bg] : { total: 0, available: 0 };
      const newTotal = (currentBgInv.total || 0) + 1;
      const newAvail = (currentBgInv.available || 0) + 1;

      await updateDoc(invRef, {
        [bg]: {
          total: newTotal,
          available: newAvail
        }
      });

      console.log(`✅ Inventory updated: ${bg} -> Total: ${newTotal}, Available: ${newAvail}`);

      // ====================================================================
      // STEP 5: Update Appointment Status (if check-in) - CRITICAL FIX
      // ====================================================================
      if (checkInData && checkInData.appointmentRtid) {
        const appointmentQuery = query(
          collection(db, "appointments"),
          where("rtid", "==", checkInData.appointmentRtid)
        );
        const appointmentSnapshot = await getDocs(appointmentQuery);

        if (!appointmentSnapshot.empty) {
          const appointmentDoc = appointmentSnapshot.docs[0];
          await updateDoc(appointmentDoc.ref, {
            status: 'Completed',
            completedAt: Timestamp.now(),
            donatedBloodGroup: finalBloodGroup,
            donatedComponent: data.component || 'Whole Blood'
          });
          console.log("✅ Appointment marked as Completed");
        }
      }

      // ====================================================================
      // STEP 6: Update Donor Profile with Medical Tracking
      // ====================================================================
      if (checkInData?.donorId) {
        const donorRef = doc(db, "users", checkInData.donorId);
        const donorDoc = await getDoc(donorRef);

        if (donorDoc.exists()) {
          const currentCount = donorDoc.data().donationsCount || 0;
          const currentCredits = donorDoc.data().credits || 0;
          const donationsThisYear = donorDoc.data().donationsThisYear || 0;

          // Calculate donations this year
          const currentYear = new Date().getFullYear();
          const lastDonationYear = donorDoc.data().lastDonationDate
            ? new Date(donorDoc.data().lastDonationDate).getFullYear()
            : 0;

          const updatedDonationsThisYear = lastDonationYear === currentYear
            ? donationsThisYear + 1
            : 1;

          await updateDoc(donorRef, {
            donationsCount: currentCount + 1,
            credits: currentCredits + 1,
            lastDonationDate: new Date().toISOString(),
            lastDonationType: data.component || 'Whole Blood',
            donationsThisYear: updatedDonationsThisYear,

            // Medical tracking for eligibility
            lastDonationComponent: data.component || 'Whole Blood',
            lastDonationTimestamp: Timestamp.now()
          });
          console.log("✅ Donor profile updated with medical tracking");
        }
      }

      // ====================================================================
      // STEP 7: If H-RTID Linked, Update Blood Request
      // ====================================================================
      if (linkedHRTID) {
        try {
          let reqRef: any = null;
          let reqData: any = null;

          let reqSnap = await getDoc(doc(db, "bloodRequests", linkedHRTID));
          if (reqSnap.exists()) {
            reqRef = reqSnap.ref;
            reqData = reqSnap.data();
          } else {
            const queries = [
              query(collection(db, "bloodRequests"), where("linkedRTID", "==", linkedHRTID)),
              query(collection(db, "bloodRequests"), where("rtid", "==", linkedHRTID))
            ];
            for (const q of queries) {
              const qSnap = await getDocs(q);
              if (!qSnap.empty) {
                reqSnap = qSnap.docs[0];
                reqRef = reqSnap.ref;
                reqData = reqSnap.data();
                break;
              }
            }
          }

          if (reqRef && reqData) {
            const currentFulfilled = reqData.unitsFulfilled || 0;
            const required = reqData.unitsRequired || reqData.units || 1;
            const newFulfilled = currentFulfilled + 1;
            const newStatus = newFulfilled >= required ? 'FULFILLED' : 'PARTIAL';

            await updateDoc(reqRef, {
              status: newStatus,
              unitsFulfilled: newFulfilled,
              fulfilledBy: bloodBankId,
              linkedDonations: [...(reqData.linkedDonations || []), dRtid],
              lastUpdated: Timestamp.now()
            });

            console.log(`✅ Blood request updated: ${newFulfilled}/${required} units fulfilled`);
          }
        } catch (err) {
          console.error("Failed to update blood request:", err);
        }
      }

      // ====================================================================
      // SUCCESS MESSAGE
      // ====================================================================
      const successMsg = linkedHRTID
        ? `Donation linked to patient ${patientName}!`
        : `${finalDonorName} - D-RTID: ${dRtid}`;

      toast.success("Donation Recorded Successfully", {
        description: successMsg,
        duration: 4000,
      });

      console.log(`📱 OTP ${otp} generated (only visible to donor)`);

      setDonationModalOpen(false);
      setCheckInData(undefined);

      // Refresh to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err: any) {
      console.error("Donation error:", err);
      toast.error("Failed to record donation", {
        description: err.message
      });
    } finally {
      setActionLoading(false);
    }
  };

  // PART 4: BloodBankDashboard.tsx - Enhanced Redemption Handler
  // Replace the existing handleVerifyAndRedeem function with this:


  const handleVerifyAndRedeem = async (hRtid: string, dRtid: string, otp: string) => {
    setActionLoading(true);
    try {
      let reqRef: any = null;
      let reqData: any = null;

      // ====================================================================
      // STEP 1: Find Blood Request (H-RTID)
      // ====================================================================
      let reqSnap = await getDoc(doc(db, "bloodRequests", hRtid));
      if (reqSnap.exists()) {
        reqRef = reqSnap.ref;
        reqData = reqSnap.data();
      } else {
        const queries = [
          query(collection(db, "bloodRequests"), where("linkedRTID", "==", hRtid)),
          query(collection(db, "bloodRequests"), where("rtid", "==", hRtid))
        ];
        for (const q of queries) {
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
            reqSnap = qSnap.docs[0];
            reqRef = reqSnap.ref;
            reqData = reqSnap.data();
            break;
          }
        }
      }

      if (!reqData) throw new Error("Blood request not found.");

      // ====================================================================
      // STEP 2: Validate Request
      // ====================================================================
      if (reqData.validityHours && reqData.createdAt) {
        const createdAt = reqData.createdAt?.toDate ? reqData.createdAt.toDate() : new Date(reqData.createdAt);
        const validUntil = new Date(createdAt.getTime() + reqData.validityHours * 60 * 60 * 1000);
        if (new Date() > validUntil) throw new Error("Request has expired.");
      }

      if (reqData.status === 'REDEEMED' || reqData.status === 'CLOSED') {
        const fulfilled = reqData.unitsFulfilled || 0;
        const required = reqData.unitsRequired || 1;
        if (fulfilled >= required) throw new Error("Request already fulfilled.");
      }

      // ====================================================================
      // STEP 3: Find and Validate Donation (D-RTID)
      // ====================================================================
      if (dRtid) {
        let donRef: any = null;
        let donData: any = null;

        let donSnap = await getDoc(doc(db, "donations", dRtid));
        if (donSnap.exists()) {
          donRef = donSnap.ref;
          donData = donSnap.data();
        } else {
          const queries = [
            query(collection(db, "donations"), where("rtid", "==", dRtid)),
            query(collection(db, "donations"), where("dRtid", "==", dRtid))
          ];
          for (const q of queries) {
            const qSnap = await getDocs(q);
            if (!qSnap.empty) {
              donSnap = qSnap.docs[0];
              donRef = donSnap.ref;
              donData = donSnap.data();
              break;
            }
          }
        }

        if (!donData) throw new Error("Donation not found.");
        if (donData.status !== 'AVAILABLE' && donData.status !== 'Donated') {
          throw new Error(`Donation not available. Current status: ${donData.status}`);
        }
        if (donData.otp && donData.otp !== otp) throw new Error("Invalid OTP.");

        // ====================================================================
        // STEP 4: Update Donation to "REDEEMED" with Patient Details
        // ====================================================================
        await updateDoc(donRef, {
          status: 'REDEEMED',
          hRtid: hRtid,
          linkedHrtid: hRtid,
          redemptionDate: Timestamp.now(),
          redeemedAt: Timestamp.now(),
          patientName: reqData.patientName || 'Patient',
          hospitalName: reqData.hospitalName || bloodBankData?.fullName || 'Hospital',

          // Impact Timeline
          linkedDate: Timestamp.now(),
          usedDate: Timestamp.now()
        });

        console.log(`✅ Donation ${dRtid} redeemed for patient ${reqData.patientName}`);

        // ====================================================================
        // STEP 5: Update Inventory (Decrease Available)
        // ====================================================================
        const bg = donData.bloodGroup as BloodGroup;
        const currentBgInv = inventory && inventory[bg] ? inventory[bg] : { total: 0, available: 0 };
        const newAvail = Math.max(0, (currentBgInv.available || 0) - 1);

        await updateDoc(doc(db, "inventory", bloodBankId!), {
          [bg]: {
            total: currentBgInv.total,
            available: newAvail
          }
        });

        console.log(`✅ Inventory updated: ${bg} -> Available: ${newAvail}`);

        // ====================================================================
        // STEP 6: Update Donor's Credit
        // ====================================================================
        if (donData.donorId) {
          const donorRef = doc(db, "users", donData.donorId);
          const donorDoc = await getDoc(donorRef);

          if (donorDoc.exists()) {
            const currentCredits = donorDoc.data().credits || 0;

            await updateDoc(donorRef, {
              credits: currentCredits + 1 // Additional credit for redemption
            });

            console.log(`✅ Donor credited for redemption`);
          }
        }
      }

      // ====================================================================
      // STEP 7: Update Blood Request Status
      // ====================================================================
      const currentFulfilled = reqData.unitsFulfilled || 0;
      const required = reqData.unitsRequired || 1;
      const newFulfilled = currentFulfilled + 1;
      const newStatus = newFulfilled >= required ? 'REDEEMED' : 'PARTIAL';

      await updateDoc(reqRef, {
        status: newStatus,
        unitsFulfilled: newFulfilled,
        fulfilled: newFulfilled,
        redeemedAt: Timestamp.now(),
        scannedLocation: bloodBankData?.fullName || 'Blood Bank',
        fulfilledBy: bloodBankId
      });

      console.log(`✅ Blood request updated: ${newFulfilled}/${required} units fulfilled`);

      toast.success("Redemption Successful! 🎉", {
        description: `${reqData.patientName} received ${newFulfilled} unit(s) of ${reqData.bloodGroup}`,
        duration: 5000
      });

      // Refresh data
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (err: any) {
      console.error("Redemption error:", err);
      toast.error(err.message || "Redemption Failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyRtid = async (rtid: string) => {
    setActionLoading(true);
    try {
      let data: any = null;
      let type = '';

      if (rtid.toUpperCase().includes('H-RTID') || rtid.toUpperCase().startsWith('H')) {
        const queries = [
          getDoc(doc(db, "bloodRequests", rtid)),
          getDocs(query(collection(db, "bloodRequests"), where("linkedRTID", "==", rtid))),
          getDocs(query(collection(db, "bloodRequests"), where("rtid", "==", rtid)))
        ];
        for (const q of queries) {
          const res = await q;
          if ('exists' in res && res.exists()) {
            data = res.data();
            type = 'Blood Request';
            break;
          }
          else if ('empty' in res && !res.empty) {
            data = res.docs[0].data();
            type = 'Blood Request';
            break;
          }
        }
      }
      else if (rtid.toUpperCase().includes('D-RTID') || rtid.toUpperCase().startsWith('D')) {
        const queries = [
          getDoc(doc(db, "donations", rtid)),
          getDocs(query(collection(db, "donations"), where("rtid", "==", rtid))),
          getDocs(query(collection(db, "donations"), where("dRtid", "==", rtid)))
        ];
        for (const q of queries) {
          const res = await q;
          if ('exists' in res && res.exists()) {
            data = res.data();
            type = 'Donation';
            break;
          }
          else if ('empty' in res && !res.empty) {
            data = res.docs[0].data();
            type = 'Donation';
            break;
          }
        }
      }

      if (!data) throw new Error("RTID not found in system");

      let statusColor = 'text-blue-600';
      if (data.status === 'AVAILABLE') statusColor = 'text-green-600';
      if (data.status === 'REDEEMED') statusColor = 'text-orange-600';
      if (data.status === 'PENDING') statusColor = 'text-yellow-600';

      await Swal.fire({
        title: '✅ Verified',
        html: `
          <div class="text-left space-y-3 p-4">
            <div class="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p class="text-sm text-gray-600 mb-1">Type</p>
              <p class="font-bold text-lg">${type}</p>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p class="text-sm text-gray-600 mb-1">ID</p>
              <p class="font-mono font-bold">${data.rtid || rtid}</p>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p class="text-sm text-gray-600 mb-1">Name</p>
              <p class="font-semibold">${data.patientName || data.donorName || 'N/A'}</p>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p class="text-sm text-gray-600 mb-1">Blood Group</p>
              <p class="font-bold text-red-600 text-xl">${data.bloodGroup || 'N/A'}</p>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p class="text-sm text-gray-600 mb-1">Status</p>
              <p class="font-bold ${statusColor}">${data.status || 'N/A'}</p>
            </div>
            ${type === 'Blood Request' ? `
              <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p class="text-sm text-gray-600 mb-1">Hospital</p>
                <p class="font-semibold">${data.hospitalName || 'N/A'}</p>
              </div>
              <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p class="text-sm text-gray-600 mb-1">Units Required</p>
                <p class="font-bold text-lg">${data.unitsRequired || data.units || 'N/A'}</p>
              </div>
            ` : ''}
            ${type === 'Donation' ? `
              <div class="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p class="text-sm text-gray-600 mb-1">Donation Type</p>
                <p class="font-semibold">${data.donationType || 'Regular'}</p>
              </div>
            ` : ''}
          </div>
        `,
        icon: 'success',
        confirmButtonColor: '#10b981'
      });

    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Loading Dashboard...</p>
      </div>
    );
  }

  if (!bloodBankId) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
        <Button onClick={onLogout} className="mt-6">Back to Login</Button>
      </div>
    );
  }

  // DEBUG: Log appointments data
  console.log("Current appointments count:", appointments.length);
  console.log("Appointments data:", appointments);

  return (
    <div className="min-h-screen bg-background font-sans">
      <BloodBankHeader
        onNotificationClick={() => setNotificationDrawerOpen(!notificationDrawerOpen)}
        notificationCount={notifications.filter(n => !n.read).length}
        bloodRequestsCount={bloodRequests.length}
        onLogout={handleLogoutConfirm}
        location={`${bloodBankData?.district || '...'}, ${bloodBankData?.pincode || '...'}`}
      />

      <BloodBankNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex justify-end items-center mt-4">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-primary text-primary hover:bg-primary/5"
            onClick={() => setAppointmentModalOpen(true)}
          >
            <PlusCircle className="w-4 h-4" /> Quick Appointment
          </Button>
        </div>
      </div>

      <NotificationDrawer
        isOpen={notificationDrawerOpen}
        notifications={notifications}
        onClose={() => setNotificationDrawerOpen(false)}
      />

      {actionLoading && (
        <div className="fixed inset-0 bg-black/30 z-[100] flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-white" />
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {criticalGroups.length > 0 && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-3 text-destructive">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div>
              <span className="font-bold">Critical Shortage Alert:</span>
              {' '}{criticalGroups.join(', ')} stock is below 30 units.
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <OverviewTab
            kpi={kpi}
            onCheckInAppointment={() => setActiveTab('appointments')}
          />
        )}

        {activeTab === 'inventory' && inventory && (
          <InventoryTab inventory={inventory} />
        )}

        {activeTab === 'appointments' && (
          <AppointmentsTab
            appointments={appointments}
            onCheckIn={handleCheckIn}
          />
        )}

        {activeTab === 'donations' && (
          <DonationsTab donations={donations} />
        )}

        {activeTab === 'redemptions' && (
          <RedemptionsTab redemptions={redemptions} />
        )}

        {activeTab === 'verify' && (
          <VerifyTab onVerifyAndRedeem={handleVerifyAndRedeem} />
        )}

        {activeTab === 'rtidVerify' && (
          <RtidVerifyTab onVerifyRtid={handleVerifyRtid} />
        )}

        {activeTab === 'reports' && (
          <ReportsTab
            inventory={inventory}
            donations={donations}
            redemptions={redemptions}
            criticalGroups={criticalGroups}
          />
        )}

        {activeTab === 'camps' && (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-muted-foreground mb-4">Blood Donation Camps</h2>
            <p className="text-muted-foreground">Coming Soon - Manage and organize blood donation camps</p>
          </div>
        )}
      </div>

      <BloodRequestModal
        isOpen={bloodRequestModalOpen}
        onClose={() => setBloodRequestModalOpen(false)}
        onSubmit={(data) => {
          toast.info("Inter-bank request not implemented yet");
          setBloodRequestModalOpen(false);
        }}
      />

      <DonationModal
        key={checkInData ? `donation-${checkInData.appointmentRtid}` : 'new-donation'}
        isOpen={donationModalOpen}
        onClose={() => {
          setDonationModalOpen(false);
          setCheckInData(undefined);
        }}
        onSubmit={handleDonation}
        checkInData={checkInData}
      />

      <AppointmentModal
        isOpen={appointmentModalOpen}
        onClose={() => setAppointmentModalOpen(false)}
        onSubmit={handleRegisterAppointment}
      />
    </div>
  );
};
export default BloodBankDashboard;