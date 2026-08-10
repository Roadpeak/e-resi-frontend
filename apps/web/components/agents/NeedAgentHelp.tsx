'use client';

import { useState } from 'react';
import { UserSearch } from 'lucide-react';
import { FindAgentModal } from './FindAgentModal';
import type { AgentSpecialty } from '../../lib/api/agents';

/**
 * Maps what a visitor is browsing to the specialty an agent must hold.
 *
 * Property type comes from the backend PropertyCategory enum; "deal" is
 * whether they are buying or renting. Anything without a matching specialty
 * (townhouses, penthouses) falls back to the nearest residential equivalent,
 * since agents describe themselves in these broader terms.
 */
export function specialtyFor(
  category: string | undefined,
  deal: 'RENT' | 'BUY',
): AgentSpecialty {
  const c = (category ?? '').toUpperCase();
  if (c === 'COMMERCIAL' || c === 'OFFICE') {
    return deal === 'RENT' ? 'COMMERCIAL_RENTAL' : 'COMMERCIAL_PURCHASE';
  }
  if (c === 'LAND') return 'LAND_SALE';
  if (c === 'VILLA' || c === 'TOWNHOUSE') {
    return deal === 'RENT' ? 'VILLA_RENTAL' : 'VILLA_PURCHASE';
  }
  return deal === 'RENT' ? 'APARTMENT_RENTAL' : 'APARTMENT_PURCHASE';
}

/**
 * "Need agent help?" — a button rather than an auto-opening popup. Someone
 * mid-search has not asked for an interruption, and a modal that opens itself
 * over the results is the thing people close without reading.
 */
export function NeedAgentHelp({
  category,
  deal,
  className,
}: {
  category?: string;
  deal: 'RENT' | 'BUY';
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const specialty = specialtyFor(category, deal);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          className
          ?? 'inline-flex items-center gap-2 rounded-full border border-[#4A80F5]/30 bg-[#F6F9FF] px-4 py-2 text-[14px] font-medium text-[#4A80F5] transition-colors hover:bg-[#e8f0fe] cursor-pointer'
        }
      >
        <UserSearch size={16} />
        Need agent help to find the right property?
      </button>

      <FindAgentModal open={open} onClose={() => setOpen(false)} specialty={specialty} />
    </>
  );
}
