import { Linking, Platform } from 'react-native';

import type { Track } from '@/types/domain';

export type ExternalMusicLink = {
  id: 'melon' | 'spotify' | 'web' | 'youtube' | 'youtubeMusic';
  label: string;
  url: string;
};

function createTrackSearchQuery(track: Track) {
  return encodeURIComponent(`${track.title} ${track.artist}`.trim());
}

function appendUniqueLink(links: ExternalMusicLink[], link: ExternalMusicLink) {
  if (links.some((item) => item.url === link.url || item.id === link.id)) {
    return;
  }

  links.push(link);
}

export function getExternalMusicLinks(track: Track): ExternalMusicLink[] {
  const searchQuery = createTrackSearchQuery(track);
  const links: ExternalMusicLink[] = [
    {
      id: 'spotify',
      label: 'Spotify에서 열기',
      url: `https://open.spotify.com/search/${searchQuery}`,
    },
  ];

  appendUniqueLink(links, {
    id: 'youtubeMusic',
    label: 'YouTube Music',
    url: track.platformUrls?.youtubeMusic ?? `https://music.youtube.com/search?q=${searchQuery}`,
  });

  appendUniqueLink(links, {
    id: 'youtube',
    label: 'YouTube 검색',
    url: `https://www.youtube.com/results?search_query=${searchQuery}`,
  });

  if (track.platformUrls?.melon) {
    appendUniqueLink(links, {
      id: 'melon',
      label: 'Melon에서 열기',
      url: track.platformUrls.melon,
    });
  }

  if (track.externalUrl) {
    appendUniqueLink(links, {
      id: 'web',
      label: '음악 링크 열기',
      url: track.externalUrl,
    });
  }

  return links;
}

export async function openExternalMusicLink(link: ExternalMusicLink) {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.open(link.url, '_blank', 'noopener,noreferrer');
    return;
  }

  await Linking.openURL(link.url);
}
