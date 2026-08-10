'use client';

import { PartnershipsPanel } from '../../../../components/agent/PartnershipsPanel';
import { useAuthStore } from '../../../../lib/stores/auth.store';

export default function AgentPartners() {
  const user = useAuthStore((s) => s.user);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-normal text-[#202124]">Partners</h1>
        <p className="text-[14px] text-[#5f6368]">
          Developers you work with, and requests waiting on an answer.
        </p>
      </div>
      <PartnershipsPanel side="agent" currentUserId={user?.id} />
    </div>
  );
}
