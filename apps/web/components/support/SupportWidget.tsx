'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, MessageCircleQuestion, Plus, X } from 'lucide-react';
import {
  categoryLabel, rememberVisitorToken, supportApi, visitorTokens, type SupportThread,
} from '../../lib/api/support';
import { useAuthStore } from '../../lib/stores/auth.store';
import { cn } from '../../lib/utils';
import { SupportConversation, timeOf } from './SupportConversation';
import { SupportForm } from './SupportForm';

/**
 * e-resi's own pages — the marketplace, marketing pages, sign-in and every
 * portal. Anything else at the top level is a development's mini-site, which
 * has its own "chat with the developer" button and may be on the developer's
 * own domain; the e-resi help button would be out of place there.
 */
const OWN_SECTIONS = new Set([
  '', 'agents', 'apartments', 'commercial', 'developers', 'list-agency', 'list-development',
  'map', 'neighbourhoods', 'properties', 'rent', 'villas',
  'about', 'careers', 'contact', 'for-developers', 'for-investors', 'pricing', 'privacy', 'terms',
  'login', 'register', 'forgot-password', 'reset-password', 'verify-email', 'staff-invite', 'google',
  'onboarding', 'dashboard', 'agent', 'account',
]);

/** Listing pages whose map button already sits bottom-right. */
const MAP_BUTTON_PAGE = /^\/(properties|villas|commercial|apartments|rent)(\/(villas|commercial|apartments))?\/?$/;

function isOwnHost(host: string) {
  return /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host)
    || /^((www|app)\.)?e-resi\.com$/.test(host);
}

export function supportPathFor(role?: string | null) {
  if (role === 'DEVELOPER') return '/dashboard/support';
  if (role === 'AGENT') return '/agent/support';
  if (role === 'ADMIN') return '/admin/support';
  return '/account/support';
}

type View = { name: 'home' } | { name: 'new' } | { name: 'thread'; id: string };

/** Floating "Help" button on every e-resi page — write to the team, signed in or not. */
export function SupportWidget() {
  const pathname = usePathname() ?? '/';
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [host, setHost] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>({ name: 'home' });
  /**
   * Tucked away to a slim tab on the right edge, so the launcher stops
   * covering page buttons. Remembered per browser.
   */
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try { setCollapsed(localStorage.getItem('eresi-help-collapsed') === '1'); } catch { /* private mode */ }
  }, []);
  const setTucked = (v: boolean) => {
    setCollapsed(v);
    try { localStorage.setItem('eresi-help-collapsed', v ? '1' : '0'); } catch { /* private mode */ }
  };

  useEffect(() => setHost(window.location.host), []);

  // Reply emails to visitors link back here: /?support=<id>&t=<token>
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('support');
    if (!id) return;
    const token = params.get('t');
    if (token) rememberVisitorToken(id, token);
    setView({ name: 'thread', id });
    setOpen(true);
    params.delete('support');
    params.delete('t');
    const qs = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`);
  }, []);

  const section = pathname.split('/')[1] ?? '';
  const onSupportPage = pathname.endsWith('/support');
  const visible = host !== null && isOwnHost(host) && OWN_SECTIONS.has(section) && !onSupportPage;

  const { data: unread } = useQuery({
    queryKey: ['support', 'unread'],
    queryFn: () => supportApi.unread(),
    enabled: visible && !!user && user.role !== 'ADMIN',
    refetchInterval: 60_000,
  });

  const close = useCallback(() => setOpen(false), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!visible || user?.role === 'ADMIN') return null;
  const lifted = MAP_BUTTON_PAGE.test(pathname);
  const badge = unread?.count ?? 0;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Contact e-resi"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'fixed inset-x-3 z-[70] flex flex-col overflow-hidden rounded-3xl border border-[#dadce0] bg-white shadow-[0_12px_48px_rgba(32,33,36,0.22)] sm:inset-x-auto sm:right-6 sm:w-[380px]',
              lifted ? 'bottom-[9.5rem] sm:bottom-[9.5rem]' : 'bottom-20 sm:bottom-24',
              'h-[min(600px,calc(100dvh-7rem))]',
              lifted && 'h-[min(560px,calc(100dvh-11rem))]',
            )}
          >
            <Panel view={view} setView={setView} onClose={close} />
          </motion.div>
        )}
      </AnimatePresence>

      {collapsed && !open ? (
        // Tucked: a slim tab on the edge. Click to bring the Help button back.
        <button
          type="button"
          onClick={() => setTucked(false)}
          aria-label="Show help button"
          title="Help"
          className={cn(
            'fixed right-0 z-[70] flex h-11 w-7 cursor-pointer items-center justify-center rounded-l-xl bg-[#202124]/85 text-white shadow-[0_4px_16px_rgba(32,33,36,0.25)] transition-all hover:w-9 hover:bg-[#202124]',
            lifted ? 'bottom-24' : 'bottom-5 sm:bottom-6',
          )}
        >
          <ChevronLeft size={16} />
          {badge > 0 && <span className="absolute left-1 top-1 h-2 w-2 rounded-full bg-[#ea4335]" />}
        </button>
      ) : (
        <div className={cn('group/help fixed right-4 z-[70] flex items-center sm:right-6', lifted ? 'bottom-24' : 'bottom-5 sm:bottom-6')}>
          {!open && (
            <button
              type="button"
              onClick={() => setTucked(true)}
              aria-label="Hide help button"
              title="Hide"
              className="mr-1.5 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-[#dadce0] bg-white text-[#5f6368] shadow-sm transition-opacity hover:text-[#202124] sm:opacity-0 sm:group-hover/help:opacity-100 sm:focus-visible:opacity-100"
            >
              <ChevronRight size={15} />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen((v) => !v);
              if (!open) void qc.invalidateQueries({ queryKey: ['support'] });
            }}
            aria-label={open ? 'Close help' : 'Contact e-resi'}
            aria-expanded={open}
            className="group relative flex h-12 cursor-pointer items-center gap-2 rounded-full bg-[#202124] pl-3.5 pr-4 text-white shadow-[0_6px_24px_rgba(32,33,36,0.28)] transition-colors hover:bg-[#3c4043]"
          >
            {open ? <X size={19} /> : <MessageCircleQuestion size={19} />}
            <span className="text-[14px] font-medium">{open ? 'Close' : 'Help'}</span>
            {!open && badge > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ea4335] px-1 text-[11px] font-semibold">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </button>
        </div>
      )}
    </>
  );
}

function Panel({
  view, setView, onClose,
}: {
  view: View;
  setView: (v: View) => void;
  onClose: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.firstName;

  return (
    <>
      <header className="flex items-center gap-2 border-b border-[#f1f3f4] px-4 py-3">
        {view.name !== 'home' && (
          <button
            type="button"
            onClick={() => setView({ name: 'home' })}
            aria-label="Back"
            className="-ml-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4]"
          >
            <ArrowLeft size={17} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium text-[#202124]">
            {view.name === 'new' ? 'New message' : view.name === 'thread' ? 'e-resi support' : `Hi${firstName ? ` ${firstName}` : ''}, how can we help?`}
          </p>
          <p className="text-[12px] text-[#5f6368]">We usually reply within a few hours.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4]"
        >
          <X size={17} />
        </button>
      </header>

      {view.name === 'home' && <Home onNew={() => setView({ name: 'new' })} onOpen={(id) => setView({ name: 'thread', id })} />}
      {view.name === 'new' && (
        <div className="min-h-0 flex-1 overflow-y-auto" data-lenis-prevent>
          <SupportForm compact onCreated={(t) => setView({ name: 'thread', id: t.id })} />
        </div>
      )}
      {view.name === 'thread' && <ThreadView id={view.id} />}
    </>
  );
}

/** Recent conversations — from the account, or from this browser for a visitor. */
function Home({ onNew, onOpen }: { onNew: () => void; onOpen: (id: string) => void }) {
  const user = useAuthStore((s) => s.user);
  const { data: threads, isLoading } = useQuery({
    queryKey: ['support', 'widget-list', user?.id ?? 'visitor'],
    queryFn: async (): Promise<SupportThread[]> => {
      if (user) return supportApi.mine();
      const ids = Object.keys(visitorTokens()).slice(-10);
      const found = await Promise.all(ids.map((id) => supportApi.get(id).catch(() => null)));
      return found
        .filter((t): t is SupportThread => !!t)
        .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
    },
  });

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4" data-lenis-prevent>
      <button
        type="button"
        onClick={onNew}
        className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-[#dadce0] p-4 text-left transition-colors hover:bg-[#f8f9fa]"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f0fe] text-[#1a73e8]">
          <Plus size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-medium text-[#202124]">Send us a message</span>
          <span className="block text-[12.5px] text-[#5f6368]">Questions, help with your account, partnerships</span>
        </span>
        <ChevronRight size={17} className="text-[#80868b]" />
      </button>

      <p className="mb-2 mt-5 text-[12px] font-medium uppercase tracking-wide text-[#80868b]">Your conversations</p>
      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin text-[#80868b]" /></div>
      ) : !threads?.length ? (
        <p className="rounded-2xl bg-[#f8f9fa] px-4 py-5 text-center text-[13px] text-[#5f6368]">
          Nothing yet. Messages you send appear here with our replies.
        </p>
      ) : (
        <ul className="space-y-1">
          {threads.slice(0, 8).map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onOpen(t.id)}
                className="flex w-full cursor-pointer items-start gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-[#f8f9fa]"
              >
                <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', t.userUnread ? 'bg-[#1a73e8]' : 'bg-transparent')} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className={cn('truncate text-[14px] text-[#202124]', t.userUnread && 'font-medium')}>{t.subject}</span>
                    <span className="shrink-0 text-[11px] text-[#80868b]">{timeOf(t.lastMessageAt)}</span>
                  </span>
                  <span className="block truncate text-[12.5px] text-[#5f6368]">
                    {t.lastMessage
                      ? `${t.lastMessage.fromAdmin ? 'e-resi: ' : 'You: '}${t.lastMessage.body}`
                      : categoryLabel(t.category)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {user && (
        <Link
          href={supportPathFor(user.role)}
          className="mt-4 block text-center text-[13px] font-medium text-[#1a73e8] hover:underline"
        >
          Open all support conversations
        </Link>
      )}
    </div>
  );
}

function ThreadView({ id }: { id: string }) {
  const qc = useQueryClient();
  const { data: thread, isLoading, error } = useQuery({
    queryKey: ['support', 'thread', id],
    queryFn: () => supportApi.get(id),
    refetchInterval: 15_000,
  });

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center"><Loader2 size={20} className="animate-spin text-[#80868b]" /></div>;
  }
  if (error || !thread) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-[13.5px] text-[#5f6368]">
        This conversation could not be opened here. If you started it while signed in, sign in to see it.
      </div>
    );
  }

  return (
    <SupportConversation
      side="person"
      messages={thread.messages ?? []}
      onSend={async (body) => {
        const updated = await supportApi.reply(id, body);
        qc.setQueryData(['support', 'thread', id], updated);
        void qc.invalidateQueries({ queryKey: ['support', 'widget-list'] });
      }}
      disabledNote={
        thread.status === 'RESOLVED' ? (
          <p className="border-t border-[#f1f3f4] bg-[#f8f9fa] px-4 py-2 text-[12px] text-[#5f6368]">
            Marked as resolved. Reply to reopen it.
          </p>
        ) : null
      }
    />
  );
}
