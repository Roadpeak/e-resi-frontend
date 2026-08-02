import type { Metadata } from 'next';
import { PageShell, Section } from '../../../components/marketing/PageShell';

export const metadata: Metadata = {
  title: 'Careers',
  description:
    'Work at e-resi — production, engineering and sales roles building an immersive property platform in Nairobi.',
  alternates: { canonical: '/careers' },
};

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
      <Section title="Where we hire">
        <div className="space-y-6">
          {AREAS.map((a) => (
            <div key={a.title}>
              <h2 className="text-[18px] font-semibold text-gray-900">{a.title}</h2>
              <p className="mt-1 text-[16px] leading-relaxed text-gray-600">{a.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="How we work">
        <p>
          Small team, short path from idea to production. If you build something on
          Tuesday, a developer in Kilimani is likely using it by Friday — which is either
          exactly what you want or exactly what you don&apos;t.
        </p>
        <p>
          We&apos;re based in Nairobi and work in person for production, flexibly for
          everything else.
        </p>
      </Section>

      <Section title="No open role that fits?">
        <p>
          We don&apos;t always have a posting up for every area. If your work is
          relevant, write to us with something you&apos;ve made — a reel, a repo, a
          walkthrough — rather than a CV alone.
        </p>
        <a
          href="mailto:careers@e-resi.com"
          className="inline-block text-[16px] font-medium text-brand-600 hover:text-brand-700"
        >
          careers@e-resi.com →
        </a>
      </Section>
    </PageShell>
  );
}
