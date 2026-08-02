/**
 * Onboarding service catalog — individual à-la-carte services (no packages).
 * Prices are one-time production fees in USD unless noted.
 */

export type ServiceCategory = 'capture' | 'immersive' | 'marketing' | 'design';

export interface ServiceDefinition {
  id: string;
  label: string;
  category: ServiceCategory;
  price: number;
  unit?: string;
  description: string;
}

/**
 * Fallback pricing, used until the admin-managed catalogue loads.
 * `applyCatalogOverrides` replaces these at runtime — see useCatalog().
 */
export let LISTING_FEE_MONTHLY = 49;

export const SERVICE_CATEGORIES: Record<ServiceCategory, string> = {
  capture: 'Photography & Film',
  immersive: 'Immersive & 3D',
  marketing: 'Marketing Content',
  design: 'Design & Branding',
};

export let SERVICES: ServiceDefinition[] = [
  // ── Photography & Film ──────────────────────────────────────────────
  { id: 'photography', label: 'Professional Photography', category: 'capture', price: 850, description: 'Full interior & exterior stills shoot, edited and colour-graded.' },
  { id: 'videography', label: 'Professional Videography', category: 'capture', price: 1200, description: 'Ground-level cinematic filming of the development.' },
  { id: 'drone_photo', label: 'Drone Photography', category: 'capture', price: 400, description: 'Aerial stills showing the site, views and surroundings.' },
  { id: 'drone_video', label: 'Drone Cinematic Video', category: 'capture', price: 700, description: 'Aerial cinematic sequences, edited to music.' },
  { id: 'twilight', label: 'Twilight Photography', category: 'capture', price: 450, description: 'Golden-hour and dusk shots for hero imagery.' },

  // ── Immersive & 3D ─────────────────────────────────────────────────
  { id: 'scan_3d', label: '3D Property Scan', category: 'immersive', price: 2500, description: 'LiDAR / Matterport capture of built units.' },
  { id: 'vr_tour', label: 'Virtual Reality Tour', category: 'immersive', price: 3800, description: 'Headset-ready immersive walkthrough experience.' },
  { id: 'tour_360', label: '360° Tour', category: 'immersive', price: 1500, description: 'Browser-based 360° panorama tour.' },
  { id: 'walkthrough', label: 'Cinematic Walkthrough Video', category: 'immersive', price: 1800, description: 'Steadicam interior walkthrough, cinematic edit.' },
  { id: 'cgi', label: 'CGI / Architectural Visualization', category: 'immersive', price: 2200, description: 'Photoreal renders for off-plan developments.' },
  { id: 'site_mapping', label: 'Site Mapping', category: 'immersive', price: 800, description: 'Orthomosaic site map with plotted unit locations.' },

  // ── Marketing Content ──────────────────────────────────────────────
  { id: 'social_promo', label: 'Social Media Promo Videos', category: 'marketing', price: 600, description: 'Short-form vertical cuts for Instagram, TikTok & Facebook.' },
  { id: 'teaser', label: 'Property Teaser Videos', category: 'marketing', price: 500, description: '15–30s teaser edits to drive launch interest.' },
  { id: 'youtube', label: 'YouTube Showcase Video', category: 'marketing', price: 900, description: 'Long-form presented showcase for your channel.' },
  { id: 'agent_intro', label: 'Agent Introduction Video', category: 'marketing', price: 350, description: 'A presented piece introducing your sales team.' },
  { id: 'voiceover', label: 'Voice-over Production', category: 'marketing', price: 250, description: 'Professional narration for any selected video.' },
  { id: 'reels', label: 'Property Reels', category: 'marketing', price: 400, description: 'A monthly set of ready-to-post reels.' },
  { id: 'interior_styling', label: 'Interior Styling', category: 'marketing', price: 950, description: 'Show-home styling / virtual staging before capture.' },

  // ── Design & Branding ──────────────────────────────────────────────
  { id: 'brochure', label: 'Digital Brochure Design', category: 'design', price: 300, description: 'Interactive PDF brochure for buyers and agents.' },
  { id: 'floorplan_redesign', label: 'Floor Plan Redesign', category: 'design', price: 350, description: 'Your floor plans redrawn in the e-resi house style.' },
  { id: 'branding', label: 'Branding Assets', category: 'design', price: 650, description: 'Logo refinement, palette and social templates for the development.' },
];

export const serviceById = (id: string) => SERVICES.find((s) => s.id === id);

/** Categories that count as "production" vs "marketing" on the billing screen. */
export const PRODUCTION_CATEGORIES: ServiceCategory[] = ['capture', 'immersive'];
export const MARKETING_CATEGORIES: ServiceCategory[] = ['marketing', 'design'];

export interface BillingBreakdown {
  listingFeeMonthly: number;
  production: ServiceDefinition[];
  marketing: ServiceDefinition[];
  productionTotal: number;
  marketingTotal: number;
  oneTimeTotal: number;
}

export function computeBilling(selectedIds: string[]): BillingBreakdown {
  const selected = selectedIds
    .map(serviceById)
    .filter((s): s is ServiceDefinition => Boolean(s));
  const production = selected.filter((s) => PRODUCTION_CATEGORIES.includes(s.category));
  const marketing = selected.filter((s) => MARKETING_CATEGORIES.includes(s.category));
  const productionTotal = production.reduce((sum, s) => sum + s.price, 0);
  const marketingTotal = marketing.reduce((sum, s) => sum + s.price, 0);
  return {
    listingFeeMonthly: LISTING_FEE_MONTHLY,
    production,
    marketing,
    productionTotal,
    marketingTotal,
    oneTimeTotal: productionTotal + marketingTotal,
  };
}

export const fmtUsd = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

/**
 * Patch the fallback constants with admin-managed values.
 *
 * Mutating module state is deliberate: six screens already read SERVICES and
 * LISTING_FEE_MONTHLY synchronously, and this lets them all reflect admin
 * pricing without each becoming async. Called only by useCatalog().
 */
export function applyCatalogOverrides(services: ServiceDefinition[], listingFee: number): void {
  if (services.length > 0) SERVICES = services;
  if (Number.isFinite(listingFee)) LISTING_FEE_MONTHLY = listingFee;
}
