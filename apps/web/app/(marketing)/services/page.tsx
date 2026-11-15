import type { Metadata } from 'next';
import { PageShell, Section, CardGrid, FeatureCard, StepCard } from '../../../components/marketing/PageShell';
import { ServiceIcon } from '../../../components/services/ServiceIcon';
import { AccordionItem } from '../../../components/marketing/Accordion';
import { JsonLd, breadcrumbs } from '../../../components/seo/JsonLd';
import { ServiceRequestForm } from '../../../components/services/ServiceRequestForm';
import type { CatalogService } from '../../../lib/api/service-requests';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Property Photography, Drone, 3D & VR Tours in Kenya — Request a Quote',
  description:
    'Property media production across Kenya: photography, drone video, cinematic walkthroughs, 3D scans, VR and 360° tours and CGI for developers, agents, buyers, investors and tenants. Tell us what you need and get a quote within an hour.',
  alternates: { canonical: '/services' },
  openGraph: {
    title: 'Property media production in Kenya — request a quote | e-resi',
    description: 'Photography, drone, cinematic video, 3D scans, VR and 360° tours. Quote within an hour; pay by M-Pesa or card.',
    url: '/services',
  },
};

/** The live production catalogue, read at build and every 10 minutes after. */
async function fetchCatalog(): Promise<CatalogService[]> {
  try {
    const res = await fetch(`${API_BASE}/production-tiers/catalog`, { next: { revalidate: 600 } });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data?.services ?? []).filter((s: CatalogService & { isActive?: boolean }) => s.isActive !== false);
  } catch {
    return [];
  }
}

const CATEGORY_TITLE: Record<string, string> = {
  CAPTURE: 'Photography and video',
  IMMERSIVE: '3D, VR and immersive tours',
  MARKETING: 'Marketing',
  DESIGN: 'Design',
};

const AUDIENCES: [string, string][] = [
  ['Developers', 'Drone progress footage, CGI renders of off-plan projects, show-unit photography and VR tours that sell units to buyers who cannot visit.'],
  ['Agents', 'Listing photography, video walkthroughs and 360° tours that make your homes for sale and to rent stand out, and that you can use on your own website.'],
  ['Investors and buyers', 'An independent video inspection or 3D scan of a property before you commit, especially useful when you are buying from abroad.'],
  ['Tenants and landlords', 'A walkthrough video of a rental before you move, or a dated record of a unit’s condition at move-in and move-out.'],
];

const FAQS: [string, string][] = [
  ['How quickly will I get a quote?', 'Within an hour of sending your request, to your e-resi account and your email. The quote lists every item and its price, and comes as a downloadable PDF.'],
  ['Do I need a listed property to request a service?', 'No. Requests are not tied to an e-resi listing. Tell us where the property is, what you want produced and when, and we price it for you.'],
  ['What if the quote is not right?', 'Ask for changes from your request page or straight from the email. We revise it and send you a new quote.'],
  ['How do I pay?', 'Accept the quote and an invoice is issued at once. Pay it by M-Pesa or by card from your request page. Production is scheduled as soon as it is paid.'],
  ['Where do you work?', 'Across Kenya, with most shoots in Nairobi and its surrounding counties. Tell us the location and we will include any travel in the quote.'],
];

export default async function ServicesPage() {
  const services = await fetchCatalog();
  const groups = Object.entries(
    services.reduce<Record<string, CatalogService[]>>((acc, s) => {
      (acc[s.category] ??= []).push(s);
      return acc;
    }, {}),
  );

  return (
    <PageShell bare>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Property media production',
        serviceType: 'Real estate photography, drone video, 3D scanning and virtual tours',
        provider: { '@type': 'Organization', name: 'e-resi', url: 'https://e-resi.com' },
        areaServed: { '@type': 'Country', name: 'Kenya' },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Production services',
          itemListElement: services.map((s) => ({
            '@type': 'Offer',
            itemOffered: { '@type': 'Service', name: s.label, ...(s.description && { description: s.description }) },
          })),
        },
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQS.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
      }} />
      <JsonLd data={breadcrumbs([{ name: 'Home', path: '/' }, { name: 'Production services', path: '/services' }])} />


      {/* Opens straight on the services. */}
      <section className="mb-20 sm:mb-24">
        <h1 className="text-[30px] font-semibold leading-[1.15] tracking-tight text-ink sm:text-[40px]" style={{ textWrap: 'balance' }}>
          Property media production services
        </h1>
        <p className="mt-3 max-w-[60ch] text-[17px] leading-relaxed text-ink/60">
          Photography, drone, video, 3D scans and virtual tours across Kenya. Choose what you need and get a quote within an hour.
        </p>
        <div className="mt-10 space-y-12">
          {groups.map(([category, items]) => (
            <div key={category}>
              <h2 className="mb-5 text-[13px] font-semibold uppercase tracking-[0.16em] text-resi-600">{CATEGORY_TITLE[category] ?? category}</h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((s) => (
                  <li key={s.key} className="flex gap-4 rounded-[24px] bg-white p-6">
                    <ServiceIcon serviceKey={s.key} category={s.category} />
                    <div>
                      <h3 className="text-[17px] font-semibold tracking-tight text-ink">{s.label}</h3>
                      {s.description && <p className="mt-1.5 text-[15px] leading-relaxed text-ink/60">{s.description}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <a href="#request" className="mt-10 inline-flex items-center rounded-full bg-[#1a73e8] px-6 py-3 text-[15px] font-semibold text-white hover:bg-[#1765cc]">
          Request a quote
        </a>
      </section>

      <Section
        eyebrow="Request a quote"
        title="Tell us what you want produced."
        lede="Pick the services, tell us where and when, and add anything we should know. You sign in only when you send it, and what you’ve typed is kept."
      >
        <div id="request" className="mt-10 scroll-mt-28">
          <ServiceRequestForm services={services} />
        </div>
      </Section>

      <Section eyebrow="Who it’s for" title="For anyone with a property to show.">
        <div className="mt-10">
          <CardGrid cols={2}>
            {AUDIENCES.map(([t, b]) => <FeatureCard key={t} title={t}>{b}</FeatureCard>)}
          </CardGrid>
        </div>
      </Section>

      <Section eyebrow="How it works" title="From request to delivery.">
        <div className="mt-10">
          <CardGrid cols={3}>
            <StepCard step="Step 1" title="Send your request">What you need, where the property is, when you’d like it done, and any details.</StepCard>
            <StepCard step="Step 2" title="Quote within an hour">In your account and your inbox, with a PDF you can download and share.</StepCard>
            <StepCard step="Step 3" title="Accept or adjust">Accept the quote, or ask for changes and we’ll send a revised one.</StepCard>
            <StepCard step="Step 4" title="Pay by M-Pesa or card">Accepting issues your invoice. Pay it from your request page.</StepCard>
            <StepCard step="Step 5" title="We shoot and deliver">We schedule the crew, produce the work and deliver it to you.</StepCard>
            <StepCard step="Track it" title="Every step, in one place">Your request page shows the quote, the invoice and progress.</StepCard>
          </CardGrid>
        </div>
      </Section>

      <Section eyebrow="Questions" title="Production services, answered.">
        <div className="mt-8 space-y-3">
          {FAQS.map(([q, a], i) => (
            <AccordionItem key={q} question={q} defaultOpen={i === 0}>{a}</AccordionItem>
          ))}
        </div>
      </Section>
    </PageShell>
  );
}
