'use client';

import { ClientRoomsPanel } from '../../../../components/agent/ClientRoomsPanel';

export default function AgentClients() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-normal text-[#202124]">Client rooms</h1>
        <p className="text-[14px] text-[#5f6368]">
          Private shortlists for your buyers — one link into the WhatsApp
          thread, full tours with your name on them, and a read on what they
          loved before you call.
        </p>
      </div>
      <ClientRoomsPanel />
    </div>
  );
}
