import Link from 'next/link';
import { Logo } from '../brand/Logo';

const cols = [
  {
    heading: 'Platform',
    links: [
      { label: 'Browse Properties', href: '/properties' },
      { label: 'New Developments', href: '/properties?status=off_plan' },
      { label: '3D Tours', href: '/properties?has3DTour=true' },
      { label: 'VR Experiences', href: '/properties?hasVRTour=true' },
    ],
  },
  {
    heading: 'Developers',
    links: [
      { label: 'List a Property', href: '/dashboard' },
      { label: 'Production Packages', href: '/dashboard/developments/new' },
      { label: 'Analytics', href: '/dashboard/analytics' },
      { label: 'Pricing', href: '/dashboard' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About e-resi', href: '/' },
      { label: 'Contact', href: '/' },
      { label: 'Careers', href: '/' },
      { label: 'Privacy Policy', href: '/' },
    ],
  },
];

export function FooterLight() {
  return (
    <footer className="bg-white border-t border-ink/[0.06]">
      <div className="max-w-screen-xl mx-auto px-8 sm:px-14 lg:px-20 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-8 mb-20">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <Logo markSize={30} textClassName="text-ink text-2xl" />
            </div>
            <p className="text-ink/40 text-sm leading-relaxed max-w-xs">
              Immersive real estate experiences. Every property a world to explore.
            </p>
            <div className="w-6 h-px bg-warm-500 mt-6" />
          </div>

          {/* Columns */}
          {cols.map((col) => (
            <div key={col.heading}>
              <p className="text-[10px] tracking-[0.2em] uppercase text-ink/25 mb-5">{col.heading}</p>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-ink/45 text-sm hover:text-ink transition-colors duration-300"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="border-t border-ink/[0.06] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-ink/25 text-xs tracking-wide">
            © {new Date().getFullYear()} e-resi. All rights reserved.
          </p>
          <p className="text-ink/20 text-xs tracking-wide">
            Nairobi, Kenya
          </p>
        </div>
      </div>
    </footer>
  );
}
