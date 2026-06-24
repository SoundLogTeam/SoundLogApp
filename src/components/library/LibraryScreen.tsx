import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { libraryApi } from '@/api/libraryApi';
import { syncRecommendationEvent } from '@/api/recommendationEventApi';
import { AppText } from '@/components/AppText';
import { LibraryEmptyState } from '@/components/library/LibraryEmptyState';
import { LibraryTrackRow } from '@/components/library/LibraryTrackRow';
import { TrackActionMenu } from '@/components/playlist/TrackActionMenu';
import { Screen } from '@/components/Screen';
import { LibraryTrackRecord, useLibraryStore } from '@/store/libraryStore';
import { usePlayerStore } from '@/store/playerStore';
import { useRecommendationEventStore } from '@/store/recommendationEventStore';
import {
  getSpotifyPlaybackFailureMessage,
  playSelectedSpotifyOrFallback,
} from '@/spotify/spotifyPlayback';
import { createRecommendationEventContext } from '@/utils/recommendationEventContext';

type LibraryTab = 'liked' | 'playlists' | 'saved';
type LibraryPlaylistRecord = {
  createdAt: string;
  playlistId: string;
  records: LibraryTrackRecord[];
};

const tabs: Array<{ id: LibraryTab; label: string }> = [
  { id: 'liked', label: '좋아요' },
  { id: 'saved', label: '저장한 곡' },
  { id: 'playlists', label: '저장한 PL' },
];

export function LibraryScreen() {
  const [selectedTab, setSelectedTab] = useState<LibraryTab>('liked');
  const [selectedRecord, setSelectedRecord] = useState<LibraryTrackRecord>();
  const [actionMessage, setActionMessage] = useState<string>();
  const {
    isLiked,
    isSaved,
    likedTracks,
    savedTracks,
    setLikeState,
    setSaveState,
  } = useLibraryStore();
  const setTrack = usePlayerStore((state) => state.setTrack);
  const addRecommendationEvent = useRecommendationEventStore((state) => state.addEvent);
  const { data: remoteLibraryRecords = [] } = useQuery({
    queryFn: () => libraryApi.getTracks('all'),
    queryKey: ['library', 'tracks', 'all'],
    staleTime: 5 * 60 * 1000,
  });
  const playlistRecords = useMemo<LibraryPlaylistRecord[]>(() => {
    const groupMap = new Map<string, LibraryPlaylistRecord>();

    savedTracks.forEach((record) => {
      const playlistId = record.playlistId;

      if (!playlistId) {
        return;
      }

      const existingGroup = groupMap.get(playlistId);

      if (existingGroup) {
        existingGroup.records.push(record);
        if (record.createdAt > existingGroup.createdAt) {
          existingGroup.createdAt = record.createdAt;
        }
        return;
      }

      groupMap.set(playlistId, {
        createdAt: record.createdAt,
        playlistId,
        records: [record],
      });
    });

    return Array.from(groupMap.values()).sort((first, second) =>
      second.createdAt.localeCompare(first.createdAt),
    );
  }, [savedTracks]);
  const records = selectedTab === 'liked' ? likedTracks : savedTracks;
  const selectedTrack = selectedRecord?.track;
  const selectedTrackLiked = isLiked(selectedTrack?.id);
  const selectedTrackSaved = isSaved(selectedTrack?.id);

  useEffect(() => {
    remoteLibraryRecords.forEach((record) => {
      if (record.track.isLiked || record.kind === 'liked') {
        setLikeState(record.track, true, record.playlistId);
      }

      if (record.track.isSaved || record.kind === 'saved') {
        setSaveState(record.track, true, record.playlistId);
      }
    });
  }, [remoteLibraryRecords, setLikeState, setSaveState]);

  const closeMenu = () => {
    setSelectedRecord(undefined);
    setActionMessage(undefined);
  };
  const selectTab = (tab: LibraryTab) => {
    setSelectedTab(tab);
    closeMenu();
  };
  const playRecord = (record: LibraryTrackRecord) => {
    setActionMessage(undefined);
    setTrack(record.track, record.playlistId);
    void playSelectedSpotifyOrFallback(record.track).then((spotifyResult) => {
      if (!spotifyResult.ok) {
        setActionMessage(getSpotifyPlaybackFailureMessage(spotifyResult.code));
      }
    });
    syncRecommendationEvent(
      addRecommendationEvent({
        context: createRecommendationEventContext(),
        playlistId: record.playlistId,
        trackId: record.track.id,
        type: 'track_play',
      }),
    );
  };
  const toggleSelectedLike = () => {
    if (!selectedRecord) {
      return;
    }

    const nextLiked = !isLiked(selectedRecord.track.id);
    const context = createRecommendationEventContext();
    setActionMessage(undefined);
    setLikeState(selectedRecord.track, nextLiked, selectedRecord.playlistId);
    void libraryApi
      .updateTrackState(selectedRecord.track.id, {
        action: nextLiked ? 'like' : 'unlike',
        context,
        playlistId: selectedRecord.playlistId,
      })
      .catch(() => {
        setLikeState(selectedRecord.track, !nextLiked, selectedRecord.playlistId);
        setActionMessage('서버 저장에 실패해서 좋아요 상태를 되돌렸어요.');
      });
    syncRecommendationEvent(
      addRecommendationEvent({
        context,
        playlistId: selectedRecord.playlistId,
        trackId: selectedRecord.track.id,
        type: nextLiked ? 'track_like' : 'track_unlike',
      }),
    );

    if (selectedTab === 'liked' && !nextLiked) {
      closeMenu();
    }
  };
  const toggleSelectedSave = () => {
    if (!selectedRecord) {
      return;
    }

    const nextSaved = !isSaved(selectedRecord.track.id);
    const context = createRecommendationEventContext();
    setActionMessage(undefined);
    setSaveState(selectedRecord.track, nextSaved, selectedRecord.playlistId);
    void libraryApi
      .updateTrackState(selectedRecord.track.id, {
        action: nextSaved ? 'save' : 'unsave',
        context,
        playlistId: selectedRecord.playlistId,
      })
      .catch(() => {
        setSaveState(selectedRecord.track, !nextSaved, selectedRecord.playlistId);
        setActionMessage('서버 저장에 실패해서 저장 상태를 되돌렸어요.');
      });
    syncRecommendationEvent(
      addRecommendationEvent({
        context,
        playlistId: selectedRecord.playlistId,
        trackId: selectedRecord.track.id,
        type: nextSaved ? 'track_save' : 'track_unsave',
      }),
    );

    if (selectedTab === 'saved' && !nextSaved) {
      closeMenu();
    }
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ gap: 18, paddingBottom: 132, paddingHorizontal: 20, paddingTop: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <AppText className="text-[28px] font-semibold text-white">Library</AppText>
          <AppText className="mt-2 text-sm leading-6 text-white/55">
            좋아요한 음악과 다시 듣고 싶은 곡을 모아둬요.
          </AppText>
        </View>

        <View className="flex-row rounded-full border border-white/10 bg-white/10 p-1">
          {tabs.map((tab) => {
            const isSelected = selectedTab === tab.id;

            return (
              <Pressable
                key={tab.id}
                className="h-10 flex-1 items-center justify-center rounded-full"
                onPress={() => selectTab(tab.id)}
                style={{ backgroundColor: isSelected ? '#ffffff' : 'transparent' }}
              >
                <AppText
                  className="text-sm font-semibold"
                  style={{ color: isSelected ? '#050916' : 'rgba(255,255,255,0.65)' }}
                >
                  {tab.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        {selectedTab === 'playlists' ? (
          playlistRecords.length === 0 ? (
            <LibraryEmptyState
              description="플레이리스트 상세에서 곡을 저장하면 이곳에 플레이리스트 단위로 묶여요."
              icon="bookmark"
              title="저장한 플레이리스트가 없어요"
            />
          ) : (
            <View className="gap-3">
              {playlistRecords.map((playlist) => {
                const representativeRecord = playlist.records[0];

                return (
                  <Pressable
                    key={playlist.playlistId}
                    accessibilityRole="button"
                    className="rounded-[18px] border border-white/10 bg-white/10 p-4"
                    onPress={() => representativeRecord && playRecord(representativeRecord)}
                  >
                    <AppText className="text-base font-semibold text-white" numberOfLines={1}>
                      {playlist.playlistId}
                    </AppText>
                    <AppText className="mt-1 text-xs text-white/55">
                      저장한 곡 {playlist.records.length}개
                    </AppText>
                    {representativeRecord ? (
                      <AppText className="mt-3 text-sm font-semibold text-soundlog-lime" numberOfLines={1}>
                        {representativeRecord.track.title} · {representativeRecord.track.artist}
                      </AppText>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          )
        ) : records.length === 0 ? (
          <LibraryEmptyState
            description={
              selectedTab === 'liked'
                ? '마음에 드는 음악에 하트를 눌러보세요.'
                : '다시 듣고 싶은 음악을 저장해보세요.'
            }
            icon={selectedTab === 'liked' ? 'heart' : 'bookmark'}
            title={selectedTab === 'liked' ? '좋아요한 음악이 없어요' : '저장한 음악이 없어요'}
          />
        ) : (
          <View className="gap-3">
            {records.map((record) => (
              <LibraryTrackRow
                key={record.track.id}
                onOpenActions={() => setSelectedRecord(record)}
                onPress={() => playRecord(record)}
                record={record}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <TrackActionMenu
        actionMessage={actionMessage}
        isLiked={selectedTrackLiked}
        isSaved={selectedTrackSaved}
        onClose={closeMenu}
        onToggleLike={toggleSelectedLike}
        onToggleSave={toggleSelectedSave}
        track={selectedTrack}
        visible={Boolean(selectedRecord)}
      />
    </Screen>
  );
}
