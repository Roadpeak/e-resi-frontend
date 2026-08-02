'use client';

import { MaterialIcon } from '../dashboard/MaterialIcon';
import type { Invoice } from '../../lib/api/billing';
import { cn } from '../../lib/utils';

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
}: {
  invoices: Invoice[];
  showCustomer?: boolean;
  /** Omitted for developers — only admins chase invoices. */
  onRemind?: (invoice: Invoice) => void;
  remindingId?: string | null;
}) {
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
            <th className="py-2 font-medium">{onRemind ? 'Action' : 'Receipt'}</th>
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
                ) : (
                  <span className="text-[#5f6368]">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
