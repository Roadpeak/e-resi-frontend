'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, MessageCircleQuestion, Plus } from 'lucide-react';
import { categoryLabel, supportApi } from '../../lib/api/support';
import { cn } from '../../lib/utils';
import { SupportConversation, timeOf } from './SupportConversation';
import { SupportForm } from './SupportForm';

/**
 * "Contact e-resi" page shared by every portal — developer, agent and buyer
 * accounts all talk to the same team. ?thread=<id> opens one conversation
 * (that is where support notifications link to).
 */
export function SupportInbox() {
  const router = useRouter();
  const params = useSearchParams();
  const qc = useQueryClient();
  const selected = params.get('thread');
  const [composing, setComposing] = useState(false);

  const { data: threads, isLoading } = useQuery({
    queryKey: ['support', 'mine'],
    queryFn: () => supportApi.mine(),
    refetchInterval: 30_000,
  });

  const { data: thread } = useQuery({
    queryKey: ['support', 'thread', selected],
    queryFn: () => supportApi.get(selected!),
    enabled: !!selected,
    refetchInterval: 15_000,
  });

  // Opening a thread clears its unread flag on the server; refresh the list and badge.
  useEffect(() => {
    if (thread) void qc.invalidateQueries({ queryKey: ['support', 'unread'] });
  }, [thread?.id, qc]); // eslint-disable-line react-hooks/exhaustive-deps

  function select(id: string | null) {
    setComposing(false);
    const next = new URLSearchParams(params.toString());
    if (id) next.set('thread', id);
    else next.delete('thread');
    router.replace(`?${next.toString()}`, { scroll: false });
  }

  const showDetail = composing || !!selected;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[26px] font-normal text-[#202124] sm:text-[28px]">Contact e-resi</h2>
          <p className="text-base text-[#5f6368]">
            Questions, help or anything else — write to the e-resi team and we&apos;ll reply here.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { select(null); setComposing(true); }}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#1a73e8] px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc]"
        >
          <Plus size={16} /> New message
        </button>
      </div>

      <div className="grid h-[min(680px,calc(100vh-14rem))] min-h-[460px] overflow-hidden rounded-3xl border border-[#dadce0] bg-white md:grid-cols-[320px_1fr]">
        {/* List */}
        <aside className={cn('min-h-0 overflow-y-auto border-r border-[#f1f3f4]', showDetail && 'hidden md:block')} data-lenis-prevent>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-[#80868b]" /></div>
          ) : !threads?.length ? (
            <div className="px-6 py-12 text-center">
              <MessageCircleQuestion size={28} className="mx-auto text-[#80868b]" />
              <p className="mt-3 text-[14px] text-[#5f6368]">No conversations yet.</p>
              <button
                type="button"
                onClick={() => { select(null); setComposing(true); }}
                className="mt-3 cursor-pointer text-[14px] font-medium text-[#1a73e8] hover:underline"
              >
                Send your first message
              </button>
            </div>
          ) : (
            <ul className="p-2">
              {threads.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => select(t.id)}
                    className={cn(
                      'flex w-full cursor-pointer items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors',
                      selected === t.id ? 'bg-[#e8f0fe]' : 'hover:bg-[#f8f9fa]',
                    )}
                  >
                    <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', t.userUnread ? 'bg-[#1a73e8]' : 'bg-transparent')} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className={cn('truncate text-[14px] text-[#202124]', t.userUnread && 'font-medium')}>{t.subject}</span>
                        <span className="shrink-0 text-[11px] text-[#80868b]">{timeOf(t.lastMessageAt)}</span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5">
                        <StatusPill status={t.status} />
                        <span className="truncate text-[12.5px] text-[#5f6368]">{categoryLabel(t.category)}</span>
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Detail */}
        <section className={cn('flex min-h-0 flex-col', !showDetail && 'hidden md:flex')}>
          {composing ? (
            <>
              <DetailHeader title="New message" onBack={() => setComposing(false)} />
              <div className="min-h-0 flex-1 overflow-y-auto p-5" data-lenis-prevent>
                <div className="mx-auto max-w-xl">
                  <SupportForm
                    onCreated={(t) => {
                      void qc.invalidateQueries({ queryKey: ['support', 'mine'] });
                      select(t.id);
                    }}
                  />
                </div>
              </div>
            </>
          ) : selected && thread ? (
            <>
              <DetailHeader
                title={thread.subject}
                subtitle={`${categoryLabel(thread.category)} · started ${timeOf(thread.createdAt)}`}
                status={thread.status}
                onBack={() => select(null)}
              />
              <SupportConversation
                side="person"
                messages={thread.messages ?? []}
                onSend={async (body) => {
                  const updated = await supportApi.reply(thread.id, body);
                  qc.setQueryData(['support', 'thread', thread.id], updated);
                  void qc.invalidateQueries({ queryKey: ['support', 'mine'] });
                }}
              />
            </>
          ) : selected ? (
            <div className="flex flex-1 items-center justify-center"><Loader2 size={20} className="animate-spin text-[#80868b]" /></div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <MessageCircleQuestion size={32} className="text-[#80868b]" />
              <p className="mt-3 text-[15px] text-[#3c4043]">Pick a conversation, or start a new one.</p>
              <p className="mt-1 text-[13px] text-[#5f6368]">Replies from the team also show up in your notifications.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2 py-px text-[10.5px] font-medium',
        status === 'RESOLVED' ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-[#e8f0fe] text-[#1967d2]',
      )}
    >
      {status === 'RESOLVED' ? 'Resolved' : 'Open'}
    </span>
  );
}

function DetailHeader({
  title, subtitle, status, onBack,
}: { title: string; subtitle?: string; status?: string; onBack: () => void }) {
  return (
    <header className="flex items-center gap-3 border-b border-[#f1f3f4] px-4 py-3">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4] md:hidden"
      >
        <ArrowLeft size={17} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-[#202124]">{title}</p>
        {subtitle && <p className="truncate text-[12.5px] text-[#5f6368]">{subtitle}</p>}
      </div>
      {status && <StatusPill status={status} />}
    </header>
  );
}
