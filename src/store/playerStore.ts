import { create } from 'zustand';

import { LibraryPlaylistSummary, Track } from '@/types/domain';

type PlayerState = {
  currentTrack?: Track;
  playlist?: LibraryPlaylistSummary;
  playlistId?: string;
  queue: Track[];
  playNext: () => void;
  playPrevious: () => void;
  clearTrack: () => void;
  setTrack: (
    track: Track,
    playlistId?: string,
    queue?: Track[],
    playlist?: LibraryPlaylistSummary,
  ) => void;
};

export const usePlayerStore = create<PlayerState>((set) => ({
  queue: [],
  playNext: () =>
    set((state) => {
      if (!state.currentTrack || state.queue.length < 2) {
        return state;
      }

      const currentIndex = state.queue.findIndex((track) => track.id === state.currentTrack?.id);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % state.queue.length : 0;

      return {
        currentTrack: state.queue[nextIndex],
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
      };
    }),
  clearTrack: () =>
    set({
      currentTrack: undefined,
      playlist: undefined,
      playlistId: undefined,
      queue: [],
    }),
  setTrack: (track, playlistId, queue, playlist) =>
    set({
      currentTrack: track,
      playlist,
      playlistId,
      queue: queue?.length ? queue : [track],
    }),
}));
