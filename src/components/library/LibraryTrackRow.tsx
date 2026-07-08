import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { LibraryTrackRecord } from '@/store/libraryStore';
import { formatRecapRecordedAt } from '@/utils/dateFormat';

type LibraryTrackRowProps = {
  onPress: () => void;
  onRemove: () => void;
  record: LibraryTrackRecord;
};

export function LibraryTrackRow({
  onPress,
  onRemove,
  record,
}: LibraryTrackRowProps) {
  const { track } = record;

  return (
    <View className="flex-row items-center rounded-[18px] border border-white/10 bg-white/10 p-3">
      <Pressable
        accessibilityLabel={`${track.title} SoundLog 음악으로 선택`}
        accessibilityRole="button"
        className="min-w-0 flex-1 flex-row items-center"
        onPress={onPress}
      >
        <View
          className="h-[58px] w-[58px] overflow-hidden rounded-[14px]"
          style={{ backgroundColor: track.fallbackColor ?? '#2B176C' }}
        >
          {track.albumImageUrl ? (
            <Image className="h-full w-full" contentFit="cover" source={{ uri: track.albumImageUrl }} />
          ) : null}
        </View>

        <View className="ml-3 min-w-0 flex-1">
          <AppText className="text-base font-semibold text-white" numberOfLines={1}>
            {track.title}
          </AppText>
          <AppText className="mt-1 text-xs text-white/55" numberOfLines={1}>
            {track.artist}
          </AppText>
          <AppText className="mt-2 text-[11px] text-white/35" numberOfLines={1}>
            {formatRecapRecordedAt(record.createdAt)}
          </AppText>
        </View>
      </Pressable>

      <View className="ml-2 flex-row items-center gap-1.5">
        <Pressable
          accessibilityLabel={`${track.title} 열기`}
          accessibilityRole="button"
          className="h-9 items-center justify-center rounded-full bg-white/10 px-3"
          onPress={onPress}
        >
          <AppText className="text-xs font-semibold text-white">열기</AppText>
        </Pressable>
        <Pressable
          accessibilityLabel={`${track.title} 보관함에서 삭제`}
          accessibilityRole="button"
          className="h-9 items-center justify-center rounded-full border border-white/10 px-3"
          onPress={onRemove}
        >
          <AppText className="text-xs font-semibold text-white/70">삭제</AppText>
        </Pressable>
      </View>
    </View>
  );
}
