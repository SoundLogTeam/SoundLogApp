import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { TrackActionMenu } from '@/components/playlist/TrackActionMenu';
import { getMiniPlayerBottom } from '@/constants/layout';
import { useLibraryStore } from '@/store/libraryStore';
import { usePlayerStore } from '@/store/playerStore';
import { useRecommendationEventStore } from '@/store/recommendationEventStore';
import { createRecommendationEventContext } from '@/utils/recommendationEventContext';

export function MiniPlayer() {
  const insets = useSafeAreaInsets();
  const { currentTrack, isPlaying, playlistId, toggle } = usePlayerStore();
  const { isLiked, isSaved, toggleLike, toggleSave } = useLibraryStore();
  const addRecommendationEvent = useRecommendationEventStore((state) => state.addEvent);
  const [isActionMenuVisible, setIsActionMenuVisible] = useState(false);

  if (!currentTrack) {
    return null;
  }

  const liked = isLiked(currentTrack.id);
  const saved = isSaved(currentTrack.id);
  const handleToggleLike = () => {
    toggleLike(currentTrack, playlistId);
    addRecommendationEvent({
      context: createRecommendationEventContext(),
      playlistId,
      trackId: currentTrack.id,
      type: liked ? 'track_unlike' : 'track_like',
    });
  };
  const handleTogglePlayback = () => {
    toggle();
    addRecommendationEvent({
      context: createRecommendationEventContext(),
      playlistId,
      trackId: currentTrack.id,
      type: isPlaying ? 'track_pause' : 'track_resume',
    });
  };
  const handleToggleSave = () => {
    toggleSave(currentTrack, playlistId);
    addRecommendationEvent({
      context: createRecommendationEventContext(),
      playlistId,
      trackId: currentTrack.id,
      type: saved ? 'track_unsave' : 'track_save',
    });
  };

  return (
    <>
      <View
        className="absolute left-5 right-5 h-[67px] flex-row items-center rounded-[20px] bg-soundlog-player px-4"
        style={{ bottom: getMiniPlayerBottom(insets.bottom) }}
      >
        <View
          className="h-[42px] w-[42px] rounded-[10px]"
          style={{ backgroundColor: currentTrack.fallbackColor ?? '#fff' }}
        />
        <View className="ml-3 min-w-0 flex-1">
          <AppText className="text-base font-medium text-white" numberOfLines={1}>
            {currentTrack.title}
          </AppText>
          <AppText className="text-xs text-white/60" numberOfLines={1}>
            {currentTrack.artist}
          </AppText>
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable
            accessibilityLabel={liked ? '좋아요 취소' : '좋아요'}
            accessibilityRole="button"
            className="h-9 w-9 items-center justify-center"
            onPress={handleToggleLike}
          >
            <Feather color={liked ? '#E879F9' : '#fff'} name="heart" size={18} />
          </Pressable>
          <Pressable
            accessibilityLabel={isPlaying ? '일시정지' : '재생'}
            accessibilityRole="button"
            className="h-9 w-9 items-center justify-center"
            onPress={handleTogglePlayback}
          >
            <Feather color="#fff" name={isPlaying ? 'pause' : 'play'} size={18} />
          </Pressable>
          <Pressable
            accessibilityLabel="현재 곡 옵션 열기"
            accessibilityRole="button"
            className="h-9 w-9 items-center justify-center"
            onPress={() => setIsActionMenuVisible(true)}
          >
            <Feather color="#fff" name="more-horizontal" size={18} />
          </Pressable>
        </View>
      </View>

      <TrackActionMenu
        isLiked={liked}
        isSaved={saved}
        onClose={() => setIsActionMenuVisible(false)}
        onToggleLike={handleToggleLike}
        onToggleSave={handleToggleSave}
        track={currentTrack}
        visible={isActionMenuVisible}
      />
    </>
  );
}
