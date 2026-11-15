'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Loader2, Send, Trash2, X } from 'lucide-react';
import { reelsApi, type ReelComment } from '../../lib/api/reels';
import { ApiError } from '../../lib/api/client';
import { useAuthStore } from '../../lib/stores/auth.store';
import { cn } from '../../lib/utils';
import { cdnImage } from '../../lib/media/cdn';

function ago(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return d < 7 ? `${d}d` : `${Math.floor(d / 7)}w`;
}

/**
 * Comments on one reel. Anyone signed in can comment; the reel's owner can
 * reply under a comment (one level, like Instagram), and delete any of them.
 * `admin` lists through the admin endpoint and lets admins delete anything.
 */
export function ReelComments({
  reelId, onClose, onCountChange, admin = false, inline = false,
}: {
  reelId: string;
  onClose?: () => void;
  onCountChange?: (delta: number) => void;
  admin?: boolean;
  /** Render as a panel in a page rather than a bottom sheet. */
  inline?: boolean;
}) {
  const qc = useQueryClient();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<ReelComment | null>(null);
  const [error, setError] = useState('');
  const key = ['reel-comments', reelId, admin];

  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => (admin ? reelsApi.adminComments(reelId) : reelsApi.comments(reelId)),
  });

  const post = useMutation({
    mutationFn: () => reelsApi.comment(reelId, body.trim(), replyTo?.id),
    onSuccess: () => { setBody(''); setReplyTo(null); setError(''); onCountChange?.(1); qc.invalidateQueries({ queryKey: key }); },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not post that'),
  });
  const del = useMutation({
    mutationFn: (c: ReelComment) => (admin ? reelsApi.adminDeleteComment(c.id) : reelsApi.deleteComment(c.id)),
    onSuccess: (_r, c) => { onCountChange?.(-(1 + (c.replies?.length ?? 0))); qc.invalidateQueries({ queryKey: key }); },
  });

  const canReply = !!data?.canReply;
  const items = data?.items ?? [];

  const Row = ({ c, reply }: { c: ReelComment; reply?: boolean }) => (
    <li className={cn('flex gap-3', reply && 'ml-11 mt-3')}>
      <span className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f1f3f4] text-[12px] font-medium text-[#5f6368]', reply ? 'h-7 w-7' : 'h-8 w-8')}>
        {c.author.avatarUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={cdnImage(c.author.avatarUrl, 32)} alt="" className="h-full w-full object-cover" />
          : c.author.name.slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-[#5f6368]">
          <span className="font-medium text-[#202124]">{c.author.name}</span>
          {c.byOwner && <span className="ml-1 inline-flex items-center gap-0.5 text-[#1a73e8]"><BadgeCheck size={13} /> Author</span>}
          <span className="ml-1.5">{ago(c.createdAt)}</span>
        </p>
        <p className="mt-0.5 whitespace-pre-line break-words text-[14px] leading-snug text-[#202124]">{c.body}</p>
        <div className="mt-1 flex items-center gap-3 text-[12.5px] font-medium text-[#5f6368]">
          {!reply && canReply && <button type="button" onClick={() => setReplyTo(c)} className="hover:text-[#202124]">Reply</button>}
          {(c.mine || canReply || admin) && (
            <button type="button" onClick={() => del.mutate(c)} className="inline-flex items-center gap-1 hover:text-[#c5221f]" aria-label="Delete comment">
              <Trash2 size={12} /> Delete
            </button>
          )}
        </div>
      </div>
    </li>
  );

  const list = (
    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4" data-lenis-prevent>
      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-[#9aa0a6]" /></div>
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-[14px] text-[#5f6368]">No comments yet. Start the conversation.</p>
      ) : (
        <ul className="space-y-5">
          {items.map((c) => (
            <div key={c.id}>
              <Row c={c} />
              {(c.replies ?? []).length > 0 && <ul>{c.replies!.map((r) => <Row key={r.id} c={r} reply />)}</ul>}
            </div>
          ))}
        </ul>
      )}
    </div>
  );

  const composer = admin ? null : isAuthenticated ? (
    <form onSubmit={(e) => { e.preventDefault(); if (body.trim()) post.mutate(); }} className="border-t border-[#f1f3f4] px-4 py-3">
      {replyTo && (
        <p className="mb-2 flex items-center justify-between rounded-xl bg-[#f8f9fa] px-3 py-1.5 text-[12.5px] text-[#5f6368]">
          Replying to {replyTo.author.name}
          <button type="button" onClick={() => setReplyTo(null)} aria-label="Cancel reply"><X size={13} /></button>
        </p>
      )}
      {error && <p className="mb-2 text-[12.5px] text-[#c5221f]">{error}</p>}
      <div className="flex items-center gap-2">
        <input value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000}
          placeholder={replyTo ? 'Write a reply…' : 'Add a comment…'}
          className="min-w-0 flex-1 rounded-full border border-[#dadce0] px-4 py-2.5 text-[16px] text-[#202124] outline-none focus:border-[#1a73e8] sm:text-[14px]" />
        <button type="submit" disabled={!body.trim() || post.isPending} aria-label="Post"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1a73e8] text-white disabled:opacity-40">
          {post.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </form>
  ) : (
    <div className="border-t border-[#f1f3f4] px-5 py-4 text-center text-[14px] text-[#5f6368]">
      <Link href={`/login?redirect=${encodeURIComponent(pathname || '/reels')}`} className="font-medium text-[#1a73e8] hover:underline">Sign in</Link> to comment.
    </div>
  );

  if (inline) {
    return <div className="flex max-h-[70vh] flex-col overflow-hidden rounded-2xl border border-[#e8eaed] bg-white">{list}{composer}</div>;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Comments">
      <button type="button" aria-label="Close comments" onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="relative flex h-[72dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white sm:h-[78vh] sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-[#f1f3f4] px-5 py-3.5">
          <p className="text-[15px] font-medium text-[#202124]">Comments</p>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-[#5f6368] hover:bg-[#f1f3f4]"><X size={18} /></button>
        </div>
        {list}
        {composer}
      </div>
    </div>
  );
}
