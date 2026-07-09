import { Linking, Platform } from 'react-native';

import type { ExternalMusicPlatformId, Track } from '@/types/domain';

export type ExternalMusicLink = {
  fallbackUrl?: string;
  id: ExternalMusicPlatformId | 'provided' | 'search';
  label: string;
  url: string;
};

const platformLabels: Partial<Record<ExternalMusicPlatformId, string>> = {
  melon: 'Melon에서 열기',
  spotify: 'Spotify에서 열기',
  youtube: 'YouTube 검색',
  youtubeMusic: 'YouTube Music',
};

function createTrackSearchQuery(track: Track) {
  return encodeURIComponent(`${track.title} ${track.artist}`.trim());
}

function createGeneratedPlatformUrls(
  searchQuery: string,
): Partial<Record<ExternalMusicPlatformId, string>> {
  return {
    spotify: `https://open.spotify.com/search/${searchQuery}`,
    youtube: `https://www.youtube.com/results?search_query=${searchQuery}`,
    youtubeMusic: `https://music.youtube.com/search?q=${searchQuery}`,
  };
}

function appendUniqueLink(links: ExternalMusicLink[], link: ExternalMusicLink) {
  if (links.some((item) => item.url === link.url || item.id === link.id)) {
    return;
  }

  links.push(link);
}

export function getExternalMusicLinks(track: Track): ExternalMusicLink[] {
  const searchQuery = createTrackSearchQuery(track);
  const generatedUrls = createGeneratedPlatformUrls(searchQuery);
  const links: ExternalMusicLink[] = [];
  const orderedPlatforms: ExternalMusicPlatformId[] = [
    'spotify',
    'youtubeMusic',
    'youtube',
    'melon',
  ];

  orderedPlatforms.forEach((platform) => {
    const url = track.platformUrls?.[platform] ?? generatedUrls[platform];

    if (!url) {
      return;
    }

    appendUniqueLink(links, {
      fallbackUrl: generatedUrls[platform],
      id: platform,
      label: platformLabels[platform] ?? '외부 앱에서 열기',
      url,
    });
  });

  if (track.externalUrl) {
    appendUniqueLink(links, {
      fallbackUrl: generatedUrls.youtube,
      id: 'provided',
      label: '제공 링크 열기',
      url: track.externalUrl,
    });
  }

  appendUniqueLink(links, {
    id: 'search',
    label: '웹에서 곡 검색',
    url: `https://www.google.com/search?q=${searchQuery}`,
  });

  return links;
}

export async function openExternalMusicLink(link: ExternalMusicLink) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(link.url, '_blank', 'noopener,noreferrer');
    return;
  }

  try {
    await Linking.openURL(link.url);
  } catch (error) {
    if (!link.fallbackUrl || link.fallbackUrl === link.url) {
      throw error;
    }

    await Linking.openURL(link.fallbackUrl);
  }
}
