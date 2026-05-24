import { ScrollView, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Chip } from '@/components/Chip';

const topFilters = ['전체', '잔잔한', '청량한', '감성적인', '신나는'];

type HomeHeaderProps = {
  selectedTopFilter: string;
  onSelectTopFilter: (filter: string) => void;
};

export function HomeHeader({ onSelectTopFilter, selectedTopFilter }: HomeHeaderProps) {
  return (
    <View className="flex-row items-center gap-2">
      <View className="h-8 w-8 items-center justify-center rounded-full bg-white/90">
        <AppText className="text-base">🎧</AppText>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2 pr-5">
          {topFilters.map((filter) => (
            <Chip
              key={filter}
              label={filter}
              onPress={() => onSelectTopFilter(filter)}
              selected={selectedTopFilter === filter}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
