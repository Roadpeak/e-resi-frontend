import type { Metadata } from 'next';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { HeroSection } from '../../components/marketplace/HeroSection';
import { PropertyShowcase } from '../../components/marketplace/PropertyShowcase';
import { ManifestoSection } from '../../components/marketplace/ManifestoSection';
import { SplitFeature } from '../../components/marketplace/SplitFeature';
import { AudienceSection } from '../../components/marketplace/AudienceSection';

export const metadata: Metadata = {
  // The homepage title IS the full brand title, so it must bypass the root
  // layout's `%s | E-resi` template (an `absolute` title does that) — a plain
  // string here would render as "E-resi — ... | E-resi".
  title: { absolute: "E-resi — Invest in Kenya's Properties Digitally" },
  description:
    "Invest in Kenya's properties digitally. Tour your apartment virtually in cinematic, 3D and VR modes, then buy Kenya's top properties. Verified property developer listings across Nairobi and beyond.",
  alternates: { canonical: '/' },
  openGraph: {
    // openGraph is replaced wholesale, not merged, with the layout's — siteName
    // has to be repeated here or it silently drops off this page's OG tags.
    siteName: 'E-resi',
    title: "E-resi — Invest in Kenya's Properties Digitally",
    description:
      "Cinematic, 3D and VR property tours. Verified property developer listings and property investment for buyers across Kenya.",
    url: '/',
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <main className="relative bg-ink text-chalk">
      <Navbar />
      <HeroSection />
      <PropertyShowcase />
      <ManifestoSection />
      <SplitFeature />
      <AudienceSection />
      <Footer />
    </main>
  );
}
