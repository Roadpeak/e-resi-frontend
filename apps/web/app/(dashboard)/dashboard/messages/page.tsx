'use client';

import { ChatInbox } from '../../../../components/chat/ChatInbox';

export default function DashboardMessagesPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h2 className="text-[26px] sm:text-[28px] font-normal text-[#202124]">Messages</h2>
        <p className="text-base text-[#5f6368]">
          Live conversations with buyers, investors and tenants — replies land on their screen instantly.
        </p>
      </div>
      <ChatInbox perspective="developer" />
    </div>
  );
}
