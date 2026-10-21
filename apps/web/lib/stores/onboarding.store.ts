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
  logoName: string;
  /** Public URL of the uploaded logo — becomes the developer's profile logo. */
  logoUrl: string;
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

/** A document stored privately by the API — key is opaque, never a URL. */
export interface UploadedDoc {
  key: string;
  name: string;
  size?: number;
}

/** Prove the company exists with legal documents, or with public links. */
export type VerificationMethod = 'documents' | 'links';

export type VerificationLinkKey =
  | 'website' | 'facebook' | 'instagram' | 'linkedin' | 'x' | 'tiktok' | 'youtube' | 'other';

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
  verificationMethod: VerificationMethod;
  verificationDocs: Partial<Record<VerificationDocKey, UploadedDoc>>;
  verificationLinks: Partial<Record<VerificationLinkKey, string>>;
  preferences: PreferencesState;
  submitted: boolean;

  setStep: (step: number) => void;
  next: () => void;
  back: () => void;
  patchCompany: (patch: Partial<CompanyInfo>) => void;
  setVerificationMethod: (method: VerificationMethod) => void;
  setVerificationDoc: (key: VerificationDocKey, doc: UploadedDoc | null) => void;
  setVerificationLink: (key: VerificationLinkKey, url: string) => void;
  patchPreferences: (patch: Partial<PreferencesState>) => void;
  markSubmitted: () => void;
  reset: () => void;
}

const emptyCompany: CompanyInfo = {
  companyName: '', registrationNumber: '', taxPin: '', yearEstablished: '',
  companyType: '', website: '', logoName: '', logoUrl: '',
  contactName: '', contactTitle: '', contactEmail: '', contactPhone: '', contactWhatsapp: '',
  country: 'Kenya', city: '', address: '', mapsUrl: '',
  shortDescription: '', longDescription: '',
  projectsCompleted: '', projectsUnderDevelopment: '', awards: '',
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
      verificationMethod: 'documents',
      verificationDocs: {},
      verificationLinks: {},
      preferences: emptyPreferences,
      submitted: false,

      setStep: (step) => set({ step: Math.max(0, Math.min(TOTAL_STEPS - 1, step)) }),
      next: () => get().setStep(get().step + 1),
      back: () => get().setStep(get().step - 1),
      patchCompany: (patch) => set({ company: { ...get().company, ...patch } }),
      setVerificationMethod: (verificationMethod) => set({ verificationMethod }),
      setVerificationDoc: (key, doc) => {
        const docs = { ...get().verificationDocs };
        if (doc) docs[key] = doc;
        else delete docs[key];
        set({ verificationDocs: docs });
      },
      setVerificationLink: (key, url) =>
        set({ verificationLinks: { ...get().verificationLinks, [key]: url } }),
      patchPreferences: (patch) => set({ preferences: { ...get().preferences, ...patch } }),
      markSubmitted: () => set({ submitted: true }),
      reset: () =>
        set({
          step: 0, company: emptyCompany, verificationMethod: 'documents',
          verificationDocs: {}, verificationLinks: {},
          preferences: emptyPreferences, submitted: false,
        }),
    }),
    // v2: developer-signup flow — new key so stale drafts from the old
    // 9-step wizard (with development/media steps) don't corrupt state
    {
      name: 'e-resi-onboarding-v2',
      // v1 kept only file names for documents — nothing was ever uploaded —
      // so those entries are dropped and the developer picks the files again.
      // v2 does the same for the company logo, which was also name-only.
      version: 2,
      migrate: (persisted, version) => {
        const p = { ...((persisted ?? {}) as Record<string, unknown>) };
        if (version < 1) {
          Object.assign(p, { verificationMethod: 'documents', verificationDocs: {}, verificationLinks: {} });
        }
        if (version < 2) {
          const company = { ...((p.company ?? {}) as Record<string, unknown>) };
          if (!company.logoUrl) Object.assign(company, { logoName: '', logoUrl: '' });
          p.company = company;
        }
        return p as unknown as OnboardingState;
      },
    },
  ),
);
