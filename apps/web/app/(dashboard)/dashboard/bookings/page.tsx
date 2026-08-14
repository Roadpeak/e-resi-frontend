'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Video, MapPin, CheckCircle2, Clock, XCircle, CalendarDays, Loader2 } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/Button';
import { useDeveloperBookings, useUpdateBookingStatus } from '../../../../lib/api/queries';
import { BookingActions } from '../../../../components/dashboard/BookingActions';

type StatusEntry = { label: string; icon: (props: { size: number }) => React.ReactNode; color: string; bg: string };
const statusConfig: Record<string, StatusEntry> = {
  CONFIRMED: { label: 'Confirmed', icon: CheckCircle2, color: 'text-[#188038]', bg: 'bg-[#e6f4ea]' },
  PENDING: { label: 'Pending', icon: Clock, color: 'text-[#b06000]', bg: 'bg-[#fef7e0]' },
  CANCELLED: { label: 'Cancelled', icon: XCircle, color: 'text-[#5f6368]', bg: 'bg-[#f1f3f4]' },
  COMPLETED: { label: 'Completed', icon: CheckCircle2, color: 'text-[#188038]', bg: 'bg-[#e6f4ea]' },
  NO_SHOW: { label: 'No Show', icon: XCircle, color: 'text-[#c5221f]', bg: 'bg-[#fce8e6]' },
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
          <h2 className="text-[26px] sm:text-[28px] font-normal text-[#202124]">Bookings</h2>
          <p className="text-base text-[#5f6368] mt-1">{upcoming.length} upcoming viewings</p>
        </div>
        <div className="flex items-center gap-1">
          {(['list', 'calendar'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'rounded-full px-4 py-2 text-[15px] capitalize transition-all cursor-pointer',
                view === v ? 'bg-[#e8f0fe] text-[#1967d2] font-medium' : 'text-[#5f6368] hover:bg-[#f1f3f4]',
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
          <Loader2 size={28} className="text-[#80868b] animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border border-dashed border-[#dadce0]">
          <CalendarDays size={32} className="mb-3 text-[#dadce0]" />
          <p className="text-base text-[#5f6368]">No bookings yet</p>
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
                className="rounded-3xl border border-[#dadce0] bg-white p-5 transition-colors hover:bg-[#f8f9fa]"
              >
                <div className="flex items-center gap-5">
                {/* Date block */}
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#e8f0fe] leading-none">
                  <span className="text-[11px] font-medium text-[#1967d2] uppercase tracking-[0.08em]">{new Date(b.date).toLocaleDateString('en', { month: 'short' })}</span>
                  <span className="text-xl font-medium text-[#1967d2] mt-0.5">{new Date(b.date).getDate()}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium text-[#202124]">{b.name}</p>
                  <p className="text-[15px] text-[#5f6368]">{b.property.name}</p>
                  <div className="mt-1.5 flex items-center gap-3 text-[13px] text-[#5f6368]">
                    <span className="flex items-center gap-1">
                      <CalendarDays size={12} />{b.time}
                    </span>
                    <span className="flex items-center gap-1">
                      {b.type === 'VIRTUAL' ? <Video size={12} /> : <MapPin size={12} />}
                      {b.type === 'VIRTUAL' ? 'Virtual Tour' : 'Physical Visit'}
                    </span>
                  </div>
                </div>

                {/* Status + actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium', config.bg, config.color)}>
                    <Icon size={12} /> {config.label}
                  </span>
                  {b.status === 'PENDING' && (
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={updateStatus.isPending}
                        onClick={() => updateStatus.mutate({ id: b.id, status: 'CONFIRMED' })}
                        className="rounded-full bg-[#1a73e8] hover:bg-[#1765cc] border-transparent text-[13px] font-medium text-white h-9 px-4"
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateStatus.mutate({ id: b.id, status: 'CANCELLED' })}
                        className="rounded-full text-[13px] font-medium text-[#1a73e8] hover:bg-[#f8fbff] hover:text-[#1765cc] h-9 px-4"
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
                </div>

                {/* Confirming used to be the end of the road — a status change
                    and nothing else. These are the actions that make the
                    viewing actually happen. */}
                {b.status === 'CONFIRMED' && (
                  <BookingActions
                    booking={b as never}
                    busy={updateStatus.isPending}
                    onSetMeeting={(meetingUrl) =>
                      updateStatus.mutate({ id: b.id, status: 'CONFIRMED', meetingUrl })
                    }
                    onComplete={() => updateStatus.mutate({ id: b.id, status: 'COMPLETED' })}
                  />
                )}
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
          className="rounded-3xl border border-[#dadce0] bg-white p-6"
        >
          <p className="text-[15px] font-medium text-[#202124] mb-4">
            {new Date().toLocaleDateString('en', { month: 'long', year: 'numeric' })}
          </p>
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <p key={d} className="text-xs uppercase tracking-[0.08em] text-[#5f6368] py-1">{d}</p>
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
                    'rounded-full py-2 text-[15px] transition-all cursor-pointer',
                    hasBooking ? 'bg-[#1a73e8] text-white font-medium' : 'text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#202124]',
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
