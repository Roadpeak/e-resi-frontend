import type { Metadata } from 'next';
import {
  PageShell,
  Section,
  SplitSection,
  Card,
  CardGrid,
  HighlightCard,
  CtaBand,
} from '../../../components/marketing/PageShell';

export const metadata: Metadata = {
  title: 'Careers',
  description:
    'Work at e-resi — production, engineering and sales roles building an immersive property platform in Nairobi.',
  alternates: { canonical: '/careers' },
};

const HIGHLIGHTS = [
  'Small team, Nairobi based',
  'Short path from idea to production',
  'In person for production',
  'Flexible for everything else',
];

const AREAS = [
  {
    title: 'Production',
    body: 'Photographers, drone pilots, 3D scanning technicians and video editors. You shoot the developments and cut the films that sell them.',
  },
  {
    title: 'Engineering',
    body: 'Web, 3D and WebXR. Cinematic scroll experiences, interactive walkthroughs and headset-ready tours that have to run on a phone in Nairobi and a laptop in London.',
  },
  {
    title: 'Developer partnerships',
    body: 'Bringing developers onto the platform, understanding how they actually sell, and making sure what we build matches that.',
  },
];

export default function CareersPage() {
  return (
    <PageShell
      eyebrow="Careers"
      title="Build the way property gets bought."
      lede="We're a small team in Nairobi making it possible to walk through a building that hasn't been built yet."
    >
      <Section eyebrow="Working here" title="What the job is actually like." prose={false}>
        <CardGrid cols={4}>
          {HIGHLIGHTS.map((h) => (
            <HighlightCard key={h}>{h}</HighlightCard>
          ))}
        </CardGrid>
      </Section>

      <Section eyebrow="Where we hire" title="Three areas we build in." prose={false}>
        <CardGrid cols={3}>
          {AREAS.map((a) => (
            <Card key={a.title} accent>
              <h2 className="text-[20px] font-semibold tracking-tight text-ink">{a.title}</h2>
              <p className="mt-3 text-[16px] leading-relaxed text-ink/60">{a.body}</p>
            </Card>
          ))}
        </CardGrid>
      </Section>

      <SplitSection
        eyebrow="How we work"
        title="Short path from idea to production."
        lede="If you build something on Tuesday, a developer in Kilimani is likely using it by Friday — which is either exactly what you want or exactly what you don't."
      >
        <Card accent>
          <h3 className="text-[18px] font-semibold tracking-tight text-ink">Small team</h3>
          <p className="mt-2 text-[16px] leading-relaxed text-ink/60">
            Few enough people that what you build is recognisably yours, and few enough
            layers that it ships without a committee.
          </p>
        </Card>
        <Card accent>
          <h3 className="text-[18px] font-semibold tracking-tight text-ink">
            In person where it counts
          </h3>
          <p className="mt-2 text-[16px] leading-relaxed text-ink/60">
            We are based in Nairobi and work in person for production — you cannot shoot a
            development remotely — and flexibly for everything else.
          </p>
        </Card>
        <Card accent>
          <h3 className="text-[18px] font-semibold tracking-tight text-ink">
            Real constraints
          </h3>
          <p className="mt-2 text-[16px] leading-relaxed text-ink/60">
            Everything has to run on a phone in Nairobi and a laptop in London. That
            constraint shapes most of the interesting engineering here.
          </p>
        </Card>
      </SplitSection>

      <Section eyebrow="Applying" title="No open role that fits?">
        <p>
          We don&apos;t always have a posting up for every area. If your work is
          relevant, write to us with something you&apos;ve made — a reel, a repo, a
          walkthrough — rather than a CV alone.
        </p>
        <p>
          <a
            href="mailto:careers@e-resi.com"
            className="inline-block text-[16px] font-medium text-resi-600 transition-colors hover:text-resi-800"
          >
            careers@e-resi.com →
          </a>
        </p>
      </Section>

      <CtaBand
        title="Show us something you've made."
        lede="A reel, a repo or a walkthrough tells us more than a CV does."
        primary={{ label: 'Write to us', href: 'mailto:careers@e-resi.com' }}
        secondary={{ label: 'About e-resi', href: '/about' }}
      />
    </PageShell>
  );
}
