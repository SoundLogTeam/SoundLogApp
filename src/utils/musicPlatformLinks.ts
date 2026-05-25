import { Linking } from 'react-native';

import { MusicPlatformId, Track } from '@/types/domain';

export type MusicPlatformOption = {
  description: string;
  id: MusicPlatformId;
  label: string;
  shortLabel: string;
};

export type TrackExternalLinkResult = {
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
    description: 'Spotify 웹 링크 또는 검색으로 열어요.',
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

export function getTrackExternalLink(
  track: Track,
  selectedPlatformId: MusicPlatformId,
): TrackExternalLinkResult {
  const platform = getMusicPlatformOption(selectedPlatformId);
  const platformUrl =
    selectedPlatformId === 'none' ? undefined : track.platformUrls?.[selectedPlatformId];

  if (platformUrl) {
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

export async function openMusicPlatformUrl(url: string) {
  await Linking.openURL(url);
}
