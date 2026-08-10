/**
 * The development types a developer picks from, and what each one implies.
 *
 * Type is no longer just a label: it selects the backend PropertyCategory,
 * which in turn decides what the development is billed for production (see
 * ServicePriceOverride) and which marketplace pages it appears on. It also
 * decides which fields are worth asking for — bedroom counts are meaningless
 * for land, and unit layouts differ between homes and commercial space.
 */

export type BackendCategory =
  | 'APARTMENT'
  | 'VILLA'
  | 'TOWNHOUSE'
  | 'PENTHOUSE'
  | 'OFFICE'
  | 'COMMERCIAL'
  | 'LAND';

export interface DevelopmentType {
  /** Value stored in the wizard and shown to the developer. */
  label: string;
  category: BackendCategory;
  hint: string;
  /** Residential layouts (bedrooms, bathrooms) apply. */
  residential: boolean;
  /** Physical structures exist to shoot/scan — false for bare land. */
  built: boolean;
  unitTypes: string[];
  /** Label for the "number of units" field, which differs per type. */
  unitCountLabel: string;
}

const RESIDENTIAL_UNITS = ['Studio', '1 Bedroom', '2 Bedroom', '3 Bedroom', '4+ Bedroom', 'Penthouse', 'Duplex'];
const COMMERCIAL_UNITS = ['Open-plan office', 'Partitioned office', 'Retail unit', 'Warehouse', 'Showroom', 'Full floor plate'];
const LAND_UNITS = ['1/8 acre', '1/4 acre', '1/2 acre', '1 acre', 'Custom subdivision'];

export const DEVELOPMENT_TYPES: DevelopmentType[] = [
  {
    label: 'Apartments',
    category: 'APARTMENT',
    hint: 'Flats within one or more blocks',
    residential: true,
    built: true,
    unitTypes: RESIDENTIAL_UNITS,
    unitCountLabel: 'Number of units',
  },
  {
    label: 'Villas',
    category: 'VILLA',
    hint: 'Standalone homes, often in a gated community',
    residential: true,
    built: true,
    unitTypes: ['3 Bedroom', '4 Bedroom', '5+ Bedroom', 'Maisonette', 'Bungalow'],
    unitCountLabel: 'Number of villas',
  },
  {
    label: 'Townhouses',
    category: 'TOWNHOUSE',
    hint: 'Terraced or semi-detached homes',
    residential: true,
    built: true,
    unitTypes: ['2 Bedroom', '3 Bedroom', '4 Bedroom', 'Maisonette'],
    unitCountLabel: 'Number of homes',
  },
  {
    label: 'Penthouses',
    category: 'PENTHOUSE',
    hint: 'Top-floor residences sold as their own product',
    residential: true,
    built: true,
    unitTypes: ['2 Bedroom', '3 Bedroom', '4+ Bedroom', 'Duplex penthouse'],
    unitCountLabel: 'Number of penthouses',
  },
  {
    label: 'Offices',
    category: 'OFFICE',
    hint: 'Office space, sold or let by floor or suite',
    residential: false,
    built: true,
    unitTypes: COMMERCIAL_UNITS,
    unitCountLabel: 'Number of suites',
  },
  {
    label: 'Commercial',
    category: 'COMMERCIAL',
    hint: 'Retail, mixed-use or industrial space',
    residential: false,
    built: true,
    unitTypes: COMMERCIAL_UNITS,
    unitCountLabel: 'Number of units',
  },
  {
    label: 'Land',
    category: 'LAND',
    hint: 'Plots sold undeveloped',
    residential: false,
    built: false,
    unitTypes: LAND_UNITS,
    unitCountLabel: 'Number of plots',
  },
];

export const DEV_TYPE_LABELS = DEVELOPMENT_TYPES.map((t) => t.label);

export function findDevelopmentType(label: string): DevelopmentType | undefined {
  return DEVELOPMENT_TYPES.find((t) => t.label === label);
}

/**
 * Wizard type label → backend PropertyCategory.
 * Older drafts may hold retired labels ("Mixed-use", "Gated community"), so
 * those are mapped rather than dropped.
 */
export function toCategory(label: string): BackendCategory {
  const known = findDevelopmentType(label);
  if (known) return known.category;
  const legacy: Record<string, BackendCategory> = {
    'Mixed-use': 'COMMERCIAL',
    'Gated community': 'VILLA',
  };
  return legacy[label] ?? 'APARTMENT';
}
