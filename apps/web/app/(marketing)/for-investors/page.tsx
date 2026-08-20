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
import { AccordionItem } from '../../../components/marketing/Accordion';

export const metadata: Metadata = {
  title: 'Property Investment Kenya — Tour in 3D & VR Before You Buy',
  description:
    "Invest in Kenya's properties digitally. Tour apartments and villas in cinematic, 3D and "
    + 'VR before you commit — availability, plans and pricing.',
  alternates: { canonical: '/for-investors' },
  openGraph: {
    siteName: 'E-resi',
    title: 'Property Investment in Kenya — Tour Before You Buy | E-resi',
    description:
      "Cinematic, 3D and VR tours of Kenyan developments, with unit-level availability and "
      + 'pricing. Every developer KYB-verified.',
    url: '/for-investors',
    type: 'website',
  },
};

const HIGHLIGHTS = [
  'Free to browse, tour and reserve',
  'Every developer KYB-verified',
  'Live unit-level availability',
  'Tour from anywhere, at any hour',
];

const MODES = [
  {
    title: 'Cinematic',
    body: 'A scroll-driven film of the development. You control the pace — scroll forward through the building, back to look again.',
  },
  {
    title: '3D walkthrough',
    body: 'Move through the development room by room and get a genuine sense of scale and flow.',
  },
  {
    title: 'VR',
    body: 'With a headset, stand inside a unit at full scale. For off-plan purchases this is the closest thing to a site visit that exists.',
  },
];

const ANSWERS = [
  ['What does it actually look like?', 'Cinematic film, 3D walkthrough and VR tour — not five phone photos and a render.'],
  ['Which units are left?', 'Live availability per unit type, with floor number, size and price.'],
  ['What am I paying for?', 'Floor plans, finishes and the exact unit — before you commit to anything.'],
  ['Who is the developer?', 'Every developer is KYB-verified before they can list. Company, registration and track record on the page.'],
  ['Where is it?', 'Mapped location with the surrounding area, so you know the neighbourhood, not just the building.'],
  ['How do I secure one?', 'Reserve a unit online, or book a viewing if you would rather see it in person first.'],
];

const FAQS = [
  [
    'Does any of this cost me anything?',
    'No. Browsing, touring, saving shortlists, booking viewings and messaging developers are all free. We are paid by developers for production and listing, not by buyers, and we take no commission on any sale.',
  ],
  [
    'Can I buy from outside Kenya?',
    'Yes — it is much of what the platform is for. You can tour a development properly at whatever hour suits you, chat directly with the developer’s team, and reserve a unit without booking a flight.',
  ],
  [
    'How do I know the developer is real?',
    'Every developer is KYB-verified before they can list — company registration, tax registration and director identity are checked. The company and its track record appear on the development page.',
  ],
  [
    'What if the building is not finished?',
    'For developments still under construction we publish CGI walkthroughs built from the architectural plans, plus construction updates as the building goes up, so you can see progress rather than wait for it.',
  ],
  [
    'Do I need a VR headset?',
    'No. The cinematic film and 3D walkthrough run in an ordinary browser on a phone or laptop. The VR tour is there if you have a headset and want to stand inside a unit at full scale.',
  ],
  [
    'What does reserving a unit mean?',
    'It marks that specific unit as held for you and opens a direct line to the developer’s team to complete the purchase. Terms are set by the developer and shown before you commit.',
  ],
];

export default function ForInvestorsPage() {
  return (
    <PageShell
      eyebrow="For Investors"
      title="Buy property you can actually see."
      lede="Off-plan purchases and cross-border buying have the same weakness — you commit before you can walk the space. e-resi is built to remove that: tour in cinematic, 3D and VR, then buy from anywhere."
    >
      <Section eyebrow="Why it's different" title="What you get as a buyer." prose={false}>
        <CardGrid cols={4}>
          {HIGHLIGHTS.map((h) => (
            <HighlightCard key={h}>{h}</HighlightCard>
          ))}
        </CardGrid>
      </Section>

      <Section
        eyebrow="Three ways to tour"
        title="Look as closely as you want to."
        prose={false}
      >
        <CardGrid cols={3}>
          {MODES.map((m) => (
            <Card key={m.title} accent>
              <h3 className="text-[22px] font-semibold tracking-tight text-ink">{m.title}</h3>
              <p className="mt-3 text-[16px] leading-relaxed text-ink/60">{m.body}</p>
            </Card>
          ))}
        </CardGrid>
      </Section>

      <Section
        eyebrow="What a listing tells you"
        title="The questions a listing should answer."
        prose={false}
      >
        <CardGrid cols={2}>
          {ANSWERS.map(([q, a]) => (
            <FeatureCard key={q} title={q}>
              {a}
            </FeatureCard>
          ))}
        </CardGrid>
      </Section>

      <SplitSection
        eyebrow="Buying from abroad"
        title="No flight required to see it properly."
        lede="If you are in the diaspora, the usual process means flying in, sending a relative, or trusting a video call."
        aside={<TextLink href="/properties">Browse developments →</TextLink>}
      >
        <Card accent>
          <h3 className="text-[18px] font-semibold tracking-tight text-ink">Tour on your clock</h3>
          <p className="mt-2 text-[16px] leading-relaxed text-ink/60">
            Walk the development properly at whatever hour suits your timezone, as many
            times as you want, without booking anything.
          </p>
        </Card>
        <Card accent>
          <h3 className="text-[18px] font-semibold tracking-tight text-ink">
            Talk to the developer directly
          </h3>
          <p className="mt-2 text-[16px] leading-relaxed text-ink/60">
            Chat with the developer&apos;s team from the property page — no intermediary
            relaying questions on your behalf.
          </p>
        </Card>
        <Card accent>
          <h3 className="text-[18px] font-semibold tracking-tight text-ink">
            Reserve without flying in
          </h3>
          <p className="mt-2 text-[16px] leading-relaxed text-ink/60">
            Secure the unit online. Every developer is verified before listing, so you
            know who you are dealing with.
          </p>
        </Card>
      </SplitSection>

      <Section eyebrow="Off-plan" title="Off-plan, without the guesswork.">
        <p>
          Buying off-plan usually means committing on the strength of a render. For
          developments still under construction, we produce CGI walkthroughs from the
          architectural plans and publish construction updates as the building goes up —
          so you can see progress rather than wait for it.
        </p>
      </Section>

      <SplitSection
        eyebrow="FAQ"
        title="Frequently asked questions"
        lede="Answers to what buyers and investors ask us most."
        aside={<TextLink href="/contact">Ask us something else →</TextLink>}
      >
        {FAQS.map(([q, a], i) => (
          <AccordionItem key={q} question={q} defaultOpen={i === 0}>
            {a}
          </AccordionItem>
        ))}
      </SplitSection>

      <CtaBand
        title="Start looking."
        lede="Browse developments for sale, or find somewhere to rent."
        primary={{ label: 'Browse properties', href: '/properties' }}
        secondary={{ label: 'Find a rental', href: '/rent' }}
      />
    </PageShell>
  );
}
