import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, MapPin, Globe, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Property } from '../../lib/types';

interface Props {
  property: Property;
  /** Top tier: drop e-resi attribution entirely. */
  whiteLabel?: boolean;
}

export function PropertyFooter({ property, whiteLabel = false }: Props) {
  const initials = (property.name ?? '').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <footer className="border-t border-gray-200 bg-white">
      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">

          {/* Property identity */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              {property.logoUrl ? (
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200">
                  <Image src={property.logoUrl} alt={`${property.name} logo`} fill className="object-contain p-1" sizes="48px" />
                </span>
              ) : (
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold shrink-0"
                  style={{ backgroundColor: 'var(--brand)', color: 'var(--brand-on)' }}
                >
                  {initials}
                </div>
              )}
              <div>
                <h3 className="font-semibold text-gray-900">{property.name}</h3>
                <p className="text-xs font-medium text-gray-500">{property.developer.name}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs">{property.tagline}</p>

            <div className="mt-6 flex items-center gap-1.5 text-sm text-gray-500">
              <MapPin size={13} />
              <span>{property.address.neighborhood}, {property.address.city}</span>
            </div>
          </div>

          {/* Developer contact */}
          <div className="lg:col-span-1">
            <h4 className="mb-5 text-xs font-semibold uppercase tracking-widest text-gray-400">Developer</h4>
            <div className="flex items-center gap-3 mb-5">
              {property.developer?.logoUrl ? (
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <Image src={property.developer.logoUrl} alt={`${property.developer.name} logo`} fill className="object-contain p-1" sizes="40px" />
                </span>
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 border border-gray-200 text-xs font-bold text-gray-500">
                  {(property.developer?.name ?? '').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900 text-sm">{property.developer.name}</p>
                <p className="text-xs text-gray-500">{property.developer.establishedYear && `Est. ${property.developer.establishedYear}`}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-500 leading-relaxed">{property.developer.description}</p>
              {property.developer.website && (
                <a
                  href={property.developer.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm text-gray-500 hover:text-gray-900 transition-colors group"
                >
                  <Globe size={13} className="shrink-0" />
                  {property.developer.website.replace(/^https?:\/\//, '')}
                  <ExternalLink size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              )}
              <p className="text-sm text-gray-400">
                {property.developer.completedProjects} completed projects
              </p>
            </div>
          </div>

          {/* Quick links */}
          <div className="lg:col-span-1">
            <h4 className="mb-5 text-xs font-semibold uppercase tracking-widest text-gray-400">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Overview', href: '#overview' },
                { label: 'Gallery', href: '#gallery' },
                ...(property.has3DTour ? [{ label: '3D Tour', href: '#viewer3d' }] : []),
                { label: 'Floor Plans', href: '#floorplans' },
                { label: 'Available Units', href: '#units' },
                { label: 'Location', href: '#location' },
                { label: 'Book a Viewing', href: '#booking' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="text-sm text-gray-500 transition-colors hover:[color:var(--brand-text)]"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar — the one place our attribution belongs. The topbar now
          carries the developer's identity instead, so this is where e-resi
          takes credit without competing with them for the page. */}
      <div className="border-t py-6" style={{ borderColor: 'var(--brand-border)' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} {property.developer.name}
          </p>

          {/* White-label removes this entirely — the top tier a developer pays
              for. The free tier keeps it, which is also what stops the
              mini-site becoming a standalone microsite they could take
              elsewhere. */}
          {!whiteLabel && (
            <Link
              href="/"
              className="text-xs text-gray-400 transition-colors hover:text-gray-600"
            >
              Tours by <span className="font-semibold text-gray-500">e-resi</span>
            </Link>
          )}

          <p className="text-xs text-gray-400">
            All property details are provided by the developer.
          </p>
        </div>
      </div>
    </footer>
  );
}
