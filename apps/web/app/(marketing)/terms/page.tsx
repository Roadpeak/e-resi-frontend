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
    'The terms governing use of e-resi by developers, agents, owners, buyers, investors and tenants.',
  alternates: { canonical: '/terms' },
};

const UPDATED = '14 November 2026';

const CONTENTS = [
  { id: 'accepting', label: '1. Accepting these terms' },
  { id: 'what-eresi-is', label: '2. What e-resi is' },
  { id: 'accounts', label: '3. Accounts and verification' },
  { id: 'teams', label: '4. Teams and staff access' },
  { id: 'listings', label: '5. Listings and rentals' },
  { id: 'agents', label: '6. Agents and partnerships' },
  { id: 'agent-websites', label: '7. Agent websites and domains' },
  { id: 'production', label: '8. Production services' },
  { id: 'fees', label: '9. Fees and payment' },
  { id: 'enquiries', label: '10. Enquiries, contact details and viewings' },
  { id: 'reservations', label: '11. Reservations and transactions' },
  { id: 'reviews', label: '12. Reviews and messages' },
  { id: 'acceptable-use', label: '13. Acceptable use' },
  { id: 'ip', label: '14. Intellectual property' },
  { id: 'liability', label: '15. Liability' },
  { id: 'termination', label: '16. Suspension and termination' },
  { id: 'changes', label: '17. Changes to these terms' },
  { id: 'governing-law', label: '18. Governing law' },
  { id: 'contact', label: '19. Contact' },
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
            By creating an account, accepting an invitation or otherwise using e-resi you agree
            to these terms and to our Privacy Policy. If you accept on behalf of a company or
            agency, you confirm you are authorised to bind it.
          </p>
        </Clause>

        <Clause id="what-eresi-is" title="2. What e-resi is">
          <p>
            e-resi is a property platform in which verified developers market developments,
            including off-plan, and verified agents market properties for sale and to rent.
            Owners may let units they own, directly or through an agent. Buyers, investors and
            tenants can browse listings, take cinematic, 3D and VR tours, chat, send enquiries,
            book viewings and reserve units.
          </p>
          <p>
            e-resi provides the tools; it is not a party to any sale, lease or agency agreement
            and does not act as an estate agent for any listing. Payments for units, deposits
            and rent are made directly between the parties and are not held by e-resi.
          </p>
        </Clause>

        <Clause id="accounts" title="3. Accounts and verification">
          <p>
            You must give accurate information, keep your password secure and tell us promptly
            if you believe your account has been compromised. You are responsible for activity
            under your account. You may sign in with email and password or with Google.
          </p>
          <p>
            Developer and agent accounts are verified (KYB) before they are listed publicly.
            e-resi may also verify a business by personal invitation from our team, in which
            case the account is approved when the invitation is accepted. We may request
            further information, and decline or withdraw verification where details cannot be
            confirmed or turn out to be inaccurate.
          </p>
        </Clause>

        <Clause id="teams" title="4. Teams and staff access">
          <p>
            Developers and agencies may invite staff to their account and choose which parts
            of it each person can use. Staff act on behalf of the account holder, who is
            responsible for what they do and for removing access when it is no longer needed.
            Account holders can see their staff&apos;s activity within the account.
          </p>
        </Clause>

        <Clause id="listings" title="5. Listings and rentals">
          <p>
            If you list on e-resi you confirm you have the right to market the property, and
            that prices, availability, unit details, photographs and completion dates are
            accurate and kept current. Rentals may be listed as units within a development or
            as a single home on its own.
          </p>
          <p>
            You may choose to show only the area of a rental rather than its exact location.
            You remain responsible for the accuracy of what you do show. Listings that are
            misleading, duplicated or no longer available may be paused or removed.
          </p>
        </Clause>

        <Clause id="agents" title="6. Agents and partnerships">
          <p>
            Developers may work with agents through e-resi by assigning developments to them
            for sale or letting. The commercial terms of that relationship, including any
            commission, are agreed between the developer and the agent; e-resi charges no
            commission on sales or lettings.
          </p>
          <p>
            Owners who engage an agent to let their unit agree the terms of that engagement
            with the agent. Leads that arrive through an agent&apos;s link or listing are
            attributed to that agent.
          </p>
        </Clause>

        <Clause id="agent-websites" title="7. Agent websites and domains">
          <p>
            Agents may publish a website on an e-resi address or on their own domain, built
            from their profile, listings and content. Templates marked premium are unlocked
            with a one-time payment. A custom domain is connected once any applicable fee is
            paid, and you must own or control the domain you connect.
          </p>
          <p>
            You are responsible for the content of your website. It must comply with section
            13, and we may take a site offline if it does not.
          </p>
        </Clause>

        <Clause id="production" title="8. Production services">
          <p>
            Where you order production — photography, film, 3D scanning, VR capture or CGI —
            it is provided under the pricing shown at the time of order and scheduled after
            payment and once site access is arranged.
          </p>
          <p>
            You grant e-resi a licence to host and display the resulting media on the platform
            and to use it in marketing the platform. You retain ownership of your brand and the
            underlying property.
          </p>
        </Clause>

        <Clause id="fees" title="9. Fees and payment">
          <p>
            e-resi is free to start, and we do not take commission on sales or lettings.
            Optional and paid features include development listing fees (one-time or monthly,
            per development), monthly agent fees, premium website templates, custom domains
            and production. The price and billing cycle of anything you pay for is shown in
            your dashboard before you commit, and some may be waived.
          </p>
          <p>
            Payments are made by card or M-Pesa through our payment providers, against an
            invoice. Monthly fees are billed in advance. If a monthly fee is unpaid after a
            grace period, the related listing or profile is paused until it is paid; your
            account and data are kept.
          </p>
          <p>
            We may change prices with at least seven days&apos; notice. A change applies from
            your next billing date and does not affect anything already paid for. Production
            is non-refundable once scheduled.
          </p>
        </Clause>

        <Clause id="enquiries" title="10. Enquiries, contact details and viewings">
          <p>
            When you send an enquiry, book a viewing, start a chat or ask to see an
            agent&apos;s phone number, the details you give are shared with the developer,
            agent or owner who manages that listing, so they can contact you. Some agents show
            their number only after you have left yours.
          </p>
          <p>
            Developers, agents and owners must use those details only to respond about the
            property or service you asked about, and must not add you to marketing without
            your consent.
          </p>
        </Clause>

        <Clause id="reservations" title="11. Reservations and transactions">
          <p>
            Reserving a unit through e-resi expresses serious interest and holds the unit for
            the period shown. It is not a contract of sale or a lease. Any binding agreement,
            deposit or payment is made directly between you and the developer, agent or owner,
            and a reservation may be released if terms cannot be agreed.
          </p>
        </Clause>

        <Clause id="reviews" title="12. Reviews and messages">
          <p>
            Reviews must reflect your genuine experience with the agent or developer you
            review. We may remove reviews that are false, abusive or made with a conflict of
            interest. Messages sent through e-resi are stored so both sides can refer back to
            them.
          </p>
        </Clause>

        <Clause id="acceptable-use" title="13. Acceptable use">
          <p>
            Do not post unlawful, misleading, discriminatory or infringing content; list
            property you are not entitled to market; scrape or copy listings, media or contact
            details; attempt to gain unauthorised access; send spam; or use the platform to
            harass anyone. We may remove content and suspend accounts that breach these terms.
          </p>
        </Clause>

        <Clause id="ip" title="14. Intellectual property">
          <p>
            The platform, its software, website templates and immersive tour technology belong
            to e-resi. Media we produce is licensed to you for marketing the property it
            depicts. Content you upload — listings, photos, logos and website text — remains
            yours, licensed to us so we can display it on e-resi and on your website.
          </p>
        </Clause>

        <Clause id="liability" title="15. Liability">
          <p>
            The platform is provided as-is. We do not warrant that listings are free of error,
            and we are not liable for the conduct of developers, agents, owners, buyers or
            tenants, or for any transaction made between them.
          </p>
          <p>Nothing here limits liability that cannot be limited under Kenyan law.</p>
        </Clause>

        <Clause id="termination" title="16. Suspension and termination">
          <p>
            You may close your account at any time. We may suspend or close an account that
            breaches these terms, where verification is withdrawn, or where required by law.
            Closing an account takes its listings and website offline.
          </p>
        </Clause>

        <Clause id="changes" title="17. Changes to these terms">
          <p>
            We may update these terms as e-resi changes. We will post the new version here and
            update the date above, and tell account holders directly about material changes.
            Continuing to use e-resi after a change means you accept it.
          </p>
        </Clause>

        <Clause id="governing-law" title="18. Governing law">
          <p>
            These terms are governed by the laws of Kenya, and the courts of Kenya have
            exclusive jurisdiction.
          </p>
        </Clause>

        <Clause id="contact" title="19. Contact">
          <p>
            Questions about these terms: <MailLink email="info@e-resi.com" />.
          </p>
        </Clause>
      </LegalBody>
    </PageShell>
  );
}
