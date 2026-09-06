'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { clientRoomsApi } from '../../../../lib/api/client-rooms';

/**
 * A client's room — the buyer's side of the link.
 *
 * Designed for exactly one reader: someone a specific agent sent here,
 * probably from WhatsApp, possibly from another continent. So the agent is
 * the header, not a footnote — their face, their WhatsApp, their note — and
 * each property links into the full immersive listing carrying the agent's
 * ?ref so everything the buyer does downstream stays credited.
 *
 * Every property click is reported back, anonymously. That count is the
 * agent's read on which development to lead the next call with.
 */

function money(amount: number | null, currency: string): string {
  if (amount == null) return '';
  return `${currency} ${Math.round(amount).toLocaleString()}`;
}

export default function ClientRoomPage() {
  const { token } = useParams<{ token: string }>();
  const { data: room, isLoading, isError } = useQuery({
    queryKey: ['public-room', token],
    queryFn: () => clientRoomsApi.publicGet(token),
    retry: false,
  });

  // The room page itself must not capture a referral cookie for some other
  // agent — this visit belongs to the room's agent, set on each card link.
  useEffect(() => { /* presence for symmetry; capture happens on property pages */ }, []);

  if (isLoading) {
    return <main className="flex min-h-screen items-center justify-center bg-[#fbfaf9] text-[14px] text-[#5f6368]">Opening your room…</main>;
  }
  if (isError || !room) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-2 bg-[#fbfaf9] px-6 text-center">
        <p className="text-[20px] text-[#202124]">This room is no longer available</p>
        <p className="max-w-sm text-[14px] text-[#5f6368]">
          The link may have been switched off. Ask your agent for a fresh one.
        </p>
      </main>
    );
  }

  const a = room.agent;
  const avatar = a.photoUrl ?? a.logoUrl;

  return (
    <main className="min-h-screen bg-[#fbfaf9]">
      <div className="mx-auto max-w-3xl px-5 py-10">
        {/* ── The agent, as the header ── */}
        <header className="flex items-center gap-4">
          {avatar ? (
            <Image src={avatar} alt={a.displayName} width={64} height={64}
              className="h-16 w-16 rounded-full border border-[#dadce0] object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f0fe] text-[22px] font-medium text-[#1967d2]">
              {a.displayName.slice(0, 1)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] uppercase tracking-wide text-[#5f6368]">Curated for you by</p>
            <h1 className="truncate text-[22px] font-medium text-[#202124]">{a.displayName}</h1>
            {a.ratingCount > 0 && (
              <p className="text-[13px] text-[#5f6368]">★ {a.ratingAverage.toFixed(1)} · {a.ratingCount} review{a.ratingCount === 1 ? '' : 's'}</p>
            )}
          </div>
          {a.whatsapp && (
            <a href={`https://wa.me/${a.whatsapp}`} target="_blank" rel="noopener noreferrer"
              className="rounded-full bg-[#25D366] px-4 py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-90">
              WhatsApp
            </a>
          )}
        </header>

        {/* ── Their note ── */}
        <section className="mt-6 rounded-3xl border border-[#dadce0] bg-white p-5">
          <h2 className="text-[18px] font-medium text-[#202124]">
            {room.clientName ? `${room.clientName}, ` : ''}{room.title}
          </h2>
          {room.note && <p className="mt-1.5 text-[14.5px] leading-relaxed text-[#5f6368]">{room.note}</p>}
        </section>

        {/* ── The shortlist ── */}
        <section className="mt-6 space-y-4">
          {room.items.map((item, i) => {
            const p = item.property;
            return (
              <Link
                key={item.id}
                href={`/${p.slug}?ref=${a.id}`}
                onClick={() => { clientRoomsApi.publicTrack(token, p.id).catch(() => undefined); }}
                className="block overflow-hidden rounded-3xl border border-[#dadce0] bg-white transition-shadow hover:shadow-lg"
              >
                {p.heroImageUrl && (
                  <div className="relative h-56 w-full">
                    <Image src={p.heroImageUrl} alt={p.name} fill className="object-cover" />
                    <span className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-[14px] font-medium text-white backdrop-blur">
                      {i + 1}
                    </span>
                  </div>
                )}
                <div className="p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-[18px] font-medium text-[#202124]">{p.name}</h3>
                    {p.priceFrom != null && (
                      <span className="text-[15px] font-medium text-[#202124]">
                        from {money(p.priceFrom, p.currency)}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[13.5px] text-[#5f6368]">
                    {[p.neighborhood, p.city].filter(Boolean).join(', ')}
                  </p>
                  {p.tagline && <p className="mt-2 text-[14px] text-[#5f6368]">{p.tagline}</p>}
                  <span className="mt-3 inline-block text-[14px] font-medium text-[#1a73e8]">
                    Explore the full tour →
                  </span>
                </div>
              </Link>
            );
          })}
        </section>

        <footer className="mt-10 text-center text-[12.5px] text-[#80868b]">
          Every property here is a verified listing on e-resi — walk it in 3D
          before you decide anything.
        </footer>
      </div>
    </main>
  );
}
