import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { getKakaoNativeAppKey } from '@/api/authConfig';
import {
  AuthDeviceInfo,
  AuthProvider,
  SocialLoginRequest,
} from '@/types/auth';

type AppleAuthenticationModule = typeof import('expo-apple-authentication');
type AppleFullName =
  import('expo-apple-authentication').AppleAuthenticationFullName;

type NativeSocialLoginErrorCode =
  | 'cancelled'
  | 'not_configured'
  | 'provider_failed'
  | 'unsupported';

export class NativeSocialLoginError extends Error {
  code: NativeSocialLoginErrorCode;
  provider: AuthProvider;

  constructor(
    code: NativeSocialLoginErrorCode,
    provider: AuthProvider,
    message: string,
  ) {
    super(message);
    this.name = 'NativeSocialLoginError';
    this.code = code;
    this.provider = provider;
  }
}

let initializedKakaoAppKey: string | undefined;

function getDevicePlatform(): AuthDeviceInfo['platform'] {
  if (Platform.OS === 'ios') {
    return 'ios';
  }

  if (Platform.OS === 'android') {
    return 'android';
  }

  return 'web';
}

export function createAuthDeviceInfo(): AuthDeviceInfo {
  return {
    appVersion: Constants.expoConfig?.version ?? '1.0.0',
    deviceId: `${Platform.OS}-soundlog-device`,
    platform: getDevicePlatform(),
  };
}

export function isNativeSocialProviderSupported(provider: AuthProvider) {
  return Platform.OS === 'ios' && (provider === 'apple' || provider === 'kakao');
}

function isCancelLikeError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = 'code' in error ? String(error.code) : '';
  const message = 'message' in error ? String(error.message) : '';
  const normalized = `${code} ${message}`.toLowerCase();

  return (
    normalized.includes('cancel') ||
    normalized.includes('canceled') ||
    normalized.includes('cancelled') ||
    normalized.includes('user cancelled') ||
    code === 'ERR_REQUEST_CANCELED'
  );
}

function formatAppleFullName(
  AppleAuthentication: AppleAuthenticationModule,
  fullName: AppleFullName | null,
) {
  if (!fullName) {
    return undefined;
  }

  try {
    const formatted = AppleAuthentication.formatFullName(fullName).trim();

    if (formatted) {
      return formatted;
    }
  } catch {
    // Fall through to a small manual formatter if native formatting is unavailable.
  }

  const fallback = [
    fullName.familyName,
    fullName.givenName,
    fullName.middleName,
    fullName.nickname,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return fallback || undefined;
}

async function createAppleLoginRequest(): Promise<SocialLoginRequest> {
  if (Platform.OS !== 'ios') {
    throw new NativeSocialLoginError(
      'unsupported',
      'apple',
      'Apple 로그인은 iOS 앱에서만 사용할 수 있습니다.',
    );
  }

  const AppleAuthentication = await import('expo-apple-authentication');
  const isAvailable = await AppleAuthentication.isAvailableAsync();

  if (!isAvailable) {
    throw new NativeSocialLoginError(
      'unsupported',
      'apple',
      '이 기기에서 Apple 로그인을 사용할 수 없습니다.',
    );
  }

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new NativeSocialLoginError(
        'provider_failed',
        'apple',
        'Apple 인증 토큰을 받지 못했습니다.',
      );
    }

    return {
      authorizationCode: credential.authorizationCode ?? undefined,
      device: createAuthDeviceInfo(),
      idToken: credential.identityToken,
      provider: 'apple',
      providerDisplayName:
        formatAppleFullName(AppleAuthentication, credential.fullName) ??
        credential.email ??
        undefined,
      redirectUri: 'soundlog://auth/callback',
    };
  } catch (error) {
    if (error instanceof NativeSocialLoginError) {
      throw error;
    }

    if (isCancelLikeError(error)) {
      throw new NativeSocialLoginError(
        'cancelled',
        'apple',
        'Apple 로그인이 취소됐어요.',
      );
    }

    throw error;
  }
}

async function ensureKakaoInitialized() {
  const nativeAppKey = getKakaoNativeAppKey();

  if (!nativeAppKey) {
    throw new NativeSocialLoginError(
      'not_configured',
      'kakao',
      'Kakao Native App Key가 설정되지 않았습니다.',
    );
  }

  if (initializedKakaoAppKey === nativeAppKey) {
    return;
  }

  const { initializeKakaoSDK } = await import('@react-native-kakao/core');
  await initializeKakaoSDK(nativeAppKey);
  initializedKakaoAppKey = nativeAppKey;
}

async function createKakaoLoginRequest(): Promise<SocialLoginRequest> {
  if (Platform.OS !== 'ios') {
    throw new NativeSocialLoginError(
      'unsupported',
      'kakao',
      'Kakao 로그인은 현재 iOS 앱에서만 제공합니다.',
    );
  }

  await ensureKakaoInitialized();

  try {
    const { isKakaoTalkLoginAvailable, login } = await import(
      '@react-native-kakao/user'
    );
    const canUseKakaoTalk = await isKakaoTalkLoginAvailable().catch(() => false);
    const token = await login({
      useKakaoAccountLogin: !canUseKakaoTalk,
    });

    if (!token.accessToken) {
      throw new NativeSocialLoginError(
        'provider_failed',
        'kakao',
        'Kakao 인증 토큰을 받지 못했습니다.',
      );
    }

    return {
      device: createAuthDeviceInfo(),
      idToken: token.idToken,
      provider: 'kakao',
      providerAccessToken: token.accessToken,
      redirectUri: 'soundlog://auth/callback',
    };
  } catch (error) {
    if (error instanceof NativeSocialLoginError) {
      throw error;
    }

    if (isCancelLikeError(error)) {
      throw new NativeSocialLoginError(
        'cancelled',
        'kakao',
        'Kakao 로그인이 취소됐어요.',
      );
    }

    throw error;
  }
}

export function createNativeSocialLoginRequest(provider: AuthProvider) {
  switch (provider) {
    case 'apple':
      return createAppleLoginRequest();
    case 'kakao':
      return createKakaoLoginRequest();
    default:
      throw new NativeSocialLoginError(
        'unsupported',
        provider,
        '지원하지 않는 로그인 방식입니다.',
      );
  }
}

export function getNativeSocialLoginErrorMessage(error: unknown) {
  if (!(error instanceof NativeSocialLoginError)) {
    return '로그인에 실패했어요. 잠시 후 다시 시도해주세요.';
  }

  if (error.code === 'cancelled') {
    return error.message;
  }

  if (error.code === 'not_configured') {
    return 'Kakao 로그인을 사용하려면 Native App Key 설정이 필요해요.';
  }

  if (error.code === 'unsupported') {
    return error.message;
  }

  return '로그인에 실패했어요. 잠시 후 다시 시도해주세요.';
}
