import { mockServerDelay } from '@/mock-server/delay';
import {
  FeaturedPlaylistMockParams,
  MoodRecommendationMockParams,
} from '@/mock-server/types';
import {
  featuredPlaylists,
  moodRecommendations,
  recentMusicLogs,
} from '@/mocks/homeMocks';
import {
  FeaturedPlaylist,
  MoodRecommendation,
  PlaceContext,
} from '@/types/domain';

function normalizeMoodLabel(value?: string) {
  return value === '청량한' ? '시원한' : value;
}

function matchesMoodFilter(item: MoodRecommendation, moodFilter?: string) {
  const normalizedFilter = normalizeMoodLabel(moodFilter);

  if (!normalizedFilter || normalizedFilter === '전체') {
    return true;
  }

  return (item.moods ?? []).some(
    (mood) => normalizeMoodLabel(mood) === normalizedFilter,
  );
}

function getMatchScore(
  item: MoodRecommendation,
  params?: MoodRecommendationMockParams,
) {
  if (!params) {
    return 0;
  }

  let score = 0;
  const itemGenres = item.genres ?? [];
  const itemMoods = item.moods ?? [];
  const itemTravelStyles = item.travelStyles ?? [];
  const placeContext = [
    params.currentPlace?.title,
    params.currentPlace?.category,
    params.currentPlace?.contentType,
    params.currentPlace?.overview,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const travelModeWeight = params.recommendationMode === 'travel' ? 2.4 : 1;
  const tasteWeight = params.recommendationMode === 'travel' ? 0.7 : 1.4;

  score +=
    (params.preferredGenres ?? []).filter((genre) => itemGenres.includes(genre))
      .length * 3 * tasteWeight;
  score +=
    (params.preferredMoods ?? []).filter((mood) =>
      itemMoods.some(
        (itemMood) => normalizeMoodLabel(itemMood) === normalizeMoodLabel(mood),
      ),
    )
      .length * 2 * tasteWeight;
  score +=
    (params.travelStyles ?? []).filter((style) =>
      itemTravelStyles.includes(style),
    ).length * 2 * travelModeWeight;

  if (params.recommendationMode === 'travel') {
    if (/궁|궁궐|문화|역사|전통|palace|heritage/.test(placeContext)) {
      score += itemGenres.some((genre) => /국악|ambient|fusion|클래식/i.test(genre))
        ? 18
        : 0;
    }

    if (/해변|바다|해수욕장|ocean|beach/.test(placeContext)) {
      score += itemMoods.some((mood) => /시원한|청량한|잔잔한|신나는/.test(mood)) ? 18 : 0;
    }

    if (/야경|타워|전망|city|night/.test(placeContext)) {
      score += item.travelStyles?.includes('야경 감상') ? 18 : 0;
    }
  }

  return score;
}

function getFeaturedPlaylistLocationScore(
  item: FeaturedPlaylist,
  params?: FeaturedPlaylistMockParams,
) {
  if (
    !params?.locationRecommendationEnabled ||
    !params.location ||
    params.recommendationMode !== 'travel'
  ) {
    return 0;
  }

  const isSouthernContext = params.location.lat < 36.5;

  if (isSouthernContext && item.id.includes('busan')) {
    return 10;
  }

  if (!isSouthernContext && item.id.includes('seoul')) {
    return 10;
  }

  return 0;
}

function getFeaturedPlaylistPlaceScore(
  item: FeaturedPlaylist,
  place?: PlaceContext,
) {
  if (!place) {
    return 0;
  }

  const context = [
    place.title,
    place.category,
    place.contentType,
    place.overview,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (
    item.id.includes('busan') &&
    /해변|바다|해수욕장|ocean|beach/.test(context)
  ) {
    return 20;
  }

  if (
    item.id.includes('seoul') &&
    /야경|문화|도시|광장|타워|night|city/.test(context)
  ) {
    return 20;
  }

  return 0;
}

export const homeMockHandlers = {
  getFeaturedPlaylists: (params?: FeaturedPlaylistMockParams) => {
    const nextPlaylists = [...featuredPlaylists];

    if (params?.locationRecommendationEnabled) {
      nextPlaylists.sort(
        (first, second) =>
          getFeaturedPlaylistPlaceScore(second, params.place) -
            getFeaturedPlaylistPlaceScore(first, params.place) ||
          getFeaturedPlaylistLocationScore(second, params) -
            getFeaturedPlaylistLocationScore(first, params),
      );
    }

    return mockServerDelay('home.featuredPlaylists', nextPlaylists);
  },
  getMoodRecommendations: (params?: MoodRecommendationMockParams) =>
    mockServerDelay(
      'home.moodRecommendations',
      [...moodRecommendations]
        .filter((item) => matchesMoodFilter(item, params?.moodFilter))
        .sort(
          (first, second) =>
            getMatchScore(second, params) - getMatchScore(first, params),
        ),
    ),
  getRecentMusicLogs: () =>
    mockServerDelay('home.recentMusicLogs', recentMusicLogs),
};
