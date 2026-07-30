'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Video, MapPin, CalendarDays, Clock, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/Button';
import { useMyBookings } from '../../../../lib/api/queries';
import type { Booking } from '../../../../lib/api/bookings-api';

type StatusEntry = { label: string; icon: (props: { size: number }) => React.ReactNode; color: string; bg: string };
const statusConfig: Record<string, StatusEntry> = {
  CONFIRMED: { label: 'Confirmed', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  PENDING: { label: 'Pending Confirmation', icon: Clock, color: 'text-gold-400', bg: 'bg-gold-500/10 border-gold-500/20' },
  COMPLETED: { label: 'Completed', icon: CheckCircle2, color: 'text-white/30', bg: 'bg-white/5 border-white/10' },
  CANCELLED: { label: 'Cancelled', icon: Clock, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

export default function AccountViewings() {
  const { data, isLoading } = useMyBookings({ limit: 50 });
  const bookings = data?.items ?? [];
  const upcoming = bookings.filter((b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED');
  const past = bookings.filter((b) => b.status === 'COMPLETED' || b.status === 'CANCELLED');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="text-white/30 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      {/* Upcoming */}
      <div>
        <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-white/30">Upcoming Viewings</h3>
        {upcoming.length === 0 ? (
          <EmptyState label="No upcoming viewings" sub="Book a viewing from any property page." />
        ) : (
          <div className="space-y-4">
            {upcoming.map((b, i) => <ViewingCard key={b.id} booking={b} index={i} />)}
          </div>
        )}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div>
          <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-white/30">Past Viewings</h3>
          <div className="space-y-4 opacity-60">
            {past.map((b, i) => <ViewingCard key={b.id} booking={b} index={i} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function ViewingCard({ booking: b, index }: { booking: Booking; index: number }) {
  const config = statusConfig[b.status] ?? statusConfig.PENDING;
  const Icon = config.icon;
  const date = new Date(b.date);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="flex gap-4 rounded-2xl border border-white/5 bg-surface-800 p-5 hover:border-white/10 transition-colors"
    >
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <Link href={`/${b.property.slug}`} className="font-semibold text-white hover:text-brand-300 transition-colors flex items-center gap-1.5 group">
              {b.property.name}
              <ExternalLink size={12} className="text-white/20 group-hover:text-brand-400 transition-colors" />
            </Link>
          </div>
          <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium shrink-0', config.bg, config.color)}>
            <Icon size={11} /> {config.label}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs text-white/40 flex-wrap">
          <span className="flex items-center gap-1.5">
            <CalendarDays size={12} />
            {date.toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={12} /> {b.time}
          </span>
          <span className="flex items-center gap-1.5">
            {b.type === 'VIRTUAL' ? <Video size={12} /> : <MapPin size={12} />}
            {b.type === 'VIRTUAL' ? 'Virtual Tour' : 'Physical Visit'}
          </span>
        </div>

        {(b.status === 'CONFIRMED' || b.status === 'PENDING') && (
          <div className="mt-3 flex gap-2">
            {b.type === 'VIRTUAL' && b.status === 'CONFIRMED' && b.meetingUrl && (
              <Button size="sm" icon={<Video size={12} />} href={b.meetingUrl}>Join Virtual Tour</Button>
            )}
            <Button variant="ghost" size="sm" className="text-red-400/60 hover:text-red-400">Cancel</Button>
          </div>
        )}

        {b.status === 'COMPLETED' && (
          <div className="mt-3">
            <Button href={`/${b.property.slug}`} variant="outline" size="sm">Book Again</Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function EmptyState({ label, sub }: { label: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-14 text-center">
      <CalendarDays size={28} className="mb-3 text-white/15" />
      <p className="text-sm font-medium text-white/50">{label}</p>
      <p className="text-xs text-white/25 mt-1">{sub}</p>
    </div>
  );
}
