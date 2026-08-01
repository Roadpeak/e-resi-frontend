'use client';

import Link from 'next/link';
import Image from 'next/image';

interface Props {
  children: React.ReactNode;
  image?: string;
  quote?: string;
  quoteAuthor?: string;
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1400&q=90';

export function AuthSplit({
  children,
  image = DEFAULT_IMAGE,
  quote = 'Experience properties like never before — before you ever set foot inside.',
  quoteAuthor = 'e-resi Platform',
}: Props) {
  return (
    <>
      {/* Left panel — form */}
      <div className="flex flex-1 flex-col px-6 py-10 sm:px-10 lg:px-16 xl:px-24 justify-center bg-white overflow-y-auto">
        {/* Logo */}
        <div className="mb-10">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <span className="text-xs font-bold text-white">VR</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">
              Hom<span className="text-brand-600">VR</span>
            </span>
          </Link>
        </div>

        <div className="w-full max-w-sm mx-auto lg:mx-0">
          {children}
        </div>
      </div>

      {/* Right panel — image */}
      <div className="hidden lg:flex relative w-[45%] xl:w-1/2 shrink-0 overflow-hidden">
        <Image
          src={image}
          alt="e-resi property"
          fill
          className="object-cover"
          priority
          sizes="50vw"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-950/90 via-surface-950/20 to-transparent" />

        {/* Brand watermark top-right */}
        <div className="absolute top-8 right-8">
          <span className="font-display font-light tracking-[0.1em] text-white/50 text-sm">
            Hom<em className="not-italic text-brand-400">VR</em>
          </span>
        </div>

        {/* Quote bottom */}
        <div className="absolute bottom-10 left-8 right-8">
          <blockquote className="font-display font-light text-white/80 text-xl leading-snug mb-3">
            &ldquo;{quote}&rdquo;
          </blockquote>
          <p className="text-xs text-white/40 tracking-[0.15em] uppercase">{quoteAuthor}</p>
        </div>
      </div>
    </>
  );
}
