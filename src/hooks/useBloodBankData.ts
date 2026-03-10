import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  onSnapshot,
  setDoc
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  Inventory,
  Appointment,
  Donation,
  Redemption,
  BloodRequest,
  Notification,
  KPIData,
  BloodGroup,
} from '@/types/bloodbank';

export const parseFirestoreDate = (dateField: any): Date => {
  if (!dateField) return new Date();
  if (dateField?.toDate) return dateField.toDate();
  if (dateField instanceof Date) return dateField;
  if (typeof dateField === 'string') return new Date(dateField);
  return new Date();
};

export const useBloodBankData = () => {
  const [loading, setLoading] = useState(true);
  const [bloodBankData, setBloodBankData] = useState<any>(null);
  const [inventory, setInventory] = useState<Inventory>({
    'A+': { total: 0, available: 0 },
    'A-': { total: 0, available: 0 },
    'B+': { total: 0, available: 0 },
    'B-': { total: 0, available: 0 },
    'AB+': { total: 0, available: 0 },
    'AB-': { total: 0, available: 0 },
    'O+': { total: 0, available: 0 },
    'O-': { total: 0, available: 0 },
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [bloodBankId, setBloodBankId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    let unsubscribers: (() => void)[] = [];

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      unsubscribers.forEach(u => u());
      unsubscribers = [];

      const authEmail = user?.email;
      const localEmail = localStorage.getItem('userEmail') || localStorage.getItem('userId');
      const effectiveEmail = authEmail || localEmail;

      if (!effectiveEmail) {
        console.warn("No email found - redirecting to login");
        setBloodBankId(null);
        setUserEmail(null);
        setLoading(false);
        return;
      }

      setUserEmail(effectiveEmail);
      setLoading(true);

      try {
        const usersRef = collection(db, "users");
        const emailQuery = query(usersRef, where("userId", "==", effectiveEmail));
        const userSnapshot = await getDocs(emailQuery);

        let bloodBankDoc: any = null;
        let bloodBankDocId: string = effectiveEmail;

        if (!userSnapshot.empty) {
          bloodBankDoc = userSnapshot.docs[0];
          bloodBankDocId = bloodBankDoc.id;
        } else {
          const directDocRef = doc(db, "users", effectiveEmail);
          const directDocSnap = await getDoc(directDocRef);
          if (directDocSnap.exists()) {
            bloodBankDoc = directDocSnap;
            bloodBankDocId = effectiveEmail;
          }
        }

        if (!bloodBankDoc || !bloodBankDoc.exists()) {
          throw new Error("Blood Bank profile not found. Please contact administrator.");
        }

        const userData = bloodBankDoc.data();
        if (userData.role !== 'bloodbank') {
          throw new Error("Invalid account type. This dashboard is for blood banks only.");
        }

        setBloodBankData(userData);
        setBloodBankId(bloodBankDocId);

        const unsubUser = onSnapshot(doc(db, "users", bloodBankDocId), (snapshot) => {
          if (snapshot.exists()) {
            setBloodBankData(snapshot.data());
          }
        }, (error) => toast.error("Failed to sync profile", { description: error.message }));
        unsubscribers.push(unsubUser);

        const inventoryRef = doc(db, "inventory", bloodBankDocId);
        const unsubInventory = onSnapshot(inventoryRef, async (snapshot) => {
          if (snapshot.exists()) {
            const rawData = snapshot.data();
            const safeInventory: any = {};
            const groups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

            groups.forEach(bg => {
              const value = rawData[bg];
              if (value && typeof value === 'object' && 'total' in value) {
                safeInventory[bg] = {
                  total: Number(value.total) || 0,
                  available: Number(value.available) || 0
                };
              } else if (typeof value === 'number') {
                safeInventory[bg] = { total: value, available: value };
              } else if (typeof value === 'string' && !isNaN(Number(value))) {
                const units = Number(value);
                safeInventory[bg] = { total: units, available: units };
              } else {
                safeInventory[bg] = { total: 0, available: 0 };
              }
            });
            setInventory(safeInventory as Inventory);
          } else {
            const emptyInventory: any = {};
            const groups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
            groups.forEach(bg => { emptyInventory[bg] = { total: 0, available: 0 }; });
            await setDoc(inventoryRef, emptyInventory).catch(console.error);
            setInventory(emptyInventory as Inventory);
          }
          setLoading(false);
        });
        unsubscribers.push(unsubInventory);

        const appQuery = query(collection(db, "appointments"), where("bloodBankId", "==", bloodBankDocId));
        const unsubAppointments = onSnapshot(appQuery, (snapshot) => {
          const fetchedAppointments: Appointment[] = snapshot.docs.map(d => {
            const data = d.data();
            return {
              appointmentRtid: data.rtid || d.id,
              donorName: data.donorName || '',
              bloodGroup: (data.bloodGroup as BloodGroup) || 'O+',
              date: parseFirestoreDate(data.date),
              time: data.time || '10:00',
              status: (data.status as Appointment['status']) || 'Upcoming',
              mobile: data.mobile || '',
              gender: data.gender || ''
            };
          });
          setAppointments(fetchedAppointments.sort((a, b) => a.date.getTime() - b.date.getTime()));
        });
        unsubscribers.push(unsubAppointments);

        const donQuery = query(collection(db, "donations"), where("bloodBankId", "==", bloodBankDocId));
        const unsubDonations = onSnapshot(donQuery, (snapshot) => {
          const fetchedDonations: Donation[] = snapshot.docs.map(d => {
            const data = d.data();
            return {
              dRtid: data.rtid || data.dRtid || d.id,
              otp: data.otp || '',
              bloodGroup: (data.bloodGroup as BloodGroup) || 'O+',
              donorName: data.donorName || '',
              donationType: data.donationType || 'Regular',
              hRtid: data.hRtid || null,
              status: (data.status as Donation['status']) || 'AVAILABLE',
              donationLocation: data.donationLocation || userData.district || 'Blood Bank',
              date: parseFirestoreDate(data.date || data.createdAt)
            };
          });

          fetchedDonations.sort((a, b) => b.date.getTime() - a.date.getTime());
          setDonations(fetchedDonations);

          const fetchedRedemptions: Redemption[] = fetchedDonations
            .filter(d => (d.status === 'REDEEMED' || d.status === 'Redeemed') && d.hRtid)
            .map(d => ({
              dRtid: d.dRtid,
              bloodGroup: d.bloodGroup,
              donationLocation: d.donationLocation,
              redemptionLocation: 'Hospital',
              linkedHRTID: d.hRtid!,
              date: d.date,
              bloodBankId: bloodBankDocId
            }));

          fetchedRedemptions.sort((a, b) => b.date.getTime() - a.date.getTime());
          setRedemptions(fetchedRedemptions);
        });
        unsubscribers.push(unsubDonations);

        if (userData.district) {
          const requestsQuery = query(collection(db, "bloodRequests"), where("city", "==", userData.district));
          const unsubRequests = onSnapshot(requestsQuery, (snapshot) => {
            const fetchedRequests: BloodRequest[] = snapshot.docs.map(d => {
              const data = d.data();
              return {
                rtid: data.linkedRTID || data.rtid || d.id,
                patientName: data.patientName || 'Unknown',
                bloodGroup: (data.bloodGroup as BloodGroup) || 'O+',
                units: data.unitsRequired || data.units || 1,
                city: data.city || userData.district,
                hospitalName: data.hospitalName || 'Unknown Hospital',
                status: data.status || 'PENDING',
                createdAt: parseFirestoreDate(data.createdAt)
              };
            });
            setBloodRequests(fetchedRequests);
          });
          unsubscribers.push(unsubRequests);
        }

        const notificationsQuery = query(collection(db, "notifications"), where("bloodBankId", "==", bloodBankDocId));
        const unsubNotifications = onSnapshot(notificationsQuery, (snapshot) => {
          const fetchedNotifications: Notification[] = snapshot.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              message: data.message || '',
              type: (data.type as 'success' | 'error' | 'info') || 'info',
              timestamp: parseFirestoreDate(data.timestamp),
              read: data.read || false
            };
          });
          setNotifications(fetchedNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
        });
        unsubscribers.push(unsubNotifications);

        setLoading(false);

      } catch (error: any) {
        console.error("Setup Error:", error);
        toast.error(error.message || "Failed to initialize dashboard");
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  const kpi: KPIData = useMemo(() => {
    const safeKpi = { totalInventory: 0, availableUnits: 0, todayAppointments: 0, totalDonations: 0, totalRedemptions: 0, totalBloodRequests: 0 };
    if (!inventory) return safeKpi;

    try {
      const totalInv = Object.values(inventory).reduce((acc, curr) => acc + (Number(curr?.total) || 0), 0);
      const availUnits = Object.values(inventory).reduce((acc, curr) => acc + (Number(curr?.available) || 0), 0);
      const today = new Date().toDateString();
      const todayApps = appointments.filter(a => new Date(a.date).toDateString() === today).length;

      return {
        totalInventory: totalInv,
        availableUnits: availUnits,
        todayAppointments: todayApps,
        totalDonations: donations.length,
        totalRedemptions: redemptions.length,
        totalBloodRequests: bloodRequests.length
      };
    } catch (e) {
      console.error("KPI Error:", e);
      return safeKpi;
    }
  }, [inventory, appointments, donations, redemptions, bloodRequests]);

  const criticalGroups = useMemo(() => {
    if (!inventory) return [];
    return (Object.keys(inventory) as BloodGroup[]).filter(bg => inventory[bg].available < 30);
  }, [inventory]);

  return {
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
  };
};