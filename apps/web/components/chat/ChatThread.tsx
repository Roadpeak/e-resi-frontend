'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import {
  chatApi, getChatSocket, type ChatMessage, type Conversation,
} from '../../lib/api/chat';
import { useAuthStore } from '../../lib/stores/auth.store';
import { cn } from '../../lib/utils';

function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
}

/**
 * The "add as lead" bar shown to the business side of a property thread.
 *
 * A chat is where real interest shows itself — someone asking about pricing
 * on a specific development is warmer than any form fill — but chats have no
 * pipeline, so that interest used to evaporate when the thread went quiet.
 * One tap files the person where the follow-up machinery lives: a Deal for
 * an agent, an Inquiry for a developer.
 */
function CaptureLeadBar({ conversation }: { conversation: Conversation }) {
  const me = useAuthStore((s) => s.user);
  const [captured, setCaptured] = useState<'deal' | 'inquiry' | null>(
    conversation.leadDealId ? 'deal' : conversation.leadInquiryId ? 'inquiry' : null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const iAmBusinessSide = me?.role === 'DEVELOPER' || me?.role === 'AGENT';
  const otherIsCustomer = ['BUYER', 'INVESTOR', 'TENANT'].includes(
    conversation.otherParty?.role ?? '',
  );
  if (!iAmBusinessSide || !otherIsCustomer || !conversation.propertyId) return null;

  async function capture() {
    setBusy(true);
    setError('');
    try {
      const result = await chatApi.captureLead(conversation.id);
      setCaptured(result.kind);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not capture the lead.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-b border-[#f1f3f4] bg-[#f8f9fa] px-4 py-2">
      {captured ? (
        <p className="text-[12.5px] text-[#137333]">
          ✓ Captured as a lead — track them under {captured === 'deal' ? 'Deals' : 'Inquiries'}.
        </p>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12.5px] text-[#5f6368]">
            Talking to {conversation.otherParty?.firstName ?? 'a client'} about this property?
          </p>
          <button
            onClick={capture}
            disabled={busy}
            className="cursor-pointer rounded-full bg-[#1a73e8] px-3 py-1 text-[12.5px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-50"
          >
            {busy ? 'Adding…' : 'Add as lead'}
          </button>
        </div>
      )}
      {error && <p className="mt-1 text-[12px] text-[#c5221f]">{error}</p>}
    </div>
  );
}

/** Realtime message thread — shared by the dashboard and account chat views. */
export function ChatThread({ conversation }: { conversation: Conversation }) {
  const me = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // history + realtime subscription
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    chatApi.messages(conversation.id).then((msgs) => {
      if (!cancelled) {
        setMessages(msgs);
        setLoading(false);
      }
    }).catch(() => setLoading(false));

    const socket = getChatSocket();
    const onNew = (msg: ChatMessage) => {
      if (msg.conversationId !== conversation.id) return;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      socket?.emit('conversation:read', { conversationId: conversation.id });
    };
    socket?.on('message:new', onNew);
    return () => {
      cancelled = true;
      socket?.off('message:new', onNew);
    };
  }, [conversation.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setDraft('');
    const socket = getChatSocket();
    try {
      if (socket?.connected) {
        await socket.timeout(5000).emitWithAck('message:send', {
          conversationId: conversation.id,
          body,
        });
        // message arrives back via message:new
      } else {
        const msg = await chatApi.send(conversation.id, body);
        setMessages((prev) => [...prev, msg]);
      }
    } catch {
      // socket failed — REST fallback
      const msg = await chatApi.send(conversation.id, body).catch(() => null);
      if (msg) setMessages((prev) => [...prev, msg]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <CaptureLeadBar conversation={conversation} />
      {/* messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 size={20} className="animate-spin text-[#80868b]" />
          </div>
        ) : messages.length === 0 ? (
          <p className="pt-10 text-center text-[15px] text-[#5f6368]">
            Say hello — ask about pricing, availability or viewings.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === me?.id;
            return (
              <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[75%] rounded-2xl px-4 py-2.5',
                  mine ? 'rounded-br-md bg-[#1a73e8] text-white' : 'rounded-bl-md bg-[#f1f3f4] text-[#202124]',
                )}>
                  <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{m.body}</p>
                  <p className={cn('mt-1 text-[11px]', mine ? 'text-white/70' : 'text-[#80868b]')}>
                    {timeOf(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* composer */}
      <form onSubmit={send} className="flex items-center gap-2 border-t border-[#f1f3f4] px-4 py-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write a message…"
          className="h-11 flex-1 rounded-full bg-[#f1f3f4] px-4 text-[15px] text-[#202124] placeholder-[#80868b] outline-none focus:outline-none focus-visible:!ring-0 focus-visible:!ring-offset-0"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          aria-label="Send message"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1a73e8] text-white hover:bg-[#1765cc] transition-colors cursor-pointer disabled:opacity-40"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
}
