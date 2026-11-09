import type { Metadata } from 'next';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

interface Props { params: Promise<{ slug: string; typeId: string }> }

/** A layout link is shared on its own, so it carries its own title. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, typeId } = await params;
  try {
    const res = await fetch(`${API_BASE}/properties/${slug}/unit-types/${typeId}`, { next: { revalidate: 60 } });
    if (!res.ok) return { title: 'Layout not found' };
    const json = await res.json();
    const t = json.data ?? json;
    const title = `${t.name} — ${t.property?.name ?? ''}`;
    const left = t.counts?.total ? ` ${t.counts.available} of ${t.counts.total} left.` : '';
    const description = `${t.bedrooms === 0 ? 'Studio' : `${t.bedrooms} bedroom`} layout at ${t.property?.name}.${left} Photos, video and tours.`;
    return {
      title: { absolute: title },
      description,
      alternates: { canonical: `/${slug}/types/${typeId}` },
      openGraph: {
        siteName: t.property?.developer?.companyName || 'E-resi',
        title, description, url: `/${slug}/types/${typeId}`, type: 'website',
        ...(t.coverImageUrl ? { images: [t.coverImageUrl] } : {}),
      },
      twitter: { card: 'summary_large_image', title, description },
    };
  } catch {
    return { title: 'Layout' };
  }
}

export default function TypeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
