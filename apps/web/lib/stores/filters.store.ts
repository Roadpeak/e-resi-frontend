import { create } from 'zustand';
import type { PropertyFilters } from '../types';

interface FiltersStore {
  filters: PropertyFilters;
  isMapView: boolean;
  setFilter: <K extends keyof PropertyFilters>(key: K, value: PropertyFilters[K]) => void;
  setFilters: (filters: Partial<PropertyFilters>) => void;
  resetFilters: () => void;
  toggleMapView: () => void;
}

const defaultFilters: PropertyFilters = {
  sortBy: 'featured',
};

export const useFiltersStore = create<FiltersStore>((set) => ({
  filters: defaultFilters,
  isMapView: false,

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  resetFilters: () => set({ filters: defaultFilters }),

  toggleMapView: () => set((state) => ({ isMapView: !state.isMapView })),
}));
