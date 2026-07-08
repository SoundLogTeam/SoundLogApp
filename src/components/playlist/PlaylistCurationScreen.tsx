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
import { TrackList } from '@/components/playlist/TrackList';
import { getCurationListBottomPadding, getMiniPlayerBottom } from '@/constants/layout';
import { useHomeFilterStore } from '@/store/homeFilterStore';
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
  const { selectedMoodFilter, setSelectedMoodFilter } = useHomeFilterStore();
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

  const [actionMessage, setActionMessage] = useState<string>();

  useEffect(() => {
    if (!playlist) {
      return;
    }

    seedFromPlaylist(playlist.id, playlist.tracks);
  }, [playlist, seedFromPlaylist]);

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

  const selectTrackForSoundlog = (track: Track) => {
    if (!playlist) {
      return;
    }

    setActionMessage(undefined);
    setTrack(track, playlist.id, playlist.tracks);
    setActionMessage('이 곡을 SoundLog 음악으로 선택했어요. 하단 패널에서 저장하거나 순간 기록에 담을 수 있어요.');
  };

  const selectFirstTrack = () => {
    const firstTrack = playlist?.tracks[0];

    if (!firstTrack) {
      return;
    }

    selectTrackForSoundlog(firstTrack);
  };

  const toggleLikedTrack = (track: Track) => {
    const nextLiked = !isLiked(track.id);
    const context = createRecommendationEventContext();

    setActionMessage(undefined);
    setLikeState(track, nextLiked, playlist?.id);
    void libraryApi
      .updateTrackState(track.id, {
        action: nextLiked ? 'like' : 'unlike',
        context,
        playlistId: playlist?.id,
      })
      .catch(() => {
        setLikeState(track, !nextLiked, playlist?.id);
        setActionMessage('서버 저장에 실패해서 좋아요 상태를 되돌렸어요.');
      });
    syncRecommendationEvent(
      addRecommendationEvent({
        context,
        playlistId: playlist?.id,
        trackId: track.id,
        type: nextLiked ? 'track_like' : 'track_unlike',
      }),
    );
  };

  const toggleSavedTrack = (track: Track) => {
    const nextSaved = !isSaved(track.id);
    const context = createRecommendationEventContext();

    setActionMessage(undefined);
    setSaveState(track, nextSaved, playlist?.id);
    void libraryApi
      .updateTrackState(track.id, {
        action: nextSaved ? 'save' : 'unsave',
        context,
        playlistId: playlist?.id,
      })
      .catch(() => {
        setSaveState(track, !nextSaved, playlist?.id);
        setActionMessage('서버 저장에 실패해서 저장 상태를 되돌렸어요.');
      });
    syncRecommendationEvent(
      addRecommendationEvent({
        context,
        playlistId: playlist?.id,
        trackId: track.id,
        type: nextSaved ? 'track_save' : 'track_unsave',
      }),
    );
  };

  const handleAdjustMood = (filter: string) => {
    const context = createRecommendationEventContext({ moodFilter: filter });

    setSelectedMoodFilter(filter);
    setActionMessage(`${filter} 무드로 다음 추천 방향을 조정했어요.`);
    syncRecommendationEvent(
      addRecommendationEvent({
        context,
        playlistId: playlist?.id,
        type: 'mood_adjusted',
        value: filter,
      }),
    );
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
      onSelectTrack={selectTrackForSoundlog}
      onToggleLike={toggleLikedTrack}
      onToggleSave={toggleSavedTrack}
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
              onAdjustMood={handleAdjustMood}
              onOpenFirstTrack={selectFirstTrack}
              playlist={playlist}
              selectedMoodFilter={selectedMoodFilter}
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
                onAdjustMood={handleAdjustMood}
                onOpenFirstTrack={selectFirstTrack}
                playlist={playlist}
                selectedMoodFilter={selectedMoodFilter}
              />
            ) : undefined
          }
        >
          {playlistContent}
        </PlaylistBottomSheet>
      )}

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
