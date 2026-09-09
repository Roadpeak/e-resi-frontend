'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity, Loader2, Mail, Plus, ShieldOff, UserRound,
} from 'lucide-react';
import {
  staffApi, type StaffMember, type StaffStatus,
} from '../../../../lib/api/staff';
import { cn } from '../../../../lib/utils';

const STATUS_STYLES: Record<StaffStatus, string> = {
  ACTIVE: 'bg-[#e6f4ea] text-[#188038]',
  INVITED: 'bg-[#fef7e0] text-[#b06000]',
  REVOKED: 'bg-[#fce8e6] text-[#c5221f]',
};

const PAGE_LABELS: Record<string, string> = {
  properties: 'Properties', units: 'Units', reservations: 'Reservations',
  rentals: 'Rentals', messages: 'Messages', partners: 'Agent Partners',
  deals: 'Agent Deals', mandates: 'Mandates', inquiries: 'Inquiries',
  bookings: 'Bookings', performance: 'Performance', analytics: 'Analytics',
  documents: 'Documents', billing: 'Billing', profile: 'Company Profile',
  team: 'Team',
};

/**
 * The developer's team: who can operate the dashboard, which pages they can
 * open, how to bring someone new in — and what each person has actually
 * been doing, with a transparent productivity read.
 */
export default function TeamPage() {
  const qc = useQueryClient();
  const { data: staff, isLoading } = useQuery({ queryKey: ['staff'], queryFn: staffApi.list });
  const { data: pageData } = useQuery({ queryKey: ['staff', 'pages'], queryFn: staffApi.pages });
  const allPages = pageData?.pages ?? Object.keys(PAGE_LABELS);

  const [inviting, setInviting] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  const refresh = () => qc.invalidateQueries({ queryKey: ['staff'] });

  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[26px] font-normal text-[#202124] sm:text-[28px]">Team</h2>
          <p className="mt-0.5 text-base text-[#5f6368]">
            Invite staff to operate this dashboard — they see only the pages you tick.
          </p>
        </div>
        <button
          onClick={() => setInviting((v) => !v)}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#1a73e8] px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc]"
        >
          <Plus size={15} /> Invite staff
        </button>
      </div>

      {notice && (
        <p className="rounded-2xl bg-[#e6f4ea] px-4 py-3 text-[14px] text-[#188038]">{notice}</p>
      )}

      {inviting && (
        <InviteForm
          allPages={allPages}
          onDone={(email) => {
            setInviting(false);
            setNotice(`Invitation sent to ${email} — they set their password from the email link.`);
            refresh();
          }}
          onCancel={() => setInviting(false)}
        />
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={22} className="animate-spin text-[#1a73e8]" />
        </div>
      ) : (staff ?? []).length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#dadce0] bg-white px-6 py-16 text-center">
          <UserRound size={28} className="mx-auto mb-3 text-[#dadce0]" />
          <p className="text-[15px] font-medium text-[#202124]">No team members yet</p>
          <p className="mt-1 text-[13px] text-[#5f6368]">
            Invite your first staff member — sales, lettings, marketing — with exactly
            the access they need.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-[#dadce0] bg-white">
          <ul className="divide-y divide-[#f1f3f4]">
            {(staff ?? []).map((m) => (
              <StaffRow
                key={m.id}
                member={m}
                allPages={allPages}
                expanded={selected === m.id}
                onToggle={() => setSelected(selected === m.id ? null : m.id)}
                onChanged={refresh}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PageChecks({
  allPages, value, onChange,
}: {
  allPages: string[]; value: string[]; onChange: (pages: string[]) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
      {allPages.map((p) => (
        <label key={p} className="flex cursor-pointer items-center gap-2 text-[14px] text-[#202124]">
          <input
            type="checkbox"
            checked={value.includes(p)}
            onChange={(e) =>
              onChange(e.target.checked ? [...value, p] : value.filter((v) => v !== p))}
            className="accent-[#1a73e8]"
          />
          {PAGE_LABELS[p] ?? p}
        </label>
      ))}
    </div>
  );
}

function InviteForm({
  allPages, onDone, onCancel,
}: {
  allPages: string[]; onDone: (email: string) => void; onCancel: () => void;
}) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [pages, setPages] = useState<string[]>([]);
  const [error, setError] = useState('');

  const invite = useMutation({
    mutationFn: () => staffApi.invite({ email: email.trim(), name: name.trim() || undefined, pages }),
    onSuccess: () => onDone(email.trim()),
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="rounded-3xl border border-[#dadce0] bg-white p-6">
      <h3 className="text-[17px] font-medium text-[#202124]">Invite a staff member</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[13px] font-medium text-[#5f6368]">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="staff@company.com"
            className="w-full rounded-xl border border-[#dadce0] px-3.5 py-2.5 text-[14px] outline-none focus:border-[#1a73e8]"
          />
        </div>
        <div>
          <label className="mb-1 block text-[13px] font-medium text-[#5f6368]">Name (optional)</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Grace Wanjiru"
            className="w-full rounded-xl border border-[#dadce0] px-3.5 py-2.5 text-[14px] outline-none focus:border-[#1a73e8]"
          />
        </div>
      </div>

      <p className="mb-2 mt-5 text-[13px] font-medium text-[#5f6368]">Pages they can open</p>
      <PageChecks allPages={allPages} value={pages} onChange={setPages} />

      {error && <p className="mt-3 text-[13px] text-[#d93025]">{error}</p>}

      <div className="mt-5 flex items-center gap-2 border-t border-[#f1f3f4] pt-4">
        <button
          onClick={() => invite.mutate()}
          disabled={invite.isPending || !email.trim() || pages.length === 0}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#1a73e8] px-6 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#1765cc] disabled:opacity-60"
        >
          {invite.isPending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
          Send invitation
        </button>
        <button onClick={onCancel} className="cursor-pointer rounded-full px-5 py-2.5 text-[14px] font-medium text-[#5f6368] hover:bg-[#f1f3f4]">
          Cancel
        </button>
      </div>
    </div>
  );
}

function StaffRow({
  member, allPages, expanded, onToggle, onChanged,
}: {
  member: StaffMember;
  allPages: string[];
  expanded: boolean;
  onToggle: () => void;
  onChanged: () => void;
}) {
  const [pages, setPages] = useState(member.pages);
  const [error, setError] = useState('');

  const displayName = member.user
    ? `${member.user.firstName} ${member.user.lastName}`
    : member.name || member.email;

  const save = useMutation({
    mutationFn: () => staffApi.update(member.id, { pages }),
    onSuccess: onChanged,
    onError: (e: Error) => setError(e.message),
  });
  const revoke = useMutation({
    mutationFn: () => staffApi.revoke(member.id),
    onSuccess: onChanged,
    onError: (e: Error) => setError(e.message),
  });

  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ['staff', member.id, 'activity'],
    queryFn: () => staffApi.activity(member.id),
    enabled: expanded,
  });

  const dirty = JSON.stringify([...pages].sort()) !== JSON.stringify([...member.pages].sort());

  return (
    <li className="px-6 py-5">
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8f0fe] text-[15px] font-medium text-[#1a73e8]">
          {displayName.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15.5px] font-medium text-[#202124]">{displayName}</p>
          <p className="text-[13.5px] text-[#5f6368]">
            {member.email} · {member.pages.length} page{member.pages.length !== 1 ? 's' : ''}
          </p>
        </div>
        <span className={cn('rounded-full px-3 py-1 text-[13px] font-medium', STATUS_STYLES[member.status])}>
          {member.status === 'INVITED' ? 'Invite sent' : member.status === 'ACTIVE' ? 'Active' : 'Revoked'}
        </span>
        <button
          onClick={onToggle}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#dadce0] px-4 py-2 text-[13.5px] font-medium text-[#1a73e8] transition-colors hover:bg-[#f8fbff]"
        >
          <Activity size={14} /> {expanded ? 'Close' : 'Activity & access'}
        </button>
      </div>

      {expanded && (
        <div className="mt-5 space-y-5 border-t border-[#f1f3f4] pt-5">
          {/* ── Productivity ── */}
          {reportLoading ? (
            <div className="flex justify-center py-6"><Loader2 size={18} className="animate-spin text-[#80868b]" /></div>
          ) : report && (
            <div>
              <div className="flex flex-wrap items-center gap-6">
                {/* Rating dial, written as a number — transparent, not magic. */}
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'flex h-16 w-16 items-center justify-center rounded-full border-4 text-[20px] font-bold',
                    report.stats.rating >= 70 ? 'border-[#188038] text-[#188038]'
                      : report.stats.rating >= 40 ? 'border-[#b06000] text-[#b06000]'
                      : 'border-[#dadce0] text-[#5f6368]',
                  )}>
                    {report.stats.rating}
                  </span>
                  <div>
                    <p className="text-[14px] font-medium text-[#202124]">Productivity — last 30 days</p>
                    <p className="text-[13px] text-[#5f6368]">
                      {report.stats.totalOps30d} operation{report.stats.totalOps30d !== 1 ? 's' : ''} ·{' '}
                      {report.stats.activeDays30d} active day{report.stats.activeDays30d !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(report.stats.byArea).map(([area, count]) => (
                    <span key={area} className="rounded-full bg-[#f1f3f4] px-3 py-1 text-[12.5px] text-[#3c4043]">
                      {PAGE_LABELS[area] ?? area} · {count}
                    </span>
                  ))}
                </div>
              </div>

              {report.logs.length > 0 && (
                <div className="mt-4 max-h-56 overflow-y-auto rounded-2xl bg-[#f8f9fa] p-4">
                  <ul className="space-y-1.5">
                    {report.logs.map((l) => (
                      <li key={l.id} className="flex flex-wrap gap-x-3 text-[12.5px] text-[#5f6368]">
                        <span className="w-32 shrink-0 text-[#80868b]">
                          {new Date(l.createdAt).toLocaleString('en-KE', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                        <span className="w-14 shrink-0 font-semibold text-[#202124]">{l.method}</span>
                        <span className="min-w-0 break-all">{l.path}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ── Access ── */}
          {member.status !== 'REVOKED' && (
            <div>
              <p className="mb-2 text-[13px] font-medium text-[#5f6368]">Page access</p>
              <PageChecks allPages={allPages} value={pages} onChange={setPages} />
              {error && <p className="mt-2 text-[13px] text-[#d93025]">{error}</p>}
              <div className="mt-4 flex items-center gap-2">
                {dirty && (
                  <button
                    onClick={() => save.mutate()}
                    disabled={save.isPending || pages.length === 0}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[#1a73e8] px-5 py-2 text-[13.5px] font-medium text-white hover:bg-[#1765cc] disabled:opacity-60"
                  >
                    {save.isPending && <Loader2 size={13} className="animate-spin" />} Save access
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm(`Revoke ${displayName}'s access? They will be signed out immediately.`)) {
                      revoke.mutate();
                    }
                  }}
                  disabled={revoke.isPending}
                  className="ml-auto inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-medium text-[#d93025] hover:underline disabled:opacity-50"
                >
                  <ShieldOff size={13} /> Revoke access
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
