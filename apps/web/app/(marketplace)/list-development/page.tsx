import type { Metadata } from 'next';
import {
  BadgeCheck, BarChart3, Boxes, Building2, CalendarCheck, Camera, Clapperboard, Compass, FileText,
  Footprints, Globe, Glasses, Handshake, Headset, Inbox, Layers, LayoutTemplate, Link2, MapPin,
  MessageCircle, Palette, PieChart, Plane, Receipt, Ruler, Share2, ShieldCheck, Smartphone,
  Tag, Target, Users, Video, Wallet,
} from 'lucide-react';
import { PropertiesNavbar } from '../../../components/marketplace/PropertiesNavbar';
import { AudiencePage, type AudienceGroup } from '../../../components/marketing/AudiencePage';

export const metadata: Metadata = {
  title: 'List Your Development — Sell Off-Plan on e-resi',
  description:
    'Sell your development before it is built. Immersive tours, your own branded website, every lead in '
    + 'one inbox, agents who bring buyers, and insights on every visitor. Free to sign up — no commission on sales.',
  alternates: { canonical: '/list-development' },
};

const GROUPS: AudienceGroup[] = [
  {
    id: 'sell-off-plan',
    label: 'Sell off-plan',
    title: 'Sell units before the first brick is laid.',
    intro: 'e-resi exists for one job above all: helping you sell a development while it is still drawings and renders.',
    items: [
      { icon: Ruler, title: 'List from plans', body: 'Publish with architectural drawings, renders and CGI — no finished building needed.' },
      { icon: Boxes, title: 'Every unit, tracked', body: 'Each unit with its floor, size, price and status. Mark them reserved or sold as they move.' },
      { icon: Tag, title: 'You decide how prices show', body: 'Show an exact price, "From KES…", a range, or hide it and ask buyers to enquire.' },
      { icon: CalendarCheck, title: 'Buyers reserve units', body: 'Serious buyers reserve a unit online, so you know who is ready before the call.' },
      { icon: Layers, title: 'Construction updates', body: 'Post progress as the building rises. Buyers see momentum instead of waiting in the dark.' },
      { icon: FileText, title: 'Share documents safely', body: 'Send sale agreements, brochures and payment plans to buyers inside e-resi, not over scattered emails.' },
      { icon: Wallet, title: 'Payments stay with you', body: 'Buyers pay you directly, the way you already work. e-resi never touches unit payments.' },
      { icon: Handshake, title: 'Deals in one place', body: 'Follow each sale from first interest to signed — with the agent and commission attached.' },
    ],
  },
  {
    id: 'tours',
    label: 'Immersive tours',
    title: 'Let buyers walk through it from anywhere.',
    intro: 'Most off-plan buyers never visit the site. Tours close that gap — on a phone, a laptop or a headset.',
    items: [
      { icon: Clapperboard, title: 'Cinematic tours', body: 'A film of the development that plays like a walkthrough, scene by scene.' },
      { icon: Compass, title: '3D walkthroughs', body: 'Buyers move room to room at their own pace and look around freely.' },
      { icon: Glasses, title: 'VR, headset-ready', body: 'The same spaces in full virtual reality for buyers who want to stand inside them.' },
      { icon: Video, title: 'Live guided tours on calls', body: 'Walk a buyer through the tour yourself on a video meeting — perfect for diaspora buyers.' },
      { icon: Layers, title: 'Tours per unit type', body: 'A studio shows studio rooms, a penthouse shows penthouse rooms.' },
      { icon: Camera, title: 'Upload your own media', body: 'Add your gallery, floor plans and existing videos yourself, any time.' },
      { icon: Clapperboard, title: 'Or we produce it', body: 'Our team shoots photography, drone, twilight, 3D scans, VR and CGI — paid once, per development.' },
      { icon: Smartphone, title: 'Works on any phone', body: 'Everything opens in the browser. Buyers install nothing.' },
    ],
  },
  {
    id: 'leads',
    label: 'Leads',
    title: 'Every interested buyer, in one inbox.',
    intro: 'Leads are the point. Nothing gets lost between WhatsApp, email and a sales rep’s phone.',
    items: [
      { icon: Inbox, title: 'Inquiries in one place', body: 'Every question from every buyer, with their details and the unit they asked about.' },
      { icon: CalendarCheck, title: 'Viewing requests', body: 'Buyers book site visits or virtual viewings in the days and hours you set.' },
      { icon: MessageCircle, title: 'Chat with buyers', body: 'Buyers message you straight from your page; you reply from the dashboard.' },
      { icon: Target, title: 'Know who sent them', body: 'Each lead shows whether it came from your link, an agent, Google or social media.' },
      { icon: Users, title: 'Agent leads, credited', body: 'Buyers who arrive through an agent’s link are credited to that agent automatically.' },
      { icon: BadgeCheck, title: 'Instant alerts', body: 'New leads reach you by email and in-app, so nobody waits for an answer.' },
    ],
  },
  {
    id: 'website',
    label: 'Your website',
    title: 'Every development gets its own website.',
    intro: 'Copy one link and share it anywhere. It opens a full website for the development — in your colours, your style.',
    items: [
      { icon: LayoutTemplate, title: 'Eight designer templates', body: 'Pick a look, then change it whenever you like.' },
      { icon: Palette, title: 'Your colours and fonts', body: 'Set your brand colour, typeface, navbar style and the wording of each section.' },
      { icon: Share2, title: 'Made for WhatsApp', body: 'Shared links show your development’s photo and name in the preview, not ours.' },
      { icon: Link2, title: 'Your own e-resi address', body: 'A short address like herisresidence.e-resi.com, easy to say and share.' },
      { icon: Globe, title: 'Or your own domain', body: 'Put the site on herisresidence.co.ke. We handle the setup and security certificate.' },
      { icon: ShieldCheck, title: 'White-label option', body: 'Remove e-resi branding from your site entirely — ask us to switch it on.' },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    title: 'See exactly who is interested.',
    intro: 'Every visit is counted — signed in or not — on every address your development uses.',
    items: [
      { icon: BarChart3, title: 'Views and visitors', body: 'Page views, unique visitors, new versus returning, day by day.' },
      { icon: MapPin, title: 'Where buyers are', body: 'Countries and cities — see how many are in Nairobi, Dubai or London.' },
      { icon: Smartphone, title: 'Devices and browsers', body: 'Phone, laptop or tablet; Chrome, Safari and more.' },
      { icon: Share2, title: 'Where they came from', body: 'WhatsApp, Facebook, Instagram, Google, or links your agents shared.' },
      { icon: Footprints, title: 'What they looked at', body: 'Which tours they started and finished, and which units they kept returning to.' },
      { icon: PieChart, title: 'Your sales funnel', body: 'From view to inquiry to viewing to reservation — and where people drop off.' },
    ],
  },
  {
    id: 'team',
    label: 'Team & agents',
    title: 'Run your sales team and agents together.',
    intro: 'One dashboard for your developments, your staff and every agent selling for you.',
    items: [
      { icon: Building2, title: 'All developments, one dashboard', body: 'Manage every project, unit and listing from a single place.' },
      { icon: Users, title: 'Staff accounts', body: 'Invite your team and choose exactly which pages each person can see.' },
      { icon: Handshake, title: 'Partner with agents', body: 'Approve the agents you trust to sell your developments.' },
      { icon: Receipt, title: 'Publish your commission', body: 'Open a mandate with your commission rate and every verified agent can bring buyers.' },
      { icon: Target, title: 'See each agent’s results', body: 'Visits, leads and deals each agent brought — so you know who performs.' },
      { icon: BadgeCheck, title: 'Commission without arguments', body: 'Every deal records the agent and commission both sides agreed to.' },
    ],
  },
  {
    id: 'reach',
    label: 'Reach',
    title: 'Reach buyers in Kenya and abroad.',
    intro: 'Your development is listed where buyers already search — and travels wherever your link goes.',
    items: [
      { icon: Globe, title: 'The e-resi marketplace', body: 'Buyers browse by city, neighbourhood, price and tour type.' },
      { icon: MapPin, title: 'Neighbourhood pages', body: 'Your development appears on the pages for its area automatically.' },
      { icon: Plane, title: 'Diaspora-ready', body: 'Tours, documents and chat let someone abroad buy without flying in.' },
      { icon: Headset, title: 'Agents abroad', body: 'Agents curate your units into private client rooms for buyers overseas.' },
    ],
  },
  {
    id: 'pricing',
    label: 'Pricing',
    title: 'Simple, honest pricing.',
    intro: 'You pay for what is live — never a cut of your sales.',
    items: [
      { icon: BadgeCheck, title: 'Free to sign up', body: 'Creating and verifying your account costs nothing.' },
      { icon: Receipt, title: 'Listing fee per live development', body: 'A flat monthly fee for each development that is live. Your first month is free.' },
      { icon: Clapperboard, title: 'Production is optional', body: 'Photography, video, 3D and VR are one-time costs you choose per development.' },
      { icon: Wallet, title: 'No commission', body: 'Whatever a unit sells for, the full price is yours.' },
    ],
  },
];

const STEPS = [
  { title: 'Sign up free', body: 'Create your developer account in a couple of minutes.' },
  { title: 'Get verified', body: 'Upload company documents — or just your website and social links.' },
  { title: 'Add your development', body: 'Details, units, floor plans and media. Order production if you want it.' },
  { title: 'Go live and share', body: 'Once approved, share your link and watch the leads arrive.' },
];

const FAQS: [string, string][] = [
  ['Can I list a development that hasn’t been built?', 'Yes — that is what e-resi is built for. List from plans, renders and CGI, and post construction updates as it goes up.'],
  ['Do buyers pay through e-resi?', 'No. Unit payments go directly between you and the buyer, as they do today. e-resi handles leads, tours, documents and the sale process around them.'],
  ['What does it cost?', 'Signing up is free. You pay a flat monthly listing fee for each live development (the first month is free), plus any production services you choose. No commission on sales.'],
  ['How long does verification take?', 'Usually about one working day. You can verify with company documents, or simply with your website and social media links.'],
  ['Do I need my own photos and videos?', 'No. Upload what you have, or let our production team capture photography, drone footage, 3D scans, VR and CGI.'],
  ['Can agents sell my development?', 'Yes. Partner with agents or publish a mandate with your commission rate. Leads they bring are credited to them automatically.'],
  ['Can the page use my own domain?', 'Yes. Get a short e-resi address or connect your own domain from the dashboard — we handle the technical setup.'],
  ['Can my sales team use one account?', 'Yes. Invite staff and choose which parts of the dashboard each person can open.'],
];

export default function ListDevelopmentPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f8]">
      <PropertiesNavbar />
      <AudiencePage
        eyebrow="For property developers"
        title="Sell your development before it’s even built."
        lede="Immersive tours, a website for every development, every lead in one inbox, agents who bring buyers, and insight into every visitor — all in one platform. Free to sign up."
        cta={{ label: 'Sign up as a developer', href: '/register?role=developer' }}
        secondary={{ label: 'See pricing', href: '/pricing' }}
        facts={[
          'Free to sign up',
          'Pay only when a development is live',
          'No commission on your sales',
          'Verified in about a working day',
        ]}
        groups={GROUPS}
        steps={STEPS}
        faqs={FAQS}
        closing={{
          title: 'Your next buyer may already be looking.',
          lede: 'Sign up free, verify your company and put your first development in front of buyers in Kenya and abroad.',
        }}
      />
    </div>
  );
}
