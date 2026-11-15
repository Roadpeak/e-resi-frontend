'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Loader2, X } from 'lucide-react';
import { useAuthStore } from '../../lib/stores/auth.store';
import { ApiError } from '../../lib/api/client';
import {
  REQUESTER_OPTIONS, serviceRequestsApi, type CatalogService, type RequesterType, type ServiceRequestInput,
} from '../../lib/api/service-requests';
import { GoogleButton } from '../auth/GoogleButton';
import { cn } from '../../lib/utils';

/** Survives the trip to sign-in and back (including Google's), per browser. */
const DRAFT_KEY = 'eresi:serviceRequestDraft';
const RETURN_PATH = '/services?resume=1';

const PROPERTY_TYPES: [string, string][] = [
  ['APARTMENT', 'Apartment'], ['VILLA', 'Villa / house'], ['TOWNHOUSE', 'Townhouse'], ['PENTHOUSE', 'Penthouse'],
  ['OFFICE', 'Office'], ['COMMERCIAL', 'Commercial'], ['LAND', 'Land / plot'],
];

type Draft = {
  requesterType: RequesterType | '';
  services: string[];
  otherService: string;
  propertyType: string;
  location: string;
  address: string;
  preferredDate: string;
  timing: string;
  scope: string;
  budget: string;
  details: string;
  contactPhone: string;
};

const EMPTY: Draft = {
  requesterType: '', services: [], otherService: '', propertyType: '', location: '', address: '',
  preferredDate: '', timing: '', scope: '', budget: '', details: '', contactPhone: '',
};

function readDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : null;
  } catch { return null; }
}
function writeDraft(d: Draft) { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch { /* private mode */ } }
function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ } }

const input = 'w-full rounded-xl border border-[#dadce0] bg-white px-4 py-3 text-[15px] text-[#202124] placeholder:text-[#9aa0a6] outline-none transition focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20';
const label = 'mb-1.5 block text-[14px] font-medium text-[#202124]';

export function ServiceRequestForm({ services }: { services: CatalogService[] }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [d, setD] = useState<Draft>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [gate, setGate] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [sending, setSending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Restore a saved draft; coming back from sign-in, bring the form into view.
  useEffect(() => {
    const saved = readDraft();
    if (saved) setD(saved);
    setLoaded(true);
    if (new URLSearchParams(window.location.search).get('resume') === '1' && saved) {
      setResumed(true);
      setTimeout(() => document.getElementById('request')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  }, []);

  useEffect(() => { if (loaded) writeDraft(d); }, [d, loaded]);

  // A signed-in user's phone fills the contact field if they left it empty.
  useEffect(() => {
    const phone = (user as { phone?: string | null } | null)?.phone;
    if (loaded && phone && !d.contactPhone) setD((x) => ({ ...x, contactPhone: phone }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, user]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => { setD((x) => ({ ...x, [k]: v })); setErrors((e) => ({ ...e, [k]: '' })); };
  const toggle = (key: string) => set('services', d.services.includes(key) ? d.services.filter((s) => s !== key) : [...d.services, key]);

  const grouped = useMemo(() => {
    const order = ['CAPTURE', 'IMMERSIVE', 'MARKETING', 'DESIGN'];
    return order.map((c) => [c, services.filter((s) => s.category === c)] as const).filter(([, l]) => l.length);
  }, [services]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!d.requesterType) e.requesterType = 'Tell us who you are.';
    if (d.services.length === 0 && !d.otherService.trim()) e.services = 'Choose at least one service, or describe it under “Something else”.';
    if (d.location.trim().length < 2) e.location = 'Where is the property?';
    if (d.details.trim().length < 10) e.details = 'A sentence or two about the job helps us price it.';
    setErrors(e);
    if (Object.keys(e).length) {
      const first = Object.keys(e)[0];
      formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return Object.keys(e).length === 0;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setSubmitError('');
    if (!validate()) return;
    writeDraft(d);
    if (!isAuthenticated) { setGate(true); return; }

    setSending(true);
    try {
      const body: ServiceRequestInput = {
        requesterType: d.requesterType as RequesterType,
        services: d.services,
        details: d.details.trim(),
        location: d.location.trim(),
        ...(d.otherService.trim() && { otherService: d.otherService.trim() }),
        ...(d.propertyType && { propertyType: d.propertyType }),
        ...(d.address.trim() && { address: d.address.trim() }),
        ...(d.preferredDate && { preferredDate: d.preferredDate }),
        ...(d.timing.trim() && { timing: d.timing.trim() }),
        ...(d.scope.trim() && { scope: d.scope.trim() }),
        ...(d.budget.trim() && { budget: d.budget.trim() }),
        ...(d.contactPhone.trim() && { contactPhone: d.contactPhone.trim() }),
      };
      const created = await serviceRequestsApi.create(body);
      clearDraft();
      router.push(`/services/requests/${created.id}?sent=1`);
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.message : 'Could not send your request. Please try again.');
      setSending(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <form ref={formRef} onSubmit={submit} noValidate className="rounded-[28px] bg-white p-6 font-google sm:p-10">
        {resumed && isAuthenticated && (
          <div className="mb-8 flex items-start gap-3 rounded-2xl bg-[#e8f0fe] px-5 py-4 text-[15px] text-[#174ea6]">
            <Check size={18} className="mt-0.5 shrink-0" />
            <span>Welcome back{user?.firstName ? `, ${user.firstName}` : ''}. Your request is just as you left it. Check it over and send it.</span>
          </div>
        )}

        {/* Who */}
        <fieldset data-field="requesterType" className="mb-8">
          <legend className={label}>I am a…</legend>
          <div className="flex flex-wrap gap-2">
            {REQUESTER_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => set('requesterType', o.value)}
                className={cn(
                  'rounded-full border px-4 py-2 text-[14px] font-medium transition',
                  d.requesterType === o.value ? 'border-[#1a73e8] bg-[#e8f0fe] text-[#174ea6]' : 'border-[#dadce0] text-[#3c4043] hover:bg-[#f8f9fa]',
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
          {errors.requesterType && <p className="mt-2 text-[13px] text-[#c5221f]">{errors.requesterType}</p>}
        </fieldset>

        {/* What */}
        <fieldset data-field="services" className="mb-8">
          <legend className={label}>What should we produce?</legend>
          <p className="mb-4 text-[14px] text-[#5f6368]">Choose as many as you need.</p>
          <div className="space-y-5">
            {grouped.map(([cat, list]) => (
              <div key={cat}>
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#5f6368]">
                  {cat === 'CAPTURE' ? 'Photography and video' : cat === 'IMMERSIVE' ? '3D, VR and tours' : cat.toLowerCase()}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {list.map((s) => {
                    const on = d.services.includes(s.key);
                    return (
                      <button
                        key={s.key}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggle(s.key)}
                        className={cn(
                          'flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition',
                          on ? 'border-[#1a73e8] bg-[#f4f8ff]' : 'border-[#dadce0] hover:bg-[#f8f9fa]',
                        )}
                      >
                        <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border', on ? 'border-[#1a73e8] bg-[#1a73e8] text-white' : 'border-[#9aa0a6]')}>
                          {on && <Check size={13} strokeWidth={3} />}
                        </span>
                        <span>
                          <span className="block text-[15px] font-medium text-[#202124]">{s.label}</span>
                          {s.description && <span className="mt-0.5 block text-[13px] leading-snug text-[#5f6368]">{s.description}</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <label className={label} htmlFor="sr-other">Something else</label>
            <input id="sr-other" className={input} maxLength={300} placeholder="e.g. floor plan drawings, a launch event video" value={d.otherService} onChange={(e) => set('otherService', e.target.value)} />
          </div>
          {errors.services && <p className="mt-2 text-[13px] text-[#c5221f]">{errors.services}</p>}
        </fieldset>

        {/* Where and when */}
        <div className="mb-8 grid gap-5 sm:grid-cols-2">
          <div data-field="location">
            <label className={label} htmlFor="sr-location">Location</label>
            <input id="sr-location" className={input} maxLength={160} placeholder="e.g. Kilimani, Nairobi" value={d.location} onChange={(e) => set('location', e.target.value)} />
            {errors.location && <p className="mt-2 text-[13px] text-[#c5221f]">{errors.location}</p>}
          </div>
          <div>
            <label className={label} htmlFor="sr-type">Property type <span className="font-normal text-[#5f6368]">(optional)</span></label>
            <select id="sr-type" className={input} value={d.propertyType} onChange={(e) => set('propertyType', e.target.value)}>
              <option value="">Choose…</option>
              {PROPERTY_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="sr-address">Address or directions <span className="font-normal text-[#5f6368]">(optional)</span></label>
            <input id="sr-address" className={input} maxLength={300} placeholder="Building, street, landmark" value={d.address} onChange={(e) => set('address', e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="sr-date">Preferred date <span className="font-normal text-[#5f6368]">(optional)</span></label>
            <input id="sr-date" type="date" min={today} className={input} value={d.preferredDate} onChange={(e) => set('preferredDate', e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="sr-timing">Timing <span className="font-normal text-[#5f6368]">(optional)</span></label>
            <input id="sr-timing" className={input} maxLength={200} placeholder="e.g. weekday mornings, flexible, before 30 Nov" value={d.timing} onChange={(e) => set('timing', e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="sr-scope">Size or scope <span className="font-normal text-[#5f6368]">(optional)</span></label>
            <input id="sr-scope" className={input} maxLength={200} placeholder="e.g. 3-bed, 180 m², or 12 units" value={d.scope} onChange={(e) => set('scope', e.target.value)} />
          </div>
          <div>
            <label className={label} htmlFor="sr-budget">Budget <span className="font-normal text-[#5f6368]">(optional)</span></label>
            <input id="sr-budget" className={input} maxLength={80} placeholder="e.g. KES 50,000" value={d.budget} onChange={(e) => set('budget', e.target.value)} />
          </div>
        </div>

        {/* Details */}
        <div data-field="details" className="mb-6">
          <label className={label} htmlFor="sr-details">Tell us about the job</label>
          <textarea id="sr-details" rows={5} maxLength={3000} className={cn(input, 'resize-y')} placeholder="What it’s for, what you’d like delivered, access arrangements, anything we should know." value={d.details} onChange={(e) => set('details', e.target.value)} />
          {errors.details && <p className="mt-2 text-[13px] text-[#c5221f]">{errors.details}</p>}
        </div>
        <div className="mb-8 sm:max-w-sm">
          <label className={label} htmlFor="sr-phone">Phone for this job <span className="font-normal text-[#5f6368]">(optional)</span></label>
          <input id="sr-phone" type="tel" className={input} maxLength={30} placeholder="+254…" value={d.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} />
        </div>

        {submitError && <p className="mb-4 rounded-xl bg-[#fce8e6] px-4 py-3 text-[14px] text-[#c5221f]">{submitError}</p>}
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-7 py-3.5 text-[15px] font-semibold text-white shadow-sm transition hover:bg-[#1765cc] disabled:opacity-60"
          >
            {sending && <Loader2 size={17} className="animate-spin" />}
            {sending ? 'Sending…' : 'Request a quote'}
          </button>
          <p className="text-[13px] text-[#5f6368]">You’ll get your quote within an hour, by email and in your account.</p>
        </div>
      </form>

      {/* Sign-in gate: the draft is already saved, so nothing typed is lost. */}
      {gate && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="sr-gate-title" onClick={() => setGate(false)}>
          <div className="w-full max-w-[420px] rounded-[28px] bg-white p-7 font-google shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-1 flex items-start justify-between gap-4">
              <h3 id="sr-gate-title" className="text-[22px] font-semibold tracking-tight text-[#202124]">Sign in to send your request</h3>
              <button type="button" aria-label="Close" onClick={() => setGate(false)} className="rounded-full p-1 text-[#5f6368] hover:bg-[#f1f3f4]"><X size={20} /></button>
            </div>
            <p className="mb-6 text-[15px] text-[#5f6368]">Your request is saved. Sign in and it will be waiting for you to send.</p>
            <p className="mb-3 text-[14px] font-medium text-[#202124]">Do you have an e-resi account?</p>
            <Link
              href={`/login?redirect=${encodeURIComponent(RETURN_PATH)}`}
              className="mb-3 flex w-full items-center justify-center rounded-xl bg-[#1a73e8] px-5 py-3 text-[15px] font-semibold text-white hover:bg-[#1765cc]"
            >
              Yes, sign in
            </Link>
            <GoogleButton role="INVESTOR" label="Continue with Google" next={RETURN_PATH} />
            <p className="mt-5 text-center text-[14px] text-[#5f6368]">
              No account?{' '}
              <Link href={`/register?redirect=${encodeURIComponent(RETURN_PATH)}`} className="font-medium text-[#1a73e8] hover:underline">Create one</Link>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
