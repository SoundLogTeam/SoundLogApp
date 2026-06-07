import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { MusicRecommendationMode, TravelMode } from '@/types/domain';

export type RecommendationEventType =
  | 'track_play'
  | 'track_pause'
  | 'track_resume'
  | 'track_like'
  | 'track_unlike'
  | 'track_save'
  | 'track_unsave'
  | 'playlist_open'
  | 'mood_filter_change'
  | 'recommendation_mode_change'
  | 'top_filter_change';

export type RecommendationEventContext = {
  moodFilter?: string;
  recommendationMode?: MusicRecommendationMode;
  placeCategory?: string;
  placeId?: string;
  placeName?: string;
  topFilter?: string;
  travelMode?: TravelMode;
};

export type RecommendationEvent = {
  context: RecommendationEventContext;
  createdAt: string;
  id: string;
  playlistId?: string;
  sessionId: string;
  trackId?: string;
  type: RecommendationEventType;
  value?: string;
};

type RecommendationEventInput = {
  context?: RecommendationEventContext;
  playlistId?: string;
  trackId?: string;
  type: RecommendationEventType;
  value?: string;
};

type RecommendationEventState = {
  clearEvents: () => void;
  addEvent: (input: RecommendationEventInput) => void;
  events: RecommendationEvent[];
  isHydrated: boolean;
  sessionId: string;
  setHydrated: (isHydrated: boolean) => void;
};

const MAX_EVENTS = 200;

function createLocalId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function selectRecentEvents(state: RecommendationEventState, limit = 10) {
  return state.events.slice(0, limit);
}

export const useRecommendationEventStore = create<RecommendationEventState>()(
  persist(
    (set, get) => ({
      events: [],
      isHydrated: false,
      sessionId: createLocalId('session'),
      addEvent: (input) => {
        if (!get().isHydrated) {
          return;
        }

        const event: RecommendationEvent = {
          context: input.context ?? {},
          createdAt: new Date().toISOString(),
          id: createLocalId('event'),
          playlistId: input.playlistId,
          sessionId: get().sessionId,
          trackId: input.trackId,
          type: input.type,
          value: input.value,
        };

        set((state) => ({
          events: [event, ...state.events].slice(0, MAX_EVENTS),
        }));
      },
      clearEvents: () => set({ events: [] }),
      setHydrated: (isHydrated) => set({ isHydrated }),
    }),
    {
      name: 'soundlog-recommendation-events',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({ events: state.events }),
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
