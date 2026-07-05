import { MoodRecommendation, PlaylistCuration, RecapItem, Track } from '@/types/domain';

export function sanitizeTrack(track: Track): Track {
  const nextTrack = { ...track };

  delete nextTrack.externalUrl;
  delete nextTrack.platformUrls;

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
