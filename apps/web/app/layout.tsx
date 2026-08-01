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

export const metadata: Metadata = {
  title: {
    default: 'e-resi — Immersive Real Estate',
    template: '%s | e-resi',
  },
  description:
    'Experience properties like never before. Cinematic tours, interactive 3D walkthroughs, and virtual reality — before you ever set foot inside.',
  keywords: ['real estate', 'virtual reality', 'property tours', '3D walkthrough', 'immersive', 'PropTech'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'e-resi',
  },
  twitter: {
    card: 'summary_large_image',
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
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
