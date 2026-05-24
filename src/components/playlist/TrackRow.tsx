import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Track } from '@/types/domain';

type TrackRowProps = {
  isActive: boolean;
  isLiked: boolean;
  isSaved: boolean;
  onMore: (track: Track) => void;
  onPress: (track: Track) => void;
  track: Track;
};

export function TrackRow({ isActive, isLiked, isSaved, onMore, onPress, track }: TrackRowProps) {
  return (
    <Pressable
      className="h-[66px] flex-row items-center px-5"
      onPress={() => onPress(track)}
      style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.08)' : 'transparent' }}
    >
      <View
        className="h-[42px] w-[42px] overflow-hidden rounded-[10px] border"
        style={{
          backgroundColor: track.fallbackColor ?? '#fff',
          borderColor: isActive ? '#8B5CF6' : 'rgba(255,255,255,0.08)',
        }}
      >
        {track.albumImageUrl ? (
          <Image contentFit="cover" source={{ uri: track.albumImageUrl }} style={{ flex: 1 }} />
        ) : null}
      </View>

      <View className="ml-3 flex-1">
        <View className="flex-row items-center gap-2">
          <AppText className="max-w-[82%] text-base font-medium text-white" numberOfLines={1}>
            {track.title}
          </AppText>
          {isLiked ? <Feather color="#E879F9" name="heart" size={12} /> : null}
          {isSaved ? <Feather color="#C4B5FD" name="bookmark" size={12} /> : null}
        </View>
        <AppText className="mt-1 text-xs text-white/50" numberOfLines={1}>
          {track.artist}
        </AppText>
      </View>

      <Pressable
        accessibilityLabel={`${track.title} 더보기`}
        accessibilityRole="button"
        className="h-11 w-11 items-center justify-center rounded-full"
        onPress={() => onMore(track)}
      >
        <Feather color="#fff" name="more-horizontal" size={22} />
      </Pressable>
    </Pressable>
  );
}
