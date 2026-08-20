'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';
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
    <section ref={sectionRef} className="relative w-full overflow-hidden bg-ink">
      {/* Section header — above the scroll track */}
      <div ref={titleRef} className="absolute top-12 left-8 sm:left-14 lg:left-20 z-10">
        <p className="text-stone/40 text-[10px] tracking-[0.25em] uppercase mb-3">Featured Developments</p>
        <div className="overflow-hidden flex gap-3">
          {['Selected', 'Properties'].map((w, i) => (
            <span
              key={i}
              className="showcase-title-word inline-block font-display font-light text-chalk"
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
        className="flex items-end gap-5 px-8 sm:px-14 lg:px-20 pt-44 pb-16"
        style={{ width: 'max-content' }}
      >
        {properties.map((property, i) => (
          <Link
            key={property.slug}
            href={`/${property.slug}`}
            className="showcase-card group relative overflow-hidden flex-shrink-0 cursor-pointer"
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

            {/* Number — positional, so it stays sequential whatever we fetch. */}
            <span className="absolute top-5 right-5 font-display text-5xl font-light text-chalk/10 z-10">
              {String(i + 1).padStart(2, '0')}
            </span>

            {/* Meta */}
            <div className="card-meta absolute bottom-0 left-0 right-0 p-6 z-10">
              <span className="inline-block border border-warm-500/30 text-warm-400 text-[10px] tracking-[0.2em] uppercase px-3 py-1 mb-3">
                {property.tag}
              </span>
              <h3 className="font-display font-light text-chalk text-2xl leading-tight mb-1">
                {property.name}
              </h3>
              <p className="text-stone/60 text-sm tracking-wide">{property.location}</p>

              <div className="flex items-center gap-2 mt-4 text-warm-400/0 group-hover:text-warm-400 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <span className="text-xs tracking-[0.15em] uppercase">View Property</span>
                <ArrowRight size={12} />
              </div>
            </div>
          </Link>
        ))}

        {/* End spacer */}
        <div className="flex-shrink-0 w-20" />
      </div>
    </section>
  );
}
