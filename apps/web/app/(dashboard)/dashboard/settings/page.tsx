'use client';

import { useState } from 'react';
import { User, Loader2, Check } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { useAuthStore } from '../../../../lib/stores/auth.store';
import { authApi } from '../../../../lib/api/auth';

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-surface-800">
      <div className="border-b border-white/5 px-6 py-4">
        <h3 className="font-semibold text-white">{title}</h3>
        {description && <p className="text-xs text-white/40 mt-0.5">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3 sm:items-center">
      <label className="text-sm text-white/50">{label}</label>
      <div className="sm:col-span-2">{children}</div>
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-white/10 bg-surface-700 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/30 disabled:opacity-40"
    />
  );
}

export default function DashboardSettings() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      const updated = await authApi.updateProfile({ firstName, lastName, phone: phone || undefined });
      if (accessToken) setUser(updated, accessToken);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-xl font-semibold text-white">Settings</h2>
        <p className="text-sm text-white/40 mt-0.5">Manage your account preferences.</p>
      </div>

      {/* Profile */}
      <Section title="Profile" description="Update your personal information.">
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-white/5">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600/20 text-brand-300 text-lg font-semibold shrink-0">
              {(user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '')}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-white/40">{user?.email}</p>
              <span className="mt-1 inline-block rounded-full bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 text-[10px] font-medium text-brand-300 capitalize">
                {user?.role?.toLowerCase()}
              </span>
            </div>
          </div>

          <Field label="First name">
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" required />
          </Field>
          <Field label="Last name">
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" required />
          </Field>
          <Field label="Email">
            <Input value={user?.email ?? ''} disabled />
          </Field>
          <Field label="Phone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254 700 000 000" />
          </Field>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            {saved && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <Check size={12} /> Saved
              </span>
            )}
            <Button
              type="submit"
              disabled={saving}
              icon={saving ? <Loader2 size={14} className="animate-spin" /> : <User size={14} />}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Section>

      {/* Password */}
      <Section title="Password & Security" description="Use the forgot password flow to reset your password.">
        <p className="text-sm text-white/40">
          To change your password, use the{' '}
          <a href="/auth/forgot-password" className="text-brand-400 hover:text-brand-300 underline-offset-2 underline">
            forgot password
          </a>{' '}
          flow — a reset link will be sent to your email address.
        </p>
      </Section>

      {/* Notifications (static UI) */}
      <Section title="Notifications" description="Choose what updates you receive.">
        <div className="space-y-3">
          {[
            { label: 'New inquiries', description: 'Get notified when a buyer submits an inquiry on your property.', on: true },
            { label: 'Booking requests', description: 'Alerts for new tour or viewing bookings.', on: true },
            { label: 'Reservation updates', description: 'Status changes on unit reservations.', on: true },
            { label: 'Weekly analytics digest', description: 'A summary of your property performance each week.', on: false },
          ].map(({ label, description, on }) => (
            <div key={label} className="flex items-start justify-between gap-4 py-2 border-b border-white/5 last:border-0">
              <div>
                <p className="text-sm text-white">{label}</p>
                <p className="text-xs text-white/40 mt-0.5">{description}</p>
              </div>
              <div
                role="switch"
                aria-checked={on}
                className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors cursor-not-allowed ${on ? 'bg-brand-600' : 'bg-white/10'}`}
              >
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-white/25">Notification preferences coming soon.</p>
      </Section>

      {/* Danger zone */}
      <Section title="Account">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-white">Delete account</p>
            <p className="text-xs text-white/40 mt-0.5">Permanently remove your account and all associated data. This cannot be undone.</p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors"
          >
            Delete Account
          </button>
        </div>
      </Section>
    </div>
  );
}
