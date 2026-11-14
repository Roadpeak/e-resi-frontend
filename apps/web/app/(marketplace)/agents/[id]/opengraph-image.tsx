import { OG_SIZE, OG_TYPE, entityCard, initialsOf, textCard } from '../../../../lib/seo/og-card';
import { apiGet } from '../../../../lib/seo/server-fetch';
import type { Agent } from '../../../../lib/api/agents';

export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const alt = 'Property agent on E-resi';

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await apiGet<Agent>(`/agents/${id}`, 300);
  if (r.status !== 'ok') return textCard({ eyebrow: 'Agents', title: 'Property agents in Kenya' });
  const a = r.data;
  const rating = a.ratingCount > 0 ? ` · ${a.ratingAverage.toFixed(1)}★ from ${a.ratingCount} review${a.ratingCount === 1 ? '' : 's'}` : '';
  return entityCard({
    eyebrow: a.kind === 'COMPANY' ? 'Property agency' : 'Property agent',
    title: a.displayName,
    subtitle: `${a.location ?? 'Kenya'}${rating}`,
    image: a.logoUrl ?? a.photoUrl,
    imageKind: a.logoUrl ? 'logo' : 'photo',
    initials: initialsOf(a.displayName),
  });
}
