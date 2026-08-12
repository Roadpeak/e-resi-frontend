import Link from 'next/link';

/**
 * Who the platform is for, weighted to reflect who actually pays.
 *
 * Developers lead in their own full-width block: they are the paying customer,
 * and the mini-site plus production is the product they buy. The other three
 * sides follow as supporting columns — they are what makes the developer's
 * page worth sharing, so they earn their place, but not equal billing.
 */
const DEVELOPER = {
  eyebrow: 'For property developers',
  headline: 'Sell it before you build it.',
  body:
    'We produce the photography, cinematic film, 3D walkthrough and VR tour of your '
    + 'development, then hand you a branded page of your own — your logo, your colours, your '
    + 'domain — to share straight to your buyers on WhatsApp. Every unit, lead, viewing and '
    + 'reservation lands in one dashboard, and you see exactly who watched the tour and for '
    + 'how long.',
  points: [
    'Production handled end to end',
    'A branded mini-site you can share anywhere',
    'Unit-level control, leads and reservations',
    'Engagement data on every tour',
    'No commission on your sales',
  ],
  href: '/for-developers',
  cta: 'List a development',
};

const OTHERS = [
  {
    eyebrow: 'Buyers & investors',
    headline: 'Walk it before you buy it.',
    body:
      'Tour a development in cinematic film, interactive 3D or full VR. See which units are '
      + 'left, what floor they sit on and what they cost — from anywhere in the world.',
    href: '/for-investors',
    cta: 'Start browsing',
  },
  {
    eyebrow: 'Tenants',
    headline: 'Rent without the guesswork.',
    body:
      'View apartments, villas and commercial space properly before you travel to see them. '
      + 'Availability, rent and the full tour, all on one page.',
    href: '/rent',
    cta: 'Find a rental',
  },
  {
    eyebrow: 'Agents',
    headline: 'Bring your buyers a better tour.',
    body:
      'Verified agents partner with developers, share tours with their own clients and get '
      + 'credited for the leads they bring.',
    href: '/agents',
    cta: 'Browse agents',
  },
];

export function AudienceSection() {
  return (
    <section className="bg-ink px-8 py-32 sm:px-14 lg:px-20">
      <div className="mx-auto max-w-screen-xl">
        <p className="mb-16 text-[10px] uppercase tracking-[0.25em] text-stone/40">
          Built for developers · Open to everyone
        </p>

        {/* ── Developers lead ── */}
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <div className="flex flex-col">
            <p className="mb-4 text-[11px] uppercase tracking-[0.2em] text-warm-400">
              {DEVELOPER.eyebrow}
            </p>
            <h2
              className="font-display font-light leading-[1.08] text-chalk"
              style={{ fontSize: 'clamp(2.4rem, 4.2vw, 4rem)' }}
            >
              {DEVELOPER.headline}
            </h2>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-chalk/55">
              {DEVELOPER.body}
            </p>
            <Link
              href={DEVELOPER.href}
              className="group mt-10 inline-flex w-fit items-center gap-2 border border-chalk/25 bg-chalk/5 px-7 py-3.5 text-[13px] uppercase tracking-[0.12em] text-chalk transition-colors hover:bg-chalk/10"
            >
              {DEVELOPER.cta}
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>

          <ul className="space-y-4 lg:pt-16">
            {DEVELOPER.points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-[16px] text-chalk/70">
                <span className="mt-3 h-px w-5 shrink-0 bg-warm-400/60" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* ── Everyone the developer's page is shared with ── */}
        <div className="mt-28 border-t border-white/8 pt-16">
          <p className="mb-12 text-[10px] uppercase tracking-[0.25em] text-stone/40">
            And for everyone they share it with
          </p>

          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-16">
            {OTHERS.map((s) => (
              <div key={s.eyebrow} className="flex flex-col">
                <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-warm-400">
                  {s.eyebrow}
                </p>
                <h3
                  className="font-display font-light leading-[1.12] text-chalk"
                  style={{ fontSize: 'clamp(1.5rem, 2.1vw, 1.9rem)' }}
                >
                  {s.headline}
                </h3>
                <p className="mt-4 text-[15px] leading-relaxed text-chalk/55">{s.body}</p>
                <Link
                  href={s.href}
                  className="group mt-6 inline-flex w-fit items-center gap-2 text-[14px] font-medium text-chalk/80 transition-colors hover:text-warm-400"
                >
                  {s.cta}
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
