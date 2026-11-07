'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { staffApi, type StaffMember } from '../../lib/api/staff';

/**
 * The team, as overlapping round avatars in the top bar: the developer
 * account first (the company logo, or its initials), then everyone invited
 * to the dashboard. Links to the Team page.
 *
 * Staff can't list their colleagues (the endpoint is owner-only), so a
 * staff member sees just the company they work for.
 */

const TONES = ['#1a73e8', '#188038', '#e37400', '#a142f4', '#d93025', '#007b83', '#5f6368'];

function tone(seed: string) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
}

function initialsOf(text: string) {
  return text.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
}

function memberName(m: StaffMember) {
  const full = m.user ? `${m.user.firstName} ${m.user.lastName}`.trim() : '';
  return full || m.name?.trim() || m.email;
}

const MAX = 4;

export function TeamAvatars({
  companyName, logoUrl, isStaff,
}: { companyName?: string; logoUrl?: string | null; isStaff?: boolean }) {
  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: staffApi.list,
    enabled: !isStaff,
    retry: false,
    staleTime: 60_000,
  });

  const members = staff.filter((m) => m.status !== 'REVOKED');
  const shown = members.slice(0, MAX);
  const extra = members.length - shown.length;
  const company = companyName || 'Your company';
  const ring = 'ring-2 ring-white';

  return (
    <Link
      href={isStaff ? '/dashboard' : '/dashboard/team'}
      className="hidden shrink-0 items-center md:flex"
      aria-label={isStaff ? company : `Team: ${company} and ${members.length} member${members.length === 1 ? '' : 's'}`}
    >
      <span className="flex -space-x-2">
        <span
          title={`${company} · Account owner`}
          className={`relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white text-[11px] font-semibold text-white ${ring}`}
          style={logoUrl ? undefined : { background: '#202124' }}
        >
          {logoUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={logoUrl} alt="" className="h-full w-full object-contain p-0.5" />
            : initialsOf(company)}
        </span>
        {shown.map((m) => {
          const name = memberName(m);
          return (
            <span
              key={m.id}
              title={`${name}${m.status === 'INVITED' ? ' · Invited' : ''}`}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold text-white ${ring} ${m.status === 'INVITED' ? 'opacity-60' : ''}`}
              style={{ background: tone(m.email) }}
            >
              {initialsOf(name)}
            </span>
          );
        })}
        {extra > 0 && (
          <span title={`${extra} more`} className={`flex h-8 w-8 items-center justify-center rounded-full bg-[#e8eaed] text-[11px] font-semibold text-[#3c4043] ${ring}`}>
            +{extra}
          </span>
        )}
      </span>
    </Link>
  );
}
