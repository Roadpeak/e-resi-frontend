'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    image: '/images/prop1.jpg',
    eyebrow: 'Immersive Technology',
    heading: 'Walk through\nbefore you sign.',
    body: 'Our production team captures every property in full 3D and VR — so buyers can experience the space, the light, the feeling, from anywhere in the world.',
    accent: 'VR + 3D',
  },
  {
    image: '/images/prop4.jpg',
    eyebrow: 'Developer Platform',
    heading: 'Your development,\nworld-class.',
    body: 'From basic listings to full cinematic productions — choose the tier that matches your vision. e-resi handles everything from photography to digital twin.',
    accent: 'List Now',
  },
  {
    image: '/images/prop5.jpg',
    eyebrow: 'Digital Twins',
    heading: 'The future of\nreal estate.',
    body: 'Live construction updates, real-time availability, and a persistent digital twin that evolves with the development. Buyers stay connected from off-plan to handover.',
    accent: 'Learn More',
  },
];

export function SplitFeature() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.split-block').forEach((block) => {
        const img = block.querySelector('.split-img');
        const texts = block.querySelectorAll('.split-text-item');

        // Image reveal — clip from left
        gsap.from(img, {
          clipPath: 'inset(0 100% 0 0)',
          duration: 1.2,
          ease: 'power4.inOut',
          scrollTrigger: {
            trigger: block,
            start: 'top 70%',
          },
        });

        // Text stagger
        gsap.from(texts, {
          y: 32,
          opacity: 0,
          stagger: 0.1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: block,
            start: 'top 65%',
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="bg-ink py-8 px-8 sm:px-14 lg:px-20">
      <div className="max-w-screen-xl mx-auto space-y-4">
        {features.map((f, i) => (
          <div
            key={i}
            className={`split-block flex flex-col ${i % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-4 items-stretch`}
          >
            {/* Image */}
            <div className="split-img relative overflow-hidden flex-1" style={{ minHeight: '55vh' }}>
              <Image
                src={f.image}
                alt={f.heading}
                fill
                className="object-cover"
                sizes="50vw"
              />
              <div className="absolute inset-0 bg-ink/20" />
            </div>

            {/* Text panel */}
            <div className="flex-1 flex flex-col justify-center bg-[#0f0f0f] p-10 sm:p-14 lg:p-16">
              <div className="split-text-item text-stone/40 text-[10px] tracking-[0.25em] uppercase mb-6">
                {f.eyebrow}
              </div>
              <h2
                className="split-text-item font-display font-light text-chalk leading-[1.08] mb-6 whitespace-pre-line"
                style={{ fontSize: 'clamp(2.4rem, 4vw, 4.5rem)' }}
              >
                {f.heading}
              </h2>
              <div className="split-text-item w-8 h-px bg-warm-500 mb-6" />
              <p className="split-text-item text-stone/70 text-base leading-relaxed max-w-sm mb-8">
                {f.body}
              </p>
              <div className="split-text-item">
                <span className="inline-flex items-center gap-3 text-warm-400 text-sm tracking-[0.12em] uppercase group cursor-pointer">
                  {f.accent}
                  <span className="w-6 h-px bg-warm-400 group-hover:w-12 transition-all duration-500" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
