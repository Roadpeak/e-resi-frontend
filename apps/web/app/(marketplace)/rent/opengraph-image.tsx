import { OG_SIZE, OG_TYPE, textCard } from '../../../lib/seo/og-card';

export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const alt = 'Houses and apartments for rent in Nairobi — E-resi';

export default function Image() {
  return textCard({ eyebrow: 'To rent', title: 'Houses and apartments for rent in Nairobi', subtitle: 'Live availability, monthly rent and tours before you visit.' });
}
