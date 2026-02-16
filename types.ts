
export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  phone: string;
  role: 'user' | 'admin';
  createdAt: any;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  source: string;
  createdAt: any;
}

export interface Vehicle {
  id: string;
  name: string;
  vin: string;
  status: 'available' | 'rented' | 'maintenance';
  assignedTo?: string;
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'contacted';
export type RidesharePlatform = 'uber' | 'lyft' | 'doordash' | 'ubereats' | 'amazon' | 'other';
export type VerificationStatus = 'unverified' | 'checking' | 'verified' | 'flagged';

export interface FormData {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  source: string;
  fullName: string;
  dob: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  emergencyName: string;
  emergencyPhone: string;
  proofOfAddress?: File | null;
  proofOfIncome?: File | null;
  licenseNumber: string;
  licenseState: string;
  licenseExpiration: string;
  licenseFront?: File | null;
  licenseBack?: File | null;
  selfie?: File | null;
  verificationStatus: VerificationStatus;
  verificationNotes: string;
  carRequested: string;
  vin: string;
  rentalProgram: 'rent' | 'rent-to-own' | '';
  startDate: string;
  endDate: string;
  targetPlatform: RidesharePlatform | '';
  usageType: 'personal' | 'work' | 'rideshare' | 'delivery' | '';
  hasInsurance: 'yes' | 'no' | '';
  insuranceCompany: string;
  policyNumber: string;
  insuranceAgreement: boolean;
  paymentMethod: 'cash' | 'zelle' | 'debit' | '';
  depositAgreement: boolean;
  historyAccidents: 'yes' | 'no' | '';
  historyDUI: 'yes' | 'no' | '';
  historySuspension: 'yes' | 'no' | '';
  screeningConsent: boolean;
  ruleSmoking: boolean;
  ruleRacing: boolean;
  ruleCrossing: boolean;
  ruleSubRent: boolean;
  ruleMileage: boolean;
  ruleFuel: boolean;
  ruleReport: boolean;
  signatureName: string;
  signatureImage?: string | null;
  signatureDate: string;
  finalConsent: boolean;
}

export const INITIAL_DATA: FormData = {
  id: '',
  status: 'pending',
  createdAt: new Date().toISOString(),
  source: 'organic',
  fullName: '',
  dob: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  emergencyName: '',
  emergencyPhone: '',
  proofOfAddress: null,
  proofOfIncome: null,
  licenseNumber: '',
  licenseState: '',
  licenseExpiration: '',
  licenseFront: null,
  licenseBack: null,
  selfie: null,
  verificationStatus: 'unverified',
  verificationNotes: '',
  carRequested: '',
  vin: '',
  rentalProgram: '',
  startDate: '',
  endDate: '',
  targetPlatform: '',
  usageType: '',
  hasInsurance: '',
  insuranceCompany: '',
  policyNumber: '',
  insuranceAgreement: false,
  paymentMethod: '',
  depositAgreement: false,
  historyAccidents: '',
  historyDUI: '',
  historySuspension: '',
  screeningConsent: false,
  ruleSmoking: false,
  ruleRacing: false,
  ruleCrossing: false,
  ruleSubRent: false,
  ruleMileage: false,
  ruleFuel: false,
  ruleReport: false,
  signatureName: '',
  signatureImage: null,
  signatureDate: new Date().toISOString().split('T')[0],
  finalConsent: false,
};
