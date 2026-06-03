import { create } from 'zustand';

import { Track } from '@/types/domain';

type PlayerSource = 'none' | 'preview' | 'external';

type PlayerState = {
  currentTrack?: Track;
  isPlaying: boolean;
  playlistId?: string;
  source: PlayerSource;
  clearTrack: () => void;
  setTrack: (track: Track, playlistId?: string) => void;
  toggle: () => void;
};

export const usePlayerStore = create<PlayerState>((set) => ({
  isPlaying: false,
  source: 'none',
  clearTrack: () =>
    set({
      currentTrack: undefined,
      isPlaying: false,
      playlistId: undefined,
      source: 'none',
    }),
  setTrack: (track, playlistId) =>
    set({
      currentTrack: track,
      isPlaying: true,
      playlistId,
      source: 'external',
    }),
  toggle: () => set((state) => ({ isPlaying: !state.isPlaying })),
}));
