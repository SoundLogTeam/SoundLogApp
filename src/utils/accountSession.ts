import { queryClient } from '@/providers/queryClient';
import { useAuthStore } from '@/store/authStore';
import { useHomeFilterStore } from '@/store/homeFilterStore';
import { useLibraryStore } from '@/store/libraryStore';
import { usePlayerStore } from '@/store/playerStore';
import { useRecommendationCacheStore } from '@/store/recommendationCacheStore';
import { useRecommendationEventStore } from '@/store/recommendationEventStore';
import { useTravelRoomStore } from '@/store/travelRoomStore';
import { useTravelSessionStore } from '@/store/travelSessionStore';
import { useUserProfileStore } from '@/store/userProfileStore';

/**
 * Resets authentication state PLUS every store that is just a local cache of
 * server data the current account can refetch (library likes/saves, profile,
 * recommendation caches, travel rooms, recommendation events, and the React
 * Query cache). None of that is user-authored or unsynced, so clearing it
 * can't lose anything — and leaving it around is exactly what let a
 * previous account's data render on screen after someone else logs in.
 *
 * Used on the silent token-refresh-failure path so an expired session
 * prompts re-login without discarding the active travel session and its
 * route points. The travel session is preserved in quarantine and restored
 * only when the same account signs in again.
 *
 * Use `clearAccountSession` instead for explicit logout / account deletion,
 * where wiping all local data — including those preserved drafts — is the
 * intended, user-initiated behavior.
 */
export function clearAuthSession() {
  queryClient.clear();
  useLibraryStore.setState({
    likedTracks: [],
    savedTracks: [],
    seededPlaylistIds: [],
  });
  useTravelRoomStore.setState({ roomsById: {}, roomsBySessionId: {} });
  useRecommendationCacheStore.setState({
    featuredFallback: undefined,
    featuredPlaylists: {},
    moodFallback: undefined,
    moodRecommendations: {},
  });
  useRecommendationEventStore.getState().clearEvents();
  useUserProfileStore.getState().resetOnboarding();
  useAuthStore.getState().logoutLocal();
}

export function clearAccountSession() {
  clearAuthSession();
  useTravelSessionStore.setState({
    currentLocation: undefined,
    currentPlace: undefined,
    locationStatus: 'idle',
    locationUpdatedAt: undefined,
    quarantinedSessions: [],
    recommendationMode: 'everyday',
    selectedMode: undefined,
    session: {
      id: 'idle',
      routePoints: [],
      status: 'idle',
    },
  });
  useHomeFilterStore.setState({
    selectedMoodFilter: '전체',
  });
  usePlayerStore.getState().clearTrack();
}
