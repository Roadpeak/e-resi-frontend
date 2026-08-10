'use client';

import Link from 'next/link';
import { PartnershipsPanel } from '../../../../components/agent/PartnershipsPanel';
import { useAuthStore } from '../../../../lib/stores/auth.store';

export default function DeveloperPartners() {
  const user = useAuthStore((s) => s.user);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-normal text-[#202124]">Agent partners</h1>
          <p className="text-[14px] text-[#5f6368]">
            Agents selling or letting your developments, and pending requests.
          </p>
        </div>
        <Link
          href="/dashboard/partners/find"
          className="rounded-full bg-[#1a73e8] px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc]"
        >
          Find agents
        </Link>
      </div>
      <PartnershipsPanel side="developer" currentUserId={user?.id} />
    </div>
  );
}
