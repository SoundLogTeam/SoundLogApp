import { MoodRecommendation, PlaylistCuration, RecapItem, Track } from '@/types/domain';

const SUPPORTED_PLATFORM_IDS = ['melon', 'youtubeMusic'] as const;
const SUPPORTED_EXTERNAL_HOSTS = ['music.youtube.com'];

function sanitizePlatformUrls(platformUrls: Track['platformUrls']) {
  if (!platformUrls) {
    return undefined;
  }

  const nextPlatformUrls: Track['platformUrls'] = {};

  SUPPORTED_PLATFORM_IDS.forEach((platformId) => {
    const url = platformUrls[platformId];

    if (url) {
      nextPlatformUrls[platformId] = url;
    }
  });

  return Object.keys(nextPlatformUrls).length > 0 ? nextPlatformUrls : undefined;
}

function isSupportedExternalUrl(url?: string) {
  if (!url) {
    return false;
  }

  try {
    const host = new URL(url).hostname.toLowerCase();

    return (
      SUPPORTED_EXTERNAL_HOSTS.includes(host) ||
      host === 'melon.com' ||
      host.endsWith('.melon.com')
    );
  } catch {
    return false;
  }
}

export function sanitizeTrack(track: Track): Track {
  const platformUrls = sanitizePlatformUrls(track.platformUrls);
  const externalUrl = isSupportedExternalUrl(track.externalUrl) ? track.externalUrl : undefined;
  const nextTrack = { ...track };

  if (platformUrls) {
    nextTrack.platformUrls = platformUrls;
  } else {
    delete nextTrack.platformUrls;
  }

  if (externalUrl) {
    nextTrack.externalUrl = externalUrl;
  } else {
    delete nextTrack.externalUrl;
  }

  return nextTrack;
}

export function sanitizeMoodRecommendation(item: MoodRecommendation): MoodRecommendation {
  return {
    ...item,
    track: sanitizeTrack(item.track),
  };
}

export function sanitizePlaylistCuration(playlist: PlaylistCuration): PlaylistCuration {
  return {
    ...playlist,
    tracks: playlist.tracks.map(sanitizeTrack),
  };
}

export function sanitizeRecapItem(item: RecapItem): RecapItem {
  return {
    ...item,
    representativeTrack: sanitizeTrack(item.representativeTrack),
  };
}
