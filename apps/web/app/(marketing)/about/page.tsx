import type { Metadata } from 'next';
import {
  PageShell,
  Section,
  SplitSection,
  Card,
  CardGrid,
  FeatureCard,
  HighlightCard,
  CtaBand,
  TextLink,
} from '../../../components/marketing/PageShell';
import { JsonLd, breadcrumbs } from '../../../components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'About E-resi — Kenya’s Immersive Property Platform',
  description:
    'E-resi lets buyers, investors and tenants see property in Kenya before they visit — off-plan developments, '
    + 'homes for sale and rentals in cinematic film, 3D and VR — and gives developers and agents the media, '
    + 'websites and tools to sell and let them.',
  alternates: { canonical: '/about' },
  openGraph: {
    siteName: 'E-resi',
    title: 'About E-resi — See property in Kenya before you visit',
    description:
      'Off-plan developments, homes for sale and rentals you can walk through in film, 3D and VR, from verified '
      + 'developers and agents. Built in Nairobi.',
    url: '/about',
    type: 'website',
  },
};

const AUDIENCES: [string, string][] = [
  ['Buyers and investors', 'Compare off-plan developments and homes for sale across Kenya, walk through them in 3D or VR, check which units are still available and at what price, and deal directly with the developer or agent — from Nairobi or from abroad.'],
  ['Tenants', 'Browse apartments, houses and offices to rent, see how many units are still free, watch property reels, and call or WhatsApp the agent straight from the listing.'],
  ['Developers', 'Get your development filmed, scanned and published on a branded page, with your own domain if you want it, and run units, leads, viewings, reservations and your sales team from one dashboard.'],
  ['Agents and agencies', 'List homes for sale and to rent, publish your own agency website from ready-made templates, sell developers’ projects through mandates, and keep every lead credited to you.'],
];

const WAYS: [string, string][] = [
  ['Cinematic film', 'Edited films and drone footage that show a development, its views and its surroundings.'],
  ['3D walkthroughs', 'Interactive models you turn, zoom and step inside, room by room, in any browser.'],
  ['VR tours', 'The same spaces, headset-ready, for buyers who want to stand inside before they commit.'],
  ['360° tours', 'Panoramic room-by-room tours that open on any phone or computer.'],
  ['Live guided tours', 'A video walkthrough with the sales team, so questions get answered on the spot.'],
  ['Property reels', 'Short vertical videos from agents and developers, linked straight to the listing.'],
];

const ON_ERESI: [string, string][] = [
  ['Off-plan developments', 'Unit-by-unit availability with floor, size, price and status, plus floor plans, brochures and construction updates.'],
  ['Homes for sale', 'Apartments, villas, townhouses and commercial property, filterable by area, type and price.'],
  ['Rentals', 'Listings that show the units still available, real photos, amenities and the area — the exact address stays private until you ask.'],
  ['Area guides and the map', 'Neighbourhood guides for places like Kilimani, Westlands and Riverside, and a map of every development.'],
  ['Developers and agents', 'Public directories with verified profiles, their portfolios and how to reach them.'],
  ['Direct contact', 'Chat, call, WhatsApp, book a viewing or reserve a unit online, with no middleman in between.'],
];

const FAQ: [string, string][] = [
  ['Is e-resi free for buyers and tenants?', 'Yes. Browsing, tours, saving properties, chatting and booking viewings are free, and always will be.'],
  ['Does e-resi take a commission on sales?', 'No. Developers and agents pay for production and for being listed. We take no share of a sale or a commission, and charge no per-lead fees.'],
  ['Who checks the developers and agents?', 'We do, before they can list: a developer’s company, registration and directors; an agency’s registration documents, or an independent agent’s ID.'],
  ['Can I use e-resi from outside Kenya?', 'Yes. Most of what you need — tours, documents, chat and live guided tours — works from anywhere, which is why many of our buyers are in the diaspora.'],
];

export default function AboutPage() {
  return (
    <PageShell
      eyebrow="About e-resi"
      title="Property you can see before you visit."
      lede="e-resi is Kenya’s immersive property platform. Buyers, investors and tenants walk through off-plan developments, homes for sale and rentals in film, 3D and VR — and deal directly with the verified developers and agents behind them."
    >
      <JsonLd data={breadcrumbs([{ name: 'Home', path: '/' }, { name: 'About', path: '/about' }])} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      }} />

      <Section eyebrow="Why we exist" title="Nobody could walk the space.">
        <p>
          Much of what sells in Kenya is sold off-plan: a floor plan, an artist&apos;s render and a visit to a
          construction site have to carry a decision worth millions of shillings. A large share of buyers are not
          even in the country, deciding from Dubai, London or Atlanta on the strength of a WhatsApp video.
        </p>
        <p>
          Renting has the same problem in miniature — photos that flatter, addresses that turn out to be somewhere
          else, and agents who can&apos;t be reached. Everyone loses time: buyers and tenants on wasted visits,
          developers and agents on prospects who go quiet because they could not picture what was on offer.
        </p>
        <p>
          e-resi exists to close that gap. Every property should be something you can see properly, from anywhere,
          before you spend a shilling or an afternoon on it.
        </p>
      </Section>

      <Section eyebrow="Who it’s for" title="One platform, four kinds of people." prose={false}>
        <CardGrid cols={2}>
          {AUDIENCES.map(([t, b]) => <FeatureCard key={t} title={t}>{b}</FeatureCard>)}
        </CardGrid>
      </Section>

      <Section
        eyebrow="How you explore"
        title="Six ways to see a property."
        lede="Each listing carries whichever of these its developer or agent has produced, so you choose how closely you look."
        prose={false}
      >
        <CardGrid cols={3}>
          {WAYS.map(([t, b]) => <FeatureCard key={t} title={t}>{b}</FeatureCard>)}
        </CardGrid>
        <p className="mt-8 text-[17px] text-ink/70">
          Try it yourself in the <TextLink href="/3d-demo">360-3D demo</TextLink>.
        </p>
      </Section>

      <Section eyebrow="What’s on e-resi" title="Everything you need to decide." prose={false}>
        <CardGrid cols={2}>
          {ON_ERESI.map(([t, b]) => <FeatureCard key={t} title={t}>{b}</FeatureCard>)}
        </CardGrid>
      </Section>

      <SplitSection
        eyebrow="For developers and agents"
        title="The tools to sell and let, not just to list."
        lede="A listing is the start. e-resi also runs the work behind it."
      >
        <Card>
          <p className="text-[16px] leading-relaxed text-ink/70">
            <strong className="text-ink">Developers</strong> get a branded page for every development, on e-resi or
            on their own domain, and a dashboard for units and pricing, leads, viewings, reservations, documents,
            construction updates and their sales team, with access set page by page. See{' '}
            <TextLink href="/for-developers">e-resi for developers</TextLink>.
          </p>
        </Card>
        <Card>
          <p className="text-[16px] leading-relaxed text-ink/70">
            <strong className="text-ink">Agents</strong> publish their own agency website from our templates, list
            homes for sale and to rent, sell developers&apos; projects through mandates with published commission,
            post property reels, and see every enquiry, viewing and reservation credited to them. See{' '}
            <TextLink href="/for-agents">e-resi for agents</TextLink>.
          </p>
        </Card>
      </SplitSection>

      <SplitSection
        eyebrow="Production"
        title="We produce the media ourselves."
        lede="The tours are not something you commission elsewhere — our team shoots them."
      >
        <Card>
          <p className="text-[16px] leading-relaxed text-ink/70">
            Photography, videography, drone, twilight shoots, 3D scans, 360° tours, VR capture and cinematic
            walkthroughs are done by our own production team, on site. For developments that are still a hole in
            the ground, we build CGI from the architectural plans, then publish construction updates as the
            building rises.
          </p>
        </Card>
        <Card>
          <p className="text-[16px] leading-relaxed text-ink/70">
            Anyone can order it, not just developers: agents, landlords, investors and tenants included. Tell us
            what you need, where and when on our <TextLink href="/services">production services</TextLink> page,
            and you&apos;ll have a quote within an hour, payable by M-Pesa or card once you accept it.
          </p>
        </Card>
      </SplitSection>

      <Section eyebrow="How we’re paid" title="Professionals pay. Buyers and tenants never do." prose={false}>
        <CardGrid cols={3}>
          <HighlightCard>No commission on any sale or letting</HighlightCard>
          <HighlightCard>No per-lead fees</HighlightCard>
          <HighlightCard>Free for buyers and tenants, always</HighlightCard>
        </CardGrid>
        <p className="mt-8 max-w-[70ch] text-[17px] leading-relaxed text-ink/70">
          Developers pay for production and a listing fee while a development is live. Agents pay a flat monthly
          membership, with the first month free. Custom domains, premium website templates and property reels are
          optional extras, and production ordered on request is priced by quote. Full details are on the{' '}
          <TextLink href="/pricing">pricing page</TextLink>. Because nobody pays us per sale or per lead, we have no
          reason to push you toward one property over another.
        </p>
      </Section>

      <Section eyebrow="Trust" title="Verified before they can list.">
        <p>
          Every developer is checked before listing — company, registration and directors — and every agent too:
          registration documents for an agency, ID for an independent agent. Listings name who is behind them, and
          a rental&apos;s exact address stays private until you ask, so homes are not exposed to anyone browsing.
        </p>
        <p>
          Your contact details go to a developer or agent when you contact them, book a viewing or leave your number
          to see theirs. Our <TextLink href="/privacy">privacy policy</TextLink> sets out exactly what we collect, who
          else handles it and why.
        </p>
      </Section>

      <Section eyebrow="Questions" title="The short answers." prose={false}>
        <CardGrid cols={2}>
          {FAQ.map(([q, a]) => <FeatureCard key={q} title={q}>{a}</FeatureCard>)}
        </CardGrid>
        <p className="mt-8 text-[17px] text-ink/70">More in our <TextLink href="/faq">FAQ</TextLink>.</p>
      </Section>

      <Section eyebrow="Where we are" title="Built in Nairobi, Kenya.">
        <p>
          We are a Nairobi-based team working with developers and agents across Kenya, and with buyers and investors
          wherever they live. Questions, partnerships or press? <TextLink href="/contact">Talk to us</TextLink>.
        </p>
      </Section>

      <CtaBand
        title="See a property the way it should be seen."
        lede="Browse developments, homes for sale and rentals already live on e-resi, or list your own."
        primary={{ label: 'Browse properties', href: '/properties' }}
        secondary={{ label: 'Homes to rent', href: '/rent' }}
      />
    </PageShell>
  );
}
