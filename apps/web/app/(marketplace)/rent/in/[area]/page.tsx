import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { RentHeader, RentShell } from '../../../../../components/rent/RentShell';
import { RentCard } from '../../../../../components/rent/RentCard';
import { AreaAbout, AreaLinks } from '../../../../../components/seo/AreaSections';
import { JsonLd, SITE_URL, breadcrumbs, itemList } from '../../../../../components/seo/JsonLd';
import { rentListingsApi, toRentListing } from '../../../../../lib/api/rent-listings';
import { areaRobots, bedroomPhrase, fetchArea, fetchAreas, money, placeSchema } from '../../../../../lib/seo/areas';

// Per request: the rent shell reads ?view=, and the listings change daily.
export const dynamic = 'force-dynamic';

interface Props { params: Promise<{ area: string }> }

async function rentals(area: string) {
  try {
    const res = await rentListingsApi.list({ area, limit: 100 });
    return res.data.map(toRentListing);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { area: slug } = await params;
  const area = await fetchArea(slug);
  if (!area) return { title: 'Area not found' };
  const n = area.rentCount;
  const title = `Houses & Apartments for Rent in ${area.name}, ${area.city}`;
  const description = n
    ? `${n} rental${n === 1 ? '' : 's'} in ${area.name}, ${area.city}: furnished and unfurnished homes with photos, tours, monthly rent and live availability.`
    : `Houses and apartments for rent in ${area.name}, ${area.city}. New rentals appear here as soon as they are listed.`;
  return {
    title,
    description,
    alternates: { canonical: `/rent/in/${slug}` },
    robots: areaRobots(n),
    openGraph: { siteName: 'E-resi', title, description, url: `/rent/in/${slug}`, type: 'website', ...(area.heroImageUrl ? { images: [area.heroImageUrl] } : {}) },
  };
}

export default async function RentArea({ params }: Props) {
  const { area: slug } = await params;
  const [area, areas, list] = await Promise.all([fetchArea(slug), fetchAreas(), rentals(slug)]);
  if (!area) notFound();

  const open = list.filter((l) => l.status !== 'fully_let');
  const prices = open.flatMap((l) => [l.priceFrom, l.priceTo]).filter((p) => p > 0);
  const beds = bedroomPhrase(open.flatMap((l) => (l.units ?? []).map((u) => u.bedrooms)));
  const currency = open[0]?.currency ?? 'KES';
  const summary = list.length === 0
    ? `No rentals are listed in ${area.name} right now. New homes appear here as soon as they are listed.`
    : [
        `${list.length} rental${list.length === 1 ? '' : 's'} in ${area.name}`,
        prices.length ? (Math.min(...prices) === Math.max(...prices)
          ? `at ${money(Math.min(...prices), currency)} a month`
          : `from ${money(Math.min(...prices), currency)} to ${money(Math.max(...prices), currency)} a month`) : null,
        beds ? `mostly ${beds}` : null,
      ].filter(Boolean).join(', ') + '.';

  const path = `/rent/in/${slug}`;
  return (
    <>
      <JsonLd data={breadcrumbs([
        { name: 'Home', path: '/' }, { name: 'Rent', path: '/rent' }, { name: area.name, path },
      ])} />
      <JsonLd data={placeSchema(area, `${SITE_URL}${path}`)} />
      {list.length > 0 && <JsonLd data={itemList(`Rentals in ${area.name}`, list.map((l) => ({ url: `/rent/${l.slug}`, name: l.name, image: l.heroImageUrl })))} />}
      <Suspense>
        <RentShell>
          <RentHeader title={`Houses and apartments for rent in ${area.name}, ${area.city}`} />
          <p className="-mt-4 mb-8 max-w-2xl text-[16px] text-[#52525b]">{summary}</p>

          {list.length > 0 && (
            <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-4">
              {list.map((l) => <RentCard key={l.id} listing={l} />)}
            </div>
          )}

          <AreaAbout area={area} />
          <AreaLinks area={area} areas={areas} kind="rent" />
        </RentShell>
      </Suspense>
    </>
  );
}
