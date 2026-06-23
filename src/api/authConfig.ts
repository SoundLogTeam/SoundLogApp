import { AuthProvider } from '@/types/auth';

export function canUseDevSocialLoginFallback() {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.EXPO_PUBLIC_ENABLE_DEV_AUTH_FALLBACK !== 'false'
  );
}

export function createDevProviderAccessToken(provider: AuthProvider) {
  if (!canUseDevSocialLoginFallback()) {
    return undefined;
  }

  return `mock-${provider}-provider-token`;
}
