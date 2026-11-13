import { ImageResponse } from 'next/og';
import { fetchInvitePreview } from '../../../lib/api/fetch-invite-preview';

/**
 * The share card for a personal invite: the invitee's logo, their name and
 * "Exclusive invite", so the WhatsApp preview reads as theirs at a glance.
 */
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Exclusive invite to e-resi';

export default async function OpengraphImage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const p = await fetchInvitePreview(code);
  const name = p?.name ?? 'You';
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('');
  const sub = p?.kind === 'DEVELOPER'
    ? 'Sell your developments off-plan with cinematic, 3D & VR tours'
    : 'Grow your sales and lettings with a free branded website';

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: '#ffffff', fontFamily: 'sans-serif' }}>
        <div style={{ width: 24, height: '100%', display: 'flex', background: '#f9ab00' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 72px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, color: '#202124' }}>e-resi</div>
            <div style={{ display: 'flex', fontSize: 22, color: '#5f6368', borderLeft: '2px solid #dadce0', paddingLeft: 14 }}>Exclusive invite</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
            <div style={{ width: 220, height: 220, borderRadius: 32, border: '2px solid #e8eaed', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', overflow: 'hidden', flexShrink: 0 }}>
              {p?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
                <img src={p.logoUrl} width={180} height={180} style={{ objectFit: 'contain' }} />
              ) : (
                <div style={{ display: 'flex', fontSize: 88, fontWeight: 700, color: '#1a73e8' }}>{initials || 'E'}</div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
              <div style={{ display: 'flex', fontSize: 30, color: '#5f6368' }}>Exclusive invite for</div>
              <div style={{ display: 'flex', fontSize: name.length > 28 ? 52 : 66, fontWeight: 700, color: '#202124', lineHeight: 1.1 }}>{name}</div>
              <div style={{ display: 'flex', fontSize: 30, color: '#5f6368' }}>to join e-resi</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', fontSize: 26, color: '#3c4043' }}>{sub}</div>
            <div style={{ display: 'flex', fontSize: 24, fontWeight: 600, color: '#202124', background: '#f9ab00', borderRadius: 999, padding: '10px 24px' }}>Free to start</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
