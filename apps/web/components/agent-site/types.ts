/** Data an agent website renders, as returned by GET /agent-site/:agentId. */

export interface AgentSiteListing {
  id: string; slug: string; name: string; tagline: string | null; heroImageUrl: string | null;
  city: string | null; neighborhood: string | null; category: string; status: string;
  priceFrom: number | null; priceTo: number | null; currency: string | null;
  has3DTour: boolean; hasVRTour: boolean; hasCinematicTour: boolean;
  developerName: string | null; units: number; kind: 'OWN' | 'PARTNER'; href: string;
}

export type SiteSectionId =
  | 'stats' | 'listings' | 'services' | 'process' | 'about' | 'team' | 'sold' | 'testimonials'
  | 'areas' | 'awards' | 'journal' | 'faq' | 'contact';
export type SiteSection = { id: SiteSectionId; visible: boolean };

export const SECTION_LABELS: Record<SiteSectionId, string> = {
  stats: 'Numbers',
  listings: 'Listings',
  services: 'Services',
  process: 'How it works',
  about: 'About',
  team: 'Team',
  sold: 'Past sales',
  testimonials: 'Testimonials',
  areas: 'Areas you cover',
  awards: 'Awards',
  journal: 'Journal',
  faq: 'FAQ',
  contact: 'Contact',
};

export interface TeamMember { id: string; name: string; role?: string; photoUrl?: string; bio?: string; phone?: string; email?: string; years?: number; sales?: number; linkedin?: string }
export interface Testimonial { id: string; quote: string; author: string; context?: string; dealType?: 'BUYER' | 'SELLER' | 'TENANT' | 'LANDLORD' | 'INVESTOR'; rating?: number; photoUrl?: string; date?: string }
export interface PastSale { id: string; title: string; location?: string; outcome: 'SOLD' | 'LET'; price?: number; currency?: string; date?: string; imageUrl?: string; note?: string }
export interface Faq { id: string; question: string; answer: string }
export interface Service { id: string; title: string; description?: string; points?: string[]; imageUrl?: string }
export interface Step { id: string; title: string; description?: string; audience?: 'ALL' | 'BUYERS' | 'SELLERS' }
export interface Award { id: string; title: string; issuer?: string; year?: number }
export interface PostSummary { id: string; slug: string; title: string; category?: string; coverUrl?: string; excerpt?: string; publishedAt?: string; readMinutes: number }
export interface Post extends PostSummary { body: string }

export interface AgentSiteContent {
  team: TeamMember[]; testimonials: Testimonial[]; sold: PastSale[]; faqs: Faq[];
  services: Service[]; steps: Step[]; awards: Award[]; posts: PostSummary[];
}

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
  content?: AgentSiteContent;
  legal?: { licenceNo: string | null; footerNote: string | null };
}
