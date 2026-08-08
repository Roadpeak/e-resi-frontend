import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell, Section } from '../../../components/marketing/PageShell';

export const metadata: Metadata = {
  title: "Property Investment for Investors — Invest in Kenya's Properties Digitally",
  description:
    "Invest in Kenya's properties digitally. Tour your apartment virtually in cinematic, 3D and VR modes before you buy. See unit-level availability, floor plans and pricing, book viewings and reserve units — then buy Kenya's top properties from anywhere.",
  alternates: { canonical: '/for-investors' },
  openGraph: {
    siteName: 'E-resi',
    title: "Property Investment for Investors — E-resi",
    description:
      "Invest in Kenya's properties digitally. Cinematic, 3D and VR tours of Kenyan developments, with unit-level availability and pricing.",
    url: '/for-investors',
    type: 'website',
  },
};

const ANSWERS = [
  ['What does it actually look like?', 'Cinematic film, 3D walkthrough and VR tour — not five phone photos and a render.'],
  ['Which units are left?', 'Live availability per unit type, with floor number, size and price.'],
  ['What am I paying for?', 'Floor plans, finishes and the exact unit — before you commit to anything.'],
  ['Who is the developer?', 'Every developer is KYB-verified before they can list. Company, registration and track record on the page.'],
  ['Where is it?', 'Mapped location with the surrounding area, so you know the neighbourhood, not just the building.'],
  ['How do I secure one?', 'Reserve a unit online, or book a viewing if you would rather see it in person first.'],
];

export default function ForInvestorsPage() {
  return (
    <PageShell
      eyebrow="Property Investment for Investors"
      title="Invest in Kenya's properties digitally — buy property you can actually see."
      lede="Off-plan purchases and cross-border buying have the same weakness — you commit before you can walk the space. e-resi is built to remove that: tour your apartment virtually in cinematic, 3D and VR modes, then buy Kenya's top properties from anywhere."
    >
      <Section title="The questions a listing should answer">
        <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {ANSWERS.map(([q, a]) => (
            <div key={q}>
              <dt className="text-[16px] font-semibold text-gray-900">{q}</dt>
              <dd className="mt-1 text-[15px] leading-relaxed text-gray-600">{a}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="Three ways to tour">
        <p>
          <strong className="font-medium text-gray-900">Cinematic.</strong> A scroll-driven film
          of the development. You control the pace — scroll forward through the building,
          back to look again.
        </p>
        <p>
          <strong className="font-medium text-gray-900">3D walkthrough.</strong> Move through the
          development room by room and get a genuine sense of scale and flow.
        </p>
        <p>
          <strong className="font-medium text-gray-900">VR.</strong> With a headset, stand inside
          a unit at full scale. For off-plan purchases this is the closest thing to a
          site visit that exists.
        </p>
      </Section>

      <Section title="Buying from abroad">
        <p>
          If you are in the diaspora, the usual process means flying in, sending a
          relative, or trusting a video call. On e-resi you can tour the development
          properly at whatever hour suits you, chat directly with the developer&apos;s
          team, and reserve a unit without booking a flight.
        </p>
        <p>
          Every developer is verified before listing, so you know who you are dealing
          with.
        </p>
      </Section>

      <Section title="Off-plan, without the guesswork">
        <p>
          Buying off-plan usually means committing on the strength of a render. For
          developments still under construction, we produce CGI walkthroughs from the
          architectural plans and publish construction updates as the building goes up —
          so you can see progress rather than wait for it.
        </p>
      </Section>

      <Section title="It costs you nothing">
        <p>
          Browsing, touring, saving shortlists, booking viewings and messaging developers
          are all free. We are paid by developers for production and listing, not by
          buyers, and we take no commission on any sale.
        </p>
      </Section>

      <Section>
        <div className="rounded-3xl bg-gray-50 p-8">
          <h2 className="text-[22px] font-semibold text-gray-900">Start looking</h2>
          <p className="mt-3 text-[16px] leading-relaxed text-gray-600">
            Browse developments for sale, or find somewhere to rent.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/properties"
              className="rounded-full bg-gray-900 px-6 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-gray-700"
            >
              Browse properties
            </Link>
            <Link
              href="/rent"
              className="rounded-full border border-gray-300 px-6 py-2.5 text-[15px] font-medium text-gray-700 transition-colors hover:bg-white"
            >
              Find a rental
            </Link>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
