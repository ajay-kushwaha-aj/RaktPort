// useBloodBankData.ts  ── FIXED
//
// ROOT CAUSE OF BUG:
//   Firebase Auth  →  user.email  (e.g. "bank@gmail.com")
//   Firestore docs →  stored at  doc(db, 'users', user.uid)
//   Old code used user.email for BOTH query field AND doc-ID lookup → both fail.
//
// FIX:
//   resolveBloodBankDoc() tries user.uid first (always correct),
//   then progressively weaker fallbacks so legacy accounts still work.

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { db } from '../firebase';
import {
  collection, getDocs, query, where,
  doc, getDoc, onSnapshot, setDoc,
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  Inventory, Appointment, Donation, Redemption,
  BloodRequest, Notification, KPIData, BloodGroup,
} from '@/types/bloodbank';

// ── Date parser ───────────────────────────────────────────────────────────────
export const parseFirestoreDate = (dateField: any): Date => {
  if (!dateField) return new Date();
  if (dateField?.toDate) return dateField.toDate();
  if (dateField instanceof Date) return dateField;
  if (typeof dateField === 'string') return new Date(dateField);
  if (typeof dateField === 'number') return new Date(dateField);
  if (dateField?.seconds) return new Date(dateField.seconds * 1000);
  return new Date();
};

// ── Resolve the blood-bank's Firestore document ───────────────────────────────
//
//  Priority order:
//   1. Firebase Auth UID       → doc(db, 'users', uid)           ← always correct
//   2. Cached localStorage 'userUid'                             ← fast repeat lookup
//   3. localStorage 'userId' as direct doc ID (may be a uid)
//   4. Query: email field == Firebase Auth email
//   5. Query: userId field == localStorage value  (legacy accounts)
//   6. Query: userId field == Firebase Auth email  (legacy accounts)
//
async function resolveBloodBankDoc(
  uid: string | null,
  email: string | null,
  localId: string | null,
): Promise<{ docId: string; data: any } | null> {

  // helper: try a direct doc lookup
  const tryDoc = async (id: string) => {
    try {
      const s = await getDoc(doc(db, 'users', id));
      return s.exists() ? { docId: id, data: s.data() } : null;
    } catch { return null; }
  };

  // helper: try a where-query
  const tryQuery = async (field: string, value: string) => {
    try {
      const s = await getDocs(query(collection(db, 'users'), where(field, '==', value)));
      return s.empty ? null : { docId: s.docs[0].id, data: s.docs[0].data() };
    } catch { return null; }
  };

  let r: { docId: string; data: any } | null = null;

  // 1. Firebase UID
  if (uid)                                    r = await tryDoc(uid);
  // 2. Cached uid
  const cached = localStorage.getItem('userUid');
  if (!r && cached && cached !== uid)         r = await tryDoc(cached);
  // 3. localStorage userId as doc key
  if (!r && localId && localId !== uid && localId !== cached)
                                              r = await tryDoc(localId);
  // 4. Query by email field
  if (!r && email)                            r = await tryQuery('email', email);
  // 5. Query by legacy userId field
  if (!r && localId)                          r = await tryQuery('userId', localId);
  if (!r && email)                            r = await tryQuery('userId', email);

  if (r) console.debug('[BBData] resolved docId:', r.docId);
  else   console.error('[BBData] could not resolve doc. hints:', { uid, email, localId });

  return r;
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export const useBloodBankData = () => {
  const [loading,        setLoading]        = useState(true);
  const [bloodBankData,  setBloodBankData]  = useState<any>(null);
  const [inventory,      setInventory]      = useState<Inventory>({
    'A+': { total: 0, available: 0 }, 'A-': { total: 0, available: 0 },
    'B+': { total: 0, available: 0 }, 'B-': { total: 0, available: 0 },
    'AB+': { total: 0, available: 0 }, 'AB-': { total: 0, available: 0 },
    'O+': { total: 0, available: 0 }, 'O-': { total: 0, available: 0 },
  });
  const [appointments,   setAppointments]   = useState<Appointment[]>([]);
  const [donations,      setDonations]      = useState<Donation[]>([]);
  const [redemptions,    setRedemptions]    = useState<Redemption[]>([]);
  const [bloodRequests,  setBloodRequests]  = useState<BloodRequest[]>([]);
  const [notifications,  setNotifications]  = useState<Notification[]>([]);
  const [bloodBankId,    setBloodBankId]    = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    let unsubs: (() => void)[] = [];

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      unsubs.forEach(u => u());
      unsubs = [];

      const firebaseUid   = user?.uid   ?? null;
      const firebaseEmail = user?.email ?? null;
      const localId       = localStorage.getItem('userId')    ?? null;
      const localEmail    = localStorage.getItem('userEmail') ?? null;
      const emailHint     = firebaseEmail ?? localEmail;

      if (!firebaseUid && !localId && !emailHint) {
        setBloodBankId(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const resolved = await resolveBloodBankDoc(firebaseUid, emailHint, localId);

        if (!resolved) {
          throw new Error(
            'Blood Bank profile not found. Please ensure you registered as a Blood Bank ' +
            'and that your account has been approved by the administrator.'
          );
        }

        const { docId: bbId, data: userData } = resolved;

        if (userData.role !== 'bloodbank') {
          throw new Error(
            `This account is registered as "${userData.role}". ` +
            'Please use the Blood Bank login option.'
          );
        }

        // Cache the resolved UID for instant future lookups
        if (bbId !== localStorage.getItem('userUid')) {
          localStorage.setItem('userUid', bbId);
        }

        setBloodBankData(userData);
        setBloodBankId(bbId);

        // ── Real-time listeners ─────────────────────────────────────────────

        // Profile
        unsubs.push(onSnapshot(
          doc(db, 'users', bbId),
          s  => { if (s.exists()) setBloodBankData(s.data()); },
          err => console.error('[BBData] profile:', err)
        ));

        // Inventory
        const invRef = doc(db, 'inventory', bbId);
        unsubs.push(onSnapshot(invRef,
          async s => {
            const groups: BloodGroup[] = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
            if (s.exists()) {
              const raw = s.data();
              const safe: any = {};
              groups.forEach(bg => {
                const v = raw[bg];
                if (v && typeof v === 'object' && 'total' in v) {
                  safe[bg] = { total: Number(v.total) || 0, available: Number(v.available) || 0 };
                } else if (typeof v === 'number') {
                  safe[bg] = { total: v, available: v };
                } else {
                  safe[bg] = { total: 0, available: 0 };
                }
              });
              setInventory(safe as Inventory);
            } else {
              const empty: any = {};
              groups.forEach(bg => { empty[bg] = { total: 0, available: 0 }; });
              await setDoc(invRef, empty).catch(console.error);
              setInventory(empty as Inventory);
            }
            setLoading(false);
          },
          err => { console.error('[BBData] inventory:', err); setLoading(false); }
        ));

        // Appointments
        unsubs.push(onSnapshot(
          query(collection(db, 'appointments'), where('bloodBankId', '==', bbId)),
          s => {
            const appts: Appointment[] = s.docs.map(d => {
              const v = d.data();
              return {
                appointmentRtid: v.rtid || d.id,
                donorName:  v.donorName  || '',
                bloodGroup: (v.bloodGroup as BloodGroup) || 'O+',
                date:       parseFirestoreDate(v.date),
                time:       v.time    || '10:00',
                status:     (v.status as Appointment['status']) || 'Upcoming',
                mobile:     v.mobile  || '',
                gender:     v.gender  || '',
                district:   v.district || '',
                pincode:    v.pincode  || '',
                donorId:    v.donorId  || null,
              };
            });
            setAppointments(appts.sort((a, b) => a.date.getTime() - b.date.getTime()));
          }
        ));

        // Donations (and derive redemptions in same listener)
        unsubs.push(onSnapshot(
          query(collection(db, 'donations'), where('bloodBankId', '==', bbId)),
          s => {
            const dons: Donation[] = s.docs.map(d => {
              const v = d.data();
              return {
                dRtid:           v.rtid || v.dRtid || d.id,
                otp:             v.otp  || '',
                bloodGroup:      (v.bloodGroup as BloodGroup) || 'O+',
                donorName:       v.donorName   || '',
                donorMobile:     v.donorMobile || '',
                donationType:    v.donationType || 'Regular',
                component:       v.component   || 'Whole Blood',
                rRtid:           v.rRtid       || null,
                linkedRrtid:     v.linkedRrtid || null,
                status:          (v.status as Donation['status']) || 'AVAILABLE',
                donationLocation:v.donationLocation || userData.district || 'Blood Bank',
                city:            v.city || '',
                bloodBankName:   v.bloodBankName || userData.fullName || '',
                date:            parseFirestoreDate(v.date || v.createdAt),
                createdAt:       parseFirestoreDate(v.createdAt),
                appointmentRtid: v.appointmentRtid || null,
                donorId:         v.donorId     || null,
                patientName:     v.patientName || null,
                hospitalName:    v.hospitalName || null,
                redemptionDate:  v.redemptionDate
                                  ? parseFirestoreDate(v.redemptionDate)
                                  : undefined,
              };
            });
            dons.sort((a, b) => b.date.getTime() - a.date.getTime());
            setDonations(dons);

            // Derive redemptions from same snapshot
            const redems: Redemption[] = dons
              .filter(d =>
                (d.status === 'REDEEMED' || d.status === 'Redeemed') &&
                (d.rRtid || d.linkedRrtid)
              )
              .map(d => ({
                dRtid:             d.dRtid,
                bloodGroup:        d.bloodGroup,
                donationLocation:  d.donationLocation,
                redemptionLocation:d.hospitalName || 'Hospital',
                linkedRRTID:       (d.rRtid || d.linkedRrtid)!,
                date:              d.redemptionDate || d.date,
                bloodBankId:       bbId,
              }));
            redems.sort((a, b) => b.date.getTime() - a.date.getTime());
            setRedemptions(redems);
          }
        ));

        // Blood requests (city-scoped)
        const bbCity = userData.district || userData.city;
        if (bbCity) {
          unsubs.push(onSnapshot(
            query(collection(db, 'bloodRequests'), where('city', '==', bbCity)),
            s => {
              setBloodRequests(s.docs.map(d => {
                const v = d.data();
                return {
                  rtid:         v.linkedRTID || v.rtid || d.id,
                  patientName:  v.patientName  || 'Unknown',
                  bloodGroup:   (v.bloodGroup as BloodGroup) || 'O+',
                  units:        v.unitsRequired || v.units || 1,
                  city:         v.city || bbCity,
                  hospitalName: v.hospitalName || 'Unknown Hospital',
                  status:       v.status || 'PENDING',
                  createdAt:    parseFirestoreDate(v.createdAt),
                };
              }));
            }
          ));
        }

        // Notifications
        unsubs.push(onSnapshot(
          query(collection(db, 'notifications'), where('bloodBankId', '==', bbId)),
          s => {
            const notifs: Notification[] = s.docs.map(d => {
              const v = d.data();
              return {
                id:        d.id,
                message:   v.message || '',
                type:      (v.type as Notification['type']) || 'info',
                timestamp: parseFirestoreDate(v.timestamp),
                read:      v.read || false,
              };
            });
            setNotifications(notifs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
          }
        ));

      } catch (error: any) {
        console.error('[BBData] Fatal:', error);
        toast.error(error.message || 'Failed to initialize Blood Bank dashboard');
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      unsubs.forEach(u => u());
    };
  }, []);

  // ── KPI ───────────────────────────────────────────────────────────────────
  const kpi: KPIData = useMemo(() => {
    const empty: KPIData = {
      totalInventory: 0, availableUnits: 0, todayAppointments: 0,
      totalDonations: 0, totalRedemptions: 0, totalBloodRequests: 0,
    };
    if (!inventory) return empty;
    try {
      const today = new Date().toDateString();
      return {
        totalInventory:     Object.values(inventory).reduce((s, v) => s + (Number(v?.total)     || 0), 0),
        availableUnits:     Object.values(inventory).reduce((s, v) => s + (Number(v?.available) || 0), 0),
        todayAppointments:  appointments.filter(a => new Date(a.date).toDateString() === today).length,
        totalDonations:     donations.length,
        totalRedemptions:   redemptions.length,
        totalBloodRequests: bloodRequests.length,
      };
    } catch { return empty; }
  }, [inventory, appointments, donations, redemptions, bloodRequests]);

  const criticalGroups = useMemo(() =>
    (Object.keys(inventory) as BloodGroup[]).filter(bg => (inventory[bg]?.available ?? 0) < 30),
    [inventory]
  );

  return { loading, bloodBankData, inventory, appointments, donations, redemptions, bloodRequests, notifications, bloodBankId, kpi, criticalGroups };
};