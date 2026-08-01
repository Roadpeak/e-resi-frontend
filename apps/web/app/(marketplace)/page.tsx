import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { HeroSection } from '../../components/marketplace/HeroSection';
import { PropertyShowcase } from '../../components/marketplace/PropertyShowcase';
import { ManifestoSection } from '../../components/marketplace/ManifestoSection';
import { SplitFeature } from '../../components/marketplace/SplitFeature';

export default function HomePage() {
  return (
    <main className="relative bg-ink text-chalk">
      <Navbar />
      <HeroSection />
      <PropertyShowcase />
      <ManifestoSection />
      <SplitFeature />
      <Footer />
    </main>
  );
}
