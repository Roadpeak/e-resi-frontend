'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Video, MapPin, CheckCircle2, Clock, XCircle, CalendarDays, Loader2 } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/Button';
import { useDeveloperBookings, useUpdateBookingStatus } from '../../../../lib/api/queries';

type StatusEntry = { label: string; icon: (props: { size: number }) => React.ReactNode; color: string; bg: string };
const statusConfig: Record<string, StatusEntry> = {
  CONFIRMED: { label: 'Confirmed', icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  PENDING: { label: 'Pending', icon: Clock, color: 'text-gold-700', bg: 'bg-gold-50 border-gold-200' },
  CANCELLED: { label: 'Cancelled', icon: XCircle, color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  COMPLETED: { label: 'Completed', icon: CheckCircle2, color: 'text-gray-500', bg: 'bg-gray-100 border-gray-200' },
  NO_SHOW: { label: 'No Show', icon: XCircle, color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
};

export default function DashboardBookings() {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const { data, isLoading } = useDeveloperBookings({ limit: 50 });
  const updateStatus = useUpdateBookingStatus();

  const bookings = data?.items ?? [];
  const upcoming = bookings.filter((b) => b.status !== 'CANCELLED' && b.status !== 'COMPLETED');

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Bookings</h2>
          <p className="text-sm text-gray-500 mt-0.5">{upcoming.length} upcoming viewings</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-1">
          {(['list', 'calendar'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-all cursor-pointer',
                view === v ? 'bg-brand-600 text-white' : 'text-gray-500 hover:text-gray-900',
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* List view */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="text-gray-400 animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-gray-300">
          <CalendarDays size={32} className="mb-3 text-gray-300" />
          <p className="text-sm text-gray-500">No bookings yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b, i) => {
            const config = statusConfig[b.status] ?? statusConfig.PENDING;
            const Icon = config.icon;
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-5 rounded-2xl border border-gray-200 bg-white p-5 hover:border-gray-300 transition-colors"
              >
                {/* Date block */}
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 leading-none">
                  <span className="text-[10px] text-gray-500 uppercase">{new Date(b.date).toLocaleDateString('en', { month: 'short' })}</span>
                  <span className="text-xl font-bold text-gray-900 mt-0.5">{new Date(b.date).getDate()}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{b.name}</p>
                  <p className="text-sm text-gray-500">{b.property.name}</p>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <CalendarDays size={11} />{b.time}
                    </span>
                    <span className="flex items-center gap-1">
                      {b.type === 'VIRTUAL' ? <Video size={11} /> : <MapPin size={11} />}
                      {b.type === 'VIRTUAL' ? 'Virtual Tour' : 'Physical Visit'}
                    </span>
                  </div>
                </div>

                {/* Status + actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium', config.bg, config.color)}>
                    <Icon size={11} /> {config.label}
                  </span>
                  {b.status === 'PENDING' && (
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={updateStatus.isPending}
                        onClick={() => updateStatus.mutate({ id: b.id, status: 'CONFIRMED' })}
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateStatus.mutate({ id: b.id, status: 'CANCELLED' })}
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Mini calendar grid (visual) */}
      {view === 'calendar' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-gray-200 bg-white p-6"
        >
          <p className="text-sm font-semibold text-gray-900 mb-4">
            {new Date().toLocaleDateString('en', { month: 'long', year: 'numeric' })}
          </p>
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <p key={d} className="text-xs text-gray-400 py-1">{d}</p>
            ))}
            {/* Offset for month start */}
            {Array.from({ length: (new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() + 6) % 7 }).map((_, i) => (
              <div key={i} />
            ))}
            {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map((day) => {
              const hasBooking = bookings.some((b) => {
                const d = new Date(b.date);
                return d.getDate() === day && d.getMonth() === new Date().getMonth() && b.status !== 'CANCELLED';
              });
              return (
                <button
                  key={day}
                  className={cn(
                    'rounded-xl py-2 text-sm transition-all cursor-pointer',
                    hasBooking ? 'bg-brand-600 text-white font-semibold' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900',
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
