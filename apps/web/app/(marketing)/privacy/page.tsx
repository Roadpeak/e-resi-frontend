import type { Metadata } from 'next';
import { PageShell, Section } from '../../../components/marketing/PageShell';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How e-resi collects, uses and protects personal data, and the rights you have under the Kenya Data Protection Act.',
  alternates: { canonical: '/privacy' },
  robots: { index: true, follow: true },
};

const UPDATED = '2 August 2026';

export default function PrivacyPage() {
  return (
    <PageShell
      eyebrow="Legal"
      title="Privacy Policy"
      lede={`How we handle personal data on e-resi. Last updated ${UPDATED}.`}
    >
      <Section title="Who we are">
        <p>
          e-resi is an immersive property platform operating in Kenya. For the purposes
          of the Kenya Data Protection Act, 2019, e-resi is the data controller for the
          personal data described here. You can reach us at{' '}
          <a href="mailto:info@e-resi.com" className="text-brand-600 hover:text-brand-700">
            info@e-resi.com
          </a>
          .
        </p>
      </Section>

      <Section title="What we collect">
        <p>
          <strong className="font-medium text-gray-900">Account details.</strong> Your name,
          email address, phone number and password (stored only as a cryptographic hash,
          never in readable form). Optionally a profile photo.
        </p>
        <p>
          <strong className="font-medium text-gray-900">Developer verification.</strong> For
          developer accounts: company name, registration number, tax registration and
          identification documents for directors. We need these to verify that a business
          listing property is real.
        </p>
        <p>
          <strong className="font-medium text-gray-900">Activity on the platform.</strong>{' '}
          Properties you save, inquiries you send, viewings you book, reservations you
          make, and messages you exchange with developers.
        </p>
        <p>
          <strong className="font-medium text-gray-900">Usage data.</strong> Pages viewed and
          how you arrived, so developers can see interest in their listings and we can
          understand what is working.
        </p>
        <p>
          <strong className="font-medium text-gray-900">Payment data.</strong> Handled by our
          payment providers. Card numbers are never stored on our systems — we keep only
          a token, the last four digits and the card type.
        </p>
      </Section>

      <Section title="Why we use it">
        <p>
          To run your account and let you use the platform; to connect buyers and tenants
          with developers; to verify developers before they list; to process payments; to
          send transactional messages about your account, inquiries and reservations; and
          to improve the product.
        </p>
        <p>
          We do not sell personal data. We do not share your contact details with
          developers beyond what is necessary to answer an inquiry you sent.
        </p>
      </Section>

      <Section title="Who we share it with">
        <p>
          <strong className="font-medium text-gray-900">Developers</strong> receive your name
          and contact details when you send an inquiry, book a viewing or reserve a unit —
          they need these to respond.
        </p>
        <p>
          <strong className="font-medium text-gray-900">Service providers</strong> who host
          our infrastructure, store media, send email and process payments, each bound to
          use the data only for that purpose.
        </p>
        <p>
          <strong className="font-medium text-gray-900">Authorities</strong>, where we are
          legally required to disclose.
        </p>
      </Section>

      <Section title="How long we keep it">
        <p>
          Account data for as long as your account is open, and for a period afterwards
          where we are required to retain records. Verification documents for as long as
          the developer is active, plus any statutory retention period. Transaction records
          for seven years, as tax law requires.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          Under the Data Protection Act you may request access to your data, correction of
          anything inaccurate, deletion, restriction of how it is processed, and a portable
          copy. You can object to processing, and withdraw consent where processing relies
          on it.
        </p>
        <p>
          Write to{' '}
          <a href="mailto:info@e-resi.com" className="text-brand-600 hover:text-brand-700">
            info@e-resi.com
          </a>{' '}
          and we will respond within the statutory period. You also have the right to
          complain to the Office of the Data Protection Commissioner.
        </p>
      </Section>

      <Section title="Security">
        <p>
          Data is transmitted over encrypted connections and passwords are hashed with
          bcrypt. Access to production data is restricted, and administrative actions on
          the platform are recorded in an audit log.
        </p>
      </Section>

      <Section title="Cookies">
        <p>
          We use cookies that are necessary to keep you signed in and to remember your
          preferences, plus analytics to understand how the platform is used. We do not
          use advertising cookies.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          We will post any changes to this policy on this page and update the date above.
          Material changes will be notified to account holders directly.
        </p>
      </Section>
    </PageShell>
  );
}
