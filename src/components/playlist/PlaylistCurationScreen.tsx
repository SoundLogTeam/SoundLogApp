import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePlaylistCurationQuery } from '@/api/playlistQueries';
import { MiniPlayer } from '@/components/MiniPlayer';
import { PlaylistBackground } from '@/components/playlist/PlaylistBackground';
import { PlaylistBottomSheet } from '@/components/playlist/PlaylistBottomSheet';
import { PlaylistHeroInfo } from '@/components/playlist/PlaylistHeroInfo';
import {
  PlaylistEmptyState,
  PlaylistErrorState,
  PlaylistLoadingState,
} from '@/components/playlist/PlaylistState';
import { TrackActionMenu } from '@/components/playlist/TrackActionMenu';
import { TrackList } from '@/components/playlist/TrackList';
import { getCurationListBottomPadding } from '@/constants/layout';
import { useLibraryStore } from '@/store/libraryStore';
import { usePlayerStore } from '@/store/playerStore';
import { Track } from '@/types/domain';

type PlaylistCurationScreenProps = {
  playlistId?: string;
};

export function PlaylistCurationScreen({ playlistId }: PlaylistCurationScreenProps) {
  const insets = useSafeAreaInsets();
  const { currentTrack, setTrack } = usePlayerStore();
  const {
    isLiked,
    isSaved,
    likedTracks,
    savedTracks,
    seedFromPlaylist,
    toggleLike,
    toggleSave,
  } = useLibraryStore();
  const { data: playlist, isError, isLoading, refetch } = usePlaylistCurationQuery(playlistId);

  const [selectedTrackId, setSelectedTrackId] = useState<string>();

  useEffect(() => {
    if (!playlist) {
      return;
    }

    seedFromPlaylist(playlist.id, playlist.tracks);
  }, [playlist, seedFromPlaylist]);

  const selectedTrack = useMemo(
    () => playlist?.tracks.find((track) => track.id === selectedTrackId),
    [playlist?.tracks, selectedTrackId],
  );
  const likedTrackIds = useMemo(
    () =>
      new Set(
        playlist?.tracks
          .filter((track) => likedTracks.some((record) => record.track.id === track.id))
          .map((track) => track.id),
      ),
    [likedTracks, playlist?.tracks],
  );
  const savedTrackIds = useMemo(
    () =>
      new Set(
        playlist?.tracks
          .filter((track) => savedTracks.some((record) => record.track.id === track.id))
          .map((track) => track.id),
      ),
    [playlist?.tracks, savedTracks],
  );

  const hasMiniPlayer = Boolean(currentTrack);
  const listBottomPadding = getCurationListBottomPadding(insets.bottom, hasMiniPlayer);

  const playTrack = (track: Track) => {
    if (!playlist) {
      return;
    }

    setTrack(track, playlist.id);
  };

  const playFirstTrack = () => {
    const firstTrack = playlist?.tracks[0];

    if (!firstTrack) {
      return;
    }

    playTrack(firstTrack);
  };

  const toggleLiked = () => {
    if (!selectedTrack) {
      return;
    }

    toggleLike(selectedTrack, playlist?.id);
  };

  const toggleSaved = () => {
    if (!selectedTrack) {
      return;
    }

    toggleSave(selectedTrack, playlist?.id);
  };

  const closeMenu = () => setSelectedTrackId(undefined);

  return (
    <View className="flex-1 bg-soundlog-bg">
      <PlaylistBackground imageUrl={playlist?.backgroundImageUrl} />

      <PlaylistBottomSheet>
        {isLoading ? (
          <PlaylistLoadingState />
        ) : isError ? (
          <PlaylistErrorState onRetry={() => refetch()} />
        ) : !playlist ? (
          <PlaylistEmptyState />
        ) : (
          <>
            <PlaylistHeroInfo
              disabled={playlist.tracks.length === 0}
              onPlay={playFirstTrack}
              playlist={playlist}
            />
            <TrackList
              bottomPadding={listBottomPadding}
              currentTrackId={currentTrack?.id}
              likedTrackIds={likedTrackIds}
              onOpenMenu={(track) => setSelectedTrackId(track.id)}
              onSelectTrack={playTrack}
              savedTrackIds={savedTrackIds}
              tracks={playlist.tracks}
            />
          </>
        )}
      </PlaylistBottomSheet>

      <TrackActionMenu
        isLiked={isLiked(selectedTrack?.id)}
        isSaved={isSaved(selectedTrack?.id)}
        onClose={closeMenu}
        onToggleLike={toggleLiked}
        onToggleSave={toggleSaved}
        track={selectedTrack}
        visible={Boolean(selectedTrack)}
      />

      {currentTrack ? <MiniPlayer /> : null}
    </View>
  );
}
