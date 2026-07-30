'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { value: '4+', label: 'Active Listings' },
  { value: '3D', label: 'Immersive Tours' },
  { value: 'VR', label: 'Headset Ready' },
  { value: '∞', label: 'Possibilities' },
];

export function ManifestoSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // ── Large text scrub reveal ──
      gsap.from('.manifesto-line', {
        x: -60,
        opacity: 0,
        stagger: 0.12,
        duration: 0.9,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: '.manifesto-text',
          start: 'top 75%',
        },
      });

      // ── Stats count up ──
      gsap.from('.stat-item', {
        y: 40,
        opacity: 0,
        stagger: 0.1,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.stats-row',
          start: 'top 80%',
        },
      });

      // ── Horizontal rule draw ──
      gsap.from('.rule-line', {
        scaleX: 0,
        transformOrigin: 'left',
        duration: 1.4,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: '.rule-line',
          start: 'top 85%',
        },
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="bg-ink py-32 px-8 sm:px-14 lg:px-20">
      <div className="max-w-screen-xl mx-auto">

        {/* Eyebrow */}
        <p className="text-stone/40 text-[10px] tracking-[0.25em] uppercase mb-12">Our Vision</p>

        {/* Manifesto text */}
        <div className="manifesto-text mb-20">
          {[
            'Property is not',
            'a transaction —',
            'it is an',
            <><em className="not-italic text-warm-400">experience.</em></>,
          ].map((line, i) => (
            <div key={i} className="manifesto-line overflow-hidden">
              <div
                className="font-display font-light text-chalk leading-[1.05]"
                style={{ fontSize: 'clamp(2.8rem, 7vw, 7rem)' }}
              >
                {line}
              </div>
            </div>
          ))}
        </div>

        {/* Rule */}
        <div className="rule-line w-full h-px bg-white/8 mb-20" />

        {/* Stats */}
        <div className="stats-row grid grid-cols-2 sm:grid-cols-4 gap-10">
          {stats.map((s) => (
            <div key={s.value} className="stat-item">
              <div
                className="font-display font-light text-chalk mb-2"
                style={{ fontSize: 'clamp(3rem, 5vw, 5rem)' }}
              >
                {s.value}
              </div>
              <div className="text-stone/50 text-sm tracking-[0.15em] uppercase">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
