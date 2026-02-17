
import { 
  collection, 
  addDoc, 
  setDoc,
  getDoc,
  serverTimestamp, 
  query, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  doc,
  orderBy,
  where
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "../lib/firebase";
import { FormData, ContactFormData, Vehicle, Lead, UserProfile, SmsTemplate, EmailTemplate, SystemSettings } from "../types";

// Helper for Mock Persistence
const getMockData = (key: string) => JSON.parse(localStorage.getItem(`mock_${key}`) || '[]');
const saveMockData = (key: string, data: any[]) => localStorage.setItem(`mock_${key}`, JSON.stringify(data));

/**
 * Ensures the app doesn't crash if Firebase keys are missing.
 * Returns true if Firebase is active, false if we are in Demo Mode.
 */
const isFirebaseActive = () => {
  if (!db) {
    // console.warn("Firebase is not configured. Using LocalStorage Demo Mode.");
    return false;
  }
  return true;
};

// --- VEHICLE / FLEET SERVICES ---

const INITIAL_MOCK_FLEET: Vehicle[] = [
    { id: 'v1', make: 'Toyota', model: 'Camry SE', year: '2023', color: 'Midnight Black', vin: 'SAMPLE123456', plate: 'TX-5599', status: 'available', weeklyRent: 350, imageUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3968e3bb?auto=format&fit=crop&q=80&w=800' },
    { id: 'v2', make: 'Honda', model: 'Accord Sport', year: '2022', color: 'Sonic Gray', vin: 'SAMPLE987654', plate: 'TX-1122', status: 'rented', weeklyRent: 375, imageUrl: 'https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&q=80&w=800' },
    { id: 'v3', make: 'Hyundai', model: 'Elantra', year: '2024', color: 'White', vin: 'SAMPLE111222', plate: 'TX-3344', status: 'available', weeklyRent: 320, imageUrl: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&q=80&w=800' },
];

export const getVehicles = async (): Promise<Vehicle[]> => {
    if (!isFirebaseActive()) {
        const local = getMockData('vehicles');
        if (local.length === 0) {
            saveMockData('vehicles', INITIAL_MOCK_FLEET);
            return INITIAL_MOCK_FLEET;
        }
        return local;
    }
    try {
        const q = query(collection(db, "vehicles"), orderBy("make"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
    } catch (e) {
        console.error("Get Vehicles Error:", e);
        return [];
    }
};

export const addVehicle = async (vehicle: Omit<Vehicle, 'id'>) => {
    if (!isFirebaseActive()) {
        const vehicles = getMockData('vehicles');
        const newV = { ...vehicle, id: 'mock-v-' + Date.now() };
        saveMockData('vehicles', [...vehicles, newV]);
        return newV;
    }
    const docRef = await addDoc(collection(db, "vehicles"), vehicle);
    return { ...vehicle, id: docRef.id };
};

export const updateVehicle = async (id: string, data: Partial<Vehicle>) => {
    if (!isFirebaseActive()) {
        const vehicles = getMockData('vehicles');
        const idx = vehicles.findIndex((v: any) => v.id === id);
        if (idx !== -1) {
            vehicles[idx] = { ...vehicles[idx], ...data };
            saveMockData('vehicles', vehicles);
        }
        return;
    }
    await updateDoc(doc(db, "vehicles", id), data);
};

export const deleteVehicle = async (id: string) => {
    if (!isFirebaseActive()) {
        const vehicles = getMockData('vehicles');
        saveMockData('vehicles', vehicles.filter((v: any) => v.id !== id));
        return;
    }
    await deleteDoc(doc(db, "vehicles", id));
};

// --- USER MANAGEMENT SERVICES ---

export const getAllUsers = async (): Promise<UserProfile[]> => {
    if (!isFirebaseActive()) return getMockData('profiles');
    try {
        const q = query(collection(db, "users"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
    } catch (e) {
        return [];
    }
};

export const updateUserRole = async (uid: string, role: 'user' | 'admin') => {
    if (!isFirebaseActive()) {
        const profiles = getMockData('profiles');
        const idx = profiles.findIndex((p: any) => p.uid === uid);
        if (idx !== -1) {
            profiles[idx].role = role;
            saveMockData('profiles', profiles);
        }
        return;
    }
    await updateDoc(doc(db, "users", uid), { role });
};

export const deleteUser = async (uid: string) => {
     if (!isFirebaseActive()) {
        const profiles = getMockData('profiles');
        saveMockData('profiles', profiles.filter((p: any) => p.uid !== uid));
        return;
    }
    // Note: This only deletes the Firestore document. Deleting from Auth requires Cloud Functions or Admin SDK.
    await deleteDoc(doc(db, "users", uid));
}

// --- TEMPLATE & SETTINGS SERVICES ---

const DEFAULT_SMS_TEMPLATES: SmsTemplate[] = [
    { id: 'application_received', name: 'Application Received', content: 'Hi {name}, we received your application for the {car}. We will contact you shortly.' },
    { id: 'application_approved', name: 'Application Approved', content: 'Good news {name}! Your application has been approved. Please call us to schedule pickup.' },
    { id: 'application_rejected', name: 'Application Update', content: 'Hi {name}, we have reviewed your application and unfortunately cannot proceed at this time.' }
];

const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
    { id: 'application_received', name: 'Application Received', subject: 'Application Confirmation - DJ Auto Rental', content: 'Dear {name},\n\nWe have received your rental application for the {car}. Our team is reviewing your details.' },
    { id: 'application_approved', name: 'Application Approved', subject: 'Approved! Your Vehicle is Ready', content: 'Dear {name},\n\nCongratulations! Your application has been approved. Please contact us to schedule your vehicle pickup.' },
    { id: 'application_rejected', name: 'Application Status Update', subject: 'Regarding Your Application', content: 'Dear {name},\n\nThank you for your interest in DJ Auto Rental. After reviewing your application, we are unable to approve your request at this time.' }
];

export const getSystemSettings = async (): Promise<SystemSettings> => {
  const defaults: SystemSettings = { twilioAccountSid: '', twilioAuthToken: '', twilioPhoneNumber: '' };
  
  if (!isFirebaseActive()) {
    const local = localStorage.getItem('mock_settings_system');
    return local ? JSON.parse(local) : defaults;
  }
  
  try {
    const docRef = await getDoc(doc(db, "settings", "system"));
    if (docRef.exists()) {
      return { ...defaults, ...docRef.data() } as SystemSettings;
    }
    return defaults;
  } catch (e) {
    return defaults;
  }
};

export const saveSystemSettings = async (settings: SystemSettings) => {
  if (!isFirebaseActive()) {
    localStorage.setItem('mock_settings_system', JSON.stringify(settings));
    return;
  }
  await setDoc(doc(db, "settings", "system"), settings);
};

export const getSmsTemplates = async (): Promise<SmsTemplate[]> => {
    if (!isFirebaseActive()) {
         const local = getMockData('sms_templates');
         if (local.length === 0) {
             saveMockData('sms_templates', DEFAULT_SMS_TEMPLATES);
             return DEFAULT_SMS_TEMPLATES;
         }
         return local;
    }
    try {
        const q = query(collection(db, "sms_templates"));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return DEFAULT_SMS_TEMPLATES;
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SmsTemplate));
    } catch (e) {
        return DEFAULT_SMS_TEMPLATES;
    }
};

export const saveSmsTemplate = async (template: SmsTemplate) => {
     if (!isFirebaseActive()) {
        const templates = await getSmsTemplates();
        const idx = templates.findIndex(t => t.id === template.id);
        if (idx >= 0) templates[idx] = template;
        else templates.push(template);
        saveMockData('sms_templates', templates);
        return;
    }
    await setDoc(doc(db, "sms_templates", template.id), template);
};

export const getEmailTemplates = async (): Promise<EmailTemplate[]> => {
    if (!isFirebaseActive()) {
         const local = getMockData('email_templates');
         if (local.length === 0) {
             saveMockData('email_templates', DEFAULT_EMAIL_TEMPLATES);
             return DEFAULT_EMAIL_TEMPLATES;
         }
         return local;
    }
    try {
        const q = query(collection(db, "email_templates"));
        const snapshot = await getDocs(q);
        if (snapshot.empty) return DEFAULT_EMAIL_TEMPLATES;
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmailTemplate));
    } catch (e) {
        return DEFAULT_EMAIL_TEMPLATES;
    }
};

export const saveEmailTemplate = async (template: EmailTemplate) => {
     if (!isFirebaseActive()) {
        const templates = await getEmailTemplates();
        const idx = templates.findIndex(t => t.id === template.id);
        if (idx >= 0) templates[idx] = template;
        else templates.push(template);
        saveMockData('email_templates', templates);
        return;
    }
    await setDoc(doc(db, "email_templates", template.id), template);
};

// --- TWILIO / NOTIFICATION SERVICE (SIMULATED) ---

export const sendSmsConfirmation = async (phone: string, name: string, car: string) => {
    // 1. Fetch Configuration
    const settings = await getSystemSettings();
    const hasCreds = settings.twilioAccountSid && settings.twilioAuthToken && settings.twilioPhoneNumber;
    
    // 2. Fetch Template
    const templates = await getSmsTemplates();
    const tmpl = templates.find(t => t.id === 'application_received');
    let message = tmpl ? tmpl.content : `Hi {name}, your application for the {car} with DJ Auto Rental has been received!`;
    message = message.replace('{name}', name).replace('{car}', car);
    
    // 3. Send (Mock)
    if (hasCreds) {
        console.log(`%c[Twilio Service] Using Configured API...`, "color: cyan; font-weight: bold;");
        console.log(`%c[Twilio Service] SID: ${settings.twilioAccountSid.substring(0,6)}... | From: ${settings.twilioPhoneNumber}`, "color: gray;");
    } else {
        console.log(`%c[Twilio Service] No API credentials configured. Running in Demo Mode.`, "color: orange;");
    }
    
    console.log(`%c[Twilio Service] Sending to ${phone}: "${message}"`, "color: green; font-weight: bold;");
    
    // Simulating API latency
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In production, this would be:
    // await fetch('/api/send-sms', { method: 'POST', body: JSON.stringify({ phone, message, settings }) });
    
    return true;
};

// --- APPLICATION SERVICES ---

export const submitApplication = async (data: FormData, userId?: string): Promise<{ success: boolean; message: string; id: string }> => {
  if (!isFirebaseActive()) {
    const mockApps = getMockData('applications');
    const newId = "MOCK-APP-" + Date.now();
    saveMockData('applications', [...mockApps, { ...data, userId, id: newId, status: "pending", createdAt: new Date().toISOString() }]);
    
    // Trigger SMS
    await sendSmsConfirmation(data.phone, data.fullName, data.carRequested);
    
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

    // Trigger SMS (Non-blocking)
    sendSmsConfirmation(data.phone, data.fullName, data.carRequested).catch(console.error);

    return { success: true, message: "Application submitted.", id: docRef.id };
  } catch (error) {
    console.error("Submit Error:", error);
    throw error;
  }
};

/**
 * Admin Update Application Data (Edit User Form)
 */
export const updateApplicationData = async (appId: string, data: Partial<FormData>) => {
    if (!isFirebaseActive()) {
        const apps = getMockData('applications');
        const idx = apps.findIndex((a: any) => a.id === appId);
        if (idx !== -1) {
            apps[idx] = { ...apps[idx], ...data };
            saveMockData('applications', apps);
        }
        return true;
    }

    try {
        const appRef = doc(db, "applications", appId);
        await updateDoc(appRef, { ...data, updatedAt: serverTimestamp() });
        return true;
    } catch (error) {
        console.error("Update App Data Error:", error);
        return false;
    }
};

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

export const checkAdminRole = async (uid: string, email?: string | null): Promise<boolean> => {
  // Hardcoded Super Admin Access
  if (email && email.toLowerCase() === 'admin@djautofleet.com') {
    return true;
  }

  if (!isFirebaseActive()) {
    // In demo mode, any user with 'admin' in email is treated as admin
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
    let q = query(collection(db, "applications"), where("userId", "==", userId));
    let querySnapshot = await getDocs(q);
    
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
