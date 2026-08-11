// Minimal stand-in for the `react-native` package under vitest (see
// vitest.config.ts alias). Only `Platform.OS` is needed by
// src/store/authStorage.ts to choose the AsyncStorage branch over
// expo-secure-store. AppState is also stubbed for hooks imported by tests.
export const Platform = {
  OS: 'web' as const,
};

export const AppState = {
  addEventListener: () => ({ remove: () => {} }),
};
