import { Feather } from '@expo/vector-icons';
import { Pressable, ScrollView, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BrandLogo } from '@/components/BrandLogo';
import { Chip } from '@/components/Chip';
import { colors } from '@/constants/colors';
import type { MusicRecommendationMode, PlaceContext } from '@/types/domain';

const topFilters = ['전체', '근처', '지역 트렌드', '내 취향', '저장 많은'];

export function isHomeTopFilter(filter: string) {
  return topFilters.includes(filter);
}

type HomeHeaderProps = {
  currentPlace?: PlaceContext;
  isLocationLoading?: boolean;
  recommendationMode: MusicRecommendationMode;
  onSelectRecommendationMode: (mode: MusicRecommendationMode) => void;
  onSetCurrentLocation: () => void;
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
    accent: colors.accent.magenta,
    label: 'Everyday',
    value: 'everyday',
  },
  {
    accent: colors.accent.lime,
    label: 'Travel',
    value: 'travel',
  },
];

export function HomeHeader({
  currentPlace,
  isLocationLoading = false,
  onSelectRecommendationMode,
  onSetCurrentLocation,
  recommendationMode,
}: HomeHeaderProps) {
  const activeMode =
    musicModeOptions.find((mode) => mode.value === recommendationMode) ??
    musicModeOptions[0];
  const locationLabel = currentPlace?.title ?? '위치를 확인해 볼까요?';

  return (
    <View className="rounded-[28px] border border-white/15 bg-soundlog-elevated/80 p-4">
      <View className="flex-row items-center gap-3">
        <BrandLogo className="border border-white/25" size={38} />

        <View className="min-w-0 flex-1">
          <AppText className="text-xs font-semibold uppercase tracking-[1.8px] text-white/45">
            Music Mode
          </AppText>
          <AppText className="mt-1 text-lg font-semibold text-white" numberOfLines={1}>
            {recommendationMode === 'travel' ? '여행지에 맞는 음악' : '평소 취향 중심 추천'}
          </AppText>
        </View>

        <View
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: `${activeMode.accent}24` }}
        >
          <Feather
            color={activeMode.accent}
            name={recommendationMode === 'travel' ? 'map' : 'music'}
            size={18}
          />
        </View>
      </View>

      <View className="mt-4 rounded-full border border-white/10 bg-black/25 p-1">
        <View className="flex-row gap-1">
          {musicModeOptions.map((mode) => {
            const selected = recommendationMode === mode.value;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className="h-11 flex-1 items-center justify-center rounded-full"
                key={mode.value}
                onPress={() => onSelectRecommendationMode(mode.value)}
                style={{
                  backgroundColor: selected ? mode.accent : 'transparent',
                  transform: [{ scale: selected ? 1 : 0.98 }],
                }}
              >
                <AppText
                  className={`text-sm font-semibold ${selected ? '' : 'text-white/58'}`}
                  style={selected ? { color: colors.text.inverse } : undefined}
                >
                  {mode.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="mt-4 flex-row items-center gap-3 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3">
        <Feather color={activeMode.accent} name="map-pin" size={16} />
        <View className="min-w-0 flex-1">
          <AppText className="text-sm font-semibold text-white" numberOfLines={1}>
            {locationLabel}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          className="h-9 flex-row items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3"
          disabled={isLocationLoading}
          onPress={onSetCurrentLocation}
          style={{ opacity: isLocationLoading ? 0.55 : 1 }}
        >
          <Feather color="rgba(255,255,255,0.78)" name="crosshair" size={14} />
          <AppText className="text-xs font-semibold text-white">
            {isLocationLoading ? '확인 중' : '위치 설정'}
          </AppText>
        </Pressable>
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
