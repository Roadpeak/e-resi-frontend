import Link from 'next/link';
import { notFound } from 'next/navigation';
import { pageHref } from '../../lib/seo/paging';
import { JsonLd, PUBLIC_API, breadcrumbs, itemList } from '../seo/JsonLd';
import { AreaLinks } from '../seo/AreaSections';
import { fetchAreas } from '../../lib/seo/areas';

interface Row {
  slug: string;
  name: string;
  neighborhood?: string | null;
  city?: string | null;
  priceFrom?: number | null;
  currency?: string | null;
  heroImageUrl?: string | null;
}

/** Same page size and order as the interactive list above, so ?page=N means the same homes in both. */
export const DIRECTORY_PAGE_SIZE = 12;

async function fetchProperties(category: string | undefined, page: number): Promise<{ rows: Row[]; total: number | null }> {
  try {
    const qs = new URLSearchParams({ page: String(page), limit: String(DIRECTORY_PAGE_SIZE), ...(category ? { category } : {}) });
    const res = await fetch(`${PUBLIC_API}/properties?${qs}`, { next: { revalidate: 600 } });
    if (!res.ok) return { rows: [], total: null };
    const json = await res.json();
    const d = json.data?.data ?? json.data ?? [];
    const total = json.data?.meta?.total ?? json.meta?.total ?? null;
    return { rows: Array.isArray(d) ? d : [], total: typeof total === 'number' ? total : null };
  } catch {
    return { rows: [], total: null };
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
  title, category, path, label, page = 1,
}: { title: string; category?: string; path: string; label: string; page?: number }) {
  const [{ rows, total }, areas] = await Promise.all([fetchProperties(category, page), fetchAreas()]);
  const totalPages = total !== null ? Math.max(1, Math.ceil(total / DIRECTORY_PAGE_SIZE)) : null;
  // A page past the end is not a page: 404 rather than an empty listing.
  if (page > 1 && totalPages !== null && page > totalPages) notFound();
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
            <h2 className="text-[18px] font-semibold text-gray-900">
              {title}
              {totalPages && totalPages > 1 && <span className="ml-2 text-[14px] font-normal text-gray-500">Page {page} of {totalPages}</span>}
            </h2>
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
            {/* Plain page links, rendered on the server: how a crawler reaches every development. */}
            {totalPages && totalPages > 1 && (
              <nav aria-label="Directory pages" className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px]">
                {page > 1 && <Link href={pageHref(path, page - 1)} rel="prev" className="font-medium text-gray-900 hover:underline">← Previous</Link>}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  n === page
                    ? <span key={n} aria-current="page" className="font-semibold text-gray-900">{n}</span>
                    : <Link key={n} href={pageHref(path, n)} className="text-gray-600 hover:text-gray-900 hover:underline">{n}</Link>
                ))}
                {page < totalPages && <Link href={pageHref(path, page + 1)} rel="next" className="font-medium text-gray-900 hover:underline">Next →</Link>}
              </nav>
            )}
            <AreaLinks areas={areas} kind="buy" />
          </div>
        </section>
      )}
    </>
  );
}
