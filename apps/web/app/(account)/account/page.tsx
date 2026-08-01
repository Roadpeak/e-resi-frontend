'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQueryClient } from '@tanstack/react-query';
import { MaterialIcon } from '../../../components/dashboard/MaterialIcon';
import { useAuthStore } from '../../../lib/stores/auth.store';
import { authApi } from '../../../lib/api/auth';
import { uploadAvatar } from '../../../lib/api/media';
import { ApiError } from '../../../lib/api/client';
import { useMyBookings, useMyInquiries, useSavedProperties } from '../../../lib/api/queries';
import { cn } from '../../../lib/utils';

const inputCls =
  'w-full rounded-xl border border-[#dadce0] bg-white px-4 py-2.5 text-[15px] text-[#202124] placeholder-[#80868b] transition-colors focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20 disabled:bg-[#f8f9fa] disabled:text-[#5f6368]';
const labelCls = 'mb-1.5 block text-[13px] font-medium text-[#5f6368]';

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
        <MaterialIcon name="progress_activity" size={30} className="animate-spin text-[#80868b]" />
        <p className="mt-3 text-[15px] text-[#5f6368]">Loading your profile…</p>
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
    // The API validates phone as +?digits — catch it here rather than round-tripping.
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
    { label: 'Saved', value: savedData?.length ?? 0, icon: 'favorite', href: '/account/saved', tone: 'text-[#d93025]' },
    { label: 'Viewings', value: bookingsData?.total ?? 0, icon: 'event', href: '/account/viewings', tone: 'text-[#1a73e8]' },
    { label: 'Inquiries', value: inquiriesData?.total ?? 0, icon: 'chat_bubble', href: '/account/inquiries', tone: 'text-[#188038]' },
    { label: 'Reservations', value: 0, icon: 'vpn_key', href: '/account/reservations', tone: 'text-[#b06000]' },
  ];

  return (
    <div className="space-y-6">
      {toast && (
        <div className="flex items-center gap-2 rounded-xl bg-[#e6f4ea] px-4 py-3 text-[14px] text-[#188038]">
          <MaterialIcon name="check_circle" size={18} fill /> {toast}
        </div>
      )}

      {/* ── Identity banner ── */}
      <section className="overflow-hidden rounded-3xl border border-[#dadce0] bg-white">
        <div className="h-24 bg-gradient-to-r from-[#1a73e8] via-[#4285f4] to-[#8ab4f8]" />
        <div className="px-6 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-wrap items-end gap-5">
            {/* Avatar with upload */}
            <div className="relative">
              <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#1a73e8] text-[28px] font-medium text-white shadow-sm">
                {user.avatarUrl ? (
                  <Image src={user.avatarUrl} alt="" fill className="object-cover" sizes="96px" />
                ) : (
                  initials
                )}
              </div>
              <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={onAvatar} />
              <button
                onClick={() => avatarInput.current?.click()}
                disabled={uploading}
                aria-label="Change profile photo"
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border border-[#dadce0] bg-white text-[#5f6368] shadow-sm transition-colors hover:bg-[#f1f3f4] hover:text-[#202124] cursor-pointer disabled:opacity-60"
              >
                <MaterialIcon name={uploading ? 'progress_activity' : 'photo_camera'} size={16} className={uploading ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="min-w-0 flex-1 pb-1">
              <h1 className="truncate text-[26px] font-normal text-[#202124]">
                {user.firstName} {user.lastName}
              </h1>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-[#5f6368]">
                <span>{user.email}</span>
                {user.emailVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#e6f4ea] px-2 py-0.5 text-[12px] font-medium text-[#188038]">
                    <MaterialIcon name="verified" size={13} fill /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#fef7e0] px-2 py-0.5 text-[12px] font-medium text-[#b06000]">
                    <MaterialIcon name="error" size={13} /> Unverified
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 pb-1">
              <span className="rounded-full bg-[#f1f3f4] px-3 py-1.5 text-[13px] font-medium text-[#5f6368]">
                {roleLabel}
              </span>
              {!editing && (
                <button
                  onClick={startEditing}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc] cursor-pointer"
                >
                  <MaterialIcon name="edit" size={16} /> Edit profile
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {error && (
        <p className="rounded-xl bg-[#fce8e6] px-4 py-3 text-[14px] text-[#c5221f]">{error}</p>
      )}

      {/* ── Activity ── */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group rounded-3xl border border-[#dadce0] bg-white p-5 transition-shadow hover:shadow-md"
          >
            <MaterialIcon name={s.icon} size={22} className={s.tone} fill />
            <p className="mt-3 text-[32px] font-normal leading-none text-[#202124]">{s.value}</p>
            <p className="mt-1.5 flex items-center gap-1 text-[14px] text-[#5f6368]">
              {s.label}
              <MaterialIcon
                name="arrow_forward"
                size={15}
                className="opacity-0 transition-opacity group-hover:opacity-100"
              />
            </p>
          </Link>
        ))}
      </section>

      {/* ── Personal information ── */}
      <section className="rounded-3xl border border-[#dadce0] bg-white p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-normal text-[#202124]">Personal information</h2>
            <p className="text-[14px] text-[#5f6368]">Your details across e-resi.</p>
          </div>
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
            <p className="mt-1.5 text-[12px] text-[#80868b]">Email can&apos;t be changed here.</p>
          </div>
        </div>

        {editing && (
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-[#1a73e8] px-6 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc] cursor-pointer disabled:opacity-60"
            >
              {saving && <MaterialIcon name="progress_activity" size={16} className="animate-spin" />}
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button
              onClick={() => { setEditing(false); setError(''); }}
              disabled={saving}
              className="rounded-full px-6 py-2.5 text-[14px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f1f3f4] cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </section>

      {/* ── Shortcuts ── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { title: 'Browse properties', body: 'Explore developments for sale.', href: '/properties', icon: 'apartment' },
          { title: 'Find a rental', body: 'Units available to rent now.', href: '/rent', icon: 'key' },
          { title: 'Your messages', body: 'Chats with developers.', href: '/account/messages', icon: 'forum' },
        ].map((c) => (
          <Link
            key={c.title}
            href={c.href}
            className="group rounded-3xl border border-[#dadce0] bg-white p-5 transition-shadow hover:shadow-md"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f0fe] text-[#1a73e8]">
              <MaterialIcon name={c.icon} size={20} />
            </span>
            <p className="mt-3 text-[16px] font-medium text-[#202124]">{c.title}</p>
            <p className="mt-0.5 text-[14px] text-[#5f6368]">{c.body}</p>
          </Link>
        ))}
      </section>

      {/* ── Account management ── */}
      <section className="rounded-3xl border border-[#dadce0] bg-white p-6 sm:p-8">
        <h2 className="text-[18px] font-normal text-[#202124]">Account management</h2>
        <p className="mt-1 text-[14px] text-[#5f6368]">
          Deleting your account removes your saved properties, viewings and inquiries. This can&apos;t be undone.
        </p>
        <a
          href="mailto:support@e-resi.com?subject=Delete%20my%20account"
          className={cn(
            'mt-5 inline-flex items-center gap-2 rounded-full border border-[#dadce0] px-5 py-2.5',
            'text-[14px] font-medium text-[#d93025] transition-colors hover:bg-[#fce8e6]',
          )}
        >
          <MaterialIcon name="delete" size={16} /> Request account deletion
        </a>
      </section>
    </div>
  );
}
