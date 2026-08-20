import type { Metadata } from 'next';
import {
  PageShell,
  Section,
  SplitSection,
  Card,
  CardGrid,
  FeatureCard,
  HighlightCard,
  StepCard,
  CtaBand,
  TextLink,
} from '../../../components/marketing/PageShell';
import { AccordionItem } from '../../../components/marketing/Accordion';

export const metadata: Metadata = {
  title: 'Sell Off-Plan — Property Developer Marketing, Kenya',
  description:
    'Sell off-plan with confidence. We produce your cinematic, 3D and VR tours and hand you a '
    + 'branded page, plus one dashboard for leads. No commission on sales.',
  alternates: { canonical: '/for-developers' },
  openGraph: {
    siteName: 'E-resi',
    title: 'Sell Your Development Off-Plan — E-resi for Property Developers',
    description:
      'Cinematic, 3D and VR production, a branded mini-site you can share on WhatsApp, and '
      + 'one dashboard for units, leads and reservations. No commission on your sales.',
    url: '/for-developers',
    type: 'website',
  },
};

const HIGHLIGHTS = [
  'Verified in about one working day',
  'Production paid once, per development',
  'A branded page you can share anywhere',
  'No commission on any sale',
];

const STEPS = [
  {
    n: 'Step 1',
    title: 'Get verified',
    body: 'Submit your certificate of incorporation, tax registration and director ID. Our team reviews it, usually within a working day.',
    action: { label: 'Start verification', href: '/onboarding' },
  },
  {
    n: 'Step 2',
    title: 'Choose your production',
    body: 'Pick from photography, drone, twilight, 3D scanning, VR capture and CGI. Pay once, per development — no subscription on your account.',
  },
  {
    n: 'Step 3',
    title: 'We shoot and publish',
    body: 'Our production team captures the development and publishes it to a mini-site of your own — your logo, your colours, your typeface — carrying the gallery, cinematic film, 3D walkthrough and VR tour.',
  },
  {
    n: 'Step 4',
    title: 'Share it with your buyers',
    body: 'Send the link straight to your WhatsApp list, your sales team and your diaspora buyers. It works whether or not they ever visit e-resi, and the share preview carries your development, not ours.',
  },
  {
    n: 'Step 5',
    title: 'Sell and let from one place',
    body: 'Manage units and rentals, answer inquiries, confirm viewings and take reservations — then see who opened the tour, how long they stayed and which units they kept coming back to.',
  },
];

const CAPABILITIES = [
  ['Branded development page', 'Your own page with hero media, gallery, floor plans and location — not a row in a list.'],
  ['Unit-level control', 'Every unit with its floor, size, price and availability. Mark units reserved or sold as they move.'],
  ['Rentals alongside sales', 'List unit types for rent with availability counts, and let tenants reserve one directly.'],
  ['Immersive tours per unit type', 'Choose which cinematic, 3D or VR tour appears against each layout, so a studio and a penthouse show their own rooms.'],
  ['Leads in one inbox', 'Inquiries, viewing requests and direct chat with buyers, all in the dashboard.'],
  ['Analytics that answer questions', 'Views, inquiries, bookings and reservations — with the drop-off between them visible.'],
];

const FAQS = [
  [
    'What does production actually include?',
    'Photography, drone and twilight shoots, 3D scanning, VR capture and CGI — you choose which of them the development warrants. Our team shoots it on site; you are not commissioning this elsewhere.',
  ],
  [
    'What if the development has not been built yet?',
    'That is the common case. We build CGI walkthroughs from your architectural plans, then publish construction updates as the building goes up, so buyers see progress rather than wait for it.',
  ],
  [
    'Do you take a commission on sales?',
    'No. Production is paid once per development and listing is a flat monthly fee. The full sale price is yours, however much the unit sells for.',
  ],
  [
    'How long does verification take?',
    'Usually one working day once we have your certificate of incorporation, tax registration and director ID.',
  ],
  [
    'Can I share the page outside e-resi?',
    'Yes — that is the point of it. The mini-site is yours to send to your WhatsApp list, your sales team and your buyers directly, and the share preview carries your development.',
  ],
  [
    'What happens when the development sells out?',
    'Take it down and the monthly listing fee stops. Your account itself is free, however many developments you manage.',
  ],
];

export default function ForDevelopersPage() {
  return (
    <PageShell
      eyebrow="For Developers"
      title="Show buyers the building before it's built."
      lede="Most of your buyers cannot visit the site. Some are in another country; some are buying off-plan from a floor plan and a render. e-resi produces the media that closes that gap, hands you a branded page to share with them directly, and gives you one place to run the sale."
    >
      <Section
        eyebrow="At a glance"
        title="What listing with us involves."
        prose={false}
      >
        <CardGrid cols={4}>
          {HIGHLIGHTS.map((h) => (
            <HighlightCard key={h}>{h}</HighlightCard>
          ))}
        </CardGrid>
      </Section>

      <Section
        eyebrow="Our process"
        title="From verification to your first reservation."
        prose={false}
      >
        <CardGrid cols={2}>
          {STEPS.map((s) => (
            <StepCard key={s.n} step={s.n} title={s.title} action={s.action}>
              {s.body}
            </StepCard>
          ))}
        </CardGrid>
      </Section>

      <Section
        eyebrow="What you get"
        title="Everything needed to run the sale."
        prose={false}
      >
        <CardGrid cols={2}>
          {CAPABILITIES.map(([title, body]) => (
            <FeatureCard key={title} title={title}>
              {body}
            </FeatureCard>
          ))}
        </CardGrid>
      </Section>

      <SplitSection
        eyebrow="Pricing"
        title="Production once. Listing monthly. Nothing on the sale."
        lede="Production is priced per development and paid once — you choose the services you want. Listing is a flat monthly fee per live development, and it only starts when the development goes live."
        aside={<TextLink href="/pricing">See current pricing →</TextLink>}
      >
        <Card accent>
          <h3 className="text-[18px] font-semibold tracking-tight text-ink">
            No charge for your account
          </h3>
          <p className="mt-2 text-[16px] leading-relaxed text-ink/60">
            However many developments you manage. You pay per live development, not per
            seat and not per user.
          </p>
        </Card>
        <Card accent>
          <h3 className="text-[18px] font-semibold tracking-tight text-ink">
            No commission on sales
          </h3>
          <p className="mt-2 text-[16px] leading-relaxed text-ink/60">
            The full price is yours. We are paid for production and listing, so our
            revenue does not scale with what your units sell for.
          </p>
        </Card>
        <Card accent>
          <h3 className="text-[18px] font-semibold tracking-tight text-ink">
            No fee for leads
          </h3>
          <p className="mt-2 text-[16px] leading-relaxed text-ink/60">
            Inquiries, viewing requests and direct chat with buyers are all included.
          </p>
        </Card>
      </SplitSection>

      <Section eyebrow="Why it works" title="A buyer who has walked the unit arrives decided.">
        <p>
          A buyer who has walked a unit in VR arrives at a site visit already decided.
          A diaspora buyer who can tour the whole development at 2am in another
          timezone doesn&apos;t need three calls to understand the layout. And a
          development that looks like a film rather than five phone photos gets taken
          seriously.
        </p>
        <p>
          The practical effect is fewer speculative site visits, shorter sales cycles,
          and inquiries that arrive with the buyer already informed.
        </p>
      </Section>

      <SplitSection
        eyebrow="FAQ"
        title="Frequently asked questions"
        lede="Answers to what developers ask us before listing."
        aside={<TextLink href="/contact">Ask us something else →</TextLink>}
      >
        {FAQS.map(([q, a], i) => (
          <AccordionItem key={q} question={q} defaultOpen={i === 0}>
            {a}
          </AccordionItem>
        ))}
      </SplitSection>

      <CtaBand
        title="Ready to list?"
        lede="Setup takes about ten minutes. Your progress saves as you go."
        primary={{ label: 'Become a developer', href: '/onboarding' }}
        secondary={{ label: 'Talk to us first', href: '/contact' }}
      />
    </PageShell>
  );
}
