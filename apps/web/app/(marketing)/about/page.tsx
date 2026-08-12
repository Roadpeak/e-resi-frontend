import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell, Section } from '../../../components/marketing/PageShell';

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

const STATS = [
  { value: 'Cinematic', label: 'Scroll-driven films of every development' },
  { value: '3D', label: 'Interactive walkthroughs, room by room' },
  { value: 'VR', label: 'Headset-ready tours for serious buyers' },
];

export default function AboutPage() {
  return (
    <PageShell
      eyebrow="About"
      title="Selling a building that doesn't exist yet shouldn't be this hard."
      lede="e-resi is an immersive property platform built for Kenyan developers — in a market where much of what sells is sold off-plan, to buyers who are somewhere else entirely."
    >
      <Section title="The problem we set out to solve">
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

      <Section title="Your page, not ours">
        <p>
          Every development gets a mini-site of its own — your logo, your colours, your
          typeface, and on the top tier your own domain. It is built to be shared
          directly: a developer sends the link to their WhatsApp list, their sales team
          and their diaspora buyers, and it works whether or not anyone ever visits
          e-resi itself.
        </p>
        <p>
          That page reports back. You see how many people opened it, how many started
          the tour, how long they stayed inside it and which units drew the most
          attention — the kind of thing a brochure has never been able to tell anyone.
        </p>
      </Section>

      <Section title="Who it's for">
        <p>
          <strong className="font-medium text-gray-900">Developers</strong> are who we build
          for. List a development once and run everything from a single dashboard: units,
          rentals, media, inquiries, viewings, reservations, billing and the engagement
          data behind every tour.
        </p>
        <p>
          <strong className="font-medium text-gray-900">Buyers and investors</strong> browse
          completed and off-plan developments, tour them properly, save shortlists, book
          viewings and reserve units — from anywhere in the world.
        </p>
        <p>
          <strong className="font-medium text-gray-900">Tenants</strong> browse rentals by unit
          type, see which floor a unit sits on and how many are left, and reserve one
          without a site visit.
        </p>
        <p>
          <strong className="font-medium text-gray-900">Agents</strong> — verified companies and
          individuals — partner with developers, bring their own clients to a tour and get
          credited for the leads they introduce.
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
