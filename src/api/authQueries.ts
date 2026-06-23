import { useMutation } from '@tanstack/react-query';

import { authApi } from '@/api/authApi';
import { LocalDataMigrationPayload, SocialLoginRequest } from '@/types/auth';

export function useSocialLoginMutation() {
  return useMutation({
    mutationFn: (request: SocialLoginRequest) => authApi.socialLogin(request),
  });
}

export function useLogoutMutation() {
  return useMutation({
    mutationFn: (refreshToken?: string) => authApi.logout(refreshToken),
  });
}

export function useLocalDataMigrationMutation() {
  return useMutation({
    mutationFn: (payload: LocalDataMigrationPayload) =>
      authApi.migrateLocalData(payload),
  });
}
