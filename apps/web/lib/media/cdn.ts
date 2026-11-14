/**
 * Resized, compressed delivery for uploaded photos and logos.
 *
 * Uploads are stored as the user sent them, which for profile photos can
 * mean a multi-megabyte PNG shown at 80px. For Cloudinary images this asks
 * for the displayed size (at 2x for sharp phone screens) in the best format
 * and quality the browser accepts. Any other URL, or one that already
 * carries a transformation, is returned unchanged.
 *
 * `cover` crops to the box, centred on the subject (photos, avatars);
 * `fit` only scales down and never crops (logos).
 */
export function cdnImage(url: string | null | undefined, width: number, height = width, mode: 'cover' | 'fit' = 'cover'): string {
  if (!url) return '';
  const marker = '/image/upload/';
  const i = url.indexOf(marker);
  if (!url.includes('res.cloudinary.com') || i < 0) return url;
  const rest = url.slice(i + marker.length);
  // Already transformed (the first path part is not a version like v1794…): leave it.
  if (!/^v\d+\//.test(rest) && rest.includes('/') && /^[a-z]{1,3}_/.test(rest)) return url;
  const w = Math.round(width * 2);
  const h = Math.round(height * 2);
  const t = mode === 'cover' ? `f_auto,q_auto,c_fill,g_auto,w_${w},h_${h}` : `f_auto,q_auto,c_limit,w_${w},h_${h}`;
  return `${url.slice(0, i + marker.length)}${t}/${rest}`;
}
