'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import {
  Building2,
  MapPin, BedDouble, Maximize2, Users, Calendar, Film, Box,
  ArrowLeft, CheckCircle2, Loader2,
} from 'lucide-react';
import { RentNavbar } from '../../../../components/rent/RentNavbar';
import { rentListingsApi, toRentListing } from '../../../../lib/api/rent-listings';
import { ChatWithDeveloper } from '../../../../components/chat/ChatWithDeveloper';
import { formatPrice } from '../../../../lib/utils';

const FURNISHING_LABELS: Record<string, string> = {
  furnished: 'Furnished',
  semi_furnished: 'Semi-Furnished',
  unfurnished: 'Unfurnished',
  FURNISHED: 'Furnished',
  SEMI_FURNISHED: 'Semi-Furnished',
  UNFURNISHED: 'Unfurnished',
};

const STATUS_STYLES: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  partially_available: 'bg-orange-100 text-orange-600',
  fully_let: 'bg-gray-100 text-gray-500',
  AVAILABLE: 'bg-green-100 text-green-700',
  PARTIALLY_AVAILABLE: 'bg-orange-100 text-orange-600',
  FULLY_LET: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  partially_available: 'Partially Available',
  fully_let: 'Fully Let',
  AVAILABLE: 'Available',
  PARTIALLY_AVAILABLE: 'Partially Available',
  FULLY_LET: 'Fully Let',
};

export default function RentListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const { data: raw, isLoading, isError } = useQuery({
    queryKey: ['rent-listing', slug],
    queryFn: () => rentListingsApi.get(slug),
    enabled: !!slug,
  });

  const listing = raw ? toRentListing(raw as any) : null;

  return (
    <div
      className="min-h-screen pt-16"
      style={{
        background: 'linear-gradient(135deg, #e8e6f0 0%, #f5f3ee 40%, #f0ece4 70%, #f5e8d8 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      <RentNavbar />

      {isLoading && (
        <div className="flex items-center justify-center py-32">
          <Loader2 size={28} className="animate-spin text-gray-400" />
        </div>
      )}

      {isError && (
        <div className="mx-auto max-w-2xl px-4 py-32 text-center">
          <p className="text-gray-500">Listing not found.</p>
          <Link href="/rent" className="mt-4 inline-flex items-center gap-2 text-sm text-brand-600 hover:underline">
            <ArrowLeft size={14} /> Back to rentals
          </Link>
        </div>
      )}

      {listing && (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          {/* Back */}
          <Link href="/rent" className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft size={14} /> All rentals
          </Link>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left col */}
            <div className="lg:col-span-2 space-y-6">
              {/* Hero */}
              <div className="relative aspect-video overflow-hidden rounded-2xl shadow-sm">
                {listing.heroImageUrl ? (
                  <Image src={listing.heroImageUrl} alt={listing.name} fill className="object-cover" sizes="(max-width:1024px) 100vw, 66vw" priority />
                ) : (
                  <div className="h-full w-full bg-gray-200" />
                )}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${STATUS_STYLES[listing.status] ?? 'bg-gray-100 text-gray-500'}`}>
                    {STATUS_LABELS[listing.status] ?? listing.status}
                  </span>
                  {listing.isFeatured && (
                    <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">Featured</span>
                  )}
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                  {listing.showCinematicTour && (
                    <span className="flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] text-white backdrop-blur-sm">
                      <Film size={10} /> Cinematic
                    </span>
                  )}
                  {listing.show3DTour && (
                    <span className="flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] text-white backdrop-blur-sm">
                      <Box size={10} /> 3D Tour
                    </span>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-1">
                  <MapPin size={13} />
                  <span>{listing.address.neighborhood}, {listing.address.city}</span>
                </div>
                <h1 className="text-2xl font-semibold text-gray-900">{listing.name}</h1>
                {listing.tagline && <p className="mt-1 text-gray-500">{listing.tagline}</p>}
              </div>

              {/* Description */}
              {listing.description && (
                <div className="rounded-2xl bg-white/70 p-5 shadow-sm">
                  <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-400">About</h2>
                  <p className="text-sm text-gray-700 leading-relaxed">{listing.description}</p>
                </div>
              )}

              {/* Units */}
              {listing.units.length > 0 && (
                <div className="rounded-2xl bg-white/70 p-5 shadow-sm">
                  <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">Available Units</h2>
                  <div className="space-y-3">
                    {listing.units.map((unit) => (
                      <div key={unit.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">{unit.label}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <BedDouble size={11} />
                              {unit.bedrooms === 0 ? 'Studio' : `${unit.bedrooms} bed`}
                            </span>
                            {unit.sqm > 0 && (
                              <span className="flex items-center gap-1"><Maximize2 size={11} /> {unit.sqm} m²</span>
                            )}
                            <span className="flex items-center gap-1"><Users size={11} /> {unit.available}/{unit.total} available</span>
                          </div>
                          {unit.features && unit.features.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {unit.features.map((f) => (
                                <span key={f} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500 capitalize">{f.replace(/-/g, ' ')}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-base font-bold text-gray-900">{formatPrice(unit.pricePerMonth, unit.currency)}</p>
                          <p className="text-xs text-gray-400">/month</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {listing.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {listing.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-gray-200 bg-white/60 px-3 py-1 text-xs text-gray-500 capitalize">{tag.replace(/-/g, ' ')}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Right col — sticky summary */}
            <div className="space-y-4">
              <div className="sticky top-24 space-y-4">
                {/* Price card */}
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-xs text-gray-400 mb-1">Starting from</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(listing.priceFrom, listing.currency)}<span className="text-sm font-normal text-gray-400">/mo</span></p>
                  {listing.priceTo > listing.priceFrom && (
                    <p className="text-sm text-gray-400">up to {formatPrice(listing.priceTo, listing.currency)}/mo</p>
                  )}

                  <div className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Furnishing</span>
                      <span>{FURNISHING_LABELS[listing.furnishing] ?? listing.furnishing}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Min. lease</span>
                      <span>{listing.minLeaseTerm} months</span>
                    </div>
                    {listing.availableFrom && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Available from</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {new Date(listing.availableFrom).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                  </div>

                  <button className="mt-5 w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-colors">
                    Book a Viewing
                  </button>
                  <button className="mt-2 w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    Send Inquiry
                  </button>
                  <ChatWithDeveloper rentListingSlug={listing.slug} className="mt-2 w-full" />
                  {listing.propertySlug && (
                    <Link
                      href={`/${listing.propertySlug}`}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
                    >
                      <Building2 size={15} /> View the property
                    </Link>
                  )}
                </div>

                {/* Developer card */}
                {(raw as any)?.developer && (
                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Listed by</p>
                    <div className="flex items-center gap-3">
                      {(raw as any).developer.logoUrl && (
                        <div className="relative h-10 w-10 overflow-hidden rounded-xl shrink-0">
                          <Image src={(raw as any).developer.logoUrl} alt={(raw as any).developer.companyName} fill className="object-cover" sizes="40px" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{(raw as any).developer.companyName}</p>
                        {(raw as any).developer.establishedYear && (
                          <p className="text-xs text-gray-400">Est. {(raw as any).developer.establishedYear}</p>
                        )}
                      </div>
                    </div>
                    {(raw as any).developer.description && (
                      <p className="mt-3 text-xs text-gray-500 leading-relaxed line-clamp-3">{(raw as any).developer.description}</p>
                    )}
                  </div>
                )}

                {/* Features summary */}
                {listing.amenities.length > 0 && (
                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Amenities</p>
                    <ul className="space-y-1.5">
                      {listing.amenities.map((a) => (
                        <li key={a.id} className="flex items-center gap-2 text-sm text-gray-600">
                          <CheckCircle2 size={13} className="text-green-500 shrink-0" />
                          {a.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
