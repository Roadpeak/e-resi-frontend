'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MaterialIcon } from '../../../../components/dashboard/MaterialIcon';
import { peopleApi, type AdminUser } from '../../../../lib/api/admin';
import { ApiError } from '../../../../lib/api/client';
import { cn } from '../../../../lib/utils';

const ROLES = ['BUYER', 'INVESTOR', 'TENANT', 'DEVELOPER', 'ADMIN'];

const ROLE_STYLES: Record<string, string> = {
  ADMIN: 'bg-[#fce8e6] text-[#c5221f]',
  DEVELOPER: 'bg-[#e8f0fe] text-[#1967d2]',
  INVESTOR: 'bg-[#e6f4ea] text-[#188038]',
  TENANT: 'bg-[#fef7e0] text-[#b06000]',
  BUYER: 'bg-[#f1f3f4] text-[#5f6368]',
};

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', q, role, status],
    queryFn: () => peopleApi.users({ q, role, status, limit: 50 }),
  });

  const flash = (m: string) => {
    setToast(m);
    setError('');
    setTimeout(() => setToast(''), 3000);
  };
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  const onError = (e: unknown) =>
    setError(e instanceof ApiError ? e.message : 'Action failed');

  const suspend = useMutation({
    mutationFn: ({ id, on, reason }: { id: string; on: boolean; reason?: string }) =>
      peopleApi.suspend(id, on, reason),
    onSuccess: (u) => {
      refresh();
      setSelected(u);
      flash(u.isActive ? 'User reinstated' : 'User suspended');
    },
    onError,
  });

  const setUserRole = useMutation({
    mutationFn: ({ id, r }: { id: string; r: string }) => peopleApi.setRole(id, r),
    onSuccess: (u) => {
      refresh();
      setSelected(u);
      flash(`Role changed to ${u.role}`);
    },
    onError,
  });

  const verify = useMutation({
    mutationFn: (id: string) => peopleApi.verify(id),
    onSuccess: (u) => {
      refresh();
      setSelected(u);
      flash('Email marked verified');
    },
    onError,
  });

  const users = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-normal text-[#202124]">Users</h1>
        <p className="text-[14px] text-[#5f6368]">
          {data?.meta.total ?? 0} accounts across the platform.
        </p>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-xl bg-[#e6f4ea] px-4 py-3 text-[14px] text-[#188038]">
          <MaterialIcon name="check_circle" size={18} fill /> {toast}
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-[#fce8e6] px-4 py-3 text-[14px] text-[#c5221f]">{error}</div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1">
          <MaterialIcon
            name="search"
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#80868b]"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or email…"
            className="h-10 w-full rounded-full border border-[#dadce0] bg-white pl-10 pr-4 text-[15px] text-[#202124] outline-none focus:border-[#1a73e8]"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="h-10 rounded-full border border-[#dadce0] bg-white px-4 text-[14px] text-[#202124] cursor-pointer"
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-full border border-[#dadce0] bg-white px-4 text-[14px] text-[#202124] cursor-pointer"
        >
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        {/* Table */}
        <div className="overflow-hidden rounded-3xl border border-[#dadce0] bg-white">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <MaterialIcon name="progress_activity" size={26} className="animate-spin text-[#80868b]" />
            </div>
          ) : users.length === 0 ? (
            <p className="px-6 py-16 text-center text-[15px] text-[#5f6368]">No users match.</p>
          ) : (
            <table className="w-full text-left">
              <thead className="border-b border-[#dadce0] bg-[#f8f9fa]">
                <tr className="text-[12px] uppercase tracking-wide text-[#5f6368]">
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3f4]">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setSelected(u)}
                    className={cn(
                      'cursor-pointer text-[14px] transition-colors hover:bg-[#f8f9fa]',
                      selected?.id === u.id && 'bg-[#e8f0fe]',
                    )}
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-[#202124]">
                        {`${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || '—'}
                      </p>
                      <p className="text-[12px] text-[#5f6368]">{u.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn('rounded-full px-2.5 py-1 text-[12px] font-medium', ROLE_STYLES[u.role])}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {!u.isActive ? (
                        <span className="text-[13px] font-medium text-[#c5221f]">Suspended</span>
                      ) : u.emailVerified ? (
                        <span className="text-[13px] text-[#188038]">Active</span>
                      ) : (
                        <span className="text-[13px] text-[#b06000]">Unverified</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail panel */}
        <aside className="rounded-3xl border border-[#dadce0] bg-white p-5">
          {!selected ? (
            <div className="py-16 text-center">
              <MaterialIcon name="person_search" size={26} className="text-[#80868b]" />
              <p className="mt-2 text-[14px] text-[#5f6368]">Select a user to manage them.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h2 className="text-[18px] font-normal text-[#202124]">
                  {`${selected.firstName ?? ''} ${selected.lastName ?? ''}`.trim() || selected.email}
                </h2>
                <p className="text-[13px] text-[#5f6368]">{selected.email}</p>
                {selected.developerProfile?.companyName && (
                  <p className="mt-1 text-[13px] text-[#5f6368]">
                    {selected.developerProfile.companyName}
                  </p>
                )}
              </div>

              <dl className="space-y-2 text-[13px]">
                <Row label="Joined" value={new Date(selected.createdAt).toLocaleDateString()} />
                <Row
                  label="Last login"
                  value={selected.lastLoginAt ? new Date(selected.lastLoginAt).toLocaleString() : 'Never'}
                />
                <Row label="Email verified" value={selected.emailVerified ? 'Yes' : 'No'} />
                {selected.suspendedReason && (
                  <Row label="Suspended for" value={selected.suspendedReason} />
                )}
              </dl>

              <div className="space-y-2">
                <label className="block text-[13px] font-medium text-[#5f6368]">Role</label>
                <select
                  value={selected.role}
                  onChange={(e) => setUserRole.mutate({ id: selected.id, r: e.target.value })}
                  className="w-full rounded-xl border border-[#dadce0] bg-white px-3.5 py-2 text-[14px] cursor-pointer"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-2">
                {!selected.emailVerified && (
                  <button
                    onClick={() => verify.mutate(selected.id)}
                    className="rounded-full border border-[#dadce0] px-4 py-2 text-[13px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fbff] cursor-pointer"
                  >
                    Mark verified
                  </button>
                )}
                {selected.isActive ? (
                  <button
                    onClick={() => {
                      const reason = window.prompt('Reason for suspension (shown in the audit log):') ?? undefined;
                      suspend.mutate({ id: selected.id, on: true, reason });
                    }}
                    className="rounded-full border border-[#dadce0] px-4 py-2 text-[13px] font-medium text-[#c5221f] transition-colors hover:bg-[#fce8e6] cursor-pointer"
                  >
                    Suspend
                  </button>
                ) : (
                  <button
                    onClick={() => suspend.mutate({ id: selected.id, on: false })}
                    className="rounded-full bg-[#188038] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#137333] cursor-pointer"
                  >
                    Reinstate
                  </button>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-[#5f6368]">{label}</dt>
      <dd className="text-right text-[#202124]">{value}</dd>
    </div>
  );
}
