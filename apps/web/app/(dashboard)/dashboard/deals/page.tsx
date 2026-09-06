'use client';

import { DealsPanel } from '../../../../components/deals/DealsPanel';

export default function DeveloperDeals() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-normal text-[#202124]">Agent deals</h1>
        <p className="text-[14px] text-[#5f6368]">
          Sales your partner agents are working, and the commissions owed on
          them — settled on the record rather than over WhatsApp.
        </p>
      </div>
      <DealsPanel side="developer" />
    </div>
  );
}
