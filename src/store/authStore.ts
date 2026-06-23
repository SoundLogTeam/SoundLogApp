import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  AuthProvider,
  AuthSession,
  AuthStatus,
  AuthUser,
} from '@/types/auth';

type AuthState = {
  accessToken?: string;
  errorMessage?: string;
  isHydrated: boolean;
  lastLoginProvider?: AuthProvider;
  refreshToken?: string;
  status: AuthStatus;
  updatedAt?: string;
  user?: AuthUser;
  clearAuthError: () => void;
  continueAsGuest: () => void;
  finishLogin: (session: AuthSession) => void;
  logoutLocal: () => void;
  setAuthError: (message?: string) => void;
  setHydrated: (isHydrated: boolean) => void;
  setStatus: (status: AuthStatus) => void;
};

const unauthenticatedState = {
  accessToken: undefined,
  errorMessage: undefined,
  lastLoginProvider: undefined,
  refreshToken: undefined,
  status: 'unauthenticated' as const,
  updatedAt: undefined,
  user: undefined,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...unauthenticatedState,
      isHydrated: false,
      clearAuthError: () => set({ errorMessage: undefined }),
      continueAsGuest: () =>
        set({
          ...unauthenticatedState,
          status: 'guest',
          updatedAt: new Date().toISOString(),
        }),
      finishLogin: (session) =>
        set({
          accessToken: session.accessToken,
          errorMessage: undefined,
          lastLoginProvider: session.user.provider,
          refreshToken: session.refreshToken,
          status: 'authenticated',
          updatedAt: new Date().toISOString(),
          user: session.user,
        }),
      logoutLocal: () =>
        set({
          ...unauthenticatedState,
          updatedAt: new Date().toISOString(),
        }),
      setAuthError: (message) => set({ errorMessage: message }),
      setHydrated: (isHydrated) => set({ isHydrated }),
      setStatus: (status) => set({ status }),
    }),
    {
      name: 'soundlog-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({
        accessToken: state.accessToken,
        lastLoginProvider: state.lastLoginProvider,
        refreshToken: state.refreshToken,
        status: state.status,
        updatedAt: state.updatedAt,
        user: state.user,
      }),
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
