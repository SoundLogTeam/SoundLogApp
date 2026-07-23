import { ScrollView, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Chip } from '@/components/Chip';
import { MoodRecommendationCard } from '@/components/home/MoodRecommendationCard';
import { SectionTitle } from '@/components/SectionTitle';
import { SettingsRow } from '@/components/SettingsRow';
import { MoodRecommendation } from '@/types/domain';

const moodFilters = [
  '전체',
  '잔잔한',
  '신나는',
  '시원한',
  '설레는',
  '감성적인',
];

export function isMoodRecommendationFilter(filter: string) {
  return moodFilters.includes(filter);
}

type MoodRecommendationSectionProps = {
  cachedAt?: string;
  data?: MoodRecommendation[];
  isCached?: boolean;
  isError?: boolean;
  isLoading?: boolean;
  onSelectMoodFilter: (filter: string) => void;
  onSelectRecommendation: (item: MoodRecommendation) => void;
  onRetry?: () => void;
  selectedMoodFilter: string;
};

function MoodRecommendationSkeleton() {
  return (
    <View className="flex-row">
      {[0, 1, 2].map((item) => (
        <View
          key={item}
          className="mr-3 h-[136px] w-[136px] rounded-[8px] bg-white/10"
        />
      ))}
    </View>
  );
}

export function MoodRecommendationSection({
  cachedAt,
  data = [],
  isCached = false,
  isError = false,
  isLoading = false,
  onSelectMoodFilter,
  onSelectRecommendation,
  onRetry,
  selectedMoodFilter,
}: MoodRecommendationSectionProps) {
  const cacheLabel = cachedAt
    ? `최근 추천 · ${new Date(cachedAt).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`
    : '최근 추천';

  return (
    <View className="gap-4">
      <SectionTitle
        rightContent={
          isCached ? (
            <AppText className="text-xs font-semibold text-white/42">
              {cacheLabel}
            </AppText>
          ) : undefined
        }
        title="무드 추천"
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2 pr-5">
          {moodFilters.map((filter) => (
            <Chip
              key={filter}
              label={filter}
              onPress={() => onSelectMoodFilter(filter)}
              selected={selectedMoodFilter === filter}
            />
          ))}
        </View>
      </ScrollView>

      {isLoading ? (
        <MoodRecommendationSkeleton />
      ) : isError ? (
        <SettingsRow
          description="눌러서 다시 시도해보세요."
          icon="alert-circle"
          label="무드 추천을 불러오지 못했어요"
          onPress={onRetry}
        />
      ) : data.length === 0 ? (
        <SettingsRow
          icon="music"
          label="아직 추천할 음악이 없어요"
        />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row pr-5">
            {data.map((item) => (
              <MoodRecommendationCard
                key={item.id}
                item={item}
                onPress={onSelectRecommendation}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
