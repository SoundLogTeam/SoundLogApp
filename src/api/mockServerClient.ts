import type { MockServer } from '@/mock-server/types';

let mockServerPromise: Promise<MockServer> | undefined;

export function getMockServer() {
  mockServerPromise ??= import('@/mock-server').then((module) => module.mockServer);

  return mockServerPromise;
}
