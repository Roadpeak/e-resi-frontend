'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import type { SupportMessage } from '../../lib/api/support';
import { cn } from '../../lib/utils';

export function timeOf(iso: string): string {
  const d = new Date(iso);
  const today = new Date().toDateString() === d.toDateString();
  return today
    ? d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) +
        ' · ' + d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Message list + reply box for a support conversation. Used by the floating
 * help widget, the portal support pages and the admin inbox — `side` says
 * whose messages sit on the right.
 */
export function SupportConversation({
  messages,
  side,
  onSend,
  placeholder = 'Write a message…',
  disabledNote,
  className,
}: {
  messages: SupportMessage[];
  side: 'person' | 'admin';
  onSend: (body: string) => Promise<unknown>;
  placeholder?: string;
  disabledNote?: React.ReactNode;
  className?: string;
}) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError('');
    try {
      await onSend(body);
      setDraft('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send. Try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4" data-lenis-prevent>
        {messages.map((m) => {
          const mine = side === 'admin' ? m.fromAdmin : !m.fromAdmin;
          return (
            <div key={m.id} className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
              <div
                className={cn(
                  'max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[14px] leading-relaxed',
                  mine ? 'rounded-br-md bg-[#1a73e8] text-white' : 'rounded-bl-md bg-[#f1f3f4] text-[#202124]',
                )}
              >
                {m.body}
              </div>
              <span className="mt-1 px-1 text-[11px] text-[#80868b]">
                {mine ? 'You' : m.authorName} · {timeOf(m.createdAt)}
              </span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {disabledNote}

      <div className="border-t border-[#f1f3f4] p-3">
        {error && <p className="mb-2 text-[12px] text-[#c5221f]">{error}</p>}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={1}
            placeholder={placeholder}
            className="max-h-32 min-h-[40px] flex-1 resize-none rounded-2xl border border-[#dadce0] bg-white px-3.5 py-2 text-[14px] text-[#202124] outline-none placeholder:text-[#80868b] focus:border-[#1a73e8]"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={!draft.trim() || sending}
            aria-label="Send"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#1a73e8] text-white transition-colors hover:bg-[#1765cc] disabled:cursor-default disabled:bg-[#dadce0]"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
