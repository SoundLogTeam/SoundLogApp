import { create } from 'zustand';

import { MockEndpointId } from '@/mock-server/types';

export type ApiSource = 'mock' | 'server';

export const mockEndpointIds: MockEndpointId[] = [
  'auth.socialLogin',
  'auth.refresh',
  'auth.logout',
  'auth.me',
  'auth.migrateLocalData',
  'home.featuredPlaylists',
  'home.moodRecommendations',
  'home.recentMusicLogs',
  'playlist.detail',
  'recap.list',
  'recap.share',
  'tour.nearbyPlaces',
];

type DevToolsState = {
  apiSource: ApiSource;
  failedEndpointIds: MockEndpointId[];
  failAllEndpoints: boolean;
  mockDelayMs?: number;
  resetMockRuntime: () => void;
  setApiSource: (apiSource: ApiSource) => void;
  setFailAllEndpoints: (failAllEndpoints: boolean) => void;
  setMockDelayMs: (mockDelayMs?: number) => void;
  toggleFailedEndpoint: (endpointId: MockEndpointId) => void;
};

function getInitialApiSource(): ApiSource {
  if (process.env.EXPO_PUBLIC_SOUNDLOG_API_SOURCE === 'mock') {
    return 'mock';
  }

  if (
    process.env.EXPO_PUBLIC_SOUNDLOG_API_SOURCE === 'server' ||
    process.env.EXPO_PUBLIC_SOUNDLOG_API_BASE_URL
  ) {
    return 'server';
  }

  return 'mock';
}

export const useDevToolsStore = create<DevToolsState>((set) => ({
  apiSource: getInitialApiSource(),
  failedEndpointIds: [],
  failAllEndpoints: false,
  mockDelayMs: undefined,
  resetMockRuntime: () =>
    set({
      failedEndpointIds: [],
      failAllEndpoints: false,
      mockDelayMs: undefined,
    }),
  setApiSource: (apiSource) => set({ apiSource }),
  setFailAllEndpoints: (failAllEndpoints) => set({ failAllEndpoints }),
  setMockDelayMs: (mockDelayMs) => set({ mockDelayMs }),
  toggleFailedEndpoint: (endpointId) =>
    set((state) => ({
      failedEndpointIds: state.failedEndpointIds.includes(endpointId)
        ? state.failedEndpointIds.filter((id) => id !== endpointId)
        : [...state.failedEndpointIds, endpointId],
      failAllEndpoints: false,
    })),
}));
