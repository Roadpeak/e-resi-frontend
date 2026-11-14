import { OG_SIZE, OG_TYPE, entityCard, initialsOf, textCard } from '../../../../lib/seo/og-card';
import { apiGet } from '../../../../lib/seo/server-fetch';
import type { DeveloperProfileDetail } from '../../../../lib/api/developers';

export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const alt = 'Property developer on E-resi';

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await apiGet<DeveloperProfileDetail>(`/users/developers/id/${id}`, 300);
  if (r.status !== 'ok') return textCard({ eyebrow: 'Developers', title: 'Property developers in Kenya' });
  const d = r.data;
  const n = d.properties?.length ?? 0;
  return entityCard({
    eyebrow: 'Property developer',
    title: d.companyName,
    subtitle: [d.location, n ? `${n} development${n === 1 ? '' : 's'} on E-resi` : null].filter(Boolean).join(' · ') || 'Kenya',
    image: d.logoUrl,
    imageKind: 'logo',
    initials: initialsOf(d.companyName),
  });
}
