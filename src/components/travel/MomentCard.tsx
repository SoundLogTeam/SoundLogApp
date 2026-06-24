import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import type { MomentLog } from '@/types/domain';

import { formatKoreanDateTime } from './travelFormat';
import { moodLabelByValue } from './travelData';

type MomentCardProps = {
  item: MomentLog;
  onPress?: () => void;
  onRetry?: (item: MomentLog) => void;
};

export function MomentCard({ item, onPress, onRetry }: MomentCardProps) {
  const moodLabel = item.moodTags[0] ? moodLabelByValue[item.moodTags[0]] : '무드 기록';
  const isRetrying = item.syncStatus === 'pending';
  const showRetry = item.syncStatus === 'failed' && onRetry;
  const syncLabel =
    item.syncStatus === 'failed'
      ? '업로드 실패'
      : item.syncStatus === 'pending'
        ? '동기화 중'
        : undefined;

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
            {syncLabel ? (
              <View className="rounded-full bg-amber-300/12 px-2.5 py-1">
                <AppText className="text-[10px] font-semibold text-amber-100">
                  {syncLabel}
                </AppText>
              </View>
            ) : null}
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

        <View className="flex-row items-center justify-between gap-3">
          <AppText className="min-w-0 flex-1 text-[11px] text-white/45">
            {formatKoreanDateTime(item.createdAt)}
          </AppText>
          {isRetrying ? <ActivityIndicator color="#B7E628" size="small" /> : null}
          {showRetry ? (
            <Pressable
              accessibilityRole="button"
              className="rounded-full bg-soundlog-lime px-3 py-1.5"
              onPress={(event) => {
                event.stopPropagation();
                onRetry(item);
              }}
            >
              <AppText className="text-[11px] font-semibold text-soundlog-inverse">
                재시도
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
