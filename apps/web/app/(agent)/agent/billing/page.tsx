'use client';

import { AgentStatusBanner } from '../../../../components/agent/AgentStatusBanner';

/**
 * Placeholder until agent listing-fee billing lands. The status banner
 * already explains a lapsed profile, so this page is not empty in the
 * meantime.
 */
export default function AgentBilling() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-[26px] font-normal text-[#202124]">Billing</h1>
        <p className="text-[14px] text-[#5f6368]">
          Your monthly listing fee and payment history.
        </p>
      </div>

      <AgentStatusBanner />

      <div className="rounded-3xl border border-[#dadce0] bg-white p-6">
        <p className="text-[15px] text-[#5f6368]">
          Billing for agent listings is being set up. Your first month is free, and
          you will see your invoices here once it goes live.
        </p>
      </div>
    </div>
  );
}
