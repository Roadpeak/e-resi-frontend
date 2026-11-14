import { OG_SIZE, OG_TYPE, entityCard, textCard } from '../../../../lib/seo/og-card';
import { apiGet } from '../../../../lib/seo/server-fetch';
import type { Neighborhood } from '../../../../lib/api/neighborhoods';

export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const alt = 'Neighbourhood guide on E-resi';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await apiGet<Neighborhood>(`/neighborhoods/${slug}`, 300);
  if (r.status !== 'ok') return textCard({ eyebrow: 'Area guides', title: 'Where to live in Nairobi' });
  const n = r.data;
  return entityCard({
    eyebrow: 'Area guide',
    title: n.name,
    subtitle: `Living in ${n.name}, ${n.city}: homes for sale and to rent.`,
    image: n.heroImageUrl,
    imageKind: 'photo',
  });
}
