'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Development-creation wizard state ────────────────────────────────────────
//
// A developer can list many developments; each one goes through this wizard
// (dashboard → Add development): details → media & production services →
// review & costs. Each submitted development incurs the fixed listing fee.

export interface DevelopmentInfo {
  name: string;
  heroImageUrl: string;
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

interface DevelopmentState {
  step: number; // 0..2: Details, Media & Services, Review
  development: DevelopmentInfo;
  media: MediaState;

  setStep: (step: number) => void;
  next: () => void;
  back: () => void;
  patchDevelopment: (patch: Partial<DevelopmentInfo>) => void;
  patchMedia: (patch: Partial<MediaState>) => void;
  toggleService: (id: string) => void;
  patchService: (id: string, patch: Partial<ServiceSelection>) => void;
  reset: () => void;
}

export const DEV_TOTAL_STEPS = 3;

const emptyDevelopment: DevelopmentInfo = {
  name: '', heroImageUrl: '', type: '', category: '', status: '', expectedCompletion: '',
  country: 'Kenya', county: '', city: '', area: '', mapsPin: '', gpsCoordinates: '',
  numberOfUnits: '', unitTypes: [], bedrooms: '', bathrooms: '', parking: '',
  amenities: [], securityFeatures: [], utilities: [],
  startingPrice: '', priceRange: '', paymentPlans: [], mortgageOptions: '',
  shortDescription: '', fullDescription: '',
};

const emptyMedia: MediaState = { hasOwnMedia: false, uploads: {}, services: {} };

export const useDevelopmentStore = create<DevelopmentState>()(
  persist(
    (set, get) => ({
      step: 0,
      development: emptyDevelopment,
      media: emptyMedia,

      setStep: (step) => set({ step: Math.max(0, Math.min(DEV_TOTAL_STEPS - 1, step)) }),
      next: () => get().setStep(get().step + 1),
      back: () => get().setStep(get().step - 1),
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
      reset: () => set({ step: 0, development: emptyDevelopment, media: emptyMedia }),
    }),
    { name: 'e-resi-development-draft' },
  ),
);
