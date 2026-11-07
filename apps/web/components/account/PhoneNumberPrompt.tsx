'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Loader2, Phone, Search, X } from 'lucide-react';
import { authApi } from '../../lib/api/auth';
import { ApiError } from '../../lib/api/client';
import { useAuthStore } from '../../lib/stores/auth.store';
import { countries, guessCountry, toE164, type Country } from '../../lib/data/dial-codes';

/**
 * Asks investors, tenants and buyers for a phone number — shown each time
 * they sign in until they add one. Developers reach interested buyers by
 * phone, and a lead without a number is hard to follow up.
 *
 * "Not now" hides it for this sign-in only (sessionStorage, cleared on
 * logout); it returns at the next sign-in until a number is saved.
 */

const PROMPT_ROLES = new Set(['INVESTOR', 'TENANT', 'BUYER']);
export const PHONE_PROMPT_KEY = 'eresi-phone-prompt-dismissed';

export function PhoneNumberPrompt() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user || !PROMPT_ROLES.has(user.role) || user.phone) { setOpen(false); return; }
    let dismissed = false;
    try { dismissed = sessionStorage.getItem(`${PHONE_PROMPT_KEY}:${user.id}`) === '1'; } catch { /* private mode */ }
    setOpen(!dismissed);
  }, [user]);

  if (!open || !user) return null;

  const dismiss = () => {
    try { sessionStorage.setItem(`${PHONE_PROMPT_KEY}:${user.id}`, '1'); } catch { /* private mode */ }
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="phone-prompt-title">
      <button type="button" aria-label="Not now" onClick={dismiss} className="absolute inset-0 cursor-default bg-black/40" />
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <button type="button" onClick={dismiss} aria-label="Close" className="absolute right-4 top-4 cursor-pointer rounded-full p-1.5 text-[#5f6368] hover:bg-[#f1f3f4]">
          <X size={18} />
        </button>
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e8f0fe] text-[#1a73e8]"><Phone size={20} /></span>
        <h2 id="phone-prompt-title" className="mt-4 text-[20px] font-normal text-[#202124]">Add your phone number</h2>
        <p className="mt-1.5 text-[14px] leading-relaxed text-[#5f6368]">
          So developers can reach you about homes you&apos;re interested in, arrange viewings and send price updates.
        </p>
        <PhoneForm
          onSaved={async () => {
            const me = await authApi.me();
            if (token) setUser(me, token);
            setOpen(false);
          }}
        />
        <button type="button" onClick={dismiss} className="mt-3 w-full cursor-pointer rounded-full py-2 text-[14px] font-medium text-[#5f6368] hover:bg-[#f1f3f4]">
          Not now
        </button>
      </div>
    </div>
  );
}

function PhoneForm({ onSaved }: { onSaved: () => Promise<void> }) {
  const [iso, setIso] = useState('KE');
  const [national, setNational] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { setIso(guessCountry()); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const digits = national.replace(/\D/g, '').replace(/^0+/, '');
    if (digits.length < 6 || digits.length > 13) return setError('Enter a valid phone number.');
    const phone = toE164(iso, national);
    setSaving(true);
    try {
      await authApi.updateProfile({ phone });
      await onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your number. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-5">
      <label htmlFor="phone-national" className="mb-1.5 block text-[13px] font-medium text-[#5f6368]">Phone number</label>
      <div className="flex gap-2">
        <CountryPicker iso={iso} onChange={setIso} />
        <input
          id="phone-national"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          value={national}
          onChange={(e) => setNational(e.target.value.replace(/[^\d\s-]/g, ''))}
          placeholder="712 345 678"
          className="min-w-0 flex-1 rounded-xl border border-[#dadce0] px-3.5 py-2.5 text-[15px] text-[#202124] outline-none focus:border-[#1a73e8]"
          autoFocus
        />
      </div>
      {error && <p className="mt-2 text-[13px] text-[#c5221f]">{error}</p>}
      <button type="submit" disabled={saving || !national.trim()}
        className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#1a73e8] py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-50">
        {saving && <Loader2 size={15} className="animate-spin" />} Save number
      </button>
    </form>
  );
}

/** Country selector with search, showing flag and dialling code. */
export function CountryPicker({ iso, onChange }: { iso: string; onChange: (iso: string) => void }) {
  const list = useMemo(() => countries(), []);
  const current = list.find((c) => c.iso === iso) ?? list.find((c) => c.iso === 'KE')!;
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const needle = q.trim().toLowerCase().replace(/^\+/, '');
  const shown: Country[] = needle
    ? list.filter((c) => c.name.toLowerCase().includes(needle) || c.dial.startsWith(needle) || c.iso.toLowerCase() === needle)
    : list;

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="listbox" aria-expanded={open} aria-label={`Country code: ${current.name} +${current.dial}`}
        className="flex h-full cursor-pointer items-center gap-1.5 rounded-xl border border-[#dadce0] px-3 py-2.5 text-[15px] text-[#202124] hover:bg-[#f8f9fa]">
        <span aria-hidden="true">{current.flag}</span>
        <span className="tabular-nums">+{current.dial}</span>
        <ChevronDown size={14} className="text-[#80868b]" />
      </button>
      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-10 w-72 overflow-hidden rounded-2xl border border-[#dadce0] bg-white shadow-xl">
          <label className="flex items-center gap-2 border-b border-[#f1f3f4] px-3 py-2">
            <Search size={15} className="text-[#80868b]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} autoFocus placeholder="Search country or code"
              className="w-full bg-transparent text-[14px] text-[#202124] outline-none placeholder:text-[#9aa0a6]" />
          </label>
          <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
            {shown.map((c) => (
              <li key={c.iso}>
                <button type="button" role="option" aria-selected={c.iso === iso}
                  onClick={() => { onChange(c.iso); setOpen(false); setQ(''); }}
                  className={`flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-[14px] hover:bg-[#f1f3f4] ${c.iso === iso ? 'bg-[#e8f0fe]' : ''}`}>
                  <span aria-hidden="true">{c.flag}</span>
                  <span className="min-w-0 flex-1 truncate text-[#202124]">{c.name}</span>
                  <span className="tabular-nums text-[#5f6368]">+{c.dial}</span>
                </button>
              </li>
            ))}
            {!shown.length && <li className="px-3 py-3 text-[13px] text-[#5f6368]">No country matches “{q}”.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
