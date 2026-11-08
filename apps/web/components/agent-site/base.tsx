'use client';

import { useEffect, useState } from 'react';
import type { AgentSiteData, SiteSectionId, Step } from './types';

/** Small pieces several templates share: scroll state, headline numbers, nav, default steps. */

export function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > threshold);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [threshold]);
  return scrolled;
}

export interface Stat { v: number; s: string; d?: number; label: string }

/** Up to `max` honest numbers from the agent's profile and listings. */
export function statsFor(data: AgentSiteData, max = 4): Stat[] {
  const { agent, listings } = data;
  return ([
    agent.yearsExperience ? { v: agent.yearsExperience, s: '+', label: 'Years of experience' } : null,
    { v: listings.length, s: '', label: listings.length === 1 ? 'Development on offer' : 'Developments on offer' },
    agent.dealsCompleted > 0 ? { v: agent.dealsCompleted, s: '+', label: 'Deals closed' } : null,
    agent.ratingCount > 0 && agent.ratingAverage != null ? { v: agent.ratingAverage, s: '', d: 1, label: `Rating from ${agent.ratingCount} reviews` } : null,
    (data.stats?.units ?? 0) > 0 ? { v: data.stats!.units, s: '', label: 'Homes available' } : null,
    (data.stats?.withTours ?? 0) > 0 ? { v: data.stats!.withTours, s: '', label: 'With virtual tours' } : null,
    (data.stats?.cities ?? 0) > 1 ? { v: data.stats!.cities, s: '', label: 'Cities covered' } : null,
  ].filter(Boolean) as Stat[]).slice(0, max);
}

/** Anchor links for the sections that are on and have something in them. */
export function navFor(data: AgentSiteData, order: SiteSectionId[], labels: Partial<Record<SiteSectionId, string>> = {}) {
  const c = data.content;
  const has: Partial<Record<SiteSectionId, boolean>> = {
    listings: data.listings.length > 0,
    about: !!data.agent.bio,
    services: !!c?.services.length,
    team: !!c?.team.length,
    guides: !!c?.guides?.length,
    journal: !!c?.posts.length,
    packages: !!c?.packages?.length,
    testimonials: !!c?.testimonials.length,
  };
  const defaults: Partial<Record<SiteSectionId, string>> = {
    listings: 'Homes', about: 'About', services: 'Services', team: 'Team', guides: 'Areas', journal: 'Journal', packages: 'Landlords', testimonials: 'Reviews',
  };
  const want: SiteSectionId[] = ['listings', 'about', 'services', 'guides', 'team', 'journal'];
  return want
    .filter((id) => order.includes(id) && has[id])
    .slice(0, 5)
    .map((id) => ({ href: `#${id}`, label: labels[id] ?? defaults[id]! }));
}

const DEFAULT_STEPS: Step[] = [
  { id: 'd1', title: 'Tell us what you need', description: 'A short call about budget, areas, timing and must-haves.', audience: 'BUYERS' },
  { id: 'd2', title: 'See the right homes', description: 'A shortlist that fits, with viewings in person or by live guided tour.', audience: 'BUYERS' },
  { id: 'd3', title: 'Offer and close', description: 'We negotiate, line up the paperwork and get you the keys.', audience: 'BUYERS' },
  { id: 'd4', title: 'Value and prepare', description: 'An honest price from recent sales, and what to fix before listing.', audience: 'SELLERS' },
  { id: 'd5', title: 'Market it well', description: 'Photos, tours and listing on e-resi so serious buyers see it first.', audience: 'SELLERS' },
  { id: 'd6', title: 'Sell with confidence', description: 'Viewings, offers and negotiation handled through to completion.', audience: 'SELLERS' },
];

/** The agent's own steps when they have some, else a sensible default. */
export function stepsFor(data: AgentSiteData, audience?: 'BUYERS' | 'SELLERS'): Step[] {
  const own = data.content?.steps ?? [];
  const pick = (list: Step[]) => (audience ? list.filter((s) => s.audience === audience || (!s.audience || s.audience === 'ALL')) : list);
  return own.length ? pick(own) : pick(DEFAULT_STEPS).filter((s) => !audience || s.audience === audience);
}

export const greeting = () => {
  const h = Number(new Date().toLocaleString('en-GB', { timeZone: 'Africa/Nairobi', hour: '2-digit', hour12: false }));
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};
