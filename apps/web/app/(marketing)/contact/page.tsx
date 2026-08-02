import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell, Section } from '../../../components/marketing/PageShell';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with e-resi — for developers listing a development, buyers with a question about a property, or press and partnership enquiries.',
  alternates: { canonical: '/contact' },
};

const ROUTES = [
  {
    who: 'Developers',
    what: 'Listing a development, production services, verification or billing.',
    email: 'developers@e-resi.com',
  },
  {
    who: 'Buyers & tenants',
    what: 'A question about a property, a viewing, or a reservation you have made.',
    email: 'support@e-resi.com',
  },
  {
    who: 'Press & partnerships',
    what: 'Media enquiries, partnerships and anything commercial.',
    email: 'info@e-resi.com',
  },
];

export default function ContactPage() {
  return (
    <PageShell
      eyebrow="Contact"
      title="Talk to us."
      lede="Mail the address closest to what you need and it reaches the right person faster."
    >
      <Section>
        <div className="space-y-4">
          {ROUTES.map((r) => (
            <div key={r.email} className="rounded-2xl border border-gray-200 p-6">
              <h2 className="text-[18px] font-semibold text-gray-900">{r.who}</h2>
              <p className="mt-1 text-[15px] leading-relaxed text-gray-600">{r.what}</p>
              <a
                href={`mailto:${r.email}`}
                className="mt-3 inline-block text-[16px] font-medium text-brand-600 hover:text-brand-700"
              >
                {r.email}
              </a>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Already have an account?">
        <p>
          Developers can message buyers directly from the dashboard, and buyers can chat
          with a developer from any property page — both are faster than email for
          anything about a specific listing.
        </p>
      </Section>

      <Section title="Where we are">
        <p>Nairobi, Kenya. We work across the country and with buyers worldwide.</p>
      </Section>

      <Section>
        <div className="rounded-3xl bg-gray-50 p-8">
          <h2 className="text-[22px] font-semibold text-gray-900">
            Thinking about listing a development?
          </h2>
          <p className="mt-3 text-[16px] leading-relaxed text-gray-600">
            The onboarding walks you through it in about ten minutes.
          </p>
          <Link
            href="/for-developers"
            className="mt-6 inline-block rounded-full bg-gray-900 px-6 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-gray-700"
          >
            See how it works
          </Link>
        </div>
      </Section>
    </PageShell>
  );
}
