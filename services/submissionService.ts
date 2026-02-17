import { 
  collection, 
  addDoc, 
  setDoc,
  getDoc,
  serverTimestamp, 
  query, 
  getDocs, 
  updateDoc, 
  doc,
  orderBy,
  where
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "../lib/firebase";
import { FormData, ContactFormData, Vehicle, Lead, UserProfile } from "../types";

// Helper for Mock Persistence
const getMockData = (key: string) => JSON.parse(localStorage.getItem(`mock_${key}`) || '[]');
const saveMockData = (key: string, data: any[]) => localStorage.setItem(`mock_${key}`, JSON.stringify(data));

/**
 * Ensures the app doesn't crash if Firebase keys are missing.
 * Returns true if Firebase is active, false if we are in Demo Mode.
 */
const isFirebaseActive = () => {
  if (!db) {
    console.warn("Firebase is not configured. Using LocalStorage Demo Mode.");
    return false;
  }
  return true;
};

/**
 * Driver Application Submission
 */
export const submitApplication = async (data: FormData, userId?: string): Promise<{ success: boolean; message: string; id: string }> => {
  if (!isFirebaseActive()) {
    const mockApps = getMockData('applications');
    const newId = "MOCK-APP-" + Date.now();
    saveMockData('applications', [...mockApps, { ...data, userId, id: newId, status: "pending", createdAt: new Date().toISOString() }]);
    return { success: true, message: "Demo: App saved locally.", id: newId };
  }

  try {
    const { proofOfAddress, proofOfIncome, licenseFront, licenseBack, selfie, ...firestoreData } = data;
    
    // Clean undefined values
    const cleanData = Object.entries(firestoreData).reduce((a, [k, v]) => (v === undefined ? a : { ...a, [k]: v }), {});

    const docRef = await addDoc(collection(db, "applications"), {
      ...cleanData,
      userId: userId || null, // Link to auth user if exists
      status: "pending",
      createdAt: serverTimestamp(),
      source: "organic"
    });
    return { success: true, message: "Application submitted.", id: docRef.id };
  } catch (error) {
    console.error("Submit Error:", error);
    throw error;
  }
};

/**
 * Update Application Status (Admin)
 */
export const updateApplicationStatus = async (appId: string, status: 'approved' | 'rejected') => {
  if (!isFirebaseActive()) {
    const apps = getMockData('applications');
    const idx = apps.findIndex((a: any) => a.id === appId);
    if (idx !== -1) {
      apps[idx].status = status;
      saveMockData('applications', apps);
    }
    return true;
  }

  try {
    const appRef = doc(db, "applications", appId);
    await updateDoc(appRef, { status, updatedAt: serverTimestamp() });
    return true;
  } catch (error) {
    console.error("Update Error:", error);
    return false;
  }
};

/**
 * Lead Capture (Contact Form)
 */
export const submitContactInquiry = async (data: ContactFormData): Promise<{ success: boolean; message: string }> => {
  if (!isFirebaseActive()) {
    const mockLeads = getMockData('leads');
    saveMockData('leads', [...mockLeads, { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() }]);
    return { success: true, message: "Demo: Lead saved locally." };
  }

  try {
    await addDoc(collection(db, "leads"), {
      ...data,
      source: "website_contact",
      createdAt: serverTimestamp()
    });
    return { success: true, message: "Inquiry received." };
  } catch (error) {
    throw error;
  }
};

/**
 * User Profile & Role Logic
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!isFirebaseActive()) {
    const profiles = getMockData('profiles');
    return profiles.find((p: any) => p.uid === uid) || {
      uid,
      fullName: "Demo Driver",
      phone: "(210) 555-0123",
      email: "driver@example.com",
      role: 'user',
      createdAt: new Date().toISOString()
    };
  }

  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    return userDoc.exists() ? { uid, ...userDoc.data() } as UserProfile : null;
  } catch (e) {
    return null;
  }
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  if (!isFirebaseActive()) {
    const profiles = getMockData('profiles');
    const existingIdx = profiles.findIndex((p: any) => p.uid === uid);
    if (existingIdx > -1) {
      profiles[existingIdx] = { ...profiles[existingIdx], ...data };
    } else {
      profiles.push({ uid, role: 'user', ...data });
    }
    saveMockData('profiles', profiles);
    return true;
  }

  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, { ...data, updatedAt: serverTimestamp() });
    return true;
  } catch (e) {
    return false;
  }
};

export const checkAdminRole = async (uid: string): Promise<boolean> => {
  if (!isFirebaseActive()) {
    // In demo mode, any user with 'admin@dj.com' email is treated as admin
    const profiles = getMockData('profiles');
    const p = profiles.find((u: any) => u.uid === uid);
    return p?.role === 'admin' || p?.email?.includes('admin');
  }

  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    return userDoc.exists() && userDoc.data().role === 'admin';
  } catch (e) {
    return false;
  }
};

/**
 * Data Fetching
 */
export const getApplications = async (): Promise<any[]> => {
  if (!isFirebaseActive()) return getMockData('applications');
  try {
    const q = query(collection(db, "applications"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    return [];
  }
};

export const getUserApplications = async (userId: string, email: string): Promise<any[]> => {
  if (!isFirebaseActive()) {
     const apps = getMockData('applications');
     return apps.filter((a: any) => a.userId === userId || a.email === email);
  }
  
  try {
    // Try to find by userId first
    let q = query(collection(db, "applications"), where("userId", "==", userId));
    let querySnapshot = await getDocs(q);
    
    // If empty, try fallback to email (for legacy apps)
    if (querySnapshot.empty && email) {
        q = query(collection(db, "applications"), where("email", "==", email));
        querySnapshot = await getDocs(q);
    }

    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const getLeads = async (): Promise<Lead[]> => {
  if (!isFirebaseActive()) return getMockData('leads');
  try {
    const q = query(collection(db, "leads"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  } catch (e) {
    return [];
  }
};