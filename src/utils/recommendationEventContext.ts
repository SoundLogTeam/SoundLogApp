import { RecommendationEventContext } from '@/store/recommendationEventStore';
import { useHomeFilterStore } from '@/store/homeFilterStore';
import { useTravelSessionStore } from '@/store/travelSessionStore';

export function createRecommendationEventContext(
  overrides: RecommendationEventContext = {},
): RecommendationEventContext {
  const { selectedMoodFilter, selectedTopFilter } = useHomeFilterStore.getState();
  const { currentPlace, recommendationMode, selectedMode } =
    useTravelSessionStore.getState();

  return {
    moodFilter: selectedMoodFilter,
    recommendationMode,
    placeCategory: currentPlace?.category,
    placeId: currentPlace?.id,
    placeName: currentPlace?.title,
    topFilter: selectedTopFilter,
    travelMode: selectedMode,
    ...overrides,
  };
}
