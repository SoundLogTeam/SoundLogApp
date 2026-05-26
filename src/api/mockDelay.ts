type MockDelayOptions = {
  delayMs?: number;
  shouldFail?: boolean;
};

const DEFAULT_DELAY_MS = 300;

function getFallbackDelayMs(delayMs?: number) {
  if (delayMs !== undefined) {
    return delayMs;
  }

  const rawValue = process.env.EXPO_PUBLIC_MOCK_API_DELAY_MS;
  const parsedValue = rawValue ? Number(rawValue) : DEFAULT_DELAY_MS;

  return Number.isFinite(parsedValue) && parsedValue >= 0
    ? parsedValue
    : DEFAULT_DELAY_MS;
}

export function mockDelay<T>(
  data: T,
  options: MockDelayOptions = {},
): Promise<T> {
  const { shouldFail = false } = options;
  const delayMs = getFallbackDelayMs(options.delayMs);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error('Mock request failed'));
        return;
      }

      resolve(data);
    }, delayMs);
  });
}
