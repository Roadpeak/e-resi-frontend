import type { Metadata } from 'next';
import { fetchProperty } from '../../../../../lib/api/fetch-property';

/**
 * Metadata for a single unit.
 *
 * The page itself is a client component, so it cannot export metadata — which
 * is why a unit link previously inherited the root layout's marketing title
 * ("E-resi — Sell Property Off-Plan…"). A unit URL is one of the most-shared
 * links on the platform, since it is what a sales agent sends about a specific
 * apartment, and every one of those shares was advertising us rather than the
 * unit.
 */

interface Props {
  params: Promise<{ slug: string; unitId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, unitId } = await params;
  const property = await fetchProperty(slug);
  if (!property) return { title: 'Unit not found' };

  const unit = property.units?.find((u) => u.id === unitId);
  const developer = property.developer?.name;
  const where = [property.address?.neighborhood, property.address?.city]
    .filter(Boolean)
    .join(', ');

  // `absolute` bypasses the root "… | E-resi" template: this is the
  // developer's own sales page, so our name does not belong in the tab of a
  // link they shared.
  const title = unit
    ? `${unit.name} — ${property.name}`
    : property.name;

  const description = unit
    ? `${unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms} bedroom`}`
      + `${unit.sqm ? `, ${unit.sqm} m²` : ''} at ${property.name}`
      + `${where ? ` in ${where}` : ''}. Tour it in 3D and VR before you commit.`
    : `Units at ${property.name}${where ? ` in ${where}` : ''}.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/${slug}/units/${unitId}` },
    openGraph: {
      // A WhatsApp preview shows this above the title, so it carries the
      // developer rather than us.
      siteName: developer || 'E-resi',
      title,
      description,
      url: `/${slug}/units/${unitId}`,
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default function UnitLayout({ children }: { children: React.ReactNode }) {
  return children;
}
