import { ScrollView, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BrandLogo } from '@/components/BrandLogo';
import { Chip } from '@/components/Chip';
import type { MusicRecommendationMode } from '@/types/domain';

const topFilters = ['전체', '근처', '지역 트렌드', '내 취향', '저장 많은'];

export function isHomeTopFilter(filter: string) {
  return topFilters.includes(filter);
}

type HomeHeaderProps = {
  recommendationMode?: MusicRecommendationMode;
  onSelectRecommendationMode?: (mode: MusicRecommendationMode) => void;
};

type HomeTopFilterBarProps = {
  selectedTopFilter: string;
  onSelectTopFilter: (filter: string) => void;
};

export function HomeNavigationBar() {
  return (
    <View className="flex-row items-center">
      <View className="flex-row items-center gap-2.5">
        <BrandLogo className="border border-white/25" size={32} />
        <AppText className="text-base font-semibold text-white">Soundlog</AppText>
      </View>
    </View>
  );
}

export function HomeHeader(_props: HomeHeaderProps) {
  return (
    <View className="rounded-[20px] border border-white/10 bg-soundlog-elevated/80 px-5 py-4">
      <View className="self-start rounded-full bg-white/10 px-3 py-1">
        <AppText className="text-[11px] font-semibold text-white/55">
          장소 기반
        </AppText>
      </View>
      <AppText className="mt-3 text-[26px] font-semibold leading-8 text-white">
        장소 기반 음악추천
      </AppText>
      <AppText className="mt-2 text-sm leading-6 text-white/58">
        현재 위치와 주변 장소 맥락으로 오늘의 사운드트랙을 추천해요.
      </AppText>
    </View>
  );
}

export function HomeTopFilterBar({
  onSelectTopFilter,
  selectedTopFilter,
}: HomeTopFilterBarProps) {
  return (
    <View className="rounded-full border border-soundlog-border/70 bg-soundlog-chip/70 py-2 pl-2 pr-0">
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
