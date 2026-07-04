import { create } from 'zustand';

export const mockEndpointIds = [
  'auth.login',
  'auth.register',
  'auth.refresh',
  'auth.logout',
  'auth.me',
  'auth.migrateLocalData',
  'home.featuredPlaylists',
  'home.moodRecommendations',
  'home.recentMusicLogs',
  'playlist.detail',
  'recap.create',
  'recap.list',
  'recap.share',
  'tour.nearbyPlaces',
] as const;

export type MockEndpointId = (typeof mockEndpointIds)[number];

type DevToolsState = {
  failedEndpointIds: MockEndpointId[];
  failAllEndpoints: boolean;
  mockDelayMs?: number;
  resetMockRuntime: () => void;
  setFailAllEndpoints: (failAllEndpoints: boolean) => void;
  setMockDelayMs: (mockDelayMs?: number) => void;
  toggleFailedEndpoint: (endpointId: MockEndpointId) => void;
};

export const useDevToolsStore = create<DevToolsState>((set) => ({
  failedEndpointIds: [],
  failAllEndpoints: false,
  mockDelayMs: undefined,
  resetMockRuntime: () =>
    set({
      failedEndpointIds: [],
      failAllEndpoints: false,
      mockDelayMs: undefined,
    }),
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
