import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import type { MomentLog } from '@/types/domain';

import { formatKoreanDateTime } from './travelFormat';
import { moodLabelByValue } from './travelData';

type MomentCardProps = {
  item: MomentLog;
  onPress?: () => void;
};

export function MomentCard({ item, onPress }: MomentCardProps) {
  const moodLabel = item.moodTags[0] ? moodLabelByValue[item.moodTags[0]] : '무드 기록';

  return (
    <Pressable
      accessibilityLabel={`${item.placeName ?? '저장한 순간'} Music Log 열기`}
      accessibilityRole={onPress ? 'button' : undefined}
      className="min-h-[132px] flex-row overflow-hidden rounded-[22px] border border-white/10 bg-white/10"
      disabled={!onPress}
      onPress={onPress}
    >
      <View className="h-full w-[108px] bg-white/10">
        {item.photoUri ? (
          <Image contentFit="cover" source={{ uri: item.photoUri }} style={{ flex: 1 }} />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Feather color="rgba(255,255,255,0.55)" name="camera" size={22} />
          </View>
        )}
      </View>

      <View className="min-w-0 flex-1 justify-between p-4">
        <View>
          <View className="flex-row items-center gap-2">
            <View className="rounded-full bg-white/10 px-2.5 py-1">
              <AppText className="text-[10px] font-semibold text-white/70">Moment</AppText>
            </View>
            <AppText className="text-[11px] font-semibold text-soundlog-lime">
              {moodLabel}
            </AppText>
          </View>

          <View className="mt-3 flex-row items-center gap-2">
            <Feather color="rgba(255,255,255,0.6)" name="map-pin" size={13} />
            <AppText className="min-w-0 flex-1 text-sm font-semibold text-white" numberOfLines={1}>
              {item.placeName ?? '위치 없음'}
            </AppText>
          </View>

          <View className="mt-2 flex-row items-center gap-2">
            <Feather color="rgba(255,255,255,0.6)" name="music" size={13} />
            <AppText className="min-w-0 flex-1 text-xs text-white/65" numberOfLines={1}>
              {item.track ? `${item.track.title} - ${item.track.artist}` : '음악 없음'}
            </AppText>
          </View>
        </View>

        <AppText className="text-[11px] text-white/45">
          {formatKoreanDateTime(item.createdAt)}
        </AppText>
      </View>
    </Pressable>
  );
}
