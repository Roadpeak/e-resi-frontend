import { OG_SIZE, OG_TYPE, textCard } from '../../../lib/seo/og-card';

export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const alt = 'Apartments for sale in Kenya — E-resi';

export default function Image() {
  return textCard({ eyebrow: 'For sale', title: 'Apartments for sale in Kenya', subtitle: 'Tour every unit type before you visit.' });
}
