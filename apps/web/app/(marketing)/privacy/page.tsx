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

const UPDATED = '14 November 2026';

const CONTENTS = [
  { id: 'who-we-are', label: 'Who we are' },
  { id: 'what-we-collect', label: 'What we collect' },
  { id: 'why-we-use-it', label: 'Why we use it' },
  { id: 'who-we-share-with', label: 'Who we share it with' },
  { id: 'how-long', label: 'How long we keep it' },
  { id: 'your-rights', label: 'Your rights' },
  { id: 'security', label: 'Security' },
  { id: 'cookies', label: 'Cookies and storage' },
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
            e-resi is a property platform operating in Kenya. For the purposes of the Kenya
            Data Protection Act, 2019, e-resi is the data controller for the personal data
            described here. Developers, agents and owners who receive your details through
            e-resi are responsible for how they use them once received. You can reach us at{' '}
            <MailLink email="info@e-resi.com" />.
          </p>
        </Clause>

        <Clause id="what-we-collect" title="What we collect">
          <p>
            <Term>Account details.</Term> Your name, email address, phone number and password
            (stored only as a cryptographic hash, never in readable form), and optionally a
            profile photo. If you sign in with Google, we receive your name, email address and
            profile photo from Google.
          </p>
          <p>
            <Term>Business verification.</Term> For developer and agent accounts: company or
            trading name, registration and tax details, logo, public contact details and
            identification documents for directors or the individual agent. We need these to
            confirm that a business listing property is real. Where our team invites a
            business, we record who invited it and the details entered on the invitation.
          </p>
          <p>
            <Term>Listings and websites.</Term> Property and rental details, photos, videos and
            locations you upload, and the content of agent websites. You can choose to show
            only the area of a rental rather than its exact location.
          </p>
          <p>
            <Term>Enquiries and contact requests.</Term> Your name, phone number, email and
            message when you send an enquiry, book a viewing, reserve a unit, subscribe to an
            agent&apos;s newsletter, or leave your number to see an agent&apos;s phone number.
          </p>
          <p>
            <Term>Activity on the platform.</Term> Properties you save, chats with developers,
            agents and owners, reviews you write, and taps on call and WhatsApp buttons, so a
            listing&apos;s manager can see the interest it receives.
          </p>
          <p>
            <Term>Team activity.</Term> If you are invited as staff on a developer or agency
            account, the actions you take in that account are recorded and visible to the
            account holder.
          </p>
          <p>
            <Term>Visit analytics.</Term> When you visit e-resi, whether or not you are signed
            in, we record each page you view, the time you spend on it, the site, campaign or
            agent link that referred you, your IP address and the approximate location derived
            from it (country, region and city), and your device type, operating system,
            browser, screen size and language. Your browser stores a random identifier so we
            can tell repeat visits apart. If you are signed in, the visit is linked to your
            account. Aggregated figures are shown to the developer or agent whose listing you
            viewed; individual visit records are visible only to e-resi administrators. This
            data is never sold or used for advertising.
          </p>
          <p>
            <Term>Payment data.</Term> Card payments are handled by Paystack and M-Pesa
            payments by Safaricom. Card numbers are never stored on our systems; we keep only a
            token, the last four digits and the card type, plus invoices and M-Pesa
            transaction references.
          </p>
        </Clause>

        <Clause id="why-we-use-it" title="Why we use it">
          <p>
            To run your account and let you use the platform; to verify developers and agents
            before they are listed; to connect buyers, investors and tenants with the people
            who manage the listings they are interested in; to publish agent websites; to
            process payments and issue invoices; to send messages about your account,
            enquiries, viewings, reservations and billing; to prevent fraud and abuse; and to
            improve the product.
          </p>
          <p>
            We rely on performing our contract with you, our legitimate interest in running and
            securing the platform, legal obligations such as tax record-keeping, and your
            consent where we ask for it. We do not sell personal data.
          </p>
        </Clause>

        <Clause id="who-we-share-with" title="Who we share it with">
          <p>
            <Term>Developers, agents and owners</Term> receive your name and contact details
            when you send them an enquiry, book a viewing, reserve a unit, start a chat or
            leave your number to see theirs. Where an agent markets a developer&apos;s
            property, leads may be shared between the two so they can respond.
          </p>
          <p>
            <Term>The public</Term> sees what is meant to be public: listings, agent and
            developer profiles, agent websites and reviews, including the reviewer&apos;s first
            name.
          </p>
          <p>
            <Term>Service providers</Term> who act on our instructions: DigitalOcean (hosting),
            Cloudinary (photo and video storage), Cloudflare (custom domains and DNS), email
            delivery providers, Google (sign-in), Paystack and Safaricom (payments) and
            OpenStreetMap services (maps and address search). Some of these process data
            outside Kenya, under safeguards required by the Data Protection Act.
          </p>
          <p>
            <Term>Authorities</Term>, where we are legally required to disclose.
          </p>
        </Clause>

        <Clause id="how-long" title="How long we keep it">
          <p>
            Account data for as long as your account is open, and for a period afterwards
            where we are required to retain records. Verification documents for as long as the
            developer or agent is active, plus any statutory retention period. Enquiries,
            messages and leads for as long as the related account is open. Invoices and
            transaction records for seven years, as tax law requires. Visit analytics for up
            to 24 months, after which individual visit records are deleted.
          </p>
        </Clause>

        <Clause id="your-rights" title="Your rights">
          <p>
            Under the Data Protection Act you may request access to your data, correction of
            anything inaccurate, deletion, restriction of how it is processed, and a portable
            copy. You can object to processing, and withdraw consent where processing relies
            on it. To stop hearing from a developer, agent or owner you contacted, you can also
            ask them directly.
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
            bcrypt. Access to production data is restricted, staff access on business accounts
            is limited to the pages the account holder allows, and administrative actions on
            the platform are recorded in an audit log.
          </p>
        </Clause>

        <Clause id="cookies" title="Cookies and storage">
          <p>
            We use cookies that are necessary to keep you signed in, and browser storage to
            remember preferences such as saved homes, your chosen view and whether you have
            already shared your number with an agent in this session. Analytics use a random
            visitor identifier kept in your browser&apos;s storage (see Visit analytics above).
            You can clear these at any time by clearing your browser&apos;s site data. We do not
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
