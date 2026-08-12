import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell, Section } from '../../../components/marketing/PageShell';

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

const STEPS = [
  {
    n: '01',
    title: 'Get verified',
    body: 'Submit your certificate of incorporation, tax registration and director ID. Our team reviews it, usually within a working day.',
  },
  {
    n: '02',
    title: 'Choose your production',
    body: 'Pick from photography, drone, twilight, 3D scanning, VR capture and CGI. Pay once, per development — no subscription on your account.',
  },
  {
    n: '03',
    title: 'We shoot and publish',
    body: 'Our production team captures the development and publishes it to a mini-site of your own — your logo, your colours, your typeface — carrying the gallery, cinematic film, 3D walkthrough and VR tour.',
  },
  {
    n: '04',
    title: 'Share it with your buyers',
    body: 'Send the link straight to your WhatsApp list, your sales team and your diaspora buyers. It works whether or not they ever visit e-resi, and the share preview carries your development, not ours.',
  },
  {
    n: '05',
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

export default function ForDevelopersPage() {
  return (
    <PageShell
      eyebrow="Property Developer Listing"
      title="Show buyers the building before it's built."
      lede="Most of your buyers cannot visit the site. Some are in another country; some are buying off-plan from a floor plan and a render. e-resi produces the media that closes that gap, hands you a branded page to share with them directly, and gives you one place to run the sale — built for how Kenyan buyers actually decide."
    >
      <Section title="How it works">
        <ol className="space-y-6">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-5">
              <span className="shrink-0 text-[15px] font-semibold tabular-nums text-brand-600">
                {s.n}
              </span>
              <span>
                <span className="block text-[18px] font-semibold text-gray-900">{s.title}</span>
                <span className="mt-1 block text-[16px] leading-relaxed text-gray-600">{s.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="What you get">
        <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {CAPABILITIES.map(([title, body]) => (
            <div key={title}>
              <dt className="text-[16px] font-semibold text-gray-900">{title}</dt>
              <dd className="mt-1 text-[15px] leading-relaxed text-gray-600">{body}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="What it costs">
        <p>
          Production is priced per development and paid once — you choose the services
          you want. Listing is a flat monthly fee per live development, and it only
          starts when the development goes live.
        </p>
        <p>
          There is no charge for your account, no commission on sales, and no fee for
          leads.
        </p>
        <Link
          href="/pricing"
          className="inline-block text-[16px] font-medium text-brand-600 hover:text-brand-700"
        >
          See current pricing →
        </Link>
      </Section>

      <Section title="Why developers move here">
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

      <Section>
        <div className="rounded-3xl bg-gray-900 p-8 text-white">
          <h2 className="text-[24px] font-semibold">Ready to list?</h2>
          <p className="mt-3 text-[16px] leading-relaxed text-gray-300">
            Setup takes about ten minutes. Your progress saves as you go.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/onboarding"
              className="rounded-full bg-white px-6 py-2.5 text-[15px] font-medium text-gray-900 transition-colors hover:bg-gray-100"
            >
              Become a developer
            </Link>
            <Link
              href="/contact"
              className="rounded-full border border-white/25 px-6 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-white/10"
            >
              Talk to us first
            </Link>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
