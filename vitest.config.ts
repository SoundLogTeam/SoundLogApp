import path from 'node:path';

import { defineConfig } from 'vitest/config';

// Minimal vitest setup for pure logic / zustand store unit tests only.
// RN component rendering is intentionally out of scope (see AGENTS.md /
// task notes) — this project has no test runner otherwise.
export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@react-native-async-storage/async-storage',
        replacement: path.resolve(
          __dirname,
          'src/test/mocks/asyncStorageMock.ts',
        ),
      },
      {
        find: 'react-native',
        replacement: path.resolve(__dirname, 'src/test/mocks/reactNativeMock.ts'),
      },
      { find: '@', replacement: path.resolve(__dirname, 'src') },
    ],
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
