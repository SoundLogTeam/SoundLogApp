import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Track } from '@/types/domain';
import { getTrackKeyColor, hexToRgba } from '@/utils/trackVisuals';

type TrackRowProps = {
  isActive: boolean;
  isLiked: boolean;
  isSaved: boolean;
  onPress: (track: Track) => void;
  onToggleLike: (track: Track) => void;
  onToggleSave: (track: Track) => void;
  track: Track;
};

export function TrackRow({
  isActive,
  isLiked,
  isSaved,
  onPress,
  onToggleLike,
  onToggleSave,
  track,
}: TrackRowProps) {
  const keyColor = getTrackKeyColor(track);
  const activeBackground = hexToRgba(keyColor, 0.78);
  const activeGlow = hexToRgba(keyColor, 0.24);

  return (
    <View
      className="mx-5 mb-2 min-h-[72px] overflow-hidden rounded-[18px] border"
      style={{
        backgroundColor: isActive ? activeBackground : 'rgba(255,255,255,0.04)',
        borderColor: isActive ? hexToRgba(keyColor, 0.95) : 'rgba(255,255,255,0.08)',
      }}
    >
      <LinearGradient
        colors={[
          isActive ? activeGlow : 'rgba(255,255,255,0.04)',
          isActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0)',
        ]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={{
          bottom: 0,
          left: 0,
          pointerEvents: 'none',
          position: 'absolute',
          right: 0,
          top: 0,
        }}
      />

      <View className="min-h-[72px] flex-row items-center px-3">
        <Pressable
          accessibilityLabel={`${track.title} SoundLog 음악으로 선택`}
          accessibilityRole="button"
          className="min-w-0 flex-1 flex-row items-center"
          onPress={() => onPress(track)}
        >
          <View
            className="h-[52px] w-[52px] overflow-hidden rounded-[14px]"
            style={{
              backgroundColor: hexToRgba(keyColor, 0.24),
            }}
          >
            {track.albumImageUrl ? (
              <Image contentFit="cover" source={{ uri: track.albumImageUrl }} style={{ flex: 1 }} />
            ) : (
              <View className="flex-1" style={{ backgroundColor: hexToRgba(keyColor, 0.32) }} />
            )}
          </View>

          <View className="ml-3 min-w-0 flex-1">
            <View className="flex-row items-center gap-2">
              <AppText className="max-w-[82%] text-base font-semibold text-white" numberOfLines={1}>
                {track.title}
              </AppText>
              {isLiked ? <Feather color="#F5D0FE" name="heart" size={12} /> : null}
              {isSaved ? <Feather color="#DDD6FE" name="bookmark" size={12} /> : null}
            </View>
            <AppText className="mt-1 text-xs font-medium text-white/65" numberOfLines={1}>
              {track.artist}
            </AppText>
          </View>
        </Pressable>

        <View className="ml-2 flex-row items-center gap-1.5">
          <Pressable
            accessibilityLabel={isLiked ? `${track.title} 좋아요 취소` : `${track.title} 좋아요`}
            accessibilityRole="button"
            className="h-9 w-9 items-center justify-center rounded-full bg-white/10"
            onPress={() => onToggleLike(track)}
          >
            <Feather color={isLiked ? '#F5D0FE' : '#fff'} name="heart" size={16} />
          </Pressable>

          <Pressable
            accessibilityLabel={isSaved ? `${track.title} 저장 취소` : `${track.title} 저장`}
            accessibilityRole="button"
            className="h-9 items-center justify-center rounded-full bg-white/10 px-3"
            onPress={() => onToggleSave(track)}
          >
            <AppText className="text-xs font-semibold text-white">
              {isSaved ? '저장됨' : '저장'}
            </AppText>
          </Pressable>

          <Pressable
            accessibilityLabel={`${track.title} 외부 링크 패널 열기`}
            accessibilityRole="button"
            className={`h-9 items-center justify-center rounded-full px-3 ${
              isActive ? 'bg-white' : 'bg-white/10'
            }`}
            onPress={() => onPress(track)}
          >
            <AppText
              className={`text-xs font-semibold ${isActive ? 'text-[#050916]' : 'text-white'}`}
            >
              열기
            </AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
