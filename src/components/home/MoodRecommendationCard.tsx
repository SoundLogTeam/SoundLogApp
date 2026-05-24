import { Pressable } from 'react-native';

import { AppText } from '@/components/AppText';
import { MoodRecommendation } from '@/types/domain';

type MoodRecommendationCardProps = {
  item: MoodRecommendation;
  onPress: (item: MoodRecommendation) => void;
};

export function MoodRecommendationCard({ item, onPress }: MoodRecommendationCardProps) {
  return (
    <Pressable
      className="mr-3 h-[136px] w-[136px] justify-end rounded-[12px] p-5"
      onPress={() => onPress(item)}
      style={{ backgroundColor: item.color }}
    >
      <AppText className="text-[18px] font-bold leading-6 text-white" numberOfLines={2}>
        {item.title}
      </AppText>
      {item.subtitle ? (
        <AppText className="mt-1 text-xs text-white/70" numberOfLines={1}>
          {item.subtitle}
        </AppText>
      ) : null}
    </Pressable>
  );
}
