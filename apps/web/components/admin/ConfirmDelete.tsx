'use client';

import { useEffect, useState } from 'react';
import { MaterialIcon } from '../dashboard/MaterialIcon';

/**
 * Confirmation for irreversible admin deletes.
 *
 * Deliberately requires typing the record's name rather than offering a single
 * "Delete" button: these cascade to media, units and tours, and a misplaced
 * click in a table row is exactly how the wrong development disappears.
 */
export function ConfirmDelete({
  open,
  name,
  description,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  /** The record's name — the operator must type this to proceed. */
  name: string;
  description: string;
  busy?: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState('');

  // Clear between openings so a previous confirmation cannot arm the next one.
  useEffect(() => {
    if (open) setTyped('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const armed = typed.trim() === name.trim() && !busy;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fce8e6]">
          <MaterialIcon name="delete_forever" className="text-[22px] text-[#c5221f]" />
        </div>

        <h2 id="confirm-delete-title" className="mt-4 text-[20px] font-medium text-[#202124]">
          Delete {name}?
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[#5f6368]">{description}</p>

        <label className="mt-5 block">
          <span className="text-[13px] text-[#5f6368]">
            Type <span className="font-medium text-[#202124]">{name}</span> to confirm
          </span>
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoFocus
            className="mt-1.5 w-full rounded-xl border border-[#dadce0] px-3 py-2 text-[14px] text-[#202124] focus:border-[#c5221f] focus:outline-none"
          />
        </label>

        {error && (
          <p className="mt-3 rounded-xl bg-[#fce8e6] px-3 py-2 text-[13px] text-[#c5221f]">
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-4 py-2 text-[14px] font-medium text-[#5f6368] transition-colors hover:bg-[#f1f3f4]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!armed}
            className="rounded-full bg-[#c5221f] px-5 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#a50e0e] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? 'Deleting…' : 'Delete permanently'}
          </button>
        </div>
      </div>
    </div>
  );
}
