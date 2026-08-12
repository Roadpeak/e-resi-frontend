import type { Metadata, Viewport } from 'next';
import {
  Geist,
  Geist_Mono,
  Cormorant_Garamond,
  Roboto,
  Plus_Jakarta_Sans,
  Playfair_Display,
  Inter,
  Archivo,
} from 'next/font/google';
import './global.css';
import { Providers } from './providers';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
});

// Google's UI font — used by the dashboard's `font-google` stack
const roboto = Roboto({
  subsets: ['latin'],
  variable: '--font-roboto',
  weight: ['400', '500', '700'],
  display: 'swap',
});

// ── Mini-site brand fonts ──
// The customise editor offers these as curated pairings. They must be loaded
// here or the CSS variables resolve to nothing and every "choice" silently
// renders as the system default — which is what was happening.
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
});

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
    "E-resi is Kenya's immersive property platform for developers. We produce cinematic, 3D "
    + 'and VR tours of new developments and give developers a branded mini-site plus one '
    + 'dashboard for units, leads, viewings and reservations — so buyers, investors and '
    + 'tenants can tour a home before it is built.',
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
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/properties?query={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
};

export const viewport: Viewport = {
  themeColor: '#080c14',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${cormorant.variable} ${roboto.variable} ${jakarta.variable} ${playfair.variable} ${inter.variable} ${archivo.variable}`} suppressHydrationWarning>
      <head>
        {/* Google Sans for the dashboard — falls back to Roboto when unavailable */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css?family=Google+Sans:400,500,700&display=swap"
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
