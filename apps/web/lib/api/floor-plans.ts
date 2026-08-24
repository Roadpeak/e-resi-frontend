import { apiClient } from './client';
import type { FloorPlan } from '../types';

/**
 * Floor plans — the layouts a development is built to.
 *
 * A plan belongs to the property, not to a unit: a tower has four layouts and
 * two hundred units, and every 2-bed unit shares one drawing. Units point at a
 * plan rather than owning one, and the unit page falls back to matching on
 * bedroom count when nothing is linked.
 */

export interface CreateFloorPlanInput {
  name: string;
  imageUrl: string;
  bedrooms?: number;
  bathrooms?: number;
  sqm?: number;
  sqft?: number;
  order?: number;
}

/** The routes live on the tours controller — /properties/:slug/tours/… */
export const floorPlansApi = {
  list: (slug: string) =>
    apiClient.get<FloorPlan[]>(`/properties/${slug}/tours/floor-plans`),

  create: (slug: string, body: CreateFloorPlanInput) =>
    apiClient.post<FloorPlan>(`/properties/${slug}/tours/floor-plans`, body),

  remove: (slug: string, id: string) =>
    apiClient.delete<{ message: string }>(`/properties/${slug}/tours/floor-plans/${id}`),
};
