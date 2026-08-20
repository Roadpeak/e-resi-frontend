import type { Metadata } from 'next';
import {
  PageShell,
  LegalBody,
  Clause,
  Term,
  MailLink,
} from '../../../components/marketing/PageShell';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How e-resi collects, uses and protects personal data, and the rights you have under the Kenya Data Protection Act.',
  alternates: { canonical: '/privacy' },
  robots: { index: true, follow: true },
};

const UPDATED = '2 August 2026';

const CONTENTS = [
  { id: 'who-we-are', label: 'Who we are' },
  { id: 'what-we-collect', label: 'What we collect' },
  { id: 'why-we-use-it', label: 'Why we use it' },
  { id: 'who-we-share-with', label: 'Who we share it with' },
  { id: 'how-long', label: 'How long we keep it' },
  { id: 'your-rights', label: 'Your rights' },
  { id: 'security', label: 'Security' },
  { id: 'cookies', label: 'Cookies' },
  { id: 'changes', label: 'Changes' },
];

export default function PrivacyPage() {
  return (
    <PageShell
      eyebrow="Legal"
      title="Privacy Policy"
      lede={`How we handle personal data on e-resi. Last updated ${UPDATED}.`}
    >
      <LegalBody contents={CONTENTS}>
        <Clause id="who-we-are" title="Who we are">
          <p>
            e-resi is an immersive property platform operating in Kenya. For the purposes
            of the Kenya Data Protection Act, 2019, e-resi is the data controller for the
            personal data described here. You can reach us at <MailLink email="info@e-resi.com" />.
          </p>
        </Clause>

        <Clause id="what-we-collect" title="What we collect">
          <p>
            <Term>Account details.</Term> Your name, email address, phone number and
            password (stored only as a cryptographic hash, never in readable form).
            Optionally a profile photo.
          </p>
          <p>
            <Term>Developer verification.</Term> For developer accounts: company name,
            registration number, tax registration and identification documents for
            directors. We need these to verify that a business listing property is real.
          </p>
          <p>
            <Term>Activity on the platform.</Term> Properties you save, inquiries you
            send, viewings you book, reservations you make, and messages you exchange with
            developers.
          </p>
          <p>
            <Term>Usage data.</Term> Pages viewed and how you arrived, so developers can
            see interest in their listings and we can understand what is working.
          </p>
          <p>
            <Term>Payment data.</Term> Handled by our payment providers. Card numbers are
            never stored on our systems — we keep only a token, the last four digits and
            the card type.
          </p>
        </Clause>

        <Clause id="why-we-use-it" title="Why we use it">
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
        </Clause>

        <Clause id="who-we-share-with" title="Who we share it with">
          <p>
            <Term>Developers</Term> receive your name and contact details when you send an
            inquiry, book a viewing or reserve a unit — they need these to respond.
          </p>
          <p>
            <Term>Service providers</Term> who host our infrastructure, store media, send
            email and process payments, each bound to use the data only for that purpose.
          </p>
          <p>
            <Term>Authorities</Term>, where we are legally required to disclose.
          </p>
        </Clause>

        <Clause id="how-long" title="How long we keep it">
          <p>
            Account data for as long as your account is open, and for a period afterwards
            where we are required to retain records. Verification documents for as long as
            the developer is active, plus any statutory retention period. Transaction
            records for seven years, as tax law requires.
          </p>
        </Clause>

        <Clause id="your-rights" title="Your rights">
          <p>
            Under the Data Protection Act you may request access to your data, correction
            of anything inaccurate, deletion, restriction of how it is processed, and a
            portable copy. You can object to processing, and withdraw consent where
            processing relies on it.
          </p>
          <p>
            Write to <MailLink email="info@e-resi.com" /> and we will respond within the
            statutory period. You also have the right to complain to the Office of the Data
            Protection Commissioner.
          </p>
        </Clause>

        <Clause id="security" title="Security">
          <p>
            Data is transmitted over encrypted connections and passwords are hashed with
            bcrypt. Access to production data is restricted, and administrative actions on
            the platform are recorded in an audit log.
          </p>
        </Clause>

        <Clause id="cookies" title="Cookies">
          <p>
            We use cookies that are necessary to keep you signed in and to remember your
            preferences, plus analytics to understand how the platform is used. We do not
            use advertising cookies.
          </p>
        </Clause>

        <Clause id="changes" title="Changes">
          <p>
            We will post any changes to this policy on this page and update the date above.
            Material changes will be notified to account holders directly.
          </p>
        </Clause>
      </LegalBody>
    </PageShell>
  );
}
