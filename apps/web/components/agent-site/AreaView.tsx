'use client';

import type { AgentSiteData, AreaGuide } from './types';
import { Icon, ICON, Img, placeLabel, priceLabel } from './shared';
import { LOOK } from './PostView';
import { areaHref, listingsIn } from './guides';
import { Reveal, Stagger } from './motion';
import { formatPrice } from '../../lib/utils';

/** An area guide page: facts, highlights, the write-up, and the agent's listings there. */
export function AreaView({ area, site }: { area: AreaGuide; site: AgentSiteData }) {
  const look = LOOK[site.template ?? 'CLASSIC'] ?? LOOK.CLASSIC;
  const accent = site.agent.siteAccent ?? '#1a73e8';
  const home = `/site/agent/${site.agent.id}`;
  const homes = listingsIn(site.listings, area);
  const blocks = (area.body ?? '').split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const others = (site.content?.guides ?? []).filter((g) => g.slug !== area.slug && g.hasPage).slice(0, 4);
  const facts = [
    area.priceFrom && { label: 'Homes from', value: formatPrice(area.priceFrom, 'KES') },
    area.rentFrom && { label: 'Rent from', value: `${formatPrice(area.rentFrom, 'KES')}/mo` },
    area.commute && { label: 'Getting around', value: area.commute },
    homes.length > 0 && { label: 'On offer now', value: `${homes.length} listing${homes.length === 1 ? '' : 's'}` },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="min-h-screen" style={{ background: look.bg, color: look.ink }}>
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-6 sm:px-6">
        <a href={home} className="truncate text-[16px] font-medium" style={{ fontFamily: look.display }}>{site.agent.displayName}</a>
        <a href={`${home}#guides`} className="text-[14px]" style={{ color: look.muted }}>← All areas</a>
      </header>

      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl">
          <Img src={area.coverUrl ?? null} alt={area.name} className="aspect-[16/10] w-full object-cover sm:aspect-[21/9]" eager />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
          <Reveal className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-10">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/70">Area guide</p>
            <h1 className="mt-2 text-[40px] leading-[1.02] tracking-tight sm:text-[68px]" style={{ fontFamily: look.display, fontWeight: look.display ? 400 : 600 }}>{area.name}</h1>
            {area.tagline && <p className="mt-3 max-w-xl text-[16px] text-white/85">{area.tagline}</p>}
          </Reveal>
        </div>
        {facts.length > 0 && (
          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl sm:grid-cols-4" style={{ background: 'rgba(0,0,0,0.08)' }}>
            {facts.map((f) => (
              <div key={f.label} className="px-5 py-4" style={{ background: look.bg }}>
                <dt className="text-[12.5px]" style={{ color: look.muted }}>{f.label}</dt>
                <dd className="mt-1 text-[17px] font-medium">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.4fr_0.6fr]">
        <div>
          {area.summary && <p className="text-[20px] leading-relaxed" style={{ fontFamily: look.display }}>{area.summary}</p>}
          <div className="mt-8 space-y-5 text-[17px] leading-[1.8]">
            {blocks.map((b, i) => {
              if (b.startsWith('## ')) return <h2 key={i} className="pt-4 text-[24px] font-semibold leading-snug" style={{ fontFamily: look.display }}>{b.slice(3)}</h2>;
              const lines = b.split('\n');
              if (lines.every((l) => /^[-•]\s/.test(l))) {
                return <ul key={i} className="list-disc space-y-1.5 pl-6">{lines.map((l, j) => <li key={j}>{l.replace(/^[-•]\s/, '')}</li>)}</ul>;
              }
              return <p key={i} className="whitespace-pre-line">{b}</p>;
            })}
          </div>
        </div>
        <aside className="space-y-8">
          {!!area.highlights?.length && (
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em]" style={{ color: look.muted }}>Why people love it</p>
              <ul className="mt-3 space-y-2.5 text-[15px]">
                {area.highlights.map((h) => (
                  <li key={h} className="flex gap-2.5"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: accent }} />{h}</li>
                ))}
              </ul>
            </div>
          )}
          {!!area.schools?.length && (
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.16em]" style={{ color: look.muted }}>Schools nearby</p>
              <ul className="mt-3 space-y-1.5 text-[15px]">{area.schools.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
          )}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(0,0,0,0.04)' }}>
            <p className="text-[15px]">Thinking about {area.name}? {site.agent.displayName} knows it well.</p>
            <a href={`${home}#contact`} className="mt-4 inline-flex rounded-full px-5 py-2.5 text-[14px] font-medium text-white" style={{ background: accent }}>Ask about {area.name}</a>
          </div>
        </aside>
      </section>

      {homes.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <h2 className="text-[28px] tracking-tight" style={{ fontFamily: look.display, fontWeight: look.display ? 400 : 600 }}>Homes in {area.name}</h2>
          <Stagger className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {homes.map((l) => (
              <a key={l.id} href={l.href} className="group block">
                <div className="aspect-[4/3] overflow-hidden rounded-2xl">
                  <Img src={l.heroImageUrl} alt={l.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                </div>
                <p className="mt-3 text-[17px] font-medium">{l.name}</p>
                <p className="text-[13.5px]" style={{ color: look.muted }}>{[placeLabel(l), priceLabel(l)].filter(Boolean).join(' · ')}</p>
              </a>
            ))}
          </Stagger>
        </section>
      )}

      {others.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em]" style={{ color: look.muted }}>More areas</p>
          <ul className="mt-4 divide-y" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
            {others.map((g) => (
              <li key={g.id}>
                <a href={areaHref(site.agent.id, g.slug)} className="flex items-center justify-between gap-4 py-4 hover:opacity-70">
                  <span className="text-[19px]" style={{ fontFamily: look.display }}>{g.name}</span>
                  <Icon d={ICON.arrowUpRight} size={16} />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
