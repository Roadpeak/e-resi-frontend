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
} from '../../../components/marketing/PageShell';

export const metadata: Metadata = {
  title: 'About E-resi — Built for Kenyan Property Developers',
  description:
    'E-resi is built for Kenyan developers selling off-plan — cinematic, 3D and VR tours and a '
    + 'branded page, so buyers walk a home before it exists.',
  alternates: { canonical: '/about' },
  openGraph: {
    siteName: 'E-resi',
    title: 'About E-resi — Immersive Marketing for Kenyan Property Developers',
    description:
      'Production, a branded development mini-site and a sales dashboard for developers '
      + 'selling off-plan in Kenya — with cinematic, 3D and VR tours buyers can walk from '
      + 'anywhere.',
    url: '/about',
    type: 'website',
  },
};

const MODES = [
  { value: 'Cinematic', label: 'Scroll-driven films of every development' },
  { value: '3D', label: 'Interactive walkthroughs, room by room' },
  { value: 'VR', label: 'Headset-ready tours for serious buyers' },
];

const MACHINERY = [
  ['Unit-level availability', 'Every unit with its floor number, size, price and current status.'],
  ['Floor plans and pricing', 'Published against each layout, so a studio and a penthouse show their own.'],
  ['Reservations and viewings', 'Buyers reserve a unit online or book a time to see it in person.'],
  ['Direct chat', 'Buyers talk to the developer’s team without leaving the page.'],
];

export default function AboutPage() {
  return (
    <PageShell
      eyebrow="About"
      title="Selling a building that doesn't exist yet shouldn't be this hard."
      lede="e-resi is an immersive property platform built for Kenyan developers — in a market where much of what sells is sold off-plan, to buyers who are somewhere else entirely."
    >
      <Section eyebrow="The problem" title="Nobody can walk the space.">
        <p>
          A Kenyan developer is usually selling something nobody can stand inside yet.
          The sales material is a floor plan, an artist&apos;s render and a site visit to
          a construction site — and that has to carry a decision worth millions of
          shillings. Meanwhile a serious share of the buyers are in the diaspora,
          deciding from Dubai, London or Atlanta on the strength of a WhatsApp video
          and a phone call.
        </p>
        <p>
          The cost of that lands on the developer: long sales cycles, the same site
          visit repeated for every prospect, and genuinely interested buyers who go
          quiet because they could not picture what they were buying. The buyer&apos;s
          problem and the developer&apos;s problem are the same problem — nobody can walk
          the space — and it is the developer who pays for it in unsold units.
        </p>
      </Section>

      <Section
        eyebrow="What we built"
        title="Three ways to experience a development."
        lede="Every development gets its own branded page carrying all three, so a buyer can choose how closely they want to look."
        prose={false}
      >
        <CardGrid cols={3}>
          {MODES.map((m) => (
            <Card key={m.value} accent>
              <p className="text-[28px] font-semibold tracking-tight text-ink">{m.value}</p>
              <p className="mt-2 text-[16px] leading-relaxed text-ink/60">{m.label}</p>
            </Card>
          ))}
        </CardGrid>
      </Section>

      <Section
        eyebrow="Underneath"
        title="The practical machinery that runs the sale."
        prose={false}
      >
        <CardGrid cols={2}>
          {MACHINERY.map(([title, body]) => (
            <FeatureCard key={title} title={title}>
              {body}
            </FeatureCard>
          ))}
        </CardGrid>
      </Section>

      <SplitSection
        eyebrow="Production"
        title="We produce the media ourselves."
        lede="The tours are not something you have to go and commission elsewhere — our team shoots them."
      >
        <Card>
          <p className="text-[16px] leading-relaxed text-ink/70">
            Photography, drone, twilight shoots, 3D scanning and VR capture are all done
            by our production team, on site. For developments that are still holes in the
            ground, we build CGI walkthroughs from the architectural plans instead, then
            publish construction updates as the building actually goes up.
          </p>
        </Card>
        <Card>
          <p className="text-[16px] leading-relaxed text-ink/70">
            That matters because the quality of the tour is the product. A development
            that looks like a film gets taken seriously; the same development shot on a
            phone does not. Keeping production in-house is how we hold that line.
          </p>
        </Card>
      </SplitSection>

      <Section
        eyebrow="How we're paid"
        title="Developers pay. Buyers never do."
        prose={false}
      >
        <CardGrid cols={3}>
          <HighlightCard>No commission on any sale</HighlightCard>
          <HighlightCard>No per-lead fees</HighlightCard>
          <HighlightCard>Free for buyers, always</HighlightCard>
        </CardGrid>
        <p className="mt-8 max-w-[70ch] text-[17px] leading-relaxed text-ink/70">
          We charge developers for production once per development, and a flat monthly
          fee while a development is live. That is the whole model — which means we have
          no incentive to push a buyer toward one property over another.
        </p>
      </Section>

      <Section eyebrow="Where we are" title="Nairobi, Kenya.">
        <p>
          We are a small team based in Nairobi, working across the country and with
          buyers worldwide. Every developer on the platform is KYB-verified before they
          can list — company, registration and directors checked — so buyers know who
          they are dealing with.
        </p>
      </Section>

      <CtaBand
        title="See what a development looks like on e-resi."
        lede="Browse the developments already live, or find out what listing yours involves."
        primary={{ label: 'Browse properties', href: '/properties' }}
        secondary={{ label: 'List a development', href: '/for-developers' }}
      />
    </PageShell>
  );
}
