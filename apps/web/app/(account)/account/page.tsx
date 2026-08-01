'use client';

import { User, Mail, Phone, ShieldCheck, ShieldAlert, CalendarDays, Heart, KeyRound, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import Link from 'next/link';
import { useAuthStore } from '../../../lib/stores/auth.store';
import { useMyBookings, useMyInquiries, useSavedProperties } from '../../../lib/api/queries';

export default function AccountProfile() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: savedData } = useSavedProperties();
  const { data: bookingsData } = useMyBookings({ limit: 1 });
  const { data: inquiriesData } = useMyInquiries({ limit: 1 });

  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 size={28} className="text-gray-400 animate-spin mb-4" />
        <p className="text-sm text-gray-500">Loading your profile…</p>
      </div>
    );
  }

  const stats = [
    { label: 'Saved', value: savedData?.length ?? 0, icon: Heart, href: '/account/saved' },
    { label: 'Viewings', value: bookingsData?.total ?? 0, icon: CalendarDays, href: '/account/viewings' },
    { label: 'Inquiries', value: inquiriesData?.total ?? 0, icon: MessageSquare, href: '/account/inquiries' },
    { label: 'Reservations', value: 0, icon: KeyRound, href: '/account/reservations' },
  ];

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="max-w-3xl space-y-8">
      {/* Profile card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-8">
        <div className="flex items-start gap-6 flex-wrap">
          {/* Avatar */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-2xl font-bold text-white">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt={user.firstName} className="h-full w-full rounded-2xl object-cover" />
            ) : initials}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-semibold text-gray-900">{user.firstName} {user.lastName}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Member since {new Date(user.createdAt).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Mail size={14} /> {user.email}
                {user.emailVerified
                  ? <ShieldCheck size={13} className="text-emerald-600" />
                  : <ShieldAlert size={13} className="text-amber-600" />}
              </div>
              {user.phone && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Phone size={14} /> {user.phone}
                </div>
              )}
            </div>
          </div>

          <Button variant="secondary" size="sm" icon={<User size={14} />}>Edit Profile</Button>
        </div>
      </div>

      {/* Email verification nudge */}
      {!user.emailVerified && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <ShieldAlert size={18} className="text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">Verify your email address</p>
              <p className="text-xs text-gray-500">Check your inbox for the verification link</p>
            </div>
          </div>
        </div>
      )}

      {/* Activity stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="flex flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white p-5 text-center hover:border-gray-300 hover:bg-gray-50 transition-all group"
          >
            <Icon size={20} className="text-brand-600 group-hover:scale-110 transition-transform" />
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </Link>
        ))}
      </div>

      {/* Profile form */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h3 className="mb-5 font-semibold text-gray-900">Personal Information</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { label: 'First Name', value: user.firstName },
            { label: 'Last Name', value: user.lastName },
            { label: 'Email Address', value: user.email },
            { label: 'Phone Number', value: user.phone ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</label>
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-600">
                {value}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex gap-3">
          <Button size="sm">Save Changes</Button>
          <Button variant="ghost" size="sm">Cancel</Button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h3 className="mb-1 font-semibold text-gray-900">Delete Account</h3>
        <p className="text-sm text-gray-500 mb-4">Permanently delete your account and all associated data. This cannot be undone.</p>
        <Button variant="danger" size="sm">Delete Account</Button>
      </div>
    </div>
  );
}
