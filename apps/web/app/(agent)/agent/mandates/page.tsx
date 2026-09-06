'use client';

import { AgentMandatesPanel } from '../../../../components/mandates/MandatesPanel';

export default function AgentMandates() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-normal text-[#202124]">Mandate pool</h1>
        <p className="text-[14px] text-[#5f6368]">
          Developments open to the agent network, commission stated up front.
          Request one, and the moment it&rsquo;s granted the property is yours
          to sell at that rate.
        </p>
      </div>
      <AgentMandatesPanel />
    </div>
  );
}
