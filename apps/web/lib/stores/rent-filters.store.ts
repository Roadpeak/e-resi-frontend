import { create } from 'zustand';
import type { RentFilters } from '../types';

interface RentFiltersStore {
  filters: RentFilters;
  setFilter: <K extends keyof RentFilters>(key: K, value: RentFilters[K]) => void;
  resetFilters: () => void;
}

const defaultFilters: RentFilters = {
  sortBy: 'newest',
};

export const useRentFiltersStore = create<RentFiltersStore>((set) => ({
  filters: defaultFilters,
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),
  resetFilters: () => set({ filters: defaultFilters }),
}));
