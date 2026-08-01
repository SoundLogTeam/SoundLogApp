// Minimal in-memory stand-in for @react-native-async-storage/async-storage,
// used only under vitest (see vitest.config.ts alias). Zustand's `persist`
// middleware just needs an object satisfying getItem/setItem/removeItem.
const memoryStore = new Map<string, string>();

const AsyncStorageMock = {
  clear: async () => {
    memoryStore.clear();
  },
  getItem: async (key: string) => memoryStore.get(key) ?? null,
  removeItem: async (key: string) => {
    memoryStore.delete(key);
  },
  setItem: async (key: string, value: string) => {
    memoryStore.set(key, value);
  },
};

export default AsyncStorageMock;
