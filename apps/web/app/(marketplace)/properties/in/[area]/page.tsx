import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PropertiesNavbar } from '../../../../../components/marketplace/PropertiesNavbar';
import { PropertyListCard } from '../../../../../components/marketplace/PropertyListCard';
import { AreaAbout, AreaLinks } from '../../../../../components/seo/AreaSections';
import { JsonLd, PUBLIC_API, SITE_URL, breadcrumbs, itemList } from '../../../../../components/seo/JsonLd';
import { toProperty } from '../../../../../lib/api/queries';
import { areaRobots, bedroomPhrase, fetchArea, fetchAreas, money, placeSchema } from '../../../../../lib/seo/areas';
import type { Property } from '../../../../../lib/types';

export const revalidate = 600;

interface Props { params: Promise<{ area: string }> }

/* eslint-disable @typescript-eslint/no-explicit-any */
async function developments(slug: string): Promise<any[]> {
  try {
    const res = await fetch(`${PUBLIC_API}/neighborhoods/${encodeURIComponent(slug)}/properties?limit=50`, { next: { revalidate: 600 } });
    if (!res.ok) return [];
    const json = await res.json();
    const d = json.data?.data ?? json.data ?? [];
    return Array.isArray(d) ? d : [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { area: slug } = await params;
  const area = await fetchArea(slug);
  if (!area) return { title: 'Area not found' };
  const n = area.propertyCount;
  const title = `Property for Sale in ${area.name}, ${area.city}`;
  const description = n
    ? `${n} development${n === 1 ? '' : 's'} for sale in ${area.name}, ${area.city}: off-plan and ready apartments and homes with cinematic, 3D and VR tours, floor plans and unit availability.`
    : `Apartments and homes for sale in ${area.name}, ${area.city}. New developments appear here as soon as they are listed.`;
  return {
    title,
    description,
    alternates: { canonical: `/properties/in/${slug}` },
    robots: areaRobots(n),
    openGraph: { siteName: 'E-resi', title, description, url: `/properties/in/${slug}`, type: 'website', ...(area.heroImageUrl ? { images: [area.heroImageUrl] } : {}) },
  };
}

export default async function PropertiesArea({ params }: Props) {
  const { area: slug } = await params;
  const [area, areas, raw] = await Promise.all([fetchArea(slug), fetchAreas(), developments(slug)]);
  if (!area) notFound();

  const list = raw.map(toProperty) as unknown as Property[];
  const prices = raw.map((p) => p.priceFrom).filter((v: unknown): v is number => typeof v === 'number' && v > 0);
  const currency = raw.find((p) => p.priceFrom)?.currency ?? 'KES';
  const offPlan = raw.filter((p) => p.status === 'OFF_PLAN' || (p.completionDate && new Date(p.completionDate) > new Date())).length;
  const beds = bedroomPhrase(raw.flatMap((p) => (p.unitTypes ?? []).map((t: any) => t.bedrooms)));
  const summary = list.length === 0
    ? `No developments are listed in ${area.name} right now. New ones appear here as soon as they are listed.`
    : [
        `${list.length} development${list.length === 1 ? '' : 's'} for sale in ${area.name}`,
        prices.length ? `from ${money(Math.min(...prices), currency)}` : null,
        offPlan ? `${offPlan} off-plan` : null,
        beds ? `${beds} homes` : null,
      ].filter(Boolean).join(', ') + '.';

  const path = `/properties/in/${slug}`;
  return (
    <div className="min-h-screen bg-white">
      <JsonLd data={breadcrumbs([
        { name: 'Home', path: '/' }, { name: 'Properties', path: '/properties' }, { name: area.name, path },
      ])} />
      <JsonLd data={placeSchema(area, `${SITE_URL}${path}`)} />
      {list.length > 0 && <JsonLd data={itemList(`Property for sale in ${area.name}`, list.map((p) => ({ url: `/${p.slug}`, name: p.name, image: p.heroImageUrl })))} />}
      <PropertiesNavbar />
      <main className="mx-auto max-w-[1100px] px-4 pb-20 pt-24 sm:px-6">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-[13.5px] text-[#6b6b70]">
          <Link href="/" className="hover:text-[#111112]">Home</Link><span>/</span>
          <Link href="/properties" className="hover:text-[#111112]">Properties</Link><span>/</span>
          <span className="text-[#111112]">{area.name}</span>
        </nav>
        <h1 className="text-[30px] font-semibold tracking-[-0.02em] text-[#18181b] sm:text-[36px]">
          Property for sale in {area.name}, {area.city}
        </h1>
        <p className="mt-2 max-w-2xl text-[16px] text-[#52525b]">{summary}</p>

        {list.length > 0 && (
          <div className="mt-8 flex flex-col gap-4">
            {list.map((p, i) => <PropertyListCard key={p.id} property={p} index={i} />)}
          </div>
        )}

        <AreaAbout area={area} />
        <AreaLinks area={area} areas={areas} kind="buy" />
      </main>
    </div>
  );
}
