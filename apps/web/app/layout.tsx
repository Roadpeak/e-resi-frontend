import type { Metadata, Viewport } from 'next';
import { ROOT_FONT_VARIABLES } from '../lib/fonts';
import './global.css';
import { Providers } from './providers';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://e-resi.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    // Developer-first: the paying customer is the developer, and "sell off-plan"
    // is the outcome they search for. Buyers, tenants and agents still appear
    // in the description and on their own pages, but the headline is the pitch
    // to whoever signs the cheque.
    default: 'E-resi — Sell Property Off-Plan with 3D & VR Tours | Kenya',
    template: '%s | E-resi',
  },
  description:
    'Kenyan developers sell off-plan with E-resi. We produce your cinematic, 3D and VR tours '
    + 'and give you a branded page buyers can walk from anywhere.',
  keywords: [
    // Developer intent leads — these are the terms the paying side searches.
    'property developer marketing Kenya',
    'sell off-plan property Kenya',
    'off-plan property marketing',
    'property developer listing Kenya',
    'property developer listing',
    '3D walkthrough for developers',
    'VR property tour production Kenya',
    'cinematic property film Kenya',
    'digital twin real estate Kenya',
    'real estate marketing Nairobi',
    // The other sides of the marketplace, still covered.
    'property investment Kenya',
    'invest in Kenya properties',
    'buy property in Kenya',
    'apartments for rent Nairobi',
    'property agents Kenya',
    'Kenya real estate',
    'PropTech Kenya',
  ],
  applicationName: 'E-resi',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'E-resi',
    title: 'E-resi — Sell Your Development Off-Plan with Cinematic, 3D & VR Tours',
    description:
      'Kenyan developers: we produce your cinematic, 3D and VR tours and give you a branded '
      + 'mini-site to share with buyers, plus one dashboard for units, leads and reservations.',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'E-resi — Sell Your Development Off-Plan with Immersive Tours',
    description:
      'Production, a branded mini-site and one dashboard for Kenyan property developers. '
      + 'Buyers and tenants tour before they commit.',
  },
};

const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'E-resi',
  alternateName: 'e-resi',
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  description:
    "E-resi is Kenya's immersive property platform. Buyers, investors and tenants tour "
    + 'off-plan developments, homes for sale and rentals in cinematic, 3D and VR before they '
    + 'visit, and deal directly with verified developers and agents. Developers and agents '
    + 'get tour production, branded websites, property reels and one dashboard for listings, '
    + 'leads, viewings and reservations.',
  areaServed: { '@type': 'Country', name: 'Kenya' },
  // Naming the service explicitly gives Google something concrete to attach
  // to developer-intent queries, which a generic company description does not.
  makesOffer: {
    '@type': 'Offer',
    itemOffered: {
      '@type': 'Service',
      name: 'Property development marketing and immersive tour production',
      serviceType: 'Real estate marketing',
      description:
        'Photography, cinematic film, 3D walkthrough and VR tour production for property '
        + 'developers, with a branded development mini-site and a sales dashboard.',
      areaServed: { '@type': 'Country', name: 'Kenya' },
    },
  },
};

const WEBSITE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: 'E-resi',
  alternateName: 'e-resi',
  url: SITE_URL,
  publisher: { '@id': `${SITE_URL}/#organization` },
};

export const viewport: Viewport = {
  themeColor: '#080c14',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={ROOT_FONT_VARIABLES} suppressHydrationWarning>
      <head>
        {/* Stale-deploy recovery. A tab left open across a deploy can load a
            chunk from the new build into the old runtime ("module factory is
            not available", ChunkLoadError). deploymentId only covers
            navigations, so catch these at the window and reload once — the
            sessionStorage stamp stops a genuinely broken page from looping. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var R=/module factory is not available|ChunkLoadError|Loading chunk [\\w-]+ failed|Failed to fetch dynamically imported module|Importing a module script failed/i;function h(m){try{if(!R.test(m||''))return;var k='eresi-stale-reload',t=+sessionStorage.getItem(k)||0;if(Date.now()-t<30000)return;sessionStorage.setItem(k,String(Date.now()));location.reload();}catch(e){}}window.addEventListener('error',function(e){h((e&&e.message)||(e&&e.error&&e.error.message))},true);window.addEventListener('unhandledrejection',function(e){var r=e&&e.reason;h(r&&(r.message||String(r)))});})();`,
          }}
        />
        {/* Organization + WebSite structured data — the direct signal Google uses
            to show "E-resi" as the Site Name in search results instead of the
            raw domain. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSON_LD) }}
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
