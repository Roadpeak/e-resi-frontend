import type { Metadata } from 'next';
import Link from 'next/link';
import { ContentShell, Faq, faqSchema } from '../../../components/seo/ContentShell';
import { JsonLd, breadcrumbs } from '../../../components/seo/JsonLd';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description:
    'Answers for buyers, tenants, agents and developers on e-resi: tours, viewings, reservations, payments, listing, pricing and verification.',
  alternates: { canonical: '/faq' },
  openGraph: { siteName: 'E-resi', title: 'FAQ — E-resi', description: 'Answers for buyers, tenants, agents and developers.', url: '/faq', type: 'website' },
};

const GROUPS: { id: string; title: string; more?: { label: string; href: string }; items: [string, string][] }[] = [
  {
    id: 'buyers',
    title: 'Buying',
    more: { label: 'Guide to buying off-plan', href: '/guides/buying-off-plan-in-kenya' },
    items: [
      ['Is e-resi free for buyers?', 'Yes. Browsing, tours, saving properties, chatting with developers and agents and booking viewings are all free.'],
      ['What are cinematic, 3D and VR tours?', 'A cinematic tour is a film-style walkthrough; a 3D tour lets you move room by room at your own pace; a VR tour can be viewed in a headset. Developments show whichever tours they have.'],
      ['Can I see a property with someone guiding me?', 'Yes. Many developments offer live guided tours on a video call, so a sales agent can walk you through and answer questions in real time.'],
      ['Do I pay for a unit through e-resi?', 'No. You reserve and agree the purchase with the developer, and payments go directly to the developer’s account named in your sale agreement. e-resi helps you track the reservation.'],
      ['Are developers verified?', 'Developers submit company registration, tax and director identity documents, which our team reviews before their developments go live.'],
      ['Can I buy from outside Kenya?', 'Yes. Tours and live guided tours let you view remotely; see our guide to buying from abroad for the paperwork and safe payment steps.'],
    ],
  },
  {
    id: 'renting',
    title: 'Renting',
    more: { label: 'Guide to renting in Nairobi', href: '/guides/renting-in-nairobi' },
    items: [
      ['How do I enquire about a rental?', 'Open the listing and send an enquiry, request a viewing, or contact the landlord or agent by WhatsApp or phone from the page.'],
      ['Who manages the rentals listed?', 'Each rental is managed by its developer, landlord or the agent they have appointed; the listing shows who you are dealing with.'],
      ['Should I pay before viewing?', 'No. Never pay a deposit or fee for a home you have not viewed, and pay only through traceable channels to the landlord or managing agent.'],
    ],
  },
  {
    id: 'agents',
    title: 'For agents',
    more: { label: 'Everything agents can do', href: '/for-agents' },
    items: [
      ['What does e-resi cost an agent?', 'A flat monthly fee, priced separately for agencies and independent agents, with the first month free. See the pricing page for current prices.'],
      ['Can I list my own properties and rentals?', 'Yes. Agents list sales and rentals they hold, and sell developers’ projects through mandates and partnerships.'],
      ['Do agents get a website?', 'Yes. Agents can publish a website from our templates on their own e-resi address or a domain they own, filled automatically with their listings.'],
      ['How is my commission tracked?', 'Leads from your links and listings are credited to you, and each deal is recorded with its value and your commission on a record you and the developer share.'],
    ],
  },
  {
    id: 'developers',
    title: 'For developers',
    more: { label: 'Selling off-plan with e-resi', href: '/for-developers' },
    items: [
      ['Does e-resi take a commission on sales?', 'No. Production is paid once per development and listing is a flat monthly fee. The full sale price is yours.'],
      ['Can you produce tours for a building not yet built?', 'Yes. CGI walkthroughs are built from your architectural plans, and construction updates are published as the building goes up.'],
      ['How long does verification take?', 'Usually about one working day once we have your company registration, tax registration and director ID.'],
    ],
  },
];

export default function FaqPage() {
  const all = GROUPS.flatMap((g) => g.items);
  return (
    <ContentShell trail={[{ name: 'Home', path: '/' }, { name: 'FAQ' }]}>
      <JsonLd data={faqSchema(all)} />
      <JsonLd data={breadcrumbs([{ name: 'Home', path: '/' }, { name: 'FAQ', path: '/faq' }])} />
      <h1 className="text-[32px] font-semibold tracking-[-0.02em] text-[#18181b] sm:text-[40px]">Frequently asked questions</h1>
      <p className="mt-3 text-[17px] leading-relaxed text-[#52525b]">
        For buyers, tenants, agents and developers. Can’t find your answer? <Link href="/contact" className="text-[#18181b] underline underline-offset-2">Contact us</Link>.
      </p>
      <nav className="mt-6 flex flex-wrap gap-2">
        {GROUPS.map((g) => (
          <a key={g.id} href={`#${g.id}`} className="rounded-full bg-[#f2f2f2] px-4 py-1.5 text-[14.5px] text-[#18181b] hover:bg-[#e8e8e8]">{g.title}</a>
        ))}
      </nav>
      {GROUPS.map((g) => (
        <section key={g.id} id={g.id} className="mt-12 scroll-mt-24">
          <h2 className="mb-4 text-[22px] font-medium text-[#18181b]">{g.title}</h2>
          <Faq items={g.items} />
          {g.more && (
            <Link href={g.more.href} className="mt-4 inline-block text-[15px] text-[#18181b] underline underline-offset-4">{g.more.label} →</Link>
          )}
        </section>
      ))}
    </ContentShell>
  );
}
