'use client';

import { DealsPanel } from '../../../../components/deals/DealsPanel';

export default function AgentDeals() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-normal text-[#202124]">Deals</h1>
        <p className="text-[14px] text-[#5f6368]">
          Every client you are working, and every shilling you are owed — on
          one record both you and the developer can see.
        </p>
      </div>
      <DealsPanel side="agent" />
    </div>
  );
}
