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
  NEW: 'bg-brand-50 text-brand-700 border-brand-200',
  READ: 'bg-gray-100 text-gray-500 border-gray-200',
  REPLIED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CLOSED: 'bg-gray-100 text-gray-400 border-gray-200',
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
          <h2 className="text-xl font-semibold text-gray-900">Inquiries</h2>
          <p className="text-sm text-gray-500 mt-0.5">{newCount} new inquiries awaiting response</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 w-fit">
        {(['all', 'new', 'read', 'replied'] as StatusFilter[]).map((s) => {
          const count = s === 'all' ? inquiries.length : inquiries.filter((i) => i.status === s.toUpperCase()).length;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-all cursor-pointer',
                filter === s ? 'bg-brand-600 text-white' : 'text-gray-500 hover:text-gray-900',
              )}
            >
              {s}
              <span className={cn('text-[10px] rounded-full px-1.5 py-0.5', filter === s ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400')}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-6 h-[calc(100vh-280px)]">
        {/* List */}
        <div className="w-96 shrink-0 overflow-y-auto rounded-2xl border border-gray-200 bg-white divide-y divide-gray-200">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="text-gray-400 animate-spin" />
            </div>
          ) : inquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <MessageSquare size={28} className="mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">No inquiries yet</p>
            </div>
          ) : inquiries.map((inq) => (
            <motion.button
              key={inq.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setSelected(inq)}
              className={cn(
                'w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer',
                selected?.id === inq.id && 'bg-brand-50 border-l-2 border-l-brand-500',
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-sm font-semibold">
                  {inq.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{inq.name}</p>
                    {inq.status === 'NEW' && <span className="h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{inq.property?.name ?? '—'}</p>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">{inq.message}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className={cn('text-[10px] rounded-full border px-2 py-0.5 font-medium', statusColors[inq.status] ?? 'bg-gray-100 text-gray-500 border-gray-200')}>
                  {inq.status.toLowerCase()}
                </span>
                <span className="text-[10px] text-gray-400">{formatDate(inq.createdAt)}</span>
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
              className="flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white flex flex-col"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-semibold">
                    {selected.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selected.name}</p>
                    <p className="text-xs text-gray-500">{selected.property.name}{selected.unit ? ` · ${selected.unit.name}` : ''}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-900 transition-colors cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              {/* Contact info */}
              <div className="flex items-center gap-6 border-b border-gray-200 px-6 py-3">
                <a href={`mailto:${selected.email}`} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-600 transition-colors">
                  <Mail size={12} /> {selected.email}
                </a>
                {selected.phone && (
                  <a href={`tel:${selected.phone}`} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-600 transition-colors">
                    <Phone size={12} /> {selected.phone}
                  </a>
                )}
                <span className="ml-auto text-xs text-gray-400">{formatDate(selected.createdAt)}</span>
              </div>

              {/* Message */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <p className="text-sm leading-relaxed text-gray-600">{selected.message}</p>
                </div>
                {selected.reply && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-700 mb-2">Your Reply</p>
                    <p className="text-sm leading-relaxed text-gray-600">{selected.reply}</p>
                  </div>
                )}
              </div>

              {/* Reply */}
              {selected.status !== 'REPLIED' && selected.status !== 'CLOSED' && (
                <div className="border-t border-gray-200 p-5">
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
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
              className="flex-1 flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-gray-300"
            >
              <MessageSquare size={32} className="mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">Select an inquiry to view details</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
