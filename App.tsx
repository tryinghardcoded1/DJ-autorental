
import React, { useState, useEffect } from 'react';
import { 
  INITIAL_DATA, 
  FormData, 
  ContactFormData, 
  UserProfile,
} from './types';
import { StepWizard } from './components/StepWizard';
import { Input, Select, FileUpload, Checkbox, DateEntry } from './components/InputFields';
import { AddressAutocomplete } from './components/AddressAutocomplete';
import { SignaturePad } from './components/SignaturePad';
import { 
  submitApplication, 
  submitContactInquiry, 
  getUserProfile, 
  checkAdminRole,
} from './services/submissionService';
import { auth as firebaseAuth } from './lib/firebase';
import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  Car, 
  ShieldCheck, 
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
  ChevronRight
} from 'lucide-react';

const LOGO_URL = "https://djautofleet.com/wp-content/uploads/2026/02/Untitled-design-e1770786148880.gif";
const STEPS = ["Personal", "License", "Program", "Finalize"];

export default function App() {
  const [view, setView] = useState<'home' | 'application' | 'admin' | 'login' | 'profile'>('home');
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(INITIAL_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
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
    const unsub = firebaseAuth?.onAuthStateChanged(async (user: any) => {
      setCurrentUser(user);
      if (user) {
        const p = await getUserProfile(user.uid);
        const isAdm = await checkAdminRole(user.uid);
        setProfile(p);
        setIsAdmin(isAdm);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
    });
    return unsub;
  }, []);

  const handleLogout = async () => {
    await signOut(firebaseAuth);
    setView('home');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);
    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth, loginForm.email, loginForm.password);
      const isAdm = await checkAdminRole(cred.user.uid);
      setIsAdmin(isAdm);
      setView('profile');
    } catch (err: any) {
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
      const res = await submitApplication(formData);
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
        <div className="flex items-center gap-4 md:gap-8 text-[10px] font-black uppercase tracking-widest">
          <button onClick={() => setView('home')} className={`hover:text-red-500 transition-colors ${view === 'home' ? 'text-red-500' : 'text-slate-400'}`}>Home</button>
          <button onClick={() => setView('application')} className={`hover:text-red-500 transition-colors ${view === 'application' ? 'text-red-500' : 'text-slate-400'}`}>Apply</button>
          {isAdmin && (
            <button onClick={() => setView('admin')} className="text-red-600 bg-red-950/30 px-3 py-1.5 rounded-lg border border-red-900/50">Admin</button>
          )}
          {currentUser ? (
            <button onClick={() => setView('profile')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 ${view === 'profile' ? 'text-red-500' : 'text-slate-300'}`}>
              <User size={14} /> Profile
            </button>
          ) : (
            <button onClick={() => setView('login')} className="bg-red-600 px-5 py-2 rounded-xl transition-all shadow-lg shadow-red-900/20 font-black">LOGIN</button>
          )}
        </div>
      </div>
    </nav>
  );

  const HomeView = () => (
    <div className="animate-fadeIn">
      {/* Hero Section */}
      <section className="relative bg-slate-950 text-white pt-24 pb-32 overflow-hidden flex flex-col items-center">
        <div className="max-w-7xl mx-auto px-6 relative z-20 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="inline-flex items-center gap-2 bg-red-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-900/30">
              <MapPin size={12}/> San Antonio, Texas
            </div>
            <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.85]">ELEVATE YOUR <br/><span className="text-red-600 italic">EARNINGS.</span></h2>
            <p className="text-xl text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">Join San Antonio's premier fleet provider. Rideshare-ready units with insurance included and exclusive rent-to-own programs.</p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <button onClick={() => setView('application')} className="bg-red-600 hover:bg-red-700 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl transition-all hover:scale-105 flex items-center gap-3">Start Application <ArrowUpRight size={20}/></button>
              <a href="#contact" className="bg-white text-slate-950 px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-105 shadow-xl inline-block">Speak to Sales</a>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto bg-white" id="services">
        <div className="text-center mb-16">
          <p className="text-red-600 font-black uppercase text-[10px] tracking-[0.3em] mb-3">Our Core Offerings</p>
          <h3 className="text-4xl md:text-5xl font-black text-slate-950 uppercase tracking-tighter">FLEET <span className="text-red-600">SERVICES</span></h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: <Car />, title: "Rideshare Units", desc: "Uber/Lyft ready late-model vehicles." },
            { icon: <Zap />, title: "Rent-To-Own", desc: "Turn your daily rental into asset ownership." },
            { icon: <Shield />, title: "Full Insurance", desc: "Comprehensive commercial coverage included." },
            { icon: <Clock />, title: "24/7 Roadside", desc: "Maintenance & accident support always on." }
          ].map((item, i) => (
            <div key={i} className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 hover:shadow-xl transition-all group">
              <div className="w-16 h-16 bg-slate-950 text-white rounded-3xl flex items-center justify-center mb-8 group-hover:bg-red-600 transition-colors shadow-lg">
                {/* Fixed TypeScript error by casting to React.ReactElement<any> to allow passing 'size' prop */}
                {React.cloneElement(item.icon as React.ReactElement<any>, { size: 32 })}
              </div>
              <h4 className="text-xl font-black uppercase tracking-tight mb-3 text-slate-900">{item.title}</h4>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-24 bg-slate-950 text-white" id="contact">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h3 className="text-5xl font-black uppercase tracking-tighter leading-none">SEND US A <br/><span className="text-red-600 italic">MESSAGE.</span></h3>
            <p className="text-slate-400 text-lg max-w-md">Our San Antonio team is ready to answer your questions. Contact us for unit availability or program pricing.</p>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-600/10 text-red-600 rounded-xl flex items-center justify-center"><Phone size={24}/></div>
                <p className="font-black text-xl">(210) 369-8766</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-600/10 text-red-600 rounded-xl flex items-center justify-center"><Mail size={24}/></div>
                <p className="font-black text-xl">rentals@djautofleet.com</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl">
            {contactSubmitted ? (
              <div className="text-center py-12 space-y-6">
                <CheckCircle size={64} className="text-green-500 mx-auto" />
                <h4 className="text-2xl font-black uppercase">Message Received</h4>
                <p className="text-slate-400">A fleet manager will reach out shortly.</p>
                <button onClick={() => setContactSubmitted(false)} className="text-red-500 font-black uppercase text-xs">Send another</button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500">Name</label>
                    <input className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl outline-none focus:border-red-600" required value={contactData.name} onChange={e=>setContactData({...contactData, name:e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500">Email</label>
                    <input type="email" className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl outline-none focus:border-red-600" required value={contactData.email} onChange={e=>setContactData({...contactData, email:e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500">Message</label>
                  <textarea className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl outline-none h-32 focus:border-red-600" required value={contactData.message} onChange={e=>setContactData({...contactData, message:e.target.value})} />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-red-600 hover:bg-red-700 py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-red-950/40">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <><Send size={18}/> Send Inquiry</>}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Nav />
      
      {view === 'home' && <HomeView />}

      {view === 'application' && (
        <main className="max-w-4xl mx-auto mt-12 px-4 flex-grow w-full pb-20 animate-fadeIn">
           <div className="text-center mb-12">
              <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900">DRIVER <span className="text-red-600">APPLICATION</span></h2>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">Fleet Entry Protocol</p>
           </div>
           
           <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-8 md:p-16">
              {submitted ? (
                 <div className="text-center space-y-8 py-10 animate-fadeIn">
                    <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner"><CheckCircle2 size={56} /></div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter">SUBMITTED</h3>
                    <p className="text-slate-600 font-medium text-lg max-w-md mx-auto">Application successful. Verification takes 2-4 hours.</p>
                    <button onClick={() => setView('home')} className="px-10 py-4 bg-slate-950 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-600 transition-all">Back to Home</button>
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
                      </div>
                    )}
                    {currentStep === 1 && (
                      <div className="space-y-8 animate-fadeIn">
                        <Input label="License Number" value={formData.licenseNumber} onChange={e => setFormData({...formData, licenseNumber: e.target.value})} required />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <FileUpload label="License (Front)" onChange={file => setFormData({...formData, licenseFront: file})} currentFile={formData.licenseFront} />
                           <FileUpload label="License (Back)" onChange={file => setFormData({...formData, licenseBack: file})} currentFile={formData.licenseBack} />
                        </div>
                      </div>
                    )}
                    {currentStep === 2 && (
                      <div className="space-y-8 animate-fadeIn">
                        <Select label="Rental Program" value={formData.rentalProgram} onChange={e => setFormData({...formData, rentalProgram: e.target.value as any})} options={[{value:'rent',label:'Standard Rental'},{value:'rent-to-own',label:'Rent-To-Own'}]} required />
                        <Select label="Target Platform" value={formData.targetPlatform} onChange={e => setFormData({...formData, targetPlatform: e.target.value as any})} options={[{value:'uber',label:'Uber'},{value:'lyft',label:'Lyft'}]} required />
                      </div>
                    )}
                    {currentStep === 3 && (
                      <div className="space-y-8 animate-fadeIn">
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

      <footer className="bg-slate-950 text-slate-500 py-16 px-6 border-t border-slate-900 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
            <div className="space-y-6">
                <img src={LOGO_URL} className="h-10 opacity-70" alt="DJ Logo" />
                <p className="text-sm font-medium text-slate-400 max-w-xs leading-relaxed">DJ Auto Rental San Antonio. Professional vehicle solutions for the gig economy.</p>
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
            <p>© 2025 DJ AUTO RENTAL SAN ANTONIO.</p>
            <div className="flex gap-8"><span>Privacy</span><span>Terms</span></div>
        </div>
      </footer>
    </div>
  );
}
