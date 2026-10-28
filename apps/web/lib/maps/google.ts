import type { Property } from '../types';

/**
 * Opens the development in Google Maps — the exact pin when we have
 * coordinates, otherwise a search for its address. Replaces the embedded map
 * tiles on the templates, which never matched any design they sat in.
 */
export function googleMapsUrl(address?: Property['address'] | null): string {
  const lat = address?.coordinates?.lat;
  const lng = address?.coordinates?.lng;
  const query = lat && lng
    ? `${lat},${lng}`
    : [address?.street, address?.neighborhood, address?.city, address?.county, 'Kenya'].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
