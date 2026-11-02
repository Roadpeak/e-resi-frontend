'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, ExternalLink, Loader2, Mail, MessageCircleQuestion, Phone, RotateCcw, Search, UserRound } from 'lucide-react';
import { adminSupportApi, categoryLabel, type AdminSupportThread } from '../../lib/api/support';
import { cn } from '../../lib/utils';
import { SupportConversation, timeOf } from './SupportConversation';

const FILTERS = [
  { key: 'OPEN', label: 'Open' },
  { key: 'UNREAD', label: 'Unread' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'ALL', label: 'All' },
] as const;

const ROLE_LABEL: Record<string, string> = {
  DEVELOPER: 'Developer',
  AGENT: 'Agent',
  BUYER: 'Buyer',
  INVESTOR: 'Investor',
  TENANT: 'Tenant',
  ADMIN: 'Admin',
};

function whoLabel(t: AdminSupportThread) {
  return t.role ? ROLE_LABEL[t.role] ?? t.role : 'Visitor';
}

/** Kenyan numbers written locally (07…/01…) become 2547…/2541… for WhatsApp. */
function waNumber(phone: string) {
  const digits = phone.replace(/[^0-9]/g, '');
  return digits.startsWith('0') ? `254${digits.slice(1)}` : digits;
}

/**
 * Admin support inbox — every conversation people started with the e-resi
 * team, from any portal or from the public site. ?thread=<id> opens one.
 */
export function AdminSupportInbox() {
  const router = useRouter();
  const params = useSearchParams();
  const qc = useQueryClient();
  const selected = params.get('thread');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('OPEN');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setQuery(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data: list, isLoading } = useQuery({
    queryKey: ['admin-support', 'list', filter, query],
    queryFn: () => adminSupportApi.list({ filter, q: query || undefined }),
    refetchInterval: 20_000,
  });

  const { data: thread } = useQuery({
    queryKey: ['admin-support', 'thread', selected],
    queryFn: () => adminSupportApi.get(selected!),
    enabled: !!selected,
    refetchInterval: 15_000,
  });

  useEffect(() => {
    if (thread) {
      void qc.invalidateQueries({ queryKey: ['admin-support', 'list'] });
      void qc.invalidateQueries({ queryKey: ['admin-support', 'unread'] });
    }
  }, [thread?.id, qc]); // eslint-disable-line react-hooks/exhaustive-deps

  function select(id: string | null) {
    const next = new URLSearchParams(params.toString());
    if (id) next.set('thread', id);
    else next.delete('thread');
    router.replace(`?${next.toString()}`, { scroll: false });
  }

  async function setStatus(status: 'OPEN' | 'RESOLVED') {
    if (!thread) return;
    const updated = await adminSupportApi.setStatus(thread.id, status);
    qc.setQueryData(['admin-support', 'thread', thread.id], updated);
    void qc.invalidateQueries({ queryKey: ['admin-support', 'list'] });
  }

  const counts = list?.counts;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[28px] font-normal text-[#202124]">Support</h1>
        <p className="text-base text-[#5f6368]">
          Messages from developers, agents, buyers and visitors. Replies reach signed-in people in their
          portal and by email; visitors get them by email.
        </p>
      </div>

      <div className="grid h-[min(760px,calc(100vh-13rem))] min-h-[520px] overflow-hidden rounded-3xl border border-[#dadce0] bg-white lg:grid-cols-[360px_1fr_280px] md:grid-cols-[340px_1fr]">
        {/* ── List ── */}
        <aside className={cn('flex min-h-0 flex-col border-r border-[#f1f3f4]', selected && 'hidden md:flex')}>
          <div className="space-y-3 border-b border-[#f1f3f4] p-3">
            <label className="flex items-center gap-2 rounded-full bg-[#f1f3f4] px-3.5 py-2">
              <Search size={15} className="text-[#5f6368]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, email, phone, message"
                className="w-full bg-transparent text-[13.5px] text-[#202124] outline-none placeholder:text-[#80868b]"
              />
            </label>
            <div className="flex gap-1.5 overflow-x-auto">
              {FILTERS.map((f) => {
                const n = f.key === 'OPEN' ? counts?.open : f.key === 'UNREAD' ? counts?.unread : f.key === 'RESOLVED' ? counts?.resolved : undefined;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      'shrink-0 cursor-pointer rounded-full border px-3 py-1 text-[12.5px] transition-colors',
                      filter === f.key ? 'border-[#1a73e8] bg-[#e8f0fe] text-[#1967d2]' : 'border-[#dadce0] text-[#3c4043] hover:bg-[#f8f9fa]',
                    )}
                  >
                    {f.label}{n !== undefined ? ` · ${n}` : ''}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto" data-lenis-prevent>
            {isLoading ? (
              <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-[#80868b]" /></div>
            ) : !list?.items.length ? (
              <p className="px-6 py-12 text-center text-[13.5px] text-[#5f6368]">No conversations here.</p>
            ) : (
              <ul className="p-2">
                {list.items.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => select(t.id)}
                      className={cn(
                        'flex w-full cursor-pointer items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors',
                        selected === t.id ? 'bg-[#e8f0fe]' : 'hover:bg-[#f8f9fa]',
                      )}
                    >
                      <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', t.adminUnread ? 'bg-[#1a73e8]' : 'bg-transparent')} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className={cn('truncate text-[14px] text-[#202124]', t.adminUnread && 'font-medium')}>{t.name}</span>
                          <span className="shrink-0 text-[11px] text-[#80868b]">{timeOf(t.lastMessageAt)}</span>
                        </span>
                        <span className={cn('block truncate text-[13px]', t.adminUnread ? 'text-[#202124]' : 'text-[#3c4043]')}>{t.subject}</span>
                        <span className="mt-1 flex items-center gap-1.5">
                          <span className={cn('rounded-full px-2 py-px text-[10.5px] font-medium', t.role ? 'bg-[#f1f3f4] text-[#3c4043]' : 'bg-[#fef7e0] text-[#b06000]')}>
                            {whoLabel(t)}
                          </span>
                          <span className="truncate text-[11.5px] text-[#80868b]">{categoryLabel(t.category)}</span>
                          {t.status === 'RESOLVED' && <CheckCircle2 size={12} className="shrink-0 text-[#137333]" />}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* ── Conversation ── */}
        <section className={cn('flex min-h-0 flex-col', !selected && 'hidden md:flex')}>
          {selected && thread ? (
            <>
              <header className="flex items-center gap-3 border-b border-[#f1f3f4] px-4 py-3">
                <button
                  type="button"
                  onClick={() => select(null)}
                  aria-label="Back"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4] md:hidden"
                >
                  <ArrowLeft size={17} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-[#202124]">{thread.subject}</p>
                  <p className="truncate text-[12.5px] text-[#5f6368]">{thread.name} · {whoLabel(thread)} · {categoryLabel(thread.category)}</p>
                </div>
                {thread.status === 'OPEN' ? (
                  <button
                    type="button"
                    onClick={() => void setStatus('RESOLVED')}
                    className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[#dadce0] px-3 py-1.5 text-[13px] font-medium text-[#137333] hover:bg-[#e6f4ea]"
                  >
                    <CheckCircle2 size={14} /> Resolve
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void setStatus('OPEN')}
                    className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-[#dadce0] px-3 py-1.5 text-[13px] font-medium text-[#3c4043] hover:bg-[#f1f3f4]"
                  >
                    <RotateCcw size={14} /> Reopen
                  </button>
                )}
              </header>
              <SupportConversation
                side="admin"
                messages={thread.messages ?? []}
                placeholder={
                  thread.delivery === 'PHONE'
                    ? 'Add a note to the conversation (they left only a phone number)…'
                    : `Reply to ${thread.name.split(' ')[0]}…`
                }
                disabledNote={<DeliveryNote thread={thread} />}
                onSend={async (body) => {
                  const updated = await adminSupportApi.reply(thread.id, body);
                  qc.setQueryData(['admin-support', 'thread', thread.id], updated);
                  void qc.invalidateQueries({ queryKey: ['admin-support', 'list'] });
                }}
              />
            </>
          ) : selected ? (
            <div className="flex flex-1 items-center justify-center"><Loader2 size={20} className="animate-spin text-[#80868b]" /></div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <MessageCircleQuestion size={32} className="text-[#80868b]" />
              <p className="mt-3 text-[15px] text-[#3c4043]">Select a conversation to read and reply.</p>
            </div>
          )}
        </section>

        {/* ── Contact details ── */}
        <aside className="hidden min-h-0 overflow-y-auto border-l border-[#f1f3f4] p-4 lg:block" data-lenis-prevent>
          {thread && selected ? <ContactCard thread={thread} /> : null}
        </aside>
      </div>
    </div>
  );
}

/** How the reply will reach them — shown above the reply box. */
function DeliveryNote({ thread }: { thread: AdminSupportThread }) {
  const text =
    thread.delivery === 'ACCOUNT'
      ? 'Your reply appears in their e-resi portal and is emailed to them.'
      : thread.delivery === 'EMAIL'
        ? `Not signed in — your reply is emailed to ${thread.email}.`
        : null;
  if (thread.delivery === 'PHONE' && thread.phone) {
    return (
      <div className="flex flex-wrap items-center gap-2 border-t border-[#f1f3f4] bg-[#fef7e0] px-4 py-2 text-[12.5px] text-[#3c4043]">
        <span>They left only a phone number — reach them directly:</span>
        <a href={`tel:${thread.phone}`} className="font-medium text-[#1a73e8] hover:underline">Call {thread.phone}</a>
        <a href={`https://wa.me/${waNumber(thread.phone)}`} target="_blank" rel="noreferrer" className="font-medium text-[#137333] hover:underline">WhatsApp</a>
      </div>
    );
  }
  return text ? <p className="border-t border-[#f1f3f4] bg-[#f8f9fa] px-4 py-2 text-[12px] text-[#5f6368]">{text}</p> : null;
}

function ContactCard({ thread }: { thread: AdminSupportThread }) {
  const u = thread.user;
  const profileHref = u?.developerProfile
    ? `/admin/developers/${u.developerProfile.id}`
    : u?.agentProfile
      ? `/admin/agents/${u.agentProfile.id}`
      : null;
  const org = u?.developerProfile?.companyName ?? u?.agentProfile?.displayName ?? null;
  const email = thread.email ?? u?.email ?? null;
  const phone = thread.phone ?? u?.phone ?? null;

  return (
    <div className="space-y-4 text-[13.5px]">
      <div>
        <p className="text-[12px] font-medium uppercase tracking-wide text-[#80868b]">Contact</p>
        <p className="mt-2 flex items-center gap-2 text-[15px] font-medium text-[#202124]">
          <UserRound size={16} className="text-[#5f6368]" /> {thread.name}
        </p>
        <p className="mt-0.5 text-[12.5px] text-[#5f6368]">{whoLabel(thread)}{org ? ` · ${org}` : ''}</p>
      </div>

      <div className="space-y-2">
        {email && (
          <a href={`mailto:${email}`} className="flex items-center gap-2 break-all text-[#1a73e8] hover:underline">
            <Mail size={14} className="shrink-0" /> {email}
          </a>
        )}
        {phone && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <a href={`tel:${phone}`} className="flex items-center gap-2 text-[#1a73e8] hover:underline">
              <Phone size={14} className="shrink-0" /> {phone}
            </a>
            <a href={`https://wa.me/${waNumber(phone)}`} target="_blank" rel="noreferrer" className="text-[12.5px] font-medium text-[#137333] hover:underline">
              WhatsApp
            </a>
          </div>
        )}
      </div>

      {profileHref && (
        <Link href={profileHref} className="inline-flex items-center gap-1.5 font-medium text-[#1a73e8] hover:underline">
          Open {u?.developerProfile ? 'developer' : 'agent'} profile <ExternalLink size={13} />
        </Link>
      )}
      {u && !profileHref && (
        <Link href={`/admin/users?q=${encodeURIComponent(u.email)}`} className="inline-flex items-center gap-1.5 font-medium text-[#1a73e8] hover:underline">
          Open users list <ExternalLink size={13} />
        </Link>
      )}

      <div className="space-y-1 border-t border-[#f1f3f4] pt-4 text-[12.5px] text-[#5f6368]">
        <p>Started {timeOf(thread.createdAt)}</p>
        <p>{thread.messages?.length ?? 0} messages · {thread.status === 'RESOLVED' ? 'Resolved' : 'Open'}</p>
        {thread.pageUrl && (
          <p className="break-all">
            Sent from{' '}
            <a href={thread.pageUrl} target="_blank" rel="noreferrer" className="text-[#1a73e8] hover:underline">
              {thread.pageUrl.replace(/^https?:\/\//, '')}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
