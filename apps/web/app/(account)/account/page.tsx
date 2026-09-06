'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useQueryClient } from '@tanstack/react-query';
import {
  Camera, CheckCircle2, AlertCircle, Pencil, Loader2, Heart, CalendarDays,
  MessageCircle, KeyRound, ArrowRight, Building2, Home, Search, Trash2,
} from 'lucide-react';
import { useAuthStore } from '../../../lib/stores/auth.store';
import { authApi } from '../../../lib/api/auth';
import { uploadAvatar } from '../../../lib/api/media';
import { ApiError } from '../../../lib/api/client';
import { useMyBookings, useMyInquiries, useSavedProperties } from '../../../lib/api/queries';
import { DirectoryCard, PillButton, PillLink } from '../../../components/directory/DirectoryPrimitives';
import { cn } from '../../../lib/utils';

const inputCls =
  'w-full rounded-2xl border border-black/10 bg-[#f7f7f8] px-4 py-2.5 text-[15px] text-[#111112] placeholder-[#9a9aa0] transition-colors focus:border-[#111112] focus:bg-white focus:outline-none disabled:text-[#6b6b70]';
const labelCls = 'mb-1.5 block text-[13px] font-medium text-[#6b6b70]';

/**
 * Restyled into the directory reference look (gray canvas, floating white
 * panels, black pill actions) while keeping every handler, validation rule
 * and API call from the previous version untouched — only presentation moved.
 */
export default function AccountOverview() {
  const user = useAuthStore((s) => s.user);
  const patchUser = useAuthStore((s) => s.patchUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();

  const { data: savedData } = useSavedProperties();
  const { data: bookingsData } = useMyBookings({ limit: 1 });
  const { data: inquiriesData } = useMyInquiries({ limit: 1 });

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const avatarInput = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });

  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <Loader2 size={28} className="animate-spin text-[#9a9aa0]" />
        <p className="mt-3 text-[15px] text-[#6b6b70]">Loading your profile…</p>
      </div>
    );
  }

  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
  const roleLabel = user.role === 'INVESTOR' ? 'Investor' : user.role === 'TENANT' ? 'Tenant' : 'Buyer';

  function startEditing() {
    setForm({ firstName: user!.firstName ?? '', lastName: user!.lastName ?? '', phone: user!.phone ?? '' });
    setError('');
    setEditing(true);
  }

  function flash(message: string) {
    setToast(message);
    setTimeout(() => setToast(''), 3200);
  }

  async function save() {
    setError('');
    if (form.firstName.trim().length < 2 || form.lastName.trim().length < 2) {
      setError('First and last name must each be at least 2 characters.');
      return;
    }
    if (form.phone && !/^\+?[0-9]{7,15}$/.test(form.phone.trim())) {
      setError('Enter a valid phone number, e.g. +254712345678.');
      return;
    }
    setSaving(true);
    try {
      const updated = await authApi.updateProfile({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      });
      patchUser(updated);
      setEditing(false);
      flash('Profile updated');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your changes.');
    } finally {
      setSaving(false);
    }
  }

  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const { url } = await uploadAvatar(file);
      const updated = await authApi.updateProfile({ avatarUrl: url });
      patchUser(updated);
      queryClient.invalidateQueries({ queryKey: ['me'] });
      flash('Photo updated');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not upload that photo.');
    } finally {
      setUploading(false);
      if (avatarInput.current) avatarInput.current.value = '';
    }
  }

  const stats = [
    { label: 'Saved', value: savedData?.length ?? 0, icon: Heart, href: '/account/saved', tone: 'text-[#c5395f]', bg: 'bg-[#fbe6ec]' },
    { label: 'Viewings', value: bookingsData?.total ?? 0, icon: CalendarDays, href: '/account/viewings', tone: 'text-[#1a5fa8]', bg: 'bg-[#e4eefb]' },
    { label: 'Inquiries', value: inquiriesData?.total ?? 0, icon: MessageCircle, href: '/account/inquiries', tone: 'text-[#1a7d43]', bg: 'bg-[#e3f5e9]' },
    { label: 'Reservations', value: 0, icon: KeyRound, href: '/account/reservations', tone: 'text-[#b56417]', bg: 'bg-[#fdecd9]' },
  ];

  // The shared layout wraps every /account page in a white <main>, which the
  // other account pages (saved, viewings…) keep. This negative-margin bleed
  // is the simplest way to paint the gray directory canvas behind only this
  // page's content, without touching that shared layout or resorting to
  // fixed positioning (whose offset would depend on AccountNav's height).
  return (
    <div className="-mx-4 -my-8 bg-[#f0f0f2] px-4 py-8 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10 2xl:-mx-16 2xl:px-16">
    <div className="space-y-5">
      {toast && (
        <div className="flex items-center gap-2 rounded-2xl bg-[#e3f5e9] px-4 py-3 text-[14px] text-[#1a7d43]">
          <CheckCircle2 size={18} /> {toast}
        </div>
      )}

      {/* ── Identity ── */}
      <DirectoryCard className="overflow-hidden border border-black/5">
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-5">
            <div className="relative">
              <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#111112] text-[26px] font-medium text-white">
                {user.avatarUrl ? (
                  <Image src={user.avatarUrl} alt="" fill className="object-cover" sizes="80px" />
                ) : (
                  initials
                )}
              </div>
              <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={onAvatar} />
              <button
                onClick={() => avatarInput.current?.click()}
                disabled={uploading}
                aria-label="Change profile photo"
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-[#6b6b70] shadow-sm transition-colors hover:bg-[#f5f5f6] hover:text-[#111112] cursor-pointer disabled:opacity-60"
              >
                {uploading ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
              </button>
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[24px] font-semibold text-[#111112]">
                {user.firstName} {user.lastName}
              </h1>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-[#6b6b70]">
                <span>{user.email}</span>
                {user.emailVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#e3f5e9] px-2 py-0.5 text-[12px] font-medium text-[#1a7d43]">
                    <CheckCircle2 size={12} /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#fdecd9] px-2 py-0.5 text-[12px] font-medium text-[#b56417]">
                    <AlertCircle size={12} /> Unverified
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#f1f1f3] px-3 py-1.5 text-[13px] font-medium text-[#5c5c63]">
                {roleLabel}
              </span>
              {!editing && (
                <button
                  onClick={startEditing}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 py-2.5 text-[14px] font-medium text-[#111112] transition-colors hover:bg-[#f5f5f6] cursor-pointer"
                >
                  <Pencil size={14} /> Edit profile
                </button>
              )}
              <PillLink href="/properties">
                <Search size={14} /> Find properties
              </PillLink>
            </div>
          </div>
        </div>
      </DirectoryCard>

      {error && (
        <p className="rounded-2xl bg-[#fbe4e4] px-4 py-3 text-[14px] text-[#b0282e]">{error}</p>
      )}

      {/* ── Activity ── */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <DirectoryCard key={s.label} href={s.href} className="group border border-black/5 p-5">
            <span className={cn('flex h-9 w-9 items-center justify-center rounded-full', s.bg)}>
              <s.icon size={17} className={s.tone} />
            </span>
            <p className="mt-3 text-[30px] font-semibold leading-none text-[#111112]">{s.value}</p>
            <p className="mt-1.5 flex items-center gap-1 text-[14px] text-[#6b6b70]">
              {s.label}
              <ArrowRight size={14} className="opacity-0 transition-opacity group-hover:opacity-100" />
            </p>
          </DirectoryCard>
        ))}
      </section>

      {/* ── Personal information ── */}
      <DirectoryCard className="border border-black/5 p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-[17px] font-semibold text-[#111112]">Personal information</h2>
          <p className="text-[14px] text-[#6b6b70]">Your details across e-resi.</p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="firstName">First name</label>
            <input
              id="firstName"
              className={inputCls}
              disabled={!editing || saving}
              value={editing ? form.firstName : user.firstName ?? ''}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="lastName">Last name</label>
            <input
              id="lastName"
              className={inputCls}
              disabled={!editing || saving}
              value={editing ? form.lastName : user.lastName ?? ''}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="phone">Phone number</label>
            <input
              id="phone"
              className={inputCls}
              placeholder="+254712345678"
              disabled={!editing || saving}
              value={editing ? form.phone : user.phone ?? ''}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="email">Email address</label>
            <input id="email" className={inputCls} value={user.email} disabled readOnly />
            <p className="mt-1.5 text-[12px] text-[#9a9aa0]">Email can&apos;t be changed here.</p>
          </div>
        </div>

        {editing && (
          <div className="mt-6 flex flex-wrap gap-3">
            <PillButton onClick={save} disabled={saving}>
              {saving && <Loader2 size={15} className="animate-spin" />}
              {saving ? 'Saving…' : 'Save changes'}
            </PillButton>
            <button
              onClick={() => { setEditing(false); setError(''); }}
              disabled={saving}
              className="rounded-full px-6 py-2.5 text-[14px] font-medium text-[#111112] transition-colors hover:bg-[#f1f1f3] cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </DirectoryCard>

      {/* ── Shortcuts ── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { title: 'Browse properties', body: 'Explore developments for sale.', href: '/properties', icon: Building2 },
          { title: 'Find a rental', body: 'Units available to rent now.', href: '/rent', icon: Home },
          { title: 'Your messages', body: 'Chats with developers.', href: '/account/messages', icon: MessageCircle },
        ].map((c) => (
          <DirectoryCard key={c.title} href={c.href} className="group border border-black/5 p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e4eefb] text-[#1a5fa8]">
              <c.icon size={18} />
            </span>
            <p className="mt-3 text-[15px] font-medium text-[#111112]">{c.title}</p>
            <p className="mt-0.5 text-[13px] text-[#6b6b70]">{c.body}</p>
          </DirectoryCard>
        ))}
      </section>

      {/* ── Account management ── */}
      <DirectoryCard className="border border-black/5 p-6 sm:p-8">
        <h2 className="text-[17px] font-semibold text-[#111112]">Account management</h2>
        <p className="mt-1 text-[14px] text-[#6b6b70]">
          Deleting your account removes your saved properties, viewings and inquiries. This can&apos;t be undone.
        </p>
        <a
          href="mailto:support@e-resi.com?subject=Delete%20my%20account"
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-black/10 px-5 py-2.5 text-[14px] font-medium text-[#b0282e] transition-colors hover:bg-[#fbe4e4]"
        >
          <Trash2 size={15} /> Request account deletion
        </a>
      </DirectoryCard>
    </div>
    </div>
  );
}
