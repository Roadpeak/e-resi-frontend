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
      { label: 'List a Property', href: '/for-developers' },
      { label: 'Production Packages', href: '/for-developers' },
      { label: 'For Investors', href: '/for-investors' },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About e-resi', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Careers', href: '/careers' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },
];

export function FooterLight() {
  return (
    <footer className="border-t border-ink/[0.08] bg-[#e9edf7]">
      <div className="max-w-screen-xl mx-auto px-8 sm:px-14 lg:px-20 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-8 mb-20">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <Logo markSize={30} textClassName="text-ink text-2xl" />
            </div>
            <p className="text-ink/55 text-sm leading-relaxed max-w-xs">
              Immersive real estate experiences. Every property a world to explore.
            </p>
            <div className="w-6 h-px bg-resi-500 mt-6" />
          </div>

          {/* Columns */}
          {cols.map((col) => (
            <div key={col.heading}>
              <p className="text-[11px] tracking-[0.18em] uppercase text-ink/40 mb-5 font-semibold">{col.heading}</p>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-ink/60 text-sm hover:text-ink transition-colors duration-300"
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
        <div className="border-t border-ink/[0.08] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-ink/40 text-xs tracking-wide">
            © {new Date().getFullYear()} e-resi. All rights reserved.
          </p>
          <p className="text-ink/35 text-xs tracking-wide">
            Nairobi, Kenya
          </p>
        </div>
      </div>
    </footer>
  );
}
