import type { Metadata } from 'next';
import { PropertiesNavbar } from '../../../../components/marketplace/PropertiesNavbar';
import { NeighbourhoodPage } from '../../../../components/marketplace/NeighbourhoodPage';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.e-resi.com/api';
  try {
    const res = await fetch(`${base}/neighborhoods/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error('not found');
    const json = await res.json();
    const hood = json?.data ?? json;
    return {
      title: `${hood.name}, ${hood.city} — Area Guide`,
      description:
        hood.description?.slice(0, 160)
        ?? `Living in ${hood.name}, ${hood.city}: photos, location and the properties listed there on e-resi.`,
      alternates: { canonical: `/neighbourhoods/${slug}` },
    };
  } catch {
    return { title: 'Neighbourhood' };
  }
}

export default async function NeighbourhoodRoute({ params }: Props) {
  const { slug } = await params;
  return (
    <div className="min-h-screen bg-gray-50">
      <PropertiesNavbar />
      <NeighbourhoodPage slug={slug} />
    </div>
  );
}
