'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, X, Reply, MessageSquare, Loader2 } from 'lucide-react';
import { formatDate, cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/Button';
import { useDeveloperInquiries, useReplyInquiry } from '../../../../lib/api/queries';
import type { Inquiry } from '../../../../lib/api/inquiries';
import Link from 'next/link';

type StatusFilter = 'all' | 'new' | 'read' | 'replied';

const statusColors: Record<string, string> = {
  NEW: 'bg-[#e8f0fe] text-[#1967d2]',
  READ: 'bg-[#f1f3f4] text-[#5f6368]',
  REPLIED: 'bg-[#e6f4ea] text-[#188038]',
  CLOSED: 'bg-[#f1f3f4] text-[#5f6368]',
};

export default function DashboardInquiries() {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [replyText, setReplyText] = useState('');
  /** Id of the inquiry just replied to, so the row can offer the thread. */
  const [sent, setSent] = useState<string | null>(null);

  const { data, isLoading } = useDeveloperInquiries({ limit: 50, status: filter === 'all' ? undefined : filter });
  const replyMutation = useReplyInquiry();

  const inquiries = data?.items ?? [];
  const newCount = inquiries.filter((i) => i.status === 'NEW').length;

  async function handleReply() {
    if (!selected || !replyText.trim()) return;
    await replyMutation.mutateAsync({ id: selected.id, reply: replyText });
    setReplyText('');
    // A reply to someone with an account opens a chat thread, so send the
    // developer there rather than closing onto nothing. Guests have no
    // account and no thread — those stay in the queue, replied by email.
    setSent(selected.id);
    setSelected(null);
  }

  return (
    <div className="max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-[26px] sm:text-[28px] font-normal text-[#202124]">Inquiries</h2>
          <p className="text-base text-[#5f6368] mt-1">{newCount} new inquiries awaiting response</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex items-center gap-1 w-fit">
        {(['all', 'new', 'read', 'replied'] as StatusFilter[]).map((s) => {
          const count = s === 'all' ? inquiries.length : inquiries.filter((i) => i.status === s.toUpperCase()).length;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-4 py-2 text-[15px] capitalize transition-all cursor-pointer',
                filter === s ? 'bg-[#e8f0fe] text-[#1967d2] font-medium' : 'text-[#5f6368] hover:bg-[#f1f3f4]',
              )}
            >
              {s}
              <span className={cn('text-[13px] rounded-full px-1.5 py-0.5 font-medium', filter === s ? 'text-[#1967d2]' : 'text-[#80868b]')}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-6 h-[calc(100vh-280px)]">
        {/* List */}
        <div className="w-96 shrink-0 overflow-y-auto rounded-3xl border border-[#dadce0] bg-white divide-y divide-[#f1f3f4]">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="text-[#80868b] animate-spin" />
            </div>
          ) : inquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <MessageSquare size={28} className="mb-3 text-[#dadce0]" />
              <p className="text-base text-[#5f6368]">No inquiries yet</p>
            </div>
          ) : inquiries.map((inq) => (
            <motion.button
              key={inq.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setSelected(inq)}
              className={cn(
                'w-full text-left px-5 py-4 hover:bg-[#f8f9fa] transition-colors cursor-pointer',
                selected?.id === inq.id && 'bg-[#e8f0fe] hover:bg-[#e8f0fe]',
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f0fe] text-[#1967d2] text-[15px] font-medium">
                  {inq.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-medium text-[#202124] truncate">{inq.name}</p>
                    {inq.status === 'NEW' && <span className="h-1.5 w-1.5 rounded-full bg-[#1a73e8] shrink-0" />}
                  </div>
                  <p className="text-[13px] text-[#5f6368] truncate">{inq.property?.name ?? '—'}</p>
                  <p className="text-[13px] text-[#80868b] mt-1 line-clamp-1">{inq.message}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className={cn('rounded-full px-3 py-1 text-[13px] font-medium capitalize', statusColors[inq.status] ?? 'bg-[#f1f3f4] text-[#5f6368]')}>
                  {inq.status.toLowerCase()}
                </span>
                <span className="text-[13px] text-[#80868b]">{formatDate(inq.createdAt)}</span>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Detail panel */}
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-hidden rounded-3xl border border-[#dadce0] bg-white flex flex-col"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-[#f1f3f4] px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f0fe] text-[#1967d2] font-medium">
                    {selected.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[15px] font-medium text-[#202124]">{selected.name}</p>
                    <p className="text-[13px] text-[#5f6368]">{selected.property.name}{selected.unit ? ` · ${selected.unit.name}` : ''}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="flex h-8 w-8 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4] hover:text-[#202124] transition-colors cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              {/* Contact info */}
              <div className="flex items-center gap-6 border-b border-[#f1f3f4] px-6 py-3">
                <a href={`mailto:${selected.email}`} className="flex items-center gap-1.5 text-[13px] font-medium text-[#1a73e8] hover:text-[#1765cc] transition-colors">
                  <Mail size={13} /> {selected.email}
                </a>
                {selected.phone && (
                  <a href={`tel:${selected.phone}`} className="flex items-center gap-1.5 text-[13px] font-medium text-[#1a73e8] hover:text-[#1765cc] transition-colors">
                    <Phone size={13} /> {selected.phone}
                  </a>
                )}
                <span className="ml-auto text-[13px] text-[#80868b]">{formatDate(selected.createdAt)}</span>
              </div>

              {/* Message */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="rounded-2xl bg-[#f8f9fa] p-5">
                  <p className="text-[15px] leading-relaxed text-[#3c4043]">{selected.message}</p>
                </div>
                {selected.reply && (
                  <div className="rounded-2xl bg-[#e6f4ea] p-5">
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#188038] mb-2">Your Reply</p>
                    <p className="text-[15px] leading-relaxed text-[#3c4043]">{selected.reply}</p>
                  </div>
                )}
              </div>

              {/* Once replied, the thread is where the conversation continues —
                  a reply used to end in email with nowhere to answer. */}
              {selected.conversationId && (
                <div className="border-t border-[#f1f3f4] p-5">
                  <Link
                    href={`/dashboard/messages?c=${selected.conversationId}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc]"
                  >
                    <MessageSquare size={14} /> Continue in chat
                  </Link>
                  <p className="mt-2 text-[13px] text-[#5f6368]">
                    {selected.name} can reply here too — they have an account.
                  </p>
                </div>
              )}

              {selected.status === 'REPLIED' && !selected.conversationId && (
                <div className="border-t border-[#f1f3f4] p-5">
                  <p className="text-[13px] text-[#5f6368]">
                    Replied by email. {selected.name} enquired as a guest, so there is no
                    chat thread — they will answer to your reply directly.
                  </p>
                </div>
              )}

              {/* Reply */}
              {selected.status !== 'REPLIED' && selected.status !== 'CLOSED' && (
                <div className="border-t border-[#f1f3f4] p-5">
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    className="w-full resize-none rounded-2xl border border-[#dadce0] bg-white px-4 py-3 text-[15px] text-[#202124] placeholder:text-[#80868b] focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20 transition-colors"
                  />
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      size="sm"
                      icon={<Reply size={13} />}
                      loading={replyMutation.isPending}
                      disabled={!replyText.trim()}
                      onClick={handleReply}
                      className="rounded-full bg-[#1a73e8] hover:bg-[#1765cc] text-[15px] font-medium text-white shadow-none h-10 px-5"
                    >
                      Send Reply
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center rounded-3xl border border-dashed border-[#dadce0]"
            >
              <MessageSquare size={32} className="mb-3 text-[#dadce0]" />
              <p className="text-base text-[#5f6368]">Select an inquiry to view details</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
