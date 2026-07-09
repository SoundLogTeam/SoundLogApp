import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createAuthStorage } from '@/store/authStorage';
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

function normalizePersistedAuthState(persistedState: unknown) {
  if (!persistedState || typeof persistedState !== 'object') {
    return unauthenticatedState;
  }

  const state = persistedState as Partial<AuthState> & { status?: string };

  if (state.status !== 'authenticated' || !state.accessToken || !state.refreshToken || !state.user) {
    return {
      ...unauthenticatedState,
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    accessToken: state.accessToken,
    errorMessage: undefined,
    lastLoginProvider: state.lastLoginProvider,
    refreshToken: state.refreshToken,
    status: 'authenticated' as const,
    updatedAt: state.updatedAt,
    user: state.user,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...unauthenticatedState,
      isHydrated: false,
      clearAuthError: () => set({ errorMessage: undefined }),
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
      migrate: (persistedState) => normalizePersistedAuthState(persistedState),
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
      storage: createJSONStorage(createAuthStorage),
      version: 1,
    },
  ),
);
