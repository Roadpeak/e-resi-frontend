'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '../../../../lib/utils';
import { MaterialIcon } from '../../../../components/dashboard/MaterialIcon';
import { inquiriesApi, type Inquiry } from '../../../../lib/api/inquiries';

/**
 * The agent's inquiry inbox — leads that arrived through their links.
 *
 * These were routed here instead of to the developer because the enquirer
 * followed this agent's link: the platform promised them "this is your
 * agent", and this page is where that promise gets kept. A reply also opens
 * a chat thread with the enquirer when they have an account, so the
 * conversation continues where the agent can close it.
 */

const card = 'rounded-3xl border border-[#dadce0] bg-white';

const STATUS_TONES: Record<string, string> = {
  NEW: 'bg-[#e8f0fe] text-[#1967d2]',
  READ: 'bg-[#f1f3f4] text-[#5f6368]',
  REPLIED: 'bg-[#e6f4ea] text-[#137333]',
  CLOSED: 'bg-[#f1f3f4] text-[#5f6368]',
};

function InquiryRow({ inquiry }: { inquiry: Inquiry }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const qc = useQueryClient();

  const reply = useMutation({
    mutationFn: () => inquiriesApi.sendReply(inquiry.id, message.trim()),
    onSuccess: () => {
      setMessage('');
      setOpen(false);
      qc.invalidateQueries({ queryKey: ['agent-inquiries'] });
    },
  });

  return (
    <li className={cn(card, 'p-4')}>
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => setOpen(!open)} className="min-w-0 flex-1 cursor-pointer text-left">
          <span className="flex items-center gap-2">
            <span className="truncate text-[15px] font-medium text-[#202124]">{inquiry.name}</span>
            <span className={cn('rounded-full px-2 py-0.5 text-[11.5px] font-medium', STATUS_TONES[inquiry.status])}>
              {inquiry.status.toLowerCase()}
            </span>
          </span>
          <span className="mt-0.5 block truncate text-[13px] text-[#5f6368]">
            {inquiry.property?.name ?? 'Rental listing'} · {new Date(inquiry.createdAt).toLocaleDateString()}
            {inquiry.phone ? ` · ${inquiry.phone}` : ''}
          </span>
        </button>
        <MaterialIcon name={open ? 'expand_less' : 'expand_more'} size={20} className="text-[#5f6368]" />
      </div>

      {open && (
        <div className="mt-3 space-y-3">
          <p className="rounded-2xl bg-[#f8f9fa] px-4 py-3 text-[14px] leading-relaxed text-[#202124]">
            {inquiry.message}
          </p>
          <div className="flex gap-2">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your reply — it also opens a chat with them…"
              maxLength={2000}
              className="h-10 min-w-0 flex-1 rounded-xl border border-[#dadce0] px-3 text-[14px] outline-none focus:border-[#1a73e8]"
            />
            <button
              onClick={() => reply.mutate()}
              disabled={reply.isPending || !message.trim()}
              className="h-10 cursor-pointer rounded-xl bg-[#1a73e8] px-4 text-[14px] font-medium text-white hover:bg-[#1765cc] disabled:opacity-40"
            >
              {reply.isPending ? 'Sending…' : 'Reply'}
            </button>
          </div>
          {reply.isError && (
            <p className="text-[13px] text-[#c5221f]">{(reply.error as Error).message}</p>
          )}
        </div>
      )}
    </li>
  );
}

export default function AgentInquiries() {
  const { data, isLoading } = useQuery({
    queryKey: ['agent-inquiries'],
    queryFn: () => inquiriesApi.listForAgent({ limit: 50 }),
  });
  const inquiries = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-normal text-[#202124]">Inquiries</h1>
        <p className="text-[14px] text-[#5f6368]">
          Leads that came through your links. They followed you here — these
          are yours to answer, and to turn into deals.
        </p>
      </div>

      {isLoading ? (
        <div className={cn(card, 'p-8 text-center text-[14px] text-[#5f6368]')}>Loading…</div>
      ) : inquiries.length === 0 ? (
        <div className={cn(card, 'p-8 text-center')}>
          <MaterialIcon name="forum" size={32} className="text-[#dadce0]" />
          <p className="mt-2 text-[15px] text-[#202124]">No inquiries yet</p>
          <p className="mx-auto mt-1 max-w-md text-[13.5px] text-[#5f6368]">
            When someone enquires after following your shared link or a client
            room, the inquiry lands here — routed to you, not the developer.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {inquiries.map((i) => <InquiryRow key={i.id} inquiry={i} />)}
        </ul>
      )}
    </div>
  );
}
