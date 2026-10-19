import { AlertCircle, Clock } from 'lucide-react';

/**
 * Where a development sits in the review queue, from the developer's side.
 *
 * Both a fresh submission and a rejected one are DRAFT in the database; the
 * difference is whether an admin has reviewed it yet. A rejection sets
 * reviewedAt (and usually reviewNotes) and sends the listing back to DRAFT.
 */
export type ReviewState = 'pending' | 'changes' | null;

export function reviewStateOf(p: { status?: string; reviewedAt?: string | null }): ReviewState {
  if (p.status !== 'DRAFT') return null;
  return p.reviewedAt ? 'changes' : 'pending';
}

export const REVIEW_CHIP: Record<'pending' | 'changes', { label: string; cls: string }> = {
  pending: { label: 'Pending review', cls: 'bg-[#fef7e0] text-[#b06000]' },
  changes: { label: 'Changes requested', cls: 'bg-[#fce8e6] text-[#c5221f]' },
};

function fmtDate(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Full-width explanation shown on a single development that is not live yet. */
export function ReviewStatusBanner({
  status,
  createdAt,
  reviewedAt,
  reviewNotes,
}: {
  status?: string;
  createdAt?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
}) {
  const state = reviewStateOf({ status, reviewedAt });
  if (!state) return null;

  if (state === 'changes') {
    return (
      <div className="flex gap-3 rounded-3xl border border-[#f5c6c4] bg-[#fef7f6] p-5">
        <AlertCircle size={20} className="mt-0.5 shrink-0 text-[#c5221f]" />
        <div className="min-w-0">
          <p className="text-[15px] font-medium text-[#202124]">Changes requested</p>
          <p className="mt-1 text-[14px] leading-relaxed text-[#5f6368]">
            Our team reviewed this development{fmtDate(reviewedAt) ? ` on ${fmtDate(reviewedAt)}` : ''} and
            it needs a few updates before it can go live.
          </p>
          {reviewNotes && (
            <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-[14px] leading-relaxed text-[#3c4043]">
              “{reviewNotes}”
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 rounded-3xl border border-[#fde293] bg-[#fffbeb] p-5">
      <Clock size={20} className="mt-0.5 shrink-0 text-[#b06000]" />
      <div className="min-w-0">
        <p className="text-[15px] font-medium text-[#202124]">Pending review</p>
        <p className="mt-1 text-[14px] leading-relaxed text-[#5f6368]">
          {fmtDate(createdAt) ? `Submitted ${fmtDate(createdAt)}. ` : ''}
          Our team checks every development before it appears on the marketplace. We&apos;ll email
          you as soon as it&apos;s approved. You can keep adding units, media and details meanwhile.
        </p>
      </div>
    </div>
  );
}
