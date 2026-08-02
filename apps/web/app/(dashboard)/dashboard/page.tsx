'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight, ArrowUpRight, BadgeCheck, BarChart3, Building2, CalendarDays,
  CheckCircle2, Circle, Clock3, DoorOpen, FileText, Home, Landmark, ListChecks,
  Loader2, MessageSquare, Receipt, ShieldCheck, TrendingDown, TrendingUp,
} from 'lucide-react';
import { apiClient } from '../../../lib/api/client';
import { propertiesApi } from '../../../lib/api/properties';
import { LISTING_FEE_MONTHLY, fmtUsd } from '../../../lib/onboarding/catalog';
import { useCatalog } from '../../../lib/onboarding/useCatalog';
import { useAuthStore } from '../../../lib/stores/auth.store';
import {
  useDeveloperStats, useDeveloperEngagement, useMyProperties, useMyRentListings,
  useDeveloperInquiries, useDeveloperBookings,
} from '../../../lib/api/queries';

interface DeveloperProfileLite {
  companyName: string;
  kybStatus: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  onboardingSubmittedAt?: string | null;
}

interface DevReservation {
  id: string;
  stage: 'RESERVED' | 'AGREEMENT_SIGNED' | 'DEPOSIT_PAID' | 'FINAL_PAYMENT' | 'TITLE_TRANSFERRED' | 'CANCELLED';
  unit?: { price?: number; property?: { name: string; slug: string } } | null;
}

const STAGE_LABELS: Record<string, string> = {
  RESERVED: 'reserved',
  AGREEMENT_SIGNED: 'agreement signed',
  DEPOSIT_PAID: 'deposit paid',
  FINAL_PAYMENT: 'final payment',
};

/* ── Small shared pieces ─────────────────────────────────────────── */

function CardLabel({ icon, children, dark = false }: { icon: React.ReactNode; children: React.ReactNode; dark?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${dark ? 'text-[#9aa0a6]' : 'text-[#5f6368]'}`}>
      <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${dark ? 'bg-white/10 text-[#e8eaed]' : 'bg-[#f1f3f4] text-[#5f6368]'}`}>
        {icon}
      </span>
      <span className="text-xs font-medium uppercase tracking-[0.1em]">{children}</span>
    </div>
  );
}

/** Google-style card title — large, sentence case, light weight. */
function CardTitle({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <h3 className={`mt-3 text-[22px] font-normal leading-snug ${dark ? 'text-white' : 'text-[#202124]'}`}>
      {children}
    </h3>
  );
}

/** Tiny red/green trend or status stat — the quiet Apple-style metric. */
function MicroStat({
  tone, children,
}: {
  tone: 'up' | 'down' | 'good' | 'warn' | 'bad' | 'muted';
  children: React.ReactNode;
}) {
  const cls = {
    up: 'text-[#188038]',
    good: 'text-[#188038]',
    down: 'text-[#d93025]',
    bad: 'text-[#d93025]',
    warn: 'text-[#b06000]',
    muted: 'text-[#5f6368]',
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1 text-[13px] font-medium ${cls}`}>
      {tone === 'up' && <TrendingUp size={11} />}
      {tone === 'down' && <TrendingDown size={11} />}
      {(tone === 'good' || tone === 'warn' || tone === 'bad') && (
        <span className={`h-1.5 w-1.5 rounded-full ${
          tone === 'good' ? 'bg-[#34a853]' : tone === 'warn' ? 'bg-[#f9ab00]' : 'bg-[#ea4335]'
        }`} />
      )}
      {children}
    </span>
  );
}

function Card({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`break-inside-avoid mb-4 rounded-3xl border p-6 ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* ── Page ────────────────────────────────────────────────────────── */

export default function DashboardOverview() {
  // Hydrates the catalogue with admin-managed pricing.
  useCatalog();
  const user = useAuthStore((s) => s.user);
  const { data: stats } = useDeveloperStats();
  const { data: engagement } = useDeveloperEngagement(7);
  const { data: propertiesData } = useMyProperties({ limit: 50 });
  const { data: rentalsData } = useMyRentListings({ limit: 1 });
  const { data: inquiriesData } = useDeveloperInquiries({ limit: 3 });
  const { data: bookingsData } = useDeveloperBookings({ limit: 5 });
  const { data: profile } = useQuery({
    queryKey: ['developer-profile'],
    queryFn: () => apiClient.get<DeveloperProfileLite>('/users/developers/me'),
  });
  const { data: reservations } = useQuery({
    queryKey: ['reservations', 'developer-overview'],
    queryFn: () => apiClient.get<{ data: DevReservation[] }>('/reservations/developer?limit=50'),
  });
  const { data: rawListings } = useQuery({
    queryKey: ['my-listings-raw'],
    queryFn: () => propertiesApi.myListings({ limit: 50 }),
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-KE', { weekday: 'long', month: 'long', day: 'numeric' });

  const properties = propertiesData?.items ?? [];
  const totalProps = stats?.properties.total ?? 0;
  const liveProps = stats?.properties.active ?? 0;
  const draftProps = Math.max(totalProps - liveProps, 0);
  const coverImage = properties.find((p) => p.heroImageUrl)?.heroImageUrl;

  const unitTotals = properties.reduce(
    (acc, p) => ({ available: acc.available + (p.availableUnits ?? 0), total: acc.total + (p.totalUnits ?? 0) }),
    { available: 0, total: 0 },
  );
  const unitsTaken = Math.max(unitTotals.total - unitTotals.available, 0);
  const availablePct = unitTotals.total ? Math.round((unitTotals.available / unitTotals.total) * 100) : 0;

  // 7-day activity: compare the last 3 days against the 3 before them
  const daily = engagement?.daily ?? [];
  const dayTotal = (d: { views: number; inquiries: number; bookings: number }) => d.views + d.inquiries + d.bookings;
  const interactions7d = daily.reduce((n, d) => n + dayTotal(d), 0);
  const recent = daily.slice(-3).reduce((n, d) => n + dayTotal(d), 0);
  const prior = daily.slice(1, 4).reduce((n, d) => n + dayTotal(d), 0);
  const trendPct = prior > 0 ? Math.round(((recent - prior) / prior) * 100) : recent > 0 ? 100 : 0;
  const maxDay = Math.max(...daily.map(dayTotal), 1);

  // sales pipeline
  const allReservations = reservations?.data ?? [];
  const activeReservations = allReservations.filter((r) => r.stage !== 'CANCELLED' && r.stage !== 'TITLE_TRANSFERRED');
  const completedSales = allReservations.filter((r) => r.stage === 'TITLE_TRANSFERRED').length;
  const pipelineValue = activeReservations.reduce((n, r) => n + (r.unit?.price ?? 0), 0);
  const stageCounts = activeReservations.reduce<Record<string, number>>((acc, r) => {
    acc[r.stage] = (acc[r.stage] ?? 0) + 1;
    return acc;
  }, {});

  // billing snapshot
  const pendingServices = (rawListings?.data ?? []).reduce((n, p) => {
    const sub = (p as unknown as { submissionData?: { servicesOneTimeTotal?: number } }).submissionData;
    return n + (sub?.servicesOneTimeTotal ?? 0);
  }, 0);
  const monthlyFees = liveProps * LISTING_FEE_MONTHLY;

  // getting-started checklist
  const checklist = [
    { label: 'Create your developer account', done: true, href: '/dashboard/profile' },
    { label: 'Submit verification documents', done: !!profile?.onboardingSubmittedAt || (profile?.kybStatus ?? 'NOT_SUBMITTED') !== 'NOT_SUBMITTED', href: '/onboarding' },
    { label: 'Get verified', done: profile?.kybStatus === 'APPROVED', href: '/dashboard/profile' },
    { label: 'Add your first development', done: totalProps > 0, href: '/dashboard/developments/new' },
    { label: 'First listing goes live', done: liveProps > 0, href: '/dashboard/properties' },
  ];
  const checklistDone = checklist.filter((c) => c.done).length;
  const showChecklist = profile && checklistDone < checklist.length;

  const latestInquiry = inquiriesData?.items?.[0];
  const newInquiries = (inquiriesData?.items ?? []).filter((i) => i.status === 'NEW').length;
  const nextBooking = (bookingsData?.items ?? []).find((b) => b.status === 'PENDING');
  const pendingBookings = stats?.bookings.pending ?? 0;

  return (
    <div>
      {/* ── Gradient hero ── */}
      <section className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-amber-200 via-emerald-200 to-sky-300 px-6 py-10 sm:px-10">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-medium leading-tight text-[#202124] sm:text-[2.75rem]"
            >
              {greeting},<br />{profile?.companyName ?? user?.firstName ?? 'there'}!
            </motion.h1>
            <p className="mt-4 text-base text-[#3c4043]">
              Everything you need lives in the cards below. <span className="font-medium">{today}</span>
            </p>
          </div>
          <StatusCard profile={profile} />
        </div>
      </section>

      {/* ── Masonry cards ── */}
      <div className="columns-1 gap-4 sm:columns-2 xl:columns-3">

        {/* Getting started — shown until every step is complete */}
        {showChecklist && (
          <Card className="border-transparent bg-[#e8f0fe]" delay={0}>
            <CardLabel icon={<ListChecks size={12} />}>Getting started</CardLabel>
            <CardTitle>Set up your developer account</CardTitle>
            <div className="mt-3">
              <MicroStat tone={checklistDone >= 3 ? 'good' : 'warn'}>
                {checklistDone} of {checklist.length} complete
              </MicroStat>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-[#1a73e8] transition-all"
                style={{ width: `${(checklistDone / checklist.length) * 100}%` }}
              />
            </div>
            <ul className="mt-4 space-y-2.5">
              {checklist.map((step) => (
                <li key={step.label}>
                  {step.done ? (
                    <span className="flex items-center gap-2.5 text-[15px] text-[#80868b] line-through decoration-[#dadce0]">
                      <CheckCircle2 size={17} className="shrink-0 text-[#34a853]" /> {step.label}
                    </span>
                  ) : (
                    <Link href={step.href} className="group flex items-center gap-2.5 text-[15px] font-medium text-[#202124] hover:text-[#1a73e8]">
                      <Circle size={17} className="shrink-0 text-[#dadce0] group-hover:text-[#1a73e8]" /> {step.label}
                      <ArrowRight size={12} className="opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Properties — image card */}
        <Card className="border-transparent bg-[#131314] p-0 overflow-hidden" delay={0}>
          <div className="relative h-44 bg-[#202124]">
            {coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverImage} alt="Latest development" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-[#5f6368]">
                <Building2 size={32} strokeWidth={1.5} />
              </div>
            )}
            <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-gray-800 backdrop-blur">
              {totalProps} development{totalProps === 1 ? '' : 's'}
            </span>
          </div>
          <div className="p-6">
            <CardLabel dark icon={<Building2 size={12} />}>Properties</CardLabel>
            <CardTitle dark>Your developments, each with its own branded page</CardTitle>
            <div className="mt-3 flex items-center gap-3">
              <MicroStat tone={liveProps > 0 ? 'good' : 'muted'}>
                <span className={liveProps > 0 ? 'text-[#81c995]' : 'text-[#9aa0a6]'}>{liveProps} live</span>
              </MicroStat>
              {draftProps > 0 && <MicroStat tone="warn"><span className="text-[#fdd663]">{draftProps} in review</span></MicroStat>}
            </div>
            <Link
              href="/dashboard/properties"
              className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-[15px] font-medium text-[#202124] hover:bg-[#e8eaed] transition-colors"
            >
              Manage properties <ArrowRight size={14} />
            </Link>
          </div>
        </Card>

        {/* Analytics — sparkline card */}
        <Card className="border-transparent bg-[#131314]" delay={0.05}>
          <CardLabel dark icon={<BarChart3 size={12} />}>Analytics</CardLabel>
          <CardTitle dark>How buyers found you this week</CardTitle>
          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-[15px] text-[#9aa0a6]">
                <span className="font-medium text-white">{interactions7d}</span> interactions · 7 days
              </p>
              <div className="mt-1.5">
                {interactions7d === 0 ? (
                  <span className="text-[13px] font-medium text-[#9aa0a6]">no activity yet</span>
                ) : trendPct >= 0 ? (
                  <span className="inline-flex items-center gap-1 text-[13px] font-medium text-[#81c995]"><TrendingUp size={12} /> {trendPct}% vs earlier this week</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[13px] font-medium text-[#f28b82]"><TrendingDown size={12} /> {trendPct}% vs earlier this week</span>
                )}
              </div>
            </div>
            {/* mini sparkline */}
            <div className="flex h-12 items-end gap-1">
              {daily.map((d) => (
                <div
                  key={d.date}
                  title={d.date}
                  className="w-2 rounded-t-sm bg-white/25"
                  style={{ height: `${Math.max((dayTotal(d) / maxDay) * 100, 8)}%` }}
                />
              ))}
            </div>
          </div>
          <Link
            href="/dashboard/analytics"
            className="mt-5 inline-flex items-center gap-1 text-[15px] font-medium text-[#8ab4f8] hover:text-white transition-colors"
          >
            Open analytics <ArrowUpRight size={14} />
          </Link>
        </Card>

        {/* Inquiries — inbox card */}
        <Card className="border-[#dadce0] bg-white" delay={0.1}>
          <CardLabel icon={<MessageSquare size={12} />}>Inquiries</CardLabel>
          <CardTitle>Buyer questions, answered from one inbox</CardTitle>
          <div className="mt-3 flex items-center gap-3">
            <MicroStat tone={newInquiries > 0 ? 'warn' : 'good'}>
              {newInquiries > 0 ? `${newInquiries} awaiting reply` : 'inbox clear'}
            </MicroStat>
            <MicroStat tone="muted">{stats?.inquiries.last30Days ?? 0} this month</MicroStat>
          </div>
          {latestInquiry ? (
            <blockquote className="mt-4 rounded-2xl bg-[#f8f9fa] p-4">
              <p className="text-[15px] leading-relaxed text-[#3c4043] line-clamp-2">“{latestInquiry.message}”</p>
              <footer className="mt-2 text-[13px] text-[#5f6368]">
                {latestInquiry.name} · {latestInquiry.property?.name}
              </footer>
            </blockquote>
          ) : (
            <p className="mt-3 text-base leading-relaxed text-[#5f6368]">
              Buyer questions land here the moment your listings go live.
            </p>
          )}
          <Link
            href="/dashboard/inquiries"
            className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[15px] font-medium text-white hover:bg-[#1765cc] transition-colors"
          >
            {newInquiries > 0 ? 'Reply now' : 'Open inbox'} <ArrowRight size={14} />
          </Link>
        </Card>

        {/* Sales pipeline — reservations */}
        <Card className="border-[#dadce0] bg-white" delay={0.12}>
          <CardLabel icon={<Landmark size={12} />}>Sales pipeline</CardLabel>
          <CardTitle>Reservations on their way to sales</CardTitle>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <MicroStat tone={activeReservations.length > 0 ? 'good' : 'muted'}>
              {activeReservations.length} active reservation{activeReservations.length === 1 ? '' : 's'}
            </MicroStat>
            {completedSales > 0 && <MicroStat tone="up">{completedSales} completed sale{completedSales === 1 ? '' : 's'}</MicroStat>}
          </div>
          {activeReservations.length > 0 ? (
            <>
              <p className="mt-2 text-base text-[#5f6368]">
                <span className="font-medium text-[#202124]">{fmtUsd(pipelineValue)}</span> in play
              </p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {Object.entries(stageCounts).map(([stage, count]) => (
                  <MicroStat key={stage} tone={stage === 'FINAL_PAYMENT' ? 'up' : 'muted'}>
                    {count} {STAGE_LABELS[stage] ?? stage.toLowerCase()}
                  </MicroStat>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-2 text-base leading-relaxed text-[#5f6368]">
              Unit reservations and their progress to sale show up here.
            </p>
          )}
          <Link
            href="/dashboard/units"
            className="mt-5 inline-flex items-center gap-1 text-[15px] font-medium text-[#1a73e8] hover:text-[#1765cc] transition-colors"
          >
            Track inventory <ArrowRight size={14} />
          </Link>
        </Card>

        {/* Bookings — schedule card */}
        <Card className="border-transparent bg-[#f8f9fa]" delay={0.15}>
          <CardLabel icon={<CalendarDays size={12} />}>Bookings</CardLabel>
          <CardTitle>Viewings, confirmed without the back-and-forth</CardTitle>
          <div className="mt-3">
            <MicroStat tone={pendingBookings > 0 ? 'warn' : 'good'}>
              {pendingBookings > 0 ? `${pendingBookings} viewing${pendingBookings === 1 ? '' : 's'} to confirm` : 'nothing pending'}
            </MicroStat>
          </div>
          {nextBooking ? (
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f0fe] text-[#1a73e8]">
                <Clock3 size={16} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium text-[#202124]">
                  {nextBooking.name} · {nextBooking.type === 'VIRTUAL' ? 'Virtual' : 'In person'}
                </p>
                <p className="text-[13px] text-[#5f6368]">
                  {new Date(nextBooking.date).toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric' })} at {nextBooking.time}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-base leading-relaxed text-[#5f6368]">
              Viewing requests appear here for you to confirm or reschedule.
            </p>
          )}
          <Link
            href="/dashboard/bookings"
            className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-5 py-2.5 text-[15px] font-medium text-[#1a73e8] hover:bg-[#f8fbff] transition-colors"
          >
            Review bookings <ArrowRight size={14} />
          </Link>
        </Card>

        {/* Units — inventory card */}
        <Card className="border-[#dadce0] bg-white" delay={0.2}>
          <CardLabel icon={<DoorOpen size={12} />}>Units</CardLabel>
          <CardTitle>Inventory at a glance</CardTitle>
          <div className="mt-3 flex items-center gap-3">
            <MicroStat tone={unitTotals.available > 0 ? 'good' : 'muted'}>{unitTotals.available} available</MicroStat>
            {unitsTaken > 0 && <MicroStat tone="bad">{unitsTaken} taken</MicroStat>}
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#f1f3f4]">
            <div className="h-full rounded-full bg-[#34a853] transition-all" style={{ width: `${availablePct}%` }} />
          </div>
          <p className="mt-2 text-[13px] text-[#5f6368]">
            {unitTotals.total === 0 ? 'No units yet — add them per development' : `${availablePct}% of ${unitTotals.total} units still available`}
          </p>
          <Link
            href="/dashboard/units"
            className="mt-5 inline-flex items-center gap-1 text-[15px] font-medium text-[#1a73e8] hover:text-[#1765cc] transition-colors"
          >
            View inventory <ArrowRight size={14} />
          </Link>
        </Card>

        {/* Profile — verification card */}
        <Card className="border-transparent bg-[#f8f9fa]" delay={0.25}>
          <CardLabel icon={<BadgeCheck size={12} />}>Company profile</CardLabel>
          <CardTitle>{profile?.companyName ?? '—'}</CardTitle>
          <div className="mt-2">
            {profile?.kybStatus === 'APPROVED' && <MicroStat tone="good">verified developer</MicroStat>}
            {profile?.kybStatus === 'PENDING' && <MicroStat tone="warn">verification in review</MicroStat>}
            {profile?.kybStatus === 'REJECTED' && <MicroStat tone="bad">verification rejected</MicroStat>}
            {profile?.kybStatus === 'NOT_SUBMITTED' && <MicroStat tone="muted">not verified yet</MicroStat>}
          </div>
          <p className="mt-2 text-base leading-relaxed text-[#5f6368]">
            What buyers see on your public developer page.
          </p>
          {profile?.kybStatus === 'NOT_SUBMITTED' ? (
            <Link href="/onboarding" className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[15px] font-medium text-white hover:bg-[#1765cc] transition-colors">
              Get verified <ArrowRight size={14} />
            </Link>
          ) : profile?.kybStatus === 'REJECTED' ? (
            <Link href="/dashboard/profile" className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[#fce8e6] px-5 py-2.5 text-[15px] font-medium text-[#c5221f] hover:bg-[#fad2cf] transition-colors">
              Fix verification <ArrowRight size={14} />
            </Link>
          ) : (
            <Link href="/dashboard/profile" className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-5 py-2.5 text-[15px] font-medium text-[#1a73e8] hover:bg-[#f8fbff] transition-colors">
              View profile <ArrowRight size={14} />
            </Link>
          )}
        </Card>

        {/* Billing snapshot */}
        <Card className="border-[#dadce0] bg-white" delay={0.28}>
          <CardLabel icon={<Receipt size={12} />}>Billing</CardLabel>
          <CardTitle>{fmtUsd(monthlyFees)} <span className="text-[15px] text-[#5f6368]">/month</span></CardTitle>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <MicroStat tone={liveProps > 0 ? 'good' : 'muted'}>
              {liveProps} live listing{liveProps === 1 ? '' : 's'} × {fmtUsd(LISTING_FEE_MONTHLY)}
            </MicroStat>
            {pendingServices > 0 && <MicroStat tone="warn">{fmtUsd(pendingServices)} production pending</MicroStat>}
          </div>
          <p className="mt-2 text-base leading-relaxed text-[#5f6368]">
            Listing fees start only when a development goes live. Production services are one-time, per development.
          </p>
          <Link
            href="/dashboard/billing"
            className="mt-5 inline-flex items-center gap-1 text-[15px] font-medium text-[#1a73e8] hover:text-[#1765cc] transition-colors"
          >
            View billing <ArrowRight size={14} />
          </Link>
        </Card>

        {/* Rentals — compact */}
        <Card className="border-[#dadce0] bg-white" delay={0.3}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardLabel icon={<Home size={12} />}>Rentals</CardLabel>
              <div className="mt-3">
                <MicroStat tone={(rentalsData?.total ?? 0) > 0 ? 'good' : 'muted'}>
                  {rentalsData?.total ?? 0} active listing{(rentalsData?.total ?? 0) === 1 ? '' : 's'}
                </MicroStat>
              </div>
              <p className="mt-2 text-sm text-gray-600">Rental units and tenant applications.</p>
            </div>
            <Link
              href="/dashboard/rentals"
              aria-label="Manage rentals"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all"
            >
              <ArrowRight size={15} />
            </Link>
          </div>
        </Card>

        {/* Documents — compact */}
        <Card className="border-gray-100 bg-gray-50" delay={0.35}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardLabel icon={<FileText size={12} />}>Documents</CardLabel>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Title deeds, brochures and approvals — reviewed and stored in one place.
              </p>
            </div>
            <Link
              href="/dashboard/documents"
              aria-label="Open documents"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all"
            >
              <ArrowRight size={15} />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

/** White hero card mirroring the live KYB / onboarding state. */
function StatusCard({ profile }: { profile?: DeveloperProfileLite }) {
  if (!profile) {
    return (
      <div className="flex min-h-[170px] items-center justify-center rounded-2xl bg-white/90 p-6 shadow-sm backdrop-blur">
        <Loader2 size={22} className="animate-spin text-gray-300" />
      </div>
    );
  }

  const state = {
    NOT_SUBMITTED: {
      icon: <Clock3 size={22} className="text-amber-500" />,
      title: 'Finish setting up your account',
      body: 'Complete onboarding to submit your verification documents and unlock the verified badge.',
      cta: { label: 'Continue onboarding', href: '/onboarding' },
    },
    PENDING: {
      icon: <Loader2 size={22} className="animate-spin text-brand-600" />,
      title: 'Reviewing your documents',
      body: 'Our compliance team is verifying your company — we’ll email you the moment it’s done (1–2 business days).',
      cta: { label: 'View profile', href: '/dashboard/profile' },
    },
    APPROVED: {
      icon: <ShieldCheck size={22} className="text-emerald-500" />,
      title: 'You’re a verified developer',
      body: 'Your listings carry the verified badge. Add your next development whenever you’re ready.',
      cta: { label: 'Add development', href: '/dashboard/developments/new' },
    },
    REJECTED: {
      icon: <Clock3 size={22} className="text-red-500" />,
      title: 'Verification needs attention',
      body: 'Some documents were rejected — review the feedback and resubmit from your profile.',
      cta: { label: 'Review profile', href: '/dashboard/profile' },
    },
  }[profile.kybStatus];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl bg-white p-6 shadow-sm"
    >
      {state.icon}
      <h3 className="mt-3 text-sm font-semibold text-gray-900">{state.title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-gray-600">{state.body}</p>
      <Link
        href={state.cta.href}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
      >
        {state.cta.label} <ArrowUpRight size={13} />
      </Link>
    </motion.div>
  );
}
