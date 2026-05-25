import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { RecapItem } from '@/types/domain';
import { formatRecapRecordedAt } from '@/utils/dateFormat';

type RecapListCardProps = {
  imageUrl?: string;
  item: RecapItem;
  onPress: () => void;
};

export function RecapListCard({ imageUrl, item, onPress }: RecapListCardProps) {
  return (
    <Pressable
      accessibilityLabel={`${item.title} 리캡 열기`}
      accessibilityRole="button"
      className="overflow-hidden rounded-[22px] border border-white/10 bg-white/10"
      onPress={onPress}
    >
      <View className="flex-row gap-4 p-4">
        <View className="h-[104px] w-[92px] overflow-hidden rounded-[18px] bg-white/10">
          {imageUrl ? (
            <Image className="h-full w-full" contentFit="cover" source={{ uri: imageUrl }} />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <Feather color="#fff" name="music" size={24} />
            </View>
          )}
        </View>

        <View className="min-w-0 flex-1 justify-between py-1">
          <View>
            <AppText className="text-[20px] font-semibold text-white" numberOfLines={1}>
              {item.title}
            </AppText>
            <AppText className="mt-1 text-sm text-white/65" numberOfLines={1}>
              {item.placeName}
            </AppText>
            <AppText className="mt-3 text-[12px] text-white/45" numberOfLines={1}>
              {item.representativeTrack.artist}
            </AppText>
          </View>

          <View className="flex-row items-center justify-between">
            <AppText className="text-[11px] text-white/45">
              {formatRecapRecordedAt(item.createdAt)}
            </AppText>
            <View className="h-9 w-9 items-center justify-center rounded-full bg-white">
              <Feather color="#050916" name="arrow-up-right" size={17} />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
