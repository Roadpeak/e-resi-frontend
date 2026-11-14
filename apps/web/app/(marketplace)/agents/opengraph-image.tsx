import { OG_SIZE, OG_TYPE, textCard } from '../../../lib/seo/og-card';

export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const alt = 'Property agents in Kenya — E-resi';

export default function Image() {
  return textCard({ eyebrow: 'Agents', title: 'Property agents in Kenya', subtitle: 'Verified letting and sales agents, rated by their clients.' });
}
