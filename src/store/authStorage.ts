import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { StateStorage } from 'zustand/middleware';

type SecureStoreModule = typeof import('expo-secure-store');

let secureStoreModulePromise: Promise<SecureStoreModule> | undefined;

function shouldUseSecureStore() {
  return Platform.OS !== 'web';
}

function loadSecureStore() {
  secureStoreModulePromise ??= import('expo-secure-store');
  return secureStoreModulePromise;
}

export function createAuthStorage(): StateStorage {
  return {
    getItem: async (name) => {
      if (!shouldUseSecureStore()) {
        return AsyncStorage.getItem(name);
      }

      const SecureStore = await loadSecureStore();
      return SecureStore.getItemAsync(name);
    },
    removeItem: async (name) => {
      if (!shouldUseSecureStore()) {
        await AsyncStorage.removeItem(name);
        return;
      }

      const SecureStore = await loadSecureStore();
      await SecureStore.deleteItemAsync(name);
    },
    setItem: async (name, value) => {
      if (!shouldUseSecureStore()) {
        await AsyncStorage.setItem(name, value);
        return;
      }

      const SecureStore = await loadSecureStore();
      await SecureStore.setItemAsync(name, value);
    },
  };
}
