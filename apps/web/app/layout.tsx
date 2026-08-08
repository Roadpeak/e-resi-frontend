import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Cormorant_Garamond, Roboto } from 'next/font/google';
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://e-resi.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'E-resi — Property Developer Listings & Property Investment in Kenya',
    template: '%s | E-resi',
  },
  description:
    "Invest in Kenya's properties digitally. Tour your apartment virtually in cinematic, 3D and VR modes, then buy Kenya's top properties — or list your development for sale and rent as a verified property developer.",
  keywords: [
    'property developer listing',
    'property developer listing Kenya',
    'property investment Kenya',
    'invest in Kenya properties',
    'buy property in Kenya',
    'Kenya real estate',
    'virtual property tour',
    'cinematic property tour',
    '3D property walkthrough',
    'VR property tour',
    'real estate Kenya',
    'PropTech Kenya',
  ],
  applicationName: 'E-resi',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'E-resi',
    title: 'E-resi — Property Developer Listings & Property Investment in Kenya',
    description:
      "Invest in Kenya's properties digitally. Tour apartments virtually in cinematic, 3D and VR modes, then buy Kenya's top properties.",
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'E-resi — Property Developer Listings & Property Investment in Kenya',
    description:
      "Invest in Kenya's properties digitally. Tour apartments virtually in cinematic, 3D and VR modes.",
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
    "E-resi is Kenya's immersive real estate platform for property developer listings and property investment — cinematic, 3D and VR property tours for buyers and investors.",
  areaServed: { '@type': 'Country', name: 'Kenya' },
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
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${cormorant.variable} ${roboto.variable}`} suppressHydrationWarning>
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
