import { useState } from 'react';
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
import { createRecommendationEventContext } from '@/utils/recommendationEventContext';

type LibraryTab = 'liked' | 'saved';

const tabs: Array<{ id: LibraryTab; label: string }> = [
  { id: 'liked', label: '좋아요' },
  { id: 'saved', label: '저장한 곡' },
];

export function LibraryScreen() {
  const [selectedTab, setSelectedTab] = useState<LibraryTab>('liked');
  const [selectedRecord, setSelectedRecord] = useState<LibraryTrackRecord>();
  const { isLiked, isSaved, likedTracks, savedTracks, toggleLike, toggleSave } = useLibraryStore();
  const setTrack = usePlayerStore((state) => state.setTrack);
  const addRecommendationEvent = useRecommendationEventStore((state) => state.addEvent);
  const records = selectedTab === 'liked' ? likedTracks : savedTracks;
  const selectedTrack = selectedRecord?.track;
  const selectedTrackLiked = isLiked(selectedTrack?.id);
  const selectedTrackSaved = isSaved(selectedTrack?.id);

  const closeMenu = () => setSelectedRecord(undefined);
  const selectTab = (tab: LibraryTab) => {
    setSelectedTab(tab);
    closeMenu();
  };
  const playRecord = (record: LibraryTrackRecord) => {
    setTrack(record.track, record.playlistId);
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
    toggleLike(selectedRecord.track, selectedRecord.playlistId);
    void libraryApi
      .updateTrackState(selectedRecord.track.id, {
        action: nextLiked ? 'like' : 'unlike',
        context,
        playlistId: selectedRecord.playlistId,
      })
      .catch(() => undefined);
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
    toggleSave(selectedRecord.track, selectedRecord.playlistId);
    void libraryApi
      .updateTrackState(selectedRecord.track.id, {
        action: nextSaved ? 'save' : 'unsave',
        context,
        playlistId: selectedRecord.playlistId,
      })
      .catch(() => undefined);
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

        {records.length === 0 ? (
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
