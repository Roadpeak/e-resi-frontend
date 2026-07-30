'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, X, Reply, MessageSquare, Loader2 } from 'lucide-react';
import { formatDate, cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/Button';
import { useDeveloperInquiries, useReplyInquiry } from '../../../../lib/api/queries';
import type { Inquiry } from '../../../../lib/api/inquiries';

type StatusFilter = 'all' | 'new' | 'read' | 'replied';

const statusColors: Record<string, string> = {
  NEW: 'bg-brand-500/15 text-brand-300 border-brand-500/20',
  READ: 'bg-white/5 text-white/40 border-white/10',
  REPLIED: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  CLOSED: 'bg-white/5 text-white/25 border-white/10',
};

export default function DashboardInquiries() {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [replyText, setReplyText] = useState('');

  const { data, isLoading } = useDeveloperInquiries({ limit: 50, status: filter === 'all' ? undefined : filter });
  const replyMutation = useReplyInquiry();

  const inquiries = data?.items ?? [];
  const newCount = inquiries.filter((i) => i.status === 'NEW').length;

  async function handleReply() {
    if (!selected || !replyText.trim()) return;
    await replyMutation.mutateAsync({ id: selected.id, reply: replyText });
    setReplyText('');
    setSelected(null);
  }

  return (
    <div className="max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Inquiries</h2>
          <p className="text-sm text-white/40 mt-0.5">{newCount} new inquiries awaiting response</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex items-center gap-1 rounded-xl border border-white/5 bg-surface-800 p-1 w-fit">
        {(['all', 'new', 'read', 'replied'] as StatusFilter[]).map((s) => {
          const count = s === 'all' ? inquiries.length : inquiries.filter((i) => i.status === s.toUpperCase()).length;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-all cursor-pointer',
                filter === s ? 'bg-brand-600 text-white' : 'text-white/40 hover:text-white',
              )}
            >
              {s}
              <span className={cn('text-[10px] rounded-full px-1.5 py-0.5', filter === s ? 'bg-white/20 text-white' : 'bg-white/5 text-white/30')}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-6 h-[calc(100vh-280px)]">
        {/* List */}
        <div className="w-96 shrink-0 overflow-y-auto rounded-2xl border border-white/5 bg-surface-800 divide-y divide-white/5">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="text-white/30 animate-spin" />
            </div>
          ) : inquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <MessageSquare size={28} className="mb-3 text-white/15" />
              <p className="text-sm text-white/30">No inquiries yet</p>
            </div>
          ) : inquiries.map((inq) => (
            <motion.button
              key={inq.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setSelected(inq)}
              className={cn(
                'w-full text-left px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer',
                selected?.id === inq.id && 'bg-brand-500/5 border-l-2 border-l-brand-500',
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600/20 text-brand-300 text-sm font-semibold">
                  {inq.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">{inq.name}</p>
                    {inq.status === 'NEW' && <span className="h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-white/40 truncate">{inq.property?.name ?? '—'}</p>
                  <p className="text-xs text-white/30 mt-1 line-clamp-1">{inq.message}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className={cn('text-[10px] rounded-full border px-2 py-0.5 font-medium', statusColors[inq.status] ?? 'bg-white/5 text-white/40 border-white/10')}>
                  {inq.status.toLowerCase()}
                </span>
                <span className="text-[10px] text-white/25">{formatDate(inq.createdAt)}</span>
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
              className="flex-1 overflow-hidden rounded-2xl border border-white/5 bg-surface-800 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-white/5 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600/20 text-brand-300 font-semibold">
                    {selected.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{selected.name}</p>
                    <p className="text-xs text-white/40">{selected.property.name}{selected.unit ? ` · ${selected.unit.name}` : ''}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white transition-colors cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              {/* Contact info */}
              <div className="flex items-center gap-6 border-b border-white/5 px-6 py-3">
                <a href={`mailto:${selected.email}`} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-brand-300 transition-colors">
                  <Mail size={12} /> {selected.email}
                </a>
                {selected.phone && (
                  <a href={`tel:${selected.phone}`} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-brand-300 transition-colors">
                    <Phone size={12} /> {selected.phone}
                  </a>
                )}
                <span className="ml-auto text-xs text-white/25">{formatDate(selected.createdAt)}</span>
              </div>

              {/* Message */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="rounded-2xl border border-white/5 bg-surface-900 p-5">
                  <p className="text-sm leading-relaxed text-white/70">{selected.message}</p>
                </div>
                {selected.reply && (
                  <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-5">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-400 mb-2">Your Reply</p>
                    <p className="text-sm leading-relaxed text-white/60">{selected.reply}</p>
                  </div>
                )}
              </div>

              {/* Reply */}
              {selected.status !== 'REPLIED' && selected.status !== 'CLOSED' && (
                <div className="border-t border-white/5 p-5">
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    className="w-full resize-none rounded-xl border border-white/10 bg-surface-900 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-brand-500/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
                  />
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      size="sm"
                      icon={<Reply size={13} />}
                      loading={replyMutation.isPending}
                      disabled={!replyText.trim()}
                      onClick={handleReply}
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
              className="flex-1 flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-white/10"
            >
              <MessageSquare size={32} className="mb-3 text-white/15" />
              <p className="text-sm text-white/30">Select an inquiry to view details</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
