import { Linking } from 'react-native';

import { MusicPlatformId, Track } from '@/types/domain';

export type TrackExternalLinkResult = {
  fallbackUrl?: string;
  label: string;
  platformId: MusicPlatformId;
  url?: string;
  usedFallback: boolean;
};

function createTrackQuery(track: Track) {
  const title = track.title.trim();

  if (!title) {
    return undefined;
  }

  const artist = track.artist.trim();

  return artist ? `${artist} ${title}` : title;
}

function createYoutubeMusicSearchUrl(query: string) {
  return `https://music.youtube.com/search?q=${encodeURIComponent(query)}`;
}

export function getTrackExternalLink(track: Track): TrackExternalLinkResult {
  if (track.externalUrl) {
    return {
      label: '음악 링크 열기',
      platformId: 'none',
      url: track.externalUrl,
      usedFallback: false,
    };
  }

  if (track.platformUrls?.youtubeMusic) {
    return {
      label: 'YouTube Music에서 열기',
      platformId: 'youtubeMusic',
      url: track.platformUrls.youtubeMusic,
      usedFallback: false,
    };
  }

  const query = createTrackQuery(track);

  if (!query) {
    return {
      label: '음악 링크 열기',
      platformId: 'none',
      usedFallback: true,
    };
  }

  return {
    label: 'YouTube Music에서 검색',
    platformId: 'youtubeMusic',
    url: createYoutubeMusicSearchUrl(query),
    usedFallback: true,
  };
}

export async function openMusicPlatformUrl(target: string | TrackExternalLinkResult) {
  const url = typeof target === 'string' ? target : target.url;
  const fallbackUrl = typeof target === 'string' ? undefined : target.fallbackUrl;

  if (!url) {
    throw new Error('music_platform_url_missing');
  }

  try {
    await Linking.openURL(url);
  } catch (error) {
    if (fallbackUrl && fallbackUrl !== url) {
      await Linking.openURL(fallbackUrl);
      return;
    }

    throw error;
  }
}
