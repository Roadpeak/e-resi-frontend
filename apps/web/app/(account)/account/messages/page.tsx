'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ChatInbox } from '../../../../components/chat/ChatInbox';

function AccountMessages() {
  const searchParams = useSearchParams();
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[24px] font-normal text-[#202124]">Messages</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Your conversations with developers, agents and unit owners.
        </p>
      </div>
      <ChatInbox perspective="customer" initialConversationId={searchParams.get('c')} />
    </div>
  );
}

export default function AccountMessagesPage() {
  return (
    <Suspense>
      <AccountMessages />
    </Suspense>
  );
}
