import type { Metadata } from 'next';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { HeroSection } from '../../components/marketplace/HeroSection';
import { PropertyShowcase } from '../../components/marketplace/PropertyShowcase';
import { ManifestoSection } from '../../components/marketplace/ManifestoSection';
import { SplitFeature } from '../../components/marketplace/SplitFeature';
import { AudienceSection } from '../../components/marketplace/AudienceSection';
import { fetchFeaturedProperties } from '../../lib/api/fetch-property';

export const metadata: Metadata = {
  // The homepage title IS the full brand title, so it must bypass the root
  // layout's `%s | E-resi` template (an `absolute` title does that) — a plain
  // string here would render as "E-resi — ... | E-resi".
  title: { absolute: 'E-resi — Sell Your Development Off-Plan | Kenya' },
  description:
    'Sell your development off-plan. We produce the cinematic, 3D and VR tours and hand you a '
    + 'branded page buyers walk before they commit.',
  alternates: { canonical: '/' },
  openGraph: {
    // openGraph is replaced wholesale, not merged, with the layout's — siteName
    // has to be repeated here or it silently drops off this page's OG tags.
    siteName: 'E-resi',
    title: 'E-resi — Sell Your Development Off-Plan with Cinematic, 3D & VR Tours',
    description:
      'Production, a branded mini-site and one sales dashboard for Kenyan property developers. '
      + 'Buyers, investors and tenants tour before they commit.',
    url: '/',
    type: 'website',
  },
};

export default async function HomePage() {
  // Featured developments for the showcase. Fetched here rather than in the
  // component so the cards are server-rendered; returns [] if the API is
  // unreachable, and the showcase drops itself when there is nothing to show.
  const featured = await fetchFeaturedProperties(6);

  return (
    <main className="relative bg-ink text-chalk">
      <Navbar />
      <HeroSection />
      <PropertyShowcase properties={featured} />
      <ManifestoSection />
      <SplitFeature />
      <AudienceSection />
      <Footer />
    </main>
  );
}
