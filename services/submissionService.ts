
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
import { supabase } from "../lib/supabase";
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
    { 
        id: 'v1', 
        make: 'Ford', 
        model: 'Fusion', 
        year: '2017', 
        color: 'Black', 
        vin: 'SAMPLE_FUSION_17', 
        plate: 'TX-RIDE1', 
        status: 'available', 
        weeklyRent: 400, 
        imageUrl: 'https://i.ytimg.com/vi/q49cMgR56RE/maxresdefault.jpg',
        features: ['Rent-to-Own Available', 'UberX Ready', 'Bluetooth']
    },
    { 
        id: 'v2', 
        make: 'Kia', 
        model: 'Optima', 
        year: '2014', 
        color: 'Gray', 
        vin: 'SAMPLE_OPTIMA_14', 
        plate: 'TX-RIDE2', 
        status: 'available', 
        weeklyRent: 350, 
        imageUrl: 'https://www.thecubiclechick.com/wp-content/uploads/2014/04/2014-Kia-Optima-SX-Limited.jpg',
        features: ['Rent-to-Own Available', 'Great MPG', 'Budget Friendly']
    }
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
  // 1. SUPABASE SUBMISSION (With Vehicle Details)
  try {
    // Fetch full vehicle details to store a snapshot
    let vehicleSnapshot = {};
    if (data.selectedVehicleId) {
        const vehicles = await getVehicles();
        const v = vehicles.find(veh => veh.id === data.selectedVehicleId);
        if (v) {
            vehicleSnapshot = {
                vehicle_make: v.make,
                vehicle_model: v.model,
                vehicle_year: v.year,
                vehicle_image_url: v.imageUrl,
                weekly_rent: v.weeklyRent
            };
        }
    }

    const { error } = await supabase.from('bookings').insert([{
        status: 'pending',
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        dob: data.dob,
        address: data.address,
        license_number: data.licenseNumber,
        
        // Vehicle Snapshot
        vehicle_id: data.selectedVehicleId || '',
        ...vehicleSnapshot,
        
        // Extended Form Data
        rental_program: data.rentalProgram,
        target_platform: data.targetPlatform,
        usage_type: data.usageType,
        start_date: data.startDate,
        end_date: data.endDate,
        payment_method: data.paymentMethod,
        
        // Insurance & History
        has_insurance: data.hasInsurance,
        insurance_company: data.insuranceCompany,
        policy_number: data.policyNumber,
        history_accidents: data.historyAccidents,
        history_dui: data.historyDUI,
        history_suspension: data.historySuspension,
        
        user_id: userId || null,
        source: 'organic'
    }]);

    if (error) console.error("Supabase Booking Error:", error);
  } catch (err) {
    console.error("Supabase Submission Failed:", err);
  }

  // 2. FIREBASE SUBMISSION (Fallback/Legacy)
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
  try {
    // Attempt Supabase submission (Table: leads)
    const { error } = await supabase
      .from('leads')
      .insert([
        { 
          name: data.name,
          email: data.email,
          phone: data.phone,
          subject: data.subject,
          message: data.message,
          source: 'website_contact'
        }
      ]);

    if (error) {
        console.error("Supabase Error:", error);
        throw error;
    }

    return { success: true, message: "Inquiry received." };

  } catch (error) {
    console.error("Supabase Submission Failed, trying Firestore fallback...", error);
    
    // Fallback to Firestore/Mock
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
        return { success: true, message: "Inquiry received (Firebase)." };
    } catch (fbError) {
        throw fbError;
    }
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
  // Try fetching from Supabase 'bookings' first
  try {
      const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .order('created_at', { ascending: false });
      
      if (!error && data) {
          // Map Supabase 'bookings' columns to the shape the Admin UI expects
          return data.map((b: any) => ({
             id: b.id,
             fullName: b.full_name,
             email: b.email,
             phone: b.phone,
             carRequested: `${b.vehicle_year || ''} ${b.vehicle_make || ''} ${b.vehicle_model || ''}`.trim(),
             rentalProgram: b.rental_program,
             status: b.status,
             createdAt: { seconds: new Date(b.created_at).getTime() / 1000 }, // Mock Firestore Timestamp
             vehicleImage: b.vehicle_image_url
          }));
      }
  } catch (e) {
      console.warn("Supabase Fetch Failed, falling back to Firestore", e);
  }

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
  // Try Supabase 'leads' table
  try {
      const { data, error } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });
      
      if (!error && data) {
          return data.map((item: any) => ({
              id: item.id?.toString() || Math.random().toString(),
              name: item.name,
              phone: item.phone,
              email: item.email,
              subject: item.subject,
              message: item.message,
              source: item.source || 'supabase',
              createdAt: item.created_at
          }));
      }
  } catch (e) {
      console.warn("Supabase Fetch Failed, falling back to Firestore/Mock", e);
  }

  if (!isFirebaseActive()) return getMockData('leads');
  try {
    const q = query(collection(db, "leads"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  } catch (e) {
    return [];
  }
};
