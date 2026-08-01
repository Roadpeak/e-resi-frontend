'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Form data shapes ─────────────────────────────────────────────────────────
//
// The onboarding wizard is the DEVELOPER SIGNUP flow: account creation happens
// on step 1, then company/KYB/preferences. Per-development data (details,
// media, production services) lives in lib/stores/development.store.ts and is
// collected when the developer adds a development from the dashboard.

export interface CompanyInfo {
  /** Set during account creation (register step) — not asked again. */
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

// Welcome, Account, Company, Verification, Preferences, Billing, Review, Done
export const TOTAL_STEPS = 8;

interface OnboardingState {
  step: number; // 0-indexed, 0..7
  company: CompanyInfo;
  verificationDocs: Record<VerificationDocKey, string>; // file names
  preferences: PreferencesState;
  submitted: boolean;

  setStep: (step: number) => void;
  next: () => void;
  back: () => void;
  patchCompany: (patch: Partial<CompanyInfo>) => void;
  setVerificationDoc: (key: VerificationDocKey, fileName: string) => void;
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
      preferences: emptyPreferences,
      submitted: false,

      setStep: (step) => set({ step: Math.max(0, Math.min(TOTAL_STEPS - 1, step)) }),
      next: () => get().setStep(get().step + 1),
      back: () => get().setStep(get().step - 1),
      patchCompany: (patch) => set({ company: { ...get().company, ...patch } }),
      setVerificationDoc: (key, fileName) =>
        set({ verificationDocs: { ...get().verificationDocs, [key]: fileName } }),
      patchPreferences: (patch) => set({ preferences: { ...get().preferences, ...patch } }),
      markSubmitted: () => set({ submitted: true }),
      reset: () =>
        set({
          step: 0, company: emptyCompany, verificationDocs: emptyDocs,
          preferences: emptyPreferences, submitted: false,
        }),
    }),
    // v2: developer-signup flow — new key so stale drafts from the old
    // 9-step wizard (with development/media steps) don't corrupt state
    { name: 'e-resi-onboarding-v2' },
  ),
);
