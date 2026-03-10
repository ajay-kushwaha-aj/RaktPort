import { BloodGroup, Inventory } from '@/types/bloodbank';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const BLOOD_BANK_LOCATION = 'AIIMS Blood Bank, Delhi';

export const BLOOD_GROUPS: BloodGroup[] = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export const generateRtid = (type: 'D' | 'H'): string => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  
  // Generate format: A1234 (1 uppercase alphabet + 4 digits)
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
  const randomDigits = Math.floor(1000 + Math.random() * 9000); // 4-digit number (1000-9999)
  const sequencePart = `${randomLetter}${randomDigits}`;
  
  return `${type}-RTID-${dd}${mm}${yy}-${sequencePart}`;
};

/**
 * Generate unique appointment RTID in format: D-RTID-ddmmyy-A1234
 * @param appointmentDate - The date of the appointment (YYYY-MM-DD format)
 * @returns Promise<string> - Unique RTID
 */
export const generateUniqueAppointmentRtid = async (appointmentDate: string): Promise<string> => {
  // Parse the appointment date
  const date = new Date(appointmentDate + 'T00:00:00'); // Ensure correct date parsing
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  
  const datePrefix = `D-RTID-${dd}${mm}${yy}`;
  
  try {
    // Query all donations to find existing RTIDs with this date prefix
    const donationsRef = collection(db, "donations");
    const snapshot = await getDocs(donationsRef);
    
    // Collect all RTIDs (from rtid field or document ID) that match the pattern
    const existingRtids: string[] = [];
    snapshot.docs.forEach(docSnap => {
      const data = docSnap.data();
      const rtid = data.rtid || docSnap.id; // Check both rtid field and document ID
      if (rtid && typeof rtid === 'string' && rtid.startsWith(datePrefix)) {
        existingRtids.push(rtid);
      }
    });
    
    // Extract sequence numbers from existing RTIDs (format: D-RTID-ddmmyy-A1234)
    const sequenceNumbers = existingRtids
      .map(rtid => {
        const match = rtid.match(/-A(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => num > 0);
    
    // Find the next available sequence number
    let nextSequence = 1;
    if (sequenceNumbers.length > 0) {
      const maxSequence = Math.max(...sequenceNumbers);
      nextSequence = maxSequence + 1;
    }
    
    // Format: A0001, A0002, etc. (4 digits)
    const sequencePart = `A${String(nextSequence).padStart(4, '0')}`;
    
    return `${datePrefix}-${sequencePart}`;
  } catch (error) {
    console.error("Error generating unique RTID:", error);
    // Fallback: use timestamp-based approach if query fails
    const fallbackSequence = Date.now().toString().slice(-4);
    return `${datePrefix}-A${fallbackSequence}`;
  }
};

export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const validateHrtidFormat = (
  hrtid: string
): { ok: boolean; reason?: string } => {
  const re = /^H-RTID-(\d{2})(\d{2})(\d{4})-([A-Z0-9]{4})$/;
  const m = re.exec(hrtid);
  if (!m) return { ok: false, reason: 'pattern' };

  const dd = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const yyyy = parseInt(m[3], 10);

  const date = new Date(yyyy, mm - 1, dd);
  if (
    date.getFullYear() !== yyyy ||
    date.getMonth() !== mm - 1 ||
    date.getDate() !== dd
  ) {
    return { ok: false, reason: 'invalid-date' };
  }

  if (yyyy < 2000 || yyyy > 2100) {
    return { ok: false, reason: 'invalid-year' };
  }

  return { ok: true };
};

// --- UPDATED: Absolute Threshold Logic ---
export const getInventoryStatus = (
  available: number,
  _total: number // Total is kept for interface compatibility but unused for status
): 'good' | 'low' | 'critical' => {
  if (available < 30) return 'critical';
  if (available <= 50) return 'low';
  return 'good';
};

export const getStatusColor = (status: 'good' | 'low' | 'critical'): string => {
  switch (status) {
    case 'good':
      return 'bg-success/10 text-success border-success/20';
    case 'low':
      return 'bg-warning/10 text-warning border-warning/20';
    case 'critical':
      return 'bg-status-critical/10 text-status-critical border-status-critical/20';
  }
};

export const getStatusEmoji = (status: 'good' | 'low' | 'critical'): string => {
  switch (status) {
    case 'good':
      return '✅';
    case 'low':
      return '⚠️';
    case 'critical':
      return '🚨';
  }
};

export const getStatusLabel = (status: 'good' | 'low' | 'critical'): string => {
  switch (status) {
    case 'good':
      return 'Good Stock';
    case 'low':
      return 'Low Stock';
    case 'critical':
      return 'Critical';
  }
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

export const getTodayDateString = (): string => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const initializeInventory = (): Inventory => {
  return {
    'O+': { total: 45, available: 38 },
    'O-': { total: 12, available: 8 },
    'A+': { total: 30, available: 25 },
    'A-': { total: 10, available: 6 },
    'B+': { total: 28, available: 22 },
    'B-': { total: 8, available: 4 },
    'AB+': { total: 15, available: 12 },
    'AB-': { total: 5, available: 2 },
  };
};