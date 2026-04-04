import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";

export interface FeedbackReport {
  type: 'feedback' | 'bug';
  message: string;
  rating?: number;
  contactEmail?: string;
  path: string;
  userAgent: string;
  userId?: string | null;
  timestamp?: any;
}

export const submitFeedback = async (data: Omit<FeedbackReport, 'timestamp' | 'userAgent' | 'userId'>) => {
  try {
    const feedbackCollection = collection(db, 'feedback_reports');
    
    // Add current user info and environment metadata
    const payload: any = {
      ...data,
      userAgent: navigator.userAgent,
      userId: auth.currentUser?.uid || localStorage.getItem('userId') || null,
      timestamp: serverTimestamp(),
    };

    // Firestore throws error on undefined values, so we remove them
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

    const docRef = await addDoc(feedbackCollection, payload);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return { success: false, error };
  }
};
