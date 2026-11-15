import type { Metadata } from 'next';
import Link from 'next/link';
import { Box, Glasses, Hand, MousePointerClick, Rotate3d, ScanLine, ZoomIn } from 'lucide-react';
import { Navbar } from '../../../components/layout/Navbar';
import { Footer } from '../../../components/layout/Footer';
import { ModelShowcase } from '../../../components/showcase/ModelShowcase';
import { JsonLd, breadcrumbs } from '../../../components/seo/JsonLd';
import { fetchHome3D } from '../../../lib/api/site';

export const revalidate = 300;

export const metadata: Metadata = {
  title: '3D Property Demo — Explore a Development Inside and Out',
  description:
    'Try an interactive 3D property tour in your browser: turn the building, zoom in and step inside a unit. See how e-resi presents developments, homes and rentals in 3D and VR across Kenya.',
  alternates: { canonical: '/3d-demo' },
  openGraph: {
    title: 'Interactive 3D property demo | e-resi',
    description: 'Turn the building, zoom in, and switch between outside and inside. No app or headset needed.',
    url: '/3d-demo',
  },
};

const HOW = [
  { Icon: MousePointerClick, title: 'Drag to turn', body: 'Click and drag, or swipe on a phone, to walk around the model.' },
  { Icon: ZoomIn, title: 'Scroll or pinch to zoom', body: 'Move in close to read the finishes, or pull back to see the whole site.' },
  { Icon: Box, title: 'Outside and inside', body: 'Switch between the building and a unit laid out room by room.' },
  { Icon: Hand, title: 'Right-drag to pan', body: 'Slide the model across the view to focus on one part of it.' },
];

const OFFER = [
  { Icon: ScanLine, title: '3D scans of built units', body: 'A measured, walkable model of a real apartment or house, captured on site.' },
  { Icon: Rotate3d, title: '360° tours', body: 'Panoramic room-by-room tours that open in any browser.' },
  { Icon: Glasses, title: 'VR walkthroughs', body: 'The same development, headset-ready, for buyers who want to stand inside it.' },
];

export default async function ThreeDDemoPage() {
  const config = await fetchHome3D();
  const has = !!(config.exterior || config.interior);

  return (
    <main className="relative bg-ink text-chalk">
      <JsonLd data={breadcrumbs([{ name: 'Home', path: '/' }, { name: '3D demo', path: '/3d-demo' }])} />
      <Navbar />

      <section className="px-6 pb-16 pt-28 sm:px-14 sm:pt-32 lg:px-20">
        <div className="mx-auto max-w-screen-xl">
          <p className="mb-4 text-[10px] uppercase tracking-[0.25em] text-stone/50">Live demo</p>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="font-display font-light leading-[1.05] text-chalk" style={{ fontSize: 'clamp(2.4rem, 5vw, 4.5rem)' }}>
                See it in <em className="not-italic text-warm-400">3D.</em>
              </h1>
              <p className="mt-4 max-w-[58ch] font-google text-[16px] leading-relaxed text-stone/70 sm:text-[17px]">
                This is how buyers and tenants explore a property on e-resi before they visit. Turn the building, zoom in, and switch
                between the outside and a unit inside. It runs in your browser, with no app or headset.
              </p>
            </div>
          </div>

          {has ? (
            <ModelShowcase config={config} size="lg" />
          ) : (
            <div className="flex h-[60vh] min-h-[420px] flex-col items-center justify-center gap-3 rounded-[28px] border-[1.5px] border-[#FFE345] px-6 text-center font-google">
              <Box size={34} className="text-[#FFE345]" />
              <p className="text-[17px] font-medium">The demo is being prepared.</p>
              <p className="max-w-sm text-[14px] text-stone/60">Check back shortly, or browse homes that already have 3D tours.</p>
            </div>
          )}
        </div>
      </section>

      <section className="px-6 pb-20 sm:px-14 lg:px-20">
        <div className="mx-auto max-w-screen-xl">
          <h2 className="mb-8 font-google text-[13px] font-semibold uppercase tracking-[0.16em] text-[#FFE345]">How to explore</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {HOW.map(({ Icon, title, body }) => (
              <li key={title} className="rounded-[24px] border border-white/[0.08] p-6 font-google">
                <Icon size={22} className="text-[#FFE345]" />
                <h3 className="mt-4 text-[16px] font-semibold text-chalk">{title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-stone/60">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-6 pb-24 sm:px-14 lg:px-20">
        <div className="mx-auto max-w-screen-xl">
          <h2 className="font-display font-light leading-[1.1] text-chalk" style={{ fontSize: 'clamp(2rem, 3.6vw, 3.4rem)' }}>
            Give your property the same treatment.
          </h2>
          <p className="mt-4 max-w-[60ch] font-google text-[16px] leading-relaxed text-stone/70">
            e-resi produces 3D models, 360° tours, VR walkthroughs and cinematic film for developments, homes for sale and rentals across
            Kenya, then publishes them where buyers and tenants are looking.
          </p>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {OFFER.map(({ Icon, title, body }) => (
              <li key={title} className="rounded-[24px] bg-white/[0.04] p-6 font-google">
                <Icon size={22} className="text-[#FFE345]" />
                <h3 className="mt-4 text-[16px] font-semibold text-chalk">{title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-stone/60">{body}</p>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap gap-3 font-google">
            <Link href="/services" className="rounded-full bg-[#FFE345] px-6 py-3 text-[15px] font-semibold text-[#14120a] hover:bg-[#FFDB1F]">
              Get 3D and VR tours for your property
            </Link>
            <Link href="/properties?has3DTour=true" className="rounded-full border border-white/20 px-6 py-3 text-[15px] font-medium text-chalk hover:border-white/40">
              Browse homes with 3D tours
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
