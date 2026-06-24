import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createAuthStorage } from '@/store/authStorage';

export type SpotifyAuthSession = {
  accessToken: string;
  connectedAt: string;
  displayName?: string;
  expiresAt: string;
  refreshToken?: string;
  scope?: string;
  tokenType?: string;
  userId?: string;
};

type SpotifyAuthState = {
  clearSession: () => void;
  errorMessage?: string;
  isConnecting: boolean;
  isHydrated: boolean;
  session?: SpotifyAuthSession;
  setConnecting: (isConnecting: boolean) => void;
  setError: (message?: string) => void;
  setHydrated: (isHydrated: boolean) => void;
  setSession: (session: SpotifyAuthSession) => void;
};

export const useSpotifyAuthStore = create<SpotifyAuthState>()(
  persist(
    (set) => ({
      clearSession: () =>
        set({
          errorMessage: undefined,
          isConnecting: false,
          session: undefined,
        }),
      errorMessage: undefined,
      isConnecting: false,
      isHydrated: false,
      session: undefined,
      setConnecting: (isConnecting) => set({ isConnecting }),
      setError: (errorMessage) => set({ errorMessage }),
      setHydrated: (isHydrated) => set({ isHydrated }),
      setSession: (session) =>
        set({
          errorMessage: undefined,
          isConnecting: false,
          session,
        }),
    }),
    {
      name: 'soundlog-spotify-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({
        session: state.session,
      }),
      storage: createJSONStorage(createAuthStorage),
    },
  ),
);
