import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';

import {
  canUseDevSocialLoginFallback,
  createDevProviderAccessToken,
} from '@/api/authConfig';
import { useSocialLoginMutation } from '@/api/authQueries';
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
    description: 'iOS 배포 전 필수 제공자로 준비해요.',
    icon: 'smartphone',
    id: 'apple',
    label: 'Apple로 계속하기',
  },
  {
    accent: '#8AB4F8',
    description: 'Expo AuthSession 연동 검증이 쉬운 기본 제공자예요.',
    icon: 'search',
    id: 'google',
    label: 'Google로 계속하기',
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
    if (socialLoginMutation.isPending) {
      return;
    }

    setSelectedProvider(provider);
    setStatus('checking');
    clearAuthError();

    try {
      const providerAccessToken = createDevProviderAccessToken(provider);

      if (!providerAccessToken) {
        throw new Error('social_login_not_configured');
      }

      const session = await socialLoginMutation.mutateAsync({
        device: {
          appVersion: '1.0.0',
          deviceId: `mock-${Platform.OS}-device`,
          platform:
            Platform.OS === 'ios'
              ? 'ios'
              : Platform.OS === 'android'
                ? 'android'
                : 'web',
        },
        provider,
        providerAccessToken,
        redirectUri: 'soundlog://auth/callback',
      });

      finishLogin(session);
      router.replace(getNextRoute(profile.completedOnboarding));
    } catch {
      setStatus('unauthenticated');
      setAuthError('로그인에 실패했어요. 잠시 후 다시 시도해주세요.');
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
                      ? '개발 빌드에서는 mock 로그인으로 플로우를 검증하고, 실제 배포 전 OAuth provider를 연결해요.'
                      : '실제 배포 빌드에서는 OAuth provider 설정 후 로그인할 수 있어요.'}
                  </AppText>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View className="mt-10 gap-3">
          {providerOptions.map((provider) => {
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
          })}

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

          <AppText className="mt-3 text-center text-[11px] leading-5 text-white/35">
            계속 진행하면 Soundlog 서비스 이용약관과 개인정보 처리방침에 동의한 것으로
            간주됩니다.
          </AppText>
        </View>
      </ScrollView>
    </Screen>
  );
}
