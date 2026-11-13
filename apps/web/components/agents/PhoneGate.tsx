'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Loader2, Phone, X } from 'lucide-react';
import { agentsApi, type RevealedContact } from '../../lib/api/agents';
import { ApiError } from '../../lib/api/client';
import { useAuthStore } from '../../lib/stores/auth.store';
import { CountryPicker } from '../account/PhoneNumberPrompt';
import { guessCountry, toE164 } from '../../lib/data/dial-codes';

/**
 * An agent's number is shown to someone who leaves theirs. Visitors fill a
 * short form; signed-in users with a phone on file are let through at once.
 * Either way the agent gets the lead on their leads page. The reveal is
 * remembered for the session so the same agent is not asked twice.
 */

const KEY = 'eresi-revealed-contact';

export function revealedContact(agentId: string): RevealedContact | null {
  try {
    const raw = sessionStorage.getItem(`${KEY}:${agentId}`);
    return raw ? (JSON.parse(raw) as RevealedContact) : null;
  } catch { return null; }
}

export function waHref(whatsapp: string, text?: string) {
  const digits = whatsapp.replace(/[^\d]/g, '').replace(/^0/, '254');
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export function PhoneGate({
  open, onClose, agentId, agentName, context, onRevealed,
}: {
  open: boolean;
  onClose: () => void;
  agentId: string;
  agentName?: string;
  context?: { rentListingId?: string; propertySlug?: string; label?: string };
  onRevealed?: (c: RevealedContact) => void;
}) {
  const user = useAuthStore((s) => s.user);
  const [iso, setIso] = useState('KE');
  const [name, setName] = useState('');
  const [national, setNational] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [contact, setContact] = useState<RevealedContact | null>(null);

  useEffect(() => { setIso(guessCountry()); }, []);
  useEffect(() => {
    if (!open) return;
    setError('');
    setContact(revealedContact(agentId));
    setName((n) => n || [user?.firstName, user?.lastName].filter(Boolean).join(' '));
    setEmail((e) => e || user?.email || '');
  }, [open, agentId, user]);

  // Signed in with a number on file: no form, the lead is still recorded.
  useEffect(() => {
    if (!open || contact || busy || !user?.phone) return;
    void submitWith([user.firstName, user.lastName].filter(Boolean).join(' ') || user.email, user.phone, user.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, contact, user?.phone]);

  async function submitWith(n: string, phone: string, e?: string) {
    setBusy(true);
    setError('');
    try {
      const c = await agentsApi.revealContact(agentId, {
        name: n, phone, email: e || undefined,
        rentListingId: context?.rentListingId, propertySlug: context?.propertySlug,
      });
      try { sessionStorage.setItem(`${KEY}:${agentId}`, JSON.stringify(c)); } catch { /* private mode */ }
      setContact(c);
      onRevealed?.(c);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not get the number right now. Try again.');
    } finally {
      setBusy(false);
    }
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const digits = national.replace(/\D/g, '').replace(/^0+/, '');
    if (!name.trim()) return setError('Your name, so the agent knows who is calling.');
    if (digits.length < 6 || digits.length > 13) return setError('Enter a valid phone number.');
    void submitWith(name.trim(), toE164(iso, national), email.trim());
  }

  if (!open || typeof document === 'undefined') return null;
  const stop = (e: React.SyntheticEvent) => { e.stopPropagation(); };
  const who = agentName ?? 'the agent';

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="phone-gate-title"
      onClick={stop} onMouseDown={stop} onPointerDown={stop} onKeyDown={stop}>
      <button type="button" aria-label="Close" onClick={(e) => { e.preventDefault(); onClose(); }} className="absolute inset-0 cursor-default bg-black/45" />
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <button type="button" onClick={(e) => { e.preventDefault(); onClose(); }} aria-label="Close" className="absolute right-4 top-4 rounded-full p-1.5 text-[#5f6368] hover:bg-[#f1f3f4]"><X size={18} /></button>
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e8f0fe] text-[#1a73e8]"><Phone size={20} /></span>

        {contact ? (
          <>
            <h2 id="phone-gate-title" className="mt-4 text-[20px] font-normal text-[#202124]">Here is {who}&apos;s number</h2>
            <p className="mt-1 text-[14px] text-[#5f6368]">They have your details too{context?.label ? ` and know you asked about ${context.label}` : ''}.</p>
            <div className="mt-5 space-y-2">
              {contact.phone && (
                <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="flex items-center justify-between rounded-2xl border border-[#dadce0] px-4 py-3 hover:bg-[#f8f9fa]">
                  <span className="text-[16px] font-medium tabular-nums text-[#202124]">{contact.phone}</span>
                  <span className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#1a73e8]"><Phone size={15} /> Call</span>
                </a>
              )}
              {contact.whatsapp && (
                <a href={waHref(contact.whatsapp, context?.label ? `Hi, I'm interested in ${context.label} on e-resi.` : `Hi, I found you on e-resi.`)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-full bg-[#25d366] py-3 text-[15px] font-medium text-white hover:bg-[#1ebe5b]">
                  WhatsApp {who}
                </a>
              )}
              {!contact.phone && !contact.whatsapp && (
                <p className="rounded-2xl bg-[#f8f9fa] px-4 py-3 text-[14px] text-[#5f6368]">This agent has not added a phone number yet. They have your number and will call you back.</p>
              )}
            </div>
          </>
        ) : busy && user?.phone ? (
          <p className="mt-5 flex items-center gap-2 text-[14px] text-[#5f6368]"><Loader2 size={15} className="animate-spin" /> Getting the number…</p>
        ) : (
          <>
            <h2 id="phone-gate-title" className="mt-4 text-[20px] font-normal text-[#202124]">Leave your number to see {who}&apos;s</h2>
            <p className="mt-1.5 text-[14px] leading-relaxed text-[#5f6368]">
              Agents share their number with people they can call back. Yours goes straight to {who} as an enquiry.
            </p>
            <form onSubmit={submit} className="mt-5 space-y-3">
              <div>
                <label htmlFor="gate-name" className="mb-1.5 block text-[13px] font-medium text-[#5f6368]">Your name</label>
                <input id="gate-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Jane Doe"
                  className="w-full rounded-xl border border-[#dadce0] px-3.5 py-2.5 text-[16px] text-[#202124] outline-none focus:border-[#1a73e8] sm:text-[15px]" />
              </div>
              <div>
                <label htmlFor="gate-phone" className="mb-1.5 block text-[13px] font-medium text-[#5f6368]">Your phone number</label>
                <div className="flex gap-2">
                  <CountryPicker iso={iso} onChange={setIso} />
                  <input id="gate-phone" type="tel" inputMode="tel" autoComplete="tel-national" value={national}
                    onChange={(e) => setNational(e.target.value.replace(/[^\d\s-]/g, ''))} placeholder="712 345 678"
                    className="min-w-0 flex-1 rounded-xl border border-[#dadce0] px-3.5 py-2.5 text-[16px] text-[#202124] outline-none focus:border-[#1a73e8] sm:text-[15px]" />
                </div>
              </div>
              <div>
                <label htmlFor="gate-email" className="mb-1.5 block text-[13px] font-medium text-[#5f6368]">Email <span className="font-normal text-[#9aa0a6]">(optional)</span></label>
                <input id="gate-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="jane@example.com"
                  className="w-full rounded-xl border border-[#dadce0] px-3.5 py-2.5 text-[16px] text-[#202124] outline-none focus:border-[#1a73e8] sm:text-[15px]" />
              </div>
              {error && <p className="text-[13px] text-[#c5221f]">{error}</p>}
              <button type="submit" disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1a73e8] py-2.5 text-[15px] font-medium text-white hover:bg-[#1765cc] disabled:opacity-50">
                {busy && <Loader2 size={15} className="animate-spin" />} Show number
              </button>
            </form>
            {!user && (
              <p className="mt-3 text-center text-[13px] text-[#5f6368]">
                Have an account? <Link href="/login" className="font-medium text-[#1a73e8] hover:underline">Sign in</Link> to skip this next time.
              </p>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
