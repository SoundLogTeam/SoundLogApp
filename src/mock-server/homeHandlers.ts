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

  if (params.topFilter !== '전체' && itemMoods.includes(params.topFilter)) {
    score += 8;
  }

  if (params.moodFilter !== '전체' && itemMoods.includes(params.moodFilter)) {
    score += 8;
  }

  score +=
    (params.preferredGenres ?? []).filter((genre) => itemGenres.includes(genre))
      .length * 3;
  score +=
    (params.preferredMoods ?? []).filter((mood) => itemMoods.includes(mood))
      .length * 2;
  score +=
    (params.travelStyles ?? []).filter((style) =>
      itemTravelStyles.includes(style),
    ).length * 2;

  return score;
}

function getFeaturedPlaylistLocationScore(
  item: FeaturedPlaylist,
  params?: FeaturedPlaylistMockParams,
) {
  if (!params?.locationRecommendationEnabled || !params.location) {
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
      [...moodRecommendations].sort(
        (first, second) =>
          getMatchScore(second, params) - getMatchScore(first, params),
      ),
    ),
  getRecentMusicLogs: () =>
    mockServerDelay('home.recentMusicLogs', recentMusicLogs),
};
