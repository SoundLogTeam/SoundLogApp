import { MoodRecommendation, PlaylistCuration, RecapItem, Track } from '@/types/domain';

function sanitizeUrl(value?: string) {
  const trimmed = value?.trim();

  return trimmed || undefined;
}

function sanitizePlatformUrls(platformUrls?: Track['platformUrls']) {
  if (!platformUrls) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(platformUrls).filter(([, url]) => Boolean(sanitizeUrl(url))),
  ) as Track['platformUrls'];
}

export function sanitizeTrack(track: Track): Track {
  return {
    ...track,
    externalUrl: sanitizeUrl(track.externalUrl),
    platformUrls: sanitizePlatformUrls(track.platformUrls),
  };
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
