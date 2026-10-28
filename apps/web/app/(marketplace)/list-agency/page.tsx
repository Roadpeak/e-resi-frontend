import type { Metadata } from 'next';
import {
  BadgeCheck, BarChart3, Briefcase, Building2, CalendarCheck, Clapperboard, Compass, FolderHeart,
  Glasses, Handshake, Home, Inbox, KeyRound, Link2, MapPin, MessageCircle, Receipt, Search,
  Share2, Star, Target, UserRound, Users, Video, Wallet,
} from 'lucide-react';
import { PropertiesNavbar } from '../../../components/marketplace/PropertiesNavbar';
import { AudiencePage, type AudienceGroup } from '../../../components/marketing/AudiencePage';

export const metadata: Metadata = {
  title: 'List Your Agency — Sell Developments on e-resi',
  description:
    'Sell verified developments with published commission, share links that credit every buyer to you, '
    + 'close with immersive tours and track your commission. For agencies and independent agents in Kenya.',
  alternates: { canonical: '/list-agency' },
};

const GROUPS: AudienceGroup[] = [
  {
    id: 'inventory',
    label: 'Inventory',
    title: 'Verified developments to sell, ready today.',
    intro: 'Stop chasing listings. Developers on e-resi are verified and want agents to bring buyers.',
    items: [
      { icon: Building2, title: 'Verified developers only', body: 'Every developer is checked before their developments go live.' },
      { icon: Receipt, title: 'Open mandates', body: 'Developers publish their commission rate up front. Accept and you can start selling.' },
      { icon: Handshake, title: 'Direct partnerships', body: 'Partner with developers you work with and get assigned to their developments.' },
      { icon: Briefcase, title: 'Your listings, one place', body: 'Every development you sell, with units, prices and availability kept current by the developer.' },
    ],
  },
  {
    id: 'credit',
    label: 'Get credited',
    title: 'Every buyer you bring is credited to you.',
    intro: 'Share your own link to any development you sell. Whatever happens next is tied to your name.',
    items: [
      { icon: Link2, title: 'Your personal link', body: 'Share a development link that carries your referral automatically.' },
      { icon: UserRound, title: 'Your name on the page', body: 'Buyers who open your link see you as their agent, with your contact.' },
      { icon: MessageCircle, title: 'Chats come to you', body: 'When your buyer taps chat, the conversation reaches you — not the developer.' },
      { icon: Target, title: 'Leads attributed', body: 'Inquiries, viewings and reservations from your buyers are recorded as yours.' },
      { icon: BarChart3, title: 'See who opened it', body: 'Know how many people opened your links, from where, and what they viewed.' },
    ],
  },
  {
    id: 'tours',
    label: 'Close faster',
    title: 'Show buyers around without the site visit.',
    intro: 'Immersive tours do the first viewing for you — locally or abroad.',
    items: [
      { icon: Clapperboard, title: 'Cinematic tours', body: 'A film-style walkthrough of each development.' },
      { icon: Compass, title: '3D walkthroughs', body: 'Buyers explore room by room at their own pace.' },
      { icon: Glasses, title: 'VR tours', body: 'Headset-ready, for buyers who want to stand inside.' },
      { icon: Video, title: 'Live guided tours', body: 'Walk clients through a tour yourself on a video call.' },
      { icon: FolderHeart, title: 'Client rooms', body: 'Pick a few developments for one buyer, add a note, and send a single private link.' },
      { icon: Search, title: 'Know what they liked', body: 'See which development your client kept returning to — and lead with it on the call.' },
    ],
  },
  {
    id: 'commission',
    label: 'Commission',
    title: 'Commission you can actually track.',
    intro: 'No more spreadsheets and WhatsApp threads to prove a sale was yours.',
    items: [
      { icon: Receipt, title: 'Rate agreed up front', body: 'The commission on a mandate is binding when you accept it.' },
      { icon: Handshake, title: 'Deals ledger', body: 'Each deal records the buyer, unit, value and your commission.' },
      { icon: BadgeCheck, title: 'Both sides see it', body: 'You and the developer work from the same record.' },
      { icon: Wallet, title: 'Your money, your terms', body: 'Commission is paid between you and the developer, as agreed.' },
    ],
  },
  {
    id: 'profile',
    label: 'Profile',
    title: 'A profile that wins you clients.',
    intro: 'Buyers browse agents on e-resi. Stand out with a real track record.',
    items: [
      { icon: UserRound, title: 'Public agent profile', body: 'Your photo or logo, bio, specialties and the developments you sell.' },
      { icon: Star, title: 'Genuine reviews', body: 'Only people who actually dealt with you can review you.' },
      { icon: MapPin, title: 'Found by area and specialty', body: 'Appear when buyers search for agents in your areas and property types.' },
      { icon: Users, title: 'Agency or independent', body: 'List as an agency or as an individual agent.' },
    ],
  },
  {
    id: 'lettings',
    label: 'Lettings',
    title: 'Manage rentals for owners.',
    intro: 'Unit owners can invite you to find tenants for them.',
    items: [
      { icon: KeyRound, title: 'Owner invitations', body: 'Accept an owner’s invitation and the rental listing becomes yours to manage.' },
      { icon: Inbox, title: 'Tenant leads to you', body: 'Inquiries and chats about that rental route straight to you.' },
      { icon: Home, title: 'Edit the listing', body: 'Update photos, price and availability until the engagement ends.' },
    ],
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    title: 'Run your whole business from one dashboard.',
    intro: 'Everything an agent juggles, in one place on your phone or laptop.',
    items: [
      { icon: Inbox, title: 'Inquiries and messages', body: 'Every buyer conversation in one inbox.' },
      { icon: CalendarCheck, title: 'Viewings and reservations', body: 'See what your buyers booked and reserved.' },
      { icon: Share2, title: 'Share in one tap', body: 'Copy any development link with your referral, ready for WhatsApp.' },
      { icon: Receipt, title: 'Simple billing', body: 'A flat monthly fee. Your first month is free.' },
    ],
  },
];

const STEPS = [
  { title: 'Sign up', body: 'Create your agency or individual agent account.' },
  { title: 'Get verified', body: 'We confirm who you are so developers can trust you.' },
  { title: 'Pick developments', body: 'Accept open mandates or partner with developers directly.' },
  { title: 'Share and earn', body: 'Send your links, close with tours, track your commission.' },
];

const FAQS: [string, string][] = [
  ['What does it cost?', 'A flat monthly fee, priced separately for agencies and independent agents. Your first month is free. See current prices on the pricing page.'],
  ['How do I get developments to sell?', 'Accept an open mandate — the developer has already published the commission — or partner with a developer directly.'],
  ['How do I prove a buyer is mine?', 'Share your own link. Visits, chats, inquiries, viewings and reservations from it are recorded against you automatically.'],
  ['Who pays my commission?', 'The developer, directly, at the rate on the mandate or partnership. e-resi records the deal so both sides see the same numbers.'],
  ['Can I work with buyers abroad?', 'Yes. Client rooms, immersive tours and live guided tours on video calls let you sell without a site visit.'],
  ['Can I list as an individual?', 'Yes. Choose agency or individual when you sign up — each has its own monthly fee.'],
];

export default function ListAgencyPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f8]">
      <PropertiesNavbar />
      <AudiencePage
        eyebrow="For agencies and agents"
        title="Sell verified developments. Get credit for every buyer."
        lede="Published commission, personal links that credit every lead to you, immersive tours to close faster and a dashboard to run it all — for agencies and independent agents."
        cta={{ label: 'Sign up as an agent', href: '/register?role=agent' }}
        secondary={{ label: 'Browse agents', href: '/agents' }}
        facts={[
          'First month free',
          'Commission published up front',
          'Leads credited to you automatically',
          'For agencies and independent agents',
        ]}
        groups={GROUPS}
        steps={STEPS}
        faqs={FAQS}
        closing={{
          title: 'More developments to sell. Proof of every sale.',
          lede: 'Sign up, get verified and start sharing your first development link today.',
        }}
      />
    </div>
  );
}
