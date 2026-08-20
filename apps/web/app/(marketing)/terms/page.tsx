import type { Metadata } from 'next';
import {
  PageShell,
  LegalBody,
  Clause,
  MailLink,
} from '../../../components/marketing/PageShell';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The terms governing use of e-resi by developers, buyers, investors and tenants.',
  alternates: { canonical: '/terms' },
};

const UPDATED = '2 August 2026';

const CONTENTS = [
  { id: 'accepting', label: '1. Accepting these terms' },
  { id: 'what-eresi-is', label: '2. What e-resi is' },
  { id: 'accounts', label: '3. Accounts' },
  { id: 'developer-obligations', label: '4. Developer obligations' },
  { id: 'production', label: '5. Production services' },
  { id: 'fees', label: '6. Fees' },
  { id: 'reservations', label: '7. Reservations' },
  { id: 'acceptable-use', label: '8. Acceptable use' },
  { id: 'ip', label: '9. Intellectual property' },
  { id: 'liability', label: '10. Liability' },
  { id: 'termination', label: '11. Termination' },
  { id: 'governing-law', label: '12. Governing law' },
  { id: 'contact', label: '13. Contact' },
];

export default function TermsPage() {
  return (
    <PageShell
      eyebrow="Legal"
      title="Terms of Service"
      lede={`The agreement between you and e-resi. Last updated ${UPDATED}.`}
    >
      <LegalBody contents={CONTENTS}>
        <Clause id="accepting" title="1. Accepting these terms">
          <p>
            By creating an account or using e-resi you agree to these terms. If you are
            accepting on behalf of a company, you confirm you are authorised to do so.
          </p>
        </Clause>

        <Clause id="what-eresi-is" title="2. What e-resi is">
          <p>
            e-resi is a platform where verified property developers list developments and
            rentals, and where buyers, investors and tenants can view them, tour them
            immersively, make enquiries, book viewings and reserve units.
          </p>
          <p>
            e-resi is not a party to any sale or tenancy agreement. We are not an estate
            agent, and we do not hold client funds for property transactions.
          </p>
        </Clause>

        <Clause id="accounts" title="3. Accounts">
          <p>
            You must give accurate information and keep your password secure. You are
            responsible for activity under your account. Tell us promptly if you believe it
            has been compromised.
          </p>
          <p>
            Developer accounts require KYB verification before listing. We may decline or
            withdraw verification where information cannot be confirmed.
          </p>
        </Clause>

        <Clause id="developer-obligations" title="4. Developer obligations">
          <p>
            If you list on e-resi you confirm you have the right to market the property, and
            that pricing, availability, unit details and completion dates are accurate and
            kept current.
          </p>
          <p>
            You must respond to enquiries and reservations in good faith, and honour
            availability shown on your listings. Listings that are misleading may be
            removed.
          </p>
        </Clause>

        <Clause id="production" title="5. Production services">
          <p>
            Where you order production — photography, film, 3D scanning, VR capture or CGI —
            those services are provided under the pricing shown at the time of order.
            Production is scheduled after payment and after site access is arranged.
          </p>
          <p>
            You grant e-resi a licence to host and display the resulting media on the
            platform and to use it in marketing the platform. You retain ownership of your
            brand and underlying property.
          </p>
        </Clause>

        <Clause id="fees" title="6. Fees">
          <p>
            Production is charged per development, once. Listing is charged monthly per live
            development and begins when the development goes live. Current pricing is shown
            on the pricing page and in your dashboard before you commit.
          </p>
          <p>
            We may change pricing with notice. Changes do not affect production already paid
            for.
          </p>
        </Clause>

        <Clause id="reservations" title="7. Reservations">
          <p>
            Reserving a unit through e-resi expresses serious interest and holds the unit for
            the period shown. It is not a contract of sale or a lease. Any binding agreement
            is made directly between you and the developer.
          </p>
          <p>
            A developer may release a reservation where terms cannot be agreed. Any deposit
            arrangements are between you and the developer.
          </p>
        </Clause>

        <Clause id="acceptable-use" title="8. Acceptable use">
          <p>
            Do not post unlawful, misleading or infringing content; scrape or copy listings
            and media; attempt to gain unauthorised access; or use the platform to harass
            anyone. We may suspend accounts that breach these terms.
          </p>
        </Clause>

        <Clause id="ip" title="9. Intellectual property">
          <p>
            The platform, its software and its immersive tour technology belong to e-resi.
            Media we produce is licensed to you for marketing the property it depicts.
            Listing content you upload remains yours, licensed to us so we can display it.
          </p>
        </Clause>

        <Clause id="liability" title="10. Liability">
          <p>
            The platform is provided as-is. We do not warrant that listings are free of
            error, and we are not liable for the conduct of developers, buyers or tenants,
            or for any transaction made between them.
          </p>
          <p>Nothing here limits liability that cannot be limited under Kenyan law.</p>
        </Clause>

        <Clause id="termination" title="11. Termination">
          <p>
            You may close your account at any time. We may suspend or close an account that
            breaches these terms, or where verification is withdrawn. Fees already paid for
            production are non-refundable once production has been scheduled.
          </p>
        </Clause>

        <Clause id="governing-law" title="12. Governing law">
          <p>
            These terms are governed by the laws of Kenya, and the courts of Kenya have
            exclusive jurisdiction.
          </p>
        </Clause>

        <Clause id="contact" title="13. Contact">
          <p>
            Questions about these terms: <MailLink email="info@e-resi.com" />.
          </p>
        </Clause>
      </LegalBody>
    </PageShell>
  );
}
