'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BadgeCheck, Building2, Check, Clock3, Globe2, Loader2, ShieldAlert, ShieldCheck,
} from 'lucide-react';
import { apiClient, ApiError } from '../../../../lib/api/client';
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
  kybStatus: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  onboardingSubmittedAt?: string | null;
  createdAt: string;
}

const KYB_BADGES: Record<DeveloperProfile['kybStatus'], { label: string; className: string; icon: React.ReactNode }> = {
  NOT_SUBMITTED: { label: 'Verification not submitted', className: 'bg-gray-100 text-gray-600', icon: <ShieldAlert size={13} /> },
  PENDING: { label: 'Verification pending', className: 'bg-amber-50 text-amber-700 border border-amber-200', icon: <Clock3 size={13} /> },
  APPROVED: { label: 'Verified developer', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200', icon: <ShieldCheck size={13} /> },
  REJECTED: { label: 'Verification rejected', className: 'bg-red-50 text-red-700 border border-red-200', icon: <ShieldAlert size={13} /> },
};

export default function CompanyProfilePage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['developer-profile'],
    queryFn: () => apiClient.get<DeveloperProfile>('/users/developers/me'),
  });

  const [form, setForm] = useState({ companyName: '', description: '', establishedYear: '', website: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setForm({
        companyName: profile.companyName ?? '',
        description: profile.description ?? '',
        establishedYear: profile.establishedYear ? String(profile.establishedYear) : '',
        website: profile.website ?? '',
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
        <Loader2 size={28} className="animate-spin text-gray-400" />
      </div>
    );
  }

  const kyb = KYB_BADGES[profile?.kybStatus ?? 'NOT_SUBMITTED'];

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-brand-50 text-brand-600">
              {profile?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.logoUrl} alt={profile.companyName} className="h-full w-full object-contain" />
              ) : (
                <Building2 size={24} />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{profile?.companyName}</h2>
              <p className="text-sm text-gray-500">
                {user?.firstName} {user?.lastName} · member since{' '}
                {profile ? new Date(profile.createdAt).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' }) : '—'}
              </p>
            </div>
          </div>
          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium', kyb.className)}>
            {kyb.icon} {kyb.label}
          </span>
        </div>

        {profile?.kybStatus === 'NOT_SUBMITTED' && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50 p-4">
            <BadgeCheck size={16} className="mt-0.5 shrink-0 text-brand-600" />
            <p className="text-[13px] leading-relaxed text-gray-600">
              Complete your developer onboarding to submit verification documents — verified developers
              get a badge on every listing.{' '}
              <Link href="/onboarding" className="font-medium text-brand-600 hover:text-brand-700">
                Continue onboarding →
              </Link>
            </p>
          </div>
        )}
      </div>

      {/* Editable company details */}
      <form onSubmit={handleSave} className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Company details</h3>
          <p className="mt-0.5 text-xs text-gray-500">Shown on your public developer profile and every listing.</p>
        </div>

        <Input
          label="Company name"
          value={form.companyName}
          onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
          leftIcon={<Building2 size={14} />}
          required
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={4}
            maxLength={1000}
            placeholder="Your company story, track record, and what sets your developments apart…"
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-brand-500/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
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
          />
          <Input
            label="Website"
            type="url"
            placeholder="https://"
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            leftIcon={<Globe2 size={14} />}
          />
        </div>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600">
              <Check size={14} /> Saved
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-7 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Save changes
          </button>
        </div>
      </form>

      {/* Read-only facts */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">Account</h3>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-gray-400">Completed projects</dt>
            <dd className="mt-0.5 text-sm font-medium text-gray-900">{profile?.completedProjects ?? 0}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">Onboarding</dt>
            <dd className="mt-0.5 text-sm font-medium text-gray-900">
              {profile?.onboardingSubmittedAt
                ? `Submitted ${new Date(profile.onboardingSubmittedAt).toLocaleDateString('en-KE')}`
                : 'Not submitted'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">Account email</dt>
            <dd className="mt-0.5 text-sm font-medium text-gray-900 break-words">{user?.email}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
