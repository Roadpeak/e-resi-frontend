'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, MapPin } from 'lucide-react';
import type { ShowcaseProperty } from '../../lib/api/fetch-property';

gsap.registerPlugin(ScrollTrigger);

/**
 * Horizontally-scrolling showcase of featured developments.
 *
 * Properties are fetched on the server and passed in — this section used to
 * render five invented developments linking to slugs that do not exist, so
 * every card 404'd.
 */
export function PropertyShowcase({ properties }: { properties: ShowcaseProperty[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (properties.length === 0) return;

    const ctx = gsap.context(() => {
      const track = trackRef.current;
      if (!track) return;

      // With few enough cards to fit on screen there is nothing to scroll, and
      // a negative distance would pin the section for no reason.
      const totalWidth = Math.max(0, track.scrollWidth - window.innerWidth);
      if (totalWidth === 0) return;

      // ── Horizontal scroll ──
      const hScroll = gsap.to(track, {
        x: -totalWidth,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: () => `+=${totalWidth}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      });

      // ── Title reveal on enter ──
      gsap.from('.showcase-title-word', {
        y: '100%',
        opacity: 0,
        stagger: 0.06,
        duration: 0.9,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
      });

      // ── Each card image scale on approach ──
      gsap.utils.toArray<HTMLElement>('.showcase-card').forEach((card, i) => {
        const img = card.querySelector('.card-img');
        gsap.from(img, {
          scale: 1.15,
          duration: 0.001, // instant, driven by scroll
          ease: 'none',
        });
        gsap.fromTo(
          img,
          { scale: 1.12 },
          {
            scale: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: card,
              containerAnimation: hScroll,
              start: 'left right',
              end: 'left left',
              scrub: true,
            },
          }
        );

        // Card meta fade in
        const meta = card.querySelector('.card-meta');
        gsap.from(meta, {
          y: 30,
          opacity: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: card,
            containerAnimation: hScroll,
            start: 'left 70%',
          },
        });
      });

      // The pin distance is measured when the trigger is built, so it is only
      // right once the card images have laid out. Re-measure after paint.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => ScrollTrigger.refresh());
      });

    }, sectionRef);

    return () => ctx.revert();
    // Rebuilt when the card list changes — the track's width, and so the pin
    // distance, depends on how many cards there are.
  }, [properties]);

  // Nothing to feature (no featured properties yet, or the API is down) — drop
  // the section rather than render an empty pinned track.
  if (properties.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-white"
      // Own compositing layer — same reason as the hero: while pinned this is
      // position:fixed at a sub-pixel offset, and without its own layer the
      // browser can stop painting it after a client-side navigation, leaving a
      // blank viewport while the DOM still measures correctly.
      style={{ willChange: 'transform' }}
    >
      {/* Section header — above the scroll track */}
      <div ref={titleRef} className="absolute top-12 left-8 sm:left-14 lg:left-20 z-10">
        <p className="text-[#5f6368] text-[10px] tracking-[0.25em] uppercase mb-3">Featured Developments</p>
        <div className="overflow-hidden flex gap-3">
          {['Selected', 'Properties'].map((w, i) => (
            <span
              key={i}
              className="showcase-title-word inline-block font-google font-bold tracking-tight text-[#14120a]"
              style={{ fontSize: 'clamp(2rem, 4vw, 4rem)' }}
            >
              {w}
            </span>
          ))}
        </div>
        <div className="w-8 h-px bg-warm-500 mt-4" />
      </div>

      {/* Horizontal track */}
      <div
        ref={trackRef}
        className="flex items-end gap-5 px-8 sm:px-14 lg:px-20 pt-48 sm:pt-56 pb-16"
        style={{ width: 'max-content' }}
      >
        {properties.map((property, i) => (
          <Link
            key={property.slug}
            href={`/${property.slug}`}
            className="showcase-card group relative overflow-hidden flex-shrink-0 cursor-pointer rounded-2xl shadow-[0_2px_6px_rgba(16,26,58,0.08),0_16px_40px_rgba(16,26,58,0.14)] [isolation:isolate]"
            style={{
              width: i === 0 ? '42vw' : i % 2 === 0 ? '28vw' : '34vw',
              height: i === 0 ? '70vh' : i % 2 === 0 ? '55vh' : '63vh',
              minWidth: 280,
            }}
          >
            {/* Image */}
            <div className="card-img absolute inset-0 overflow-hidden">
              <Image
                src={property.imageUrl}
                alt={property.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 80vw, 40vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
            </div>

            {/* What it is listed for, top left. */}
            <div className="absolute left-5 top-5 z-10 flex gap-1.5">
              {property.deals.map((d) => (
                <span
                  key={d}
                  className={`rounded-full px-3 py-1 font-google text-[11px] font-semibold uppercase tracking-[0.08em] shadow-[0_2px_8px_rgba(0,0,0,0.25)] ${d === 'Selling' ? 'bg-[#FFE345] text-[#14120a]' : 'bg-white text-[#0149FE]'}`}
                >
                  {d}
                </span>
              ))}
            </div>

            {/* Number — positional, so it stays sequential whatever we fetch. */}
            <span className="absolute top-5 right-5 font-display text-5xl font-light text-chalk/10 z-10">
              {String(i + 1).padStart(2, '0')}
            </span>

            {/* Meta */}
            <div className="card-meta absolute bottom-0 left-0 right-0 p-6 z-10">
              <h3 className="font-google font-bold tracking-tight text-white text-2xl leading-tight mb-1.5">
                {property.name}
              </h3>
              <p className="flex items-center gap-1.5 text-white/80 text-sm tracking-wide">
                <MapPin size={14} className="shrink-0 text-[#FFE345]" aria-hidden="true" />
                {property.location}
              </p>

              {/* Always shown: phones have no hover to reveal it. */}
              <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#FFE345] px-4 py-2 text-[#14120a] shadow-[0_4px_14px_rgba(0,0,0,0.25)] transition-colors duration-200 group-hover:bg-[#FFDB1F]">
                <span className="text-xs font-semibold tracking-[0.15em] uppercase">View Property</span>
                <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        ))}

        {/* End spacer */}
        <div className="flex-shrink-0 w-20" />
      </div>
    </section>
  );
}
