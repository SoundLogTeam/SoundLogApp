import { MockDelayOptions, MockEndpointId } from '@/mock-server/types';

const DEFAULT_DELAY_MS = 300;

function getConfiguredDelayMs() {
  const rawValue = process.env.EXPO_PUBLIC_MOCK_API_DELAY_MS;
  const parsedValue = rawValue ? Number(rawValue) : DEFAULT_DELAY_MS;

  return Number.isFinite(parsedValue) && parsedValue >= 0
    ? parsedValue
    : DEFAULT_DELAY_MS;
}

function getFailedEndpointSet() {
  return new Set(
    (process.env.EXPO_PUBLIC_MOCK_API_FAIL_ENDPOINTS ?? '')
      .split(',')
      .map((endpointId) => endpointId.trim())
      .filter(Boolean),
  );
}

function shouldFailEndpoint(endpointId: MockEndpointId, shouldFail?: boolean) {
  if (shouldFail) {
    return true;
  }

  const failedEndpointSet = getFailedEndpointSet();

  return failedEndpointSet.has('*') || failedEndpointSet.has(endpointId);
}

export function mockServerDelay<T>(
  endpointId: MockEndpointId,
  data: T,
  options: MockDelayOptions = {},
): Promise<T> {
  const delayMs = options.delayMs ?? getConfiguredDelayMs();

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFailEndpoint(endpointId, options.shouldFail)) {
        reject(new Error(`mock_server_failed:${endpointId}`));
        return;
      }

      resolve(data);
    }, delayMs);
  });
}
