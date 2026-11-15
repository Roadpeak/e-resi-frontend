'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Check } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

/**
 * What e-resi does, one block per audience. Written as plain, crawlable copy:
 * each heading names the thing people search for, each block links to the page
 * that serves it, and every image has a descriptive alt.
 */
const features = [
  {
    image: '/images/prop1.jpg',
    alt: 'Living room of a Nairobi apartment, the kind of space shown in an e-resi 3D tour',
    eyebrow: '3D tours & VR',
    heading: 'Walk through\nbefore you sign.',
    body: 'Developments on e-resi come with a cinematic film, a 3D walkthrough or a VR tour, so you can move through the rooms, check the light and the layout, and compare homes from anywhere in Kenya or abroad.',
    points: [
      'Interactive 3D walkthroughs and VR tours',
      'Live guided tours with the sales team on video',
      'Floor plans, brochures and documents in one place',
    ],
    cta: { label: 'Browse homes with 3D tours', href: '/properties?has3DTour=true' },
  },
  {
    image: '/images/nairobi-skyline-night.jpg',
    alt: 'Nairobi skyline at night, home to off-plan apartment developments listed on e-resi',
    eyebrow: 'Off-plan developments',
    heading: 'Off-plan homes\nin Nairobi, in full view.',
    body: 'Buy off-plan with the facts in front of you: unit-by-unit availability, prices, floor plans and the developer behind each project. Enquiries go straight to the developer’s sales team, with no middlemen in between.',
    points: [
      'Live unit availability and prices',
      'Verified developers and agents',
      'Chat, call or book a viewing in a tap',
    ],
    cta: { label: 'Explore off-plan developments', href: '/properties?status=off_plan' },
  },
  {
    image: '/images/nairobi-skyline-dusk.jpg',
    alt: 'Nairobi city at dusk, with apartments and offices for rent across its neighbourhoods',
    eyebrow: 'Homes for rent',
    heading: 'Apartments and houses\nfor rent across Kenya.',
    body: 'Find apartments, houses and offices to rent in Nairobi’s neighbourhoods, from Kilimani and Westlands to Riverside. Each rental shows the units still available, real photos and the agent to call or WhatsApp.',
    points: [
      'Units available, updated by the agent',
      'Call or WhatsApp the agent directly',
      'Property reels and neighbourhood guides',
    ],
    cta: { label: 'Find a rental', href: '/rent' },
  },
  {
    image: '/images/prop4.jpg',
    alt: 'Modern residential development presented with e-resi media and a branded page',
    eyebrow: 'For developers',
    heading: 'Your development,\npresented properly.',
    body: 'e-resi films, scans and publishes your development, then gives you a branded page to share with buyers, your own domain if you want it, and one dashboard for units, leads and your sales team.',
    points: [
      'Cinematic film, 3D and VR production',
      'Branded development page and custom domain',
      'Leads, units and team access in one dashboard',
    ],
    cta: { label: 'e-resi for developers', href: '/for-developers' },
  },
  {
    image: '/images/prop5.jpg',
    alt: 'Apartment interior marketed by a Kenyan real estate agent on e-resi',
    eyebrow: 'For agents',
    heading: 'An agency website\nthat sells for you.',
    body: 'List homes for sale and for rent, publish your own agency website from ready-made templates, connect your domain and post property reels. Every enquiry lands on your leads page.',
    points: [
      'Agency website with your own domain',
      'Sale and rental listings, reels and leads',
      'Profile in the e-resi agents directory',
    ],
    cta: { label: 'e-resi for agents', href: '/for-agents' },
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
    <section ref={sectionRef} aria-label="What you can do on e-resi" className="bg-ink py-8 px-8 sm:px-14 lg:px-20">
      <div className="max-w-screen-xl mx-auto space-y-4">
        {features.map((f, i) => (
          <article
            key={f.eyebrow}
            className={`split-block flex flex-col ${i % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-4 items-stretch`}
          >
            {/* Image */}
            <div className="split-img relative overflow-hidden flex-1" style={{ minHeight: '55vh' }}>
              <Image
                src={f.image}
                alt={f.alt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-ink/20" />
            </div>

            {/* Text panel */}
            <div className="flex-1 flex flex-col justify-center bg-[#0f0f0f] p-10 sm:p-14 lg:p-16">
              <p className="split-text-item text-stone/50 text-[10px] tracking-[0.25em] uppercase mb-6">
                {f.eyebrow}
              </p>
              <h2
                className="split-text-item font-display font-light text-chalk leading-[1.08] mb-6 whitespace-pre-line"
                style={{ fontSize: 'clamp(2.2rem, 3.6vw, 4.2rem)' }}
              >
                {f.heading}
              </h2>
              <div className="split-text-item w-8 h-px bg-warm-500 mb-6" />
              <p className="split-text-item text-stone/75 text-base leading-relaxed max-w-md mb-6">
                {f.body}
              </p>
              <ul className="split-text-item mb-8 space-y-2.5">
                {f.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-2.5 text-sm text-chalk/85">
                    <Check size={15} className="mt-0.5 shrink-0 text-warm-400" aria-hidden="true" />
                    {pt}
                  </li>
                ))}
              </ul>
              <div className="split-text-item">
                <Link
                  href={f.cta.href}
                  className="group inline-flex items-center gap-3 text-warm-400 text-sm tracking-[0.12em] uppercase hover:text-warm-300 transition-colors"
                >
                  {f.cta.label}
                  <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
