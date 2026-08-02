import Link from 'next/link';

/**
 * The two sides of the marketplace, stated plainly. Kept short deliberately —
 * this sits between two heavier sections, and the detail lives on the
 * /for-developers and /for-investors pages.
 */
const SIDES = [
  {
    eyebrow: 'For developers',
    headline: 'Sell it before you build it.',
    body:
      'We produce the photography, cinematic film, 3D walkthrough and VR tour. You get a branded page, unit-level control, and every lead in one dashboard.',
    points: ['Production handled for you', 'Units, rentals and reservations', 'No commission on sales'],
    href: '/for-developers',
    cta: 'List a development',
  },
  {
    eyebrow: 'For buyers & investors',
    headline: 'Walk it before you buy it.',
    body:
      'Tour a development in cinematic film, interactive 3D or full VR. See which units are left, what floor they sit on and what they cost — from anywhere in the world.',
    points: ['Every developer KYB-verified', 'Live unit availability', 'Free to browse and reserve'],
    href: '/for-investors',
    cta: 'Start browsing',
  },
];

export function AudienceSection() {
  return (
    <section className="bg-ink px-8 py-32 sm:px-14 lg:px-20">
      <div className="mx-auto max-w-screen-xl">
        <p className="mb-16 text-[10px] uppercase tracking-[0.25em] text-stone/40">
          Two sides, one platform
        </p>

        <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">
          {SIDES.map((s) => (
            <div key={s.eyebrow} className="flex flex-col">
              <p className="mb-4 text-[11px] uppercase tracking-[0.2em] text-warm-400">
                {s.eyebrow}
              </p>

              <h2
                className="font-display font-light leading-[1.08] text-chalk"
                style={{ fontSize: 'clamp(2.2rem, 3.6vw, 3.4rem)' }}
              >
                {s.headline}
              </h2>

              <p className="mt-6 max-w-md text-[17px] leading-relaxed text-chalk/55">{s.body}</p>

              <ul className="mt-8 space-y-3">
                {s.points.map((p) => (
                  <li key={p} className="flex items-center gap-3 text-[15px] text-chalk/70">
                    <span className="h-px w-5 shrink-0 bg-warm-400/60" />
                    {p}
                  </li>
                ))}
              </ul>

              <Link
                href={s.href}
                className="group mt-10 inline-flex w-fit items-center gap-2 text-[15px] font-medium text-chalk transition-colors hover:text-warm-400"
              >
                {s.cta}
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
