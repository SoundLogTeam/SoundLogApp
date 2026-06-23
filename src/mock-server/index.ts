import { authMockHandlers } from '@/mock-server/authHandlers';
import { homeMockHandlers } from '@/mock-server/homeHandlers';
import { playlistMockHandlers } from '@/mock-server/playlistHandlers';
import { recapMockHandlers } from '@/mock-server/recapHandlers';
import { MockServer } from '@/mock-server/types';
import { tourMockHandlers } from '@/mock-server/tourHandlers';

export const mockServer: MockServer = {
  auth: authMockHandlers,
  home: homeMockHandlers,
  playlist: playlistMockHandlers,
  recap: recapMockHandlers,
  tour: tourMockHandlers,
};

export * from '@/mock-server/types';
