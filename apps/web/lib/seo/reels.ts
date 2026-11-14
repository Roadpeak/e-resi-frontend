const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.e-resi.com/api';

/** /reels is noindexed below this many published reels, like area pages below 3 listings. */
export const REELS_MIN_INDEXABLE = 6;

/** How many reels are published, capped at one page of the feed (enough to compare to the threshold). */
export async function publishedReelCount(): Promise<number> {
  try {
    const res = await fetch(`${API}/reels?limit=30`, { next: { revalidate: 600 } });
    if (!res.ok) return 0;
    const json = await res.json();
    const items = json?.data?.items ?? json?.items ?? [];
    return Array.isArray(items) ? items.length : 0;
  } catch {
    return 0;
  }
}
