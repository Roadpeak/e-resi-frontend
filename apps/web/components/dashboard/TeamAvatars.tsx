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
  companyName, logoUrl, isStaff, self,
}: {
  companyName?: string;
  logoUrl?: string | null;
  isStaff?: boolean;
  /** For a team member: themselves, shown after the company. */
  self?: { name: string; email: string; photo?: string | null };
}) {
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
  // A white gap and a grey outer frame, so each circle stands out from its
  // neighbours and from the bar in both light and dark mode.
  const ring = 'ring-2 ring-white shadow-[0_0_0_3.5px_#bdc1c6]';

  return (
    <Link
      href={isStaff ? '/dashboard' : '/dashboard/team'}
      className="hidden shrink-0 items-center md:flex"
      aria-label={isStaff ? company : `Team: ${company} and ${members.length} member${members.length === 1 ? '' : 's'}`}
    >
      <span className="flex -space-x-1.5 pl-1">
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
          const photo = m.user?.avatarUrl;
          return (
            <span
              key={m.id}
              title={`${name}${m.status === 'INVITED' ? ' · Invited' : ''}`}
              className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-[11px] font-semibold text-white ${ring} ${m.status === 'INVITED' ? 'opacity-60' : ''}`}
              style={photo ? undefined : { background: tone(m.email) }}
            >
              {photo
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={photo} alt="" className="h-full w-full object-cover" />
                : initialsOf(name)}
            </span>
          );
        })}
        {self && (
          <span
            title={`${self.name || self.email} · You`}
            className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-[11px] font-semibold text-white ${ring}`}
            style={self.photo ? undefined : { background: tone(self.email) }}
          >
            {self.photo
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={self.photo} alt="" className="h-full w-full object-cover" />
              : initialsOf(self.name || self.email)}
          </span>
        )}
        {extra > 0 && (
          <span title={`${extra} more`} className={`flex h-8 w-8 items-center justify-center rounded-full bg-[#e8eaed] text-[11px] font-semibold text-[#3c4043] ${ring}`}>
            +{extra}
          </span>
        )}
      </span>
    </Link>
  );
}
