import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { PropertiesNavbar } from '../../../components/marketplace/PropertiesNavbar';
import { FooterLight } from '../../../components/layout/FooterLight';
import { JsonLd, breadcrumbs, itemList } from '../../../components/seo/JsonLd';
import { fetchAreas } from '../../../lib/seo/areas';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Nairobi Area Guides — Where to Live, Rent and Buy',
  description:
    'Area guides for Nairobi neighbourhoods: what living there is like, schools, getting around, and the homes for sale and to rent in each area.',
  alternates: { canonical: '/neighbourhoods' },
  openGraph: {
    siteName: 'E-resi',
    title: 'Nairobi Area Guides — E-resi',
    description: 'Where to live in Nairobi: area by area, with homes for sale and to rent.',
    url: '/neighbourhoods',
    type: 'website',
  },
};

/** Every area guide, with what is for sale and to rent in each. */
export default async function Neighbourhoods() {
  const areas = (await fetchAreas()).sort((a, b) =>
    (b.propertyCount + b.rentCount) - (a.propertyCount + a.rentCount) || a.name.localeCompare(b.name));
  const byCity = new Map<string, typeof areas>();
  for (const a of areas) byCity.set(a.city, [...(byCity.get(a.city) ?? []), a]);

  return (
    <div className="min-h-screen bg-white">
      <JsonLd data={breadcrumbs([{ name: 'Home', path: '/' }, { name: 'Area guides', path: '/neighbourhoods' }])} />
      <JsonLd data={itemList('Area guides', areas.map((a) => ({ url: `/neighbourhoods/${a.slug}`, name: `${a.name}, ${a.city}`, image: a.heroImageUrl })))} />
      <PropertiesNavbar />
      <main className="mx-auto max-w-[1200px] px-4 pb-20 pt-24 sm:px-6">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-[13.5px] text-[#6b6b70]">
          <Link href="/" className="hover:text-[#111112]">Home</Link><span>/</span>
          <span className="text-[#111112]">Area guides</span>
        </nav>
        <h1 className="text-[30px] font-semibold tracking-[-0.02em] text-[#18181b] sm:text-[38px]">Area guides</h1>
        <p className="mt-2 max-w-2xl text-[16px] leading-relaxed text-[#52525b]">
          Choosing where to live comes before choosing a home. Each guide covers what the area is like,
          schools and getting around, and every home currently for sale or to rent there.
        </p>

        {areas.length === 0 && <p className="mt-10 text-[15px] text-[#71717a]">Area guides are on their way.</p>}

        {[...byCity.entries()].map(([city, list]) => (
          <section key={city} className="mt-12">
            <h2 className="text-[20px] font-medium text-[#18181b]">{city}</h2>
            <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((a) => (
                <article key={a.slug} className="overflow-hidden rounded-2xl border border-[#ececec] bg-white">
                  <Link href={`/neighbourhoods/${a.slug}`} className="relative block aspect-[16/10] bg-[#f2f2f2]">
                    {(a.heroImageUrl || a.photos?.[0]) && (
                      <Image src={(a.heroImageUrl || a.photos[0]) as string} alt={`${a.name}, ${a.city}`} fill
                        sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
                    )}
                  </Link>
                  <div className="p-5">
                    <h3 className="text-[18px] font-medium text-[#18181b]">
                      <Link href={`/neighbourhoods/${a.slug}`} className="hover:underline">{a.name}</Link>
                    </h3>
                    {a.description && <p className="mt-1.5 line-clamp-3 text-[14.5px] leading-relaxed text-[#52525b]">{a.description}</p>}
                    <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[14px]">
                      <Link href={`/properties/in/${a.slug}`} className="text-[#18181b] underline underline-offset-2">
                        {a.propertyCount} for sale
                      </Link>
                      <Link href={`/rent/in/${a.slug}`} className="text-[#18181b] underline underline-offset-2">
                        {a.rentCount} to rent
                      </Link>
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </main>
      <FooterLight />
    </div>
  );
}
