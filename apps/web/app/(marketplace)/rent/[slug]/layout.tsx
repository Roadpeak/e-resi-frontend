import type { Metadata } from 'next';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.e-resi.com/api';

interface Props { params: Promise<{ slug: string }> }

/** A rental link is shared on its own, so it carries the listing's own title. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await fetch(`${API_BASE}/rent-listings/${slug}`, { next: { revalidate: 120 } });
    if (!res.ok) return { title: 'Rental' };
    const json = await res.json();
    const l = json.data ?? json;
    const where = [l.neighborhood, l.city].filter(Boolean).join(', ');
    const rent = l.priceFrom ? ` from ${l.currency ?? 'KES'} ${Math.round(l.priceFrom).toLocaleString()}/month` : '';
    const title = `${l.name} — to rent${where ? ` in ${where}` : ''}`;
    const description = l.tagline || `${l.name}${where ? ` in ${where}` : ''}${rent}. Photos, tours and viewings on e-resi.`;
    return {
      title: { absolute: title },
      description,
      alternates: { canonical: `/rent/${slug}` },
      openGraph: { siteName: 'E-resi', title, description, url: `/rent/${slug}`, type: 'website', ...(l.heroImageUrl ? { images: [l.heroImageUrl] } : {}) },
      twitter: { card: 'summary_large_image', title, description },
    };
  } catch {
    return { title: 'Rental' };
  }
}

export default function RentListingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
