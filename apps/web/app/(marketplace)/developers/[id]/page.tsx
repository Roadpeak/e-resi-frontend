import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Marcellus } from 'next/font/google';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { DeveloperProfilePage } from '../../../../components/directory/DeveloperProfile';
import { JsonLd, SITE_URL, breadcrumbs } from '../../../../components/seo/JsonLd';
import { apiGet, snippet } from '../../../../lib/seo/server-fetch';
import type { DeveloperProfileDetail } from '../../../../lib/api/developers';

// Optima-style display face: the developer page reads as the developer's own
// website, so it gets its own type rather than the marketplace's.
const marcellus = Marcellus({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-marcellus',
  display: 'swap',
});

interface Props {
  params: Promise<{ id: string }>;
}

const load = (id: string) => apiGet<DeveloperProfileDetail>(`/users/developers/id/${id}`, 300);

/** The developer's own name, not the site default, as the page title. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const r = await load(id);
  if (r.status !== 'ok') return { title: 'Developer', robots: { index: false, follow: true } };
  const d = r.data;
  const where = d.location ? ` in ${d.location}` : ' in Kenya';
  const n = d.properties?.length ?? 0;
  const title = `${d.companyName} — Property Developer${where}`;
  const description = snippet(d.description)
    ?? `${d.companyName}, a verified property developer${where}${n ? ` with ${n} development${n === 1 ? '' : 's'} on E-resi` : ''}. Tours, units and prices.`;
  return {
    title,
    description,
    alternates: { canonical: `/developers/${id}` },
    openGraph: { siteName: 'E-resi', title: `${d.companyName} — E-resi`, description, url: `/developers/${id}`, type: 'profile', ...(d.logoUrl ? { images: [d.logoUrl] } : {}) },
    twitter: { card: 'summary', title: `${d.companyName} — E-resi`, description },
  };
}

function developerSchema(d: DeveloperProfileDetail, id: string) {
  const sameAs = [d.website, ...Object.values(d.socials ?? {})].filter((u): u is string => !!u && /^https?:\/\//.test(u));
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/developers/${id}#org`,
    name: d.companyName,
    url: `${SITE_URL}/developers/${id}`,
    ...(d.logoUrl ? { logo: d.logoUrl } : {}),
    ...(d.description ? { description: snippet(d.description, 300) } : {}),
    ...(d.establishedYear ? { foundingDate: String(d.establishedYear) } : {}),
    address: { '@type': 'PostalAddress', ...(d.location ? { addressLocality: d.location } : {}), addressCountry: 'KE' },
    ...(sameAs.length ? { sameAs } : {}),
    ...(d.properties?.length ? {
      makesOffer: d.properties.slice(0, 20).map((p) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Residence', name: p.name, url: `${SITE_URL}/${p.slug}` },
      })),
    } : {}),
  };
}

export default async function DeveloperDetailRoute({ params }: Props) {
  const { id } = await params;
  const r = await load(id);
  if (r.status === 'missing') notFound();

  const qc = new QueryClient();
  if (r.status === 'ok') qc.setQueryData(['developer-profile', id], r.data);

  return (
    <div className={`${marcellus.variable} min-h-screen bg-white`}>
      {r.status === 'ok' && (
        <>
          <JsonLd data={developerSchema(r.data, id)} />
          <JsonLd data={breadcrumbs([
            { name: 'Home', path: '/' },
            { name: 'Developers', path: '/developers' },
            { name: r.data.companyName, path: `/developers/${id}` },
          ])} />
        </>
      )}
      <HydrationBoundary state={dehydrate(qc)}>
        <DeveloperProfilePage profileId={id} />
      </HydrationBoundary>
    </div>
  );
}
