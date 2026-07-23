import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { libraryApi } from '@/api/libraryApi';
import { syncRecommendationEvent } from '@/api/recommendationEventApi';
import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/IconButton';
import { LibraryEmptyState } from '@/components/library/LibraryEmptyState';
import { LibraryTrackRow } from '@/components/library/LibraryTrackRow';
import { PageHeader } from '@/components/PageHeader';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { SettingsRow } from '@/components/SettingsRow';
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
  const {
    data: remoteLibraryRecords = [],
    isError: isRemoteLibraryError,
    isLoading: isRemoteLibraryLoading,
    refetch: refetchRemoteLibrary,
  } = useQuery({
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
  const hasLocalRecords = likedTracks.length > 0 || savedTracks.length > 0;
  const selectedCount =
    selectedTab === 'playlists' ? playlistRecords.length : records.length;
  const selectedSectionTitle =
    selectedTab === 'liked'
      ? '좋아요한 음악'
      : selectedTab === 'saved'
        ? '저장한 음악'
        : '저장한 플레이리스트';

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
        contentContainerStyle={{
          paddingBottom: 132,
          paddingHorizontal: 20,
          paddingTop: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader
          leftContent={
            <IconButton
              label="마이페이지로 돌아가기"
              name="arrow-left"
              onPress={() => router.replace('/my' as never)}
            />
          }
          title="보관함"
        />

        <View className="mt-7 flex-row rounded-full border border-white/10 bg-white/[0.06] p-1">
          {tabs.map((tab) => {
            const isSelected = selectedTab === tab.id;

            return (
              <Pressable
                key={tab.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
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

        <View className="mt-7">
          <SectionTitle
            rightContent={
              <AppText className="text-xs font-semibold text-white/38">
                {selectedCount}개
              </AppText>
            }
            title={selectedSectionTitle}
          />
        </View>

        {actionMessage ? (
          <View className="mt-3 flex-row items-start gap-3 py-2">
            <Feather color="#B7E628" name="check-circle" size={16} />
            <AppText className="min-w-0 flex-1 text-xs leading-5 text-soundlog-lime/75">
              {actionMessage}
            </AppText>
          </View>
        ) : null}

        {isRemoteLibraryLoading && !hasLocalRecords ? (
          <View className="flex-row items-center gap-3 py-6">
            <ActivityIndicator color="#B7E628" />
            <AppText className="text-sm font-medium text-white/62">
              보관함을 동기화하고 있어요
            </AppText>
          </View>
        ) : isRemoteLibraryError ? (
          <SettingsRow
            description={
              hasLocalRecords
                ? '기기에 남아 있는 항목을 먼저 보여드려요.'
                : '네트워크를 확인한 뒤 다시 시도해주세요.'
            }
            icon="alert-circle"
            label="서버 보관함을 불러오지 못했어요"
            onPress={() => void refetchRemoteLibrary()}
            rightText="다시 시도"
          />
        ) : null}

        {isRemoteLibraryLoading && !hasLocalRecords ? null : selectedTab === 'playlists' ? (
          playlistRecords.length === 0 ? (
            <LibraryEmptyState
              description="플레이리스트 상세에서 곡을 저장하면 이곳에 플레이리스트 단위로 묶여요."
              icon="bookmark"
              title="저장한 플레이리스트가 없어요"
            />
          ) : (
            <View className="mt-2">
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
                    accessibilityLabel={`${title} 플레이리스트 열기`}
                    accessibilityRole="button"
                    className="min-h-[76px] flex-row items-center py-2"
                    onPress={() => router.push(`/playlist/${playlist.playlistId}` as never)}
                    style={({ pressed }) => ({ opacity: pressed ? 0.62 : 1 })}
                  >
                    <View
                      className="h-14 w-14 overflow-hidden rounded-lg bg-white/[0.06]"
                      style={{ backgroundColor: representativeRecord?.track.fallbackColor ?? '#2B176C' }}
                    >
                      {imageUrl ? (
                        <Image className="h-full w-full" contentFit="cover" source={{ uri: imageUrl }} />
                      ) : null}
                    </View>
                    <View className="ml-3 min-w-0 flex-1">
                      <AppText className="text-base font-semibold text-white" numberOfLines={1}>
                        {title}
                      </AppText>
                      <AppText className="mt-1 text-xs text-white/48" numberOfLines={1}>
                        {description}
                      </AppText>
                      <AppText className="mt-1.5 text-[11px] text-white/34" numberOfLines={1}>
                        저장곡 {playlist.records.length}
                        {playlist.playlist?.durationText
                          ? ` · ${playlist.playlist.durationText}`
                          : ''}
                      </AppText>
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
          <View className="mt-2">
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
