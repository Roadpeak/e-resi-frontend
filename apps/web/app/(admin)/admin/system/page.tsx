'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MaterialIcon } from '../../../../components/dashboard/MaterialIcon';
import { adminSystemApi } from '../../../../lib/api/admin';
import { ApiError } from '../../../../lib/api/client';
import { cn } from '../../../../lib/utils';

const cardCls = 'rounded-3xl border border-[#dadce0] bg-white p-5';
const inputCls =
  'w-full rounded-xl border border-[#dadce0] bg-white px-3.5 py-2 text-[15px] text-[#202124] focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20';

const SEGMENTS = [
  { value: '', label: 'Everyone' },
  { value: 'DEVELOPER', label: 'Developers' },
  { value: 'INVESTOR', label: 'Investors' },
  { value: 'TENANT', label: 'Tenants' },
  { value: 'BUYER', label: 'Buyers' },
];

export default function AdminSystem() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const [role, setRole] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const { data: health } = useQuery({
    queryKey: ['admin-health'],
    queryFn: adminSystemApi.health,
    refetchInterval: 60_000,
  });
  const { data: settings } = useQuery({
    queryKey: ['admin-system-settings'],
    queryFn: () => adminSystemApi.settings(),
  });
  const { data: delivered } = useQuery({
    queryKey: ['admin-delivered'],
    queryFn: adminSystemApi.notifications,
  });

  const flash = (m: string) => {
    setToast(m);
    setError('');
    setTimeout(() => setToast(''), 4000);
  };

  const broadcast = useMutation({
    mutationFn: () => adminSystemApi.broadcast({ role: role || undefined, title, body }),
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ['admin-delivered'] });
      setTitle('');
      setBody('');
      flash(`Sent to ${r.sent} ${r.sent === 1 ? 'person' : 'people'}`);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not send'),
  });

  const saveSetting = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      adminSystemApi.updateSetting(key, value),
    onSuccess: (s) => {
      queryClient.invalidateQueries({ queryKey: ['admin-system-settings'] });
      flash(`${s.label} updated`);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not save'),
  });

  const canSend = title.trim().length > 0 && body.trim().length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-normal text-[#202124]">System</h1>
        <p className="text-[14px] text-[#5f6368]">Platform health, settings and announcements.</p>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-xl bg-[#e6f4ea] px-4 py-3 text-[14px] text-[#188038]">
          <MaterialIcon name="check_circle" size={18} fill /> {toast}
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-[#fce8e6] px-4 py-3 text-[14px] text-[#c5221f]">{error}</div>
      )}

      {/* Health */}
      <section className={cardCls}>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-[18px] font-normal text-[#202124]">Health</h2>
          {health && (
            <p className="text-[13px] text-[#5f6368]">
              {health.environment} · up {Math.floor(health.uptimeSeconds / 60)}m
            </p>
          )}
        </div>
        <div className="space-y-2">
          {(health?.checks ?? []).map((c) => (
            <div
              key={c.name}
              className={cn(
                'flex items-start gap-3 rounded-2xl px-4 py-3',
                c.ok ? 'bg-[#f8f9fa]' : 'border border-[#f9ab00] bg-[#fffbf0]',
              )}
            >
              <MaterialIcon
                name={c.ok ? 'check_circle' : 'warning'}
                size={18}
                className={cn('mt-0.5', c.ok ? 'text-[#188038]' : 'text-[#b06000]')}
                fill
              />
              <div>
                <p className="text-[14px] font-medium text-[#202124]">{c.name}</p>
                <p className="text-[13px] text-[#5f6368]">{c.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Broadcast */}
        <section className={cardCls}>
          <h2 className="text-[18px] font-normal text-[#202124]">Send an announcement</h2>
          <p className="mb-4 text-[13px] text-[#5f6368]">
            Delivered in-app to every active account in the segment.
          </p>

          <label className="mb-1.5 block text-[13px] font-medium text-[#5f6368]">Audience</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={cn(inputCls, 'mb-3 cursor-pointer')}
          >
            {SEGMENTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <label className="mb-1.5 block text-[13px] font-medium text-[#5f6368]">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Scheduled maintenance"
            className={cn(inputCls, 'mb-3')}
          />

          <label className="mb-1.5 block text-[13px] font-medium text-[#5f6368]">Message</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="e-resi will be briefly unavailable on Sunday at 02:00 EAT."
            className={cn(inputCls, 'mb-4 resize-y')}
          />

          <button
            onClick={() => {
              const who = SEGMENTS.find((s) => s.value === role)?.label ?? 'Everyone';
              if (window.confirm(`Send "${title}" to ${who}? This cannot be recalled.`)) {
                broadcast.mutate();
              }
            }}
            disabled={!canSend || broadcast.isPending}
            className="rounded-full bg-[#1a73e8] px-6 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc] cursor-pointer disabled:opacity-40"
          >
            {broadcast.isPending ? 'Sending…' : 'Send announcement'}
          </button>
        </section>

        {/* Settings */}
        <section className={cardCls}>
          <h2 className="mb-4 text-[18px] font-normal text-[#202124]">Platform settings</h2>
          {!settings?.length ? (
            <p className="text-[14px] text-[#80868b]">
              No settings yet — seed them from the Pricing page.
            </p>
          ) : (
            <div className="space-y-3">
              {settings.map((s) => (
                <SettingRow
                  key={s.key}
                  setting={s}
                  onSave={(value) => saveSetting.mutate({ key: s.key, value })}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Delivery log */}
      <section className={cardCls}>
        <h2 className="mb-3 text-[18px] font-normal text-[#202124]">Recently delivered</h2>
        {!delivered?.length ? (
          <p className="py-6 text-center text-[14px] text-[#80868b]">No notifications sent yet.</p>
        ) : (
          <ul className="divide-y divide-[#f1f3f4]">
            {delivered.slice(0, 10).map((n) => (
              <li key={n.id} className="flex items-center justify-between gap-3 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate text-[14px] text-[#202124]">{n.title}</span>
                  <span className="block truncate text-[12px] text-[#80868b]">
                    {n.user?.email} · {n.user?.role?.toLowerCase()}
                  </span>
                </span>
                <span className="shrink-0 text-[12px] text-[#80868b]">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SettingRow({
  setting,
  onSave,
}: {
  setting: { key: string; value: string; label: string; group: string };
  onSave: (value: string) => void;
}) {
  const [value, setValue] = useState(setting.value);
  const dirty = value !== setting.value;

  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] text-[#202124]">{setting.label}</p>
        <p className="truncate text-[12px] text-[#80868b]">
          {setting.group} · {setting.key}
        </p>
      </div>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={cn(inputCls, 'w-28 text-right')}
        aria-label={setting.label}
      />
      <button
        onClick={() => onSave(value)}
        disabled={!dirty}
        className="rounded-full bg-[#1a73e8] px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#1765cc] cursor-pointer disabled:opacity-40"
      >
        Save
      </button>
    </div>
  );
}
