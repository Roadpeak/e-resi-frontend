/** Data an agent website renders, as returned by GET /agent-site/:agentId. */

export interface AgentSiteListing {
  id: string; slug: string; name: string; tagline: string | null; heroImageUrl: string | null;
  city: string | null; neighborhood: string | null; category: string; status: string;
  priceFrom: number | null; priceTo: number | null; currency: string | null;
  has3DTour: boolean; hasVRTour: boolean; hasCinematicTour: boolean;
  developerName: string | null; units: number; kind: 'OWN' | 'PARTNER'; href: string;
}

export type SiteSectionId = 'stats' | 'listings' | 'about' | 'areas' | 'contact';
export type SiteSection = { id: SiteSectionId; visible: boolean };

export const SECTION_LABELS: Record<SiteSectionId, string> = {
  stats: 'Numbers',
  listings: 'Listings',
  about: 'About',
  areas: 'Areas you cover',
  contact: 'Contact',
};

export interface AgentSiteStats {
  listings: number; own: number; partnered: number; units: number;
  cities: number; withTours: number; onPlatformSince: number;
}

export interface AgentSiteData {
  url: string | null;
  /** Template key the site renders (CLASSIC when unset or not unlocked). */
  template?: string;
  sections?: SiteSection[];
  stats?: AgentSiteStats;
  agent: {
    id: string; kind: 'COMPANY' | 'INDIVIDUAL'; displayName: string; logoUrl: string | null; photoUrl: string | null;
    bio: string | null; yearsExperience: number | null; specialties: string[]; serviceAreas: string[];
    phone: string | null; whatsapp: string | null; email: string | null; officeAddress: string | null;
    socials: Record<string, string> | null; ratingAverage: number | null; ratingCount: number; dealsCompleted: number;
    siteTagline: string | null; siteAccent: string | null; siteHeroUrl: string | null;
  };
  listings: AgentSiteListing[];
}
