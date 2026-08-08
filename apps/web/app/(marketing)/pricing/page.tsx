import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell, Section } from '../../../components/marketing/PageShell';

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
        <Section title="Listing fee">
          <div className="rounded-3xl border border-gray-200 p-8">
            <p className="text-[40px] font-semibold leading-none text-gray-900">
              {catalog.listingFee.currency} {catalog.listingFee.monthly}
              <span className="ml-2 text-[17px] font-normal text-gray-500">
                per development, per month
              </span>
            </p>
            <p className="mt-4 text-[16px] leading-relaxed text-gray-600">
              Charged only while a development is live. Take it down and the fee stops.
              Your account itself is free, however many developments you manage.
              {catalog.listingFee.freeMonths > 0 &&
                ` Your first ${catalog.listingFee.freeMonths} month${catalog.listingFee.freeMonths === 1 ? '' : 's'} are free.`}
            </p>
          </div>
        </Section>
      )}

      {tiers.length > 0 && (
        <Section title="Production packages">
          <p className="mb-6">
            Priced once per development. Pick the level of production the development
            warrants — a completed block of flats needs less than an off-plan tower.
          </p>
          <div className="overflow-hidden rounded-3xl border border-gray-200">
            {tiers.map((t, i) => (
              <div
                key={t.tier}
                className={`flex flex-wrap items-baseline gap-4 p-6 ${i > 0 ? 'border-t border-gray-100' : ''}`}
              >
                <div className="min-w-0 flex-1">
                  <h3 className="text-[18px] font-semibold text-gray-900">{tierLabel(t)}</h3>
                  {t.features?.length > 0 && (
                    <p className="mt-1 text-[15px] leading-relaxed text-gray-600">
                      {t.features.join(' · ')}
                    </p>
                  )}
                </div>
                <p className="whitespace-nowrap text-[19px] font-semibold text-gray-900">
                  {money(t.price, t.currency)}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {Object.keys(grouped).length > 0 && (
        <Section title="Or buy services individually">
          <p className="mb-6">
            If a package doesn&apos;t fit, order exactly what you need.
          </p>
          <div className="space-y-8">
            {Object.entries(grouped).map(([category, services]) => (
              <div key={category}>
                <h3 className="mb-3 text-[15px] font-semibold uppercase tracking-wide text-gray-500">
                  {CATEGORY_LABELS[category] ?? category}
                </h3>
                <dl className="space-y-3">
                  {services.map((s) => (
                    <div key={s.key} className="flex flex-wrap items-baseline gap-3">
                      <dt className="min-w-0 flex-1">
                        <span className="text-[16px] text-gray-900">{s.label}</span>
                        {s.description && (
                          <span className="block text-[14px] leading-relaxed text-gray-500">
                            {s.description}
                          </span>
                        )}
                      </dt>
                      <dd className="whitespace-nowrap text-[16px] font-medium text-gray-900">
                        {s.currency} {s.price.toLocaleString()}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="What's never charged">
        <ul className="space-y-2">
          {[
            'Commission on a sale or a let — the full price is yours.',
            'Per-lead fees. Inquiries, viewings and chat are included.',
            'Charges for buyers. Browsing, touring and reserving are free.',
            'A fee for your account, however many developments you manage.',
          ].map((t) => (
            <li key={t} className="flex gap-3">
              <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </Section>

      {catalog && catalog.taxRatePercent > 0 && (
        <Section>
          <p className="text-[15px] text-gray-500">
            Prices exclude VAT at {catalog.taxRatePercent}%. Production is invoiced on
            order; listing fees monthly in arrears.
          </p>
        </Section>
      )}

      <Section>
        <div className="rounded-3xl bg-gray-900 p-8 text-white">
          <h2 className="text-[24px] font-semibold">Not sure which package fits?</h2>
          <p className="mt-3 text-[16px] leading-relaxed text-gray-300">
            Tell us about the development and we&apos;ll tell you what it needs — including
            when it needs less than you think.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="rounded-full bg-white px-6 py-2.5 text-[15px] font-medium text-gray-900 transition-colors hover:bg-gray-100"
            >
              Talk to us
            </Link>
            <Link
              href="/for-developers"
              className="rounded-full border border-white/25 px-6 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-white/10"
            >
              How it works
            </Link>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
