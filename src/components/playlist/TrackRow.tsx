import { Feather } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { ResilientImage } from '@/components/media/ResilientImage';
import { Track } from '@/types/domain';
import { getTrackKeyColor, hexToRgba } from '@/utils/trackVisuals';

type TrackRowProps = {
  fallbackImageUrl?: string;
  isActive: boolean;
  isLiked: boolean;
  isSaved: boolean;
  onPress: (track: Track) => void;
  onToggleLike: (track: Track) => void;
  onToggleSave: (track: Track) => void;
  track: Track;
};

export function TrackRow({
  fallbackImageUrl,
  isActive,
  isLiked,
  isSaved,
  onPress,
  onToggleLike,
  onToggleSave,
  track,
}: TrackRowProps) {
  const keyColor = getTrackKeyColor(track);
  const activeBackground = hexToRgba(keyColor, 0.16);
  const artworkUrl = track.albumImageUrl ?? fallbackImageUrl;

  return (
    <View
      className="mx-5 min-h-[72px] flex-row items-center border-b border-white/[0.06] px-1 py-2"
      style={{
        backgroundColor: isActive ? activeBackground : 'rgba(255,255,255,0.04)',
      }}
    >
      <Pressable
        accessibilityLabel={`${track.title} SoundLog 음악으로 선택`}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
        className="min-w-0 flex-1 flex-row items-center py-1"
        onPress={() => onPress(track)}
      >
        <View
          className="h-[52px] w-[52px] overflow-hidden rounded-lg"
          style={{
            backgroundColor: hexToRgba(keyColor, 0.24),
          }}
        >
          <ResilientImage
            accessibilityLabel={`${track.title} 앨범 이미지`}
            contentFit="cover"
            fallbackVariant="music"
            style={{ flex: 1 }}
            uri={artworkUrl}
          />
        </View>

        <View className="ml-3 min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <AppText className="min-w-0 flex-1 text-base font-semibold text-white" numberOfLines={1}>
              {track.title}
            </AppText>
            {isActive ? <Feather color="#B7E628" name="check" size={14} /> : null}
          </View>
          <AppText className="mt-1 text-xs font-medium text-white/58" numberOfLines={1}>
            {track.artist}
          </AppText>
        </View>
      </Pressable>

      <Pressable
        accessibilityLabel={isLiked ? `${track.title} 좋아요 취소` : `${track.title} 좋아요`}
        accessibilityRole="button"
        accessibilityState={{ selected: isLiked }}
        className="h-11 w-11 items-center justify-center"
        onPress={() => onToggleLike(track)}
      >
        <Feather
          color={isLiked ? '#FF9ACF' : 'rgba(255,255,255,0.48)'}
          name="heart"
          size={18}
        />
      </Pressable>

      <Pressable
        accessibilityLabel={isSaved ? `${track.title} 저장 취소` : `${track.title} 저장`}
        accessibilityRole="button"
        accessibilityState={{ selected: isSaved }}
        className="h-11 w-11 items-center justify-center"
        onPress={() => onToggleSave(track)}
      >
        <Feather
          color={isSaved ? '#B7E628' : 'rgba(255,255,255,0.48)'}
          name="bookmark"
          size={18}
        />
      </Pressable>
    </View>
  );
}
