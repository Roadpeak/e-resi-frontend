'use client';

import { useMemo, useState } from 'react';
import { formatPrice } from '../../lib/utils';
import type { AgentSiteData, AgentSiteListing, SiteSectionId } from './types';

/** Helpers every agent-site template shares: icons, links, filters, sections. */

export const CATEGORY: Record<string, string> = {
  APARTMENT: 'Apartments', VILLA: 'Villas', TOWNHOUSE: 'Townhouses', MIXED_USE: 'Mixed use',
  COMMERCIAL: 'Commercial', LAND: 'Land', PENTHOUSE: 'Penthouses',
};

export const waLink = (n: string) => `https://wa.me/${n.replace(/[^\d]/g, '')}`;

export function Icon({ d, size = 18, className }: { d: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d={d} />
    </svg>
  );
}

export const ICON = {
  phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm18 2-10 7L2 6',
  chat: 'M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-4-.9L3 20l1.1-4.5A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z',
  pin: 'M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12zm0-9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  arrowUpRight: 'M7 17 17 7M8 7h9v9',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6 6 18',
  prev: 'M15 18l-6-6 6-6',
  next: 'M9 18l6-6-6-6',
  pause: 'M9 5v14M15 5v14',
  play: 'M7 5l12 7-12 7z',
  cube: 'M12 2 3 7v10l9 5 9-5V7l-9-5zM3 7l9 5 9-5M12 12v10',
};

export function priceLabel(l: AgentSiteListing, prefix = 'From ') {
  return l.priceFrom ? `${prefix}${formatPrice(l.priceFrom, l.currency ?? 'KES')}` : 'Price on request';
}

export function placeLabel(l: AgentSiteListing) {
  return [l.neighborhood, l.city].filter(Boolean).join(', ');
}

export function statusLabel(l: AgentSiteListing) {
  if (l.status === 'OFF_PLAN') return 'Off-plan';
  if (l.status === 'SOLD_OUT') return 'Sold out';
  return 'Selling now';
}

export const hasTour = (l: AgentSiteListing) => l.has3DTour || l.hasVRTour || l.hasCinematicTour;

/** The photo at the top of the site: the agent's cover, else a listing photo. */
export function heroImage(data: AgentSiteData) {
  return data.agent.siteHeroUrl ?? data.listings.find((l) => l.heroImageUrl)?.heroImageUrl ?? null;
}

export function firstSentence(text: string | null, max = 180) {
  if (!text) return null;
  const s = text.split(/(?<=[.!?])\s/)[0] ?? text;
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

/** Visible sections, in the agent's order, limited to what a template draws. */
export function orderedSections(data: AgentSiteData, supported: readonly SiteSectionId[]): SiteSectionId[] {
  const saved = data.sections?.length ? data.sections : supported.map((id) => ({ id, visible: true }));
  const order = saved.filter((s) => s.visible && supported.includes(s.id)).map((s) => s.id);
  // A section the template supports but the saved list predates goes last.
  for (const id of supported) if (!saved.some((s) => s.id === id)) order.push(id);
  return order;
}

/** Areas the agent works, with how many listings each has. */
export function areasOf(data: AgentSiteData) {
  const counts = new Map<string, number>();
  for (const l of data.listings) {
    const k = l.neighborhood || l.city;
    if (k) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  for (const a of data.agent.serviceAreas) if (!counts.has(a)) counts.set(a, 0);
  return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

export function useListingFilter(listings: AgentSiteListing[]) {
  const own = listings.filter((l) => l.kind === 'OWN').length;
  const partner = listings.length - own;
  const tabs = [
    { key: 'ALL', label: 'All', n: listings.length },
    ...(own && partner ? [
      { key: 'OWN', label: 'Our listings', n: own },
      { key: 'PARTNER', label: 'Partner developments', n: partner },
    ] : []),
  ];
  const [tab, setTab] = useState('ALL');
  const [city, setCity] = useState('');
  const cities = useMemo(() => [...new Set(listings.map((l) => l.city).filter(Boolean) as string[])].sort(), [listings]);
  const shown = listings.filter((l) => (tab === 'ALL' || l.kind === tab) && (!city || l.city === city));
  return { tabs, tab, setTab, cities, city, setCity, shown };
}

export function specialtyLabel(s: string) {
  const t = s.replace(/_/g, ' ').toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function Img({ src, alt = '', className, eager }: { src: string | null; alt?: string; className?: string; eager?: boolean }) {
  if (!src) return <div className={`bg-black/[0.06] ${className ?? ''}`} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} className={className} />;
}
