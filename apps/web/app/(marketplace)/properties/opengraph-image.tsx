import { OG_SIZE, OG_TYPE, textCard } from '../../../lib/seo/og-card';

export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const alt = 'Properties for sale in Kenya — E-resi';

export default function Image() {
  return textCard({ eyebrow: 'Properties for sale', title: 'Properties for sale in Kenya', subtitle: 'Verified developments with cinematic, 3D and VR tours.' });
}
