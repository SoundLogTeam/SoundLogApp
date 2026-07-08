import { Linking, Platform } from 'react-native';

import type { Track } from '@/types/domain';

export type ExternalMusicLink = {
  id: 'provided' | 'search';
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
  const links: ExternalMusicLink[] = [];

  appendUniqueLink(links, {
    id: 'search',
    label: '웹에서 곡 검색',
    url: `https://www.google.com/search?q=${searchQuery}`,
  });

  if (track.externalUrl) {
    appendUniqueLink(links, {
      id: 'provided',
      label: '제공 링크 열기',
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
