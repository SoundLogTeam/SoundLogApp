import { AuthProvider } from '@/types/auth';

export function canUseDevSocialLoginFallback() {
  if (process.env.EXPO_PUBLIC_ENABLE_DEV_AUTH_FALLBACK === 'true') {
    return true;
  }

  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.EXPO_PUBLIC_ENABLE_DEV_AUTH_FALLBACK !== 'false'
  );
}

export function canUseSocialLogin() {
  return canUseDevSocialLoginFallback() || process.env.EXPO_PUBLIC_ENABLE_SOCIAL_LOGIN === 'true';
}

export function canUseRealSocialLogin() {
  return process.env.EXPO_PUBLIC_ENABLE_SOCIAL_LOGIN === 'true';
}

export function createDevProviderAccessToken(provider: AuthProvider) {
  if (!canUseDevSocialLoginFallback()) {
    return undefined;
  }

  return `mock-${provider}-provider-token`;
}

export function getKakaoNativeAppKey() {
  return process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY;
}
