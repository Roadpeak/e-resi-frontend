'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Bath, BedDouble, ChevronDown, ChevronLeft, ChevronRight, Heart, Loader2, Search, SlidersHorizontal, X } from 'lucide-react';
import { useRentFiltersStore } from '../../lib/stores/rent-filters.store';
import { useRentListings } from '../../lib/api/queries';
import { RentCard, formatRent, rangeOf } from './RentCard';
import { RentHeader, RentSection, useSavedRentals } from './RentShell';
import { Pagination } from '../ui/Pagination';
import { cn } from '../../lib/utils';
import { NeedAgentHelp } from '../agents/NeedAgentHelp';
import type { RentListing, RentFilters, FurnishingType } from '../../lib/types';

const FURNISHINGS: { value: FurnishingType; label: string }[] = [
  { value: 'furnished', label: 'Furnished' },
  { value: 'semi_furnished', label: 'Semi-furnished' },
  { value: 'unfurnished', label: 'Unfurnished' },
];
const PAGE_SIZE = 12;
const PRICE_STEPS = [30_000, 50_000, 80_000, 120_000, 200_000, 350_000, 500_000, 1_000_000];

function applyClientFilters(listings: RentListing[], filters: RentFilters): RentListing[] {
  let result = [...listings];
  if (filters.neighborhood) result = result.filter((l) => l.address.neighborhood === filters.neighborhood);
  if (filters.furnishing) result = result.filter((l) => l.furnishing === filters.furnishing || l.units.some((u) => u.furnishing === filters.furnishing));
  if (filters.priceMin) result = result.filter((l) => l.priceTo >= filters.priceMin!);
  if (filters.priceMax) result = result.filter((l) => l.priceFrom <= filters.priceMax!);
  if (filters.bedrooms) result = result.filter((l) => l.units.some((u) => u.bedrooms >= filters.bedrooms!));
  if (filters.show3DTour) result = result.filter((l) => l.show3DTour);
  if (filters.showCinematicTour) result = result.filter((l) => l.showCinematicTour);
  if (filters.sortBy === 'price_asc') result.sort((a, b) => a.priceFrom - b.priceFrom);
  else if (filters.sortBy === 'price_desc') result.sort((a, b) => b.priceFrom - a.priceFrom);
  else result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return result;
}

/**
 * The rent marketplace.
 *
 * Three views on one data set: Home (featured carousel plus the latest
 * rentals), Search (filters on the left, results on the right — also what the
 * /rent/apartments, /villas and /commercial routes open on), and Saved.
 * Rent listings have no category of their own; `lockedCategory` filters on
 * the parent development's.
 */
export function RentPage({ lockedCategory, heading }: { lockedCategory?: string; heading?: string } = {}) {
  const params = useSearchParams();
  const view = lockedCategory ? 'search' : params.get('view') === 'search' ? 'search' : params.get('view') === 'saved' ? 'saved' : 'home';
  const { filters } = useRentFiltersStore();

  const { data, isLoading } = useRentListings({
    limit: 100,
    city: filters.city,
    q: filters.query,
    category: lockedCategory,
  });
  const all = useMemo(() => data?.items ?? [], [data]);

  if (view === 'saved') return <SavedView all={all} loading={isLoading} />;
  if (view === 'search') return <SearchView all={all} loading={isLoading} heading={heading} category={lockedCategory} />;
  return <HomeView all={all} loading={isLoading} />;
}

/* ── Header search ─────────────────────────────────────────── */

function HeaderSearch({ live }: { live: boolean }) {
  const router = useRouter();
  const { filters, setFilter } = useRentFiltersStore();
  const [q, setQ] = useState(filters.query ?? '');
  useEffect(() => {
    if (!live) return;
    const t = setTimeout(() => setFilter('query', q.trim() || undefined), 300);
    return () => clearTimeout(t);
  }, [q, live, setFilter]);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setFilter('query', q.trim() || undefined);
        if (!live) router.push('/rent?view=search');
      }}
      className="relative w-full max-w-[340px]"
    >
      <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa0a6]" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search area, building or listing"
        className="h-11 w-full rounded-full border border-[#e3e3e3] bg-white pl-10 pr-4 text-[14.5px] text-[#1d1d1f] placeholder-[#9aa0a6] focus:border-[#1d1d1f] focus:outline-none" />
    </form>
  );
}

/* ── Home ──────────────────────────────────────────────────── */

function HomeView({ all, loading }: { all: RentListing[]; loading: boolean }) {
  const open = all.filter((l) => l.status !== 'fully_let');
  const featured = [...open.filter((l) => l.isFeatured && l.heroImageUrl), ...open.filter((l) => !l.isFeatured && l.heroImageUrl)].slice(0, 6);
  const latest = [...all].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);
  const areas = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of open) {
      const a = l.address.neighborhood || l.address.city;
      if (a) m.set(a, (m.get(a) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [open]);
  const { setFilter, resetFilters } = useRentFiltersStore();

  return (
    <>
      <RentHeader><HeaderSearch live={false} /></RentHeader>
      {loading ? (
        <div className="flex h-[50vh] items-center justify-center"><Loader2 size={28} className="animate-spin text-[#9aa0a6]" /></div>
      ) : all.length === 0 ? (
        <Empty title="No rentals listed yet" body="New homes to rent appear here as soon as they are listed." />
      ) : (
        <>
          {featured.length > 0 && (
            <RentSection title="Featured rentals" action={{ label: 'See all listings', href: '/rent?view=search' }}>
              <Featured items={featured} />
            </RentSection>
          )}

          {areas.length > 1 && (
            <div className="scrollbar-hide mt-6 flex gap-2 overflow-x-auto">
              {areas.map(([a, n]) => (
                <Link key={a} href="/rent?view=search"
                  onClick={() => { resetFilters(); setFilter('neighborhood', a); }}
                  className="shrink-0 rounded-full bg-[#f2f2f2] px-4 py-2 text-[14px] text-[#1d1d1f] hover:bg-[#e8e8e8]">
                  {a} <span className="text-[#9aa0a6]">{n}</span>
                </Link>
              ))}
            </div>
          )}

          <RentSection title="Latest rentals" action={{ label: 'See all listings', href: '/rent?view=search' }}>
            <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-4">
              {latest.map((l) => <RentCard key={l.id} listing={l} />)}
            </div>
          </RentSection>

          <div className="mt-12 rounded-[22px] bg-[#f7f7f7] p-6">
            <p className="text-[17px] font-semibold text-[#1d1d1f]">Want someone to find it for you?</p>
            <p className="mt-1 text-[14.5px] text-[#5f6368]">Tell a letting agent what you need and they will shortlist homes for you.</p>
            <div className="mt-4"><NeedAgentHelp deal="RENT" /></div>
          </div>
        </>
      )}
      <Footer />
    </>
  );
}

function Featured({ items }: { items: RentListing[] }) {
  const [i, setI] = useState(0);
  const n = items.length;
  useEffect(() => {
    if (n < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 6500);
    return () => clearInterval(t);
  }, [n]);
  const l = items[i];
  const beds = rangeOf(l.units.map((u) => u.bedrooms), true);
  const baths = rangeOf(l.units.map((u) => u.bathrooms));

  return (
    <div className="relative h-[340px] overflow-hidden rounded-[24px] bg-[#1d1d1f] sm:h-[440px]">
      <AnimatePresence initial={false}>
        <motion.div key={l.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="absolute inset-0">
          <Link href={`/rent/${l.slug}`} className="absolute inset-0">
            <Image src={l.heroImageUrl} alt={l.name} fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 80vw" />
            <span className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/65 to-transparent" />
          </Link>
          <div className="pointer-events-none absolute bottom-6 left-6 right-6 text-white">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[24px] font-semibold sm:text-[28px]">{l.name}</p>
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[12.5px] backdrop-blur-sm">
                {FURNISHINGS.find((f) => f.value === l.furnishing)?.label ?? 'Rent'}
              </span>
            </div>
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[15px] text-white/90">
              <span>{l.address.neighborhood || l.address.city}</span>
              {beds && <><span aria-hidden>•</span><span className="inline-flex items-center gap-1"><BedDouble size={15} /> {beds}</span></>}
              {baths && <span className="inline-flex items-center gap-1"><Bath size={15} /> {baths}</span>}
              {l.priceFrom > 0 && <><span aria-hidden>•</span><span>{formatRent(l.priceFrom, l.currency)} / month</span></>}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {n > 1 && (
        <>
          <button onClick={() => setI((i - 1 + n) % n)} aria-label="Previous" className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-white hover:bg-white/15">
            <ChevronLeft size={24} />
          </button>
          <button onClick={() => setI((i + 1) % n)} aria-label="Next" className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-white hover:bg-white/15">
            <ChevronRight size={24} />
          </button>
          <div className="absolute right-0 top-0 hidden gap-1.5 rounded-bl-[20px] bg-white p-1.5 pr-0 sm:flex">
            {items.map((t, k) => (
              <button key={t.id} onClick={() => setI(k)} aria-label={t.name}
                className={cn('relative h-12 w-16 overflow-hidden rounded-xl transition-opacity last:mr-1.5', k === i ? 'opacity-100 ring-2 ring-[#1d1d1f]' : 'opacity-70 hover:opacity-100')}>
                <Image src={t.heroImageUrl} alt="" fill className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Search ────────────────────────────────────────────────── */

function SearchView({ all, loading, heading, category }: { all: RentListing[]; loading: boolean; heading?: string; category?: string }) {
  const { filters, resetFilters } = useRentFiltersStore();
  const [page, setPage] = useState(1);
  const [panel, setPanel] = useState(false);
  const results = useMemo(() => applyClientFilters(all, filters), [all, filters]);
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const pageResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const filterKey = JSON.stringify(filters);
  useEffect(() => { setPage(1); }, [filterKey]);
  const active = Object.entries(filters).filter(([k, v]) => k !== 'sortBy' && k !== 'query' && v !== undefined && v !== '').length;

  return (
    <>
      <RentHeader title={heading ?? 'Search rentals'}><HeaderSearch live /></RentHeader>
      <div className="flex gap-6">
        <aside className="hidden w-[300px] shrink-0 lg:block">
          <div className="sticky top-6"><FilterPanel all={all} /></div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[14.5px] text-[#5f6368]">{loading ? 'Searching…' : `${results.length} rental${results.length === 1 ? '' : 's'}`}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPanel(true)} className="inline-flex items-center gap-1.5 rounded-full bg-[#f2f2f2] px-4 py-2 text-[14px] text-[#1d1d1f] lg:hidden">
                <SlidersHorizontal size={14} /> Filters{active ? ` (${active})` : ''}
              </button>
              <SortSelect />
            </div>
          </div>

          {loading ? (
            <div className="flex h-[40vh] items-center justify-center"><Loader2 size={28} className="animate-spin text-[#9aa0a6]" /></div>
          ) : results.length === 0 ? (
            <Empty title="Nothing matches those filters" body="Try a wider area, another budget, or fewer filters."
              action={<button onClick={resetFilters} className="rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[14px] font-medium text-white">Clear filters</button>} />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
                {pageResults.map((l) => <RentCard key={l.id} listing={l} />)}
              </div>
              <Pagination page={page} totalPages={totalPages} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
            </>
          )}
          <div className="mt-10"><NeedAgentHelp category={category} deal="RENT" /></div>
        </div>
      </div>

      {/* Phone filter sheet */}
      <AnimatePresence>
        {panel && (
          <motion.div className="fixed inset-0 z-50 bg-black/40 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPanel(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[24px] bg-white p-3" onClick={(e) => e.stopPropagation()}>
              <div className="mb-2 flex items-center justify-between px-2 pt-1">
                <p className="text-[17px] text-[#1d1d1f]">Filters</p>
                <button onClick={() => setPanel(false)} aria-label="Close" className="rounded-full p-2 hover:bg-[#f2f2f2]"><X size={18} /></button>
              </div>
              <FilterPanel all={all} onDone={() => setPanel(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <Footer />
    </>
  );
}

function FilterPanel({ all, onDone }: { all: RentListing[]; onDone?: () => void }) {
  const { filters, setFilter, resetFilters } = useRentFiltersStore();
  const cities = useMemo(() => [...new Set(all.map((l) => l.address.city).filter(Boolean))], [all]);
  const areas = useMemo(
    () => [...new Set(all.filter((l) => !filters.city || l.address.city === filters.city).map((l) => l.address.neighborhood).filter(Boolean))].slice(0, 12),
    [all, filters.city],
  );

  return (
    <div className="rounded-[22px] bg-[#f2f2f2] p-2">
      <div className="flex items-center justify-between px-3 pb-2 pt-1.5">
        <p className="text-[16px] font-semibold text-[#1d1d1f]">Filters</p>
      </div>
      <div className="space-y-2">
        <Box title="Furnishing">
          <Chips value={filters.furnishing} options={FURNISHINGS} onChange={(v) => setFilter('furnishing', v as FurnishingType | undefined)} />
        </Box>
        {cities.length > 1 && (
          <Box title="City">
            <Chips value={filters.city} options={cities.map((c) => ({ value: c, label: c }))}
              onChange={(v) => { setFilter('city', v); setFilter('neighborhood', undefined); }} />
          </Box>
        )}
        {areas.length > 0 && (
          <Box title="Area">
            <Chips value={filters.neighborhood} options={areas.map((a) => ({ value: a, label: a }))} onChange={(v) => setFilter('neighborhood', v)} />
          </Box>
        )}
        <Box title="Bedrooms">
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((n) => (
              <button key={n} onClick={() => setFilter('bedrooms', filters.bedrooms === n ? undefined : n)}
                className={cn('rounded-full py-2 text-[14px] transition-colors', filters.bedrooms === n ? 'bg-[#1d1d1f] text-white' : 'bg-[#f2f2f2] text-[#1d1d1f] hover:bg-[#e8e8e8]')}>
                {n}{n === 4 ? '+' : ''}
              </button>
            ))}
          </div>
        </Box>
        <Box title="Monthly rent">
          <div className="grid grid-cols-2 gap-2">
            <PriceSelect label="Min" value={filters.priceMin} onChange={(v) => setFilter('priceMin', v)} />
            <PriceSelect label="Max" value={filters.priceMax} onChange={(v) => setFilter('priceMax', v)} />
          </div>
        </Box>
        <Box title="Tours">
          <Switch label="Cinematic tour" on={!!filters.showCinematicTour} onChange={(v) => setFilter('showCinematicTour', v || undefined)} />
          <Switch label="3D tour" on={!!filters.show3DTour} onChange={(v) => setFilter('show3DTour', v || undefined)} />
        </Box>
      </div>
      <div className="flex gap-2 p-2 pt-3">
        <button onClick={resetFilters} className="flex-1 rounded-full bg-white py-3 text-[14.5px] text-[#1d1d1f] hover:bg-[#fafafa]">Clear filters</button>
        {onDone && <button onClick={onDone} className="flex-1 rounded-full bg-[#1d1d1f] py-3 text-[14.5px] text-white">Show results</button>}
      </div>
    </div>
  );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[18px] bg-white p-3.5">
      <p className="mb-2.5 text-[14px] font-semibold text-[#1d1d1f]">{title}</p>
      {children}
    </div>
  );
}

function Chips({ value, options, onChange }: { value?: string; options: { value: string; label: string }[]; onChange: (v: string | undefined) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(value === o.value ? undefined : o.value)}
          className={cn('rounded-full px-3.5 py-1.5 text-[13.5px] transition-colors', value === o.value ? 'bg-[#1d1d1f] text-white' : 'bg-[#f2f2f2] text-[#1d1d1f] hover:bg-[#e8e8e8]')}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Switch({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className="flex w-full items-center justify-between py-1.5 text-[14px] text-[#1d1d1f]" role="switch" aria-checked={on}>
      {label}
      <span className={cn('relative h-6 w-10 rounded-full transition-colors', on ? 'bg-[#1d1d1f]' : 'bg-[#e3e3e3]')}>
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', on ? 'left-[18px]' : 'left-0.5')} />
      </span>
    </button>
  );
}

function PriceSelect({ label, value, onChange }: { label: string; value?: number; onChange: (v: number | undefined) => void }) {
  return (
    <div className="relative">
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)} aria-label={`${label} rent`}
        className="w-full cursor-pointer appearance-none rounded-full bg-[#f2f2f2] py-2 pl-4 pr-8 text-[13.5px] text-[#1d1d1f] focus:outline-none">
        <option value="">{label}: any</option>
        {PRICE_STEPS.map((p) => <option key={p} value={p}>{label}: {p >= 1_000_000 ? `${p / 1_000_000}M` : `${p / 1000}K`}</option>)}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5f6368]" />
    </div>
  );
}

function SortSelect() {
  const { filters, setFilter } = useRentFiltersStore();
  return (
    <div className="relative">
      <select value={filters.sortBy ?? 'newest'} onChange={(e) => setFilter('sortBy', e.target.value as RentFilters['sortBy'])}
        className="cursor-pointer appearance-none rounded-full bg-[#f2f2f2] py-2 pl-4 pr-8 text-[14px] text-[#1d1d1f] focus:outline-none">
        <option value="newest">Newest</option>
        <option value="price_asc">Lowest rent</option>
        <option value="price_desc">Highest rent</option>
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#5f6368]" />
    </div>
  );
}

/* ── Saved ─────────────────────────────────────────────────── */

function SavedView({ all, loading }: { all: RentListing[]; loading: boolean }) {
  const { ids } = useSavedRentals();
  const saved = all.filter((l) => ids.includes(l.id));
  return (
    <>
      <RentHeader title="Saved rentals" />
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center"><Loader2 size={28} className="animate-spin text-[#9aa0a6]" /></div>
      ) : saved.length === 0 ? (
        <Empty icon={<Heart size={22} />} title="Nothing saved yet" body="Tap the heart on any rental to keep it here."
          action={<Link href="/rent?view=search" className="rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[14px] font-medium text-white">Browse rentals</Link>} />
      ) : (
        <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-4">
          {saved.map((l) => <RentCard key={l.id} listing={l} />)}
        </div>
      )}
      <Footer />
    </>
  );
}

/* ── Bits ──────────────────────────────────────────────────── */

function Empty({ title, body, action, icon }: { title: string; body: string; action?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[22px] bg-[#f7f7f7] px-6 py-20 text-center">
      {icon && <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#5f6368]">{icon}</span>}
      <p className="text-[18px] font-semibold text-[#1d1d1f]">{title}</p>
      <p className="mt-1 text-[14.5px] text-[#5f6368]">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-[#efefef] pt-6 text-[14px] text-[#5f6368]">
      <span>Homes to rent on e-resi</span>
      <span className="flex gap-4">
        <Link href="/privacy" className="hover:text-[#1d1d1f]">Privacy Policy</Link>
        <Link href="/terms" className="hover:text-[#1d1d1f]">Terms of Service</Link>
      </span>
    </footer>
  );
}
