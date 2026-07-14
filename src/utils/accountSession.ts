import { queryClient } from '@/providers/queryClient';
import { useAuthStore } from '@/store/authStore';
import { useHomeFilterStore } from '@/store/homeFilterStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useMomentLogStore } from '@/store/momentLogStore';
import { usePlayerStore } from '@/store/playerStore';
import { useRecommendationCacheStore } from '@/store/recommendationCacheStore';
import { useRecommendationEventStore } from '@/store/recommendationEventStore';
import { useTravelRoomStore } from '@/store/travelRoomStore';
import { useTravelLogSyncStore } from '@/store/travelLogSyncStore';
import { useTravelSessionStore } from '@/store/travelSessionStore';
import { useUserProfileStore } from '@/store/userProfileStore';

export function clearAccountSession() {
  queryClient.clear();
  useMomentLogStore.setState({ logs: [], pendingActions: [] });
  useLibraryStore.setState({
    likedTracks: [],
    savedTracks: [],
    seededPlaylistIds: [],
  });
  useTravelRoomStore.setState({ roomsById: {}, roomsBySessionId: {} });
  useTravelLogSyncStore.setState({ pendingFinalizations: [] });
  useTravelSessionStore.setState({
    currentLocation: undefined,
    currentPlace: undefined,
    locationStatus: 'idle',
    locationUpdatedAt: undefined,
    recommendationMode: 'everyday',
    selectedMode: undefined,
    session: {
      id: 'local-session',
      routePoints: [],
      status: 'idle',
    },
  });
  useRecommendationCacheStore.setState({
    featuredFallback: undefined,
    featuredPlaylists: {},
    moodFallback: undefined,
    moodRecommendations: {},
  });
  useRecommendationEventStore.getState().clearEvents();
  useHomeFilterStore.setState({
    selectedMoodFilter: '전체',
  });
  usePlayerStore.getState().clearTrack();
  useUserProfileStore.getState().resetOnboarding();
  useAuthStore.getState().logoutLocal();
}
