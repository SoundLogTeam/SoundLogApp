import { mockServerDelay } from '@/mock-server/delay';
import { NearbyPlacesMockParams } from '@/mock-server/types';
import { getMockNearbyPlaces } from '@/mocks/tourMocks';

export const tourMockHandlers = {
  getNearbyPlaces: ({ location }: NearbyPlacesMockParams) =>
    mockServerDelay('tour.nearbyPlaces', getMockNearbyPlaces(location)),
};
