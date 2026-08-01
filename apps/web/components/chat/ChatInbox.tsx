'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Loader2, MessagesSquare } from 'lucide-react';
import {
  chatApi, getChatSocket, type ChatMessage, type Conversation,
} from '../../lib/api/chat';
import { useAuthStore } from '../../lib/stores/auth.store';
import { cn } from '../../lib/utils';
import { ChatThread } from './ChatThread';

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

/**
 * Conversation list + active thread. `perspective` controls how the other
 * side is labelled (developer sees customers; customers see companies).
 */
export function ChatInbox({
  perspective,
  initialConversationId,
}: {
  perspective: 'developer' | 'customer';
  initialConversationId?: string | null;
}) {
  const me = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const { data: conversations, isLoading } = useQuery({
    queryKey: ['chat', 'conversations'],
    queryFn: () => chatApi.list(),
    refetchInterval: 30_000,
  });

  const [activeId, setActiveId] = useState<string | null>(initialConversationId ?? null);
  const active = useMemo(
    () => (conversations ?? []).find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  // default to the first conversation
  useEffect(() => {
    if (!activeId && (conversations ?? []).length > 0) {
      setActiveId(conversations![0].id);
    }
  }, [conversations, activeId]);

  // refresh the list when any new message lands
  useEffect(() => {
    const socket = getChatSocket();
    const onNew = (_msg: ChatMessage) => {
      queryClient.invalidateQueries({ queryKey: ['chat'] });
    };
    socket?.on('message:new', onNew);
    return () => {
      socket?.off('message:new', onNew);
    };
  }, [queryClient]);

  function labelFor(c: Conversation): { name: string; sub: string } {
    if (perspective === 'developer') {
      return {
        name: `${c.customer.firstName} ${c.customer.lastName}`,
        sub: [c.customer.role?.toLowerCase(), c.subject].filter(Boolean).join(' · '),
      };
    }
    return {
      name: c.developer.developerProfile?.companyName
        ?? `${c.developer.firstName} ${c.developer.lastName}`,
      sub: c.subject ?? 'Developer',
    };
  }

  if (isLoading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[#80868b]" />
      </div>
    );
  }

  if ((conversations ?? []).length === 0) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-3 rounded-3xl border border-[#dadce0] bg-white p-8 text-center">
        <MessagesSquare size={24} className="text-[#dadce0]" />
        <p className="max-w-sm text-[15px] leading-relaxed text-[#5f6368]">
          {perspective === 'developer'
            ? 'No conversations yet — buyers and tenants can message you from any of your listings.'
            : 'No conversations yet — open any property or rental and tap “Chat with developer”.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid h-[calc(100vh-14rem)] min-h-[420px] overflow-hidden rounded-3xl border border-[#dadce0] bg-white lg:grid-cols-[320px_1fr]">
      {/* list */}
      <div className={cn('min-h-0 overflow-y-auto border-r border-[#f1f3f4]', active && 'hidden lg:block')}>
        {(conversations ?? []).map((c) => {
          const { name, sub } = labelFor(c);
          const unread = c.unreadCount ?? 0;
          return (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={cn(
                'flex w-full items-center gap-3 border-b border-[#f1f3f4] px-4 py-3.5 text-left transition-colors cursor-pointer',
                c.id === activeId ? 'bg-[#e8f0fe]' : 'hover:bg-[#f8f9fa]',
              )}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f0fe] text-sm font-medium text-[#1967d2]">
                {name.charAt(0)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className={cn('truncate text-[15px] text-[#202124]', unread > 0 && 'font-semibold')}>{name}</span>
                  <span className="shrink-0 text-[11px] text-[#80868b]">{timeAgo(c.lastMessageAt)}</span>
                </span>
                <span className="flex items-center justify-between gap-2">
                  <span className={cn('truncate text-[13px]', unread > 0 ? 'font-medium text-[#202124]' : 'text-[#5f6368]')}>
                    {c.lastMessage?.body ?? sub}
                  </span>
                  {unread > 0 && (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#1a73e8] px-1.5 text-[11px] font-bold text-white">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* thread */}
      <div className="flex min-h-0 flex-col">
        {active ? (
          <>
            <div className="flex items-center gap-3 border-b border-[#f1f3f4] px-5 py-3">
              <button
                onClick={() => setActiveId(null)}
                className="lg:hidden text-[13px] font-medium text-[#1a73e8] cursor-pointer"
              >
                ← Back
              </button>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8f0fe] text-[#1967d2]">
                <Building2 size={15} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium text-[#202124]">{labelFor(active).name}</p>
                <p className="truncate text-[13px] text-[#5f6368]">{labelFor(active).sub}</p>
              </div>
            </div>
            <ChatThread conversation={active} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-[15px] text-[#5f6368]">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}
