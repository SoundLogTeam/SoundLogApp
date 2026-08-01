import { describe, expect, it } from 'vitest';

import {
  createScreenshotSeed,
  SCREENSHOT_SEED_LOCATION,
  SCREENSHOT_SEED_SESSION_ID,
  SCREENSHOT_SEED_USER_ID,
} from '@/components/dev/screenshotSeed';

describe('createScreenshotSeed', () => {
  it('prepares one internally consistent, ended Gwangalli trip for App Store screenshots', () => {
    const seed = createScreenshotSeed(new Date('2026-08-02T01:15:00.000Z'));

    expect(seed.authSession.user.id).toBe(SCREENSHOT_SEED_USER_ID);
    expect(seed.profile.preferredMoods).toContain('시원한');
    expect(seed.location).toEqual(SCREENSHOT_SEED_LOCATION);
    expect(seed.place.title).toBe('광안리 해수욕장');
    expect(seed.selectedMoodFilter).toBe('시원한');
    expect(seed.selectedMode).toBe('ocean');
    expect(seed.playlist.tracks.map((track) => track.id)).toContain(seed.currentTrack.id);
    expect(seed.library.seededPlaylistIds).toEqual([seed.playlist.id]);
    expect(seed.library.likedTracks.every((record) => record.playlistId === seed.playlist.id)).toBe(
      true,
    );
    expect(seed.library.savedTracks.every((record) => record.playlistId === seed.playlist.id)).toBe(
      true,
    );
    expect(seed.library.likedTracks).toHaveLength(2);
    expect(seed.library.savedTracks).toHaveLength(2);
    expect(seed.momentLogs).toHaveLength(3);
    expect(seed.momentLogs.every((log) => log.sessionId === SCREENSHOT_SEED_SESSION_ID)).toBe(true);
    expect(seed.momentLogs.every((log) => log.syncStatus === 'synced')).toBe(true);
    expect(seed.session).toMatchObject({
      id: SCREENSHOT_SEED_SESSION_ID,
      ownerUserId: SCREENSHOT_SEED_USER_ID,
      status: 'ended',
    });
    expect(seed.session.routePoints).toHaveLength(4);
    expect(new Date(seed.session.endedAt).getTime()).toBeGreaterThan(
      new Date(seed.session.startedAt).getTime(),
    );
  });
});
