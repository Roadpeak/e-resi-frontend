import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Check } from 'lucide-react';
import { AccordionItem } from './Accordion';
import { FooterLight } from '../layout/FooterLight';

export interface AudienceItem {
  icon: LucideIcon;
  title: string;
  body: string;
}

export interface AudienceGroup {
  id: string;
  label: string;
  title: string;
  intro: string;
  items: AudienceItem[];
}

/**
 * Long-form "what you get" page for one audience (developers, agencies).
 *
 * Built to be skimmed: the sign-up button is in the first screen, a row of
 * plain facts answers the obvious questions, chips jump to each topic, and
 * every feature is a short title plus one or two sentences — never a wall of
 * prose. Flat, light surfaces and line icons, matching the marketplace.
 */
export function AudiencePage({
  eyebrow,
  title,
  lede,
  cta,
  secondary,
  facts,
  groups,
  steps,
  faqs,
  closing,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  cta: { label: string; href: string };
  secondary?: { label: string; href: string };
  facts: string[];
  groups: AudienceGroup[];
  steps: { title: string; body: string }[];
  faqs: [string, string][];
  closing: { title: string; lede: string };
}) {
  return (
    <>
      <main className="pt-16">
        {/* ── Hero: the decision and the button, first screen ── */}
        <section className="border-b border-black/[0.06] bg-white">
          <div className="mx-auto max-w-6xl px-4 pb-14 pt-14 sm:px-6 sm:pt-20 lg:px-8">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-600">{eyebrow}</p>
            <h1 className="mt-4 max-w-[20ch] text-[36px] font-semibold leading-[1.1] tracking-tight text-gray-900 sm:text-[52px]" style={{ textWrap: 'balance' }}>
              {title}
            </h1>
            <p className="mt-5 max-w-[60ch] text-[17px] leading-relaxed text-gray-600 sm:text-[18px]">{lede}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={cta.href}
                className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-7 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-gray-800"
              >
                {cta.label} <ArrowRight size={16} />
              </Link>
              {secondary && (
                <Link
                  href={secondary.href}
                  className="inline-flex items-center rounded-full border border-gray-300 bg-white px-6 py-3.5 text-[15px] font-medium text-gray-800 transition-colors hover:bg-gray-50"
                >
                  {secondary.label}
                </Link>
              )}
            </div>

            <ul className="mt-10 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
              {facts.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[14.5px] leading-snug text-gray-700">
                  <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" /> {f}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Topic chips ── */}
        <nav aria-label="On this page" className="sticky top-16 z-30 border-b border-black/[0.06] bg-[#f7f7f8]/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
            {groups.map((g) => (
              <a
                key={g.id}
                href={`#${g.id}`}
                className="whitespace-nowrap rounded-full border border-gray-200 bg-white px-4 py-1.5 text-[13.5px] font-medium text-gray-700 transition-colors hover:border-gray-300 hover:text-gray-900"
              >
                {g.label}
              </a>
            ))}
            <a href="#how-it-works" className="whitespace-nowrap rounded-full border border-gray-200 bg-white px-4 py-1.5 text-[13.5px] font-medium text-gray-700 hover:text-gray-900">
              How it works
            </a>
            <a href="#questions" className="whitespace-nowrap rounded-full border border-gray-200 bg-white px-4 py-1.5 text-[13.5px] font-medium text-gray-700 hover:text-gray-900">
              Questions
            </a>
          </div>
        </nav>

        <div className="bg-[#f7f7f8]">
          <div className="mx-auto max-w-6xl space-y-6 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            {/* ── Feature groups ── */}
            {groups.map((g) => (
              <section key={g.id} id={g.id} className="scroll-mt-32 rounded-3xl bg-white p-6 sm:p-10">
                <div className="grid gap-8 lg:grid-cols-[300px_1fr] lg:gap-12">
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-gray-400">{g.label}</p>
                    <h2 className="mt-2 text-[24px] font-semibold leading-tight tracking-tight text-gray-900 sm:text-[28px]">{g.title}</h2>
                    <p className="mt-3 text-[15px] leading-relaxed text-gray-600">{g.intro}</p>
                  </div>
                  <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
                    {g.items.map((item) => (
                      <div key={item.title} className="flex gap-3.5">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-800">
                          <item.icon size={18} strokeWidth={1.8} />
                        </span>
                        <div>
                          <h3 className="text-[15.5px] font-semibold text-gray-900">{item.title}</h3>
                          <p className="mt-1 text-[14.5px] leading-relaxed text-gray-600">{item.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ))}

            {/* ── Steps ── */}
            <section id="how-it-works" className="scroll-mt-32 rounded-3xl bg-white p-6 sm:p-10">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-gray-400">How it works</p>
              <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-gray-900 sm:text-[28px]">From sign-up to your first lead.</h2>
              <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {steps.map((s, i) => (
                  <li key={s.title}>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-[14px] font-semibold text-white">{i + 1}</span>
                    <h3 className="mt-4 text-[15.5px] font-semibold text-gray-900">{s.title}</h3>
                    <p className="mt-1.5 text-[14.5px] leading-relaxed text-gray-600">{s.body}</p>
                  </li>
                ))}
              </ol>
            </section>

            {/* ── FAQ ── */}
            <section id="questions" className="scroll-mt-32 grid gap-6 lg:grid-cols-[300px_1fr] lg:gap-12">
              <div className="pt-2">
                <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-gray-400">Questions</p>
                <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-gray-900 sm:text-[28px]">Straight answers.</h2>
                <p className="mt-3 text-[15px] text-gray-600">
                  Anything else? Write to <a href="mailto:info@e-resi.com" className="font-medium text-gray-900 underline underline-offset-2">info@e-resi.com</a>.
                </p>
              </div>
              <div className="space-y-2.5">
                {faqs.map(([q, a]) => (
                  <AccordionItem key={q} question={q}>{a}</AccordionItem>
                ))}
              </div>
            </section>

            {/* ── Closing ── */}
            <section className="rounded-3xl bg-gray-900 p-8 text-center sm:p-14">
              <h2 className="mx-auto max-w-[24ch] text-[26px] font-semibold tracking-tight text-white sm:text-[34px]">{closing.title}</h2>
              <p className="mx-auto mt-3 max-w-[56ch] text-[15.5px] leading-relaxed text-white/70">{closing.lede}</p>
              <Link
                href={cta.href}
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold text-gray-900 transition-colors hover:bg-gray-100"
              >
                {cta.label} <ArrowRight size={16} />
              </Link>
            </section>
          </div>
        </div>
      </main>
      <FooterLight />
    </>
  );
}
