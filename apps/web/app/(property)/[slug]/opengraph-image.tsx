import { ImageResponse } from 'next/og';
import { fetchProperty } from '../../../lib/api/fetch-property';
import { resolveBranding, type BrandingSource } from '../../../lib/branding/theme';

/**
 * The share card.
 *
 * These links are shared on WhatsApp far more than they are found by search,
 * so this image is the actual first impression of a development — it matters
 * more than the page's SEO. Rendering it rather than reusing the raw hero
 * upload guarantees a correct 1200×630 and puts the name, location, price and
 * tour badges on the card, where a bare photo would say nothing.
 */
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Development preview';

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const property = await fetchProperty(slug);

  if (!property) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#202124',
            color: '#ffffff',
            fontSize: 56,
          }}
        >
          e-resi
        </div>
      ),
      size,
    );
  }

  const branding = resolveBranding(property as BrandingSource);
  const { theme } = branding;
  const city = property.address?.city;
  const neighborhood = property.address?.neighborhood;
  const location = [neighborhood, city].filter(Boolean).join(', ');

  const tours = [
    property.hasCinematicTour && 'Cinematic',
    property.has3DTour && '3D',
    property.hasVRTour && 'VR',
  ].filter(Boolean) as string[];

  const price = property.priceFrom
    ? `From ${property.currency ?? 'KES'} ${Number(property.priceFrom).toLocaleString()}`
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          position: 'relative',
          background: '#0b0b0c',
        }}
      >
        {property.heroImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- satori renders raw img
          <img
            src={property.heroImageUrl}
            alt=""
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}

        {/* Scrim so white text stays legible over any photograph.
            Two passes, because one was not enough: a vertical gradient alone
            cannot darken the lower LEFT, which is exactly where the text sits
            and where a tall render often puts its brightest facade. The
            horizontal pass guarantees a dark bed for the copy regardless of
            what the photograph does. */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.22) 40%, rgba(0,0,0,0.62) 70%, rgba(0,0,0,0.88) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background:
              'linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 38%, rgba(0,0,0,0.10) 68%, rgba(0,0,0,0) 100%)',
          }}
        />

        {/* Brand bar — the developer's colour, not ours. */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 12,
            background: theme.color,
          }}
        />

        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            padding: '0 64px 56px',
          }}
        >
          {tours.length > 0 && (
            <div style={{ display: 'flex', gap: 10 }}>
              {tours.map((t) => (
                <div
                  key={t}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: theme.color,
                    color: theme.onColor,
                    padding: '8px 18px',
                    borderRadius: 999,
                    fontSize: 24,
                    fontWeight: 600,
                  }}
                >
                  {t} tour
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              fontSize: 68,
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.05,
              letterSpacing: -1.5,
              textShadow: '0 2px 18px rgba(0,0,0,0.45)',
            }}
          >
            {property.name}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {location && (
              <div style={{ display: 'flex', fontSize: 30, color: 'rgba(255,255,255,0.92)' }}>
                {location}
              </div>
            )}
            {price && (
              <>
                <div style={{ display: 'flex', fontSize: 30, color: 'rgba(255,255,255,0.45)' }}>
                  ·
                </div>
                <div style={{ display: 'flex', fontSize: 30, color: 'rgba(255,255,255,0.92)' }}>
                  {price}
                </div>
              </>
            )}
          </div>

          {/* Attribution stays subordinate to the development, and disappears
              entirely on a white-labelled site. */}
          {!branding.whiteLabel && (
            <div
              style={{
                display: 'flex',
                fontSize: 22,
                color: 'rgba(255,255,255,0.78)',
                marginTop: 4,
              }}
            >
              {property.developer?.name
                ? `${property.developer.name} · Tours by e-resi`
                : 'Tours by e-resi'}
            </div>
          )}
        </div>
      </div>
    ),
    size,
  );
}
