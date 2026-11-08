'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { billingApi } from '../../lib/api/billing';
import { ApiError } from '../../lib/api/client';

/**
 * Shown on a development that's approved but waiting on its listing fee, or
 * paused because a monthly renewal went unpaid. Paying puts it live at once.
 */
export function ListingFeeBanner({
  status, invoiceId, agent,
}: { status: string; invoiceId?: string | null; agent: boolean }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  if (status !== 'PENDING_PAYMENT' && status !== 'PAUSED') return null;
  const paused = status === 'PAUSED';
  const billingHref = agent ? '/agent/billing' : '/dashboard/billing';

  async function pay() {
    if (!invoiceId) return;
    setBusy(true); setMsg('');
    try {
      const r = await billingApi.payInvoice(invoiceId);
      if (r.paid) {
        setMsg('Paid — your development is live.');
        qc.invalidateQueries();
      } else {
        window.location.href = r.authorizationUrl;
      }
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : 'Payment could not be started');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`rounded-3xl border p-5 ${paused ? 'border-[#f5c6c4] bg-[#fce8e6]' : 'border-[#fde293] bg-[#fef7e0]'}`}>
      <p className={`text-[16px] font-medium ${paused ? 'text-[#c5221f]' : 'text-[#b06000]'}`}>
        {paused ? 'Paused: listing fee unpaid' : 'Approved: pay to publish'}
      </p>
      <p className="mt-1 text-[14px] text-[#3c4043]">
        {paused
          ? 'Buyers can’t see this development right now. Pay the open listing-fee invoice and it goes straight back live.'
          : 'Our team approved this development. Pay its listing fee and it goes live straight away.'}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {invoiceId && (
          <button
            type="button"
            onClick={pay}
            disabled={busy}
            className="rounded-full bg-[#1a73e8] px-4 py-2 text-[14px] font-medium text-white hover:bg-[#1765cc] disabled:opacity-50"
          >
            {busy ? 'Starting…' : 'Pay by card'}
          </button>
        )}
        <Link href={billingHref} className="rounded-full border border-[#dadce0] bg-white px-4 py-2 text-[14px] font-medium text-[#1a73e8] hover:bg-[#f8f9fa]">
          Pay with M-Pesa or view invoice
        </Link>
        {msg && <span className="text-[13px] text-[#3c4043]">{msg}</span>}
      </div>
    </div>
  );
}
