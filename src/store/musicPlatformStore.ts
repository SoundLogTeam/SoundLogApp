import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { MusicPlatformId } from '@/types/domain';

type MusicPlatformState = {
  resetPlatform: () => void;
  selectedPlatformId: MusicPlatformId;
  setSelectedPlatform: (id: MusicPlatformId) => void;
  updatedAt?: string;
};

export const useMusicPlatformStore = create<MusicPlatformState>()(
  persist(
    (set) => ({
      selectedPlatformId: 'none',
      resetPlatform: () =>
        set({
          selectedPlatformId: 'none',
          updatedAt: new Date().toISOString(),
        }),
      setSelectedPlatform: (selectedPlatformId) =>
        set({
          selectedPlatformId,
          updatedAt: new Date().toISOString(),
        }),
    }),
    {
      name: 'soundlog-music-platform',
      partialize: (state) => ({
        selectedPlatformId: state.selectedPlatformId,
        updatedAt: state.updatedAt,
      }),
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
