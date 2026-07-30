import { create } from 'zustand';

interface UIStore {
  isNavOpen: boolean;
  isSearchOpen: boolean;
  activeModal: string | null;
  setNavOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  openModal: (id: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isNavOpen: false,
  isSearchOpen: false,
  activeModal: null,

  setNavOpen: (open) => set({ isNavOpen: open }),
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
}));
