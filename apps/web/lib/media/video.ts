/**
 * Video delivery for the tours.
 *
 * The cinematic tour is scroll-scrubbed: every scroll frame sets
 * `video.currentTime`, and the browser can only seek cleanly to a keyframe.
 * A normal export places keyframes seconds apart, so on a phone the picture
 * snaps between distant frames instead of moving — the judder that made the
 * tour feel broken on mobile.
 *
 * Cloudinary can re-encode on delivery, so this is a URL change rather than
 * a re-upload: existing tours are fixed the moment the page ships, and
 * nothing has to be reprocessed by hand.
 */

/** Cloudinary delivery URLs always carry this segment before the version. */
const UPLOAD_SEGMENT = '/upload/';

function isCloudinaryVideo(url: string): boolean {
  return url.includes('res.cloudinary.com') && url.includes('/video/upload/');
}

/**
 * Insert a transformation into a Cloudinary URL.
 *
 * Returns the URL untouched when it is not Cloudinary — local development
 * uses sample videos from other hosts, and a mangled URL there would break
 * the tour rather than degrade it.
 */
function withTransform(url: string, transform: string): string {
  if (!url || !isCloudinaryVideo(url)) return url;
  // Already transformed — do not stack a second set of parameters.
  const [base, rest] = url.split(UPLOAD_SEGMENT);
  if (!rest || rest.startsWith(transform)) return url;
  return `${base}${UPLOAD_SEGMENT}${transform}/${rest}`;
}

/**
 * `ki_2` is the whole point: a keyframe every 2 seconds instead of the
 * export default, which is what lets a scrubbed seek land near where the
 * scroll actually is.
 *
 * `q_auto:good` roughly halves the file — measured at 24.9MB → 12.1MB on a
 * real tour — which matters as much as the keyframes on Kenyan mobile data.
 * `vc_h264` and `f_mp4` keep it to the codec every phone decodes in
 * hardware; leaving the format to chance can hand an older Android something
 * it has to decode in software, which stutters however dense the keyframes.
 */
const SCRUB_DESKTOP = 'f_mp4,vc_h264,q_auto:good,ki_2';

/**
 * The phone variant additionally caps width. A 4K master decoded on a mid
 * range handset is slow to seek no matter how it is encoded, and 1280px is
 * more than a phone screen can show.
 */
const SCRUB_MOBILE = 'f_mp4,vc_h264,q_auto:eco,ki_2,w_1280,c_limit';

/**
 * For video that plays straight through — a looping hero, a preview card.
 * No dense keyframes: nothing seeks these, so paying for extra keyframes
 * would only make the file bigger. Compression is the whole benefit here.
 */
const PLAYBACK = 'f_auto,vc_auto,q_auto:eco,w_1280,c_limit';

/** A still frame for `poster`, so the first paint is not a black box. */
const POSTER = 'f_jpg,q_auto:good,so_0';

/**
 * Video URL tuned for scroll-scrubbing.
 *
 * @param mobile pass true below the tablet breakpoint — smaller and capped,
 *   at some cost to fidelity, because seek latency is what actually breaks
 *   the effect on a handset.
 */
export function scrubbableVideoUrl(url: string, mobile = false): string {
  return withTransform(url, mobile ? SCRUB_MOBILE : SCRUB_DESKTOP);
}

/**
 * Video URL for straight playback rather than scrubbing. `f_auto` lets
 * Cloudinary serve WebM to browsers that prefer it, which it cannot do for
 * the scrubbed tour where the codec has to be predictable.
 */
export function playbackVideoUrl(url: string): string {
  return withTransform(url, PLAYBACK);
}

/** Poster frame for a video URL, or undefined when one cannot be derived. */
export function videoPosterUrl(url: string): string | undefined {
  if (!url || !isCloudinaryVideo(url)) return undefined;
  const transformed = withTransform(url, POSTER);
  // Cloudinary serves the frame as an image; swap the extension so the
  // browser is not handed a .mp4 it will try to decode as video.
  return transformed.replace(/\.(mp4|mov|webm|m4v)(\?|$)/i, '.jpg$2');
}
