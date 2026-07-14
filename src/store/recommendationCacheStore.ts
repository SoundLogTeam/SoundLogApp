import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  FeaturedPlaylist,
  GeoPoint,
  MoodRecommendation,
  MusicRecommendationMode,
  PlaceContext,
} from '@/types/domain';

type FeaturedPlaylistCacheParams = {
  location?: GeoPoint;
  locationRecommendationEnabled?: boolean;
  recommendationMode?: MusicRecommendationMode;
  place?: PlaceContext;
};

type MoodRecommendationCacheParams = {
  currentPlace?: PlaceContext;
  moodFilter?: string;
  recommendationMode?: MusicRecommendationMode;
  preferredGenres?: string[];
  preferredMoods?: string[];
  travelStyles?: string[];
};

type RecommendationCacheEntry<T> = {
  cachedAt: string;
  data: T[];
};

type RecommendationFallbackState = {
  cachedAt: string;
  key: string;
  servedAt: string;
};

type RecommendationCacheState = {
  featuredFallback?: RecommendationFallbackState;
  featuredPlaylists: Record<string, RecommendationCacheEntry<FeaturedPlaylist>>;
  moodFallback?: RecommendationFallbackState;
  moodRecommendations: Record<string, RecommendationCacheEntry<MoodRecommendation>>;
  clearFeaturedFallback: (key: string) => void;
  clearMoodFallback: (key: string) => void;
  getFeaturedPlaylists: (key: string) => RecommendationCacheEntry<FeaturedPlaylist> | undefined;
  getMoodRecommendations: (key: string) => RecommendationCacheEntry<MoodRecommendation> | undefined;
  markFeaturedFallback: (key: string, cachedAt: string) => void;
  markMoodFallback: (key: string, cachedAt: string) => void;
  setFeaturedPlaylists: (key: string, data: FeaturedPlaylist[]) => void;
  setMoodRecommendations: (key: string, data: MoodRecommendation[]) => void;
};

function normalizeList(values?: string[]) {
  return values?.filter(Boolean).slice().sort() ?? [];
}

function normalizeLocation(location?: GeoPoint) {
  if (!location) {
    return undefined;
  }

  return {
    lat: Number(location.lat.toFixed(4)),
    lng: Number(location.lng.toFixed(4)),
  };
}

function stringifyCacheKey(scope: string, value: Record<string, unknown>) {
  return `${scope}:${JSON.stringify(value)}`;
}

export function createFeaturedPlaylistsCacheKey(params?: FeaturedPlaylistCacheParams) {
  return stringifyCacheKey('featured-playlists', {
    location: normalizeLocation(params?.location),
    locationRecommendationEnabled: Boolean(params?.locationRecommendationEnabled),
    placeId: params?.place?.id,
    recommendationMode: params?.recommendationMode ?? 'everyday',
  });
}

export function createMoodRecommendationsCacheKey(params?: MoodRecommendationCacheParams) {
  return stringifyCacheKey('mood-recommendations', {
    currentPlaceId: params?.currentPlace?.id,
    moodFilter: params?.moodFilter ?? '전체',
    preferredGenres: normalizeList(params?.preferredGenres),
    preferredMoods: normalizeList(params?.preferredMoods),
    recommendationMode: params?.recommendationMode ?? 'everyday',
    travelStyles: normalizeList(params?.travelStyles),
  });
}

export const useRecommendationCacheStore = create<RecommendationCacheState>()(
  persist(
    (set, get) => ({
      featuredPlaylists: {},
      moodRecommendations: {},
      clearFeaturedFallback: (key) =>
        set((state) => ({
          featuredFallback:
            state.featuredFallback?.key === key ? undefined : state.featuredFallback,
        })),
      clearMoodFallback: (key) =>
        set((state) => ({
          moodFallback: state.moodFallback?.key === key ? undefined : state.moodFallback,
        })),
      getFeaturedPlaylists: (key) => get().featuredPlaylists[key],
      getMoodRecommendations: (key) => get().moodRecommendations[key],
      markFeaturedFallback: (key, cachedAt) =>
        set({
          featuredFallback: {
            cachedAt,
            key,
            servedAt: new Date().toISOString(),
          },
        }),
      markMoodFallback: (key, cachedAt) =>
        set({
          moodFallback: {
            cachedAt,
            key,
            servedAt: new Date().toISOString(),
          },
        }),
      setFeaturedPlaylists: (key, data) =>
        set((state) => ({
          featuredFallback:
            state.featuredFallback?.key === key ? undefined : state.featuredFallback,
          featuredPlaylists: {
            ...state.featuredPlaylists,
            [key]: {
              cachedAt: new Date().toISOString(),
              data,
            },
          },
        })),
      setMoodRecommendations: (key, data) =>
        set((state) => ({
          moodFallback: state.moodFallback?.key === key ? undefined : state.moodFallback,
          moodRecommendations: {
            ...state.moodRecommendations,
            [key]: {
              cachedAt: new Date().toISOString(),
              data,
            },
          },
        })),
    }),
    {
      name: 'soundlog-recommendation-cache',
      partialize: (state) => ({
        featuredPlaylists: state.featuredPlaylists,
        moodRecommendations: state.moodRecommendations,
      }),
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
