'use client';

import { DeveloperMandatesPanel } from '../../../../components/mandates/MandatesPanel';

export default function DeveloperMandates() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-normal text-[#202124]">Mandates</h1>
        <p className="text-[14px] text-[#5f6368]">
          Open your developments to every verified agent at once — the
          commission you publish is the rate they get, and accepting a request
          handles the partnership and assignment in one step.
        </p>
      </div>
      <DeveloperMandatesPanel />
    </div>
  );
}
