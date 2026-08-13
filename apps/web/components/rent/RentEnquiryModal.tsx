'use client';

import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { apiClient, ApiError } from '../../lib/api/client';
import { useAuthStore } from '../../lib/stores/auth.store';

type Mode = 'VIEWING' | 'ENQUIRY';

interface Props {
  mode: Mode;
  listingId: string;
  listingName: string;
  /** The development this rental sits in — bookings are keyed to it. */
  propertySlug?: string;
  onClose: () => void;
}

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[15px] text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none';
const labelCls = 'mb-1.5 block text-[13px] font-medium text-gray-500';

/**
 * Book a viewing or send an enquiry on a rental.
 *
 * Both buttons on the listing page previously rendered and did nothing, so a
 * tenant who wanted the unit had no way to say so. Bookings go to the parent
 * development (that is what the API keys them to); enquiries attach to the
 * rent listing itself so the developer knows which units are being asked
 * about.
 */
export function RentEnquiryModal({
  mode, listingId, listingName, propertySlug, onClose,
}: Props) {
  const user = useAuthStore((s) => s.user);

  const [form, setForm] = useState({
    name: user ? `${user.firstName} ${user.lastName}`.trim() : '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    date: '',
    time: '',
    type: 'PHYSICAL',
    message: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const isViewing = mode === 'VIEWING';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (isViewing && !propertySlug) {
      // Bookings are keyed to a development; without one there is nothing to
      // book against, so say so rather than failing with a 400.
      setError('This rental is not linked to a development yet, so viewings cannot be booked. Send an enquiry instead.');
      return;
    }

    setBusy(true);
    try {
      if (isViewing) {
        await apiClient.post('/bookings', {
          propertySlug,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          date: form.date,
          time: form.time,
          type: form.type,
          message: form.message.trim()
            ? `${form.message.trim()}\n\n(Rental: ${listingName})`
            : `Viewing request for ${listingName}`,
        });
      } else {
        await apiClient.post('/inquiries', {
          rentListingId: listingId,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          message: form.message.trim() || `I'm interested in ${listingName}.`,
        });
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[20px] font-semibold text-gray-900">
              {isViewing ? 'Book a viewing' : 'Send an enquiry'}
            </h2>
            <p className="text-[13px] text-gray-500">{listingName}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {done ? (
          <div className="py-6 text-center">
            <p className="text-[15px] text-gray-900">
              {isViewing ? 'Your viewing request has been sent.' : 'Your enquiry has been sent.'}
            </p>
            <p className="mt-1 text-[13px] text-gray-500">
              The letting team will get back to you by email.
            </p>
            <button
              onClick={onClose}
              className="mt-5 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className={labelCls}>Your name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Optional"
                className={inputCls}
              />
            </div>

            {isViewing && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Preferred date</label>
                    <input
                      required
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Time</label>
                    <input
                      required
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Viewing type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className={inputCls}
                  >
                    <option value="PHYSICAL">In person</option>
                    <option value="VIRTUAL">Virtual</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className={labelCls}>Message</label>
              <textarea
                rows={3}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder={
                  isViewing
                    ? 'Anything the letting team should know?'
                    : 'Which unit are you interested in?'
                }
                className={`${inputCls} resize-none`}
              />
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2.5 text-[13px] text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
            >
              {busy && <Loader2 size={15} className="animate-spin" />}
              {isViewing ? 'Request viewing' : 'Send enquiry'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
