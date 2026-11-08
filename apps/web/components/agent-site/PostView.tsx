'use client';

import type { AgentSiteData, Post } from './types';
import { Img } from './shared';
import { monthLabel, postHref } from './sections';
import { Reveal } from './motion';

/** Look per template, so a post reads like part of the agent's site. */
const LOOK: Record<string, { bg: string; ink: string; muted: string; display?: string }> = {
  CLASSIC: { bg: '#ffffff', ink: '#111111', muted: '#666666' },
  HAVEN: { bg: '#f6f4ef', ink: '#1d1c1a', muted: '#6b675f' },
  ATELIER: { bg: '#eeece7', ink: '#121211', muted: '#6e6b65' },
  MERIDIAN: { bg: '#efe9df', ink: '#26231f', muted: '#7a7268', display: 'var(--font-cormorant), Georgia, serif' },
};

/** A journal post: plain paragraphs, with "## " lines as subheadings and "- " lines as bullets. */
export function PostView({ post, site }: { post: Post; site: AgentSiteData }) {
  const look = LOOK[site.template ?? 'CLASSIC'] ?? LOOK.CLASSIC;
  const accent = site.agent.siteAccent ?? '#1a73e8';
  const home = `/site/agent/${site.agent.id}`;
  const blocks = post.body.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const more = (site.content?.posts ?? []).filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="min-h-screen" style={{ background: look.bg, color: look.ink }}>
      <header className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-6 sm:px-6">
        <a href={home} className="truncate text-[16px] font-medium" style={{ fontFamily: look.display }}>{site.agent.displayName}</a>
        <a href={`${home}#journal`} className="text-[14px]" style={{ color: look.muted }}>← All posts</a>
      </header>
      <article className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <Reveal>
          <p className="text-[13px]" style={{ color: accent }}>{[post.category, monthLabel(post.publishedAt), `${post.readMinutes} min read`].filter(Boolean).join(' · ')}</p>
          <h1 className="mt-3 text-[36px] leading-[1.1] tracking-tight sm:text-[52px]" style={{ fontFamily: look.display, fontWeight: look.display ? 400 : 600 }}>{post.title}</h1>
          {post.excerpt && <p className="mt-5 text-[18px] leading-relaxed" style={{ color: look.muted }}>{post.excerpt}</p>}
        </Reveal>
        {post.coverUrl && (
          <Reveal delay={0.1} className="mt-10 overflow-hidden rounded-2xl">
            <Img src={post.coverUrl} alt="" className="aspect-[16/9] w-full object-cover" eager />
          </Reveal>
        )}
        <div className="mt-10 space-y-5 text-[17px] leading-[1.8]">
          {blocks.map((b, i) => {
            if (b.startsWith('## ')) return <h2 key={i} className="pt-4 text-[24px] font-semibold leading-snug" style={{ fontFamily: look.display }}>{b.slice(3)}</h2>;
            const lines = b.split('\n');
            if (lines.every((l) => /^[-•]\s/.test(l))) {
              return <ul key={i} className="list-disc space-y-1.5 pl-6">{lines.map((l, j) => <li key={j}>{l.replace(/^[-•]\s/, '')}</li>)}</ul>;
            }
            return <p key={i} className="whitespace-pre-line">{b}</p>;
          })}
        </div>
        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-6" style={{ background: 'rgba(0,0,0,0.04)' }}>
          <p className="text-[15px]">Questions about buying or selling? Talk to {site.agent.displayName}.</p>
          <a href={`${home}#contact`} className="rounded-full px-5 py-2.5 text-[14px] font-medium text-white" style={{ background: accent }}>Get in touch</a>
        </div>
        {more.length > 0 && (
          <div className="mt-14">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em]" style={{ color: look.muted }}>More from the journal</p>
            <ul className="mt-4 divide-y" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
              {more.map((p) => (
                <li key={p.id}>
                  <a href={postHref(site.agent.id, p.slug)} className="flex items-baseline justify-between gap-4 py-4 hover:opacity-70">
                    <span className="text-[17px]" style={{ fontFamily: look.display }}>{p.title}</span>
                    <span className="shrink-0 text-[13px]" style={{ color: look.muted }}>{p.readMinutes} min</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </div>
  );
}
