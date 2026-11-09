import Link from 'next/link';
import { JsonLd, PUBLIC_API, breadcrumbs, itemList } from '../seo/JsonLd';

interface Row {
  slug: string;
  name: string;
  neighborhood?: string | null;
  city?: string | null;
  priceFrom?: number | null;
  currency?: string | null;
  heroImageUrl?: string | null;
}

async function fetchProperties(category?: string): Promise<Row[]> {
  try {
    const qs = new URLSearchParams({ limit: '100', ...(category ? { category } : {}) });
    const res = await fetch(`${PUBLIC_API}/properties?${qs}`, { next: { revalidate: 600 } });
    if (!res.ok) return [];
    const json = await res.json();
    const d = json.data?.data ?? json.data ?? [];
    return Array.isArray(d) ? d : [];
  } catch {
    return [];
  }
}

const price = (r: Row) =>
  r.priceFrom ? `from ${r.currency ?? 'KES'} ${Math.round(r.priceFrom).toLocaleString('en-KE')}` : null;

/**
 * Server-rendered index of every development on a browse page.
 *
 * The interactive list above it loads in the browser (filters, map, shuffle),
 * so without this a crawler's first pass finds no development links at all.
 * It is a plain, visible directory — useful to people scanning by area too.
 */
export async function PropertyDirectory({
  title, category, path, label,
}: { title: string; category?: string; path: string; label: string }) {
  const rows = await fetchProperties(category);
  const trail = [{ name: 'Home', path: '/' }, { name: label, path }];

  const byCity = new Map<string, Row[]>();
  for (const r of rows) {
    const c = r.city || 'Kenya';
    byCity.set(c, [...(byCity.get(c) ?? []), r]);
  }

  return (
    <>
      <JsonLd data={itemList(label, rows.map((r) => ({ url: `/${r.slug}`, name: r.name, image: r.heroImageUrl })))} />
      <JsonLd data={breadcrumbs(trail)} />
      {rows.length > 0 && (
        <section className="border-t border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
            <h2 className="text-[18px] font-semibold text-gray-900">{title}</h2>
            <div className="mt-5 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[...byCity.entries()].map(([city, list]) => (
                <div key={city}>
                  <h3 className="mb-2 text-[13px] font-medium uppercase tracking-wide text-gray-500">{city}</h3>
                  <ul className="space-y-1.5">
                    {list.map((r) => (
                      <li key={r.slug} className="text-[14px] leading-snug">
                        <Link href={`/${r.slug}`} className="text-gray-900 hover:underline">{r.name}</Link>
                        <span className="text-gray-500">
                          {[r.neighborhood, price(r)].filter(Boolean).map((t) => ` · ${t}`).join('')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
