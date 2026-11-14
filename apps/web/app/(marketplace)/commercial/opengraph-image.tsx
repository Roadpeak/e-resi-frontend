import { OG_SIZE, OG_TYPE, textCard } from '../../../lib/seo/og-card';

export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const alt = 'Commercial property in Kenya — E-resi';

export default function Image() {
  return textCard({ eyebrow: 'For sale', title: 'Commercial property in Kenya', subtitle: 'Offices and commercial space, toured online.' });
}
