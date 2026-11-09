import Link from 'next/link';
import type { Area } from '../../lib/seo/areas';

/** The area guide's own words, trimmed — what living there is like. */
export function AreaAbout({ area }: { area: Area }) {
  const parts = [
    { title: `About ${area.name}`, body: area.description },
    { title: 'Living there', body: area.lifestyle },
    { title: 'Schools nearby', body: area.schools },
    { title: 'Getting around', body: area.transport },
  ].filter((p) => p.body && p.body.trim());
  if (!parts.length) return null;
  return (
    <section className="mt-12">
      <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
        {parts.map((p) => (
          <div key={p.title}>
            <h2 className="text-[18px] font-medium text-[#18181b]">{p.title}</h2>
            <p className="mt-2 line-clamp-6 whitespace-pre-line text-[15px] leading-relaxed text-[#52525b]">{p.body}</p>
          </div>
        ))}
      </div>
      <Link href={`/neighbourhoods/${area.slug}`} className="mt-5 inline-block text-[15px] text-[#18181b] underline underline-offset-4">
        Read the full {area.name} area guide
      </Link>
    </section>
  );
}

/**
 * Links across the area pages: the other side of the market here, and the
 * same side in other areas — how a crawler (and a browsing renter) finds
 * every area page.
 */
export function AreaLinks({ area, areas, kind }: { area?: Area; areas: Area[]; kind: 'rent' | 'buy' }) {
  const count = (a: Area) => (kind === 'rent' ? a.rentCount : a.propertyCount);
  const others = areas.filter((a) => a.slug !== area?.slug && count(a) > 0)
    .sort((a, b) => count(b) - count(a));
  const cross = area && (kind === 'rent' ? area.propertyCount : area.rentCount) > 0;
  if (!others.length && !cross) return null;

  return (
    <section className="mt-12 border-t border-[#ececec] pt-8">
      {cross && area && (
        <p className="mb-5 text-[15px] text-[#52525b]">
          {kind === 'rent' ? 'Looking to buy? ' : 'Looking to rent? '}
          <Link href={kind === 'rent' ? `/properties/in/${area.slug}` : `/rent/in/${area.slug}`}
            className="text-[#18181b] underline underline-offset-4">
            {kind === 'rent'
              ? `${area.propertyCount} development${area.propertyCount === 1 ? '' : 's'} for sale in ${area.name}`
              : `${area.rentCount} rental${area.rentCount === 1 ? '' : 's'} in ${area.name}`}
          </Link>
        </p>
      )}
      {others.length > 0 && (
        <>
          <h2 className="text-[18px] font-medium text-[#52525b]">
            {kind === 'rent' ? (area ? 'Rentals in other areas' : 'Rentals by area') : (area ? 'Property for sale in other areas' : 'Property for sale by area')}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {others.map((a) => (
              <li key={a.slug}>
                <Link href={kind === 'rent' ? `/rent/in/${a.slug}` : `/properties/in/${a.slug}`}
                  className="inline-block rounded-full bg-[#f2f2f2] px-4 py-2 text-[15px] text-[#18181b] hover:bg-[#e8e8e8]">
                  {a.name} <span className="text-[#9aa0a6]">{count(a)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
