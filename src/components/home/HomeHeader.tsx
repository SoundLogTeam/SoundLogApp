import { ScrollView, View } from 'react-native';

import { BrandLogo } from '@/components/BrandLogo';
import { Chip } from '@/components/Chip';

const topFilters = ['전체', '근처', '지역 트렌드', '내 취향', '저장 많은'];

export function isHomeTopFilter(filter: string) {
  return topFilters.includes(filter);
}

type HomeHeaderProps = {
  selectedTopFilter: string;
  onSelectTopFilter: (filter: string) => void;
};

export function HomeHeader({
  onSelectTopFilter,
  selectedTopFilter,
}: HomeHeaderProps) {
  return (
    <View className="flex-row items-center gap-2">
      <BrandLogo className="border border-white/20" size={34} />
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
