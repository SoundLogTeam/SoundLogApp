import { useEffect, useMemo, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
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
import { useRecommendationEventStore } from '@/store/recommendationEventStore';
import { Track } from '@/types/domain';
import { createRecommendationEventContext } from '@/utils/recommendationEventContext';

type PlaylistCurationScreenProps = {
  playlistId?: string;
};

export function PlaylistCurationScreen({ playlistId }: PlaylistCurationScreenProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { currentTrack, setTrack } = usePlayerStore();
  const addRecommendationEvent = useRecommendationEventStore((state) => state.addEvent);
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
  const usesPlainMoodPage = playlistId === 'calm-walk' || Boolean(playlist?.accentColor);

  const playTrack = (track: Track) => {
    if (!playlist) {
      return;
    }

    setTrack(track, playlist.id, playlist.tracks);
    addRecommendationEvent({
      context: createRecommendationEventContext(),
      playlistId: playlist.id,
      trackId: track.id,
      type: 'track_play',
    });
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

    const nextLiked = !isLiked(selectedTrack.id);
    toggleLike(selectedTrack, playlist?.id);
    addRecommendationEvent({
      context: createRecommendationEventContext(),
      playlistId: playlist?.id,
      trackId: selectedTrack.id,
      type: nextLiked ? 'track_like' : 'track_unlike',
    });
  };

  const toggleSaved = () => {
    if (!selectedTrack) {
      return;
    }

    const nextSaved = !isSaved(selectedTrack.id);
    toggleSave(selectedTrack, playlist?.id);
    addRecommendationEvent({
      context: createRecommendationEventContext(),
      playlistId: playlist?.id,
      trackId: selectedTrack.id,
      type: nextSaved ? 'track_save' : 'track_unsave',
    });
  };

  const closeMenu = () => setSelectedTrackId(undefined);
  const playlistContent = isLoading ? (
    <PlaylistLoadingState />
  ) : isError ? (
    <PlaylistErrorState onRetry={() => refetch()} />
  ) : !playlist ? (
    <PlaylistEmptyState />
  ) : (
    <TrackList
      bottomPadding={listBottomPadding}
      currentTrackId={currentTrack?.id}
      likedTrackIds={likedTrackIds}
      onOpenMenu={(track) => setSelectedTrackId(track.id)}
      onSelectTrack={playTrack}
      savedTrackIds={savedTrackIds}
      tracks={playlist.tracks}
    />
  );

  return (
    <View className="flex-1 bg-soundlog-bg">
      <PlaylistBackground accentColor={playlist?.accentColor} imageUrl={playlist?.backgroundImageUrl} />

      {usesPlainMoodPage ? (
        <ScrollView
          className="absolute inset-0"
          contentContainerStyle={{ minHeight: height + 205, paddingTop: 205 }}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          {playlist ? (
            <PlaylistHeroInfo
              disabled={playlist.tracks.length === 0}
              onPlay={playFirstTrack}
              playlist={playlist}
            />
          ) : null}
          {playlistContent}
        </ScrollView>
      ) : (
        <PlaylistBottomSheet
          stickyHeader={
            playlist ? (
              <PlaylistHeroInfo
                disabled={playlist.tracks.length === 0}
                onPlay={playFirstTrack}
                playlist={playlist}
              />
            ) : undefined
          }
        >
          {playlistContent}
        </PlaylistBottomSheet>
      )}

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
