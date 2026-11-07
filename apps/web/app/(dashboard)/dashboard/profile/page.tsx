'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BadgeCheck, Building2, Camera, Check, Clock3, ExternalLink, Globe2, Loader2, Mail, MapPin, Phone, ShieldAlert, ShieldCheck,
} from 'lucide-react';
import { apiClient, ApiError } from '../../../../lib/api/client';
import { uploadFile } from '../../../../lib/api/media';
import { useAuthStore } from '../../../../lib/stores/auth.store';
import { useMyProperties } from '../../../../lib/api/queries';
import { cn } from '../../../../lib/utils';

/**
 * Company profile: everything buyers see about the developer, grouped into
 * sections, with a live preview of the public card beside it. Save appears
 * only when something changed. Includes the public fields the developer
 * page shows but this form never collected: WhatsApp, office location and
 * social links, and the completed-projects figure.
 */

interface Socials { instagram?: string; facebook?: string; twitter?: string; linkedin?: string; tiktok?: string }

interface DeveloperProfile {
  id: string;
  companyName: string;
  logoUrl?: string | null;
  description?: string | null;
  establishedYear?: number | null;
  completedProjects: number;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  location?: string | null;
  socials?: Socials | null;
  kybStatus: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  onboardingSubmittedAt?: string | null;
  createdAt: string;
}

const KYB: Record<DeveloperProfile['kybStatus'], { label: string; cls: string; icon: React.ReactNode; note: string }> = {
  NOT_SUBMITTED: { label: 'Not verified', cls: 'bg-[#f1f3f4] text-[#5f6368]', icon: <ShieldAlert size={14} />, note: 'Submit your documents to get the verified badge on every listing.' },
  PENDING: { label: 'Verification in review', cls: 'bg-[#fef7e0] text-[#b06000]', icon: <Clock3 size={14} />, note: 'Our team is checking your documents. We’ll email you when it’s done.' },
  APPROVED: { label: 'Verified developer', cls: 'bg-[#e6f4ea] text-[#188038]', icon: <ShieldCheck size={14} />, note: 'Your listings carry the verified badge.' },
  REJECTED: { label: 'Action needed', cls: 'bg-[#fce8e6] text-[#c5221f]', icon: <ShieldAlert size={14} />, note: 'Your verification needs attention — update your documents.' },
};

const SOCIALS: { key: keyof Socials; label: string; placeholder: string }[] = [
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourcompany' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourcompany' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourcompany' },
  { key: 'twitter', label: 'X (Twitter)', placeholder: 'https://x.com/yourcompany' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@yourcompany' },
];

type Form = {
  companyName: string; description: string; establishedYear: string; completedProjects: string;
  website: string; phone: string; email: string; whatsapp: string; location: string; socials: Socials;
};

const empty: Form = {
  companyName: '', description: '', establishedYear: '', completedProjects: '',
  website: '', phone: '', email: '', whatsapp: '', location: '', socials: {},
};

const field = 'w-full rounded-xl border border-[#dadce0] bg-white px-3.5 py-2.5 text-[14.5px] text-[#202124] outline-none transition-colors placeholder:text-[#9aa0a6] focus:border-[#1a73e8]';
const label = 'mb-1.5 block text-[13px] font-medium text-[#5f6368]';
const card = 'rounded-3xl border border-[#dadce0] bg-white';

function fromProfile(p: DeveloperProfile): Form {
  return {
    companyName: p.companyName ?? '',
    description: p.description ?? '',
    establishedYear: p.establishedYear ? String(p.establishedYear) : '',
    completedProjects: p.completedProjects ? String(p.completedProjects) : '',
    website: p.website ?? '',
    phone: p.phone ?? '',
    email: p.email ?? '',
    whatsapp: p.whatsapp ?? '',
    location: p.location ?? '',
    socials: { ...(p.socials ?? {}) },
  };
}

export default function CompanyProfilePage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const logoRef = useRef<HTMLInputElement>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['developer-profile'],
    queryFn: () => apiClient.get<DeveloperProfile>('/users/developers/me'),
  });
  const { data: props } = useMyProperties({ limit: 50 });
  const liveCount = (props?.items ?? []).filter((p) => p.status === 'ACTIVE' || p.status === 'OFF_PLAN').length;

  const [form, setForm] = useState<Form>(empty);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (profile) setForm(fromProfile(profile)); }, [profile]);
  const baseline = useMemo(() => (profile ? fromProfile(profile) : empty), [profile]);
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => { setForm((f) => ({ ...f, [k]: v })); setSaved(false); };

  async function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError('');
    setLogoUploading(true);
    try {
      const up = await uploadFile(file, 'logos');
      await apiClient.patch('/users/developers/me', { logoUrl: up.url });
      await queryClient.invalidateQueries({ queryKey: ['developer-profile'] });
    } catch (err) {
      setLogoError(err instanceof ApiError ? err.message : 'Could not upload the logo. Try again.');
    } finally {
      setLogoUploading(false);
      if (logoRef.current) logoRef.current.value = '';
    }
  }

  async function save() {
    setError('');
    setSaving(true);
    try {
      const year = Number.parseInt(form.establishedYear, 10);
      const projects = Number.parseInt(form.completedProjects, 10);
      const socials = Object.fromEntries(Object.entries(form.socials).filter(([, v]) => v?.trim()).map(([k, v]) => [k, v!.trim()]));
      await apiClient.patch('/users/developers/me', {
        companyName: form.companyName.trim() || undefined,
        description: form.description.trim() || undefined,
        establishedYear: Number.isFinite(year) && year >= 1900 ? year : undefined,
        completedProjects: Number.isFinite(projects) && projects >= 0 ? projects : undefined,
        website: form.website.trim() || undefined,
        phone: form.phone.trim().replace(/\s+/g, '') || undefined,
        email: form.email.trim() || undefined,
        whatsapp: form.whatsapp.replace(/\D/g, '') || undefined,
        location: form.location.trim() || undefined,
        socials,
      });
      await queryClient.invalidateQueries({ queryKey: ['developer-profile'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || !profile) {
    return <div className="flex h-64 items-center justify-center"><Loader2 size={26} className="animate-spin text-[#80868b]" /></div>;
  }

  const kyb = KYB[profile.kybStatus];
  const since = new Date(profile.createdAt).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-normal text-[#202124]">Company profile</h1>
          <p className="text-[14px] text-[#5f6368]">What buyers see about you on your developer page and every listing.</p>
        </div>
        <Link href={`/developers/${profile.id}`} target="_blank"
          className="inline-flex items-center gap-1.5 rounded-full border border-[#dadce0] px-4 py-2 text-[14px] font-medium text-[#202124] transition-colors hover:bg-[#f1f3f4]">
          View public page <ExternalLink size={14} />
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* ── Form ── */}
        <form onSubmit={(e) => { e.preventDefault(); save(); }} className="min-w-0 space-y-6">
          <section className={cn(card, 'p-6')}>
            <h2 className="text-[16px] font-medium text-[#202124]">Brand</h2>
            <div className="mt-4 flex flex-wrap items-center gap-5">
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={onLogo} />
              <button type="button" onClick={() => logoRef.current?.click()} disabled={logoUploading} aria-label="Change company logo"
                className="group relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#dadce0] bg-[#f8f9fa] text-[#80868b]">
                {profile.logoUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={profile.logoUrl} alt={`${profile.companyName} logo`} className="h-full w-full object-contain p-1.5" />
                  : <Building2 size={28} />}
                <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                  {logoUploading ? <Loader2 size={18} className="animate-spin text-white" /> : <Camera size={18} className="text-white" />}
                </span>
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-[#202124]">Company logo</p>
                <p className="text-[13px] text-[#5f6368]">Square PNG or SVG works best. Click the logo to change it.</p>
                {logoError && <p className="mt-1 text-[13px] text-[#c5221f]">{logoError}</p>}
              </div>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <label className={label} htmlFor="cp-name">Company name</label>
                <input id="cp-name" className={field} value={form.companyName} onChange={(e) => set('companyName', e.target.value)} maxLength={100} required />
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <label className={label} htmlFor="cp-desc">About the company</label>
                  <span className="text-[12px] tabular-nums text-[#9aa0a6]">{form.description.length}/1000</span>
                </div>
                <textarea id="cp-desc" rows={5} maxLength={1000} className={cn(field, 'resize-y')} value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Your story, track record and what sets your developments apart. Bullet points work — start lines with • and use “Label: text”." />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="cp-year">Year established</label>
                  <input id="cp-year" type="number" min={1900} max={2100} className={field} value={form.establishedYear} onChange={(e) => set('establishedYear', e.target.value)} />
                </div>
                <div>
                  <label className={label} htmlFor="cp-projects">Projects completed</label>
                  <input id="cp-projects" type="number" min={0} className={field} value={form.completedProjects} onChange={(e) => set('completedProjects', e.target.value)} />
                </div>
              </div>
            </div>
          </section>

          <section className={cn(card, 'p-6')}>
            <h2 className="text-[16px] font-medium text-[#202124]">Public contact</h2>
            <p className="mt-0.5 text-[13px] text-[#5f6368]">Shown to buyers. Separate from your login email ({user?.email}), which is never published.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label} htmlFor="cp-phone">Sales phone</label>
                <input id="cp-phone" type="tel" className={field} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+254712345678" />
              </div>
              <div>
                <label className={label} htmlFor="cp-wa">WhatsApp</label>
                <input id="cp-wa" type="tel" className={field} value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="254712345678" />
              </div>
              <div>
                <label className={label} htmlFor="cp-email">Sales email</label>
                <input id="cp-email" type="email" className={field} value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="sales@yourcompany.co.ke" />
              </div>
              <div>
                <label className={label} htmlFor="cp-web">Website</label>
                <input id="cp-web" type="url" className={field} value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://" />
              </div>
              <div className="sm:col-span-2">
                <label className={label} htmlFor="cp-loc">Office location</label>
                <input id="cp-loc" className={field} value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Westlands, Nairobi" maxLength={120} />
              </div>
            </div>
          </section>

          <section className={cn(card, 'p-6')}>
            <h2 className="text-[16px] font-medium text-[#202124]">Social media</h2>
            <p className="mt-0.5 text-[13px] text-[#5f6368]">Links appear as icons on your public developer page.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {SOCIALS.map((s) => (
                <div key={s.key}>
                  <label className={label} htmlFor={`cp-${s.key}`}>{s.label}</label>
                  <input id={`cp-${s.key}`} type="url" className={field} value={form.socials[s.key] ?? ''} placeholder={s.placeholder}
                    onChange={(e) => set('socials', { ...form.socials, [s.key]: e.target.value })} />
                </div>
              ))}
            </div>
          </section>

          {error && <p className="rounded-2xl bg-[#fce8e6] px-4 py-3 text-[14px] text-[#c5221f]">{error}</p>}

          {/* Save bar: only while there are unsaved changes. */}
          {(dirty || saved) && (
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#dadce0] bg-white/95 px-4 py-3 backdrop-blur md:left-16">
              <div className="mx-auto flex max-w-[1280px] items-center justify-end gap-3">
                {saved && !dirty ? (
                  <span className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#188038]"><Check size={15} /> Saved</span>
                ) : (
                  <>
                    <span className="mr-auto text-[14px] text-[#5f6368]">You have unsaved changes</span>
                    <button type="button" onClick={() => setForm(baseline)} className="rounded-full px-4 py-2 text-[14px] font-medium text-[#3c4043] hover:bg-[#f1f3f4]">Discard</button>
                    <button type="submit" disabled={saving}
                      className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-5 py-2 text-[14px] font-medium text-white hover:bg-[#1765cc] disabled:opacity-50">
                      {saving && <Loader2 size={14} className="animate-spin" />} Save changes
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </form>

        {/* ── Side column ── */}
        <aside className="space-y-6">
          {/* Live preview of the public card. */}
          <div className={cn(card, 'overflow-hidden')}>
            <p className="border-b border-[#f1f3f4] px-5 py-3 text-[12px] font-medium uppercase tracking-[0.08em] text-[#80868b]">Public card preview</p>
            <div className="p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#dadce0] bg-white">
                  {profile.logoUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={profile.logoUrl} alt="" className="h-full w-full object-contain p-1" />
                    : <Building2 size={20} className="text-[#80868b]" />}
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-[16px] font-medium text-[#202124]">
                    {form.companyName || 'Your company'}
                    {profile.kybStatus === 'APPROVED' && <BadgeCheck size={16} className="shrink-0 text-[#1a73e8]" />}
                  </p>
                  {form.location && <p className="flex items-center gap-1 truncate text-[12.5px] text-[#5f6368]"><MapPin size={12} />{form.location}</p>}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  { v: form.establishedYear || '—', l: 'Established' },
                  { v: form.completedProjects || '0', l: 'Completed' },
                  { v: String(liveCount), l: 'Live now' },
                ].map((s) => (
                  <div key={s.l} className="rounded-xl bg-[#f8f9fa] px-2 py-2.5">
                    <p className="text-[17px] font-medium tabular-nums text-[#202124]">{s.v}</p>
                    <p className="text-[11px] text-[#80868b]">{s.l}</p>
                  </div>
                ))}
              </div>
              {form.description && <p className="mt-4 line-clamp-4 text-[13px] leading-relaxed text-[#5f6368]">{form.description}</p>}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {form.phone && <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f3f4] px-2.5 py-1 text-[12px] text-[#3c4043]"><Phone size={11} /> Call</span>}
                {form.whatsapp && <span className="rounded-full bg-[#e6f4ea] px-2.5 py-1 text-[12px] text-[#188038]">WhatsApp</span>}
                {form.email && <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f3f4] px-2.5 py-1 text-[12px] text-[#3c4043]"><Mail size={11} /> Email</span>}
                {form.website && <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f3f4] px-2.5 py-1 text-[12px] text-[#3c4043]"><Globe2 size={11} /> Website</span>}
                {!form.phone && !form.whatsapp && !form.email && (
                  <span className="text-[12px] text-[#b06000]">Add a phone, WhatsApp or email so buyers can reach you.</span>
                )}
              </div>
            </div>
          </div>

          <div className={cn(card, 'p-5')}>
            <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium', kyb.cls)}>{kyb.icon} {kyb.label}</span>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-[#5f6368]">{kyb.note}</p>
            {(profile.kybStatus === 'NOT_SUBMITTED' || profile.kybStatus === 'REJECTED') && (
              <Link href="/onboarding" className="mt-3 inline-flex text-[14px] font-medium text-[#1a73e8] hover:underline">
                {profile.kybStatus === 'REJECTED' ? 'Update documents →' : 'Start verification →'}
              </Link>
            )}
          </div>

          <div className={cn(card, 'p-5')}>
            <h3 className="text-[15px] font-medium text-[#202124]">Account</h3>
            <dl className="mt-3 space-y-2.5 text-[13.5px]">
              <div className="flex justify-between gap-3"><dt className="text-[#80868b]">Owner</dt><dd className="truncate text-[#202124]">{user?.firstName} {user?.lastName}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-[#80868b]">Login email</dt><dd className="truncate text-[#202124]">{user?.email}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-[#80868b]">Member since</dt><dd className="text-[#202124]">{since}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-[#80868b]">Onboarding</dt><dd className="text-[#202124]">{profile.onboardingSubmittedAt ? `Submitted ${new Date(profile.onboardingSubmittedAt).toLocaleDateString('en-KE')}` : 'Not submitted'}</dd></div>
            </dl>
            <Link href="/dashboard/my-profile" className="mt-3 inline-flex text-[13.5px] font-medium text-[#1a73e8] hover:underline">Your personal profile &amp; password →</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
