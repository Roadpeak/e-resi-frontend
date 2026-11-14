import { OG_SIZE, OG_TYPE, textCard } from '../../../../lib/seo/og-card';

export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const alt = 'Commercial space to rent in Kenya — E-resi';

export default function Image() {
  return textCard({ eyebrow: 'To rent', title: 'Commercial space to rent in Kenya', subtitle: 'Offices and shops with live availability.' });
}
