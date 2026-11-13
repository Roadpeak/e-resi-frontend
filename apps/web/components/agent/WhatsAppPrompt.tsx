'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, MessageCircle, X } from 'lucide-react';
import { agentsApi, type AgentSelf } from '../../lib/api/agents';
import { ApiError } from '../../lib/api/client';
import { useAuthStore } from '../../lib/stores/auth.store';
import { guessCountry, toE164 } from '../../lib/data/dial-codes';
import { CountryPicker } from '../account/PhoneNumberPrompt';

/**
 * Asks an agent for a WhatsApp number until one is saved. Every listing,
 * rental and the agent's own website carry a WhatsApp button, so without a
 * number buyers and tenants have no quick way to reach them.
 *
 * "Not now" hides it for this sign-in only (sessionStorage, cleared on
 * logout, same key family as the buyer phone prompt).
 */
const KEY = 'eresi-whatsapp-prompt-dismissed';

export function WhatsAppPrompt({ me }: { me: AgentSelf | undefined }) {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [iso, setIso] = useState('KE');
  const [national, setNational] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { setIso(guessCountry()); }, []);

  useEffect(() => {
    if (!me || !user || user.isStaff || me.whatsapp) { setOpen(false); return; }
    // The invite welcome modal owns the first visit; this one waits for the next.
    if (new URLSearchParams(window.location.search).get('welcome') === '1') return;
    let dismissed = false;
    try { dismissed = sessionStorage.getItem(`${KEY}:${user.id}`) === '1'; } catch { /* private mode */ }
    setOpen(!dismissed);
  }, [me, user]);

  const save = useMutation({
    mutationFn: (whatsapp: string) => agentsApi.updateMe({ whatsapp }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['agent', 'me'] }); setOpen(false); },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not save your number. Try again.'),
  });

  if (!open || !user) return null;

  const dismiss = () => {
    try { sessionStorage.setItem(`${KEY}:${user.id}`, '1'); } catch { /* private mode */ }
    setOpen(false);
  };

  const phoneDigits = (me?.phone ?? '').replace(/\D/g, '');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const digits = national.replace(/\D/g, '').replace(/^0+/, '');
    if (digits.length < 6 || digits.length > 13) return setError('Enter a valid WhatsApp number.');
    // wa.me links want bare digits with the country code and no plus.
    save.mutate(toE164(iso, national).replace(/\D/g, ''));
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="whatsapp-prompt-title">
      <button type="button" aria-label="Not now" onClick={dismiss} className="absolute inset-0 cursor-default bg-black/40" />
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <button type="button" onClick={dismiss} aria-label="Close" className="absolute right-4 top-4 cursor-pointer rounded-full p-1.5 text-[#5f6368] hover:bg-[#f1f3f4]">
          <X size={18} />
        </button>
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e6f4ea] text-[#188038]"><MessageCircle size={20} /></span>
        <h2 id="whatsapp-prompt-title" className="mt-4 text-[20px] font-normal text-[#202124]">Add your WhatsApp number</h2>
        <p className="mt-1.5 text-[14px] leading-relaxed text-[#5f6368]">
          Your listings and website show a WhatsApp button. Without a number, buyers and tenants can&apos;t message you with one tap.
        </p>

        {phoneDigits.length >= 9 && (
          <button
            type="button"
            disabled={save.isPending}
            onClick={() => { setError(''); save.mutate(phoneDigits); }}
            className="mt-5 flex w-full cursor-pointer items-center justify-between rounded-2xl border border-[#dadce0] px-4 py-3 text-left hover:bg-[#f8f9fa] disabled:opacity-50"
          >
            <span>
              <span className="block text-[14px] font-medium text-[#202124]">Use my phone number</span>
              <span className="block text-[13px] tabular-nums text-[#5f6368]">+{phoneDigits}</span>
            </span>
            <span className="text-[14px] font-medium text-[#1a73e8]">Use</span>
          </button>
        )}

        <form onSubmit={submit} className="mt-4">
          <label htmlFor="whatsapp-national" className="mb-1.5 block text-[13px] font-medium text-[#5f6368]">
            {phoneDigits.length >= 9 ? 'Or a different WhatsApp number' : 'WhatsApp number'}
          </label>
          <div className="flex gap-2">
            <CountryPicker iso={iso} onChange={setIso} />
            <input
              id="whatsapp-national"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              value={national}
              onChange={(e) => setNational(e.target.value.replace(/[^\d\s-]/g, ''))}
              placeholder="712 345 678"
              className="min-w-0 flex-1 rounded-xl border border-[#dadce0] px-3.5 py-2.5 text-[16px] text-[#202124] outline-none focus:border-[#1a73e8] sm:text-[15px]"
            />
          </div>
          {error && <p className="mt-2 text-[13px] text-[#c5221f]">{error}</p>}
          <button type="submit" disabled={save.isPending || !national.trim()}
            className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#1a73e8] py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-50">
            {save.isPending && <Loader2 size={15} className="animate-spin" />} Save number
          </button>
        </form>
        <button type="button" onClick={dismiss} className="mt-3 w-full cursor-pointer rounded-full py-2 text-[14px] font-medium text-[#5f6368] hover:bg-[#f1f3f4]">
          Not now
        </button>
      </div>
    </div>
  );
}
