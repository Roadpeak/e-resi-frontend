import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell, Section } from '../../../components/marketing/PageShell';

export const metadata: Metadata = {
  title: 'About e-resi',
  description:
    'e-resi is an immersive property platform for Kenya. Developers list once and we produce the photography, cinematic film, 3D walkthrough and VR tour — so buyers and tenants can walk a home before it exists.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About e-resi',
    description:
      'An immersive property platform for Kenya — cinematic, 3D and VR tours of developments, built for buyers who are far away and homes that are not built yet.',
    url: '/about',
    type: 'website',
  },
};

const STATS = [
  { value: 'Cinematic', label: 'Scroll-driven films of every development' },
  { value: '3D', label: 'Interactive walkthroughs, room by room' },
  { value: 'VR', label: 'Headset-ready tours for serious buyers' },
];

export default function AboutPage() {
  return (
    <PageShell
      eyebrow="About"
      title="Property decisions shouldn't depend on being in the room."
      lede="e-resi is an immersive property platform built for Kenya — where a great deal of property is bought off-plan, and a great many buyers are somewhere else entirely."
    >
      <Section title="The problem we set out to solve">
        <p>
          Two things make Kenyan property hard to buy with confidence. The first is
          that much of it is sold before it exists — off-plan, from a floor plan and
          an artist&apos;s render. The second is that a significant share of buyers are
          in the diaspora, making decisions from Dubai, London or Atlanta on the
          strength of a WhatsApp video and a phone call.
        </p>
        <p>
          Both problems have the same shape: the buyer cannot walk the space. So they
          either fly in, send a relative, or take a risk. Developers feel the other
          side of it — long sales cycles, repeated site visits, and serious interest
          that goes cold because someone couldn&apos;t see what they were buying.
        </p>
      </Section>

      <Section title="What we built">
        <p>
          e-resi gives every development its own branded page with three ways to
          experience it. A <strong className="font-medium text-gray-900">cinematic tour</strong> that
          plays as you scroll, so the building reveals itself at your own pace. An{' '}
          <strong className="font-medium text-gray-900">interactive 3D walkthrough</strong> you can
          move through room by room. And a{' '}
          <strong className="font-medium text-gray-900">VR tour</strong> for anyone with a headset
          who wants to stand inside a unit that hasn&apos;t been built.
        </p>
        <p>
          Underneath that sits the practical machinery: unit-level availability with
          floor numbers, floor plans, live pricing, reservations, viewing bookings,
          and direct chat between a buyer and the developer&apos;s team.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {STATS.map((s) => (
            <div key={s.value} className="rounded-2xl border border-gray-200 p-5">
              <p className="text-[22px] font-semibold text-gray-900">{s.value}</p>
              <p className="mt-1 text-[14px] leading-relaxed text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="We produce the media ourselves">
        <p>
          This is the part most listing sites leave to the developer, and it is why
          most listings look the way they do. e-resi has a production team. You choose
          what you want — photography, drone, twilight stills, 3D scanning, VR capture,
          CGI for off-plan units — and we shoot, edit and publish it to your page.
        </p>
        <p>
          Developers keep control of what appears. Media is organised per unit type, so
          a two-bedroom and a penthouse each show their own rooms, and you decide which
          tours appear against which layout.
        </p>
      </Section>

      <Section title="Who it's for">
        <p>
          <strong className="font-medium text-gray-900">Developers</strong> list a development
          once and manage everything from a single dashboard: units, rentals, media,
          inquiries, viewings, reservations and billing.
        </p>
        <p>
          <strong className="font-medium text-gray-900">Buyers and investors</strong> browse
          completed and off-plan developments, tour them properly, save shortlists, book
          viewings and reserve units.
        </p>
        <p>
          <strong className="font-medium text-gray-900">Tenants</strong> browse rentals by unit
          type, see which floor a unit sits on and how many are left, and reserve one
          without a site visit.
        </p>
      </Section>

      <Section title="Verification matters">
        <p>
          Every developer on e-resi goes through KYB verification — certificate of
          incorporation, tax registration and director identification — reviewed by our
          team before a single listing goes live. Buyers sending money across borders
          deserve to know who is on the other end.
        </p>
      </Section>

      <Section>
        <div className="rounded-3xl bg-gray-50 p-8">
          <h2 className="text-[22px] font-semibold text-gray-900">Where we&apos;re going</h2>
          <p className="mt-3">
            We&apos;re building toward a full digital twin of every development we
            list — accurate, navigable, and current from groundbreaking to handover.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/for-developers"
              className="rounded-full bg-gray-900 px-6 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-gray-700"
            >
              List a development
            </Link>
            <Link
              href="/properties"
              className="rounded-full border border-gray-300 px-6 py-2.5 text-[15px] font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Browse properties
            </Link>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
