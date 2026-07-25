import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';

const secureStorage: StateStorage = {
  getItem: (name) => {
    try {
      return SecureStore.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    SecureStore.setItem(name, value);
  },
  removeItem: (name) => {
    SecureStore.deleteItemAsync(name).catch(() => {});
  },
};

type SelectedSpaceState = {
  selectedSpaceId: number | null;
  setSelectedSpaceId: (id: number | null) => void;
};

export const useSelectedSpaceStore = create<SelectedSpaceState>()(
  persist(
    (set) => ({
      selectedSpaceId: null,
      setSelectedSpaceId: (id) => set({ selectedSpaceId: id }),
    }),
    {
      name: 'selected_space_id',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);
