import { beforeEach, describe, expect, it } from 'vitest';

import {
  applyScreenshotSeed,
  bootstrapScreenshotSeedOnce,
  resetScreenshotSeedBootstrapForTests,
} from '@/components/dev/screenshotSeedBootstrap';
import { SCREENSHOT_SEED_SESSION_ID, SCREENSHOT_SEED_USER_ID } from '@/components/dev/screenshotSeed';
import { useAuthStore } from '@/store/authStore';
import { useHomeFilterStore } from '@/store/homeFilterStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useMomentLogStore } from '@/store/momentLogStore';
import { usePlayerStore } from '@/store/playerStore';
import { useTravelLogSyncStore } from '@/store/travelLogSyncStore';
import { useTravelSessionStore } from '@/store/travelSessionStore';
import { useUserProfileStore } from '@/store/userProfileStore';

beforeEach(() => {
  resetScreenshotSeedBootstrapForTests();
  useAuthStore.setState({
    accessToken: undefined,
    isHydrated: true,
    refreshToken: undefined,
    status: 'unauthenticated',
    user: undefined,
  });
  useUserProfileStore.setState({
    isHydrated: true,
    profile: {
      completedOnboarding: false,
      locationRecommendationEnabled: true,
      preferredGenres: [],
      preferredMoods: [],
      travelStyles: [],
    },
  });
  useMomentLogStore.setState({
    logs: [],
    pendingActions: [],
    quarantinedLogs: [],
    quarantinedPendingActions: [],
  });
  useTravelSessionStore.setState({
    quarantinedSessions: [],
    session: { id: 'local-session', routePoints: [], status: 'idle' },
  });
  useLibraryStore.setState({ likedTracks: [], savedTracks: [], seededPlaylistIds: [] });
  useTravelLogSyncStore.setState({ pendingFinalizations: [] });
});

describe('screenshot seed bootstrap', () => {
  it('applies the same complete local state used by DevTestManager', () => {
    const seed = applyScreenshotSeed();

    expect(useAuthStore.getState().user?.id).toBe(SCREENSHOT_SEED_USER_ID);
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useUserProfileStore.getState().profile.completedOnboarding).toBe(true);
    expect(useHomeFilterStore.getState().selectedMoodFilter).toBe('시원한');
    expect(useTravelSessionStore.getState().session).toMatchObject({
      id: SCREENSHOT_SEED_SESSION_ID,
      status: 'ended',
    });
    expect(useMomentLogStore.getState().logs).toHaveLength(seed.momentLogs.length);
    expect(useLibraryStore.getState().savedTracks).toHaveLength(seed.library.savedTracks.length);
    expect(usePlayerStore.getState().playlistId).toBe(seed.playlist.id);
    expect(useTravelLogSyncStore.getState().pendingFinalizations).toEqual([]);
  });

  it('applies the automatic bootstrap once per app runtime', () => {
    expect(bootstrapScreenshotSeedOnce()).toBe(true);
    expect(bootstrapScreenshotSeedOnce()).toBe(false);
  });
});
