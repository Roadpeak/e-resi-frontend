/** Data an agent website renders, as returned by GET /agent-site/:agentId. */

export interface AgentSiteListing {
  id: string; slug: string; name: string; tagline: string | null; heroImageUrl: string | null;
  city: string | null; neighborhood: string | null; category: string; status: string;
  priceFrom: number | null; priceTo: number | null; currency: string | null;
  has3DTour: boolean; hasVRTour: boolean; hasCinematicTour: boolean;
  developerName: string | null; units: number; kind: 'OWN' | 'PARTNER'; href: string;
}

export type SiteSectionId =
  | 'stats' | 'listings' | 'services' | 'packages' | 'process' | 'valuation' | 'calculator' | 'about' | 'team' | 'sold' | 'cases'
  | 'testimonials' | 'areas' | 'guides' | 'awards' | 'journal' | 'careers' | 'faq' | 'newsletter' | 'contact';
export type SiteSection = { id: SiteSectionId; visible: boolean };

export const SECTION_LABELS: Record<SiteSectionId, string> = {
  stats: 'Numbers',
  listings: 'Listings',
  services: 'Services',
  packages: 'Landlord packages',
  process: 'How it works',
  valuation: 'Free valuation',
  calculator: 'Mortgage calculator',
  about: 'About',
  team: 'Team',
  sold: 'Past sales',
  cases: 'Case studies',
  testimonials: 'Testimonials',
  areas: 'Areas you cover',
  guides: 'Area guides',
  awards: 'Awards',
  journal: 'Journal',
  careers: 'Careers',
  faq: 'FAQ',
  newsletter: 'Newsletter',
  contact: 'Contact',
};

export interface TeamMember { id: string; name: string; role?: string; photoUrl?: string; bio?: string; phone?: string; email?: string; years?: number; sales?: number; linkedin?: string }
export interface Testimonial { id: string; quote: string; author: string; context?: string; dealType?: 'BUYER' | 'SELLER' | 'TENANT' | 'LANDLORD' | 'INVESTOR'; rating?: number; photoUrl?: string; date?: string }
export interface PastSale { id: string; title: string; location?: string; outcome: 'SOLD' | 'LET'; price?: number; currency?: string; date?: string; imageUrl?: string; note?: string }
export interface Faq { id: string; question: string; answer: string }
export interface Service { id: string; title: string; description?: string; points?: string[]; imageUrl?: string }
export interface Step { id: string; title: string; description?: string; audience?: 'ALL' | 'BUYERS' | 'SELLERS' }
export interface Award { id: string; title: string; issuer?: string; year?: number }
export interface Role { id: string; title: string; location?: string; employment?: 'FULL_TIME' | 'PART_TIME' | 'COMMISSION' | 'CONTRACT' | 'INTERNSHIP'; description?: string; requirements?: string[] }
export interface AreaGuideSummary {
  id: string; slug: string; name: string; tagline?: string; coverUrl?: string; summary?: string; highlights?: string[];
  priceFrom?: number; rentFrom?: number; commute?: string; schools?: string[]; match?: string; hasPage: boolean;
}
export interface AreaGuide extends Omit<AreaGuideSummary, 'hasPage'> { body?: string }
export interface CaseStudy {
  id: string; title: string; clientType?: string; location?: string; coverUrl?: string;
  challenge?: string; approach?: string; result?: string; metrics?: string[]; quote?: string; date?: string;
}
export interface Package { id: string; name: string; fee: string; feeNote?: string; description?: string; points?: string[]; featured?: 'YES' | 'NO' }
export interface PostSummary { id: string; slug: string; title: string; category?: string; coverUrl?: string; excerpt?: string; publishedAt?: string; readMinutes: number }
export interface Post extends PostSummary { body: string }

export interface AgentSiteContent {
  team: TeamMember[]; testimonials: Testimonial[]; sold: PastSale[]; faqs: Faq[];
  services: Service[]; steps: Step[]; awards: Award[]; posts: PostSummary[]; roles?: Role[];
  guides?: AreaGuideSummary[]; cases?: CaseStudy[]; packages?: Package[];
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
  /** Which website forms are on. */
  forms?: SiteFormsPublic;
}

export interface SiteFormsPublic {
  contact: boolean; valuation: boolean; viewing: boolean; newsletter: boolean; careers: boolean;
  modes: ('IN_PERSON' | 'VIDEO')[]; slotMinutes: number;
  calculator?: boolean; mortgageRate?: number; depositPct?: number; termYears?: number;
}
