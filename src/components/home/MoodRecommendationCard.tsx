import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { MoodRecommendation } from '@/types/domain';

type MoodRecommendationCardProps = {
  item: MoodRecommendation;
  onPress: (item: MoodRecommendation) => void;
};

export function MoodRecommendationCard({ item, onPress }: MoodRecommendationCardProps) {
  const moodLabel = item.moods?.[0] ?? item.genres?.[0];

  return (
    <Pressable
      accessibilityLabel={`${item.title.replace(/\n/g, ' ')} 추천 플레이리스트 열기`}
      accessibilityRole="button"
      className="mr-3 h-[136px] w-[136px] justify-end overflow-hidden rounded-[12px] p-5"
      onPress={() => onPress(item)}
      style={{ backgroundColor: item.color }}
    >
      {item.imageUrl ? (
        <Image
          contentFit="cover"
          source={{ uri: item.imageUrl }}
          style={StyleSheet.absoluteFill}
          transition={180}
        />
      ) : null}
      <View className="absolute inset-0 bg-black/40" />
      <View className="absolute inset-x-0 bottom-0 h-20 bg-black/30" />
      {moodLabel ? (
        <View className="absolute left-3 top-3 rounded-full bg-white/20 px-2.5 py-1">
          <AppText className="text-[10px] font-semibold text-white/85" numberOfLines={1}>
            {moodLabel}
          </AppText>
        </View>
      ) : null}
      <View>
        <AppText className="text-[18px] font-bold leading-6 text-white" numberOfLines={2}>
          {item.title}
        </AppText>
        {item.subtitle ? (
          <AppText className="mt-1 text-xs text-white/75" numberOfLines={1}>
            {item.subtitle}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}
