import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { RecapItem } from '@/types/domain';
import { formatRecapRecordedAt } from '@/utils/dateFormat';

type RecapListCardProps = {
  imageUrl?: string;
  item: RecapItem;
  onPress: () => void;
};

export function RecapListCard({ imageUrl, item, onPress }: RecapListCardProps) {
  const momentCountLabel =
    item.momentCount && item.momentCount > 1
      ? `저장된 순간 ${item.momentCount}개`
      : undefined;

  return (
    <Pressable
      accessibilityLabel={`${item.title} 리캡 열기`}
      accessibilityRole="button"
      className="h-[188px] overflow-hidden rounded-[26px] border border-white/10 bg-white/10"
      onPress={onPress}
    >
      {imageUrl ? (
        <Image
          contentFit="cover"
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          transition={250}
        />
      ) : (
        <LinearGradient
          colors={['#231844', '#1D3357', '#15101F']}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <LinearGradient
        colors={['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.32)', 'rgba(0,0,0,0.78)']}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View className="absolute inset-0 border border-white/10" />

      <View className="h-full justify-between p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="rounded-full border border-white/15 bg-black/28 px-3 py-1">
            <AppText className="text-[10px] font-semibold text-white/70">
              {momentCountLabel ?? 'Music Recap'}
            </AppText>
          </View>
          <View className="h-10 w-10 items-center justify-center rounded-full bg-white/90">
            <Feather color="#050916" name="arrow-up-right" size={18} />
          </View>
        </View>

        <View>
          <AppText className="text-[11px] font-semibold tracking-[1.8px] text-white/60">
            SOUNDLOG
          </AppText>
          <AppText
            className="mt-2 text-[25px] font-semibold leading-8 text-white"
            numberOfLines={1}
          >
            {item.title}
          </AppText>
          <AppText className="mt-1 text-sm text-white/74" numberOfLines={1}>
            {item.placeName} · {item.representativeTrack.title}
          </AppText>
          <View className="mt-4 flex-row items-center justify-between">
            <AppText className="text-[11px] text-white/55">
              {formatRecapRecordedAt(item.createdAt)}
            </AppText>
            <View className="flex-row items-center gap-2">
              <View className="h-7 w-7 items-center justify-center rounded-full bg-white/14">
                <Feather color="#fff" name="music" size={13} />
              </View>
              <AppText
                className="max-w-[108px] text-right text-[11px] text-white/60"
                numberOfLines={1}
              >
                {item.representativeTrack.artist}
              </AppText>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
