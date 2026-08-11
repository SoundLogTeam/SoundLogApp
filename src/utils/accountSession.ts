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

/**
 * Resets authentication state PLUS every store that is just a local cache of
 * server data the current account can refetch (library likes/saves, profile,
 * recommendation caches, travel rooms, recommendation events, and the React
 * Query cache). None of that is user-authored or unsynced, so clearing it
 * can't lose anything — and leaving it around is exactly what let a
 * previous account's data render on screen after someone else logs in.
 *
 * Used on the silent token-refresh-failure path so an expired session
 * prompts re-login WITHOUT discarding unsynced local data: pending moment
 * log actions, in-progress recap drafts, the active travel session and its
 * route points, and pending Log finalizations. Those are preserved (see
 * momentLogStore's `quarantinedLogs` / `quarantinedPendingActions` and
 * travelSessionStore's `quarantinedSessions`) and are gated back into
 * visibility + sync (see momentLogSync.ts / travelLogSync.ts, and each
 * store's own synchronous `useAuthStore.subscribe(...)` -> `reconcileOwnership`
 * call) only once the SAME account re-authenticates; a different account
 * never sees them, not even for a single render frame.
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
  useMomentLogStore.setState({
    logs: [],
    pendingActions: [],
    quarantinedLogs: [],
    quarantinedPendingActions: [],
  });
  useTravelLogSyncStore.setState({ pendingFinalizations: [] });
  useTravelSessionStore.setState({
    currentLocation: undefined,
    currentPlace: undefined,
    locationStatus: 'idle',
    locationUpdatedAt: undefined,
    quarantinedSessions: [],
    recommendationMode: 'everyday',
    selectedMode: undefined,
    session: {
      id: 'local-session',
      routePoints: [],
      status: 'idle',
    },
  });
  useHomeFilterStore.setState({
    selectedMoodFilter: '전체',
  });
  usePlayerStore.getState().clearTrack();
}
