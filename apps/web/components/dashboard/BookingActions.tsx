'use client';

import { useState } from 'react';
import { Check, Copy, ExternalLink, Loader2, Mail, Phone, Video, CalendarPlus } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Booking {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  date: string;
  time: string;
  type: string;
  status: string;
  meetingUrl?: string | null;
  property?: { name?: string | null } | null;
}

interface Props {
  booking: Booking;
  onSetMeeting: (meetingUrl: string) => void;
  onComplete: () => void;
  busy?: boolean;
}

/**
 * What a developer can actually do with a confirmed booking.
 *
 * Confirming used to be the end of the road: the status changed and nothing
 * followed, so neither side had a way to reach the other or — for a virtual
 * tour — anywhere to meet. This is that missing half.
 */
export function BookingActions({ booking, onSetMeeting, onComplete, busy }: Props) {
  const isVirtual = booking.type === 'VIRTUAL';
  const [url, setUrl] = useState(booking.meetingUrl ?? '');
  const [editing, setEditing] = useState(!booking.meetingUrl);
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (!booking.meetingUrl) return;
    try {
      await navigator.clipboard.writeText(booking.meetingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the link is visible either way.
    }
  }

  /**
   * A calendar file rather than a "we'll email you" promise — this is the
   * thing that stops a confirmed viewing being forgotten. Built client-side
   * so it needs no endpoint.
   */
  function downloadIcs() {
    const start = new Date(`${booking.date.slice(0, 10)}T${booking.time}:00`);
    const end = new Date(start.getTime() + 45 * 60 * 1000);
    const stamp = (d: Date) => `${d.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
    const title = `Viewing — ${booking.property?.name ?? 'Property'}`;
    const body = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//e-resi//viewing//EN',
      'BEGIN:VEVENT',
      `UID:${booking.id}@e-resi.com`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:Viewing with ${booking.name}${
        booking.meetingUrl ? `\\nJoin: ${booking.meetingUrl}` : ''
      }`,
      ...(booking.meetingUrl ? [`URL:${booking.meetingUrl}`] : []),
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([body], { type: 'text/calendar;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = `viewing-${booking.id.slice(0, 8)}.ics`;
    a.click();
    URL.revokeObjectURL(href);
  }

  return (
    <div className="mt-3 rounded-2xl border border-[#dadce0] bg-[#f8f9fa] p-3.5">
      {/* ── Virtual: the meeting link ── */}
      {isVirtual && (
        <div className="mb-3">
          <p className="mb-2 flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-wide text-[#5f6368]">
            <Video size={13} /> Virtual viewing
          </p>

          {booking.meetingUrl && !editing ? (
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={booking.meetingUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#1a73e8] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#1765cc]"
              >
                <ExternalLink size={13} /> Join the tour
              </a>
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-3.5 py-2 text-[13px] font-medium text-[#202124] transition-colors hover:bg-[#f1f3f4] cursor-pointer"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied' : 'Copy link'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-[13px] font-medium text-[#1a73e8] hover:underline cursor-pointer"
              >
                Change
              </button>
              <p className="w-full truncate text-[12px] text-[#5f6368]" title={booking.meetingUrl}>
                {booking.meetingUrl}
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste your Zoom, Meet or Teams link"
                className="h-10 min-w-0 flex-1 rounded-xl border border-[#dadce0] bg-white px-3 text-[14px] text-[#202124] outline-none focus:border-[#1a73e8]"
              />
              <button
                type="button"
                onClick={() => {
                  if (!url.trim()) return;
                  onSetMeeting(url.trim());
                  setEditing(false);
                }}
                disabled={busy || !url.trim()}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#1a73e8] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-40 cursor-pointer"
              >
                {busy && <Loader2 size={13} className="animate-spin" />}
                Save link
              </button>
              {booking.meetingUrl && (
                <button
                  type="button"
                  onClick={() => { setUrl(booking.meetingUrl ?? ''); setEditing(false); }}
                  className="text-[13px] text-[#5f6368] hover:text-[#202124] cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <p className="w-full text-[12px] text-[#5f6368]">
                Both of you join at the time above. The link is sent to {booking.name} as soon
                as you save it.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Reaching the person ── */}
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={`mailto:${booking.email}?subject=${encodeURIComponent(
            `Your viewing at ${booking.property?.name ?? 'our development'}`,
          )}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-3.5 py-2 text-[13px] font-medium text-[#202124] transition-colors hover:bg-[#f1f3f4]"
        >
          <Mail size={13} /> Email
        </a>
        {booking.phone && (
          <>
            <a
              href={`tel:${booking.phone}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-3.5 py-2 text-[13px] font-medium text-[#202124] transition-colors hover:bg-[#f1f3f4]"
            >
              <Phone size={13} /> Call
            </a>
            <a
              href={`https://wa.me/${booking.phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-3.5 py-2 text-[13px] font-medium text-[#202124] transition-colors hover:bg-[#f1f3f4]"
            >
              WhatsApp
            </a>
          </>
        )}
        <button
          type="button"
          onClick={downloadIcs}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-3.5 py-2 text-[13px] font-medium text-[#202124] transition-colors hover:bg-[#f1f3f4] cursor-pointer"
        >
          <CalendarPlus size={13} /> Add to calendar
        </button>

        <button
          type="button"
          onClick={onComplete}
          disabled={busy}
          className={cn(
            'ml-auto inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] bg-white px-3.5 py-2 text-[13px] font-medium text-[#188038] transition-colors hover:bg-[#e6f4ea] cursor-pointer disabled:opacity-40',
          )}
        >
          <Check size={13} /> Mark as done
        </button>
      </div>
    </div>
  );
}
