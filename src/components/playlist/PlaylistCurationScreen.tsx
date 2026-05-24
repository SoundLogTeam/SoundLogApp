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
import { usePlayerStore } from '@/store/playerStore';
import { Track } from '@/types/domain';

type PlaylistCurationScreenProps = {
  playlistId?: string;
};

export function PlaylistCurationScreen({ playlistId }: PlaylistCurationScreenProps) {
  const insets = useSafeAreaInsets();
  const { currentTrack, setTrack } = usePlayerStore();
  const { data: playlist, isError, isLoading, refetch } = usePlaylistCurationQuery(playlistId);

  const [selectedTrackId, setSelectedTrackId] = useState<string>();
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set());
  const [savedTrackIds, setSavedTrackIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!playlist) {
      return;
    }

    const likedIds = playlist.tracks.filter((track) => track.isLiked).map((track) => track.id);
    const savedIds = playlist.tracks.filter((track) => track.isSaved).map((track) => track.id);

    setLikedTrackIds(new Set(likedIds));
    setSavedTrackIds(new Set(savedIds));
  }, [playlist?.id]);

  const selectedTrack = useMemo(
    () => playlist?.tracks.find((track) => track.id === selectedTrackId),
    [playlist?.tracks, selectedTrackId],
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

    setLikedTrackIds((prev) => {
      const next = new Set(prev);

      if (next.has(selectedTrack.id)) {
        next.delete(selectedTrack.id);
      } else {
        next.add(selectedTrack.id);
      }

      return next;
    });
  };

  const toggleSaved = () => {
    if (!selectedTrack) {
      return;
    }

    setSavedTrackIds((prev) => {
      const next = new Set(prev);

      if (next.has(selectedTrack.id)) {
        next.delete(selectedTrack.id);
      } else {
        next.add(selectedTrack.id);
      }

      return next;
    });
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
        isLiked={selectedTrack ? likedTrackIds.has(selectedTrack.id) : false}
        isSaved={selectedTrack ? savedTrackIds.has(selectedTrack.id) : false}
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
