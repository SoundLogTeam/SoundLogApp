import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { LibraryEmptyState } from '@/components/library/LibraryEmptyState';
import { LibraryTrackRow } from '@/components/library/LibraryTrackRow';
import { Screen } from '@/components/Screen';
import { useLibraryStore } from '@/store/libraryStore';
import { usePlayerStore } from '@/store/playerStore';

type LibraryTab = 'liked' | 'saved';

const tabs: Array<{ id: LibraryTab; label: string }> = [
  { id: 'liked', label: '좋아요' },
  { id: 'saved', label: '저장한 곡' },
];

export function LibraryScreen() {
  const [selectedTab, setSelectedTab] = useState<LibraryTab>('liked');
  const { likedTracks, removeLikedTrack, removeSavedTrack, savedTracks } = useLibraryStore();
  const setTrack = usePlayerStore((state) => state.setTrack);
  const records = selectedTab === 'liked' ? likedTracks : savedTracks;

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
                onPress={() => setSelectedTab(tab.id)}
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
                actionIcon={selectedTab === 'liked' ? 'heart' : 'bookmark'}
                actionLabel={selectedTab === 'liked' ? '좋아요 취소' : '저장 취소'}
                onPress={() => setTrack(record.track, record.playlistId)}
                onRemove={() =>
                  selectedTab === 'liked'
                    ? removeLikedTrack(record.track.id)
                    : removeSavedTrack(record.track.id)
                }
                record={record}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
