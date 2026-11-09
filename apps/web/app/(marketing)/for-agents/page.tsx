import type { Metadata } from 'next';
import {
  BadgeCheck, BarChart3, Briefcase, Building2, CalendarCheck, Clapperboard, ClipboardList, Compass,
  FileText, FolderHeart, Globe, Glasses, Handshake, Home, Inbox, KeyRound, Layers, LayoutDashboard,
  LayoutTemplate, Link2, MapPin, MessageCircle, MousePointerClick, PenLine, Phone, Receipt, Search,
  Share2, Star, Store, Target, UserRound, Users, Video, Wallet,
} from 'lucide-react';
import { PropertiesNavbar } from '../../../components/marketplace/PropertiesNavbar';
import { AudiencePage, type AudienceGroup } from '../../../components/marketing/AudiencePage';
import { JsonLd, breadcrumbs } from '../../../components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'For Real Estate Agents in Kenya — Everything You Can Do on e-resi',
  description:
    'Your own agent website, listings for sale and to rent, developer mandates with published commission, '
    + 'leads credited to you, immersive tours, client rooms, a deals ledger and analytics. For agencies and independent agents in Kenya.',
  alternates: { canonical: '/for-agents' },
  openGraph: {
    siteName: 'E-resi',
    title: 'e-resi for Real Estate Agents in Kenya',
    description:
      'A website, listings, rentals, developer mandates, leads, tours and commission tracking — one platform for agents.',
    url: '/for-agents',
    type: 'website',
  },
};

/**
 * Everything an agent can do on e-resi, area by area — the full catalogue,
 * where /list-agency is the short sign-up pitch. Each item maps to a real
 * part of the agent dashboard.
 */
const GROUPS: AudienceGroup[] = [
  {
    id: 'website',
    label: 'Your website',
    title: 'Your own property website, ready in minutes.',
    intro: 'A professional site with your brand, your listings and your contact details — no developer or hosting to arrange.',
    items: [
      { icon: LayoutTemplate, title: 'Designed templates', body: 'Choose from a set of original templates and switch any time without losing content.' },
      { icon: Globe, title: 'Your web address', body: 'Go live on yourname.e-resi.com, or connect a domain you already own.' },
      { icon: PenLine, title: 'Edit your own content', body: 'Write your about page, services and headlines in the site content editor.' },
      { icon: Layers, title: 'Listings fill it automatically', body: 'Every sale and rental you list appears on your site as soon as it is published.' },
      { icon: CalendarCheck, title: 'Enquiries and viewings', body: 'Choose which forms the site shows and when visitors can book a viewing with you.' },
    ],
  },
  {
    id: 'listings',
    label: 'Listings',
    title: 'List properties you are selling.',
    intro: 'Bring your own instructions onto e-resi with the same tools developers use.',
    items: [
      { icon: Building2, title: 'Full property pages', body: 'Photos, video, floor plans, location, amenities and nearby places on one page.' },
      { icon: ClipboardList, title: 'Units and unit types', body: 'Describe each layout once with its price range and how many are available, reserved or sold.' },
      { icon: Clapperboard, title: 'Tours on every listing', body: 'Add cinematic, 3D and VR tours, and choose which tour shows against each unit type.' },
      { icon: LayoutTemplate, title: 'A page that looks the part', body: 'Pick a template and brand colours for each listing, and give it its own web address.' },
      { icon: BarChart3, title: 'Listing insights', body: 'Views, enquiries and viewing requests for each listing, day by day.' },
      { icon: FileText, title: 'Marketing authority on record', body: 'Confirm your mandate when you list, so buyers and developers know you are authorised.' },
    ],
  },
  {
    id: 'rentals',
    label: 'Rentals',
    title: 'Let homes and manage rentals for owners.',
    intro: 'List rentals alongside your sales, and take on lettings for unit owners.',
    items: [
      { icon: KeyRound, title: 'List rentals', body: 'Publish rentals you hold or that a developer has assigned to you, with unit types and monthly rent.' },
      { icon: Home, title: 'Owner lettings', body: 'Accept an owner’s invitation and the rental becomes yours to manage until the engagement ends.' },
      { icon: Inbox, title: 'Tenant leads to you', body: 'Enquiries, viewing requests and chats about your rentals come straight to you.' },
      { icon: MousePointerClick, title: 'Visits and taps', body: 'See how many people opened each rental, where they came from, and who tapped WhatsApp or call.' },
    ],
  },
  {
    id: 'inventory',
    label: 'Developer inventory',
    title: 'Sell verified developments.',
    intro: 'Developers on e-resi want agents to bring buyers, and they publish their terms up front.',
    items: [
      { icon: Store, title: 'Mandate pool', body: 'Browse developments open to agents with the commission stated. Request one and start selling once it is granted.' },
      { icon: Handshake, title: 'Developer partnerships', body: 'Partner with developers you already work with and get assigned to their developments.' },
      { icon: Briefcase, title: 'Partner listings', body: 'Every development you sell, with the commission that applies and units kept current by the developer.' },
      { icon: BadgeCheck, title: 'Verified developers only', body: 'Every developer is checked before their developments go live.' },
    ],
  },
  {
    id: 'leads',
    label: 'Leads',
    title: 'Every buyer and tenant you bring is credited to you.',
    intro: 'Share your link; whatever happens next is recorded against your name.',
    items: [
      { icon: Link2, title: 'Your personal links', body: 'Share any development with your referral attached, ready for WhatsApp in one tap.' },
      { icon: Target, title: 'One leads list', body: 'Enquiries, viewing requests and rental enquiries in one list, newest first, with call and WhatsApp buttons.' },
      { icon: MessageCircle, title: 'Messages', body: 'Chat with buyers and tenants inside e-resi; chats from your links reach you, not the developer.' },
      { icon: CalendarCheck, title: 'Viewings calendar', body: 'Every viewing request with its date and time, in one calendar.' },
      { icon: Phone, title: 'Contact taps tracked', body: 'Know when someone tapped to call or WhatsApp you from a listing.' },
    ],
  },
  {
    id: 'selling',
    label: 'Selling tools',
    title: 'Show buyers around without a site visit.',
    intro: 'Immersive tours do the first viewing for you, for local and diaspora buyers alike.',
    items: [
      { icon: Clapperboard, title: 'Cinematic tours', body: 'A film-style walkthrough of each development.' },
      { icon: Compass, title: '3D walkthroughs', body: 'Buyers explore room by room at their own pace.' },
      { icon: Glasses, title: 'VR tours', body: 'Headset-ready, for buyers who want to stand inside.' },
      { icon: Video, title: 'Live guided tours', body: 'Walk a client through a tour yourself on a video call.' },
      { icon: FolderHeart, title: 'Client rooms', body: 'A private shortlist for one buyer — a few developments, your note and one link.' },
      { icon: Search, title: 'Know what they liked', body: 'See which development your client kept returning to and lead with it on the call.' },
    ],
  },
  {
    id: 'commission',
    label: 'Commission',
    title: 'Commission you can track.',
    intro: 'No spreadsheets or WhatsApp threads to prove a sale was yours.',
    items: [
      { icon: Receipt, title: 'Rate agreed up front', body: 'The commission on a mandate or partnership is set before you start selling.' },
      { icon: Handshake, title: 'Deals ledger', body: 'Each deal records the client, unit, value and your commission, on one record you and the developer share.' },
      { icon: KeyRound, title: 'Reservation tracker', body: 'Follow each client’s reservation from deposit to keys, the same tracker the developer sees.' },
      { icon: Wallet, title: 'Paid as agreed', body: 'Commission is paid between you and the developer; e-resi takes no cut of it.' },
    ],
  },
  {
    id: 'profile',
    label: 'Profile',
    title: 'A public profile that wins you clients.',
    intro: 'Buyers and tenants browse agents on e-resi. Show them your track record.',
    items: [
      { icon: UserRound, title: 'Agent profile page', body: 'Your photo or logo, bio, areas, specialties and every listing you handle.' },
      { icon: Star, title: 'Genuine reviews', body: 'Only people who actually dealt with you can review you, and you cannot edit them.' },
      { icon: MapPin, title: 'Found by area', body: 'Appear when people look for agents in your areas and property types.' },
      { icon: Users, title: 'Agency or independent', body: 'Join as an agency or as an individual agent.' },
    ],
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    title: 'Run the business from one dashboard.',
    intro: 'On your phone or laptop, everything an agent juggles in one place.',
    items: [
      { icon: LayoutDashboard, title: 'Overview', body: 'Today’s viewings, new leads, your website status and a setup checklist on one screen.' },
      { icon: BarChart3, title: 'Analytics', body: 'Visits, leads and where they came from across all your listings.' },
      { icon: Share2, title: 'Share anywhere', body: 'Copy any listing link, with your referral, ready for WhatsApp, Instagram or email.' },
      { icon: Receipt, title: 'Simple billing', body: 'A flat monthly fee with your first month free, and support a message away.' },
    ],
  },
];

const STEPS = [
  { title: 'Sign up', body: 'Create an agency or individual agent account.' },
  { title: 'Get verified', body: 'We confirm who you are so developers and clients can trust you.' },
  { title: 'Set up your site', body: 'Pick a template, add your profile and go live on your own address.' },
  { title: 'List and share', body: 'Add your listings and rentals, take on mandates, and share your links.' },
];

const FAQS: [string, string][] = [
  ['What does it cost an agent?', 'A flat monthly fee, priced separately for agencies and independent agents, and your first month is free. A custom web address and some production services are optional extras — see the pricing page.'],
  ['Can I list my own properties, or only developers’ projects?', 'Both. List properties and rentals you hold yourself, and sell developments through mandates or partnerships with developers.'],
  ['Do I get my own website?', 'Yes. Every agent can publish a website from our templates on yourname.e-resi.com or on a domain you own (the pricing page lists any address fee). Your listings appear on it automatically.'],
  ['How are leads credited to me?', 'Through your personal links and your own listings. Visits, chats, enquiries, viewings and reservations from them are recorded against you automatically.'],
  ['Who pays my commission?', 'The developer or owner, directly, at the rate agreed on the mandate or partnership. e-resi records the deal so both sides see the same numbers, and takes no share of it.'],
  ['Can I manage rentals for landlords?', 'Yes. Owners can invite you to let their units; accept and the listing, its enquiries and its chats are yours until the engagement ends.'],
  ['Can I work with buyers abroad?', 'Yes. Immersive tours, live guided tours on video calls and client rooms let you sell without a site visit.'],
];

export default function ForAgentsPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f8]">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQS.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      }} />
      <JsonLd data={breadcrumbs([{ name: 'Home', path: '/' }, { name: 'For agents', path: '/for-agents' }])} />
      <PropertiesNavbar />
      <AudiencePage
        eyebrow="For real estate agents"
        title="Everything an agent needs, in one place."
        lede="Your own website, listings for sale and to rent, developer mandates with published commission, leads credited to you, immersive tours and a dashboard to run it all. For agencies and independent agents in Kenya."
        cta={{ label: 'Sign up as an agent', href: '/register?role=agent' }}
        secondary={{ label: 'See pricing', href: '/pricing' }}
        facts={[
          'First month free',
          'Your own website',
          'Sales and rentals',
          'No cut of your commission',
        ]}
        groups={GROUPS}
        steps={STEPS}
        faqs={FAQS}
        closing={{
          title: 'Your website, your listings, your leads.',
          lede: 'Sign up, get verified and publish your site today.',
        }}
      />
    </div>
  );
}
