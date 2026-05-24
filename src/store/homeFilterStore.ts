import { create } from 'zustand';

type HomeFilterState = {
  selectedMoodFilter: string;
  selectedTopFilter: string;
  setSelectedMoodFilter: (filter: string) => void;
  setSelectedTopFilter: (filter: string) => void;
};

export const useHomeFilterStore = create<HomeFilterState>((set) => ({
  selectedMoodFilter: '전체',
  selectedTopFilter: '전체',
  setSelectedMoodFilter: (selectedMoodFilter) => set({ selectedMoodFilter }),
  setSelectedTopFilter: (selectedTopFilter) => set({ selectedTopFilter }),
}));
