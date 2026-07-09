import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { LibraryPlaylistSummary, Track } from '@/types/domain';

export type LibraryTrackRecord = {
  createdAt: string;
  playlist?: LibraryPlaylistSummary;
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
  seedFromPlaylist: (
    playlistId: string,
    tracks: Track[],
    playlist?: LibraryPlaylistSummary,
  ) => void;
  setLikeState: (
    track: Track,
    isLiked: boolean,
    playlistId?: string,
    playlist?: LibraryPlaylistSummary,
  ) => void;
  setSaveState: (
    track: Track,
    isSaved: boolean,
    playlistId?: string,
    playlist?: LibraryPlaylistSummary,
  ) => void;
  toggleLike: (track: Track, playlistId?: string, playlist?: LibraryPlaylistSummary) => void;
  toggleSave: (track: Track, playlistId?: string, playlist?: LibraryPlaylistSummary) => void;
};

function upsertRecord(
  records: LibraryTrackRecord[],
  track: Track,
  playlistId?: string,
  playlist?: LibraryPlaylistSummary,
) {
  const createdAt = new Date().toISOString();
  return [
    {
      createdAt,
      playlist,
      playlistId: playlistId ?? playlist?.id,
      track: { ...track, isLiked: undefined, isSaved: undefined },
    },
    ...records.filter((record) => record.track.id !== track.id),
  ];
}

function applyPlaylistMetadata(
  records: LibraryTrackRecord[],
  playlistId: string,
  playlist?: LibraryPlaylistSummary,
) {
  if (!playlist) {
    return records;
  }

  return records.map((record) =>
    record.playlistId === playlistId && !record.playlist
      ? { ...record, playlist }
      : record,
  );
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
      seedFromPlaylist: (playlistId, tracks, playlist) =>
        set((state) => {
          if (state.seededPlaylistIds.includes(playlistId)) {
            return {
              likedTracks: applyPlaylistMetadata(state.likedTracks, playlistId, playlist),
              savedTracks: applyPlaylistMetadata(state.savedTracks, playlistId, playlist),
            };
          }

          return {
            likedTracks: tracks
              .filter((track) => track.isLiked)
              .reduce(
                (records, track) => upsertRecord(records, track, playlistId, playlist),
                state.likedTracks,
              ),
            savedTracks: tracks
              .filter((track) => track.isSaved)
              .reduce(
                (records, track) => upsertRecord(records, track, playlistId, playlist),
                state.savedTracks,
              ),
            seededPlaylistIds: [...state.seededPlaylistIds, playlistId],
          };
        }),
      setLikeState: (track, nextLiked, playlistId, playlist) =>
        set((state) => ({
          likedTracks: nextLiked
            ? upsertRecord(state.likedTracks, track, playlistId, playlist)
            : state.likedTracks.filter((record) => record.track.id !== track.id),
        })),
      setSaveState: (track, nextSaved, playlistId, playlist) =>
        set((state) => ({
          savedTracks: nextSaved
            ? upsertRecord(state.savedTracks, track, playlistId, playlist)
            : state.savedTracks.filter((record) => record.track.id !== track.id),
        })),
      toggleLike: (track, playlistId, playlist) =>
        set((state) => {
          const isLiked = state.likedTracks.some((record) => record.track.id === track.id);

          return {
            likedTracks: isLiked
              ? state.likedTracks.filter((record) => record.track.id !== track.id)
              : upsertRecord(state.likedTracks, track, playlistId, playlist),
          };
        }),
      toggleSave: (track, playlistId, playlist) =>
        set((state) => {
          const isSaved = state.savedTracks.some((record) => record.track.id === track.id);

          return {
            savedTracks: isSaved
              ? state.savedTracks.filter((record) => record.track.id !== track.id)
              : upsertRecord(state.savedTracks, track, playlistId, playlist),
          };
        }),
    }),
    {
      name: 'soundlog-library',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
