import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { LibraryTrackRecord } from '@/store/libraryStore';
import { formatRecapRecordedAt } from '@/utils/dateFormat';

type LibraryTrackRowProps = {
  onOpenActions: () => void;
  onPress: () => void;
  record: LibraryTrackRecord;
};

export function LibraryTrackRow({
  onOpenActions,
  onPress,
  record,
}: LibraryTrackRowProps) {
  const { track } = record;

  return (
    <Pressable
      accessibilityLabel={`${track.title} 재생`}
      accessibilityRole="button"
      className="flex-row items-center rounded-[18px] border border-white/10 bg-white/10 p-3"
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

      <Pressable
        accessibilityLabel={`${track.title} 옵션 열기`}
        accessibilityRole="button"
        className="h-11 w-11 items-center justify-center rounded-full bg-white/10"
        onPress={(event) => {
          event.stopPropagation();
          onOpenActions();
        }}
      >
        <Feather color="#fff" name="more-horizontal" size={18} />
      </Pressable>
    </Pressable>
  );
}
