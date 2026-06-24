import { useEffect, useMemo, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { libraryApi } from '@/api/libraryApi';
import { usePlaylistCurationQuery } from '@/api/playlistQueries';
import { syncRecommendationEvent } from '@/api/recommendationEventApi';
import { AppText } from '@/components/AppText';
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
import { getCurationListBottomPadding, getMiniPlayerBottom } from '@/constants/layout';
import { useLibraryStore } from '@/store/libraryStore';
import { usePlayerStore } from '@/store/playerStore';
import { useRecommendationEventStore } from '@/store/recommendationEventStore';
import {
  getSpotifyPlaybackFailureMessage,
  playSelectedSpotifyOrFallback,
} from '@/spotify/spotifyPlayback';
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
    setLikeState,
    setSaveState,
  } = useLibraryStore();
  const { data: playlist, isError, isLoading, refetch } = usePlaylistCurationQuery(playlistId);

  const [selectedTrackId, setSelectedTrackId] = useState<string>();
  const [actionMessage, setActionMessage] = useState<string>();

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

  const requestSpotifyPlayback = async (track: Track) => {
    const spotifyResult = await playSelectedSpotifyOrFallback(track);

    if (!spotifyResult.ok) {
      setActionMessage(getSpotifyPlaybackFailureMessage(spotifyResult.code));
    }
  };

  const playTrack = (track: Track) => {
    if (!playlist) {
      return;
    }

    setActionMessage(undefined);
    setTrack(track, playlist.id, playlist.tracks);
    void requestSpotifyPlayback(track);
    syncRecommendationEvent(
      addRecommendationEvent({
        context: createRecommendationEventContext(),
        playlistId: playlist.id,
        trackId: track.id,
        type: 'track_play',
      }),
    );
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
    const context = createRecommendationEventContext();
    setActionMessage(undefined);
    setLikeState(selectedTrack, nextLiked, playlist?.id);
    void libraryApi
      .updateTrackState(selectedTrack.id, {
        action: nextLiked ? 'like' : 'unlike',
        context,
        playlistId: playlist?.id,
      })
      .catch(() => {
        setLikeState(selectedTrack, !nextLiked, playlist?.id);
        setActionMessage('서버 저장에 실패해서 좋아요 상태를 되돌렸어요.');
      });
    syncRecommendationEvent(
      addRecommendationEvent({
        context,
        playlistId: playlist?.id,
        trackId: selectedTrack.id,
        type: nextLiked ? 'track_like' : 'track_unlike',
      }),
    );
  };

  const toggleSaved = () => {
    if (!selectedTrack) {
      return;
    }

    const nextSaved = !isSaved(selectedTrack.id);
    const context = createRecommendationEventContext();
    setActionMessage(undefined);
    setSaveState(selectedTrack, nextSaved, playlist?.id);
    void libraryApi
      .updateTrackState(selectedTrack.id, {
        action: nextSaved ? 'save' : 'unsave',
        context,
        playlistId: playlist?.id,
      })
      .catch(() => {
        setSaveState(selectedTrack, !nextSaved, playlist?.id);
        setActionMessage('서버 저장에 실패해서 저장 상태를 되돌렸어요.');
      });
    syncRecommendationEvent(
      addRecommendationEvent({
        context,
        playlistId: playlist?.id,
        trackId: selectedTrack.id,
        type: nextSaved ? 'track_save' : 'track_unsave',
      }),
    );
  };

  const closeMenu = () => {
    setSelectedTrackId(undefined);
    setActionMessage(undefined);
  };
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
        actionMessage={actionMessage}
        isLiked={isLiked(selectedTrack?.id)}
        isSaved={isSaved(selectedTrack?.id)}
        onClose={closeMenu}
        onToggleLike={toggleLiked}
        onToggleSave={toggleSaved}
        track={selectedTrack}
        visible={Boolean(selectedTrack)}
      />

      {actionMessage ? (
        <View
          className="absolute left-5 right-5 rounded-[14px] border border-amber-300/20 bg-amber-300/10 px-4 py-3"
          style={{
            bottom: getMiniPlayerBottom(insets.bottom) + (currentTrack ? 104 : 16),
          }}
        >
          <AppText className="text-center text-xs leading-5 text-amber-100">
            {actionMessage}
          </AppText>
        </View>
      ) : null}

      {currentTrack ? <MiniPlayer /> : null}
    </View>
  );
}
