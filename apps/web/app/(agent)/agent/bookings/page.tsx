'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '../../../../lib/utils';
import { MaterialIcon } from '../../../../components/dashboard/MaterialIcon';
import { bookingsListApi, type Booking } from '../../../../lib/api/bookings-api';

/**
 * The agent's viewings — bookings that arrived through their links.
 *
 * The agent runs these viewings: they brought the client, they walk them
 * through, and the deal is theirs to close afterwards. Confirming and
 * cancelling from here is the operational half of the routing promise the
 * property page made when it said "your agent".
 */

const card = 'rounded-3xl border border-[#dadce0] bg-white';

const STATUS_TONES: Record<string, string> = {
  PENDING: 'bg-[#fef7e0] text-[#b06000]',
  CONFIRMED: 'bg-[#e6f4ea] text-[#137333]',
  COMPLETED: 'bg-[#f1f3f4] text-[#5f6368]',
  CANCELLED: 'bg-[#fce8e6] text-[#c5221f]',
  NO_SHOW: 'bg-[#fce8e6] text-[#c5221f]',
};

function BookingRow({ booking }: { booking: Booking }) {
  const [meetingUrl, setMeetingUrl] = useState('');
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ['agent-bookings'] });

  const setStatus = useMutation({
    mutationFn: (status: string) =>
      bookingsListApi.updateStatus(booking.id, status, meetingUrl.trim() || undefined),
    onSuccess: refresh,
  });

  const needsUrl = booking.type === 'VIRTUAL' && !booking.meetingUrl;

  return (
    <li className={cn(card, 'p-4')}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-[15px] font-medium text-[#202124]">{booking.name}</span>
            <span className={cn('rounded-full px-2 py-0.5 text-[11.5px] font-medium', STATUS_TONES[booking.status])}>
              {booking.status.toLowerCase().replace('_', ' ')}
            </span>
            <span className="rounded-full bg-[#f1f3f4] px-2 py-0.5 text-[11.5px] text-[#5f6368]">
              {booking.type === 'VIRTUAL' ? 'virtual' : 'in person'}
            </span>
          </span>
          <span className="mt-0.5 block truncate text-[13px] text-[#5f6368]">
            {booking.property.name} · {new Date(booking.date).toLocaleDateString()} at {booking.time}
            {booking.phone ? ` · ${booking.phone}` : ''}
          </span>
        </span>

        {booking.status === 'PENDING' && (
          <span className="flex flex-wrap items-center gap-2">
            {needsUrl && (
              <input
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder="Meeting link (required for virtual)"
                className="h-9 w-56 rounded-xl border border-[#dadce0] px-3 text-[13px] outline-none focus:border-[#1a73e8]"
              />
            )}
            <button
              onClick={() => setStatus.mutate('CONFIRMED')}
              disabled={setStatus.isPending || (needsUrl && !meetingUrl.trim())}
              className="h-9 cursor-pointer rounded-xl bg-[#1a73e8] px-3.5 text-[13px] font-medium text-white hover:bg-[#1765cc] disabled:opacity-40"
            >
              Confirm
            </button>
            <button
              onClick={() => setStatus.mutate('CANCELLED')}
              disabled={setStatus.isPending}
              className="h-9 cursor-pointer rounded-xl border border-[#dadce0] px-3.5 text-[13px] text-[#c5221f] hover:bg-[#fce8e6]"
            >
              Decline
            </button>
          </span>
        )}
        {booking.status === 'CONFIRMED' && (
          <button
            onClick={() => setStatus.mutate('COMPLETED')}
            disabled={setStatus.isPending}
            className="h-9 cursor-pointer rounded-xl border border-[#dadce0] px-3.5 text-[13px] text-[#202124] hover:bg-[#f8f9fa]"
          >
            Mark completed
          </button>
        )}
      </div>
      {setStatus.isError && (
        <p className="mt-2 text-[13px] text-[#c5221f]">{(setStatus.error as Error).message}</p>
      )}
      {booking.message && (
        <p className="mt-2 rounded-xl bg-[#f8f9fa] px-3 py-2 text-[13px] text-[#5f6368]">
          {booking.message}
        </p>
      )}
    </li>
  );
}

export default function AgentBookings() {
  const { data, isLoading } = useQuery({
    queryKey: ['agent-bookings'],
    queryFn: () => bookingsListApi.listForAgent({ limit: 50 }),
  });
  const bookings = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-normal text-[#202124]">Viewings</h1>
        <p className="text-[14px] text-[#5f6368]">
          Viewing requests that came through your links. You brought the
          client — the viewing is yours to confirm and run.
        </p>
      </div>

      {isLoading ? (
        <div className={cn(card, 'p-8 text-center text-[14px] text-[#5f6368]')}>Loading…</div>
      ) : bookings.length === 0 ? (
        <div className={cn(card, 'p-8 text-center')}>
          <MaterialIcon name="calendar_month" size={32} className="text-[#dadce0]" />
          <p className="mt-2 text-[15px] text-[#202124]">No viewings yet</p>
          <p className="mx-auto mt-1 max-w-md text-[13.5px] text-[#5f6368]">
            When someone books a viewing after following your shared link,
            it lands here for you to confirm — not with the developer.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {bookings.map((b) => <BookingRow key={b.id} booking={b} />)}
        </ul>
      )}
    </div>
  );
}
