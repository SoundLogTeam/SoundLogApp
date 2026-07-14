import { Feather } from '@expo/vector-icons';
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
    <View className="min-h-[72px] flex-row items-center py-2">
      <Pressable
        accessibilityLabel={`${track.title} SoundLog 음악으로 선택`}
        accessibilityRole="button"
        className="min-w-0 flex-1 flex-row items-center py-1"
        onPress={onPress}
      >
        <View
          className="h-[52px] w-[52px] overflow-hidden rounded-lg"
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
          <AppText className="mt-1.5 text-[11px] text-white/35" numberOfLines={1}>
            {formatRecapRecordedAt(record.createdAt)}
          </AppText>
        </View>
        <Feather
          color="rgba(255,255,255,0.32)"
          name="chevron-right"
          size={18}
        />
      </Pressable>

      <Pressable
        accessibilityHint="보관함에서 이 곡을 제거합니다."
        accessibilityLabel={`${track.title} 보관함에서 삭제`}
        accessibilityRole="button"
        className="ml-1 h-11 w-11 items-center justify-center"
        hitSlop={4}
        onPress={onRemove}
      >
        <Feather color="rgba(255,255,255,0.42)" name="trash-2" size={17} />
      </Pressable>
    </View>
  );
}
