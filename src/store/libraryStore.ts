import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { Track } from '@/types/domain';

export type LibraryTrackRecord = {
  createdAt: string;
  playlistId?: string;
  track: Track;
};

type LibraryState = {
  likedTracks: LibraryTrackRecord[];
  savedTracks: LibraryTrackRecord[];
  seededPlaylistIds: string[];
  isLiked: (trackId?: string) => boolean;
  isSaved: (trackId?: string) => boolean;
  removeLikedTrack: (trackId: string) => void;
  removeSavedTrack: (trackId: string) => void;
  seedFromPlaylist: (playlistId: string, tracks: Track[]) => void;
  setLikeState: (track: Track, isLiked: boolean, playlistId?: string) => void;
  setSaveState: (track: Track, isSaved: boolean, playlistId?: string) => void;
  toggleLike: (track: Track, playlistId?: string) => void;
  toggleSave: (track: Track, playlistId?: string) => void;
};

function upsertRecord(records: LibraryTrackRecord[], track: Track, playlistId?: string) {
  const createdAt = new Date().toISOString();
  return [
    { createdAt, playlistId, track: { ...track, isLiked: undefined, isSaved: undefined } },
    ...records.filter((record) => record.track.id !== track.id),
  ];
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      likedTracks: [],
      savedTracks: [],
      seededPlaylistIds: [],
      isLiked: (trackId) =>
        Boolean(trackId && get().likedTracks.some((record) => record.track.id === trackId)),
      isSaved: (trackId) =>
        Boolean(trackId && get().savedTracks.some((record) => record.track.id === trackId)),
      removeLikedTrack: (trackId) =>
        set((state) => ({
          likedTracks: state.likedTracks.filter((record) => record.track.id !== trackId),
        })),
      removeSavedTrack: (trackId) =>
        set((state) => ({
          savedTracks: state.savedTracks.filter((record) => record.track.id !== trackId),
        })),
      seedFromPlaylist: (playlistId, tracks) =>
        set((state) => {
          if (state.seededPlaylistIds.includes(playlistId)) {
            return {};
          }

          return {
            likedTracks: tracks
              .filter((track) => track.isLiked)
              .reduce(
                (records, track) => upsertRecord(records, track, playlistId),
                state.likedTracks,
              ),
            savedTracks: tracks
              .filter((track) => track.isSaved)
              .reduce(
                (records, track) => upsertRecord(records, track, playlistId),
                state.savedTracks,
              ),
            seededPlaylistIds: [...state.seededPlaylistIds, playlistId],
          };
        }),
      setLikeState: (track, nextLiked, playlistId) =>
        set((state) => ({
          likedTracks: nextLiked
            ? upsertRecord(state.likedTracks, track, playlistId)
            : state.likedTracks.filter((record) => record.track.id !== track.id),
        })),
      setSaveState: (track, nextSaved, playlistId) =>
        set((state) => ({
          savedTracks: nextSaved
            ? upsertRecord(state.savedTracks, track, playlistId)
            : state.savedTracks.filter((record) => record.track.id !== track.id),
        })),
      toggleLike: (track, playlistId) =>
        set((state) => {
          const isLiked = state.likedTracks.some((record) => record.track.id === track.id);

          return {
            likedTracks: isLiked
              ? state.likedTracks.filter((record) => record.track.id !== track.id)
              : upsertRecord(state.likedTracks, track, playlistId),
          };
        }),
      toggleSave: (track, playlistId) =>
        set((state) => {
          const isSaved = state.savedTracks.some((record) => record.track.id === track.id);

          return {
            savedTracks: isSaved
              ? state.savedTracks.filter((record) => record.track.id !== track.id)
              : upsertRecord(state.savedTracks, track, playlistId),
          };
        }),
    }),
    {
      name: 'soundlog-library',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
