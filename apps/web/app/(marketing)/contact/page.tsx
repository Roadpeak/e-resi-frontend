import type { Metadata } from 'next';
import {
  PageShell,
  Section,
  SplitSection,
  Card,
  CardGrid,
  CtaBand,
} from '../../../components/marketing/PageShell';

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
      <Section eyebrow="Get in touch" title="Pick the right inbox." prose={false}>
        <CardGrid cols={3}>
          {ROUTES.map((r) => (
            <Card key={r.email} accent className="flex flex-col">
              <h2 className="text-[20px] font-semibold tracking-tight text-ink">{r.who}</h2>
              <p className="mt-2 flex-1 text-[15px] leading-relaxed text-ink/60">{r.what}</p>
              <a
                href={`mailto:${r.email}`}
                className="mt-6 inline-block self-start text-[16px] font-medium text-resi-600 transition-colors hover:text-resi-800"
              >
                {r.email}
              </a>
            </Card>
          ))}
        </CardGrid>
      </Section>

      <SplitSection
        eyebrow="Faster than email"
        title="Already have an account?"
        lede="For anything about a specific listing, the platform beats an inbox."
      >
        <Card accent>
          <h3 className="text-[18px] font-semibold tracking-tight text-ink">Developers</h3>
          <p className="mt-2 text-[16px] leading-relaxed text-ink/60">
            Message buyers directly from the dashboard, where the inquiry, the viewing
            request and the unit it concerns are already in front of you.
          </p>
        </Card>
        <Card accent>
          <h3 className="text-[18px] font-semibold tracking-tight text-ink">Buyers & tenants</h3>
          <p className="mt-2 text-[16px] leading-relaxed text-ink/60">
            Chat with a developer from any property page — your question arrives attached
            to the development you are asking about.
          </p>
        </Card>
      </SplitSection>

      <Section eyebrow="Where we are" title="Nairobi, Kenya.">
        <p>
          We work across the country and with buyers worldwide. If you would rather speak
          to someone about listing a development, mail{' '}
          <a
            href="mailto:developers@e-resi.com"
            className="font-medium text-resi-600 transition-colors hover:text-resi-800"
          >
            developers@e-resi.com
          </a>{' '}
          and we will arrange a call.
        </p>
      </Section>

      <CtaBand
        title="Thinking about listing a development?"
        lede="The onboarding walks you through it in about ten minutes."
        primary={{ label: 'See how it works', href: '/for-developers' }}
        secondary={{ label: 'View pricing', href: '/pricing' }}
      />
    </PageShell>
  );
}
