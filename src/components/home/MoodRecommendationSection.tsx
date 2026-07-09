import { ScrollView, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Chip } from '@/components/Chip';
import { MoodRecommendationCard } from '@/components/home/MoodRecommendationCard';
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
  selectedMoodFilter: string;
};

function MoodRecommendationSkeleton() {
  return (
    <View className="flex-row">
      {[0, 1, 2].map((item) => (
        <View
          key={item}
          className="mr-3 h-[136px] w-[136px] rounded-[12px] bg-white/10"
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
      <View className="flex-row items-center justify-between gap-3">
        <AppText className="min-w-0 flex-1 text-[22px] font-semibold text-white">
          나의 무드에 맞는 음악 추천
        </AppText>
        {isCached ? (
          <View className="rounded-full bg-amber-300/15 px-3 py-1.5">
            <AppText className="text-[10px] font-semibold text-amber-100">
              {cacheLabel}
            </AppText>
          </View>
        ) : null}
      </View>

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
        <View className="rounded-[16px] bg-white/10 p-4">
          <AppText className="text-sm font-semibold text-white">
            무드 추천을 불러오지 못했어요
          </AppText>
        </View>
      ) : data.length === 0 ? (
        <View className="rounded-[16px] bg-white/10 p-4">
          <AppText className="text-sm font-semibold text-white">
            아직 추천할 음악이 없어요
          </AppText>
        </View>
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
