// Minimal stand-in for the `react-native` package under vitest (see
// vitest.config.ts alias). Only `Platform.OS` is needed by
// src/store/authStorage.ts to choose the AsyncStorage branch over
// expo-secure-store, and AppState is referenced by
// src/providers/MomentLogSyncWorker.tsx (not exercised by these unit
// tests, but stubbed for safety if it's ever imported transitively).
export const Platform = {
  OS: 'web' as const,
};

export const AppState = {
  addEventListener: () => ({ remove: () => {} }),
};
