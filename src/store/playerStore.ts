import { create } from 'zustand';

import { Track } from '@/types/domain';

type PlayerSource = 'none' | 'preview' | 'external';

type PlayerState = {
  currentTrack?: Track;
  isPlaying: boolean;
  playlistId?: string;
  queue: Track[];
  source: PlayerSource;
  playNext: () => void;
  playPrevious: () => void;
  setTrack: (track: Track, playlistId?: string, queue?: Track[]) => void;
  toggle: () => void;
};

export const usePlayerStore = create<PlayerState>((set) => ({
  isPlaying: false,
  queue: [],
  source: 'none',
  playNext: () =>
    set((state) => {
      if (!state.currentTrack || state.queue.length < 2) {
        return state;
      }

      const currentIndex = state.queue.findIndex((track) => track.id === state.currentTrack?.id);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % state.queue.length : 0;

      return {
        currentTrack: state.queue[nextIndex],
        isPlaying: true,
      };
    }),
  playPrevious: () =>
    set((state) => {
      if (!state.currentTrack || state.queue.length < 2) {
        return state;
      }

      const currentIndex = state.queue.findIndex((track) => track.id === state.currentTrack?.id);
      const previousIndex =
        currentIndex > 0 ? currentIndex - 1 : Math.max(state.queue.length - 1, 0);

      return {
        currentTrack: state.queue[previousIndex],
        isPlaying: true,
      };
    }),
  setTrack: (track, playlistId, queue) =>
    set({
      currentTrack: track,
      isPlaying: true,
      playlistId,
      queue: queue?.length ? queue : [track],
      source: 'external',
    }),
  toggle: () => set((state) => ({ isPlaying: !state.isPlaying })),
}));
