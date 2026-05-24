type MockDelayOptions = {
  delayMs?: number;
  shouldFail?: boolean;
};

export function mockDelay<T>(data: T, options: MockDelayOptions = {}): Promise<T> {
  const { delayMs = 300, shouldFail = false } = options;

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
