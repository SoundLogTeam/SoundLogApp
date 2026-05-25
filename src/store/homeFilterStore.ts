import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type HomeFilterState = {
  selectedMoodFilter: string;
  selectedTopFilter: string;
  setSelectedMoodFilter: (filter: string) => void;
  setSelectedTopFilter: (filter: string) => void;
};

export const useHomeFilterStore = create<HomeFilterState>()(
  persist(
    (set) => ({
      selectedMoodFilter: '전체',
      selectedTopFilter: '전체',
      setSelectedMoodFilter: (selectedMoodFilter) => set({ selectedMoodFilter }),
      setSelectedTopFilter: (selectedTopFilter) => set({ selectedTopFilter }),
    }),
    {
      name: 'soundlog-home-filters',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
