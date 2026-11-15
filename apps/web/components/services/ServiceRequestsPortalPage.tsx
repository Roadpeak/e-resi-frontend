'use client';

import Link from 'next/link';
import { ServiceRequestList } from './ServiceRequestList';
import { ServiceRequestTracker } from './ServiceRequestTracker';

/** Production requests inside a portal: the list, or one request when `id` is given. */
export function ServiceRequestsPortalPage({ basePath, id }: { basePath: string; id?: string }) {
  return (
    <div className="mx-auto max-w-[920px] font-google">
      {!id && (
        <header className="mb-6">
          <h1 className="text-[26px] font-normal text-[#202124]">Production requests</h1>
          <p className="mt-1 max-w-[70ch] text-[14px] text-[#5f6368]">
            Photography, drone, 3D, VR and tours you&apos;ve asked e-resi to produce — quotes, invoices and progress.
            {' '}<Link href="/services" className="text-[#1a73e8] hover:underline">See all services</Link>
          </p>
        </header>
      )}
      {/* The cards are white, made for a tinted ground: give them one inside the white portals. */}
      <div className="rounded-[32px] bg-[#f4f6fb] p-3 sm:p-5">
        {id ? <ServiceRequestTracker id={id} basePath={basePath} /> : <ServiceRequestList basePath={basePath} />}
      </div>
    </div>
  );
}
