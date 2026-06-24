import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import {
  canUseDevSocialLoginFallback,
  canUseSocialLogin,
  createDevProviderAccessToken,
} from '@/api/authConfig';
import { useSocialLoginMutation } from '@/api/authQueries';
import {
  createAuthDeviceInfo,
  createNativeSocialLoginRequest,
  getNativeSocialLoginErrorMessage,
  isNativeSocialProviderSupported,
} from '@/auth/nativeSocialLogin';
import { AppText } from '@/components/AppText';
import { BrandLogo } from '@/components/BrandLogo';
import { Screen } from '@/components/Screen';
import { useAuthStore } from '@/store/authStore';
import { useUserProfileStore } from '@/store/userProfileStore';
import { AuthProvider } from '@/types/auth';

type ProviderOption = {
  accent: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  id: AuthProvider;
  label: string;
};

const providerOptions: ProviderOption[] = [
  {
    accent: '#F5F5F7',
    description: 'Apple 계정으로 빠르게 이어서 사용할 수 있어요.',
    icon: 'smartphone',
    id: 'apple',
    label: 'Apple로 계속하기',
  },
  {
    accent: '#FEE500',
    description: '국내 사용자에게 익숙한 로그인 흐름이에요.',
    icon: 'message-circle',
    id: 'kakao',
    label: 'Kakao로 계속하기',
  },
];

function getNextRoute(completedOnboarding: boolean) {
  return (completedOnboarding ? '/' : '/onboarding') as never;
}

export default function LoginScreen() {
  const [selectedProvider, setSelectedProvider] = useState<AuthProvider>();
  const socialLoginMutation = useSocialLoginMutation();
  const isDevAuthFallbackEnabled = canUseDevSocialLoginFallback();
  const isSocialLoginEnabled = canUseSocialLogin();
  const visibleProviderOptions = providerOptions.filter(
    (provider) =>
      isDevAuthFallbackEnabled || isNativeSocialProviderSupported(provider.id),
  );
  const canRenderProviderButtons =
    isSocialLoginEnabled && visibleProviderOptions.length > 0;
  const {
    clearAuthError,
    continueAsGuest,
    errorMessage,
    finishLogin,
    setAuthError,
    setStatus,
  } = useAuthStore();
  const { profile } = useUserProfileStore();

  const handleProviderLogin = async (provider: AuthProvider) => {
    if (socialLoginMutation.isPending || !isSocialLoginEnabled) {
      return;
    }

    setSelectedProvider(provider);
    setStatus('checking');
    clearAuthError();

    try {
      const providerAccessToken = createDevProviderAccessToken(provider);
      const request = providerAccessToken
        ? {
            device: createAuthDeviceInfo(),
            provider,
            providerAccessToken,
            redirectUri: 'soundlog://auth/callback',
          }
        : await createNativeSocialLoginRequest(provider);
      const session = await socialLoginMutation.mutateAsync(request);

      finishLogin(session);
      router.replace(getNextRoute(profile.completedOnboarding));
    } catch (error) {
      setStatus('unauthenticated');
      setAuthError(getNativeSocialLoginErrorMessage(error));
    }
  };

  const handleGuestPress = () => {
    clearAuthError();
    continueAsGuest();
    router.replace(getNextRoute(profile.completedOnboarding));
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'space-between',
          padding: 24,
          paddingBottom: 42,
          paddingTop: 42,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <View className="flex-row items-center justify-between">
            <BrandLogo className="border border-white/20" size={58} />
            <View className="rounded-full border border-[#1DB954]/25 bg-[#1DB954]/10 px-4 py-2">
              <AppText className="text-xs font-semibold text-[#7CFF8A]">
                Account beta
              </AppText>
            </View>
          </View>

          <AppText className="mt-10 text-[34px] font-semibold leading-[42px] text-white">
            여행의 사운드를{'\n'}내 계정에 저장해요
          </AppText>
          <AppText className="mt-4 text-sm leading-6 text-white/58">
            로그인하면 취향, 좋아요, 순간 기록, Recap을 서버에 동기화할 수 있어요.
            바로 둘러보기도 계속 지원합니다.
          </AppText>

          <LinearGradient
            colors={[
              'rgba(29,185,84,0.28)',
              'rgba(39,211,255,0.14)',
              'rgba(255,79,216,0.16)',
            ]}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={{ borderRadius: 28, marginTop: 30, padding: 1 }}
          >
            <View className="rounded-[27px] bg-[#070A0F] p-5">
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
                  <Feather color="#fff" name="cloud" size={18} />
                </View>
                <View className="min-w-0 flex-1">
                  <AppText className="text-base font-semibold text-white">
                    계정으로 이어지는 기록
                  </AppText>
                  <AppText className="mt-1 text-xs leading-5 text-white/48">
                    {isDevAuthFallbackEnabled
                      ? '로그인하면 취향, 좋아요, 순간 기록을 계정에 안전하게 이어둘 수 있어요.'
                      : 'Apple 또는 Kakao 계정으로 로그인해 Soundlog 기록을 여러 기기에서 이어보세요.'}
                  </AppText>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View className="mt-10 gap-3">
          {canRenderProviderButtons ? (
            visibleProviderOptions.map((provider) => {
              const isPending =
                socialLoginMutation.isPending && selectedProvider === provider.id;

              return (
                <Pressable
                  key={provider.id}
                  accessibilityRole="button"
                  className={`min-h-[58px] flex-row items-center rounded-[18px] border px-5 ${
                    isPending
                      ? 'border-[#1DB954]/50 bg-[#1DB954]/15'
                      : 'border-white/10 bg-white/10'
                  }`}
                  disabled={socialLoginMutation.isPending}
                  onPress={() => handleProviderLogin(provider.id)}
                >
                  <View
                    className="h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${provider.accent}22` }}
                  >
                    <Feather color={provider.accent} name={provider.icon} size={18} />
                  </View>
                  <View className="ml-3 min-w-0 flex-1">
                    <AppText className="text-base font-semibold text-white">
                      {isPending ? '연결 중...' : provider.label}
                    </AppText>
                    <AppText className="mt-1 text-xs leading-5 text-white/45">
                      {provider.description}
                    </AppText>
                  </View>
                </Pressable>
              );
            })
          ) : (
            <View className="rounded-[18px] border border-white/10 bg-white/10 px-5 py-4">
              <View className="flex-row items-start gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
                  <Feather color="#7CFF8A" name="shield" size={18} />
                </View>
                <View className="min-w-0 flex-1">
                  <AppText className="text-base font-semibold text-white">
                    계정 로그인 준비 중
                  </AppText>
                  <AppText className="mt-1 text-xs leading-5 text-white/45">
                    {isSocialLoginEnabled
                      ? '현재 빌드에서는 iOS Apple/Kakao 로그인만 사용할 수 있어요. 다른 환경에서는 둘러보기를 이용해주세요.'
                      : '지금은 로그인 없이 둘러보기로 여행 추천과 기록 흐름을 먼저 사용할 수 있어요.'}
                  </AppText>
                </View>
              </View>
            </View>
          )}

          {errorMessage ? (
            <View className="rounded-[16px] border border-[#FF6B6B]/30 bg-[#2A1215] px-4 py-3">
              <AppText className="text-xs leading-5 text-[#FFB3B3]">
                {errorMessage}
              </AppText>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            className="mt-2 min-h-[54px] items-center justify-center rounded-[18px] border border-white/10 bg-transparent px-5"
            disabled={socialLoginMutation.isPending}
            onPress={handleGuestPress}
          >
            <AppText className="text-sm font-semibold text-white/72">
              로그인 없이 둘러보기
            </AppText>
          </Pressable>

          <View className="mt-3 items-center">
            <AppText className="text-center text-[11px] leading-5 text-white/35">
              계속 진행하면 Soundlog 정책에 동의한 것으로 간주됩니다.
            </AppText>
            <View className="mt-2 flex-row items-center justify-center gap-3">
              <Pressable
                accessibilityRole="link"
                onPress={() => router.push('/legal/terms' as never)}
              >
                <AppText className="text-[11px] font-semibold text-white/62">
                  이용약관
                </AppText>
              </Pressable>
              <AppText className="text-[11px] text-white/20">|</AppText>
              <Pressable
                accessibilityRole="link"
                onPress={() => router.push('/legal/privacy' as never)}
              >
                <AppText className="text-[11px] font-semibold text-white/62">
                  개인정보 처리방침
                </AppText>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
