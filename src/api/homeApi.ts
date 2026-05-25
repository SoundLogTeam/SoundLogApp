import { featuredPlaylists, moodRecommendations, recentMusicLogs } from '@/mocks/homeMocks';
import { mockDelay } from '@/api/mockDelay';
import { FeaturedPlaylist, GeoPoint, MoodRecommendation } from '@/types/domain';

type FeaturedPlaylistParams = {
  location?: GeoPoint;
  locationRecommendationEnabled: boolean;
};

type MoodRecommendationParams = {
  moodFilter: string;
  preferredGenres?: string[];
  preferredMoods?: string[];
  topFilter: string;
  travelStyles?: string[];
};

function getMatchScore(item: MoodRecommendation, params?: MoodRecommendationParams) {
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

  if (
    params.moodFilter !== '전체' &&
    (itemTravelStyles.includes(params.moodFilter) || itemMoods.includes(params.moodFilter))
  ) {
    score += 8;
  }

  score += (params.preferredGenres ?? []).filter((genre) => itemGenres.includes(genre)).length * 3;
  score += (params.preferredMoods ?? []).filter((mood) => itemMoods.includes(mood)).length * 2;
  score += (params.travelStyles ?? []).filter((style) => itemTravelStyles.includes(style)).length * 2;

  return score;
}

function getFeaturedPlaylistLocationScore(item: FeaturedPlaylist, location?: GeoPoint) {
  if (!location) {
    return 0;
  }

  const isSouthernContext = location.lat < 36.5;

  if (isSouthernContext && item.id.includes('busan')) {
    return 10;
  }

  if (!isSouthernContext && item.id.includes('seoul')) {
    return 10;
  }

  return 0;
}

export const homeApi = {
  getFeaturedPlaylists: (params?: FeaturedPlaylistParams) =>
    mockDelay(
      [...featuredPlaylists].sort((first, second) => {
        if (!params?.locationRecommendationEnabled) {
          return 0;
        }

        return (
          getFeaturedPlaylistLocationScore(second, params.location) -
          getFeaturedPlaylistLocationScore(first, params.location)
        );
      }),
    ),
  getMoodRecommendations: (params?: MoodRecommendationParams) =>
    mockDelay(
      [...moodRecommendations].sort(
        (first, second) => getMatchScore(second, params) - getMatchScore(first, params),
      ),
    ),
  getRecentMusicLogs: () => mockDelay(recentMusicLogs),
};
