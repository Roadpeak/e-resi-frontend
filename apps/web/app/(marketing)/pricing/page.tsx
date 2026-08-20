import type { Metadata } from 'next';
import {
  PageShell,
  Section,
  SplitSection,
  Card,
  CardGrid,
  HighlightCard,
  CtaBand,
  TextLink,
} from '../../../components/marketing/PageShell';
import { AccordionItem } from '../../../components/marketing/Accordion';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'What it costs to list a development on e-resi — production packages priced once per development, plus a flat monthly listing fee. No commission on sales.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    siteName: 'E-resi',
    title: 'e-resi pricing',
    description:
      'Production priced once per development, a flat monthly listing fee, and no commission on any sale.',
    url: '/pricing',
    type: 'website',
  },
};

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.e-resi.com/api';

interface Tier {
  tier: string;
  label: string;
  price: number;
  currency: string;
  features: string[];
}

interface Catalog {
  services: { key: string; label: string; category: string; price: number; currency: string; description?: string | null }[];
  listingFee: { monthly: number; currency: string; freeMonths: number };
  taxRatePercent: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  CAPTURE: 'Photography & film',
  IMMERSIVE: 'Immersive & 3D',
  MARKETING: 'Marketing content',
  DESIGN: 'Design & branding',
};

const NEVER_CHARGED = [
  'Commission on a sale or a let — the full price is yours.',
  'Per-lead fees. Inquiries, viewings and chat are included.',
  'Charges for buyers. Browsing, touring and reserving are free.',
  'A fee for your account, however many developments you manage.',
];

const FAQS = [
  [
    'When does the listing fee start?',
    'Only when a development goes live. Take it down — because it sold out or because you are not ready — and the fee stops. Your account itself is free.',
  ],
  [
    'Is production a subscription?',
    'No. Production is priced per development and paid once. You choose which services that development actually warrants.',
  ],
  [
    'Do you take a cut of the sale?',
    'Never. There is no commission on a sale or a let, however much the unit goes for.',
  ],
  [
    'What if a package does not fit my development?',
    'Order services individually instead. A completed block of flats needs less production than an off-plan tower, and you should only pay for what it needs.',
  ],
  [
    'How is it invoiced?',
    'Production is invoiced on order; listing fees are billed monthly in arrears.',
  ],
];

/**
 * Prices are admin-managed, so this page reads them from the API rather than
 * hardcoding. Revalidated hourly; a failed fetch renders the page without the
 * table instead of failing the build.
 */
async function getPricing(): Promise<{ tiers: Tier[]; catalog: Catalog | null }> {
  const [tiersRes, catalogRes] = await Promise.allSettled([
    fetch(`${API}/production-tiers/pricing`, { next: { revalidate: 3600 } }),
    fetch(`${API}/production-tiers/catalog`, { next: { revalidate: 3600 } }),
  ]);

  let tiers: Tier[] = [];
  let catalog: Catalog | null = null;

  if (tiersRes.status === 'fulfilled' && tiersRes.value.ok) {
    const json = await tiersRes.value.json();
    tiers = json.data ?? [];
  }
  if (catalogRes.status === 'fulfilled' && catalogRes.value.ok) {
    const json = await catalogRes.value.json();
    catalog = json.data ?? null;
  }

  return { tiers, catalog };
}

const money = (n: number, currency: string) =>
  n === 0 ? 'Included' : `${currency} ${n.toLocaleString()}`;

/**
 * Until an environment seeds its pricing tables the API falls back to the
 * built-in constants, whose label is the raw enum ("TOUR_CINEMATIC"). Present
 * that readably rather than shouting an identifier at visitors.
 */
function tierLabel(t: Tier): string {
  if (t.label && t.label !== t.tier) return t.label;
  const words = t.tier.toLowerCase().replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export default async function PricingPage() {
  const { tiers, catalog } = await getPricing();

  const grouped = (catalog?.services ?? []).reduce<Record<string, Catalog['services']>>(
    (acc, s) => {
      (acc[s.category] ||= []).push(s);
      return acc;
    },
    {},
  );

  return (
    <PageShell
      eyebrow="Pricing"
      title="Pay for production once. Pay to list monthly."
      lede="No charge for your account, no fee for leads, and no commission on any sale — however much the property sells for."
    >
      {catalog && (
        <Section eyebrow="Listing fee" title="One flat fee per live development." prose={false}>
          <Card accent className="p-10">
            <p className="text-[44px] font-semibold leading-none tracking-tight text-ink sm:text-[56px]">
              {catalog.listingFee.currency} {catalog.listingFee.monthly.toLocaleString()}
            </p>
            <p className="mt-3 text-[17px] text-ink/50">per development, per month</p>
            <p className="mt-6 max-w-[62ch] text-[16px] leading-relaxed text-ink/65">
              Charged only while a development is live. Take it down and the fee stops.
              Your account itself is free, however many developments you manage.
              {catalog.listingFee.freeMonths > 0 &&
                ` Your first ${catalog.listingFee.freeMonths} month${catalog.listingFee.freeMonths === 1 ? '' : 's'} are free.`}
            </p>
          </Card>
        </Section>
      )}

      {tiers.length > 0 && (
        <Section
          eyebrow="Production packages"
          title="Priced once, per development."
          lede="Pick the level of production the development warrants — a completed block of flats needs less than an off-plan tower."
          prose={false}
        >
          <CardGrid cols={2}>
            {tiers.map((t) => (
              <Card key={t.tier} accent className="flex flex-col">
                <h3 className="text-[22px] font-semibold tracking-tight text-ink">
                  {tierLabel(t)}
                </h3>
                <p className="mt-2 text-[26px] font-semibold tracking-tight text-resi-600">
                  {money(t.price, t.currency)}
                </p>
                {t.features?.length > 0 && (
                  <ul className="mt-5 space-y-2.5">
                    {t.features.map((f) => (
                      <li key={f} className="flex gap-3 text-[15px] leading-relaxed text-ink/65">
                        <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-resi-500" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            ))}
          </CardGrid>
        </Section>
      )}

      {Object.keys(grouped).length > 0 && (
        <Section
          eyebrow="À la carte"
          title="Or buy services individually."
          lede="If a package doesn't fit, order exactly what you need."
          prose={false}
        >
          <div className="space-y-5">
            {Object.entries(grouped).map(([category, services]) => (
              <Card key={category}>
                <h3 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-resi-600">
                  {CATEGORY_LABELS[category] ?? category}
                </h3>
                <dl className="mt-5 divide-y divide-ink/[0.07]">
                  {services.map((s) => (
                    <div
                      key={s.key}
                      className="flex flex-wrap items-baseline gap-3 py-4 first:pt-0 last:pb-0"
                    >
                      <dt className="min-w-0 flex-1">
                        <span className="text-[16px] text-ink">{s.label}</span>
                        {s.description && (
                          <span className="mt-0.5 block text-[14px] leading-relaxed text-ink/50">
                            {s.description}
                          </span>
                        )}
                      </dt>
                      <dd className="whitespace-nowrap text-[16px] font-semibold text-ink">
                        {s.currency} {s.price.toLocaleString()}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Card>
            ))}
          </div>
        </Section>
      )}

      <Section eyebrow="Never charged" title="What you will never see on an invoice." prose={false}>
        <CardGrid cols={4}>
          {NEVER_CHARGED.map((t) => (
            <HighlightCard key={t}>{t}</HighlightCard>
          ))}
        </CardGrid>
        {catalog && catalog.taxRatePercent > 0 && (
          <p className="mt-8 text-[15px] text-ink/50">
            Prices exclude VAT at {catalog.taxRatePercent}%. Production is invoiced on
            order; listing fees monthly in arrears.
          </p>
        )}
      </Section>

      <SplitSection
        eyebrow="FAQ"
        title="Frequently asked questions"
        lede="Answers to what developers ask about cost."
        aside={<TextLink href="/contact">Ask us something else →</TextLink>}
      >
        {FAQS.map(([q, a], i) => (
          <AccordionItem key={q} question={q} defaultOpen={i === 0}>
            {a}
          </AccordionItem>
        ))}
      </SplitSection>

      <CtaBand
        title="Not sure which package fits?"
        lede="Tell us about the development and we'll tell you what it needs — including when it needs less than you think."
        primary={{ label: 'Talk to us', href: '/contact' }}
        secondary={{ label: 'How it works', href: '/for-developers' }}
      />
    </PageShell>
  );
}
