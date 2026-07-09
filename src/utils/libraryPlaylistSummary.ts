import type { LibraryPlaylistSummary, PlaylistCuration } from '@/types/domain';

export function toLibraryPlaylistSummary(
  playlist: PlaylistCuration,
): LibraryPlaylistSummary {
  return {
    id: playlist.id,
    regionName: playlist.regionName,
    placeName: playlist.placeName,
    reason: playlist.reason,
    coverImageUrl: playlist.coverImageUrl,
    backgroundImageUrl: playlist.backgroundImageUrl,
    trackCount: playlist.trackCount,
    durationText: playlist.durationText,
  };
}
