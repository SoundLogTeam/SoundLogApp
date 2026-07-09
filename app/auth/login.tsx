import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { useLoginMutation, useRegisterMutation } from '@/api/authQueries';
import { AppText } from '@/components/AppText';
import { BrandLogo } from '@/components/BrandLogo';
import { Screen } from '@/components/Screen';
import { useAuthStore } from '@/store/authStore';
import { useUserProfileStore } from '@/store/userProfileStore';
import { migrateLocalDataToAccount } from '@/utils/localDataMigration';

type AuthMode = 'login' | 'register';

function getNextRoute(completedOnboarding: boolean) {
  return (completedOnboarding ? '/' : '/onboarding') as never;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return '로그인에 실패했어요. 잠시 후 다시 시도해주세요.';
}

export default function LoginScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();
  const isPending = loginMutation.isPending || registerMutation.isPending;
  const {
    clearAuthError,
    errorMessage,
    finishLogin,
    setAuthError,
    setStatus,
  } = useAuthStore();
  const { profile, updateProfile } = useUserProfileStore();

  const handleModePress = (nextMode: AuthMode) => {
    setMode(nextMode);
    clearAuthError();
  };

  const handleSubmit = async () => {
    if (isPending) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedDisplayName = displayName.trim();

    if (!normalizedEmail.includes('@')) {
      setAuthError('이메일을 확인해주세요.');
      return;
    }

    if (password.length < 8) {
      setAuthError('비밀번호는 8자 이상이어야 해요.');
      return;
    }

    setStatus('checking');
    clearAuthError();

    try {
      const session =
        mode === 'login'
          ? await loginMutation.mutateAsync({
              email: normalizedEmail,
              password,
            })
          : await registerMutation.mutateAsync({
              displayName: trimmedDisplayName || undefined,
              email: normalizedEmail,
              password,
            });

      const didCompleteOnboarding =
        profile.completedOnboarding || Boolean(session.profile?.completedOnboarding);

      if (!profile.completedOnboarding && session.profile?.completedOnboarding) {
        updateProfile(session.profile);
      }

      finishLogin(session);
      void migrateLocalDataToAccount();
      router.replace(getNextRoute(didCompleteOnboarding));
    } catch (error) {
      setStatus('unauthenticated');
      setAuthError(getErrorMessage(error));
    }
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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View>
          <View className="flex-row items-center justify-between">
            <BrandLogo className="border border-white/20" size={58} />
            <View className="rounded-full border border-[#1DB954]/25 bg-[#1DB954]/10 px-4 py-2">
              <AppText className="text-xs font-semibold text-[#7CFF8A]">
                Soundlog account
              </AppText>
            </View>
          </View>

          <AppText className="mt-10 text-[34px] font-semibold leading-[42px] text-white">
            여행의 사운드를{'\n'}내 계정에 저장해요
          </AppText>
          <AppText className="mt-4 text-sm leading-6 text-white/58">
            이메일 계정으로 취향, 좋아요, 순간 기록, Recap을 서버에 동기화할 수
            있어요. Soundlog 이용은 로그인 후 시작할 수 있습니다.
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
                  <Feather color="#fff" name="lock" size={18} />
                </View>
                <View className="min-w-0 flex-1">
                  <AppText className="text-base font-semibold text-white">
                    Soundlog 자체 계정
                  </AppText>
                  <AppText className="mt-1 text-xs leading-5 text-white/48">
                    외부 계정 연결 없이 이메일과 비밀번호로 기록을 이어둘 수 있어요.
                  </AppText>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View className="mt-10 gap-3">
          <View className="flex-row rounded-[18px] border border-white/10 bg-white/10 p-1">
            {(['login', 'register'] as const).map((item) => {
              const isActive = mode === item;

              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  className={`min-h-11 flex-1 items-center justify-center rounded-[14px] ${
                    isActive ? 'bg-[#1DB954]' : 'bg-transparent'
                  }`}
                  disabled={isPending}
                  onPress={() => handleModePress(item)}
                >
                  <AppText
                    className={`text-sm font-semibold ${
                      isActive ? 'text-[#05110A]' : 'text-white/62'
                    }`}
                  >
                    {item === 'login' ? '로그인' : '가입'}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          {mode === 'register' ? (
            <TextInput
              autoCapitalize="words"
              className="min-h-[54px] rounded-[18px] border border-white/10 bg-white/10 px-5 text-base text-white"
              editable={!isPending}
              onChangeText={setDisplayName}
              placeholder="이름"
              placeholderTextColor="rgba(255,255,255,0.35)"
              returnKeyType="next"
              value={displayName}
            />
          ) : null}

          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            className="min-h-[54px] rounded-[18px] border border-white/10 bg-white/10 px-5 text-base text-white"
            editable={!isPending}
            inputMode="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="이메일"
            placeholderTextColor="rgba(255,255,255,0.35)"
            returnKeyType="next"
            textContentType="emailAddress"
            value={email}
          />

          <TextInput
            autoCapitalize="none"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className="min-h-[54px] rounded-[18px] border border-white/10 bg-white/10 px-5 text-base text-white"
            editable={!isPending}
            onChangeText={setPassword}
            onSubmitEditing={() => {
              void handleSubmit();
            }}
            placeholder="비밀번호"
            placeholderTextColor="rgba(255,255,255,0.35)"
            returnKeyType="done"
            secureTextEntry
            textContentType={mode === 'login' ? 'password' : 'newPassword'}
            value={password}
          />

          {errorMessage ? (
            <View className="rounded-[16px] border border-[#FF6B6B]/30 bg-[#2A1215] px-4 py-3">
              <AppText className="text-xs leading-5 text-[#FFB3B3]">
                {errorMessage}
              </AppText>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            className="min-h-[56px] items-center justify-center rounded-[18px] bg-[#1DB954] px-5"
            disabled={isPending}
            onPress={() => {
              void handleSubmit();
            }}
          >
            <AppText className="text-sm font-semibold text-[#05110A]">
              {isPending
                ? '처리 중...'
                : mode === 'login'
                  ? '로그인'
                  : '계정 만들기'}
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
