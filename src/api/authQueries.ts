import { useMutation } from '@tanstack/react-query';

import { authApi } from '@/api/authApi';
import { LoginRequest, RegisterRequest } from '@/types/auth';

export function useLoginMutation() {
  return useMutation({
    mutationFn: (request: LoginRequest) => authApi.login(request),
  });
}

export function useDeleteAccountMutation() {
  return useMutation({
    mutationFn: () => authApi.deleteAccount(),
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (request: RegisterRequest) => authApi.register(request),
  });
}

export function useLogoutMutation() {
  return useMutation({
    mutationFn: (refreshToken?: string) => authApi.logout(refreshToken),
  });
}
