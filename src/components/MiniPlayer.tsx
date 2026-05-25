import { Feather } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { getMiniPlayerBottom } from '@/constants/layout';
import { useLibraryStore } from '@/store/libraryStore';
import { usePlayerStore } from '@/store/playerStore';
import { useRecommendationEventStore } from '@/store/recommendationEventStore';
import { createRecommendationEventContext } from '@/utils/recommendationEventContext';

export function MiniPlayer() {
  const insets = useSafeAreaInsets();
  const { currentTrack, isPlaying, playlistId, toggle } = usePlayerStore();
  const { isLiked, toggleLike } = useLibraryStore();
  const addRecommendationEvent = useRecommendationEventStore((state) => state.addEvent);

  if (!currentTrack) {
    return null;
  }

  const liked = isLiked(currentTrack.id);
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

  return (
    <View
      className="absolute left-5 right-5 h-[67px] flex-row items-center rounded-[20px] bg-soundlog-player px-4"
      style={{ bottom: getMiniPlayerBottom(insets.bottom) }}
    >
      <View
        className="h-[42px] w-[42px] rounded-[10px]"
        style={{ backgroundColor: currentTrack.fallbackColor ?? '#fff' }}
      />
      <View className="ml-3 flex-1">
        <AppText className="text-base font-medium text-white">{currentTrack.title}</AppText>
        <AppText className="text-xs text-white/60">{currentTrack.artist}</AppText>
      </View>
      <View className="flex-row items-center gap-3">
        <Pressable
          accessibilityLabel={liked ? '좋아요 취소' : '좋아요'}
          accessibilityRole="button"
          className="h-9 w-9 items-center justify-center"
          onPress={handleToggleLike}
        >
          <Feather color={liked ? '#E879F9' : '#fff'} name="heart" size={18} />
        </Pressable>
        <Feather color="#fff" name="skip-back" size={18} />
        <Pressable
          accessibilityLabel={isPlaying ? '일시정지' : '재생'}
          accessibilityRole="button"
          className="h-9 w-9 items-center justify-center"
          onPress={handleTogglePlayback}
        >
          <Feather color="#fff" name={isPlaying ? 'pause' : 'play'} size={18} />
        </Pressable>
        <Feather color="#fff" name="skip-forward" size={18} />
      </View>
    </View>
  );
}
