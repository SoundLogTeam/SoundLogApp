import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { libraryApi } from '@/api/libraryApi';
import { syncRecommendationEvent } from '@/api/recommendationEventApi';
import { AppText } from '@/components/AppText';
import { LibraryEmptyState } from '@/components/library/LibraryEmptyState';
import { LibraryTrackRow } from '@/components/library/LibraryTrackRow';
import { Screen } from '@/components/Screen';
import { LibraryTrackRecord, useLibraryStore } from '@/store/libraryStore';
import { usePlayerStore } from '@/store/playerStore';
import { useRecommendationEventStore } from '@/store/recommendationEventStore';
import type { LibraryPlaylistSummary } from '@/types/domain';
import { createRecommendationEventContext } from '@/utils/recommendationEventContext';

type LibraryTab = 'liked' | 'playlists' | 'saved';
type LibraryPlaylistRecord = {
  createdAt: string;
  playlist?: LibraryPlaylistSummary;
  playlistId: string;
  records: LibraryTrackRecord[];
};

const tabs: Array<{ id: LibraryTab; label: string }> = [
  { id: 'liked', label: '좋아요' },
  { id: 'saved', label: '저장곡' },
  { id: 'playlists', label: '플레이리스트' },
];

function getPlaylistTitle(playlist?: LibraryPlaylistSummary, playlistId?: string) {
  const placeLabel = playlist?.placeName ?? playlist?.regionName;

  if (placeLabel) {
    return `${placeLabel} 사운드트랙`;
  }

  return playlistId ? '저장한 사운드트랙' : '저장한 플레이리스트';
}

function getPlaylistDescription(playlist?: LibraryPlaylistSummary) {
  return (
    playlist?.reason ||
    playlist?.description ||
    [playlist?.durationText, playlist?.trackCount ? `${playlist.trackCount}곡` : undefined]
      .filter(Boolean)
      .join(' · ') ||
    '다시 듣고 싶은 곡을 모아둔 추천 목록'
  );
}

export function LibraryScreen() {
  const [selectedTab, setSelectedTab] = useState<LibraryTab>('liked');
  const [actionMessage, setActionMessage] = useState<string>();
  const {
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
        existingGroup.playlist ??= record.playlist;
        return;
      }

      groupMap.set(playlistId, {
        createdAt: record.createdAt,
        playlist: record.playlist,
        playlistId,
        records: [record],
      });
    });

    return Array.from(groupMap.values()).sort((first, second) =>
      second.createdAt.localeCompare(first.createdAt),
    );
  }, [savedTracks]);
  const records = selectedTab === 'liked' ? likedTracks : savedTracks;

  useEffect(() => {
    remoteLibraryRecords.forEach((record) => {
      if (record.track.isLiked || record.kind === 'liked') {
        setLikeState(record.track, true, record.playlistId, record.playlist);
      }

      if (record.track.isSaved || record.kind === 'saved') {
        setSaveState(record.track, true, record.playlistId, record.playlist);
      }
    });
  }, [remoteLibraryRecords, setLikeState, setSaveState]);

  const clearActionMessage = () => {
    setActionMessage(undefined);
  };
  const selectTab = (tab: LibraryTab) => {
    setSelectedTab(tab);
    clearActionMessage();
  };
  const playRecord = (record: LibraryTrackRecord) => {
    setActionMessage(undefined);
    setTrack(record.track, record.playlistId, undefined, record.playlist);
    setActionMessage('이 곡을 SoundLog 음악으로 선택했어요. 하단 패널에서 저장하거나 리캡에 담을 수 있어요.');
  };
  const removeRecord = (record: LibraryTrackRecord) => {
    const context = createRecommendationEventContext();
    const isRemovingLikedTrack = selectedTab === 'liked';

    setActionMessage(undefined);

    if (isRemovingLikedTrack) {
      setLikeState(record.track, false, record.playlistId);
      void libraryApi
        .updateTrackState(record.track.id, {
          action: 'unlike',
          context,
          playlistId: record.playlistId,
        })
        .catch(() => {
          setLikeState(record.track, true, record.playlistId, record.playlist);
          setActionMessage('서버 저장에 실패해서 좋아요 상태를 되돌렸어요.');
        });
      syncRecommendationEvent(
        addRecommendationEvent({
          context,
          playlistId: record.playlistId,
          trackId: record.track.id,
          type: 'track_unlike',
        }),
      );
      setActionMessage('좋아요 목록에서 삭제했어요.');
      return;
    }

    setSaveState(record.track, false, record.playlistId);
    void libraryApi
      .updateTrackState(record.track.id, {
        action: 'unsave',
        context,
        playlistId: record.playlistId,
      })
      .catch(() => {
        setSaveState(record.track, true, record.playlistId, record.playlist);
        setActionMessage('서버 저장에 실패해서 저장 상태를 되돌렸어요.');
      });
    syncRecommendationEvent(
      addRecommendationEvent({
        context,
        playlistId: record.playlistId,
        trackId: record.track.id,
        type: 'track_unsave',
      }),
    );
    setActionMessage('저장곡 목록에서 삭제했어요.');
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ gap: 18, paddingBottom: 132, paddingHorizontal: 20, paddingTop: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <AppText className="text-[28px] font-semibold text-white">보관함</AppText>
          <AppText className="mt-2 text-sm leading-6 text-white/55">
            좋아요한 음악, 저장곡, 플레이리스트를 모아둬요.
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

        {actionMessage ? (
          <View className="rounded-[14px] border border-amber-300/20 bg-amber-300/10 px-4 py-3">
            <AppText className="text-center text-xs leading-5 text-amber-100">
              {actionMessage}
            </AppText>
          </View>
        ) : null}

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
                const imageUrl =
                  playlist.playlist?.coverImageUrl ??
                  playlist.playlist?.backgroundImageUrl ??
                  representativeRecord?.track.albumImageUrl;
                const title = getPlaylistTitle(playlist.playlist, playlist.playlistId);
                const description = getPlaylistDescription(playlist.playlist);

                return (
                  <Pressable
                    key={playlist.playlistId}
                    accessibilityRole="button"
                    className="flex-row items-center rounded-[18px] border border-white/10 bg-white/10 p-4"
                    onPress={() => representativeRecord && playRecord(representativeRecord)}
                  >
                    <View
                      className="h-[72px] w-[72px] overflow-hidden rounded-[18px] bg-white/10"
                      style={{ backgroundColor: representativeRecord?.track.fallbackColor ?? '#2B176C' }}
                    >
                      {imageUrl ? (
                        <Image className="h-full w-full" contentFit="cover" source={{ uri: imageUrl }} />
                      ) : null}
                    </View>
                    <View className="ml-4 min-w-0 flex-1">
                      <View className="flex-row items-center gap-2">
                        <View className="rounded-full bg-soundlog-lime/15 px-2.5 py-1">
                          <AppText className="text-[10px] font-semibold text-soundlog-lime">
                            저장곡 {playlist.records.length}
                          </AppText>
                        </View>
                        {playlist.playlist?.durationText ? (
                          <AppText className="text-[11px] text-white/35">
                            {playlist.playlist.durationText}
                          </AppText>
                        ) : null}
                      </View>
                      <AppText className="mt-2 text-base font-semibold text-white" numberOfLines={1}>
                        {title}
                      </AppText>
                      <AppText className="mt-1 text-xs leading-5 text-white/55" numberOfLines={2}>
                        {description}
                      </AppText>
                      {representativeRecord ? (
                        <AppText className="mt-2 text-xs font-semibold text-soundlog-lime" numberOfLines={1}>
                          대표곡 · {representativeRecord.track.title} / {representativeRecord.track.artist}
                        </AppText>
                      ) : null}
                    </View>
                    <Feather color="rgba(255,255,255,0.45)" name="chevron-right" size={18} />
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
                onPress={() => playRecord(record)}
                onRemove={() => removeRecord(record)}
                record={record}
              />
            ))}
          </View>
        )}

      </ScrollView>
    </Screen>
  );
}
