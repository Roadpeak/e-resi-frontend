'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Form data shapes ─────────────────────────────────────────────────────────

export interface CompanyInfo {
  companyName: string;
  registrationNumber: string;
  taxPin: string;
  yearEstablished: string;
  companyType: string;
  website: string;
  logoName: string; // file name only — binary uploaded on submit
  contactName: string;
  contactTitle: string;
  contactEmail: string;
  contactPhone: string;
  contactWhatsapp: string;
  country: string;
  city: string;
  address: string;
  mapsUrl: string;
  shortDescription: string;
  longDescription: string;
  projectsCompleted: string;
  projectsUnderDevelopment: string;
  awards: string;
}

export type VerificationDocKey =
  | 'registrationCert'
  | 'taxCert'
  | 'directorId'
  | 'proofOfAddress'
  | 'companyLogo'
  | 'brandAssets';

export interface DevelopmentInfo {
  name: string;
  type: string;
  category: string;
  status: string;
  expectedCompletion: string;
  country: string;
  county: string;
  city: string;
  area: string;
  mapsPin: string;
  gpsCoordinates: string;
  numberOfUnits: string;
  unitTypes: string[];
  bedrooms: string;
  bathrooms: string;
  parking: string;
  amenities: string[];
  securityFeatures: string[];
  utilities: string[];
  startingPrice: string;
  priceRange: string;
  paymentPlans: string[];
  mortgageOptions: string;
  shortDescription: string;
  fullDescription: string;
}

export interface ServiceSelection {
  preferredDate: string;
  instructions: string;
  accessInfo: string;
}

export interface MediaState {
  hasOwnMedia: boolean;
  uploads: Record<string, string[]>; // kind -> file names
  /** serviceId -> per-service options; presence of key = selected */
  services: Record<string, ServiceSelection>;
}

export interface PreferencesState {
  visibility: 'public' | 'private' | 'invite_only';
  leadChannels: string[];
  appointments: 'self_managed' | 'platform_managed';
  workingDays: string[];
  workingHoursStart: string;
  workingHoursEnd: string;
  openHouse: boolean;
  bookingBufferMinutes: string;
}

// ── Store ────────────────────────────────────────────────────────────────────

export const TOTAL_STEPS = 9;

interface OnboardingState {
  step: number; // 0-indexed, 0..8
  company: CompanyInfo;
  verificationDocs: Record<VerificationDocKey, string>; // file names
  development: DevelopmentInfo;
  media: MediaState;
  preferences: PreferencesState;
  submitted: boolean;

  setStep: (step: number) => void;
  next: () => void;
  back: () => void;
  patchCompany: (patch: Partial<CompanyInfo>) => void;
  setVerificationDoc: (key: VerificationDocKey, fileName: string) => void;
  patchDevelopment: (patch: Partial<DevelopmentInfo>) => void;
  patchMedia: (patch: Partial<MediaState>) => void;
  toggleService: (id: string) => void;
  patchService: (id: string, patch: Partial<ServiceSelection>) => void;
  patchPreferences: (patch: Partial<PreferencesState>) => void;
  markSubmitted: () => void;
  reset: () => void;
}

const emptyCompany: CompanyInfo = {
  companyName: '', registrationNumber: '', taxPin: '', yearEstablished: '',
  companyType: '', website: '', logoName: '',
  contactName: '', contactTitle: '', contactEmail: '', contactPhone: '', contactWhatsapp: '',
  country: 'Kenya', city: '', address: '', mapsUrl: '',
  shortDescription: '', longDescription: '',
  projectsCompleted: '', projectsUnderDevelopment: '', awards: '',
};

const emptyDocs: Record<VerificationDocKey, string> = {
  registrationCert: '', taxCert: '', directorId: '',
  proofOfAddress: '', companyLogo: '', brandAssets: '',
};

const emptyDevelopment: DevelopmentInfo = {
  name: '', type: '', category: '', status: '', expectedCompletion: '',
  country: 'Kenya', county: '', city: '', area: '', mapsPin: '', gpsCoordinates: '',
  numberOfUnits: '', unitTypes: [], bedrooms: '', bathrooms: '', parking: '',
  amenities: [], securityFeatures: [], utilities: [],
  startingPrice: '', priceRange: '', paymentPlans: [], mortgageOptions: '',
  shortDescription: '', fullDescription: '',
};

const emptyMedia: MediaState = { hasOwnMedia: false, uploads: {}, services: {} };

const emptyPreferences: PreferencesState = {
  visibility: 'public',
  leadChannels: ['email'],
  appointments: 'platform_managed',
  workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  workingHoursStart: '09:00',
  workingHoursEnd: '17:00',
  openHouse: false,
  bookingBufferMinutes: '30',
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      step: 0,
      company: emptyCompany,
      verificationDocs: emptyDocs,
      development: emptyDevelopment,
      media: emptyMedia,
      preferences: emptyPreferences,
      submitted: false,

      setStep: (step) => set({ step: Math.max(0, Math.min(TOTAL_STEPS - 1, step)) }),
      next: () => get().setStep(get().step + 1),
      back: () => get().setStep(get().step - 1),
      patchCompany: (patch) => set({ company: { ...get().company, ...patch } }),
      setVerificationDoc: (key, fileName) =>
        set({ verificationDocs: { ...get().verificationDocs, [key]: fileName } }),
      patchDevelopment: (patch) => set({ development: { ...get().development, ...patch } }),
      patchMedia: (patch) => set({ media: { ...get().media, ...patch } }),
      toggleService: (id) => {
        const services = { ...get().media.services };
        if (services[id]) delete services[id];
        else services[id] = { preferredDate: '', instructions: '', accessInfo: '' };
        set({ media: { ...get().media, services } });
      },
      patchService: (id, patch) => {
        const existing = get().media.services[id];
        if (!existing) return;
        set({
          media: {
            ...get().media,
            services: { ...get().media.services, [id]: { ...existing, ...patch } },
          },
        });
      },
      patchPreferences: (patch) => set({ preferences: { ...get().preferences, ...patch } }),
      markSubmitted: () => set({ submitted: true }),
      reset: () =>
        set({
          step: 0, company: emptyCompany, verificationDocs: emptyDocs,
          development: emptyDevelopment, media: emptyMedia,
          preferences: emptyPreferences, submitted: false,
        }),
    }),
    { name: 'e-resi-onboarding' },
  ),
);
