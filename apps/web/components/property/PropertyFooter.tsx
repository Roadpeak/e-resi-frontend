import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, MapPin, Globe, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Property } from '../../lib/types';

interface Props {
  property: Property;
}

const accentMap: Record<string, string> = {
  residential: 'from-brand-600 to-brand-800',
  commercial: 'from-emerald-700 to-emerald-900',
  mixed_use: 'from-violet-700 to-violet-900',
  land: 'from-amber-700 to-amber-900',
};

const accentHoverTextMap: Record<string, string> = {
  residential: 'hover:text-brand-400',
  commercial: 'hover:text-emerald-400',
  mixed_use: 'hover:text-violet-400',
  land: 'hover:text-amber-400',
};

const accentBorderMap: Record<string, string> = {
  residential: 'border-brand-500/20',
  commercial: 'border-emerald-500/20',
  mixed_use: 'border-violet-500/20',
  land: 'border-amber-500/20',
};

export function PropertyFooter({ property }: Props) {
  const accent = accentMap[property.category] ?? accentMap.residential;
  const accentHoverText = accentHoverTextMap[property.category] ?? accentHoverTextMap.residential;
  const accentBorder = accentBorderMap[property.category] ?? accentBorderMap.residential;
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
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white text-sm font-bold shrink-0', accent)}>
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
                    className={cn('text-sm text-gray-500 transition-colors', accentHoverText)}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className={cn('border-t py-6', accentBorder)}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            href="/properties"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to e-resi
          </Link>

          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} {property.developer.name} · Listed on{' '}
            <Link href="/" className="text-gray-500 hover:text-gray-700 transition-colors">e-resi</Link>
          </p>

          <p className="text-xs text-gray-400">
            All property details are provided by the developer.
          </p>
        </div>
      </div>
    </footer>
  );
}
