'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Loader2, MessageSquare } from 'lucide-react';
import { chatApi } from '../../lib/api/chat';
import { ApiError } from '../../lib/api/client';
import { useAuthStore } from '../../lib/stores/auth.store';

/**
 * Opens (or resumes) a chat with an agent and jumps to the thread.
 *
 * Signed-out visitors go to login with a redirect back rather than seeing the
 * request fail — the same pattern the save-property button uses.
 */
export function ChatWithAgentButton({
  agentId,
  className,
  label = 'Chat with agent',
}: {
  agentId: string;
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [error, setError] = useState('');

  const start = useMutation({
    mutationFn: () => chatApi.start({ agentId }),
    onSuccess: (conversation) => {
      // Customers read messages under /account, developers under /dashboard.
      const role = useAuthStore.getState().user?.role;
      const inbox = role === 'DEVELOPER' || role === 'ADMIN' || role === 'AGENT'
        ? '/dashboard/messages'
        : '/account/messages';
      router.push(`${inbox}?conversation=${conversation.id}`);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not start the chat'),
  });

  return (
    <>
      <button
        onClick={() => {
          if (!isAuthenticated) {
            router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
            return;
          }
          setError('');
          start.mutate();
        }}
        disabled={start.isPending}
        className={
          className
          ?? 'inline-flex items-center justify-center gap-2 rounded-full bg-[#111112] px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#2a2a2c] cursor-pointer disabled:opacity-50'
        }
      >
        {start.isPending ? <Loader2 size={15} className="animate-spin" /> : <MessageSquare size={15} />}
        {label}
      </button>
      {error && <p className="mt-2 text-[13px] text-[#c5221f]">{error}</p>}
    </>
  );
}
