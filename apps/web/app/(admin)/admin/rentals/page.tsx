'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MaterialIcon } from '../../../../components/dashboard/MaterialIcon';
import { adminOpsApi, type AdminConversation } from '../../../../lib/api/admin';
import { ApiError } from '../../../../lib/api/client';
import { cn } from '../../../../lib/utils';

const cardCls = 'rounded-3xl border border-[#dadce0] bg-white';

type Tab = 'rentals' | 'inquiries' | 'bookings' | 'chat';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'rentals', label: 'Rent listings', icon: 'key' },
  { key: 'inquiries', label: 'Inquiries', icon: 'forum' },
  { key: 'bookings', label: 'Viewings', icon: 'event' },
  { key: 'chat', label: 'Conversations', icon: 'chat' },
];

const CHIP: Record<string, string> = {
  AVAILABLE: 'bg-[#e6f4ea] text-[#188038]',
  PARTIALLY_AVAILABLE: 'bg-[#fef7e0] text-[#b06000]',
  FULLY_LET: 'bg-[#f1f3f4] text-[#5f6368]',
  ARCHIVED: 'bg-[#f1f3f4] text-[#5f6368]',
  NEW: 'bg-[#e8f0fe] text-[#1967d2]',
  READ: 'bg-[#f1f3f4] text-[#5f6368]',
  REPLIED: 'bg-[#e6f4ea] text-[#188038]',
  CLOSED: 'bg-[#f1f3f4] text-[#5f6368]',
  PENDING: 'bg-[#fef7e0] text-[#b06000]',
  CONFIRMED: 'bg-[#e6f4ea] text-[#188038]',
  COMPLETED: 'bg-[#e6f4ea] text-[#188038]',
  CANCELLED: 'bg-[#fce8e6] text-[#c5221f]',
};

export default function AdminOperations() {
  const [tab, setTab] = useState<Tab>('rentals');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-normal text-[#202124]">Operations</h1>
        <p className="text-[14px] text-[#5f6368]">
          Rentals, leads and conversations across every developer.
        </p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-[#dadce0]">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-[14px] font-medium transition-colors cursor-pointer',
              tab === t.key
                ? 'border-[#1a73e8] text-[#1a73e8]'
                : 'border-transparent text-[#5f6368] hover:text-[#202124]',
            )}
          >
            <MaterialIcon name={t.icon} size={18} fill={tab === t.key} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'rentals' && <RentalsTab />}
      {tab === 'inquiries' && <InquiriesTab />}
      {tab === 'bookings' && <BookingsTab />}
      {tab === 'chat' && <ChatTab />}
    </div>
  );
}

/* ── Rentals ────────────────────────────────────────────────────── */

function RentalsTab() {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['admin-rentals'],
    queryFn: () => adminOpsApi.rentals({ limit: 50 }),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminOpsApi.setRentalStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-rentals'] }),
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not update'),
  });

  if (isLoading) return <Loading />;
  const rows = data?.data ?? [];
  if (!rows.length) return <Empty icon="key" label="No rent listings." />;

  return (
    <div className="space-y-3">
      {error && <p className="rounded-xl bg-[#fce8e6] px-4 py-3 text-[14px] text-[#c5221f]">{error}</p>}
      {rows.map((r) => {
        const available = (r.rentUnits ?? []).reduce((n, u) => n + u.available, 0);
        const total = (r.rentUnits ?? []).reduce((n, u) => n + u.total, 0);
        return (
          <div key={r.id} className={cn(cardCls, 'flex flex-wrap items-center gap-4 p-4')}>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium text-[#202124]">{r.name}</p>
              <p className="text-[13px] text-[#5f6368]">
                {r.developer?.companyName ?? '—'}
                {r.property && ` · ${r.property.name}`}
              </p>
              <p className="mt-0.5 text-[12px] text-[#80868b]">
                {(r.rentUnits ?? []).length} unit type
                {(r.rentUnits ?? []).length === 1 ? '' : 's'} · {available}/{total} available
              </p>
            </div>
            <span className={cn('rounded-full px-3 py-1 text-[12px] font-medium', CHIP[r.status])}>
              {r.status.replace(/_/g, ' ').toLowerCase()}
            </span>
            <button
              onClick={() =>
                setStatus.mutate({
                  id: r.id,
                  status: r.status === 'ARCHIVED' ? 'AVAILABLE' : 'ARCHIVED',
                })
              }
              className="rounded-full border border-[#dadce0] px-3.5 py-2 text-[13px] font-medium text-[#5f6368] transition-colors hover:bg-[#f1f3f4] cursor-pointer"
            >
              {r.status === 'ARCHIVED' ? 'Restore' : 'Take down'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ── Inquiries ──────────────────────────────────────────────────── */

function InquiriesTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-inquiries'],
    queryFn: () => adminOpsApi.inquiries({ limit: 50 }),
  });

  if (isLoading) return <Loading />;
  const rows = data?.data ?? [];
  if (!rows.length) return <Empty icon="forum" label="No inquiries." />;

  return (
    <div className={cn(cardCls, 'overflow-hidden')}>
      <table className="w-full text-left">
        <thead className="border-b border-[#dadce0] bg-[#f8f9fa]">
          <tr className="text-[12px] uppercase tracking-wide text-[#5f6368]">
            <th className="px-5 py-3 font-medium">When</th>
            <th className="px-5 py-3 font-medium">From</th>
            <th className="px-5 py-3 font-medium">Property</th>
            <th className="px-5 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f1f3f4]">
          {rows.map((i) => (
            <tr key={i.id} className="text-[14px] text-[#202124]">
              <td className="whitespace-nowrap px-5 py-3 text-[#5f6368]">
                {new Date(i.createdAt).toLocaleDateString()}
              </td>
              <td className="px-5 py-3">
                <p className="font-medium">{i.name}</p>
                <p className="text-[12px] text-[#5f6368]">{i.email}</p>
              </td>
              <td className="px-5 py-3">
                <p>{i.property?.name ?? '—'}</p>
                <p className="text-[12px] text-[#80868b]">
                  {i.property?.developer?.companyName ?? ''}
                </p>
              </td>
              <td className="px-5 py-3">
                <span className={cn('rounded-full px-2.5 py-1 text-[12px] font-medium', CHIP[i.status])}>
                  {i.status.toLowerCase()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Bookings ───────────────────────────────────────────────────── */

function BookingsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => adminOpsApi.bookings({ limit: 50 }),
  });

  if (isLoading) return <Loading />;
  const rows = data?.data ?? [];
  if (!rows.length) return <Empty icon="event" label="No viewings booked." />;

  return (
    <div className={cn(cardCls, 'overflow-hidden')}>
      <table className="w-full text-left">
        <thead className="border-b border-[#dadce0] bg-[#f8f9fa]">
          <tr className="text-[12px] uppercase tracking-wide text-[#5f6368]">
            <th className="px-5 py-3 font-medium">Scheduled</th>
            <th className="px-5 py-3 font-medium">Visitor</th>
            <th className="px-5 py-3 font-medium">Property</th>
            <th className="px-5 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f1f3f4]">
          {rows.map((b) => (
            <tr key={b.id} className="text-[14px] text-[#202124]">
              <td className="whitespace-nowrap px-5 py-3 text-[#5f6368]">
                {b.scheduledAt ? new Date(b.scheduledAt).toLocaleString() : '—'}
              </td>
              <td className="px-5 py-3">
                {`${b.user?.firstName ?? ''} ${b.user?.lastName ?? ''}`.trim() || b.user?.email || '—'}
              </td>
              <td className="px-5 py-3">
                <p>{b.property?.name ?? '—'}</p>
                <p className="text-[12px] text-[#80868b]">
                  {b.property?.developer?.companyName ?? ''}
                </p>
              </td>
              <td className="px-5 py-3">
                <span className={cn('rounded-full px-2.5 py-1 text-[12px] font-medium', CHIP[b.status])}>
                  {b.status.toLowerCase()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Chat moderation ────────────────────────────────────────────── */

function ChatTab() {
  const [open, setOpen] = useState<AdminConversation | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-conversations'],
    queryFn: () => adminOpsApi.conversations({ limit: 50 }),
  });
  const { data: transcript, isLoading: loadingTranscript } = useQuery({
    queryKey: ['admin-transcript', open?.id],
    queryFn: () => adminOpsApi.transcript(open!.id),
    enabled: !!open,
  });

  if (isLoading) return <Loading />;
  const rows = data?.data ?? [];
  if (!rows.length) return <Empty icon="chat" label="No conversations yet." />;

  const name = (u?: { firstName?: string; lastName?: string; email?: string } | null) =>
    `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim() || u?.email || '—';

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <div className="space-y-2">
        {rows.map((c) => (
          <button
            key={c.id}
            onClick={() => setOpen(c)}
            className={cn(
              cardCls,
              'w-full p-4 text-left transition-colors cursor-pointer hover:bg-[#f8f9fa]',
              open?.id === c.id && 'border-[#1a73e8] bg-[#e8f0fe]',
            )}
          >
            <p className="text-[14px] font-medium text-[#202124]">
              {name(c.customer)} ↔ {name(c.developer)}
            </p>
            <p className="text-[12px] text-[#5f6368]">
              {c._count?.messages ?? 0} message{(c._count?.messages ?? 0) === 1 ? '' : 's'} · last{' '}
              {new Date(c.lastMessageAt).toLocaleDateString()}
            </p>
            {(c.property || c.rentListing) && (
              <p className="mt-0.5 truncate text-[12px] text-[#1967d2]">
                about {c.property?.name ?? c.rentListing?.name}
              </p>
            )}
          </button>
        ))}
      </div>

      <div className={cn(cardCls, 'p-5')}>
        {!open ? (
          <div className="py-16 text-center">
            <MaterialIcon name="forum" size={26} className="text-[#80868b]" />
            <p className="mt-2 text-[14px] text-[#5f6368]">
              Select a conversation to read the transcript.
            </p>
          </div>
        ) : loadingTranscript ? (
          <Loading />
        ) : (
          <>
            {(transcript?.conversation.property || transcript?.conversation.rentListing) && (
              <p className="mb-2 text-[13px] text-[#5f6368]">
                About{' '}
                <span className="font-medium text-[#202124]">
                  {transcript.conversation.property?.name ?? transcript.conversation.rentListing?.name}
                </span>
              </p>
            )}
            <div className="mb-3 flex items-start gap-2.5 rounded-2xl border border-[#f9ab00] bg-[#fffbf0] px-3.5 py-2.5">
              <MaterialIcon name="visibility" size={16} className="mt-0.5 text-[#b06000]" />
              <p className="text-[12px] text-[#5f6368]">
                Private messages. Opening a transcript is recorded in the audit log.
              </p>
            </div>
            <div className="max-h-[520px] space-y-2 overflow-y-auto">
              {(transcript?.messages ?? []).map((m) => (
                <div key={m.id} className="rounded-2xl bg-[#f8f9fa] px-3.5 py-2.5">
                  <p className="text-[12px] font-medium text-[#5f6368]">
                    {name(m.sender)} · {new Date(m.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-1 text-[14px] text-[#202124]">{m.body}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Shared ─────────────────────────────────────────────────────── */

function Loading() {
  return (
    <div className="flex h-40 items-center justify-center">
      <MaterialIcon name="progress_activity" size={26} className="animate-spin text-[#80868b]" />
    </div>
  );
}

function Empty({ icon, label }: { icon: string; label: string }) {
  return (
    <div className={cn(cardCls, 'px-6 py-16 text-center')}>
      <MaterialIcon name={icon} size={28} className="text-[#80868b]" />
      <p className="mt-2 text-[15px] text-[#5f6368]">{label}</p>
    </div>
  );
}
