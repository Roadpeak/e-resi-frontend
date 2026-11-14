import { ImageResponse } from 'next/og';

/**
 * e-resi share cards, in the homepage's language: ink ground, warm accent,
 * restrained type. One generator for every page type, so a link to any part
 * of e-resi previews as the same brand.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_TYPE = 'image/png';

const INK = '#0b0c0e';
const WARM = '#c9a46a';
const CHALK = '#f4f1ea';
const STONE = '#a29d94';

/**
 * The card renderer cannot draw WebP or SVG, and uploads are often WebP. Ask
 * Cloudinary for a JPEG at the size needed; other hosts pass through only
 * when already JPEG or PNG.
 */
export function drawable(url: string | null | undefined, w: number, h: number, fit: 'fill' | 'pad' = 'fill'): string | null {
  if (!url) return null;
  if (url.includes('res.cloudinary.com') && url.includes('/image/upload/')) {
    const t = fit === 'pad' ? `f_png,c_pad,w_${w},h_${h},b_white` : `f_jpg,q_auto,c_fill,g_auto,w_${w},h_${h}`;
    return url.replace('/image/upload/', `/image/upload/${t}/`);
  }
  return /\.(jpe?g|png)(\?|$)/i.test(url) ? url : null;
}

function Wordmark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ display: 'flex', fontSize: 30, color: CHALK, letterSpacing: -0.5 }}>e-resi</div>
      <div style={{ display: 'flex', width: 28, height: 1, background: WARM }} />
      <div style={{ display: 'flex', fontSize: 20, color: STONE, letterSpacing: 2 }}>E-RESI.COM</div>
    </div>
  );
}

/** A typographic card: eyebrow, title, one line of context. */
export function textCard({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: INK, padding: '72px 84px', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          <div style={{ display: 'flex', width: 56, height: 2, background: WARM }} />
          <div style={{ display: 'flex', fontSize: 24, color: WARM, letterSpacing: 5 }}>{eyebrow.toUpperCase()}</div>
          <div style={{ display: 'flex', fontSize: title.length > 34 ? 64 : 76, color: CHALK, lineHeight: 1.05, letterSpacing: -1.5, maxWidth: 980 }}>{title}</div>
          {subtitle && <div style={{ display: 'flex', fontSize: 30, color: STONE, lineHeight: 1.35, maxWidth: 900 }}>{subtitle}</div>}
        </div>
        <Wordmark />
      </div>
    ),
    OG_SIZE,
  );
}

/**
 * A card about one place or business: its picture on the right (a photo
 * full-bleed, or a logo framed), the name and context on the left.
 */
export function entityCard({
  eyebrow, title, subtitle, image, imageKind = 'photo', initials,
}: { eyebrow: string; title: string; subtitle?: string; image?: string | null; imageKind?: 'photo' | 'logo'; initials?: string }) {
  const photo = imageKind === 'photo' ? drawable(image, 480, 630) : null;
  const logo = imageKind === 'logo' ? drawable(image, 300, 300, 'pad') : null;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: INK, fontFamily: 'sans-serif' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '72px 64px 72px 84px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', width: 56, height: 2, background: WARM }} />
            <div style={{ display: 'flex', fontSize: 22, color: WARM, letterSpacing: 5 }}>{eyebrow.toUpperCase()}</div>
            <div style={{ display: 'flex', fontSize: title.length > 26 ? 56 : 68, color: CHALK, lineHeight: 1.05, letterSpacing: -1.2 }}>{title}</div>
            {subtitle && <div style={{ display: 'flex', fontSize: 28, color: STONE, lineHeight: 1.35 }}>{subtitle}</div>}
          </div>
          <Wordmark />
        </div>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
          <img src={photo} width={480} height={630} style={{ objectFit: 'cover' }} />
        ) : (
          <div style={{ width: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: `1px solid #24262a` }}>
            <div style={{ width: 280, height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 28, background: '#ffffff', overflow: 'hidden' }}>
              {logo
                // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
                ? <img src={logo} width={240} height={240} style={{ objectFit: 'contain' }} />
                : <div style={{ display: 'flex', fontSize: 110, color: INK }}>{(initials || title.slice(0, 1)).toUpperCase()}</div>}
            </div>
          </div>
        )}
      </div>
    ),
    OG_SIZE,
  );
}

export const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('');
