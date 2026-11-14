import { OG_SIZE, OG_TYPE, textCard } from '../../../lib/seo/og-card';

export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const alt = 'Where to live in Nairobi — E-resi';

export default function Image() {
  return textCard({ eyebrow: 'Area guides', title: 'Where to live in Nairobi', subtitle: 'Neighbourhood guides, and the homes listed in each.' });
}
