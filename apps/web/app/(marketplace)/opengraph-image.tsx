import { ImageResponse } from 'next/og';
import { OG_SIZE, OG_TYPE } from '../../lib/seo/og-card';

/**
 * The homepage share card, and the default for any page without its own:
 * the hero film's first frame under the homepage's own gradient and line.
 */
export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const alt = 'E-resi — Immersive Property in Kenya';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://e-resi.com';

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: '#0b0c0e', fontFamily: 'sans-serif' }}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src={`${SITE}/videos/hero1-poster.jpg`} width={1200} height={630} style={{ position: 'absolute', top: 0, left: 0, objectFit: 'cover' }} />
        {/* The renderer only draws gradients from backgroundImage; a flat tint underneath keeps the text readable on any frame. */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: 1200, height: 630, display: 'flex', backgroundColor: 'rgba(11,12,14,0.45)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, width: 1200, height: 630, display: 'flex', backgroundImage: 'linear-gradient(90deg, rgba(11,12,14,0.95) 0%, rgba(11,12,14,0.7) 50%, rgba(11,12,14,0.15) 100%)' }} />
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 84px 76px', width: '100%' }}>
          <div style={{ display: 'flex', width: 56, height: 2, background: '#c9a46a', marginBottom: 30 }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', fontSize: 82, color: '#f4f1ea', lineHeight: 1.02, letterSpacing: -2, maxWidth: 900 }}>
            <span style={{ marginRight: 22 }}>Experience</span>
            <span style={{ marginRight: 22, color: '#c9a46a' }}>Living</span>
            <span>Before You Arrive</span>
          </div>
          <div style={{ display: 'flex', fontSize: 28, color: '#cfc9bf', marginTop: 24 }}>Off-plan, for sale and to rent in Kenya — toured in cinematic, 3D and VR.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 40 }}>
            <div style={{ display: 'flex', fontSize: 30, color: '#f4f1ea' }}>e-resi</div>
            <div style={{ display: 'flex', width: 28, height: 1, background: '#c9a46a' }} />
            <div style={{ display: 'flex', fontSize: 20, color: '#a29d94', letterSpacing: 2 }}>E-RESI.COM</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
