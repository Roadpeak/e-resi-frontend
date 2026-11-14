import { OG_SIZE, OG_TYPE, textCard } from '../../../lib/seo/og-card';

export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const alt = 'Homes in short videos — E-resi';

export default function Image() {
  return textCard({ eyebrow: 'Property reels', title: 'Homes in short videos', subtitle: 'Walk through homes for sale and to rent, straight from agents.' });
}
