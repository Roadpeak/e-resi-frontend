import {
  BarChart3, Clapperboard, DoorOpen, Globe, Images, LayoutDashboard, MapPin, Palette,
  type LucideIcon,
} from 'lucide-react';

/**
 * Everything a developer manages on one development, in one place, so the
 * actions menu, the section tabs and the overview tiles cannot drift apart.
 * `path` is appended to /dashboard/properties/<slug>.
 */
export interface PropertySection {
  key: string;
  label: string;
  path: string;
  icon: LucideIcon;
  blurb: string;
}

export const PROPERTY_SECTIONS: PropertySection[] = [
  { key: 'overview', label: 'Overview', path: '', icon: LayoutDashboard, blurb: 'Listing details and status' },
  { key: 'media', label: 'Media', path: '/media', icon: Images, blurb: 'Gallery, logo and tour videos' },
  { key: 'units', label: 'Units & floor plans', path: '/units', icon: DoorOpen, blurb: 'Inventory, prices and layouts' },
  { key: 'nearby', label: 'Nearby places', path: '/nearby', icon: MapPin, blurb: 'Schools, malls and landmarks around it' },
  { key: 'domain', label: 'Domain', path: '/domain', icon: Globe, blurb: 'Your e-resi address and own domain' },
  { key: 'services', label: 'Production services', path: '/services', icon: Clapperboard, blurb: 'Photography, video, 3D and VR' },
  { key: 'customise', label: 'Customise mini-site', path: '/customise', icon: Palette, blurb: 'Colours, layout and wording' },
  { key: 'insights', label: 'Insights', path: '/insights', icon: BarChart3, blurb: 'Visits, leads and shared links' },
];

export const sectionHref = (slug: string, s: PropertySection) => `/dashboard/properties/${slug}${s.path}`;

/** Buyers can open the page only in these states. */
export const isPublicStatus = (status: string) =>
  status === 'ACTIVE' || status === 'OFF_PLAN' || status === 'SOLD_OUT';
