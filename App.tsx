import React, { useState, useEffect } from 'react';
import { 
  INITIAL_DATA, 
  FormData, 
  ContactFormData, 
  UserProfile, 
  Vehicle, 
  SmsTemplate, 
  EmailTemplate, 
  SystemSettings 
} from './types.ts';
import { StepWizard } from './components/StepWizard.tsx';
import { Input, Select, FileUpload, Checkbox } from './components/InputFields.tsx';
import { AddressAutocomplete } from './components/AddressAutocomplete.tsx';
import { SignaturePad } from './components/SignaturePad.tsx';
import { 
  submitApplication, 
  submitContactInquiry, 
  getUserProfile, 
  updateUserProfile, 
  checkAdminRole, 
  getApplications, 
  updateApplicationStatus, 
  updateApplicationData, 
  getUserApplications, 
  getVehicles, 
  addVehicle, 
  updateVehicle, 
  deleteVehicle, 
  getAllUsers, 
  updateUserRole, 
  deleteUser, 
  getSmsTemplates, 
  saveSmsTemplate, 
  getEmailTemplates, 
  saveEmailTemplate, 
  getSystemSettings, 
  saveSystemSettings 
} from './services/submissionService.ts';
import { auth as firebaseAuth } from './lib/firebase.ts';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  Car, 
  CheckCircle, 
  Loader2, 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  LogOut, 
  ArrowUpRight, 
  User, 
  ShieldAlert, 
  Zap, 
  Shield, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  LayoutDashboard, 
  FileText, 
  XCircle, 
  AlertCircle, 
  Plus, 
  Edit2, 
  Trash2, 
  Settings as SettingsIcon, 
  DollarSign, 
  Users, 
  MessageSquare, 
  Menu, 
  Save, 
  Lock, 
  Eye, 
  EyeOff 
} from 'lucide-react';

const LOGO_URL = "https://djautofleet.com/wp-content/uploads/2026/02/Untitled-design-e1770786148880.gif";
const STEPS = ["Personal", "License", "Vehicle", "Agreements"];
const CONTACT_PHONE = "(210) 390-6135";
const CONTACT_ADDRESS = "5072 Timberhill Drive, San Antonio, TX";

export default function App() {
  const [view, setView] = useState<'home' | 'application' | 'admin' | 'login' | 'profile' | 'contact'>('home');
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(INITIAL_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  
  // Auth & Profile
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // Contact Form State
  const [contactData, setContactData] = useState<ContactFormData>({
    name: '', email: '', phone: '', subject: 'General Inquiry', message: ''
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  useEffect(() => {
    // Load Vehicles for application process
    const loadFleet = async () => {
        const v = await getVehicles();
        setAvailableVehicles(v.filter(car => car.status === 'available'));
    };
    loadFleet();

    const unsub = firebaseAuth?.onAuthStateChanged(async (user: any) => {
      setCurrentUser(user);
      if (user) {
        const p = await getUserProfile(user.uid);
        const isAdm = await checkAdminRole(user.uid, user.email);
        setProfile(p);
        setIsAdmin(isAdm);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (view === 'contact') {
        setContactSubmitted(false);
        setContactData({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
    }
  }, [view]);

  const handleLogout = async () => {
    await signOut(firebaseAuth);
    setProfile(null);
    setIsAdmin(false);
    setCurrentUser(null);
    setView('home');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);
    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth, loginForm.email, loginForm.password);
      const isAdm = await checkAdminRole(cred.user.uid, cred.user.email);
      setIsAdmin(isAdm);
      setView(isAdm ? 'admin' : 'profile');
    } catch (err: any) {
        if (loginForm.email === 'admin@djautofleet.com' && (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential')) {
            try {
                const cred = await createUserWithEmailAndPassword(firebaseAuth, loginForm.email, loginForm.password);
                await updateUserProfile(cred.user.uid, {
                    uid: cred.user.uid,
                    email: loginForm.email,
                    fullName: 'Super Admin',
                    role: 'admin',
                    phone: '',
                    createdAt: new Date().toISOString()
                });
                setIsAdmin(true);
                setView('admin');
                return;
            } catch (createErr) {
                console.error(createErr);
            }
        }
      setLoginError('Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitContactInquiry(contactData);
      setContactSubmitted(true);
    } catch (err) {
      alert("Submission failed. Please check your internet connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAppSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await submitApplication(formData, currentUser?.uid);
      if (res.success) setSubmitted(true);
    } catch (err) {
      alert("Application error. Please fill all required fields.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const Nav = () => (
    <nav className="bg-slate-950 text-white p-3 sticky top-0 z-[100] border-b border-red-900/30">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView('home')}>
          <img src={LOGO_URL} className="h-10 w-auto" alt="DJ Logo" />
          <div className="hidden sm:block">
            <h1 className="text-sm font-black tracking-widest uppercase leading-none">DJ AUTO RENTAL</h1>
            <p className="text-[9px] text-red-500 font-bold tracking-widest uppercase">San Antonio Fleet</p>
          </div>
        </div>

        {/* Header Phone Display */}
        <a href={`tel:${CONTACT_PHONE.replace(/\D/g,'')}`} className="hidden lg:flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-full hover:bg-slate-800 transition-colors group">
            <Phone size={14} className="text-red-500 group-hover:animate-pulse" />
            <span className="text-xs font-black tracking-widest text-slate-300 group-hover:text-white">{CONTACT_PHONE}</span>
        </a>

        <div className="flex items-center gap-4 md:gap-8 text-[10px] font-black uppercase tracking-widest">
          <button onClick={() => setView('home')} className={`hover:text-red-500 transition-colors ${view === 'home' ? 'text-red-500' : 'text-slate-400'}`}>Home</button>
          <button onClick={() => setView('application')} className={`hover:text-red-500 transition-colors ${view === 'application' ? 'text-red-500' : 'text-slate-400'}`}>Apply</button>
          <button onClick={() => setView('contact')} className={`hover:text-red-500 transition-colors ${view === 'contact' ? 'text-red-500' : 'text-slate-400'}`}>Contact</button>
          {isAdmin && (
            <button onClick={() => setView('admin')} className={`text-red-600 bg-red-950/30 px-3 py-1.5 rounded-lg border border-red-900/50 ${view === 'admin' ? 'ring-1 ring-red-500' : ''}`}>Admin</button>
          )}
          {currentUser ? (
            <button onClick={() => setView('profile')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 ${view === 'profile' ? 'text-red-500' : 'text-slate-300'}`}>
              <User size={14} /> Profile
            </button>
          ) : (
            <button onClick={() => setView('login')} className="bg-red-600 px-5 py-2 rounded-xl transition-all shadow-lg shadow-red-900/20 font-black hidden md:block">LOGIN</button>
          )}
        </div>
      </div>
    </nav>
  );

  const AdminView = () => {
    const [activeTab, setActiveTab] = useState<'applications' | 'users' | 'fleet' | 'sms' | 'email' | 'settings'>('applications');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [apps, setApps] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [smsTemplates, setSmsTemplates] = useState<SmsTemplate[]>([]);
    const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
    const [systemSettings, setSystemSettings] = useState<SystemSettings>({ twilioAccountSid: '', twilioAuthToken: '', twilioPhoneNumber: '' });
    const [loading, setLoading] = useState(true);
    const [editingApp, setEditingApp] = useState<FormData | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Partial<Vehicle> | null>(null);
    const [showVehicleModal, setShowVehicleModal] = useState(false);
    const [editingSms, setEditingSms] = useState<SmsTemplate | null>(null);
    const [editingEmail, setEditingEmail] = useState<EmailTemplate | null>(null);
    const [showToken, setShowToken] = useState(false);

    const loadData = async () => {
        setLoading(true);
        const [appData, fleetData, userData, smsData, emailData, settingsData] = await Promise.all([
            getApplications(), 
            getVehicles(),
            getAllUsers(),
            getSmsTemplates(),
            getEmailTemplates(),
            getSystemSettings()
        ]);
        setApps(appData);
        setVehicles(fleetData);
        setUsers(userData);
        setSmsTemplates(smsData);
        setEmailTemplates(emailData);
        setSystemSettings(settingsData);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
        await updateApplicationStatus(id, status);
        loadData();
    };

    const handleEditApp = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!editingApp) return;
        setIsSaving(true);
        await updateApplicationData(editingApp.id, editingApp);
        setIsSaving(false);
        setEditingApp(null);
        loadData();
    };

    const handleVehicleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!editingVehicle) return;
        setIsSaving(true);
        const vData: any = { ...editingVehicle };
        if (!vData.status) vData.status = 'available';
        if (!vData.imageUrl) vData.imageUrl = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800';
        if (vData.id) {
            await updateVehicle(vData.id, vData);
        } else {
            await addVehicle(vData);
        }
        setIsSaving(false);
        setShowVehicleModal(false);
        setEditingVehicle(null);
        loadData();
    };

    const handleDeleteVehicle = async (id: string) => {
        if(confirm("Are you sure you want to delete this vehicle?")) {
            await deleteVehicle(id);
            loadData();
        }
    };

    const handleUserRoleUpdate = async (uid: string, currentRole: 'user' | 'admin') => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        if(confirm(`Change user role to ${newRole}?`)) {
            await updateUserRole(uid, newRole);
            loadData();
        }
    };

    const handleDeleteUser = async (uid: string) => {
        if(confirm("Delete this user? This cannot be undone.")) {
            await deleteUser(uid);
            loadData();
        }
    };

    const handleSaveSms = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!editingSms) return;
        setIsSaving(true);
        await saveSmsTemplate(editingSms);
        setIsSaving(false);
        setEditingSms(null);
        loadData();
    };

    const handleSaveEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!editingEmail) return;
        setIsSaving(true);
        await saveEmailTemplate(editingEmail);
        setIsSaving(false);
        setEditingEmail(null);
        loadData();
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await saveSystemSettings(systemSettings);
        setIsSaving(false);
        alert("Settings saved successfully.");
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            <div className={`bg-slate-950 text-white transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-64' : 'w-20'} z-20 shadow-xl`}>
                <div className="p-6 flex items-center justify-between">
                    {sidebarOpen && <span className="font-black text-lg tracking-wider">ADMIN</span>}
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-slate-800 rounded">
                        <Menu size={20} />
                    </button>
                </div>
                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <button onClick={() => setActiveTab('applications')} className={`w-full flex items-center p-3 rounded-xl transition-all ${activeTab === 'applications' ? 'bg-red-600 shadow-lg shadow-red-900/20' : 'hover:bg-slate-800 text-slate-400'}`}>
                        <LayoutDashboard size={20} />
                        {sidebarOpen && <span className="ml-3 font-bold text-xs uppercase tracking-wider">Applications</span>}
                    </button>
                    <button onClick={() => setActiveTab('users')} className={`w-full flex items-center p-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-red-600 shadow-lg shadow-red-900/20' : 'hover:bg-slate-800 text-slate-400'}`}>
                        <Users size={20} />
                        {sidebarOpen && <span className="ml-3 font-bold text-xs uppercase tracking-wider">Users</span>}
                    </button>
                    <button onClick={() => setActiveTab('fleet')} className={`w-full flex items-center p-3 rounded-xl transition-all ${activeTab === 'fleet' ? 'bg-red-600 shadow-lg shadow-red-900/20' : 'hover:bg-slate-800 text-slate-400'}`}>
                        <Car size={20} />
                        {sidebarOpen && <span className="ml-3 font-bold text-xs uppercase tracking-wider">Fleet</span>}
                    </button>
                    <button onClick={() => setActiveTab('sms')} className={`w-full flex items-center p-3 rounded-xl transition-all ${activeTab === 'sms' ? 'bg-red-600 shadow-lg shadow-red-900/20' : 'hover:bg-slate-800 text-slate-400'}`}>
                        <MessageSquare size={20} />
                        {sidebarOpen && <span className="ml-3 font-bold text-xs uppercase tracking-wider">SMS Templates</span>}
                    </button>
                    <button onClick={() => setActiveTab('email')} className={`w-full flex items-center p-3 rounded-xl transition-all ${activeTab === 'email' ? 'bg-red-600 shadow-lg shadow-red-900/20' : 'hover:bg-slate-800 text-slate-400'}`}>
                        <Mail size={20} />
                        {sidebarOpen && <span className="ml-3 font-bold text-xs uppercase tracking-wider">Email Templates</span>}
                    </button>
                    <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center p-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-red-600 shadow-lg shadow-red-900/20' : 'hover:bg-slate-800 text-slate-400'}`}>
                        <SettingsIcon size={20} />
                        {sidebarOpen && <span className="ml-3 font-bold text-xs uppercase tracking-wider">Settings</span>}
                    </button>
                </nav>
                <div className="p-4 border-t border-slate-900">
                    <button onClick={handleLogout} className="w-full flex items-center p-3 rounded-xl hover:bg-slate-800 text-slate-400 transition-all">
                        <LogOut size={20} />
                        {sidebarOpen && <span className="ml-3 font-bold text-xs uppercase tracking-wider">Logout</span>}
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 relative">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 uppercase">{activeTab.replace('_', ' ')} Management</h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Admin Console</p>
                    </div>
                </header>
                {loading ? (
                    <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-slate-300" size={32} /></div>
                ) : (
                    <>
                        {activeTab === 'applications' && (
                             <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <h3 className="font-bold text-slate-800">Recent Applications</h3>
                                    <button onClick={loadData} className="text-blue-600 text-xs font-bold hover:underline">Refresh</button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                                            <tr>
                                                <th className="p-4 pl-6">Applicant</th>
                                                <th className="p-4">Car/Program</th>
                                                <th className="p-4">Date</th>
                                                <th className="p-4">Status</th>
                                                <th className="p-4 text-right pr-6">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {apps.map((app) => (
                                                <tr key={app.id} className="hover:bg-blue-50/30 transition-colors">
                                                    <td className="p-4 pl-6">
                                                        <div className="font-bold text-slate-900">{app.fullName}</div>
                                                        <div className="text-xs text-slate-500">{app.email}</div>
                                                        <div className="text-xs text-slate-400">{app.phone}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="font-bold text-slate-800">{app.carRequested}</div>
                                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold uppercase">{app.rentalProgram}</span>
                                                    </td>
                                                    <td className="p-4 text-slate-500 text-xs">
                                                        {app.createdAt?.seconds ? new Date(app.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wide ${app.status === 'approved' ? 'bg-green-100 text-green-700' : app.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                            {app.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right pr-6 space-x-2">
                                                        <button onClick={() => setEditingApp(app)} className="text-slate-400 hover:text-blue-600 p-1"><Edit2 size={16} /></button>
                                                        {app.status === 'pending' && (
                                                            <>
                                                                <button onClick={() => handleStatusUpdate(app.id, 'approved')} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Approve</button>
                                                                <button onClick={() => handleStatusUpdate(app.id, 'rejected')} className="bg-white border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold">Reject</button>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        {activeTab === 'users' && (
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <h3 className="font-bold text-slate-800">User Management</h3>
                                    <button onClick={loadData} className="text-blue-600 text-xs font-bold hover:underline">Refresh</button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                                            <tr>
                                                <th className="p-4 pl-6">User</th>
                                                <th className="p-4">Role</th>
                                                <th className="p-4">Joined</th>
                                                <th className="p-4 text-right pr-6">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {users.map((u) => (
                                                <tr key={u.uid} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-4 pl-6">
                                                        <div className="font-bold text-slate-900">{u.fullName}</div>
                                                        <div className="text-xs text-slate-500">{u.email}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wide ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-xs text-slate-500">
                                                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                    <td className="p-4 text-right pr-6 space-x-2">
                                                        <button onClick={() => handleUserRoleUpdate(u.uid, u.role)} className="text-blue-600 hover:underline text-xs font-bold mr-3">
                                                            {u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                                                        </button>
                                                        <button onClick={() => handleDeleteUser(u.uid)} className="text-red-600 hover:bg-red-50 p-2 rounded transition-colors"><Trash2 size={16} /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        {activeTab === 'fleet' && (
                            <>
                                <div className="flex justify-end mb-6">
                                    <button onClick={() => { setEditingVehicle({}); setShowVehicleModal(true); }} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest flex items-center gap-2 shadow-lg">
                                        <Plus size={16} /> Add Vehicle
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {vehicles.map(v => (
                                        <div key={v.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all group">
                                            <div className="h-40 bg-slate-100 relative overflow-hidden">
                                                <img src={v.imageUrl} alt={v.model} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-black uppercase">
                                                    ${v.weeklyRent}/wk
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="font-black text-slate-900">{v.year} {v.make} {v.model}</h4>
                                                        <p className="text-xs text-slate-500 font-medium">{v.color} • {v.vin}</p>
                                                    </div>
                                                    <span className={`w-3 h-3 rounded-full ${v.status === 'available' ? 'bg-green-500' : v.status === 'rented' ? 'bg-blue-500' : 'bg-red-500'}`}></span>
                                                </div>
                                                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                                                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{v.status}</span>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => { setEditingVehicle(v); setShowVehicleModal(true); }} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"><Edit2 size={16} /></button>
                                                        <button onClick={() => handleDeleteVehicle(v.id)} className="p-2 hover:bg-red-50 rounded-lg text-slate-500 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        {activeTab === 'sms' && (
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    {smsTemplates.map(t => (
                                        <div key={t.id} onClick={() => setEditingSms(t)} className={`bg-white p-6 rounded-2xl border cursor-pointer transition-all ${editingSms?.id === t.id ? 'border-red-500 ring-1 ring-red-500 shadow-md' : 'border-slate-200 hover:border-red-300'}`}>
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="font-black text-slate-900">{t.name}</h4>
                                                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">ID: {t.id}</span>
                                            </div>
                                            <p className="text-sm text-slate-500 line-clamp-2">{t.content}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-fit sticky top-8">
                                    <h3 className="font-black text-lg mb-6 uppercase">Edit SMS Template</h3>
                                    {editingSms ? (
                                        <form onSubmit={handleSaveSms} className="space-y-4">
                                            <Input label="Template Name" value={editingSms.name} onChange={e => setEditingSms({...editingSms, name: e.target.value})} disabled />
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Message Content</label>
                                                <textarea 
                                                    className="w-full h-32 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50"
                                                    value={editingSms.content}
                                                    onChange={e => setEditingSms({...editingSms, content: e.target.value})}
                                                />
                                                <p className="text-xs text-slate-400 mt-2">Available variables: {'{name}'}, {'{car}'}</p>
                                            </div>
                                            <button type="submit" disabled={isSaving} className="w-full bg-slate-950 text-white py-3 rounded-xl font-black uppercase text-xs hover:bg-slate-800 transition-colors">
                                                {isSaving ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </form>
                                    ) : (
                                        <div className="text-center py-12 text-slate-400">
                                            <p>Select a template to edit</p>
                                        </div>
                                    )}
                                </div>
                             </div>
                        )}
                         {activeTab === 'email' && (
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    {emailTemplates.map(t => (
                                        <div key={t.id} onClick={() => setEditingEmail(t)} className={`bg-white p-6 rounded-2xl border cursor-pointer transition-all ${editingEmail?.id === t.id ? 'border-red-500 ring-1 ring-red-500 shadow-md' : 'border-slate-200 hover:border-red-300'}`}>
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="font-black text-slate-900">{t.name}</h4>
                                                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">ID: {t.id}</span>
                                            </div>
                                            <p className="text-xs font-bold text-slate-700 mb-1">Subject: {t.subject}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-fit sticky top-8">
                                    <h3 className="font-black text-lg mb-6 uppercase">Edit Email Template</h3>
                                    {editingEmail ? (
                                        <form onSubmit={handleSaveEmail} className="space-y-4">
                                            <Input label="Template Name" value={editingEmail.name} onChange={e => setEditingEmail({...editingEmail, name: e.target.value})} disabled />
                                            <Input label="Subject Line" value={editingEmail.subject} onChange={e => setEditingEmail({...editingEmail, subject: e.target.value})} />
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Body Content</label>
                                                <textarea 
                                                    className="w-full h-64 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50 font-mono"
                                                    value={editingEmail.content}
                                                    onChange={e => setEditingEmail({...editingEmail, content: e.target.value})}
                                                />
                                                <p className="text-xs text-slate-400 mt-2">Available variables: {'{name}'}, {'{car}'}</p>
                                            </div>
                                            <button type="submit" disabled={isSaving} className="w-full bg-slate-950 text-white py-3 rounded-xl font-black uppercase text-xs hover:bg-slate-800 transition-colors">
                                                {isSaving ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </form>
                                    ) : (
                                        <div className="text-center py-12 text-slate-400">
                                            <p>Select a template to edit</p>
                                        </div>
                                    )}
                                </div>
                             </div>
                        )}
                        {activeTab === 'settings' && (
                            <div className="max-w-2xl mx-auto">
                                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                                    <h3 className="font-black text-lg mb-2 uppercase flex items-center gap-2">
                                        <SettingsIcon className="text-red-600" size={20} /> System Configuration
                                    </h3>
                                    <p className="text-slate-500 text-sm mb-6">Manage external API integrations and keys.</p>
                                    <form onSubmit={handleSaveSettings} className="space-y-6">
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider border-b pb-2">Twilio SMS Gateway</h4>
                                            <Input label="Account SID" value={systemSettings.twilioAccountSid} onChange={e => setSystemSettings({...systemSettings, twilioAccountSid: e.target.value})} placeholder="AC..." />
                                            <div className="relative">
                                                <Input label="Auth Token" type={showToken ? "text" : "password"} value={systemSettings.twilioAuthToken} onChange={e => setSystemSettings({...systemSettings, twilioAuthToken: e.target.value})} placeholder="Token..." />
                                                <button type="button" onClick={() => setShowToken(!showToken)} className="absolute right-3 top-9 text-slate-400 hover:text-slate-600">
                                                    {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                            <Input label="From Phone Number" value={systemSettings.twilioPhoneNumber} onChange={e => setSystemSettings({...systemSettings, twilioPhoneNumber: e.target.value})} placeholder="+12105550123" tooltip="Must be a valid Twilio number capable of SMS" />
                                        </div>
                                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                            <p className="text-xs text-slate-400 italic">Keys are stored securely in Firestore.</p>
                                            <button type="submit" disabled={isSaving} className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest flex items-center gap-2 shadow-lg">
                                                {isSaving ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Save Configuration</>}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </>
                )}
                {editingApp && (
                     <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-2xl rounded-3xl p-8 max-h-[90vh] overflow-y-auto shadow-2xl">
                            <h3 className="text-xl font-black uppercase mb-6">Edit Application</h3>
                            <form onSubmit={handleEditApp} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Full Name" value={editingApp.fullName} onChange={e => setEditingApp({...editingApp, fullName: e.target.value})} />
                                    <Input label="Phone" value={editingApp.phone} onChange={e => setEditingApp({...editingApp, phone: e.target.value})} />
                                </div>
                                <Input label="Email" value={editingApp.email} onChange={e => setEditingApp({...editingApp, email: e.target.value})} />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Car Requested" value={editingApp.carRequested} onChange={e => setEditingApp({...editingApp, carRequested: e.target.value})} />
                                    <Input label="License No" value={editingApp.licenseNumber} onChange={e => setEditingApp({...editingApp, licenseNumber: e.target.value})} />
                                </div>
                                <Select label="Status" value={editingApp.status} onChange={e => setEditingApp({...editingApp, status: e.target.value as any})} options={[{value:'pending',label:'Pending'},{value:'approved',label:'Approved'},{value:'rejected',label:'Rejected'}]} />
                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={() => setEditingApp(null)} className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-xs uppercase hover:bg-slate-50">Cancel</button>
                                    <button type="submit" disabled={isSaving} className="flex-1 py-3 rounded-xl bg-slate-950 text-white font-bold text-xs uppercase hover:bg-slate-800">{isSaving ? 'Saving...' : 'Save Changes'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                 {showVehicleModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl">
                            <h3 className="text-xl font-black uppercase mb-6">{editingVehicle?.id ? 'Edit Vehicle' : 'Add Vehicle'}</h3>
                            <form onSubmit={handleVehicleSave} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Make" value={editingVehicle?.make || ''} onChange={e => setEditingVehicle({...editingVehicle, make: e.target.value})} required />
                                    <Input label="Model" value={editingVehicle?.model || ''} onChange={e => setEditingVehicle({...editingVehicle, model: e.target.value})} required />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <Input label="Year" value={editingVehicle?.year || ''} onChange={e => setEditingVehicle({...editingVehicle, year: e.target.value})} required />
                                    <Input label="Color" value={editingVehicle?.color || ''} onChange={e => setEditingVehicle({...editingVehicle, color: e.target.value})} required />
                                    <Input label="Rent ($)" type="number" value={editingVehicle?.weeklyRent || ''} onChange={e => setEditingVehicle({...editingVehicle, weeklyRent: Number(e.target.value)})} required />
                                </div>
                                <Input label="VIN" value={editingVehicle?.vin || ''} onChange={e => setEditingVehicle({...editingVehicle, vin: e.target.value})} required />
                                <Input label="Image URL" value={editingVehicle?.imageUrl || ''} onChange={e => setEditingVehicle({...editingVehicle, imageUrl: e.target.value})} placeholder="https://..." />
                                <Select label="Status" value={editingVehicle?.status || 'available'} onChange={e => setEditingVehicle({...editingVehicle, status: e.target.value as any})} options={[{value:'available',label:'Available'},{value:'rented',label:'Rented'},{value:'maintenance',label:'Maintenance'}]} />
                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={() => { setShowVehicleModal(false); setEditingVehicle(null); }} className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-xs uppercase hover:bg-slate-50">Cancel</button>
                                    <button type="submit" disabled={isSaving} className="flex-1 py-3 rounded-xl bg-slate-950 text-white font-bold text-xs uppercase hover:bg-slate-800">{isSaving ? 'Saving...' : 'Save Vehicle'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
  };

  const HomeView = () => (
    <div className="animate-fadeIn">
      <section className="relative bg-slate-950 text-white pt-32 pb-40 overflow-hidden flex flex-col items-center min-h-[80vh] justify-center">
        <div className="absolute inset-0 z-0">
            <img 
                src="https://www.cnet.com/a/img/resize/c15c1cd3ff178b55ea49c81017affac5024b45a1/hub/2014/06/09/d766dd95-3c1a-48b7-aba8-e1c9e0890a5f/2014fordfusionenergi-000.jpg?auto=webp&width=768" 
                className="w-full h-full object-cover opacity-60" 
                alt="Hero Background" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-900/40"></div>
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-20 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 bg-red-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-900/30">
              <MapPin size={12}/> San Antonio, Texas
            </div>
            <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.85]">
                RENT TO <span className="text-red-600 italic">OWN.</span><br/>DRIVE TO <span className="text-blue-500 italic">EARN.</span>
            </h2>
            <p className="text-xl text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
                San Antonio's #1 <strong className="text-white">Rent-to-Own</strong> Program & <strong className="text-white">Rideshare Rental</strong> Fleet. 
                <br/>No Credit Checks. Instant Approval.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <button onClick={() => setView('application')} className="bg-red-600 hover:bg-red-700 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl transition-all hover:scale-105 flex items-center gap-3">Start Application <ArrowUpRight size={20}/></button>
              <button onClick={() => setView('contact')} className="bg-white text-slate-950 px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-105 shadow-xl inline-block">Speak to Sales</button>
            </div>
          </div>
        </div>
      </section>
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-12">
            <h3 className="text-4xl font-black text-slate-950 uppercase tracking-tighter">FEATURED <span className="text-red-600">VEHICLES</span></h3>
            <p className="text-slate-500 mt-2">Ready for immediate pickup. Insurance included.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
            <div className="group bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-100 hover:shadow-2xl transition-all hover:-translate-y-1">
                <div className="h-64 overflow-hidden relative">
                    <img src="https://www.thecubiclechick.com/wp-content/uploads/2014/04/2014-Kia-Optima-SX-Limited.jpg" alt="Kia Optima" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-sm font-black text-slate-900 uppercase tracking-wider shadow-lg">$350/wk</div>
                </div>
                <div className="p-8">
                    <h4 className="text-2xl font-black text-slate-900 mb-1">2014 Kia Optima</h4>
                    <p className="text-slate-500 font-medium text-sm mb-6">Gray • Rent-to-Own Available</p>
                    <ul className="space-y-2 mb-8">
                        <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 size={16} className="text-green-500"/> Budget Friendly Choice</li>
                        <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 size={16} className="text-green-500"/> Perfect for DoorDash / Delivery</li>
                        <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 size={16} className="text-green-500"/> Insurance Included</li>
                    </ul>
                    <button onClick={() => setView('application')} className="w-full bg-slate-950 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-red-600 transition-colors">Rent This Car</button>
                </div>
            </div>
            <div className="group bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-100 hover:shadow-2xl transition-all hover:-translate-y-1">
                <div className="h-64 overflow-hidden relative">
                    <img src="https://i.ytimg.com/vi/q49cMgR56RE/maxresdefault.jpg" alt="Ford Fusion" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-sm font-black text-slate-900 uppercase tracking-wider shadow-lg">$400/wk</div>
                </div>
                <div className="p-8">
                    <h4 className="text-2xl font-black text-slate-900 mb-1">2017 Ford Fusion</h4>
                    <p className="text-slate-500 font-medium text-sm mb-6">Black • Rent-to-Own Available</p>
                    <ul className="space-y-2 mb-8">
                        <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 size={16} className="text-green-500"/> UberX & Lyft Standard Approved</li>
                        <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 size={16} className="text-green-500"/> Bluetooth & Backup Camera</li>
                        <li className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 size={16} className="text-green-500"/> Rent-To-Own Available</li>
                    </ul>
                    <button onClick={() => setView('application')} className="w-full bg-slate-950 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-red-600 transition-colors">Rent This Car</button>
                </div>
            </div>
        </div>
      </section>
      <section className="py-24 px-6 max-w-7xl mx-auto bg-slate-50">
        <div className="text-center mb-16">
          <h3 className="text-4xl md:text-5xl font-black text-slate-950 uppercase tracking-tighter">OUR <span className="text-red-600">SERVICES</span></h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           {[
            { icon: <Car />, title: "Rideshare Units", desc: "Uber, Lyft, and DoorDash ready vehicles. Get approved instantly." },
            { icon: <Zap />, title: "Rent-To-Own", desc: "Stop renting forever. Our program puts you on the path to ownership." },
            { icon: <Shield />, title: "Full Insurance", desc: "Comprehensive commercial coverage included in your weekly rate." },
            { icon: <Clock />, title: "24/7 Support", desc: "Local San Antonio team ready to assist with maintenance." }
          ].map((item, i) => (
            <div key={i} className="p-10 bg-white rounded-[3rem] border border-slate-200 hover:shadow-xl transition-all group">
              <div className="w-16 h-16 bg-slate-950 text-white rounded-3xl flex items-center justify-center mb-8 group-hover:bg-red-600 transition-colors shadow-lg">
                {React.cloneElement(item.icon as React.ReactElement<any>, { size: 32 })}
              </div>
              <h4 className="text-xl font-black uppercase tracking-tight mb-3 text-slate-900">{item.title}</h4>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const ContactView = () => (
    <div className="max-w-6xl mx-auto mt-12 px-6 pb-20 animate-fadeIn flex-grow w-full">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900">DJ AUTO <span className="text-red-600">RENTAL</span></h2>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">Contact Support</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div className="space-y-8">
            <div className="bg-slate-950 text-white p-10 rounded-[2rem] shadow-xl">
                <h3 className="text-xl font-black uppercase mb-8">Get in Touch</h3>
                <div className="space-y-8 text-sm font-medium text-slate-300">
                    <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-red-500 shadow-inner"><Phone size={24}/></div>
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Call Us</p>
                            <a href={`tel:${CONTACT_PHONE.replace(/\D/g,'')}`} className="text-white text-lg font-bold hover:text-red-500 transition-colors">{CONTACT_PHONE}</a>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-red-500 shadow-inner"><Mail size={24}/></div>
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Email Us</p>
                            <a href="mailto:support@djautofleet.com" className="text-white text-lg font-bold hover:text-red-500 transition-colors">support@djautofleet.com</a>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-red-500 shadow-inner"><MapPin size={24}/></div>
                        <div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Visit Us</p>
                            <p className="text-white text-lg font-bold leading-tight">{CONTACT_ADDRESS}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="p-8 bg-red-50 rounded-[2rem] border border-red-100">
                <h4 className="font-black text-red-800 uppercase mb-2 flex items-center gap-2"><AlertCircle size={20}/> Urgent Assistance?</h4>
                <p className="text-red-700/80 text-sm leading-relaxed">
                    For roadside assistance or accidents, please call 911 immediately if there are injuries. For vehicle issues, call our 24/7 fleet support line directly.
                </p>
            </div>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-xl border border-slate-100">
            {contactSubmitted ? (
                <div className="text-center py-16">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm"><CheckCircle2 size={40}/></div>
                    <h3 className="text-2xl font-black uppercase text-slate-900 mb-2">Message Sent</h3>
                    <p className="text-slate-500 font-medium mb-8">Thank you for contacting us. We will respond within 24 hours.</p>
                    <button onClick={() => setContactSubmitted(false)} className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest transition-colors">
                        Send Another Message
                    </button>
                </div>
            ) : (
                <form onSubmit={handleContactSubmit} className="space-y-6">
                    <div>
                        <h3 className="text-2xl font-black uppercase text-slate-900 mb-6">Send Message</h3>
                        <div className="space-y-5">
                            <Input label="Your Name" value={contactData.name} onChange={e => setContactData({...contactData, name: e.target.value})} required placeholder="John Doe" />
                            <Input label="Email Address" type="email" value={contactData.email} onChange={e => setContactData({...contactData, email: e.target.value})} required placeholder="john@example.com" />
                            <Input label="Phone Number" value={contactData.phone} onChange={e => setContactData({...contactData, phone: e.target.value})} placeholder="(210) 555-0123" />
                            <Select label="Topic" value={contactData.subject} onChange={e => setContactData({...contactData, subject: e.target.value})} options={[
                                {value: 'General Inquiry', label: 'General Inquiry'},
                                {value: 'Vehicle Availability', label: 'Vehicle Availability / Fleet'},
                                {value: 'Maintenance', label: 'Maintenance Request'},
                                {value: 'Billing', label: 'Billing / Payments'},
                                {value: 'Emergency', label: 'Emergency / Accident'}
                            ]} />
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                <textarea 
                                    className="w-full h-32 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50 resize-none transition-all"
                                    value={contactData.message}
                                    onChange={e => setContactData({...contactData, message: e.target.value})}
                                    required
                                    placeholder="How can we help you?"
                                ></textarea>
                            </div>
                        </div>
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 transform active:scale-95">
                        {isSubmitting ? <Loader2 className="animate-spin" /> : <>Send Message <Send size={16}/></>}
                    </button>
                </form>
            )}
        </div>
      </div>
    </div>
  );

  const ProfileView = () => {
    const [myApps, setMyApps] = useState<any[]>([]);
    const [loadingApps, setLoadingApps] = useState(true);

    useEffect(() => {
        if (currentUser) {
            getUserApplications(currentUser.uid, currentUser.email).then(data => {
                setMyApps(data);
                setLoadingApps(false);
            });
        }
    }, [currentUser]);

    if (!profile) return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="animate-spin text-slate-300" size={40} /></div>;

    return (
        <div className="max-w-5xl mx-auto mt-12 px-6 pb-20 animate-fadeIn flex-grow w-full">
            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden mb-8">
                <div className="bg-slate-950 p-10 md:p-14 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-600 rounded-full blur-[100px] opacity-20 -mr-20 -mt-20"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="w-28 h-28 bg-gradient-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center text-4xl font-black shadow-2xl border-4 border-slate-900 text-white">
                            {profile.fullName.charAt(0)}
                        </div>
                        <div className="text-center md:text-left space-y-2">
                            <h2 className="text-4xl font-black uppercase tracking-tighter">{profile.fullName}</h2>
                            <div className="flex flex-col md:flex-row gap-2 md:gap-4 text-slate-400 text-sm font-medium">
                                <span className="flex items-center gap-1"><Mail size={14}/> {profile.email}</span>
                                {profile.phone && <span className="flex items-center gap-1"><Phone size={14}/> {profile.phone}</span>}
                            </div>
                            <div className="pt-2">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${profile.role === 'admin' ? 'bg-red-900/30 border-red-500/50 text-red-400' : 'bg-blue-900/30 border-blue-500/50 text-blue-400'}`}>
                                    {profile.role === 'admin' ? <ShieldAlert size={12}/> : <CheckCircle2 size={12}/>}
                                    {profile.role === 'admin' ? 'Administrator' : 'Verified Driver'}
                                </span>
                            </div>
                        </div>
                        <div className="md:ml-auto">
                             <button onClick={handleLogout} className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 hover:border-white/30">
                                <LogOut size={16}/> Sign Out
                             </button>
                        </div>
                    </div>
                </div>
                
                <div className="p-8 md:p-12 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black uppercase text-slate-900 flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-red-600"><FileText size={20} /></div>
                             My Applications
                        </h3>
                        {myApps.length > 0 && (
                             <button onClick={() => setView('application')} className="hidden md:flex bg-slate-950 text-white px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-slate-800 items-center gap-2 transition-colors">
                                <Plus size={14}/> New Application
                             </button>
                        )}
                    </div>
                    
                    {loadingApps ? (
                        <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-slate-300" size={32} /></div>
                    ) : myApps.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300"><FileText size={32}/></div>
                            <p className="text-slate-500 font-medium mb-6">You haven't submitted any rental applications yet.</p>
                            <button onClick={() => setView('application')} className="bg-red-600 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-red-700 shadow-lg transition-all">
                                Start New Application
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {myApps.map(app => (
                                <div key={app.id} className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6 hover:shadow-lg transition-all group">
                                    <div className="flex items-center gap-6 w-full md:w-auto">
                                        <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                            <Car size={28} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900 text-lg">{app.carRequested}</h4>
                                            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-1">
                                                <span className="flex items-center gap-1"><Clock size={12}/> {new Date(app.createdAt.seconds ? app.createdAt.seconds * 1000 : app.createdAt).toLocaleDateString()}</span>
                                                <span>•</span>
                                                <span className="uppercase">{app.rentalProgram === 'rent-to-own' ? 'Rent-To-Own' : 'Standard Rental'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between w-full md:w-auto gap-6 pl-22 md:pl-0">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                                            app.status === 'approved' ? 'bg-green-50 text-green-600 border-green-200' : 
                                            app.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' : 
                                            'bg-yellow-50 text-yellow-600 border-yellow-200'
                                        }`}>
                                            {app.status}
                                        </span>
                                        {app.status === 'approved' && (
                                            <button className="text-xs font-bold text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors">
                                                Details <ChevronRight size={14}/>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div className="mt-4 text-center md:hidden">
                                <button onClick={() => setView('application')} className="text-red-600 font-black text-xs uppercase tracking-wider">Start New Application</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Nav />
      {view === 'home' && <HomeView />}
      {view === 'contact' && <ContactView />}
      {view === 'admin' && <AdminView />}
      {view === 'profile' && <ProfileView />}
      {view === 'application' && (
        <main className="max-w-4xl mx-auto mt-12 px-4 flex-grow w-full pb-20 animate-fadeIn">
           <div className="text-center mb-12">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900">DRIVER <span className="text-red-600">APPLICATION</span></h2>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">Fleet Entry Protocol</p>
              <p className="text-red-600 font-bold text-sm mt-2 flex items-center justify-center gap-2"><Phone size={14} /> Questions? Call {CONTACT_PHONE}</p>
           </div>
           
           <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-8 md:p-16">
              {submitted ? (
                 <div className="text-center space-y-8 py-10 animate-fadeIn">
                    <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner"><CheckCircle2 size={56} /></div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter">APPLICATION RECEIVED</h3>
                    
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 max-w-md mx-auto space-y-2">
                      <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Confirmation</p>
                      <p className="text-xl font-black text-slate-900">{formData.fullName}</p>
                      <p className="text-sm text-slate-600">{formData.carRequested}</p>
                    </div>

                    <p className="text-slate-600 font-medium text-lg max-w-md mx-auto leading-relaxed">
                       You should receive an <span className="font-bold text-red-600">SMS confirmation</span> shortly. Our team will review your details and contact you to finalize pickup.
                    </p>
                    
                    <button onClick={() => setView('home')} className="px-10 py-4 bg-slate-950 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-600 transition-all shadow-xl">
                       Return to Home
                    </button>
                 </div>
              ) : (
                <>
                  <StepWizard steps={STEPS} currentStep={currentStep} onStepClick={setCurrentStep} />
                  <div className="mt-12 space-y-10">
                    {currentStep === 0 && (
                      <div className="space-y-6 animate-fadeIn">
                        <Input label="Full Legal Name" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} placeholder="As it appears on license" required />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <Input label="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="(210) 000-0000" required />
                           <Input label="Email Address" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="driver@email.com" required />
                        </div>
                        <AddressAutocomplete label="Home Address" value={formData.address} onChange={val => setFormData({...formData, address: val})} onSelect={data => setFormData({...formData, address: data.address, city: data.city, state: data.state, zip: data.zip})} placeholder="Search San Antonio address..." />
                        
                        <div className="pt-4 border-t border-slate-100">
                           <FileUpload 
                              label="Proof of Income" 
                              onChange={file => setFormData({...formData, proofOfIncome: file})} 
                              currentFile={formData.proofOfIncome} 
                              accept="image/*,application/pdf"
                              maxSizeMB={5}
                              tooltip="Acceptable proof formats include screenshots of weekly earnings from platforms like DoorDash, Amazon Flex, Uber, or Lyft, ensuring a consistent weekly income."
                           />
                        </div>
                      </div>
                    )}
                    {currentStep === 1 && (
                      <div className="space-y-8 animate-fadeIn">
                        <Input label="License Number" value={formData.licenseNumber} onChange={e => setFormData({...formData, licenseNumber: e.target.value})} required />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <FileUpload label="License (Front)" onChange={file => setFormData({...formData, licenseFront: file})} currentFile={formData.licenseFront} />
                           <FileUpload label="License (Back)" onChange={file => setFormData({...formData, licenseBack: file})} currentFile={formData.licenseBack} />
                        </div>
                        <Select label="Target Platform" value={formData.targetPlatform} onChange={e => setFormData({...formData, targetPlatform: e.target.value as any})} options={[{value:'uber',label:'Uber'},{value:'lyft',label:'Lyft'}]} required />
                      </div>
                    )}
                    {currentStep === 2 && (
                      <div className="space-y-8 animate-fadeIn">
                         <h3 className="text-xl font-black uppercase text-slate-800">Select Your Vehicle</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {availableVehicles.map(v => (
                                <div 
                                    key={v.id} 
                                    onClick={() => setFormData({...formData, carRequested: `${v.year} ${v.make} ${v.model}`, selectedVehicleId: v.id, weeklyRent: v.weeklyRent})}
                                    className={`relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all hover:scale-[1.02] ${formData.selectedVehicleId === v.id ? 'border-red-600 shadow-xl ring-2 ring-red-200' : 'border-slate-100'}`}
                                >
                                    <img src={v.imageUrl} alt={v.model} className="h-40 w-full object-cover" />
                                    <div className="p-4 bg-white">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-black text-slate-900">{v.year} {v.make} {v.model}</h4>
                                                <p className="text-xs text-slate-500">{v.color} • {v.make}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-lg font-black text-red-600">${v.weeklyRent}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase">Per Week</span>
                                            </div>
                                        </div>
                                    </div>
                                    {formData.selectedVehicleId === v.id && (
                                        <div className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1">
                                            <CheckCircle2 size={16} />
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div 
                                onClick={() => setFormData({...formData, carRequested: 'Any Available', selectedVehicleId: 'any', weeklyRent: 0})}
                                className={`flex items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-300 text-slate-400 cursor-pointer hover:border-slate-400 hover:text-slate-500 ${formData.selectedVehicleId === 'any' ? 'border-red-600 bg-red-50 text-red-600' : ''}`}
                            >
                                <span className="font-bold text-sm uppercase">I'll decide later / Any Available</span>
                            </div>
                         </div>
                         <Select label="Rental Program Type" value={formData.rentalProgram} onChange={e => setFormData({...formData, rentalProgram: e.target.value as any})} options={[{value:'rent',label:'Standard Rental'},{value:'rent-to-own',label:'Rent-To-Own'}]} required />
                      </div>
                    )}
                    {currentStep === 3 && (
                      <div className="space-y-8 animate-fadeIn">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                            <h4 className="font-black text-slate-900 uppercase mb-4 flex items-center gap-2"><FileText size={18}/> Rental Agreement Summary</h4>
                            <div className="text-sm text-slate-600 space-y-3 font-medium">
                                <p>I, <span className="border-b border-slate-400 px-1">{formData.fullName || '_______________'}</span>, hereby agree to the terms set forth by DJ Auto Rental.</p>
                                <p>Vehicle: <span className="font-bold text-slate-900">{formData.carRequested || 'TBD'}</span></p>
                                {formData.weeklyRent ? (
                                    <p>Weekly Payment: <span className="font-bold text-slate-900">${formData.weeklyRent}.00</span> (Plus applicable taxes/insurance)</p>
                                ) : null}
                                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-500 mt-4">
                                    <li>I agree to maintain a valid driver's license.</li>
                                    <li>I authorize DJ Auto Rental to conduct a background/MVR check.</li>
                                    <li>I understand payments are due weekly via Zelle or Cash App.</li>
                                    <li>No smoking or unauthorized drivers permitted in the vehicle.</li>
                                </ul>
                            </div>
                        </div>

                        <Checkbox label="I authorize background check" checked={formData.screeningConsent} onChange={e => setFormData({...formData, screeningConsent: e.target.checked})} />
                        <SignaturePad onChange={dataUrl => setFormData({...formData, signatureImage: dataUrl})} />
                        <Input label="Full Name for Signature" value={formData.signatureName} onChange={e => setFormData({...formData, signatureName: e.target.value})} required />
                      </div>
                    )}
                    <div className="flex justify-between pt-10 border-t border-slate-100">
                       <button onClick={()=>setCurrentStep(s=>s-1)} disabled={currentStep === 0} className="px-8 py-3 rounded-xl font-black uppercase text-xs text-slate-500">Back</button>
                       {currentStep === STEPS.length - 1 ? (
                         <button onClick={handleAppSubmit} disabled={isSubmitting || !formData.signatureImage} className="px-12 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center gap-2">
                           {isSubmitting ? <Loader2 className="animate-spin" /> : <>Submit Application <CheckCircle size={16}/></>}
                         </button>
                       ) : (
                         <button onClick={()=>setCurrentStep(s=>s+1)} className="px-12 py-4 bg-slate-950 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center gap-2">Next Phase <ChevronRight size={18}/></button>
                       )}
                    </div>
                  </div>
                </>
              )}
           </div>
        </main>
      )}

      {view === 'login' && (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-10 md:p-14 rounded-[3rem] shadow-2xl space-y-10">
              <div className="text-center">
                <img src={LOGO_URL} className="h-14 mx-auto mb-8" alt="DJ Logo" />
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">SECURE <span className="text-red-600">LOGIN</span></h2>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-3">San Antonio Fleet Portal</p>
              </div>
              {loginError && <div className="bg-red-900/20 border border-red-900/50 p-4 rounded-xl text-red-400 text-[10px] font-black uppercase text-center">{loginError}</div>}
              <form onSubmit={handleLogin} className="space-y-6">
                <Input label="Email" type="email" value={loginForm.email} onChange={e=>setLoginForm({...loginForm, email:e.target.value})} className="bg-slate-800 border-slate-700 text-white" />
                <Input label="Password" type="password" value={loginForm.password} onChange={e=>setLoginForm({...loginForm, password:e.target.value})} className="bg-slate-800 border-slate-700 text-white" />
                <button type="submit" disabled={isSubmitting} className="w-full bg-red-600 hover:bg-red-700 py-5 rounded-2xl font-black uppercase text-xs shadow-xl">
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'AUTHENTICATE'}
                </button>
              </form>
              <button onClick={()=>setView('home')} className="w-full text-slate-500 text-[10px] font-black uppercase hover:text-white">Cancel</button>
            </div>
        </div>
      )}

      {view !== 'admin' && (
      <footer className="bg-slate-950 text-slate-500 py-16 px-6 border-t border-slate-900 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
            <div className="space-y-6">
                <img src={LOGO_URL} className="h-10 opacity-70" alt="DJ Logo" />
                <p className="text-sm font-medium text-slate-400 max-w-xs leading-relaxed">DJ Auto Rental San Antonio. Professional vehicle solutions for the gig economy.</p>
                <div className="text-xs space-y-2">
                    <p className="flex items-center gap-2"><MapPin size={12}/> {CONTACT_ADDRESS}</p>
                    <p className="flex items-center gap-2"><Phone size={12}/> {CONTACT_PHONE}</p>
                </div>
            </div>
            <div className="flex gap-16">
                <div className="space-y-4">
                    <h4 className="text-white font-black uppercase text-xs tracking-widest">AUTHORIZED</h4>
                    <ul className="flex flex-col gap-3 text-[10px] font-black uppercase tracking-widest">
                        <li><button onClick={()=>setView('login')} className="hover:text-red-500 transition-colors">Admin Login</button></li>
                        <li><button onClick={()=>setView('login')} className="hover:text-red-500 transition-colors">Driver Login</button></li>
                    </ul>
                </div>
            </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-slate-900 flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-700">
            <p>© 2026 DJ AUTO RENTAL.</p>
            <div className="flex gap-8"><span>Privacy</span><span>Terms</span></div>
        </div>
      </footer>
      )}
    </div>
  );
}