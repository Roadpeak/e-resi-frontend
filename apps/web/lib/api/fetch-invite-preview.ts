const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export interface InvitePreview {
  kind: 'AGENT' | 'DEVELOPER';
  name: string;
  contactName?: string | null;
  logoUrl?: string | null;
  agentKind?: string | null;
}

/** Server-side fetch for link previews. Uses the non-counting endpoint, so crawlers never inflate opens. */
export async function fetchInvitePreview(code: string): Promise<InvitePreview | null> {
  try {
    const res = await fetch(`${API}/invites/${encodeURIComponent(code)}/preview`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return (await res.json()) as InvitePreview;
  } catch {
    return null;
  }
}

export function inviteHeadline(p: InvitePreview) {
  return `Exclusive invite for ${p.name} to e-resi`;
}

export function inviteBlurb(p: InvitePreview) {
  return p.kind === 'DEVELOPER'
    ? `${p.name} is invited to sell its developments off-plan on e-resi, with cinematic, 3D and VR tours. No commissions. 100% free to start.`
    : `${p.name} is invited to grow sales and lettings on e-resi, with a free branded website, listings, leads and tours. No commissions. 100% free to start.`;
}
