import { Pressable, ScrollView, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BrandLogo } from '@/components/BrandLogo';
import { Chip } from '@/components/Chip';
import { colors } from '@/constants/colors';
import type { MusicRecommendationMode } from '@/types/domain';

const topFilters = ['전체', '근처', '지역 트렌드', '내 취향', '저장 많은'];

export function isHomeTopFilter(filter: string) {
  return topFilters.includes(filter);
}

type HomeHeaderProps = {
  recommendationMode: MusicRecommendationMode;
  onSelectRecommendationMode: (mode: MusicRecommendationMode) => void;
};

type HomeTopFilterBarProps = {
  selectedTopFilter: string;
  onSelectTopFilter: (filter: string) => void;
};

const musicModeOptions: Array<{
  accent: string;
  label: string;
  value: MusicRecommendationMode;
}> = [
  {
    accent: colors.accent.blue,
    label: '일상 모드',
    value: 'everyday',
  },
  {
    accent: colors.accent.lime,
    label: '여행 모드',
    value: 'travel',
  },
];

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

export function HomeHeader({
  onSelectRecommendationMode,
  recommendationMode,
}: HomeHeaderProps) {
  return (
    <View className="rounded-[20px] bg-soundlog-elevated/80 p-2">
      <View className="rounded-full bg-black/25 p-1">
        <View className="flex-row gap-1">
          {musicModeOptions.map((mode) => {
            const selected = recommendationMode === mode.value;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className="h-10 flex-1 items-center justify-center rounded-full"
                key={mode.value}
                onPress={() => onSelectRecommendationMode(mode.value)}
                style={{
                  backgroundColor: selected ? mode.accent : 'transparent',
                  transform: [{ scale: selected ? 1 : 0.98 }],
                }}
              >
                <AppText
                  className="text-[15px] font-semibold"
                  style={{
                    color: selected ? colors.text.inverse : 'rgba(255,255,255,0.72)',
                  }}
                >
                  {mode.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>
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
