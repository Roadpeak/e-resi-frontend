'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ChatInbox } from '../../../../components/chat/ChatInbox';

function AccountMessages() {
  const searchParams = useSearchParams();
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Your conversations with property developers.
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
