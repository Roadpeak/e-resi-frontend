'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChatInbox } from '../../../../components/chat/ChatInbox';

/**
 * useSearchParams() needs a Suspense boundary or the route fails to
 * prerender — the same constraint the marketplace navbar hit.
 */
function AgentMessagesInner() {
  const conversationId = useSearchParams().get('conversation');
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-normal text-[#202124]">Messages</h1>
        <p className="text-[14px] text-[#5f6368]">
          Conversations with buyers, tenants and the developers you partner with.
        </p>
      </div>
      <ChatInbox perspective="developer" initialConversationId={conversationId} />
    </div>
  );
}

export default function AgentMessages() {
  return (
    <Suspense fallback={null}>
      <AgentMessagesInner />
    </Suspense>
  );
}
