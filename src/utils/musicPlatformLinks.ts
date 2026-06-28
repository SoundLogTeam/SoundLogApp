import { Linking } from 'react-native';

import { MusicPlatformId, Track } from '@/types/domain';

export type MusicPlatformOption = {
  description: string;
  id: MusicPlatformId;
  label: string;
  shortLabel: string;
};

export type TrackExternalLinkResult = {
  fallbackUrl?: string;
  label: string;
  platformId: MusicPlatformId;
  url?: string;
  usedFallback: boolean;
};

export const musicPlatformOptions: MusicPlatformOption[] = [
  {
    description: '플랫폼을 정하지 않고 기본 링크나 YouTube Music 검색으로 열어요.',
    id: 'none',
    label: '미설정',
    shortLabel: '미설정',
  },
  {
    description: 'Spotify 앱으로 먼저 열고, 실패하면 웹 링크로 열어요.',
    id: 'spotify',
    label: 'Spotify',
    shortLabel: 'Spotify',
  },
  {
    description: 'Melon 검색 링크로 열어요.',
    id: 'melon',
    label: 'Melon',
    shortLabel: 'Melon',
  },
  {
    description: 'YouTube Music 검색으로 열어요.',
    id: 'youtubeMusic',
    label: 'YouTube Music',
    shortLabel: 'YouTube',
  },
];

export function getMusicPlatformOption(id: MusicPlatformId) {
  return musicPlatformOptions.find((option) => option.id === id) ?? musicPlatformOptions[0];
}

function createTrackQuery(track: Track) {
  const title = track.title.trim();

  if (!title) {
    return undefined;
  }

  const artist = track.artist.trim();

  return artist ? `${artist} ${title}` : title;
}

function createSearchUrl(platformId: MusicPlatformId, query: string) {
  const encodedQuery = encodeURIComponent(query);

  if (platformId === 'spotify') {
    return `https://open.spotify.com/search/${encodedQuery}`;
  }

  if (platformId === 'melon') {
    return `https://www.melon.com/search/total/index.htm?q=${encodedQuery}`;
  }

  return `https://music.youtube.com/search?q=${encodedQuery}`;
}

function createSpotifySearchAppUrl(query: string) {
  return `spotify:search:${encodeURIComponent(query)}`;
}

function createSpotifyAppUrlFromWebUrl(url: string) {
  if (url.startsWith('spotify:')) {
    return url;
  }

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname !== 'open.spotify.com') {
      return undefined;
    }

    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    const contentTypes = new Set(['album', 'artist', 'episode', 'playlist', 'show', 'track']);
    const contentIndex = pathSegments.findIndex((segment) => contentTypes.has(segment));

    if (contentIndex >= 0) {
      const contentType = pathSegments[contentIndex];
      const contentId = pathSegments[contentIndex + 1];

      return contentId ? `spotify:${contentType}:${contentId}` : undefined;
    }

    const searchIndex = pathSegments.findIndex((segment) => segment === 'search');
    const encodedSearchQuery = pathSegments[searchIndex + 1];

    if (searchIndex >= 0 && encodedSearchQuery) {
      return createSpotifySearchAppUrl(decodeURIComponent(encodedSearchQuery));
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function createSpotifyOpenTarget(platformUrl?: string, query?: string) {
  const webUrl =
    platformUrl && !platformUrl.startsWith('spotify:')
      ? platformUrl
      : query
        ? createSearchUrl('spotify', query)
        : undefined;
  const appUrl =
    (platformUrl ? createSpotifyAppUrlFromWebUrl(platformUrl) : undefined) ??
    (query ? createSpotifySearchAppUrl(query) : undefined);

  return {
    fallbackUrl: appUrl && webUrl && appUrl !== webUrl ? webUrl : undefined,
    url: appUrl ?? webUrl,
  };
}

export function getTrackExternalLink(
  track: Track,
  selectedPlatformId: MusicPlatformId,
): TrackExternalLinkResult {
  const platform = getMusicPlatformOption(selectedPlatformId);
  const platformUrl =
    selectedPlatformId === 'none' ? undefined : track.platformUrls?.[selectedPlatformId];

  if (platformUrl) {
    if (selectedPlatformId === 'spotify') {
      const spotifyTarget = createSpotifyOpenTarget(platformUrl, createTrackQuery(track));

      return {
        fallbackUrl: spotifyTarget.fallbackUrl,
        label: 'Spotify 앱에서 열기',
        platformId: selectedPlatformId,
        url: spotifyTarget.url,
        usedFallback: false,
      };
    }

    return {
      label: `${platform.shortLabel}에서 열기`,
      platformId: selectedPlatformId,
      url: platformUrl,
      usedFallback: false,
    };
  }

  if (selectedPlatformId === 'none' && track.externalUrl) {
    return {
      label: '외부 음악 앱에서 열기',
      platformId: selectedPlatformId,
      url: track.externalUrl,
      usedFallback: false,
    };
  }

  const query = createTrackQuery(track);

  if (!query) {
    return {
      label: `${platform.shortLabel}에서 열기`,
      platformId: selectedPlatformId,
      usedFallback: true,
    };
  }

  if (selectedPlatformId === 'spotify') {
    const spotifyTarget = createSpotifyOpenTarget(undefined, query);

    return {
      fallbackUrl: spotifyTarget.fallbackUrl,
      label: 'Spotify 앱에서 검색',
      platformId: selectedPlatformId,
      url: spotifyTarget.url,
      usedFallback: true,
    };
  }

  return {
    label:
      selectedPlatformId === 'none'
        ? 'YouTube Music에서 검색'
        : `${platform.shortLabel}에서 검색`,
    platformId: selectedPlatformId,
    url: createSearchUrl(selectedPlatformId, query),
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
