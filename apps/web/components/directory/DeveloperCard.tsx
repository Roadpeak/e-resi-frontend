'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Building2 } from 'lucide-react';
import type { DeveloperCard as DeveloperCardData } from '../../lib/api/developers';

/**
 * A developer as a gallery piece: a large sharp-edged square, their newest
 * live development as the cover, and everything written on a deep bottom
 * gradient — the mark, the name in the display face, the record, and the
 * way in. No rounded corners anywhere; the luxury reads from restraint.
 */
export function DeveloperCard({ developer }: { developer: DeveloperCardData }) {
  const details = [
    `${developer._count.properties} development${developer._count.properties === 1 ? '' : 's'}`,
    developer.establishedYear ? `Est. ${developer.establishedYear}` : null,
    developer.location,
  ].filter(Boolean);

  return (
    <Link
      href={`/developers/${developer.id}`}
      className="group relative block aspect-square w-full overflow-hidden bg-[#16161a]"
    >
      {developer.coverImageUrl ? (
        <Image
          src={developer.coverImageUrl}
          alt=""
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1c1c22] to-[#0e0e12]">
          <Building2 size={40} strokeWidth={1} className="text-white/20" />
        </div>
      )}

      {/* The writing surface. Deep enough that white type always holds. */}
      <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-7">
        {/* Mark */}
        <span className="flex h-12 w-12 items-center justify-center overflow-hidden bg-white">
          {developer.logoUrl ? (
            <Image src={developer.logoUrl} alt="" width={48} height={48} className="h-full w-full object-cover" unoptimized />
          ) : (
            <Building2 size={20} className="text-[#8a8a90]" />
          )}
        </span>

        <h3 className="mt-4 font-display text-[26px] font-light leading-tight tracking-tight text-white sm:text-[30px]">
          {developer.companyName}
        </h3>

        {details.length > 0 && (
          <p className="mt-1.5 text-[13.5px] tracking-wide text-white/70">
            {details.join('  ·  ')}
          </p>
        )}

        <span className="mt-5 inline-flex items-center gap-2.5 border border-white/35 px-6 py-2.5 text-[12.5px] font-semibold uppercase tracking-[0.18em] text-white transition-colors duration-300 group-hover:border-gold-400 group-hover:bg-gold-400 group-hover:text-gray-900">
          Explore
          <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
