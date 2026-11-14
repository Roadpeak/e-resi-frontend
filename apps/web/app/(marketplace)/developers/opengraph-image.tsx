import { OG_SIZE, OG_TYPE, textCard } from '../../../lib/seo/og-card';

export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const alt = 'Property developers in Kenya — E-resi';

export default function Image() {
  return textCard({ eyebrow: 'Developers', title: 'Property developers in Kenya', subtitle: 'Verified developers and the developments they are building.' });
}
