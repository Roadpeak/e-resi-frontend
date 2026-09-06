'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ChevronDown, ChevronUp, ExternalLink, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { formatDate, cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/Button';
import { useMyInquiries } from '../../../../lib/api/queries';
import { useAuthStore } from '../../../../lib/stores/auth.store';
import type { Inquiry } from '../../../../lib/api/inquiries';

export default function AccountInquiries() {
  const { data, isLoading } = useMyInquiries({ limit: 50 });
  const inquiries = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[24px] font-normal text-[#202124]">Inquiries</h1>
        <p className="text-sm text-gray-500">
          {inquiries.length} sent — replies land here and continue in Messages.
        </p>
      </div>

      {inquiries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 py-20 text-center">
          <MessageSquare size={32} className="mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">No inquiries yet</p>
          <p className="text-xs text-gray-400 mt-1">Submit an inquiry from any property page to get in touch with developers.</p>
        </div>
      ) : (
        // items-start keeps an expanded card from stretching its row-mate.
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 items-start">
          {inquiries.map((inq, i) => <InquiryCard key={inq.id} inquiry={inq} index={i} />)}
        </div>
      )}
    </div>
  );
}

function InquiryCard({ inquiry: inq, index }: { inquiry: Inquiry; index: number }) {
  const user = useAuthStore((s) => s.user);
  const [expanded, setExpanded] = useState(inq.status === 'REPLIED');
  const isReplied = inq.status === 'REPLIED';
  const initials = user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : '?';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">{inq.property.name}</span>
            {inq.unit && <span className="text-gray-400 text-xs">· {inq.unit.name}</span>}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{inq.message}</p>
          <div className="mt-1.5 flex items-center gap-3">
            <span className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
              isReplied ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gold-200 bg-gold-50 text-gold-700',
            )}>
              {isReplied ? <CheckCircle2 size={9} /> : <Clock size={9} />}
              {isReplied ? 'Replied' : 'Awaiting Reply'}
            </span>
            <span className="text-[10px] text-gray-400">{formatDate(inq.createdAt)}</span>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
      </button>

      {/* Expanded thread */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-200 p-5 space-y-4">
              {/* My message */}
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-bold">
                  {initials.toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-1.5">You · {formatDate(inq.createdAt)}</p>
                  <div className="rounded-2xl rounded-tl-none border border-gray-200 bg-gray-50 px-4 py-3">
                    <p className="text-sm text-gray-600">{inq.message}</p>
                  </div>
                </div>
              </div>

              {/* Developer reply */}
              {inq.reply && (
                <div className="flex gap-3 flex-row-reverse">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600 text-xs font-bold">
                    D
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-1.5 text-right">Developer</p>
                    <div className="rounded-2xl rounded-tr-none border border-brand-200 bg-brand-50 px-4 py-3">
                      <p className="text-sm text-gray-600">{inq.reply}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <Button href={`/${inq.property.slug}`} variant="secondary" size="sm" icon={<ExternalLink size={12} />}>
                  View Property
                </Button>
                <Button href={`/${inq.property.slug}#booking`} size="sm">Book a Viewing</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
