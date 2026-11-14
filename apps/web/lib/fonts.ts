import localFont from 'next/font/local';

/**
 * Every typeface e-resi uses, served from the app itself (./fonts, Latin
 * subset, from Google Fonts' open-source releases).
 *
 * Bundled rather than fetched by next/font/google: that download ran on
 * every build, and whenever Google Fonts was unreachable the build failed.
 *
 * Only Geist (the default sans) and Inter (listings and the former Google
 * Sans text) are preloaded, because nearly every page paints with them. The
 * rest are template and display faces: their @font-face rules are declared
 * everywhere so the CSS variables keep working, but a browser downloads one
 * only when a page actually sets text in it.
 */

export const geist = localFont({
  src: '../fonts/geist.woff2', weight: '100 900', variable: '--font-geist', display: 'swap', preload: true, adjustFontFallback: 'Arial',
});
export const inter = localFont({
  src: '../fonts/inter.woff2', weight: '100 900', variable: '--font-inter', display: 'swap', preload: true, adjustFontFallback: 'Arial',
});

export const geistMono = localFont({
  src: '../fonts/geist-mono.woff2', weight: '100 900', variable: '--font-geist-mono', display: 'swap', preload: false, adjustFontFallback: false,
});
export const cormorant = localFont({
  src: [
    { path: '../fonts/cormorant-garamond-normal.woff2', weight: '300 700', style: 'normal' },
    { path: '../fonts/cormorant-garamond-italic.woff2', weight: '300 700', style: 'italic' },
  ],
  variable: '--font-cormorant', display: 'swap', preload: false, adjustFontFallback: 'Times New Roman',
});
export const roboto = localFont({
  src: '../fonts/roboto.woff2', weight: '400 700', variable: '--font-roboto', display: 'swap', preload: false, adjustFontFallback: 'Arial',
});
export const jakarta = localFont({
  src: '../fonts/plus-jakarta-sans.woff2', weight: '200 800', variable: '--font-jakarta', display: 'swap', preload: false, adjustFontFallback: 'Arial',
});
export const playfair = localFont({
  src: '../fonts/playfair-display.woff2', weight: '400 900', variable: '--font-playfair', display: 'swap', preload: false, adjustFontFallback: 'Times New Roman',
});
export const archivo = localFont({
  src: '../fonts/archivo.woff2', weight: '100 900', variable: '--font-archivo', display: 'swap', preload: false, adjustFontFallback: 'Arial',
});
export const marcellus = localFont({
  src: '../fonts/marcellus.woff2', weight: '400', variable: '--font-marcellus', display: 'swap', preload: false, adjustFontFallback: 'Times New Roman',
});
export const manrope = localFont({
  src: '../fonts/manrope.woff2', weight: '200 800', variable: '--font-manrope', display: 'swap', preload: false, adjustFontFallback: 'Arial',
});
export const unbounded = localFont({
  src: '../fonts/unbounded.woff2', weight: '200 900', variable: '--font-unbounded', display: 'swap', preload: false, adjustFontFallback: 'Arial',
});
export const interTight = localFont({
  src: '../fonts/inter-tight.woff2', weight: '400 600', variable: '--font-inter-tight', display: 'swap', preload: false, adjustFontFallback: 'Arial',
});

/** Variables the whole site can use (applied on <html>). */
export const ROOT_FONT_VARIABLES = [
  geist, geistMono, cormorant, roboto, jakarta, playfair, inter, archivo, marcellus, manrope, unbounded,
].map((f) => f.variable).join(' ');
