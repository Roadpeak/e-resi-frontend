'use client';

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Logo } from '../../../../components/brand/Logo';
import { GoogleButton } from '../../../../components/auth/GoogleButton';
import { agentsApi, type Agent } from '../../../../lib/api/agents';
import { chatApi } from '../../../../lib/api/chat';
import { useAuthStore } from '../../../../lib/stores/auth.store';
import { homePathFor } from '../../../../lib/auth/role-home';

/**
 * Where an agent website's chat button lands, on e-resi.com.
 *
 * Signed in as a buyer or tenant → start (or resume) the chat with that agent
 * and open it. Signed out → one-tap Google sign-up that comes straight back
 * here, so the visitor ends up in the conversation, not on a dashboard.
 */
const CUSTOMER = ['BUYER', 'INVESTOR', 'TENANT'];

export default function ChatWithAgentPage({ params }: { params: Promise<{ agentId: string }> }) {
  const { agentId } = use(params);
  const router = useRouter();
  const { user, isAuthenticated, accessToken, hydrate } = useAuthStore();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const started = useRef(false);
  const here = `/chat/agent/${agentId}`;

  useEffect(() => { agentsApi.get(agentId).then(setAgent).catch(() => setAgent(null)); }, [agentId]);
  // The persisted session loads on the client; refresh the user record once.
  useEffect(() => { void hydrate().finally(() => setReady(true)); }, [hydrate]);

  useEffect(() => {
    if (!ready || !isAuthenticated || !user || started.current) return;
    if (!CUSTOMER.includes(user.role)) return;
    started.current = true;
    chatApi.start({ agentId })
      .then((c) => router.replace(`/account/messages?c=${c.id}`))
      .catch((e) => { setError(e instanceof Error ? e.message : 'Could not start the chat.'); started.current = false; });
  }, [ready, isAuthenticated, user, agentId, router]);

  const name = agent?.displayName ?? 'this agent';
  const photo = agent?.photoUrl ?? agent?.logoUrl;
  const signedInStaff = ready && isAuthenticated && user && !CUSTOMER.includes(user.role);
  const working = !ready || (isAuthenticated && !!accessToken && !signedInStaff && !error);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f9fa] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-[#e8eaed] bg-white p-7 text-center sm:p-9">
        <div className="flex justify-center"><Logo markSize={28} textClassName="text-ink text-xl" /></div>
        <div className="mt-7 flex justify-center">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f0fe] text-[24px] font-medium text-[#1967d2]">{name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        {working ? (
          <div className="mt-6 flex items-center justify-center gap-2.5 text-[15px] text-[#5f6368]">
            <Loader2 size={17} className="animate-spin" /> Opening your chat with {name}…
          </div>
        ) : signedInStaff ? (
          <>
            <h1 className="mt-5 text-[22px] font-normal text-[#202124]">Chat is for buyers and tenants</h1>
            <p className="mt-2 text-[14.5px] text-[#5f6368]">You’re signed in with a business account. Sign in as a buyer or tenant to message {name}.</p>
            <Link href={homePathFor(user?.role)} className="mt-6 inline-flex rounded-full bg-[#1a73e8] px-6 py-2.5 text-[14px] font-medium text-white">Go to your dashboard</Link>
          </>
        ) : (
          <>
            <h1 className="mt-5 text-[22px] font-normal text-[#202124]">Chat with {name}</h1>
            <p className="mt-2 text-[14.5px] leading-relaxed text-[#5f6368]">
              Chats happen on e-resi, so your messages, viewings and documents stay in one place. Create your free account in one tap.
            </p>
            {error && <p className="mt-4 rounded-xl bg-[#fce8e6] px-4 py-2.5 text-[13.5px] text-[#c5221f]">{error}</p>}
            <div className="mt-6"><GoogleButton role="INVESTOR" label="Continue with Google" next={here} /></div>
            <p className="mt-5 text-[13.5px] text-[#5f6368]">
              Prefer email? <Link href={`/login?redirect=${encodeURIComponent(here)}`} className="font-medium text-[#1a73e8] hover:underline">Sign in</Link>
              {' '}or{' '}
              <Link href="/register" className="font-medium text-[#1a73e8] hover:underline">create an account</Link>
            </p>
          </>
        )}
      </div>
      <p className="mt-6 max-w-sm text-center text-[12px] text-[#80868b]">By continuing you agree to e-resi’s terms and privacy policy.</p>
    </div>
  );
}
