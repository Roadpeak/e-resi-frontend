'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BadgeCheck, Building2, Check, Clock3, Globe2, Loader2, Mail, Phone, ShieldAlert, ShieldCheck, Pencil,
} from 'lucide-react';
import { apiClient, ApiError } from '../../../../lib/api/client';
import { uploadFile } from '../../../../lib/api/media';
import { useAuthStore } from '../../../../lib/stores/auth.store';
import { Input } from '../../../../components/ui/Input';
import { cn } from '../../../../lib/utils';

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
  kybStatus: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  onboardingSubmittedAt?: string | null;
  createdAt: string;
}

const KYB_BADGES: Record<DeveloperProfile['kybStatus'], { label: string; className: string; icon: React.ReactNode }> = {
  NOT_SUBMITTED: { label: 'Verification not submitted', className: 'bg-[#f1f3f4] text-[#5f6368]', icon: <ShieldAlert size={13} /> },
  PENDING: { label: 'Verification pending', className: 'bg-[#fef7e0] text-[#b06000]', icon: <Clock3 size={13} /> },
  APPROVED: { label: 'Verified developer', className: 'bg-[#e6f4ea] text-[#188038]', icon: <ShieldCheck size={13} /> },
  REJECTED: { label: 'Verification rejected', className: 'bg-[#fce8e6] text-[#c5221f]', icon: <ShieldAlert size={13} /> },
};

export default function CompanyProfilePage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['developer-profile'],
    queryFn: () => apiClient.get<DeveloperProfile>('/users/developers/me'),
  });

  const [form, setForm] = useState({ companyName: '', description: '', establishedYear: '', website: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError('');
    setLogoUploading(true);
    try {
      const uploaded = await uploadFile(file, 'logos');
      await apiClient.patch('/users/developers/me', { logoUrl: uploaded.url });
      await queryClient.invalidateQueries({ queryKey: ['developer-profile'] });
    } catch (err) {
      setLogoError(err instanceof ApiError ? err.message : 'Failed to upload logo. Please try again.');
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  }

  useEffect(() => {
    if (profile) {
      setForm({
        companyName: profile.companyName ?? '',
        description: profile.description ?? '',
        establishedYear: profile.establishedYear ? String(profile.establishedYear) : '',
        website: profile.website ?? '',
        phone: profile.phone ?? '',
        email: profile.email ?? '',
      });
    }
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaved(false);
    setSaving(true);
    try {
      const year = Number.parseInt(form.establishedYear, 10);
      await apiClient.patch('/users/developers/me', {
        companyName: form.companyName.trim() || undefined,
        description: form.description.trim() || undefined,
        establishedYear: Number.isFinite(year) && year >= 1900 ? year : undefined,
        website: form.website.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ['developer-profile'] });
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#80868b]" />
      </div>
    );
  }

  const kyb = KYB_BADGES[profile?.kybStatus ?? 'NOT_SUBMITTED'];

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header card */}
      <div className="rounded-3xl border border-[#dadce0] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={logoUploading}
              aria-label="Change company logo"
              title="Change company logo"
              className="group relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#e8f0fe] text-[#1a73e8] cursor-pointer disabled:cursor-wait"
            >
              {profile?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.logoUrl} alt={profile.companyName} className="h-full w-full object-contain" />
              ) : (
                <Building2 size={24} />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                {logoUploading ? <Loader2 size={16} className="animate-spin text-white" /> : <Pencil size={14} className="text-white" />}
              </div>
            </button>
            <div>
              <h2 className="text-[26px] sm:text-[28px] font-normal text-[#202124]">{profile?.companyName}</h2>
              <p className="text-base text-[#5f6368]">
                {user?.firstName} {user?.lastName} · member since{' '}
                {profile ? new Date(profile.createdAt).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' }) : '—'}
              </p>
              {logoError && <p className="mt-1 text-[13px] text-[#c5221f]">{logoError}</p>}
            </div>
          </div>
          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium', kyb.className)}>
            {kyb.icon} {kyb.label}
          </span>
        </div>

        {profile?.kybStatus === 'NOT_SUBMITTED' && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-transparent bg-[#e8f0fe] p-4">
            <BadgeCheck size={16} className="mt-0.5 shrink-0 text-[#1a73e8]" />
            <p className="text-[15px] leading-relaxed text-[#3c4043]">
              Complete your developer onboarding to submit verification documents — verified developers
              get a badge on every listing.{' '}
              <Link href="/onboarding" className="text-[15px] font-medium text-[#1a73e8] hover:text-[#1765cc]">
                Continue onboarding →
              </Link>
            </p>
          </div>
        )}
      </div>

      {/* Editable company details */}
      <form onSubmit={handleSave} className="rounded-3xl border border-[#dadce0] bg-white p-6 space-y-4">
        <div>
          <h3 className="text-[18px] font-normal text-[#202124]">Company details</h3>
          <p className="mt-0.5 text-sm text-[#5f6368]">Shown on your public developer profile and every listing.</p>
        </div>

        <Input
          label="Company name"
          value={form.companyName}
          onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
          leftIcon={<Building2 size={14} />}
          className="border-[#dadce0] text-[15px] placeholder-[#80868b] focus:border-[#1a73e8] focus:ring-[#1a73e8]/20"
          required
        />

        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-[#5f6368]">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={4}
            maxLength={1000}
            placeholder="Your company story, track record, and what sets your developments apart…"
            className="w-full rounded-xl border border-[#dadce0] bg-white px-4 py-2.5 text-[15px] text-[#202124] placeholder-[#80868b] transition-colors focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Year established"
            type="number"
            min={1900}
            max={2100}
            value={form.establishedYear}
            onChange={(e) => setForm((f) => ({ ...f, establishedYear: e.target.value }))}
            className="border-[#dadce0] text-[15px] placeholder-[#80868b] focus:border-[#1a73e8] focus:ring-[#1a73e8]/20"
          />
          <Input
            label="Website"
            type="url"
            placeholder="https://"
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            leftIcon={<Globe2 size={14} />}
            className="border-[#dadce0] text-[15px] placeholder-[#80868b] focus:border-[#1a73e8] focus:ring-[#1a73e8]/20"
          />
          {/* Public contact. Deliberately separate from the account email
              below, which is the login this account is secured with and is
              never published. */}
          <Input
            label="Public phone"
            type="tel"
            placeholder="+254712345678"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            leftIcon={<Phone size={14} />}
            className="border-[#dadce0] text-[15px] placeholder-[#80868b] focus:border-[#1a73e8] focus:ring-[#1a73e8]/20"
          />
          <Input
            label="Public sales email"
            type="email"
            placeholder="sales@yourcompany.co.ke"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            leftIcon={<Mail size={14} />}
            className="border-[#dadce0] text-[15px] placeholder-[#80868b] focus:border-[#1a73e8] focus:ring-[#1a73e8]/20"
          />
        </div>

        {error && (
          <p className="rounded-2xl border border-transparent bg-[#fce8e6] px-4 py-3 text-[13px] text-[#c5221f]">{error}</p>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-[#f1f3f4] pt-4">
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#188038]">
              <Check size={14} /> Saved
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[15px] font-medium text-white hover:bg-[#1765cc] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Save changes
          </button>
        </div>
      </form>

      {/* Read-only facts */}
      <div className="rounded-3xl border border-[#dadce0] bg-white p-6">
        <h3 className="mb-4 text-[18px] font-normal text-[#202124]">Account</h3>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-[13px] text-[#80868b]">Completed projects</dt>
            <dd className="mt-0.5 text-[15px] font-medium text-[#202124]">{profile?.completedProjects ?? 0}</dd>
          </div>
          <div>
            <dt className="text-[13px] text-[#80868b]">Onboarding</dt>
            <dd className="mt-0.5 text-[15px] font-medium text-[#202124]">
              {profile?.onboardingSubmittedAt
                ? `Submitted ${new Date(profile.onboardingSubmittedAt).toLocaleDateString('en-KE')}`
                : 'Not submitted'}
            </dd>
          </div>
          <div>
            <dt className="text-[13px] text-[#80868b]">Account email</dt>
            <dd className="mt-0.5 text-[15px] font-medium text-[#202124] break-words">{user?.email}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
