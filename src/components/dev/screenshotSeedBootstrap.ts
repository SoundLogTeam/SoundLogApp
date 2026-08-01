import { queryClient } from '@/providers/queryClient';
import { useAuthStore } from '@/store/authStore';
import { useHomeFilterStore } from '@/store/homeFilterStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useMomentLogStore } from '@/store/momentLogStore';
import { usePlayerStore } from '@/store/playerStore';
import { useRecommendationEventStore } from '@/store/recommendationEventStore';
import { useTravelLogSyncStore } from '@/store/travelLogSyncStore';
import { useTravelSessionStore } from '@/store/travelSessionStore';
import { useUserProfileStore } from '@/store/userProfileStore';

import { createScreenshotSeed, type ScreenshotSeed } from '@/components/dev/screenshotSeed';

let hasBootstrappedScreenshotSeed = false;

export function applyScreenshotSeed(): ScreenshotSeed {
  const seed = createScreenshotSeed();

  // This is intentionally local-only. Clearing queues prevents a mock
  // account or screenshot fixture from ever being sent to the API.
  useAuthStore.getState().finishLogin(seed.authSession);
  useUserProfileStore.getState().completeOnboarding(seed.profile);
  useHomeFilterStore.getState().setSelectedMoodFilter(seed.selectedMoodFilter);
  useTravelSessionStore.setState({
    currentLocation: seed.location,
    currentPlace: seed.place,
    locationStatus: 'granted',
    locationUpdatedAt: seed.session.endedAt,
    quarantinedSessions: [],
    recommendationMode: 'travel',
    selectedMode: seed.selectedMode,
    session: seed.session,
  });
  useMomentLogStore.setState({
    logs: [],
    pendingActions: [],
    quarantinedLogs: [],
    quarantinedPendingActions: [],
  });
  seed.momentLogs.forEach((log) => useMomentLogStore.getState().addLog(log));
  useLibraryStore.setState(seed.library);
  usePlayerStore.getState().setTrack(
    seed.currentTrack,
    seed.playlist.id,
    seed.playlist.tracks,
    seed.playlist,
  );
  useTravelLogSyncStore.setState({ pendingFinalizations: [] });
  useRecommendationEventStore.getState().clearEvents();
  queryClient.clear();

  return seed;
}

export function bootstrapScreenshotSeedOnce() {
  if (hasBootstrappedScreenshotSeed) {
    return false;
  }

  applyScreenshotSeed();
  hasBootstrappedScreenshotSeed = true;
  return true;
}

export function resetScreenshotSeedBootstrapForTests() {
  hasBootstrappedScreenshotSeed = false;
}
