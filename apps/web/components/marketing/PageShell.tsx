import Link from 'next/link';
import { cn } from '../../lib/utils';
import { MarketingNav } from './MarketingNav';
import { FooterLight } from '../layout/FooterLight';

/**
 * Shell for the static marketing pages (about, for-developers, pricing…).
 *
 * The structure is a cool off-white ground with pure-white cards floating on
 * it — the contrast between the two grounds does the separating, so cards
 * carry no shadow and no border. A full-bleed dark hero opens every page and
 * the nav sits transparent over it until you scroll past.
 */

/** Cool off-white ground shared by the page body and the scrolled nav. */
export const GROUND = '#f4f6fb';

export function PageShell({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: GROUND }}>
      <MarketingNav />

      <Hero eyebrow={eyebrow} title={title} lede={lede} />

      <main className="px-6 py-20 sm:px-10 sm:py-24">
        <div className="mx-auto max-w-[1080px]">{children}</div>
      </main>

      <FooterLight />
    </div>
  );
}

/** Full-bleed gradient hero. Dark ground so the nav can sit on it untinted. */
function Hero({
  eyebrow,
  title,
  lede,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
}) {
  return (
    <header
      className="relative overflow-hidden px-6 pb-24 pt-40 sm:px-10 sm:pb-28 sm:pt-44"
      style={{
        backgroundImage:
          'linear-gradient(115deg, #101a3a 0%, #1a234d 32%, #2a45c4 68%, #6e9af8 100%)',
      }}
    >
      {/* A soft blue bloom in the top-right, mirroring the reference's light corner. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-40 h-[520px] w-[520px] rounded-full opacity-50 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(110,154,248,0.60) 0%, transparent 68%)',
        }}
      />
      <div className="relative mx-auto max-w-[1080px]">
        {eyebrow && (
          <p className="mb-5 text-[13px] font-semibold uppercase tracking-[0.16em] text-resi-300">
            {eyebrow}
          </p>
        )}
        <h1
          className="max-w-[16ch] text-[42px] font-semibold leading-[1.08] tracking-tight text-white sm:text-[56px] lg:text-[68px]"
          style={{ textWrap: 'balance' }}
        >
          {title}
        </h1>
        {lede && (
          <p className="mt-7 max-w-[62ch] text-[18px] leading-relaxed text-white/70 sm:text-[19px]">
            {lede}
          </p>
        )}
      </div>
    </header>
  );
}

/** Small caps label that opens a section. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.16em] text-resi-600">
      {children}
    </p>
  );
}

/**
 * A titled block within a marketing page. `eyebrow` renders the small caps
 * label above the heading; `prose` narrows the measure for reading copy.
 */
export function Section({
  eyebrow,
  title,
  lede,
  prose = true,
  className,
  children,
}: {
  eyebrow?: string;
  title?: string;
  lede?: string;
  prose?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('mb-20 last:mb-0 sm:mb-24', className)}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      {title && (
        <h2
          className="max-w-[22ch] text-[30px] font-semibold leading-[1.15] tracking-tight text-ink sm:text-[40px]"
          style={{ textWrap: 'balance' }}
        >
          {title}
        </h2>
      )}
      {lede && (
        <p className="mt-5 max-w-[68ch] text-[17px] leading-relaxed text-ink/60 sm:text-[18px]">
          {lede}
        </p>
      )}
      <div
        className={cn(
          (title || lede || eyebrow) && 'mt-10',
          prose && 'max-w-[70ch] space-y-5 text-[17px] leading-relaxed text-ink/70',
        )}
      >
        {children}
      </div>
    </section>
  );
}

/** White card on the tinted ground — 24px radius, generous padding, no shadow. */
export function Card({
  className,
  accent = false,
  children,
}: {
  className?: string;
  /** Draws the blue bottom edge the reference uses on its grid cards. */
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-3xl bg-white p-8',
        accent && 'border-b-2 border-resi-500',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Responsive card grid. */
export function CardGrid({
  cols = 2,
  className,
  children,
}: {
  cols?: 2 | 3 | 4;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'grid gap-5',
        cols === 2 && 'sm:grid-cols-2',
        cols === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
        cols === 4 && 'sm:grid-cols-2 lg:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A short label/value card — the reference's "loan highlights" row. */
export function HighlightCard({ children }: { children: React.ReactNode }) {
  return (
    <Card accent className="p-7">
      <p className="text-[17px] font-medium leading-snug text-ink">{children}</p>
    </Card>
  );
}

/** Numbered process card: "STEP 1 / Loan Inquiry / body". */
export function StepCard({
  step,
  title,
  children,
  action,
}: {
  step: string;
  title: string;
  children: React.ReactNode;
  action?: { label: string; href: string };
}) {
  return (
    <Card accent className="flex flex-col">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink/40">
        {step}
      </p>
      <h3 className="mt-3 text-[24px] font-semibold tracking-tight text-ink">{title}</h3>
      <p className="mt-3 text-[16px] leading-relaxed text-ink/60">{children}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-6 inline-block self-start rounded-lg bg-resi-600 px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-resi-700"
        >
          {action.label}
        </Link>
      )}
    </Card>
  );
}

/** Definition-style card for "what you get" style grids. */
export function FeatureCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card accent>
      <h3 className="text-[18px] font-semibold tracking-tight text-ink">{title}</h3>
      <p className="mt-2 text-[16px] leading-relaxed text-ink/60">{children}</p>
    </Card>
  );
}

/**
 * Split section: sticky heading on the left, stacked content on the right.
 * The reference uses this for its FAQ; it reads well for any long list.
 */
export function SplitSection({
  eyebrow,
  title,
  lede,
  aside,
  children,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-20 grid gap-10 sm:mb-24 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16">
      <div className="lg:sticky lg:top-28 lg:self-start">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2
          className="text-[30px] font-semibold leading-[1.15] tracking-tight text-ink sm:text-[40px]"
          style={{ textWrap: 'balance' }}
        >
          {title}
        </h2>
        {lede && (
          <p className="mt-5 text-[17px] leading-relaxed text-ink/60">{lede}</p>
        )}
        {aside && <div className="mt-7">{aside}</div>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/**
 * CTA targets are sometimes mailto:/tel: rather than routes, which next/link
 * should not own — fall back to a plain anchor for those.
 */
function CtaLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const external = /^(mailto:|tel:|https?:)/.test(href);
  if (external) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

/** Full-width closing band before the footer. */
export function CtaBand({
  title,
  lede,
  primary,
  secondary,
}: {
  title: string;
  lede?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <section className="mb-4">
      <div
        className="rounded-[32px] px-8 py-16 text-center sm:px-16 sm:py-20"
        style={{
          backgroundImage:
            'linear-gradient(115deg, #101a3a 0%, #1a234d 38%, #2a45c4 100%)',
        }}
      >
        <h2
          className="mx-auto max-w-[20ch] text-[32px] font-semibold leading-[1.12] tracking-tight text-white sm:text-[44px]"
          style={{ textWrap: 'balance' }}
        >
          {title}
        </h2>
        {lede && (
          <p className="mx-auto mt-5 max-w-[54ch] text-[17px] leading-relaxed text-white/65">
            {lede}
          </p>
        )}
        {(primary || secondary) && (
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            {primary && (
              <CtaLink
                href={primary.href}
                className="rounded-lg bg-white px-7 py-3 text-[15px] font-medium text-ink transition-colors hover:bg-resi-50"
              >
                {primary.label}
              </CtaLink>
            )}
            {secondary && (
              <CtaLink
                href={secondary.href}
                className="rounded-lg border border-white/30 px-7 py-3 text-[15px] font-medium text-white transition-colors hover:bg-white/10"
              >
                {secondary.label}
              </CtaLink>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Legal-document layout: a sticky contents rail beside the body copy, with the
 * whole document on a single white sheet. Sections must be given ids matching
 * the contents entries so the rail can link to them.
 */
export function LegalBody({
  contents,
  children,
}: {
  contents: { id: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,240px)_minmax(0,1fr)] lg:gap-14">
      <nav aria-label="Contents" className="lg:sticky lg:top-28 lg:self-start">
        <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.16em] text-resi-600">
          Contents
        </p>
        <ol className="space-y-2.5">
          {contents.map((c) => (
            <li key={c.id}>
              <a
                href={`#${c.id}`}
                className="block text-[14px] leading-snug text-ink/55 transition-colors hover:text-ink"
              >
                {c.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="rounded-3xl bg-white p-8 sm:p-12">{children}</div>
    </div>
  );
}

/** A numbered clause within a legal document. */
export function Clause({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-11 scroll-mt-28 last:mb-0">
      <h2 className="text-[22px] font-semibold tracking-tight text-ink sm:text-[24px]">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-[16px] leading-relaxed text-ink/70">{children}</div>
    </section>
  );
}

/** Emphasised lead-in inside legal copy. */
export function Term({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-ink">{children}</strong>;
}

/** Inline mailto/link in legal copy. */
export function MailLink({ email }: { email: string }) {
  return (
    <a
      href={`mailto:${email}`}
      className="font-medium text-resi-600 transition-colors hover:text-resi-800"
    >
      {email}
    </a>
  );
}

/** Inline text link in the logo blue. */
export function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-block text-[16px] font-medium text-resi-600 transition-colors hover:text-resi-800"
    >
      {children}
    </Link>
  );
}
