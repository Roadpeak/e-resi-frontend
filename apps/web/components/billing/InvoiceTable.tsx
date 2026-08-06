'use client';

import { useState } from 'react';
import { MaterialIcon } from '../dashboard/MaterialIcon';
import type { Invoice } from '../../lib/api/billing';
import { cn } from '../../lib/utils';

/** Mirrors the API's own limit (InvoicesService.MPESA_MAX_KES) so the button
 *  never offers a channel the server will just reject. */
const MPESA_MAX_KES = 250_000;

const isMpesaEligible = (inv: Invoice) =>
  inv.currency === 'KES' && inv.total <= MPESA_MAX_KES;

export const INVOICE_STATUS_STYLES: Record<Invoice['status'], string> = {
  PAID: 'bg-[#e6f4ea] text-[#188038]',
  ISSUED: 'bg-[#e8f0fe] text-[#174ea6]',
  OVERDUE: 'bg-[#fce8e6] text-[#c5221f]',
  DRAFT: 'bg-[#f1f3f4] text-[#5f6368]',
  CANCELLED: 'bg-[#f1f3f4] text-[#5f6368]',
};

export const money = (n: number, c: string) =>
  `${c} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const shortDate = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

/**
 * Invoice list shared by the developer dashboard and the admin console. The
 * admin view adds the customer column and a reminder action; everything else
 * is identical, so the two stay visually consistent by construction.
 */
export function InvoiceTable({
  invoices,
  showCustomer = false,
  onRemind,
  remindingId,
  onPay,
  payingId,
  onPayMpesa,
  mpesaPayingId,
}: {
  invoices: Invoice[];
  showCustomer?: boolean;
  /** Omitted for developers — only admins chase invoices. */
  onRemind?: (invoice: Invoice) => void;
  remindingId?: string | null;
  /** Omitted for admins — only the account holder pays. */
  onPay?: (invoice: Invoice) => void;
  payingId?: string | null;
  /**
   * Omitted for admins, and for any invoice the API would reject anyway —
   * KES only, under Safaricom's per-transaction limit. Takes the phone
   * number the developer typed in the row's own inline prompt.
   */
  onPayMpesa?: (invoice: Invoice, phone: string) => void;
  mpesaPayingId?: string | null;
}) {
  const [mpesaRowId, setMpesaRowId] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const submitMpesa = (inv: Invoice) => {
    const normalized = phone.replace(/\D/g, '').replace(/^0/, '254');
    if (!/^254(7|1)\d{8}$/.test(normalized)) {
      setPhoneError('Enter a valid Safaricom number, e.g. 0712 345 678.');
      return;
    }
    setPhoneError('');
    onPayMpesa?.(inv, normalized);
    // Close the prompt immediately — the STK push is already on its way to
    // the phone, and there's nothing more to do in this row while it waits.
    setMpesaRowId(null);
  };

  if (!invoices.length) {
    return (
      <div className="py-12 text-center">
        <MaterialIcon name="receipt_long" className="text-[32px] text-[#dadce0]" />
        <p className="mt-2 text-[14px] text-[#5f6368]">No invoices yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-[14px]">
        <thead>
          <tr className="border-b border-[#f1f3f4] text-[12px] uppercase tracking-wide text-[#5f6368]">
            <th className="py-2 pr-4 font-medium">Invoice</th>
            {showCustomer && <th className="py-2 pr-4 font-medium">Customer</th>}
            <th className="py-2 pr-4 font-medium">For</th>
            <th className="py-2 pr-4 font-medium">Due</th>
            <th className="py-2 pr-4 font-medium">Amount</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 font-medium">{onRemind ? 'Action' : 'Receipt / pay'}</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="border-b border-[#f8f9fa] last:border-0 align-top">
              <td className="py-3 pr-4 font-medium text-[#202124]">{inv.number}</td>
              {showCustomer && (
                <td className="py-3 pr-4 text-[#5f6368]">
                  <div className="text-[#202124]">{inv.billedToName}</div>
                  <div className="text-[12px]">{inv.billedToEmail}</div>
                </td>
              )}
              <td className="py-3 pr-4 text-[#5f6368]">
                {inv.lineItems?.[0]?.description ?? (inv.kind === 'SUBSCRIPTION' ? 'Listing fee' : 'Production')}
              </td>
              <td className="py-3 pr-4 text-[#5f6368]">
                {shortDate(inv.dueAt)}
                {inv.terminatesAt && inv.status !== 'PAID' && (
                  <div className="text-[12px] text-[#c5221f]">
                    Ends {shortDate(inv.terminatesAt)}
                  </div>
                )}
              </td>
              <td className="py-3 pr-4 whitespace-nowrap text-[#202124]">
                {money(inv.total, inv.currency)}
              </td>
              <td className="py-3 pr-4">
                <span className={cn('rounded-full px-2.5 py-1 text-[12px]', INVOICE_STATUS_STYLES[inv.status])}>
                  {inv.status.toLowerCase()}
                </span>
                {inv.remindersSent > 0 && inv.status !== 'PAID' && (
                  <div className="mt-1 text-[11px] text-[#5f6368]">
                    {inv.remindersSent} reminder{inv.remindersSent === 1 ? '' : 's'}
                  </div>
                )}
              </td>
              <td className="py-3 text-[13px]">
                {onRemind ? (
                  inv.status === 'PAID' || inv.status === 'CANCELLED' ? (
                    <span className="text-[#5f6368]">—</span>
                  ) : inv.status === 'DRAFT' ? (
                    // Nothing to chase: the customer has not been sent this yet.
                    <span className="text-[#5f6368]" title="Not issued yet">Not issued</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onRemind(inv)}
                      disabled={remindingId === inv.id}
                      className="rounded-full border border-[#dadce0] px-3 py-1.5 text-[13px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f0f4f9] disabled:opacity-50"
                    >
                      {remindingId === inv.id ? 'Sending…' : 'Send reminder'}
                    </button>
                  )
                ) : inv.receipt ? (
                  <span className="text-[#188038]">{inv.receipt.number}</span>
                ) : onPay && (inv.status === 'ISSUED' || inv.status === 'OVERDUE') ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onPay(inv)}
                      disabled={payingId === inv.id}
                      className="rounded-full bg-[#1a73e8] px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-50"
                    >
                      {payingId === inv.id ? 'Opening…' : `Pay ${money(inv.total, inv.currency)}`}
                    </button>
                    {onPayMpesa && isMpesaEligible(inv) && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhoneError('');
                          setPhone('');
                          setMpesaRowId(mpesaRowId === inv.id ? null : inv.id);
                        }}
                        disabled={mpesaPayingId === inv.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#188038] px-3 py-1.5 text-[13px] font-medium text-[#188038] transition-colors hover:bg-[#e6f4ea] disabled:opacity-50"
                      >
                        <MaterialIcon name="smartphone" className="text-[15px]" />
                        {mpesaPayingId === inv.id ? 'Sending…' : 'M-Pesa'}
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="text-[#5f6368]">—</span>
                )}
              </td>
            </tr>
          ))}
          {mpesaRowId && (() => {
            const inv = invoices.find((i) => i.id === mpesaRowId);
            if (!inv) return null;
            return (
              <tr key={`${inv.id}-mpesa`} className="border-b border-[#f8f9fa] bg-[#f8f9fa]">
                <td colSpan={showCustomer ? 7 : 6} className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] text-[#5f6368]">
                      Send an STK push for {money(inv.total, inv.currency)} to
                    </span>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0712 345 678"
                      inputMode="tel"
                      className="w-44 rounded-full border border-[#dadce0] bg-white px-3.5 py-1.5 text-[13px] text-[#202124] placeholder-[#80868b] focus:border-[#188038] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => submitMpesa(inv)}
                      className="rounded-full bg-[#188038] px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[#0d652d]"
                    >
                      Send prompt
                    </button>
                    <button
                      type="button"
                      onClick={() => setMpesaRowId(null)}
                      className="text-[13px] text-[#5f6368] hover:text-[#202124]"
                    >
                      Cancel
                    </button>
                  </div>
                  {phoneError && (
                    <p className="mt-1.5 text-[12px] text-[#c5221f]">{phoneError}</p>
                  )}
                </td>
              </tr>
            );
          })()}
        </tbody>
      </table>
    </div>
  );
}
