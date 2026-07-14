import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type HomeFilterState = {
  selectedMoodFilter: string;
  setSelectedMoodFilter: (filter: string) => void;
};

export const useHomeFilterStore = create<HomeFilterState>()(
  persist(
    (set) => ({
      selectedMoodFilter: '전체',
      setSelectedMoodFilter: (selectedMoodFilter) => set({ selectedMoodFilter }),
    }),
    {
      name: 'soundlog-home-filters',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
